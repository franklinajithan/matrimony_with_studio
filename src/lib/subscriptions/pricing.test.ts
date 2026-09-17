import { strict as assert } from 'node:assert';
import { getPlanPrice } from './plans';
assert.equal(getPlanPrice('premium','monthly'),799);
assert.equal(getPlanPrice('premium','three_months'),1999);
assert.equal(getPlanPrice('premium','six_months'),3499);
assert.equal(getPlanPrice('premium_plus','monthly'),1499);
assert.equal(getPlanPrice('premium_plus','three_months'),3499);
assert.equal(getPlanPrice('premium_plus','six_months'),5999);
