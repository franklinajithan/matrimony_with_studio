import { strict as assert } from 'node:assert';
import { effectivePlanCode, hasSubscriptionEntitlement, withinMonthlyLimit } from './entitlements';

assert.equal(effectivePlanCode(null), 'free');
assert.equal(effectivePlanCode({ planCode: 'premium', status: 'pending' }), 'free');
assert.equal(effectivePlanCode({ planCode: 'premium', status: 'active' }), 'premium');
assert.equal(effectivePlanCode({ planCode: 'premium_plus', status: 'trialing' }), 'premium_plus');
assert.equal(effectivePlanCode({ planCode: 'premium_plus', status: 'active', currentPeriodEnd: '2000-01-01T00:00:00Z' }), 'free');
assert.equal(hasSubscriptionEntitlement({ planCode: 'premium_plus', status: 'active' }, 'incognitoMode'), true);
assert.equal(hasSubscriptionEntitlement({ planCode: 'premium', status: 'active' }, 'incognitoMode'), false);
assert.equal(withinMonthlyLimit(10, 9), true);
assert.equal(withinMonthlyLimit(10, 10), false);
assert.equal(withinMonthlyLimit(null, 100000), true);
