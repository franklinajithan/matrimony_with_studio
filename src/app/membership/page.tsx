import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
export default async function MembershipPage(){
 const db=await createSupabaseServerClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)redirect("/login?next=%2Fmembership");
 const {plan,trial}=await getServerSubscription();
 const ends=trial?new Date(trial.ends_at):null;
 const remaining=ends?Math.max(0,Math.ceil((ends.getTime()-Date.now())/86400000)):0;
 const active=!!trial&&!!ends&&remaining>0;
 return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
 <div><p className="text-sm font-semibold text-primary">Your CupidMatch membership</p><h1 className="mt-1 text-3xl font-bold text-foreground">Membership & launch offer</h1><p className="mt-2 text-muted-foreground">See your introductory offer and available membership options. Payments are not enabled yet.</p></div>
 <section className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-7 shadow-sm">
 <p className="text-sm font-semibold text-primary">Current access</p><h2 className="mt-2 text-3xl font-bold text-foreground">{plan.name}</h2>
 {active && trial?<><p className="mt-3 text-2xl font-semibold text-primary">{remaining} {remaining===1?"day":"days"} remaining</p><p className="mt-2 text-muted-foreground">{trial.duration_months}-month introductory offer · Ends {ends?.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p><p className="mt-3 text-sm text-muted-foreground">{trial.promo_code_id?"Special invitation offer applied":"Standard launch offer applied"}</p></>:trial?<p className="mt-3 text-muted-foreground">Your introductory period ended on {ends?.toLocaleDateString("en-GB")}. Your account remains accessible under the available Free plan.</p>:<p className="mt-3 text-muted-foreground">No launch offer is active. Verify your mobile number to activate your introductory offer.</p>}
 </section>
 <div className="grid gap-3 sm:grid-cols-2"><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href="/launch-pricing">Explore membership plans →</Link><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href={auth.user.phone_confirmed_at?"/dashboard":"/verify-phone"}>{auth.user.phone_confirmed_at?"Back to dashboard":"Verify mobile number"} →</Link></div>
 <p className="text-sm text-muted-foreground">No automatic charges. Membership prices are a preview while payments are being prepared.</p>
 </main>;
}
