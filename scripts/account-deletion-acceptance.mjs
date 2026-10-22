/** Destructive only to members created in this process. Never accepts a member ID. */
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key||!anon)throw new Error('Run in a trusted environment with Supabase URL, server-side service key and publishable key.');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const created=[];const report={};
const must=async promise=>{const r=await promise;if(r.error)throw r.error;return r.data};
const client=()=>createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
async function fixture(suffix){
 const email=`cupidmatch-delete-qa-${randomUUID()}-${suffix}@example.com`,password=`QA-${randomBytes(24).toString('hex')}`;
 const account=await must(admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Disposable deletion QA'}}));
 created.push(account.user.id);const db=client();const login=await must(db.auth.signInWithPassword({email,password}));
 return {id:account.user.id,email,password,db,session:login.session};
}
async function invoke(account,body){
 if(process.env.QA_BASE_URL){
  const base=new URL(process.env.QA_BASE_URL);assert.equal(base.protocol,'https:');
  const project=new URL(url).hostname.split('.')[0];
  const cookie=`sb-${project}-auth-token=base64-${Buffer.from(JSON.stringify(account.session)).toString('base64url')}`;
  const response=await fetch(new URL('/api/account',base),{method:'POST',headers:{origin:base.origin,cookie,'content-type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();assert.equal(response.ok,true,JSON.stringify(result));return result;
 }
 return must(account.db.functions.invoke('account-lifecycle',{body}));
}
try {
 const member=await fixture('member'),peer=await fixture('peer');
 await must(admin.from('profiles').update({display_name:'Disposable deletion QA',bio:'Test member data for permanent deletion verification.',dob:'1990-01-01',location:'London',profession:'QA',country:'UK',height:'170',onboarding_step:5,extra:{gender:'male',partnerPreferences:{height:'160-180',religion:'Any'}},is_published:true}).eq('id',member.id));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZocAAAAASUVORK5CYII=','base64');
 const photo=`users/${member.id}/photos/qa.png`;
 await must(member.db.storage.from('media').upload(photo,png,{contentType:'image/png'}));
 await must(admin.from('profiles').update({photo_url:photo}).eq('id',member.id));
 await must(admin.from('biodata_documents').insert({owner_id:member.id,title:'Disposable QA',template_id:'classic',content:{name:'Disposable deletion QA'}}));
 await must(member.db.rpc('horoscope_save',{p_payload:{revision:0,tradition:'tamil',visibility:'private',fields:{dateOfBirth:'1990-01-01',timeQuality:'unknown',birthCity:'London',birthCountry:'UK',timezone:'Europe/London',language:'English',rasi:'Mesha'},shared_fields:[],comparison_consent:false,ai_consent:false,planets:[]}}));
 await must(admin.from('likes').insert({liker_id:member.id,liked_id:peer.id}));
 const chatId=[member.id,peer.id].sort().join('_');
 await must(admin.from('chats').insert({id:chatId,participant_1:member.id,participant_2:peer.id,participant_details:{[member.id]:{displayName:'Erase me'},[peer.id]:{displayName:'Keep peer'}}}));
 await must(admin.from('messages').insert([{chat_id:chatId,sender_id:member.id,text:'Erase my message'},{chat_id:chatId,sender_id:peer.id,text:'Keep peer message'}]));
 await invoke(member,{action:'deactivate',confirmation:'CONFIRM'});
 const hidden=await must(peer.db.from('discovery_profiles').select('id').eq('id',member.id));assert.equal(hidden.length,0);report.deactivation=true;
 await invoke(member,{action:'reactivate',confirmation:'CONFIRM'});
 await invoke(member,{action:'delete',confirmation:'DELETE'});
 assert.ok((await client().auth.signInWithPassword({email:member.email,password:member.password})).error);report.authenticationRevoked=true;
 const profiles=await must(admin.from('profiles').select('id').eq('id',member.id));assert.equal(profiles.length,0);report.profileRemoved=true;
 const files=await must(admin.rpc('account_storage_objects',{p_user:member.id}));assert.equal(files.length,0);report.storageRemoved=true;
 for(const [table,column] of [['biodata_documents','owner_id'],['horoscope_profiles','user_id'],['likes','liker_id']]){assert.equal((await must(admin.from(table).select('*').eq(column,member.id))).length,0)}report.relatedDataRemoved=true;
 const messages=await must(peer.db.from('messages').select('text').eq('chat_id',chatId));assert.deepEqual(messages.map(m=>m.text),['Keep peer message']);report.peerContentPreserved=true;
 assert.equal((await must(peer.db.from('discovery_profiles').select('id').eq('id',member.id))).length,0);report.discoveryRemoved=true;
 const repeated=await member.db.functions.invoke('account-lifecycle',{body:{action:'delete',confirmation:'DELETE'}});assert.ok(repeated.error);report.staleSessionRejected=true;
 const fresh=await must(client().auth.signUp({email:member.email,password:member.password}));assert.ok(fresh.user?.id&&fresh.user.id!==member.id&&fresh.user.identities?.length);created.push(fresh.user.id);report.sameEmailRegistration=true;
 console.log(JSON.stringify(report,null,2));
} finally {
 // IDs can only originate from createUser/signUp above, never environment/input.
 for(const id of created){
  const objects=await admin.rpc('account_storage_objects',{p_user:id});
  for(const bucket of new Set((objects.data||[]).map(o=>o.bucket_id)))await admin.storage.from(bucket).remove(objects.data.filter(o=>o.bucket_id===bucket).map(o=>o.name));
  await admin.from('promo_redemptions').delete().eq('user_id',id);
  const removed=await admin.auth.admin.deleteUser(id,false);
  if(removed.error&&removed.error.code!=='user_not_found')console.error('Disposable fixture cleanup needs retry:',id);
 }
}
