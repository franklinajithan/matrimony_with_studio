"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspace, FuturePlan, planFields } from "./client";
import { PlanSummary } from "./PlanSummary";
import { supabase } from "@/lib/supabase/client";
import { listConnections } from "@/lib/supabase/connections";
import { getProfile } from "@/lib/supabase/profiles";
type Data = {
  own: { plan: FuturePlan; version: number } | null;
  shares: { viewer_id: string; name: string }[];
  sharedWithMe: { member_id: string; name: string; plan: FuturePlan }[];
};
export function FutureMap() {
  const [data, setData] = useState<Data | null>(null),
    [plan, setPlan] = useState<FuturePlan>({}),
    [connections, setConnections] = useState<{ id: string; name: string }[]>(
      [],
    ),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const d = await workspace<Data>("plan_list");
    setData(d);
    setPlan(d.own?.plan || {});
  }, []);
  useEffect(() => {
    let alive = true;
    void load().catch((e) => {
      if (alive) setError(e.message);
    });
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const userId = data.user.id;
      const rows = await listConnections(userId);
      const result = await Promise.all(
        rows.map(async (c) => {
          const id = c.memberAId === userId ? c.memberBId : c.memberAId;
          const p = await getProfile(id);
          return { id, name: p?.displayName || "Connection" };
        }),
      );
      if (alive) setConnections(result);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [load]);
  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await workspace(action, payload);
      await load();
      setNotice("Saved. Your sharing choices take effect immediately.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const milestones = plan.milestones || [];
  const done = milestones.filter((m) => m.done).length;
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-3xl font-bold">Future Map</h1>
        <p className="mt-2 text-muted-foreground">
          Plan where and how you want to build a life together. Your plan is
          private until you explicitly share it.
        </p>
      </header>
      {error && (
        <div role="alert" className="rounded-lg border border-destructive p-4">
          {error}{" "}
          <Button
            variant="outline"
            onClick={() => {
              setError("");
              void load().catch((e) => setError(e.message));
            }}
          >
            Reload saved plan
          </Button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error ? (
        <p role="status">Loading your plan…</p>
      ) : (
        data && (
          <>
            <form
              className="space-y-5 rounded-xl border bg-card p-5"
              onSubmit={(e) => {
                e.preventDefault();
                void act("plan_save", {
                  plan,
                  version: data.own?.version || 0,
                });
              }}
            >
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">
                  {plan.currentLocation || "Your current location"} →{" "}
                  {plan.futureLocation || "Your future home"}
                </p>
                <p className="text-sm text-muted-foreground">
                  These are your own plans, not a prediction or commitment.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {planFields.map((f) => (
                  <label key={f.key} className="space-y-1 text-sm font-medium">
                    {f.label}
                    <Textarea
                      maxLength={1000}
                      value={plan[f.key] || ""}
                      placeholder={f.hint}
                      onChange={(e) =>
                        setPlan((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Milestones</h2>
                <p className="text-sm">
                  {done} of {milestones.length} completed
                </p>
                {milestones.length > 0 && (
                  <progress
                    className="w-full"
                    aria-label="Milestone progress"
                    value={done}
                    max={milestones.length}
                  />
                )}{" "}
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Complete ${m.title || "milestone"}`}
                      checked={m.done}
                      onChange={(e) =>
                        setPlan((p) => ({
                          ...p,
                          milestones: milestones.map((item, j) =>
                            j === i
                              ? { ...item, done: e.target.checked }
                              : item,
                          ),
                        }))
                      }
                    />
                    <Input
                      aria-label={`Milestone ${i + 1}`}
                      maxLength={150}
                      required
                      value={m.title}
                      onChange={(e) =>
                        setPlan((p) => ({
                          ...p,
                          milestones: milestones.map((item, j) =>
                            j === i ? { ...item, title: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setPlan((p) => ({
                          ...p,
                          milestones: milestones.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={milestones.length >= 12 || busy}
                  onClick={() =>
                    setPlan((p) => ({
                      ...p,
                      milestones: [...milestones, { title: "", done: false }],
                    }))
                  }
                >
                  Add milestone
                </Button>
              </section>
              <Button disabled={busy} type="submit">
                {busy ? "Saving…" : "Save my plan"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Save changes before sharing. Shared viewers see the latest saved
                version.
              </p>
            </form>
            <section className="space-y-3 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">Who can see your plan</h2>
              <p className="text-sm text-muted-foreground">
                Share the entire saved plan with an accepted connection.
                Blocking, disconnecting or pausing either account stops access.
                Family access is controlled separately in Family Circle.
              </p>
              <label className="block text-sm">
                Connection
                <select
                  className="mt-1 w-full rounded border bg-background p-2"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Choose a connection</option>
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                disabled={!selected || busy || !data.own}
                onClick={() => void act("plan_share", { viewerId: selected })}
              >
                Share saved plan
              </Button>
              {data.shares.length === 0 ? (
                <p className="text-sm">No connections have access.</p>
              ) : (
                data.shares.map((s) => (
                  <div key={s.viewer_id} className="flex justify-between gap-2">
                    <span>{s.name}</span>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void act("plan_unshare", { viewerId: s.viewer_id })
                      }
                    >
                      Revoke access
                    </Button>
                  </div>
                ))
              )}
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Shared with you</h2>
              {!data.sharedWithMe.length ? (
                <p className="text-muted-foreground">
                  No plans have been shared with you.
                </p>
              ) : (
                data.sharedWithMe.map((s) => (
                  <article
                    key={s.member_id}
                    className="space-y-4 rounded-xl border p-5"
                  >
                    <h3 className="font-semibold">{s.name}’s plan</h3>
                    <PlanSummary plan={s.plan} />
                  </article>
                ))
              )}
            </section>
          </>
        )
      )}
    </main>
  );
}
