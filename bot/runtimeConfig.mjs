import path from 'node:path';

export const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  'https://x9x9x9www.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]);

export function parsePort(value, fallback = 4040) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new RangeError('PORT must be an integer between 1 and 65535');
  }
  return parsed;
}

export function resolveRuntimeConfig({ env = process.env, botDir }) {
  if (!botDir) throw new TypeError('botDir is required');
  const root = path.resolve(botDir);
  const dataDir = path.resolve(root, env.BOT_DATA_DIR || 'data');
  const dbFile = env.BOT_DB_FILE
    ? path.resolve(root, env.BOT_DB_FILE)
    : path.join(dataDir, 'db.json');
  const generatedDir = path.resolve(root, env.BOT_GENERATED_DIR || 'generated');

  return {
    port: parsePort(env.PORT),
    dataDir: env.BOT_DATA_DIR ? dataDir : path.dirname(dbFile),
    dbFile,
    generatedDir,
  };
}

function normalizeOrigin(value) {
  const origin = value.trim();
  if (!origin || origin === '*') {
    throw new TypeError('CORS_ALLOWED_ORIGINS must contain explicit http(s) origins, not a wildcard');
  }

  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new TypeError(`Invalid CORS origin: ${origin}`);
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new TypeError(`CORS value must be an origin without credentials, path, query, or fragment: ${origin}`);
  }
  return parsed.origin;
}

export function getAllowedOrigins(env = process.env) {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  const configured = env.CORS_ALLOWED_ORIGINS || '';
  for (const item of configured.split(',')) {
    if (item.trim()) origins.add(normalizeOrigin(item));
  }
  return origins;
}

export function buildCorsHeaders(origin, allowedOrigins) {
  const allowed = Boolean(origin && allowedOrigins.has(origin));
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma, X-Telegram-Init-Data, X-User-Id',
  };
}
