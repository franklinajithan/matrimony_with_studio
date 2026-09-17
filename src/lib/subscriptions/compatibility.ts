import type { PlanCode } from './plans';
export function normalizeLegacyPlan(code?:string|null):PlanCode{if(code==='plus')return 'premium';if(code==='premium_plus')return 'premium_plus';if(code==='premium')return 'premium';return 'free';}
