import { strict as assert } from 'node:assert';
import { test, vi } from 'vitest';
import { billingProviderCapabilities } from './provider';
test('billing capabilities remain unavailable while billing is disabled', () => {
 vi.stubEnv('BILLING_ENABLED','false');
 try { const c=billingProviderCapabilities();assert.equal(c.checkout,false);assert.equal(c.webhook,false);assert.equal(c.customerPortal,false); }
 finally { vi.unstubAllEnvs(); }
});
