import type { PlanCode } from './plans';
const RANK:Record<PlanCode,number>={free:0,plus:1,premium:2,premium_plus:3};
export const isUpgrade=(from:PlanCode,to:PlanCode)=>RANK[to]>RANK[from];
