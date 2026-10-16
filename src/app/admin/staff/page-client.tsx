"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import {
  WorkspaceHeading,
  ResourceState,
} from "@/components/admin/workspace-ui";
type Person = { id: string; display_name: string; email: string };
type Staff = {
  user_id: string;
  role: string;
  created_at: string;
  member: Person;
};
export default function StaffPage() {
  const { data, error, loading, refresh } = useAdminResource<{
    staff: Staff[];
    administrators: Person[];
  }>("/api/admin/staff");
  const [memberId, setMemberId] = useState(""),
    [role, setRole] = useState("support"),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await adminMutation("/api/admin/staff", { memberId, role, reason });
      setMessage("Staff access updated.");
      setReason("");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Staff access"
        description="Delegate the work each team member needs. Full administrators retain control of billing, staff and security."
        refresh={() => void refresh()}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Super Admin", "Full administration, billing and staff access."],
          [
            "Support",
            "Member profiles, private notes, connections and member notifications.",
          ],
          [
            "Moderator",
            "Member reports, suspension, profile reviews and content moderation.",
          ],
        ].map(([title, detail]) => (
          <section key={title} className="rounded-2xl border bg-white p-5">
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{detail}</p>
          </section>
        ))}
      </div>
      <form
        onSubmit={save}
        className="space-y-4 rounded-2xl border bg-white p-5"
      >
        <h2 className="text-lg font-bold">Change delegated access</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            Member ID
            <Input
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Copy the member UUID from Members"
            />
          </label>
          <label className="space-y-2 text-sm">
            Role
            <select
              className="h-10 w-full rounded-md border bg-white px-3"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="support">Support</option>
              <option value="moderator">Moderator</option>
              <option value="none">Remove staff access</option>
            </select>
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          Reason
          <Textarea
            required
            minLength={10}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <p className="text-xs text-slate-500">
          Existing Super Admin accounts are protected here. Changes take effect
          on the next request.
        </p>
        <Button disabled={busy}>{busy ? "Saving…" : "Save access"}</Button>
        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.staff.length && !data?.administrators.length}
      />
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.administrators.map((p) => (
            <article key={p.id} className="rounded-2xl border bg-white p-5">
              <p className="font-bold">{p.display_name || p.email}</p>
              <p className="mt-2 text-sm text-violet-700">Super Admin</p>
              <p className="mt-1 break-all text-xs text-slate-500">{p.email}</p>
            </article>
          ))}
          {data?.staff.map((s) => (
            <article
              key={s.user_id}
              className="rounded-2xl border bg-white p-5"
            >
              <p className="font-bold">{s.member?.display_name || "Member"}</p>
              <p className="mt-2 text-sm capitalize text-violet-700">
                {s.role}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {s.member?.email}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setMemberId(s.user_id);
                  setRole(s.role);
                  setReason("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Change access
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
