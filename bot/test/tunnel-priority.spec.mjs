import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldActivateTunnel } from '../tunnelPriority.mjs';

test('первый туннель активируется', () => {
  assert.equal(shouldActivateTunnel('serveo', ''), true);
  assert.equal(shouldActivateTunnel('localtunnel', ''), true);
});

test('cloudflare важнее serveo и localtunnel', () => {
  assert.equal(shouldActivateTunnel('cloudflare', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('cloudflare', 'serveo'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'cloudflare'), false);
});

test('явный PUBLIC_BRIDGE_URL важнее любых туннелей', () => {
  assert.equal(shouldActivateTunnel('env', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'env'), false);
});

test('повторный URL того же источника не блокируется', () => {
  assert.equal(shouldActivateTunnel('localtunnel', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('serveo', 'serveo'), true);
});
