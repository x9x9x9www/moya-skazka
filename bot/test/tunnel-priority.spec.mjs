import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldActivateTunnel } from '../tunnelPriority.mjs';

test('первый туннель активируется', () => {
  assert.equal(shouldActivateTunnel('serveo', ''), true);
  assert.equal(shouldActivateTunnel('localtunnel', ''), true);
});

test('localtunnel важнее localhost_run и serveo', () => {
  assert.equal(shouldActivateTunnel('localtunnel', 'localhost_run'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'serveo'), true);
  assert.equal(shouldActivateTunnel('localhost_run', 'localtunnel'), false);
});

test('явный PUBLIC_BRIDGE_URL важнее любых туннелей', () => {
  assert.equal(shouldActivateTunnel('env', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'env'), false);
});

test('pinggy важнее localtunnel и serveo', () => {
  assert.equal(shouldActivateTunnel('pinggy', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('pinggy', 'serveo'), true);
  assert.equal(shouldActivateTunnel('localtunnel', 'pinggy'), false);
});

test('повторный URL того же источника не блокируется', () => {
  assert.equal(shouldActivateTunnel('localtunnel', 'localtunnel'), true);
  assert.equal(shouldActivateTunnel('serveo', 'serveo'), true);
  assert.equal(shouldActivateTunnel('pinggy', 'pinggy'), true);
});
