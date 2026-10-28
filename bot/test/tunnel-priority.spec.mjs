import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldActivateTunnel } from '../tunnelPriority.mjs';

test('первый туннель активируется', () => {
  assert.equal(shouldActivateTunnel('serveo', ''), true);
  assert.equal(shouldActivateTunnel('localtunnel', ''), true);
});

test('localtunnel важнее localhost_run', () => {
  assert.equal(shouldActivateTunnel('localtunnel', 'localhost_run'), true);
  assert.equal(shouldActivateTunnel('localhost_run', 'localtunnel'), false);
});

test('явный PUBLIC_BRIDGE_URL важнее любых туннелей', () => {
  assert.equal(shouldActivateTunnel('env', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'env'), false);
});

test('serveo важнее pinggy и localtunnel', () => {
  assert.equal(shouldActivateTunnel('serveo', 'pinggy'), true);
  assert.equal(shouldActivateTunnel('serveo', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('pinggy', 'serveo'), false);
  assert.equal(shouldActivateTunnel('localtunnel', 'serveo'), false);
});

test('cloudflare важнее serveo, pinggy и localtunnel', () => {
  assert.equal(shouldActivateTunnel('cloudflare', 'serveo'), true);
  assert.equal(shouldActivateTunnel('cloudflare', 'pinggy'), true);
  assert.equal(shouldActivateTunnel('cloudflare', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('serveo', 'cloudflare'), false);
  assert.equal(shouldActivateTunnel('pinggy', 'cloudflare'), false);
  assert.equal(shouldActivateTunnel('localtunnel', 'cloudflare'), false);
});

test('повторный URL того же источника не блокируется', () => {
  assert.equal(shouldActivateTunnel('localtunnel', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('serveo', 'serveo'), true);
  assert.equal(shouldActivateTunnel('pinggy', 'pinggy'), true);
  assert.equal(shouldActivateTunnel('cloudflare', 'cloudflare'), true);
});
