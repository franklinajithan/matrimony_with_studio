import { strict as assert } from 'node:assert';
import { billingProviderCapabilities } from './provider';
const c=billingProviderCapabilities();assert.equal(c.checkout,false);assert.equal(c.webhook,false);assert.equal(c.customerPortal,false);
