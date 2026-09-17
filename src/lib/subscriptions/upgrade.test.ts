import { strict as assert } from 'node:assert';
import { isUpgrade } from './upgrade';
assert.equal(isUpgrade('free','premium'),true);
assert.equal(isUpgrade('premium','premium_plus'),true);
assert.equal(isUpgrade('premium_plus','premium'),false);
