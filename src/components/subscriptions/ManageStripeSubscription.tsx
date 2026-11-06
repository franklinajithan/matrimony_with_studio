'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ManageStripeSubscription({ hasCustomer }: { hasCustomer: boolean }) {
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 if(!hasCustomer)return null;
 async function openPortal(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/billing/portal',{method:'POST',credentials:'same-origin'});
   const result=await response.json();
   if(!response.ok||typeof result.url!=='string')throw new Error(result.error||'Unable to open subscription settings');
   const url=new URL(result.url);
   if(url.protocol!=='https:'||url.hostname!=='billing.stripe.com')throw new Error('Invalid Stripe billing URL');
   window.location.assign(url.href);
  }catch(e){setError(e instanceof Error?e.message:'Unable to open billing portal');setBusy(false);}
 }
 return <section className="space-y-3 rounded-3xl border p-6">
  <h2 className="text-2xl font-bold">Manage your paid membership</h2>
  <p className="text-sm text-muted-foreground">Review subscription renewal dates, update your card, or cancel future automatic renewals securely through Stripe.</p>
  <Button disabled={busy} onClick={()=>void openPortal()}>{busy?'Opening Stripe…':'Manage billing and cancellation'}</Button>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </section>;
}
