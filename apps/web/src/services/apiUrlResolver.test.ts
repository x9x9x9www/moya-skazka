import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildApiUrlCandidates,
  extractExplicitApiUrl,
  getApiUrlCandidates,
  isApiUrlFailed,
  isRetryableApiFailure,
  markApiUrlFailed,
  normalizeApiUrl,
  rememberApiUrl,
  resetBadApiUrls,
  resolveConfiguredApiUrl,
} from './apiUrlResolver';

afterEach(() => {
  resetBadApiUrls();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('API URL resolver', () => {
  it('normalizes http(s) origins and rejects unsafe schemes or embedded credentials', () => {
    expect(normalizeApiUrl(' https://bridge.example/api/ ')).toBe('https://bridge.example/api');
    expect(normalizeApiUrl('javascript:alert(1)')).toBe('');
    expect(normalizeApiUrl('https://user:pass@bridge.example')).toBe('');
  });

  it('extracts api_url from search, Telegram hash and start_param', () => {
    expect(extractExplicitApiUrl('?api_url=https%3A%2F%2Fquery.example', '', null)).toBe('https://query.example');
    expect(extractExplicitApiUrl('', '#tgWebAppData=x&api_url=https%3A%2F%2Fhash.example', null)).toBe('https://hash.example');
    expect(extractExplicitApiUrl('', '', 'https://telegram.example/path/')).toBe('https://telegram.example/path');
  });

  it('orders local, explicit, fresh manifest, cached, and default candidates without duplicates', () => {
    expect(buildApiUrlCandidates({
      localUrls: ['http://localhost:4040/'],
      manifestUrl: 'https://fresh.example/',
      explicitUrl: 'https://explicit.example',
      cachedUrl: 'https://explicit.example/',
      defaultUrl: 'https://default.example',
    })).toEqual([
      'http://localhost:4040',
      'https://explicit.example',
      'https://fresh.example',
      'https://default.example',
    ]);
  });

  it('uses the bridge-specific build setting before the legacy API setting', () => {
    expect(resolveConfiguredApiUrl('https://amvera.example', 'https://legacy.example')).toBe('https://amvera.example');
    expect(resolveConfiguredApiUrl('', 'https://legacy.example')).toBe('https://legacy.example');
    expect(resolveConfiguredApiUrl('', '')).toBe('');
  });

  it('fetches a fresh manifest with no-store and puts explicit URL before manifest and cached URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://manifest.example' }),
    });
    const storage = { getItem: vi.fn(() => 'https://cached.example'), setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal('window', {
      location: { search: '?api_url=https%3A%2F%2Famvera.example', hash: '', hostname: 'app.example', pathname: '/moya-skazka/', origin: 'https://app.example' },
      Telegram: { WebApp: { initDataUnsafe: {} } },
    });
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('fetch', fetchMock);

    await expect(getApiUrlCandidates('https://default.example')).resolves.toEqual([
      'https://amvera.example', 'https://manifest.example', 'https://cached.example', 'https://default.example',
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/moya-skazka\/active_tunnel\.json\?_t=/), { cache: 'no-store' });
  });

  it('uses same-origin only in VPS mode without requesting the tunnel manifest', async () => {
    vi.doMock('./runtimeConfig', () => ({ isSameOriginApi: () => true }));
    await vi.resetModules();
    const { getApiUrlCandidates: getVpsCandidates } = await import('./apiUrlResolver');
    vi.doUnmock('./runtimeConfig');
    const fetchMock = vi.fn();
    vi.stubGlobal('window', {
      location: { search: '?api_url=https%3A%2F%2Fstale.example', hash: '', hostname: 'app.example', pathname: '/', origin: 'https://app.example' },
      Telegram: { WebApp: { initDataUnsafe: { start_param: 'https://telegram-stale.example' } } },
    });
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'https://cached.example'), setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getVpsCandidates('https://build-default.example')).resolves.toEqual(['']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads the manifest from the app root on a nested page path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://manifest.example' }),
    });
    vi.stubGlobal('window', {
      location: { search: '', hash: '', hostname: 'x9x9x9www.github.io', pathname: '/moya-skazka/admin/settings', origin: 'https://x9x9x9www.github.io' },
      Telegram: { WebApp: { initDataUnsafe: {} } },
    });
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal('fetch', fetchMock);

    await getApiUrlCandidates('https://default.example');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/moya-skazka\/active_tunnel\.json\?_t=/), { cache: 'no-store' });
  });

  it('retries transport failures, server errors, and invalid JSON responses', () => {
    expect(isRetryableApiFailure(undefined, new TypeError('Failed to fetch'))).toBe(true);
    expect(isRetryableApiFailure(undefined, { name: 'AbortError' })).toBe(true);
    expect(isRetryableApiFailure(undefined, new SyntaxError('Unexpected token <'))).toBe(true);
    expect(isRetryableApiFailure(404, new TypeError('Failed to fetch'))).toBe(false);
    expect(isRetryableApiFailure(404)).toBe(false);
    expect(isRetryableApiFailure(503)).toBe(true);
    expect(isRetryableApiFailure(401)).toBe(false);
    expect(isRetryableApiFailure(403)).toBe(false);
  });

  it('fails over away from failed endpoint and remembers a successful candidate', () => {
    markApiUrlFailed('https://old.example/');
    expect(isApiUrlFailed('https://old.example')).toBe(true);
    expect(buildApiUrlCandidates({ manifestUrl: 'https://old.example', explicitUrl: 'https://next.example' }))
      .toEqual(['https://next.example']);

    rememberApiUrl('https://next.example/');
    expect(isApiUrlFailed('https://next.example')).toBe(false);
  });
});
