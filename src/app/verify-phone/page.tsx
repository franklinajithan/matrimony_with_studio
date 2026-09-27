"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPhonePage() {
 const router = useRouter();
 const [phone,setPhone]=useState("");
 const [otp,setOtp]=useState("");
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [verified,setVerified]=useState(false);
 const [offerCode,setOfferCode]=useState("");
 const [trialReady,setTrialReady]=useState(false);
 useEffect(()=>{void supabase.auth.getUser().then(({data})=>{
   if(!data.user){router.replace("/login");return;}
   setOfferCode(String(data.user.user_metadata?.pending_promo_code || ""));
   if(data.user.phone_confirmed_at && data.user.phone){setVerified(true);return;}
   setPhone(String(data.user.user_metadata?.pending_phone || ""));
 });},[router]);
 async function send(){
  setError("");
  if(!/^\+[1-9]\d{7,14}$/.test(phone)){setError("Enter a valid international mobile number, including country code.");return;}
  setBusy(true);
  try {
   const {error:sendError}=await supabase.auth.updateUser({phone});
   if(sendError) throw sendError;
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:"Unable to send SMS.");}
  finally{setBusy(false);}
 }
 async function activate(skipCode=false){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/trial/activate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:skipCode?"":offerCode})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Could not activate your launch offer");
   setTrialReady(true);router.replace("/onboarding");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Trial activation failed");}
  finally{setBusy(false);}
 }
 async function confirm(){
  setError("");
  if(!/^\d{6}$/.test(otp)){setError("Enter the six-digit SMS code.");return;}
  setBusy(true);
  try{
   const {error:verifyError}=await supabase.auth.verifyOtp({phone,token:otp,type:"phone_change"});
   if(verifyError) throw verifyError;
   const {data,error:userError}=await supabase.auth.getUser();
   if(userError || !data.user?.phone_confirmed_at || data.user.phone!==phone) throw new Error("Phone confirmation could not be verified. Please retry.");
   setVerified(true);
   await activate();
  }catch(e){setError(e instanceof Error?e.message:"Verification failed.");}
  finally{setBusy(false);}
 }
 return <Card className="mx-auto mt-12 w-full max-w-md rounded-3xl shadow-xl"><CardHeader><CardTitle className="text-2xl">Verify your mobile number</CardTitle><p className="text-sm text-muted-foreground">Keep your number private. We use an SMS code to confirm it belongs to you.</p></CardHeader><CardContent className="space-y-4">
 {verified?<><p className="text-emerald-700">Your mobile number is verified.</p><Button disabled={busy||trialReady} onClick={()=>void activate()}>{busy?"Activating…":"Activate offer and continue"}</Button>{offerCode&&<Button variant="outline" disabled={busy} onClick={()=>void activate(true)}>Continue with standard 3-month offer</Button>}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}</>:<>
 <label className="block text-sm font-medium" htmlFor="mobile">Mobile number with country code</label>
 <Input id="mobile" type="tel" autoComplete="tel" value={phone} onChange={e=>{setPhone(e.target.value.trim());setSent(false);setOtp("");}} placeholder="+447700900123" disabled={busy}/>
 <Button className="w-full" disabled={busy || sent} onClick={send}>{busy?"Please wait…":sent?"Code sent":"Send SMS code"}</Button>
 {sent&&<><label className="block text-sm font-medium" htmlFor="otp">Six-digit code</label><Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="000000"/><Button className="w-full" disabled={busy} onClick={confirm}>Verify and continue</Button><Button variant="outline" className="w-full" disabled={busy} onClick={()=>{setSent(false);setOtp("");}}>Change number or resend</Button></>}
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 {verified&&offerCode&&<Button variant="outline" disabled={busy} onClick={()=>void activate(true)}>Continue with standard 3-month offer</Button>}
 <p className="text-xs text-muted-foreground">SMS delivery requires the site's configured SMS provider. Never share your verification code.</p>
 </>}
 </CardContent></Card>;
}