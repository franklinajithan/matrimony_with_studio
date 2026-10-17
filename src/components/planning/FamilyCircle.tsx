"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspace, FuturePlan } from "./client";
import { PlanSummary } from "./PlanSummary";
type Permissions = { viewPlan: boolean; suggest: boolean; comment: boolean };
type Invite = {
  id: string;
  member_id: string;
  name: string;
  invited_email: string | null;
  relationship: string;
  permissions: Permissions;
  status: string;
  expires_at: string;
  owner: boolean;
  plan: FuturePlan | null;
};
type Data = { invitations: Invite[]; canInvite: boolean };
type Activity = {
  id: string;
  kind: string;
  body: string;
  target_id: string | null;
  created_at: string;
};
const permissionLabels = {
  viewPlan: "View my saved Future Map",
  suggest: "Suggest profiles",
  comment: "Leave private comments",
};
export function FamilyCircle() {
  const [data, setData] = useState<Data | null>(null),
    [email, setEmail] = useState(""),
    [relationship, setRelationship] = useState("parent"),
    [permissions, setPermissions] = useState<Permissions>({
      viewPlan: false,
      suggest: false,
      comment: false,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [active, setActive] = useState<string | null>(null),
    [activity, setActivity] = useState<Activity[]>([]),
    [body, setBody] = useState(""),
    [kind, setKind] = useState("comment"),
    [target, setTarget] = useState("");
  const load = useCallback(
    async () => setData(await workspace<Data>("family_list")),
    [],
  );
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function thread(id: string) {
    setActive(id);
    setActivity([]);
    setError("");
    try {
      setActivity(
        (await workspace<{ activity: Activity[] }>("family_activity", { id }))
          .activity,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await workspace(action, payload);
      await load();
      if (action === "family_post") {
        setBody("");
        setTarget("");
        if (active) await thread(active);
      }
      if (action === "family_revoke") setActive(null);
      if (action === "family_invite") setEmail("");
      setNotice("Saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const current = data?.invitations.find((i) => i.id === active);
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-3xl font-bold">Family Circle</h1>
        <p className="mt-2 text-muted-foreground">
          Invite a trusted person to help with your journey. You control each
          permission and can revoke access at any time.
        </p>
      </header>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        Helpers use their own confirmed CupidMatch account. They cannot message
        as you, accept interests for you, or access private profiles through
        your account. Invitations appear here when they sign in with the invited
        email. No email is automatically sent.
      </div>
      {error && (
        <p role="alert" className="rounded border border-destructive p-3">
          {error}{" "}
          <Button
            variant="outline"
            onClick={() => void load().catch((e) => setError(e.message))}
          >
            Retry
          </Button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading invitations…</p>}
      {data && (
        <>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-xl font-semibold">Invite someone you trust</h2>
            {!data.canInvite ? (
              <p className="mt-3 text-sm">
                An active Premium plan or launch trial is required to invite
                helpers.{" "}
                <Link className="underline" href="/pricing">
                  See membership options
                </Link>
                .
              </p>
            ) : (
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("family_invite", {
                    email,
                    relationship,
                    permissions,
                  });
                }}
              >
                <label className="block text-sm">
                  Their account email
                  <Input
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Relationship
                  <select
                    className="block w-full rounded border bg-background p-2"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    {["parent", "sibling", "friend", "advisor"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="space-y-2">
                  <legend className="mb-2 font-medium">Allowed actions</legend>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[key as keyof Permissions]}
                        onChange={(e) =>
                          setPermissions((p) => ({
                            ...p,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <Button disabled={busy} type="submit">
                  {busy ? "Saving…" : "Create invitation"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Up to five active invitations. Pending invitations expire
                  after seven days. Tell your helper to open Family Circle after
                  signing in.
                </p>
              </form>
            )}
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Your invitations and circles
            </h2>
            {data.invitations.length === 0 && (
              <p className="text-muted-foreground">
                You have no invitations yet.
              </p>
            )}
            {data.invitations.map((i) => (
              <article className="space-y-4 rounded-xl border p-5" key={i.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {i.owner ? i.invited_email : `${i.name} invited you`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {i.relationship} · {i.status}
                      {i.status === "pending"
                        ? ` · expires ${new Date(i.expires_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  {["accepted", "pending"].includes(i.status) &&
                    (i.owner || i.status === "accepted") && (
                      <Button
                        disabled={busy}
                        variant="outline"
                        onClick={() => void act("family_revoke", { id: i.id })}
                      >
                        {i.owner ? "Revoke" : "Leave circle"}
                      </Button>
                    )}
                </div>
                {i.owner && ["accepted", "pending"].includes(i.status) ? (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      Update permissions
                    </legend>
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <label
                        className="flex items-center gap-2 text-sm"
                        key={key}
                      >
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={!!i.permissions[key as keyof Permissions]}
                          onChange={(e) =>
                            void act("family_permissions", {
                              id: i.id,
                              permissions: {
                                ...i.permissions,
                                [key]: e.target.checked,
                              },
                            })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <p className="text-sm">
                    Allowed:{" "}
                    {Object.entries(permissionLabels)
                      .filter(
                        ([key]) => i.permissions[key as keyof Permissions],
                      )
                      .map(([, label]) => label)
                      .join(", ") || "No optional permissions granted"}
                  </p>
                )}
                {!i.owner && i.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void act("family_respond", {
                          id: i.id,
                          response: "accepted",
                        })
                      }
                    >
                      Accept invitation
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void act("family_respond", {
                          id: i.id,
                          response: "declined",
                        })
                      }
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {i.plan && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Shared Future Map</h4>
                    <PlanSummary plan={i.plan} />
                  </div>
                )}
                {i.status === "accepted" && (
                  <Button variant="outline" onClick={() => void thread(i.id)}>
                    Open private activity
                  </Button>
                )}
              </article>
            ))}
          </section>
          {current && (
            <section className="space-y-4 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">Private activity</h2>
              <p className="text-sm text-muted-foreground">
                Visible only to this member and helper. A suggestion never sends
                an interest.
              </p>
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="rounded bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {a.kind} · {new Date(a.created_at).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {a.body}
                    </p>
                    {a.target_id && (
                      <Link
                        className="text-sm underline"
                        href={`/profile/${a.target_id}`}
                      >
                        View suggested member
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetId = target
                    .trim()
                    .split("/")
                    .filter(Boolean)
                    .pop();
                  void act("family_post", {
                    id: current.id,
                    kind,
                    body,
                    ...(kind === "suggestion" ? { targetId } : {}),
                  });
                }}
              >
                <label className="block text-sm">
                  Contribution
                  <select
                    className="block w-full rounded border bg-background p-2"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="comment">Private comment</option>
                    <option value="suggestion">Profile suggestion</option>
                  </select>
                </label>
                {kind === "suggestion" && (
                  <label className="block text-sm">
                    CupidMatch profile link or member ID
                    <Input
                      required
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="Paste a profile link"
                    />
                  </label>
                )}
                <label className="block text-sm">
                  Message
                  <Textarea
                    required
                    maxLength={2000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                <Button
                  disabled={
                    busy ||
                    (!current.owner &&
                      !current.permissions[
                        kind === "comment" ? "comment" : "suggest"
                      ])
                  }
                  type="submit"
                >
                  Add {kind}
                </Button>
              </form>
            </section>
          )}
        </>
      )}
    </main>
  );
}
