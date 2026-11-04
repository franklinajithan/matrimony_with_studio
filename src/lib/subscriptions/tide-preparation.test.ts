import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePremiumTrialEnd, tidePaymentReadiness } from './tide-preparation';

describe('Tide integration preparation', () => {
  it('fails closed without verified payment integration', () => {
    const state = tidePaymentReadiness();
    assert.equal(state.enabled, false);
    assert.equal(state.checkoutAvailable, false);
    assert.equal(state.automaticActivationAvailable, false);
    assert.equal(state.recurringBillingAvailable, false);
    assert.equal(state.premiumTrialMonths, 2);
  });
  it('uses two calendar months and clamps month-end dates', () => {
    assert.equal(calculatePremiumTrialEnd(new Date('2026-11-04T12:00:00Z')).toISOString(), '2027-01-04T12:00:00.000Z');
    assert.equal(calculatePremiumTrialEnd(new Date('2026-12-31T09:00:00Z')).toISOString(), '2027-02-28T09:00:00.000Z');
  });
  it('rejects invalid dates', () => assert.throws(() => calculatePremiumTrialEnd(new Date('invalid')), TypeError));
});
