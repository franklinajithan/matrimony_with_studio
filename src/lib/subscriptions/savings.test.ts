import { strict as assert } from 'node:assert';
import { savingsPence } from './savings';
assert.equal(savingsPence('premium','three_months'),398);
assert.equal(savingsPence('premium_plus','three_months'),998);
