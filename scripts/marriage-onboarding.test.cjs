const{test}=require('node:test');const assert=require('node:assert/strict');
const{parseOnboardingDraft,validateForPublish,validateOnboardingStep}=require('../src/lib/onboarding/schema.ts');
const{computeProfileReadiness,firstIncompleteOnboardingStep}=require('../src/lib/onboarding/readiness.ts');
const{profilePatchFromDraft,publishOnboarding,draftFromProfileRow}=require('../src/lib/onboarding/persist.ts');
const{messages}=require('../src/components/i18n/messages.ts');
const basic={displayName:'Fixture Member',gender:'female',dob:'1995-05-12',height:'165'};
test('basic identity, height and explicit publication consent are required',()=>{const minimal=parseOnboardingDraft({...basic,reviewConfirmed:true});assert.deepEqual(validateForPublish(minimal),[]);for(let step=1;step<=6;step++)assert.deepEqual(validateOnboardingStep(step,minimal),[]);assert.equal(computeProfileReadiness(minimal,false).percent,100);assert.equal(firstIncompleteOnboardingStep(minimal),7);});
test('missing name, gender, invalid/underage birth date and missing consent still block publication',()=>{for(const patch of[{displayName:''},{gender:undefined},{height:''},{height:'45'},{dob:''},{dob:'2015-01-01'},{dob:'1995-02-30'},{reviewConfirmed:false}])assert.ok(validateForPublish(parseOnboardingDraft({...basic,reviewConfirmed:true,...patch})).length>0);});
test('short or absent optional descriptions, education, language and location never block an adult',()=>{for(const patch of[{}, {bio:'Hi'}, {country:'',region:'',languages:[]}, {lookingFor:'',relationshipTimeline:'',educationLevel:'',relocationOpenness:''}])assert.deepEqual(validateForPublish(parseOnboardingDraft({...basic,reviewConfirmed:true,...patch})),[]);});
test('new optional marital status persists and reloads without rewriting old preferences',()=>{const draft=parseOnboardingDraft({...basic,maritalStatus:'Divorced',lookingFor:'long-term'});const patch=profilePatchFromDraft(draft);assert.equal(patch.relationship_intentions.maritalStatus,'Divorced');assert.equal(patch.relationship_intentions.lookingFor,'long-term');assert.equal(draftFromProfileRow({relationship_intentions:patch.relationship_intentions}).maritalStatus,'Divorced');});
test('skipping a photo never assigns a demonstration person and does not clear a stored photo column',()=>{const patch=profilePatchFromDraft(parseOnboardingDraft(basic));assert.equal('photo_url' in patch,false);const supplied=profilePatchFromDraft(parseOnboardingDraft({...basic,photoURL:'users/self/photo.jpg'}));assert.equal(supplied.photo_url,'users/self/photo.jpg');});
test('minimal adult can publish at the actual service boundary without optional fields or privilege injection',async()=>{let row;const client={from:()=>({upsert:p=>{row=p;return{select:()=>({single:async()=>({data:{is_published:true,onboarding_step:8},error:null})})};}})};await publishOnboarding(client,'verified-member',{draft:{...basic,reviewConfirmed:true,is_admin:true}});assert.equal(row.id,'verified-member');assert.equal(row.is_published,true);assert.equal(row.is_admin,undefined);assert.equal(row.photo_url,undefined);});
test('six languages expose accessible marriage-only questions with matching optional keys',()=>{
 const keys=Object.keys(messages.en.onboarding).sort();
 for(const locale of Object.values(messages)){
  assert.deepEqual(Object.keys(locale.onboarding).sort(),keys);
  for(const key of ['optionalDetails','skipOptional','maritalStatus','spouseQualities','familyMarriageRole','marriageOnlyInfo','spouseQualitiesHelp','faithInMarriage','familyMarriageHelp','familyIntroductionHelp','longDistanceHelp','familyResponsibilitiesHelp']){
   assert.ok(locale.onboarding[key]?.trim(),key);
  }
 }
 assert.match(messages.en.onboarding.marriageOnlyInfo,/marriage.*not casual dating/i);
 assert.match(messages.en.onboarding.timeline,/married/i);
 assert.match(messages.en.onboarding.spouseQualities,/spouse/i);
 assert.match(messages.en.onboarding.optionalDetails,/height/i);
});
test('legacy dating preferences survive drafting without becoming mandatory',()=>{
 const older=parseOnboardingDraft({...basic,lookingFor:'long-term',relationshipTimeline:'exploring',partnershipStyle:'Respect and trust',reviewConfirmed:true});
 assert.deepEqual(validateForPublish(older),[]);
 const patch=profilePatchFromDraft(older);
 assert.equal(patch.relationship_intentions.lookingFor,'long-term');
 assert.equal(patch.relationship_intentions.relationshipTimeline,'exploring');
});

