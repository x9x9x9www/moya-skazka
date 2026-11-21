import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppUrlWithApi } from '../appUrls.mjs';

test('VPS Mini App links use the configured stable same-origin bridge', () => {
  const config = {
    webAppBaseUrl: 'https://stories.example.com/',
    skipTunnels: true,
    publicBridgeUrl: 'https://stories.example.com',
    publicTunnelUrl: 'https://persisted-stale-tunnel.example',
  };

  assert.equal(
    buildAppUrlWithApi({ ...config, apiUrl: 'https://stale-tunnel.example' }),
    'https://stories.example.com/?api_url=https%3A%2F%2Fstories.example.com'
  );
  assert.equal(
    buildAppUrlWithApi({ ...config, apiUrl: 'https://stale-tunnel.example', isAdmin: true }),
    'https://stories.example.com/?api_url=https%3A%2F%2Fstories.example.com&admin=1'
  );
});

test('development links keep an explicitly provided tunnel target', () => {
  assert.equal(
    buildAppUrlWithApi({
      webAppBaseUrl: 'https://app.example/?v=4.4',
      apiUrl: 'https://dev-tunnel.example',
      skipTunnels: false,
      publicBridgeUrl: 'https://stable-bridge.example',
    }),
    'https://app.example/?v=4.4&api_url=https%3A%2F%2Fdev-tunnel.example'
  );
});
