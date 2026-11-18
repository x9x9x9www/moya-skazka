import test from 'node:test';
import assert from 'node:assert/strict';
import { createPollingController, createShutdownController } from '../lifecycle.mjs';

test('polling controller prevents more requests and aborts the active poll', () => {
  const polling = createPollingController();
  const active = polling.startRequest();
  assert.ok(active);
  assert.equal(active.signal.aborted, false);

  polling.stop();

  assert.equal(polling.isStopping(), true);
  assert.equal(active.signal.aborted, true);
  assert.equal(polling.startRequest(), null);
});

test('shutdown aborts polling, stops tunnels, closes HTTP, and runs only once', async () => {
  const calls = [];
  const polling = createPollingController();
  const active = polling.startRequest();
  const server = {
    listening: true,
    close(callback) {
      calls.push('close');
      this.listening = false;
      callback();
    },
    closeIdleConnections() {
      calls.push('closeIdleConnections');
    },
  };
  const controller = createShutdownController({
    server,
    abortPolling: () => {
      calls.push('abortPolling');
      polling.stop();
    },
    stopTunnels: () => calls.push('stopTunnels'),
    exit: (code) => calls.push(`exit:${code}`),
    timeoutMs: 20,
  });

  await Promise.all([controller.shutdown('SIGTERM'), controller.shutdown('SIGINT')]);

  assert.equal(polling.isStopping(), true);
  assert.equal(active.signal.aborted, true);
  assert.deepEqual(calls, [
    'abortPolling',
    'stopTunnels',
    'close',
    'closeIdleConnections',
    'exit:0',
  ]);
});
