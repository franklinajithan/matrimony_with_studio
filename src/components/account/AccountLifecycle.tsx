'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Reauthenticate } from './Reauthenticate';
export function AccountLifecycle() {
  const [action, setAction] = useState<'delete' | 'deactivate' | 'reactivate' | null>(null);
  const [deactivated, setDeactivated] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState(0);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/account', { cache: 'no-store' }).then(r => r.json()).then(r => setDeactivated(r.deactivated === true)).catch(() => {}); }, []);
  const label = action === 'delete' ? 'Delete Account Permanently' : action === 'reactivate' ? 'Reactivate Account' : 'Deactivate Account';
  async function submit() {
    if (!action || busy) return;
    setBusy(true); setError('');
    try {
      if (Date.now() - verifiedAt > 240_000) { setVerifiedAt(0); throw new Error('Please verify your identity again.'); }
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, confirmation }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to complete request');
      if (action === 'delete') {
        // Clear this origin's member state before a full navigation (also in PWA).
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        localStorage.clear(); sessionStorage.clear();
        if ('caches' in window) await caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(() => {});
        window.location.replace('/'); return;
      }
      setDeactivated(action === 'deactivate'); setAction(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to complete request'); }
    finally { setBusy(false); }
  }
  function choose(next: typeof action) { setConfirmation(''); setVerifiedAt(0); setError(''); setAction(next); }
  return <Card id="account-management" className="border-destructive/30">
    <CardHeader><CardTitle>Account Settings</CardTitle><CardDescription>Control your membership and personal data.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      <div><h3 className="font-semibold">{deactivated ? 'Your account is deactivated' : 'Take a break'}</h3><p className="mb-3 text-sm text-muted-foreground">Deactivation hides your profile and disables new interactions. Your data stays saved. You can sign in here to reactivate; publish your profile again when ready.</p><Button type="button" variant="outline" onClick={() => choose(deactivated ? 'reactivate' : 'deactivate')}>{deactivated ? 'Reactivate Account' : 'Deactivate Account'}</Button></div>
      <div className="border-t pt-4"><h3 className="font-semibold">Permanent deletion</h3><p className="mb-3 text-sm text-muted-foreground">Erase your profile, biodata, preferences, horoscope, photos and login identities. Your messages and comments are removed; other members keep their own content. This cannot be undone. You can register again using the same email.</p><Button type="button" variant="destructive" onClick={() => choose('delete')}>Delete Account Permanently</Button><p className="mt-3 text-xs text-muted-foreground"><a href="/account-data-policy" className="underline">Read our deletion and retention policy</a>. Cancel any paid subscription before deletion.</p></div>
    </CardContent>
    <AlertDialog open={Boolean(action)} onOpenChange={open => { if (!open && !busy) setAction(null); }}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto"><AlertDialogHeader><AlertDialogTitle>{label}</AlertDialogTitle><AlertDialogDescription>{action === 'delete' ? 'This is permanent. Once confirmed, your account is locked immediately while deletion completes.' : 'Confirm this change to your profile visibility.'}</AlertDialogDescription></AlertDialogHeader>
        {!verifiedAt ? <Reauthenticate onVerified={() => setVerifiedAt(Date.now())} /> : <><label htmlFor="account-confirmation" className="text-sm">Type {action === 'delete' ? 'DELETE' : 'CONFIRM'} to confirm</label><Input id="account-confirmation" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><Button type="button" variant={action === 'delete' ? 'destructive' : 'default'} disabled={busy || !verifiedAt || confirmation !== (action === 'delete' ? 'DELETE' : 'CONFIRM')} onClick={submit}>{busy ? 'Processing…' : label}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Card>;
}
