import type { PlanCode } from './plans';
const RANK:Record<PlanCode,number>={free:0,premium:1,premium_plus:2};
export const isUpgrade=(from:PlanCode,to:PlanCode)=>RANK[to]>RANK[from];
