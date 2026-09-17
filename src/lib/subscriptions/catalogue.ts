import { PLANS, type PlanCode } from './plans';
export const PLAN_ORDER:PlanCode[]=['free','premium','premium_plus'];
export const orderedPlans=()=>PLAN_ORDER.map(code=>PLANS[code]);
