import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { PremiumLaunchOffer } from "@/components/subscriptions/PremiumLaunchOffer";
import { PaymentHistory } from "@/components/subscriptions/PaymentHistory";
import { ManageStripeSubscription } from "@/components/subscriptions/ManageStripeSubscription";
export const dynamic = "force-dynamic";
export default async function MembershipPage({searchParams}:{searchParams:Promise<{checkout?:string}>}){
 const checkoutResult=(await searchParams).checkout;
 const db=await createSupabaseServerClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)redirect("/login?next=%2Fmembership");
 const {plan,trial,launchOffer,trialAvailable,subscription}=await getServerSubscription();
 const offer=launchOffer??trial;
 const ends=offer?new Date(offer.ends_at):null;
 const remaining=ends?Math.max(0,Math.ceil((ends.getTime()-Date.now())/86400000)):0;
 const active=!!offer&&!!ends&&Date.parse(offer.starts_at)<=Date.now()&&remaining>0;
 return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
 <div><p className="text-sm font-semibold text-primary">Your CupidMatch membership</p><h1 className="mt-1 text-3xl font-bold text-foreground">Membership & launch offer</h1><p className="mt-2 text-muted-foreground">Manage your membership and see when your Premium trial ends.</p></div>
 <section className="rounded-3xl border border-border bg-gradient-to-br from-accent to-white p-7 shadow-sm">
 <p className="text-sm font-semibold text-primary">Current access</p><h2 className="mt-2 text-3xl font-bold text-foreground">{plan.name}</h2>
 {active && offer?<><p className="mt-3 text-2xl font-semibold text-primary">{remaining} {remaining===1?"day":"days"} remaining</p><p className="mt-2 text-muted-foreground">{offer.duration_months}-month introductory offer · Ends {ends?.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}</p><p className="mt-3 text-sm text-muted-foreground">{trial?.promo_code_id?"Special invitation offer applied":"Standard launch offer applied"}</p></>:offer?<p className="mt-3 text-muted-foreground">Your introductory period ended on {ends?.toLocaleDateString("en-GB")}. Your profile and messages are retained. Your current access is shown above.</p>:<p className="mt-3 text-muted-foreground">No introductory offer is active. Choose Premium below; no phone verification or card is required.</p>}
 </section>
 {checkoutResult==="return"&&<p role="status" className="rounded-xl border p-4 text-sm">You have returned from Stripe. Your membership will update only after Stripe confirms your payment. Refresh this page to see your verified access.</p>}
 {checkoutResult==="cancelled"&&<p role="status" className="rounded-xl border p-4 text-sm">You left checkout. No new membership has been activated.</p>}
 <PremiumLaunchOffer initialEndsAt={offer?.ends_at??""} available={trialAvailable} />
 <section className="rounded-3xl border p-5 sm:p-6"><h2 className="text-xl font-bold">Explore membership options</h2><p className="mt-2 text-sm text-muted-foreground">Compare Free, Plus and Premium in one place before choosing a membership.</p><Link className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground sm:w-auto" href="/launch-pricing">Compare plans</Link></section>
 <ManageStripeSubscription hasCustomer={Boolean(subscription?.provider==='stripe' && subscription?.provider_customer_id && subscription?.provider_subscription_id)} />
 <PaymentHistory />
 <Link className="inline-flex font-semibold text-primary hover:underline" href="/dashboard">Back to dashboard →</Link>
 <p className="text-sm text-muted-foreground">Your introductory trial costs £0 and requires no card. Paid Stripe subscriptions, once enabled and purchased, renew monthly until cancelled.</p>
 </main>;
}
