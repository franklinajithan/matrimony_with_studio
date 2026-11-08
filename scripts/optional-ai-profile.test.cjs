const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const saved={GEMINI_API_KEY:process.env.GEMINI_API_KEY,GOOGLE_API_KEY:process.env.GOOGLE_API_KEY};
after(()=>{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
test('member profile AI suggestions do not initialize Genkit when API keys are absent',async()=>{
 delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_API_KEY;
 let initialized=0;
 const api=load('src/ai/flows/intelligent-match-suggestions.ts',{
  genkit:{z:require('zod')},
  '@/ai/genkit':{ai:{definePrompt:()=>{initialized++;throw Error('optional provider unavailable');},defineFlow:()=>{initialized++;throw Error('unexpected flow');}}}
 });
 assert.deepEqual(await api.intelligentMatchSuggestions({}),[]);
 assert.equal(initialized,0);
});
test('invalid optional AI provider fails gracefully without breaking profile viewing',async()=>{
 process.env.GEMINI_API_KEY='synthetic-invalid-key';
 delete process.env.GOOGLE_API_KEY;
 const api=load('src/ai/flows/intelligent-match-suggestions.ts',{
  genkit:{z:require('zod')},
  '@/ai/genkit':{ai:{definePrompt:()=>{throw Error('synthetic provider unavailable');}}}
 });
 assert.deepEqual(await api.intelligentMatchSuggestions({}),[]);
});
