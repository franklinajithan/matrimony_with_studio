import Link from "next/link";
import { LivePricing } from "@/components/subscriptions/LivePricing";
export default function LaunchPricingPage(){
 return <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
 <header className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-8 text-center">
 <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-primary">CUPIDMATCH LAUNCH OFFER</span>
 <h1 className="mt-6 text-4xl font-bold text-foreground">Explore CupidMatch free for your first 3 months</h1>
 <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Verify your email and mobile number to activate the three-month introductory offer. Have a special invitation code? Enter it during registration to unlock its configured duration. No payment is collected.</p>
 </header>
 <LivePricing />
 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Launch policy preview:</strong> Your introductory period starts on your account creation date. Valid special invitation codes replace the standard three-month duration. After the offer ends, the Free plan remains available. Paid checkout is not enabled yet.</div>
 <div className="text-center"><Link href="/signup" className="inline-flex rounded-xl bg-primary px-7 py-3 font-semibold text-white">Create your account</Link></div>
 </main>;
}