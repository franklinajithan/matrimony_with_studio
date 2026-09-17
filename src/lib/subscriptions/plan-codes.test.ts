import { strict as assert } from 'node:assert';
import { PLANS } from './plans';
assert.deepEqual(Object.keys(PLANS),['free','premium','premium_plus']);
