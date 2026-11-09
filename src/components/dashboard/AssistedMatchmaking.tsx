"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageFrame } from "@/components/dashboard/PageHero";
import { supabase } from "@/lib/supabase/client";

type Candidate = { id: string; name: string | null; country: string | null };
type Status = "requested" | "review_ready" | "changes_requested" | "approved";
type Request = { id: string; note: string; status: Status };
type MemberRequest = Request & { shortlist: Candidate[]; sharedCount: number };
type QueueRequest = Request & { preferences: Record<string, unknown> };
type View = { available: boolean; request?: MemberRequest | null; requests?: QueueRequest[] };

const labels: Record<Status, string> = {
  requested: "Awaiting adviser review",
  review_ready: "Shortlist ready for your review",
  changes_requested: "Changes requested",
  approved: "Shortlist approved",
};

function CandidateName({ person }: { person: Candidate }) {
  return <>{[person.name || "Member", person.country].filter(Boolean).join(" · ")}</>;
}

export function AssistedMatchmaking({ adviser }: { adviser: boolean }) {
  const [view, setView] = useState<View | null>(null);
  const [note, setNote] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Candidate[]>([]);
  const [chosen, setChosen] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc("assisted_matchmaking", { p_action: adviser ? "queue" : "mine" });
    if (error) setError(adviser ? "This queue is available to authorised advisers." : "Could not load your request.");
    else setView(data);
  }, [adviser]);

  useEffect(() => { void reload(); }, [reload]);

  async function act(action: string, args: { p_request?: string; p_note?: string; p_candidates?: string[] }) {
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc("assisted_matchmaking", { p_action: action, ...args });
      if (error) {
        setError(error.code === "22023" ? error.message : error.code === "23505" ? "You already have an open request." : "This action is unavailable. Refresh and try again.");
      } else if (action === "search") {
        setFound(data ?? []);
      } else {
        setNote("");
        setSelectedRequest(null);
        setQuery("");
        setFound([]);
        setChosen([]);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }

  const current = view?.request;
  const active = view?.requests?.find(request => request.id === selectedRequest);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active) void act("search", { p_request: active.id, p_note: query });
  }

  return (
    <PageFrame>
      <h1 className="text-2xl font-semibold">{adviser ? "Assisted matchmaking queue" : "Assisted matchmaking"}</h1>
      {!adviser && <p className="text-muted-foreground">An adviser can review your preferences and prepare a shortlist. You decide whether to approve it before discussing any introductions.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!view && !error && <p role="status">Loading…</p>}
      {view && !view.available && <p className="rounded-xl border bg-card p-4">Assisted matchmaking is currently unavailable.</p>}

      {!adviser && view?.available && !current && (
        <form className="space-y-3 rounded-xl border bg-card p-4" onSubmit={event => { event.preventDefault(); void act("submit", { p_note: note }); }}>
          <label className="block space-y-2">
            <span className="font-medium">What would you like help with?</span>
            <Textarea required maxLength={1500} value={note} onChange={event => setNote(event.target.value)} />
          </label>
          <p className="text-sm text-muted-foreground">Your note and saved partner preferences will be shared with authorised advisers. Leave out private contact details.</p>
          <Button disabled={busy || !note.trim()}>Request help</Button>
        </form>
      )}
      {!adviser && current && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{labels[current.status]}</h2>
          <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{current.note}</p>
          {current.shortlist.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {current.shortlist.map(person => <li key={person.id}><Link className="underline" href={`/profile/${person.id}`}><CandidateName person={person} /></Link></li>)}
            </ul>
          )}
          {view?.available && current.status === "review_ready" && (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || current.shortlist.length !== current.sharedCount} onClick={() => void act("approve", {
                p_request: current.id, p_candidates: current.shortlist.map(person => person.id),
              })}>Approve shortlist</Button>
              <Button variant="outline" disabled={busy} onClick={() => void act("request_changes", { p_request: current.id })}>Ask for changes</Button>
              {current.shortlist.length !== current.sharedCount && <p className="text-sm text-muted-foreground">A profile became unavailable. Ask your adviser to update the shortlist.</p>}
            </div>
          )}
          <Button variant="outline" disabled={busy} onClick={() => void act("close", { p_request: current.id })}>Close my request</Button>
        </section>
      )}

      {adviser && view?.available && (
        <>
          {!view.requests?.length && <p>No open requests.</p>}
          {view.requests?.map(request => (
            <section key={request.id} className="space-y-2 rounded-xl border bg-card p-4">
              <h2 className="font-semibold">{labels[request.status]}</h2>
              <p className="whitespace-pre-wrap break-words text-sm">{request.note}</p>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Saved partner preferences</summary>
                <dl className="mt-2 space-y-1">
                  {Object.entries(request.preferences).map(([key, value]) => (
                    <div className="break-words" key={key}><dt className="inline font-medium">{key.replace(/([A-Z])/g, " $1")} </dt><dd className="inline text-muted-foreground">{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd></div>
                  ))}
                </dl>
              </details>
              <div className="flex flex-wrap gap-2">
                {(request.status === "requested" || request.status === "changes_requested") && (
                  <Button disabled={busy} onClick={() => { setSelectedRequest(request.id); setFound([]); setChosen([]); setQuery(""); }}>Prepare shortlist</Button>
                )}
                <Button variant="outline" disabled={busy} onClick={() => void act("close", { p_request: request.id })}>Close request</Button>
              </div>
              {active?.id === request.id && (
                <div className="space-y-3 border-t pt-3">
                  <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
                    <label className="space-y-2">
                      <span className="block text-sm font-medium">Find published profiles by name</span>
                      <Input maxLength={80} minLength={2} required value={query} onChange={event => setQuery(event.target.value)} />
                    </label>
                    <Button variant="outline" disabled={busy}>Search</Button>
                  </form>
                  <ul className="space-y-1">
                    {found.map(person => <li key={person.id}>
                      <Button variant="ghost" size="sm" disabled={chosen.length >= 8 || chosen.some(item => item.id === person.id)}
                        onClick={() => setChosen(current => [...current, person])}>Add <CandidateName person={person} /></Button>
                    </li>)}
                  </ul>
                  <p className="text-sm font-medium">Selected profiles ({chosen.length}/8)</p>
                  <ul className="space-y-1">
                    {chosen.map(person => <li key={person.id}>
                      <Button variant="ghost" size="sm" onClick={() => setChosen(current => current.filter(item => item.id !== person.id))}>Remove <CandidateName person={person} /></Button>
                    </li>)}
                  </ul>
                  <Button disabled={busy || !chosen.length} onClick={() => void act("curate", {
                    p_request: request.id, p_candidates: chosen.map(person => person.id),
                  })}>Share shortlist for member review</Button>
                </div>
              )}
            </section>
          ))}
        </>
      )}
    </PageFrame>
  );
}
