/** Only creates and removes random disposable identities; never accepts member IDs. */
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key||!anon)throw new Error('Trusted Supabase server environment required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,key,options),created=[],report={};
const must=async p=>{const r=await p;if(r.error)throw r.error;return r.data};
async function fixture(){
 const email=`cupidmatch-horoscope-qa-${randomUUID()}@example.com`,password=randomBytes(32).toString('base64url');
 const {user}=await must(admin.auth.admin.createUser({email,password,email_confirm:true}));created.push(user.id);
 const db=createClient(url,anon,options);await must(db.auth.signInWithPassword({email,password}));
 await must(admin.from('profiles').update({is_published:true}).eq('id',user.id));
 return {id:user.id,db};
}
const payload=(revision=0,visibility='private',consent=true)=>({revision,tradition:'tamil',visibility,fields:{dateOfBirth:'1990-01-01',timeQuality:'unknown',birthCity:'Private QA city',birthCountry:'UK',timezone:'Europe/London',language:'Tamil',rasi:'Mesha'},shared_fields:['rasi'],comparison_consent:consent,ai_consent:false,planets:[]});
try{
 const settings=await must(admin.from('horoscope_settings').select('horoscope_enabled').single());
 assert.equal(settings.horoscope_enabled,true,'Enable manual horoscope editing only in an explicitly authorized QA window');
 const a=await fixture(),b=await fixture();
 const saved=await must(a.db.rpc('horoscope_save',{p_payload:payload()}));assert.equal(saved.revision,1);report.manualSave=true;
 assert.equal((await must(b.db.from('horoscope_profiles').select('*').eq('user_id',a.id))).length,0);report.rawPeerIsolation=true;
 assert.ok((await b.db.rpc('horoscope_view',{p_owner:a.id})).error);report.privateViewDenied=true;
 assert.ok((await b.db.rpc('horoscope_admin_settings',{p_settings:{}})).error);report.memberAdminDenied=true;
 assert.ok((await a.db.rpc('horoscope_save',{p_payload:payload()})).error);report.staleEditRejected=true;
 await must(a.db.rpc('horoscope_save',{p_payload:payload(1,'connections')}));
 assert.ok((await b.db.rpc('horoscope_view',{p_owner:a.id})).error);report.unconnectedViewDenied=true;
 const pair=[a.id,b.id].sort();await must(admin.from('connections').insert({member_a_id:pair[0],member_b_id:pair[1]}));
 const shared=await must(b.db.rpc('horoscope_view',{p_owner:a.id}));assert.deepEqual(shared.fields,{rasi:'Mesha'});assert.equal(shared.provenance,undefined);report.sharedFieldsRedacted=true;
 await must(b.db.rpc('horoscope_save',{p_payload:payload(0,'connections')}));
 assert.equal(await must(b.db.rpc('horoscope_can_compare',{p_other:a.id})),true);report.mutualComparison=true;
 await must(b.db.rpc('horoscope_store_report',{p_other:a.id,p_own_revision:1,p_other_revision:2,p_report:{comparison:{score:null},aiExplanation:null}}));
 await must(a.db.from('blocks').insert({blocker_id:a.id,blocked_id:b.id}));
 assert.equal(await must(b.db.rpc('horoscope_can_compare',{p_other:a.id})),false);
 assert.equal((await must(b.db.from('horoscope_match_reports').select('id'))).length,0);report.blockRevokesReport=true;
 await must(a.db.from('blocks').delete().eq('blocker_id',a.id).eq('blocked_id',b.id));
 await must(a.db.rpc('horoscope_save',{p_payload:payload(2,'connections',false)}));
 assert.equal(await must(b.db.rpc('horoscope_can_compare',{p_other:a.id})),false);report.consentWithdrawal=true;
 await must(admin.from('horoscope_restrictions').insert({user_id:a.id,restricted:true}));
 assert.ok((await a.db.rpc('horoscope_save',{p_payload:payload(3)})).error);
 assert.ok((await b.db.rpc('horoscope_view',{p_owner:a.id})).error);report.memberRestriction=true;
 await must(a.db.rpc('horoscope_delete'));
 assert.equal((await must(a.db.from('horoscope_profiles').select('user_id'))).length,0);report.ownerDeleteWhileRestricted=true;
 console.log(JSON.stringify(report,null,2));
}finally{
 for(const id of created){const r=await admin.auth.admin.deleteUser(id,false);if(r.error)throw new Error(`Disposable cleanup failed: ${id}`);}
}
