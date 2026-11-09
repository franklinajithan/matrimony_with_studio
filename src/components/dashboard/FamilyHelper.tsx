"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageFrame } from "@/components/dashboard/PageHero";
import { supabase } from "@/lib/supabase/client";

type Summary = { name: string | null; age: number | null; country: string | null };
type Invite = { id: string; email: string; expiresAt: string };
type Preview = { biodata: Summary; shortlist: (Summary & { id: string })[]; invites: Invite[] };
type Shared = { biodata: Summary | null; shortlist: Summary[]; expiresAt: string };

function Details({ person }: { person: Summary }) {
  return <span className="break-words">{[person.name || "Member", person.age, person.country].filter(Boolean).join(" · ")}</span>;
}

function expiry(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function FamilyHelperInvites() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [biodata, setBiodata] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ code: string; email: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.rpc("family_helper_invitation", { p_action: "preview" }).then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Family helper invitations are unavailable. Reload to try again.");
      else setPreview(data);
    });
    return () => { active = false; };
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopied(false);
    setIssued(null);
    try {
      const { data, error } = await supabase.rpc("family_helper_invitation", {
        p_action: "create", p_email: email, p_ids: selection, p_biodata: biodata,
      });
      if (error) {
        setError(error.code === "22023" ? error.message : "Could not create an invitation. Try again.");
        return;
      }
      setIssued({ ...data, email: email.trim() });
      setSelection([]);
      setBiodata(false);
      setEmail("");
      const updated = await supabase.rpc("family_helper_invitation", { p_action: "preview" });
      if (updated.error) setError("Your code was created. Reload to refresh the active invitations list.");
      else setPreview(updated.data);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invite: Invite) {
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.rpc("family_helper_invitation", { p_action: "revoke", p_invite: invite.id });
      if (error) setError("Could not revoke the invitation. Try again.");
      else {
        setPreview(current => current && { ...current, invites: current.invites.filter(item => item.id !== invite.id) });
        setIssued(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
    } catch {
      setError("Select and copy the invitation code manually.");
    }
  }

  return (
    <PageFrame>
      <h1 className="text-2xl font-semibold">Invite a family helper</h1>
      <p className="text-muted-foreground">Choose what a trusted relative can see. Their verified CupidMatch email must match the invitation. Access expires in seven days and you can revoke it at any time.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!preview && !error && <p role="status">Loading your sharing options…</p>}
      {preview && (
        <>
          <form onSubmit={create} className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
            <fieldset className="space-y-2">
              <legend className="mb-2 font-semibold">Preview what you will share</legend>
              <label className="flex items-start gap-3">
                <input className="mt-1" type="checkbox" checked={biodata} onChange={event => setBiodata(event.target.checked)} />
                <span>My biodata summary <span className="block text-sm text-muted-foreground"><Details person={preview.biodata} /></span></span>
              </label>
              <h2 className="pt-2 text-sm font-semibold">Selected shortlist profiles ({selection.length}/20)</h2>
              {preview.shortlist.length === 0 && <p className="text-sm text-muted-foreground">Your eligible shortlist profiles will appear here. <Link className="underline" href="/discover">Find matches</Link></p>}
              {preview.shortlist.map(person => (
                <label className="flex min-h-9 items-center gap-3" key={person.id}>
                  <input type="checkbox" checked={selection.includes(person.id)}
                    disabled={selection.length >= 20 && !selection.includes(person.id)}
                    onChange={event => setSelection(current => event.target.checked ? [...current, person.id] : current.filter(id => id !== person.id))} />
                  <Details person={person} />
                </label>
              ))}
            </fieldset>
            <p className="text-sm text-muted-foreground">Shared details include name, age and country. The helper has read-only access. Messages, contact information, photos and account settings are excluded.</p>
            <label className="block max-w-md space-y-2">
              <span className="block text-sm font-medium">Relative’s CupidMatch email</span>
              <Input type="email" autoComplete="off" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            <Button disabled={busy || (!biodata && !selection.length)}>Create invitation</Button>
          </form>
          {issued && (
            <section className="space-y-2 rounded-2xl border bg-card p-4" aria-labelledby="issued-heading">
              <h2 id="issued-heading" className="font-semibold">Invitation ready</h2>
              <p className="text-sm">Send the code privately to {issued.email}. They can enter it on the <Link href="/family-helper" className="underline">family helper access page</Link>.</p>
              <Input readOnly aria-label="Invitation code" value={issued.code} />
              <p className="text-sm text-muted-foreground">Expires {expiry(issued.expiresAt)}. Copy the code before leaving this page.</p>
              <Button type="button" variant="outline" onClick={copyCode}>{copied ? "Code copied" : "Copy code"}</Button>
            </section>
          )}
          <section aria-labelledby="active-heading" className="space-y-2 rounded-2xl border bg-card p-4">
            <h2 id="active-heading" className="font-semibold">Active invitations</h2>
            {!preview.invites.length && <p className="text-sm text-muted-foreground">You have no active invitations.</p>}
            {preview.invites.map(invite => (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2" key={invite.id}>
                <p className="min-w-0 break-all text-sm">{invite.email} <span className="text-muted-foreground">· Expires {expiry(invite.expiresAt)}</span></p>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => void revoke(invite)}>Revoke</Button>
              </div>
            ))}
          </section>
        </>
      )}
    </PageFrame>
  );
}

export function FamilyHelperAccess() {
  const [code, setCode] = useState("");
  const [shared, setShared] = useState<Shared | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setShared(null);
    setError("");
    try {
      const { data, error } = await supabase.rpc("family_helper_invitation", { p_action: "open", p_code: code.trim().toLowerCase() });
      if (error || !data) setError("This invitation is unavailable. Check the code and sign in with the verified email address the member invited.");
      else {
        setShared(data);
        setCode("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame>
      <h1 className="text-2xl font-semibold">Family helper access</h1>
      <p className="text-muted-foreground">Enter the invitation code shared by your relative to view the details they selected.</p>
      <form onSubmit={open} className="max-w-lg space-y-3 rounded-2xl border bg-card p-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Invitation code</span>
          <Input value={code} autoComplete="off" required maxLength={64} onChange={event => { setCode(event.target.value); setShared(null); }} />
        </label>
        <Button disabled={busy || code.trim().length !== 64}>{busy ? "Opening…" : "Open invitation"}</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {shared && (
        <section className="space-y-3 rounded-2xl border bg-card p-4" aria-labelledby="shared-heading">
          <h2 id="shared-heading" className="font-semibold">Shared with you</h2>
          <p className="text-sm text-muted-foreground">Read-only access until {expiry(shared.expiresAt)}.</p>
          {shared.biodata && <p><strong>Biodata summary</strong> <Details person={shared.biodata} /></p>}
          {shared.shortlist.length > 0 && (
            <div><h3 className="font-medium">Shortlist</h3>
              <ul className="list-disc space-y-1 pl-5">{shared.shortlist.map((person, index) => <li key={index}><Details person={person} /></li>)}</ul>
            </div>
          )}
          {!shared.biodata && !shared.shortlist.length && <p>No shared profiles are currently available.</p>}
        </section>
      )}
    </PageFrame>
  );
}
