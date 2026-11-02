import Link from "next/link";
import { LivePricing } from "@/components/subscriptions/LivePricing";
export default function LaunchPricingPage(){
 return <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
 <header className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-8 text-center">
 <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-primary">CUPIDMATCH LAUNCH OFFER</span>
 <h1 className="mt-6 text-4xl font-bold text-foreground">Choose Premium — free for 6 months</h1>
 <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Choose Premium, sign in and confirm your email to start your free six-month launch offer. No payment card or phone verification is required for this offer.</p>
 </header>
 <LivePricing />
 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Launch policy preview:</strong> Your six months start when you activate Premium. This offer is available once per account. After it ends, the Free plan remains available. You will not be charged automatically. Paid checkout is not enabled yet.</div>
 <div className="text-center"><Link href="/membership" className="inline-flex rounded-xl bg-primary px-7 py-3 font-semibold text-white">Choose Premium — 6 months free</Link></div>
 </main>;
}