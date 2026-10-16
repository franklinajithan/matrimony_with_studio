import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-10">
      <section className="rounded-3xl border border-violet-100 bg-violet-50 px-6 py-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          CupidMatch help
        </p>
        <h1 className="mt-3 text-4xl font-bold">We’re here to help</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
          Get help with your profile, account, membership or a safety concern.
          Support requests and replies stay private inside your account.
        </p>
        <Button asChild className="mt-6">
          <Link href="/support">Open support centre</Link>
        </Button>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Trouble signing in?",
            text: "Reset your password using the email address on your account.",
            href: "/forgot-password",
            label: "Reset password",
          },
          {
            title: "Waiting for your confirmation email?",
            text: "Request another confirmation email and check your spam folder.",
            href: "/signup/check-email",
            label: "Email confirmation help",
          },
          {
            title: "A safety concern?",
            text: "Report the member from their profile, block contact, or ask our team for help.",
            href: "/safety",
            label: "Read safety guidance",
          },
          {
            title: "Your profile and privacy",
            text: "Manage visibility and photo privacy, or review the members you have blocked.",
            href: "/dashboard/privacy",
            label: "Privacy and safety",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="space-y-3 rounded-2xl border bg-white p-6"
          >
            <h2 className="text-lg font-bold">{item.title}</h2>
            <p className="text-sm leading-6 text-slate-500">{item.text}</p>
            <Button variant="outline" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          </article>
        ))}
      </section>
      <p className="text-sm leading-6 text-slate-500">
        Sign in to create a support request and track responses. Never send your
        password, verification codes or bank details. For immediate danger,
        contact local emergency services.
      </p>
    </div>
  );
}
