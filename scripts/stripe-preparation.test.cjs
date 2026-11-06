const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { load } = require('./helpers/load-ts.cjs');
const { stripeConfiguration } = load('src/lib/subscriptions/stripe-configuration.ts');
const { verifyStripeWebhookSignature } = load('src/lib/subscriptions/stripe-webhook-signature.ts');

test('missing secrets and prices are never accepted as checkout-ready', () => {
  const unset = stripeConfiguration({});
  assert.equal(unset.configured, false);
  assert.equal(unset.checkoutEnabled, false);
  assert.equal(unset.automaticActivationEnabled, false);
  const configured = stripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_PLUS_MONTHLY: 'price_plus123', STRIPE_PRICE_PREMIUM_MONTHLY: 'price_premium123',
  });
  assert.equal(configured.mode, 'test');
  assert.equal(configured.configured, true);
  assert.equal(configured.checkoutEnabled, false);
  assert.equal(configured.automaticActivationEnabled, false);
  assert.equal(JSON.stringify(configured).includes('sk_test'), false);
  assert.equal(stripeConfiguration({
    STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_PLUS_MONTHLY: 'price_same123', STRIPE_PRICE_PREMIUM_MONTHLY: 'price_same123',
  }).configured, false);
});
test('signature verification requires authentic raw body and fresh timestamp', () => {
  const secret = 'whsec_testsecret';
  const timestamp = 1793959200;
  const body = '{"id":"evt_123","type":"checkout.session.completed"}';
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(verifyStripeWebhookSignature(body, header, secret, timestamp), true);
  assert.equal(verifyStripeWebhookSignature(body + ' ', header, secret, timestamp), false);
  assert.equal(verifyStripeWebhookSignature(body, header, secret, timestamp + 301), false);
  assert.equal(verifyStripeWebhookSignature(body, 't=bad,v1=' + signature, secret, timestamp), false);
  assert.equal(verifyStripeWebhookSignature(body, header, 'whsec_wrong', timestamp), false);
});
