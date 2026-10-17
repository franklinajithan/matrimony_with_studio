"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workspace } from "@/components/planning/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
type State = {
  deactivated_at?: string | null;
  deletion_requested_at?: string | null;
  notification_preferences: Record<string, boolean>;
};
export function AccountControls() {
  const [data, setData] = useState<State | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [password, setPassword] = useState(""),
    [currentPassword, setCurrentPassword] = useState("");
  const load = useCallback(
    async () => setData(await workspace<State>("account")),
    [],
  );
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function act(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await workspace(action, payload);
      if (action === "export") {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(result, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "cupidmatch-account-export.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice("Your export has downloaded. Store it securely.");
      } else {
        await load();
        setNotice("Account settings updated.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (password.length < 12) throw new Error("Use at least 12 characters.");
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email)
        throw new Error("Sign in again to change your password.");
      const result = await supabase.auth.signInWithPassword({
        email: data.user.email,
        password: currentPassword,
      });
      if (result.error)
        throw new Error(
          "Current password was not accepted. Use password recovery if needed.",
        );
      const update = await supabase.auth.updateUser({ password });
      if (update.error) throw update.error;
      setCurrentPassword("");
      setPassword("");
      setNotice("Password changed.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account, notifications and data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p role="alert" className="text-destructive">
            {error}{" "}
            <Button
              variant="outline"
              onClick={() => void load().catch((e) => setError(e.message))}
            >
              Retry settings
            </Button>
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!data && !error && <p>Loading settings…</p>}
        {data && (
          <>
            <fieldset className="space-y-2">
              <legend className="mb-2 font-semibold">
                Notification preferences
              </legend>
              {["email", "interests", "messages", "support"].map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={!!data.notification_preferences[key]}
                    onChange={(e) =>
                      void act("preferences", { [key]: e.target.checked })
                    }
                  />
                  {key === "email"
                    ? "Optional email notifications"
                    : `Email about ${key}`}
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                Security and account recovery messages are essential. Optional
                email delivery requires a configured email provider.
              </p>
            </fieldset>
            <form className="space-y-3 border-t pt-4" onSubmit={changePassword}>
              <h3 className="font-semibold">Change password</h3>
              <label className="block text-sm">
                Current password
                <Input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                New password
                <Input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button disabled={busy} type="submit">
                Update password
              </Button>
              <p className="text-xs">
                <a className="underline" href="/forgot-password">
                  Forgot your password?
                </a>
              </p>
            </form>
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Your data</h3>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void act("export")}
              >
                Download account data
              </Button>
              <p className="text-xs text-muted-foreground">
                The export includes your profile, sent messages, biodata
                documents, share links, private plans, circle invitations and
                support history. Uploaded file binaries and restricted
                safety/staff records are excluded.
              </p>
            </section>
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Pause your account</h3>
              <p className="text-sm text-muted-foreground">
                Pausing hides your profile and prevents matching, messaging,
                calling and shared-plan access. Your data remains saved. You can
                return here to reactivate.
              </p>
              <Button
                variant="outline"
                disabled={busy || !!data.deletion_requested_at}
                onClick={() =>
                  void act(data.deactivated_at ? "reactivate" : "deactivate")
                }
              >
                {data.deactivated_at ? "Reactivate account" : "Pause account"}
              </Button>
            </section>
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Request account deletion</h3>
              {data.deletion_requested_at ? (
                <>
                  <p className="text-sm">
                    Deletion requested on{" "}
                    {new Date(data.deletion_requested_at).toLocaleDateString()}.
                    Your account is hidden pending authorised processing. This
                    request has not yet erased your data.
                  </p>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void act("cancel_deletion")}
                  >
                    Cancel deletion request
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    This immediately pauses your account and queues a deletion
                    request. Support must process data removal and any
                    applicable retention obligations. You will not be told that
                    data is erased before processing finishes.
                  </p>
                  <label className="block text-sm">
                    Type DELETE to confirm
                    <Input
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <Button
                    variant="destructive"
                    disabled={busy || confirmation !== "DELETE"}
                    onClick={() =>
                      void act("request_deletion", { confirmation })
                    }
                  >
                    Request deletion
                  </Button>
                </>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
