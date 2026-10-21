import Link from 'next/link';
import SignupForm from './signup-form';
import { getRegistrationStatus } from '@/lib/registration/server';
import { REGISTRATION_PAUSED_MESSAGE } from '@/lib/registration/status';
export const dynamic = 'force-dynamic';
export default async function SignupPage() {
  let message = REGISTRATION_PAUSED_MESSAGE;
  try {
    const status = await getRegistrationStatus();
    if (status.enabled) return <SignupForm />;
    message = status.message;
  } catch { message = 'Registration is temporarily unavailable. Please try again later.'; }
  return <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">CupidMatch</p>
    <h1 className="mt-3 text-2xl font-semibold text-primary-dark">Registrations temporarily paused</h1>
    <p role="status" className="mt-4 break-words text-sm leading-6 text-muted-foreground">{message}</p>
    <p className="mt-5 text-sm text-muted-foreground">Already a member? You can still log in.</p>
    <Link href="/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark">Member login</Link>
    <Link href="/" className="mt-4 block text-sm font-medium text-primary">Back to home</Link>
  </section>;
}
