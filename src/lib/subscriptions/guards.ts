import 'server-only';
import type { EntitlementKey } from './entitlements';
import { getServerSubscription } from './server';

function isGranted(value: boolean | number | null) {return typeof value==='boolean'?value:value===null||value>0;}
export async function requireEntitlement(feature: EntitlementKey) {
  const result = await getServerSubscription();
  if (!result.user) return { ok: false as const, status: 401, ...result };
  if (!isGranted(result.plan.entitlements[feature])) return { ok: false as const, status: 403, ...result };
  return { ok: true as const, status: 200, ...result };
}
