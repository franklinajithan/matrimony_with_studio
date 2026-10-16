"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/admin/use-admin-resource";
export function ActivityPrivacy() {
  const { data, error, loading, refresh } = useAdminResource<{
    incognito: boolean;
    incognitoAllowed: boolean;
  }>("/api/members/activity-settings");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function toggle() {
    if (!data) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/members/activity-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incognito: !data.incognito }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save");
      await refresh();
      setMessage("Private browsing updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-bold">Private profile visits</h2>
      <p className="text-sm leading-6 text-slate-500">
        With Premium+, enable private browsing so future visits do not appear in
        another member’s visitor list. It does not hide messages or connection
        requests. Earlier recorded visits are unchanged.
      </p>
      {loading ? (
        <p role="status">Loading activity settings…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        data && (
          <>
            <p className="text-sm">
              {data.incognito
                ? "Private browsing is on."
                : "Private browsing is off."}
            </p>
            <Button
              variant="outline"
              disabled={busy || !data.incognitoAllowed}
              onClick={() => void toggle()}
            >
              {busy
                ? "Saving…"
                : data.incognito
                  ? "Turn off private browsing"
                  : "Enable private browsing"}
            </Button>
            {!data.incognitoAllowed && (
              <p className="text-xs text-slate-500">
                An active Premium+ membership is required.
              </p>
            )}
          </>
        )
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
