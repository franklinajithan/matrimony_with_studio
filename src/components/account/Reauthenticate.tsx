'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Password or email OTP also works for Google-only and linked accounts. */
export function Reauthenticate({ onVerified }: { onVerified: () => void }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function verify(mode: 'password' | 'send' | 'otp') {
    setBusy(true); setError('');
    try {
      const current = await supabase.auth.getUser();
      const user = current.data.user;
      if (!user?.email) throw new Error('Please sign in again.');
      const result = mode === 'send'
        ? await supabase.auth.signInWithOtp({ email: user.email, options: { shouldCreateUser: false } })
        : mode === 'otp'
          ? await supabase.auth.verifyOtp({ email: user.email, token: code.trim(), type: 'email' })
          : await supabase.auth.signInWithPassword({ email: user.email, password });
      if (result.error) throw new Error(result.error.message);
      if (mode === 'send') setSent(true);
      else {
        if (!('user' in result.data) || result.data.user?.id !== user.id) throw new Error('Identity changed. Reload and try again.');
        setPassword(''); setCode(''); onVerified();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Verification failed'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 rounded-xl border p-4">
    <p className="font-medium">Verify your identity</p>
    <label className="block text-sm" htmlFor="account-current-password">Current password</label>
    <Input id="account-current-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
    <Button type="button" variant="outline" onClick={() => verify('password')} disabled={busy || !password}>Verify password</Button>
    <p className="text-sm text-muted-foreground">Google account or no password? Verify using a code sent to your account email.</p>
    <Button type="button" variant="outline" onClick={() => verify('send')} disabled={busy}>Send email verification code</Button>
    {sent && <><label className="block text-sm" htmlFor="account-email-code">Email verification code</label><Input id="account-email-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} disabled={busy} /><Button type="button" onClick={() => verify('otp')} disabled={busy || !code.trim()}>Verify code</Button></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
