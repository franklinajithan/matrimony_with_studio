import {Suspense} from "react";
import {loginUrl} from "@/lib/auth/safe-redirect";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {SecureCheckoutExperience} from "@/components/subscriptions/SecureCheckoutExperience";
export const dynamic="force-dynamic";
export default async function CheckoutPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const db=await createSupabaseServerClient();
 const {data,error}=await db.auth.getUser();
 if(error||!data.user){
  const input=await searchParams;
  const query=new URLSearchParams();
  for(const key of ["plan","term","country"]){
   const value=input[key];
   if(typeof value==="string" && /^[a-z0-9_]+$/i.test(value))query.set(key,value);
  }
  redirect(loginUrl(query.size ? `/checkout?${query}` : "/checkout"));
 }
 return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-12" role="status">Preparing your secure checkout…</main>}><SecureCheckoutExperience/></Suspense>;
}
