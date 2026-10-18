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
  return <section className="rounded-3xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">CupidMatch</p>
    <h1 className="mt-3 text-2xl font-semibold text-[#30123f]">Registrations temporarily paused</h1>
    <p role="status" className="mt-4 break-words text-sm leading-6 text-slate-600">{message}</p>
    <p className="mt-5 text-sm text-slate-600">Already a member? You can still log in.</p>
    <Link href="/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-700 px-6 text-sm font-semibold text-white hover:bg-violet-800">Member login</Link>
    <Link href="/" className="mt-4 block text-sm font-medium text-violet-700">Back to home</Link>
  </section>;
}
