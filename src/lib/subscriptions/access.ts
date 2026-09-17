import { getPlan, type PlanCode } from './plans';
export function accessSnapshot(plan:PlanCode){const p=getPlan(plan);return {plan:p.code,entitlements:p.entitlements,prices:p.pricesPence};}
