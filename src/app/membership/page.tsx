import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { PremiumLaunchOffer } from "@/components/subscriptions/PremiumLaunchOffer";
export const dynamic = "force-dynamic";
export default async function MembershipPage(){
 const db=await createSupabaseServerClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)redirect("/login?next=%2Fmembership");
 const {plan,trial,launchOffer}=await getServerSubscription();
 const offer=launchOffer??trial;
 const ends=offer?new Date(offer.ends_at):null;
 const remaining=ends?Math.max(0,Math.ceil((ends.getTime()-Date.now())/86400000)):0;
 const active=!!offer&&!!ends&&Date.parse(offer.starts_at)<=Date.now()&&remaining>0;
 return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
 <div><p className="text-sm font-semibold text-primary">Your CupidMatch membership</p><h1 className="mt-1 text-3xl font-bold text-foreground">Membership & launch offer</h1><p className="mt-2 text-muted-foreground">See your introductory offer and available membership options. Payments are not enabled yet.</p></div>
 <section className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-7 shadow-sm">
 <p className="text-sm font-semibold text-primary">Current access</p><h2 className="mt-2 text-3xl font-bold text-foreground">{plan.name}</h2>
 {active && offer?<><p className="mt-3 text-2xl font-semibold text-primary">{remaining} {remaining===1?"day":"days"} remaining</p><p className="mt-2 text-muted-foreground">{offer.duration_months}-month introductory offer · Ends {ends?.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}</p><p className="mt-3 text-sm text-muted-foreground">{trial?.promo_code_id?"Special invitation offer applied":"Standard launch offer applied"}</p></>:offer?<p className="mt-3 text-muted-foreground">Your introductory period ended on {ends?.toLocaleDateString("en-GB")}. Your profile and messages are retained. Your current access is shown above.</p>:<p className="mt-3 text-muted-foreground">No introductory offer is active. Choose Premium below; no phone verification or card is required.</p>}
 </section>
 <PremiumLaunchOffer initialEndsAt={offer?.ends_at??""} />
 <div className="grid gap-3 sm:grid-cols-2"><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href="/launch-pricing">Explore membership plans →</Link><Link className="rounded-xl border bg-card p-4 font-semibold text-primary hover:bg-accent" href="/dashboard">Back to dashboard →</Link></div>
 <p className="text-sm text-muted-foreground">No automatic charges. Membership prices are a preview while payments are being prepared.</p>
 </main>;
}
