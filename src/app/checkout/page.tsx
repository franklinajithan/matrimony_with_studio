import {Suspense} from "react";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {SecureCheckoutExperience} from "@/components/subscriptions/SecureCheckoutExperience";
export const dynamic="force-dynamic";
export default async function CheckoutPage(){
 const db=await createSupabaseServerClient();
 const {data,error}=await db.auth.getUser();
 if(error||!data.user)redirect("/login?next=%2Fcheckout");
 return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-12" role="status">Preparing your secure checkout…</main>}><SecureCheckoutExperience/></Suspense>;
}
