import Link from "next/link";
import { PLANS, formatPlanPrice, type PlanCode } from "@/lib/subscriptions/plans";
export default function LaunchPricingPage(){
 const codes:PlanCode[]=["free","premium","premium_plus"];
 return <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
 <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-8 text-center">
 <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-800">CUPIDMATCH LAUNCH OFFER</span>
 <h1 className="mt-6 text-4xl font-bold text-slate-950">Explore CupidMatch free for your first 3 months</h1>
 <p className="mx-auto mt-4 max-w-2xl text-slate-600">Verify your email and mobile number to activate the three-month introductory offer. Have a special invitation code? Enter it during registration to unlock its configured duration. No payment is collected.</p>
 </header>
 <section className="grid gap-5 md:grid-cols-3">{codes.map(code=>{const plan=PLANS[code];return <article key={code} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
 <h2 className="text-2xl font-bold">{plan.name}</h2><p className="mt-2 min-h-12 text-sm text-slate-600">{plan.description}</p>
 <p className="mt-6 text-3xl font-bold text-violet-700">{formatPlanPrice(plan.pricesPence.monthly)}{plan.pricesPence.monthly>0&&<span className="text-base font-normal text-slate-500"> / month</span>}</p>
 <p className="mt-2 text-sm text-slate-600">3 months: {formatPlanPrice(plan.pricesPence.three_months)}</p>
 <p className="text-sm text-slate-600">6 months: {formatPlanPrice(plan.pricesPence.six_months)}</p>
 <div className="mt-6 flex-1 space-y-2 text-sm text-slate-700"><p>✓ Profile browsing and basic matching</p><p>✓ Messaging after mutual match</p><p>{plan.entitlements.advancedFilters?"✓ Advanced matching filters":"— Basic matching filters"}</p><p>{plan.entitlements.familyIntroduction?"✓ Family introduction":"— Family introduction not included"}</p></div>
 <div className="mt-8 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">{code==="free"?"Always-free plan":"Coming soon · No checkout yet"}</div>
 </article>})}</section>
 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><strong>Launch policy preview:</strong> Your introductory period starts on your account creation date. Valid special invitation codes replace the standard three-month duration. After the offer ends, the Free plan remains available. Paid checkout is not enabled yet.</div>
 <div className="text-center"><Link href="/signup" className="inline-flex rounded-xl bg-violet-700 px-7 py-3 font-semibold text-white">Create your account</Link></div>
 </main>;
}