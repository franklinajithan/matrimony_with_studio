import 'server-only';
import type { EntitlementKey } from './entitlements';
import { hasEntitlement } from './entitlements';
import { getServerSubscription } from './server';

export async function requireEntitlement(feature: EntitlementKey) {
  const result = await getServerSubscription();
  if (!result.user) return { ok: false as const, status: 401, ...result };
  if (!hasEntitlement(result.plan.code, feature)) return { ok: false as const, status: 403, ...result };
  return { ok: true as const, status: 200, ...result };
}
