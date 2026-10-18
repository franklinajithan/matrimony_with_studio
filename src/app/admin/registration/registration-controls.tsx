'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { RegistrationStatus } from '@/lib/registration/status';
export default function RegistrationControls() {
  const [saved, setSaved] = useState<RegistrationStatus | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/registration', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load settings.');
      setSaved(result); setEnabled(result.enabled); setMessage(result.message);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load settings.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!saved) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/registration', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, message, version: saved.version }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save settings.');
      setSaved(result); setEnabled(result.enabled); setMessage(result.message);
      setNotice(result.enabled ? 'Registration is open. New members can join.' : 'Registration is paused. Existing members can still log in.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save settings.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-busy={busy}>
    <div className="flex items-center justify-between gap-4"><div><label htmlFor="registration-enabled" className="font-semibold">Allow new registrations</label><p className="mt-1 text-sm text-slate-500">Current status: {saved ? (saved.enabled ? 'Open' : 'Paused') : 'Loading…'}</p></div><Switch id="registration-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={busy || !saved} /></div>
    <div><label htmlFor="registration-message" className="text-sm font-semibold">Message shown while paused</label><textarea id="registration-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={300} required disabled={busy || !saved} rows={4} className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" /><p className="mt-1 text-xs text-slate-500">Applies to email, Google and Facebook registration. Changes are recorded in the audit log.</p></div>
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !saved || !message.trim() || (saved.enabled === enabled && saved.message === message.trim())}>{busy ? 'Please wait…' : 'Save changes'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void load()}>Refresh settings</Button></div>
    {notice ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
  </form>;
}
