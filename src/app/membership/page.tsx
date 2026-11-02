import { PremiumLaunchOffer } from "@/components/subscriptions/PremiumLaunchOffer";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
export default async function MembershipPage(){
 const db=await createSupabaseServerClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)redirect("/login?next=%2Fmembership");
 const {plan,trial:legacyTrial,launchOffer}=await getServerSubscription();
 const trial=launchOffer&&(!legacyTrial||Date.parse(launchOffer.ends_at)>Date.parse(legacyTrial.ends_at))?launchOffer:legacyTrial;
 const ends=trial?new Date(trial.ends_at):null;
 const remaining=ends?Math.max(0,Math.ceil((ends.getTime()-Date.now())/86400000)):0;
 const active=!!trial&&!!ends&&remaining>0;
 return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
 <div><p className="text-sm font-semibold text-primary">Your CupidMatch membership</p><h1 className="mt-1 text-3xl font-bold text-foreground">Membership & launch offer</h1><p className="mt-2 text-muted-foreground">See your introductory offer and available membership options. Payments are not enabled yet.</p></div>
 <section className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-7 shadow-sm">
 <p className="text-sm font-semibold text-primary">Current access</p><h2 className="mt-2 text-3xl font-bold text-foreground">{plan.name}</h2>
 {active && trial?<><p className="mt-3 text-2xl font-semibold text-primary">{remaining} {remaining===1?"day":"days"} remaining</p><p className="mt-2 text-muted-foreground">{trial.duration_months}-month introductory offer · Ends {ends?.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p><p className="mt-3 text-sm text-muted-foreground">{"promo_code_id" in trial&&trial.promo_code_id?"Special invitation offer applied":"Standard launch offer applied"}</p></>:trial?<p className="mt-3 text-muted-foreground">Your introductory period ended on {ends?.toLocaleDateString("en-GB")}. Your account remains accessible under the available Free plan.</p>:<p className="mt-3 text-muted-foreground">Choose Premium below to start your free six-month launch offer.</p>}
 </section>
 {launchOffer?<p className="rounded-xl border bg-accent p-4">Your six-month Premium launch offer {new Date(launchOffer.ends_at).getTime()>Date.now()?"ends":"ended"} on {new Date(launchOffer.ends_at).toLocaleDateString("en-GB",{timeZone:"UTC"})}. No automatic charges.</p>:<PremiumLaunchOffer/>}
 <div className="grid gap-3 sm:grid-cols-2"><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href="/launch-pricing">Explore membership plans →</Link><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href="/dashboard">Back to dashboard →</Link></div>
 <p className="text-sm text-muted-foreground">No automatic charges. Membership prices are a preview while payments are being prepared.</p>
 </main>;
}
