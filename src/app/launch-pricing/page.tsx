import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LivePricing } from "@/components/subscriptions/LivePricing";

export const dynamic = "force-dynamic";

export default async function LaunchPricingPage(){
 const db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();
 const signedIn=Boolean(user);
 return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
  <header className="space-y-3 text-center">
   <h1 className="text-3xl font-bold sm:text-4xl">Choose your CupidMatch membership</h1>
   <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">Compare Free, Plus and Premium in one place. Paid membership starts only after Stripe verifies your payment.</p>
   <Link className="inline-flex items-center rounded-xl border px-5 py-3 text-sm font-semibold text-primary" href={signedIn?"/membership":"/signup"}>{signedIn?"Back to my membership":"Create your matrimonial profile"}</Link>
  </header>
  <LivePricing signedIn={signedIn}/>
 </main>;
}
