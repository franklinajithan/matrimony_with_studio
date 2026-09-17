import { strict as assert } from 'node:assert';
import { getPlan } from './plans';
import { usageDecision } from './usage';
assert.equal(usageDecision(getPlan('free').entitlements,'interestsPerMonth',9).allowed,true);
assert.equal(usageDecision(getPlan('free').entitlements,'interestsPerMonth',10).allowed,false);
assert.equal(usageDecision(getPlan('premium').entitlements,'interestsPerMonth',999).allowed,true);
assert.equal(usageDecision(getPlan('premium_plus').entitlements,'profileBoostsPerMonth',4).allowed,false);
