import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_ALLOWED_ORIGINS,
  buildCorsHeaders,
  getAllowedOrigins,
  parsePort,
  resolveRuntimeConfig,
} from '../runtimeConfig.mjs';

test('runtime config preserves local defaults and accepts platform port and persistent paths', () => {
  const botDir = path.join(os.tmpdir(), 'moya-skazka-bot');
  assert.deepEqual(resolveRuntimeConfig({ env: {}, botDir }), {
    port: 4040,
    dataDir: path.join(botDir, 'data'),
    dbFile: path.join(botDir, 'data', 'db.json'),
    generatedDir: path.join(botDir, 'generated'),
  });

  assert.deepEqual(resolveRuntimeConfig({
    env: {
      PORT: '8080',
      BOT_DATA_DIR: '/tmp/moya-data',
      BOT_DB_FILE: '/tmp/moya-data/custom.json',
      BOT_GENERATED_DIR: '/tmp/moya-data/generated',
    },
    botDir,
  }), {
    port: 8080,
    dataDir: path.resolve('/tmp/moya-data'),
    dbFile: path.resolve('/tmp/moya-data/custom.json'),
    generatedDir: path.resolve('/tmp/moya-data/generated'),
  });
});

test('parsePort rejects invalid listen ports', () => {
  for (const value of ['0', '-1', '65536', 'nope', '1.5']) {
    assert.throws(() => parsePort(value), RangeError);
  }
  assert.equal(parsePort(undefined), 4040);
});

test('CORS retains known origins and accepts only explicit http(s) origins', () => {
  const allowed = getAllowedOrigins({ CORS_ALLOWED_ORIGINS: 'https://beta.example/, http://localhost:5174' });
  assert.ok(DEFAULT_ALLOWED_ORIGINS.every((origin) => allowed.has(origin)));
  assert.ok(allowed.has('https://beta.example'));
  assert.ok(allowed.has('http://localhost:5174'));
  assert.throws(() => getAllowedOrigins({ CORS_ALLOWED_ORIGINS: '*' }), /wildcard/);
  assert.throws(() => getAllowedOrigins({ CORS_ALLOWED_ORIGINS: 'https://beta.example/path' }), /origin/);
  assert.throws(() => getAllowedOrigins({ CORS_ALLOWED_ORIGINS: 'file://beta.example' }), /origin/);
});

test('CORS response reflects only an allowlisted origin', () => {
  const allowed = getAllowedOrigins({});
  assert.equal(buildCorsHeaders('https://x9x9x9www.github.io', allowed)['Access-Control-Allow-Origin'], 'https://x9x9x9www.github.io');
  assert.equal(buildCorsHeaders('https://attacker.example', allowed)['Access-Control-Allow-Origin'], undefined);
});
