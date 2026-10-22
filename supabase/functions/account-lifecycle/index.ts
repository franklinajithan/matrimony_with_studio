// @ts-nocheck -- Deno Edge runtime; checked by the Supabase deployment compiler.
import { createClient } from '@supabase/supabase-js';
import { deleteAccount, DeletionError } from './deletion.ts';
import { hasRecentAuthentication } from './recent-auth.ts';
const response = (body, status=200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
Deno.serve(async request => {
 if(request.method!=='POST') return response({error:'Method not allowed'},405);
 const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const body=await request.json().catch(()=>null);
 if(!body) return response({error:'Invalid request'},400);
 try {
  if(body.action==='recover') {
   const provided=request.headers.get('x-recovery-secret')||'';
   const configured=Deno.env.get('ACCOUNT_DELETION_RECOVERY_SECRET');
   if(!configured) return response({error:'Recovery is not configured'},503);
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(provided)))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const expected=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(configured)))).map(b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==expected) return response({error:'Forbidden'},403);
   const jobs=await admin.from('account_deletions').select('user_id,actor_id').neq('state','completed').order('requested_at').limit(5);
   if(jobs.error) throw new Error('Recovery unavailable');
   let failed=0;
   for(const job of jobs.data||[]) {try {await deleteAccount(admin,job.user_id,job.actor_id)}catch{failed++}}
   const purge=await admin.from('account_deletions').delete().eq('state','completed').lt('completed_at',new Date(Date.now()-90*86400_000).toISOString());
   return response({attempted:jobs.data?.length||0,failed},failed||purge.error?503:200);
  }
  const token=(request.headers.get('authorization')||'').replace(/^Bearer /i,'');
  const verified=await admin.auth.getUser(token);
  if(verified.error||!verified.data.user) return response({error:'Sign in required'},401);
  const user=verified.data.user;
  const member=createClient(url,Deno.env.get('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const live=await member.rpc('account_session_is_live');
  const claims=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
  if(live.error||!live.data||!hasRecentAuthentication(claims)) return response({error:'Verify your identity again'},401);
  if(!['delete','admin-delete','deactivate','reactivate'].includes(body.action)) return response({error:'Invalid action'},400);
  if(body.confirmation!==(body.action.includes('delete')?'DELETE':'CONFIRM')) return response({error:'Explicit confirmation required'},400);
  if(body.action==='admin-delete') {
   const role=await member.rpc('is_admin');
   if(role.error||role.data!==true) return response({error:'Forbidden'},403);
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.memberId||'')||typeof body.email!=='string'||!body.email.trim())return response({error:'Member and confirmation email required'},400);
   if(body.memberId===user.id) return response({error:'Administrator self-deletion is not allowed'},403);
   await deleteAccount(admin,body.memberId,user.id,body.email);
  }else if(body.action==='delete') await deleteAccount(admin,user.id,user.id);
  else {
   const changed=await admin.rpc('account_set_deactivated',{p_user:user.id,p_deactivate:body.action==='deactivate'});
   if(changed.error)throw new DeletionError('Unable to change account status');
  }
  return response({success:true});
 }catch(error){return response({error:error instanceof DeletionError?error.message:'Account service unavailable'},error instanceof DeletionError?error.status:503)}
});
