import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiUrlCandidates, resetBadApiUrls } from './apiUrlResolver';
import { callWellflowStory, generateDynamicStory, getActiveApiUrl, resolveMediaUrl } from './storyGenerator';

const manifestUrl = 'https://fresh-bridge.example';

function stubBrowser(cachedUrl = 'https://stale-bridge.example', search = '') {
  vi.stubGlobal('window', {
    location: {
      search,
      hash: '',
      hostname: 'x9x9x9www.github.io',
      pathname: '/moya-skazka/',
      origin: 'https://x9x9x9www.github.io',
    },
    Telegram: { WebApp: { initDataUnsafe: {} } },
  });
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => key === 'ms_api_url' ? cachedUrl : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
}

function manifestResponse() {
  return {
    ok: true,
    json: async () => ({ url: manifestUrl }),
  } as Response;
}

afterEach(() => {
  resetBadApiUrls();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('story generation network behavior', () => {
  it('uses the latest manifest for synchronous media URL resolution ahead of stale cache', async () => {
    stubBrowser();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(manifestResponse()));

    await getApiUrlCandidates('https://default-bridge.example');

    expect(getActiveApiUrl()).toBe(manifestUrl);
  });

  it('fails over from an explicit bridge returning HTML to the manifest bridge', async () => {
    stubBrowser('https://stale-cache.example', '?api_url=https%3A%2F%2Fstale-explicit.example');
    const urls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('/active_tunnel.json')) return manifestResponse();
      if (url.startsWith(`${manifestUrl}/api/v1/ai/generate-story`)) {
        return {
          ok: true,
          status: 202,
          json: async () => ({ jobId: 'story_manifest', status: 'pending' }),
        } as Response;
      }
      if (url.startsWith(`${manifestUrl}/api/v1/ai/job-status`)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ready', story: { id: 'book_manifest', scenes: [{ text: 'scene' }] } }),
        } as Response;
      }
      if (url.startsWith('https://stale-explicit.example/api/v1/ai/generate-story')) {
        return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } } as unknown as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await callWellflowStory({
      userId: 'user-test', childName: 'Миша', age: 5, gender: 'boy', theme: 'Космос',
      interests: ['Звёзды'], personality: 'Добрый', includeQuestions: true, format: 'ILLUSTRATED',
    }, 5000);

    expect(result.id).toBe('book_manifest');
    expect(urls.findIndex((url) => url.startsWith('https://stale-explicit.example/api/v1/ai/generate-story')))
      .toBeLessThan(urls.findIndex((url) => url.startsWith(`${manifestUrl}/api/v1/ai/generate-story`)));
  });

  it('does not retry an HTTP 4xx response on another bridge', async () => {
    stubBrowser('https://stale-cache.example', '?api_url=https%3A%2F%2Famvera.example');
    const urls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('/active_tunnel.json')) return manifestResponse();
      if (url.startsWith('https://amvera.example/api/v1/ai/generate-story')) {
        return { ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) } as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(callWellflowStory({
      userId: 'user-test', childName: 'Миша', age: 5, gender: 'boy', theme: 'Космос',
      interests: ['Звёзды'], personality: 'Добрый', includeQuestions: true, format: 'ILLUSTRATED',
    }, 5000)).rejects.toThrow('Сервер генерации ответил с кодом 401');
    expect(urls.filter((url) => url.includes('/api/v1/ai/generate-story'))).toHaveLength(1);
  });

  it('uses relative media and story endpoints in VPS same-origin mode', async () => {
    vi.doMock('./runtimeConfig', () => ({ isSameOriginApi: () => true }));
    await vi.resetModules();
    const { callWellflowStory: callVpsStory, getActiveApiUrl: getVpsApiUrl, resolveMediaUrl: resolveVpsMediaUrl } = await import('./storyGenerator');
    vi.doUnmock('./runtimeConfig');
    stubBrowser('https://stale-bridge.example');
    (window as any).location.hostname = 'beta.example';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/ai/generate-story') {
        return {
          ok: true,
          status: 202,
          json: async () => ({ jobId: 'story_same_origin', status: 'pending' }),
        } as Response;
      }
      if (url.startsWith('/api/v1/ai/job-status')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ready', story: { id: 'book_same_origin', scenes: [] } }),
        } as Response;
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    expect(getVpsApiUrl()).toBe('');
    expect(resolveVpsMediaUrl('/media/book/cover.jpg')).toBe('/media/book/cover.jpg');
    const result = await callVpsStory({
      userId: 'user-test', childName: 'Миша', age: 5, gender: 'boy', theme: 'Космос',
      interests: ['Звёзды'], personality: 'Добрый', includeQuestions: true, format: 'ILLUSTRATED',
    }, 5000);

    expect(result.id).toBe('book_same_origin');
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain('/api/v1/ai/generate-story');
  });

  it('does not report a locally generated fallback as a successful server generation', async () => {
    stubBrowser('');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/active_tunnel.json')) return manifestResponse();
      throw new TypeError('Failed to fetch');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateDynamicStory({
      userId: 'user-test',
      childName: 'Миша',
      age: 5,
      gender: 'boy',
      theme: 'Космос',
      interests: ['Звёзды'],
      personality: 'Добрый',
      includeQuestions: true,
      format: 'ILLUSTRATED',
    })).rejects.toThrow('Не удалось связаться с сервером генерации');
  });

  it('fails a missing job without recovering an unrelated latest story', async () => {
    stubBrowser('');
    const urls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('/active_tunnel.json')) return manifestResponse();
      if (url.endsWith('/api/v1/ai/generate-story')) {
        return {
          ok: true,
          status: 202,
          json: async () => ({ jobId: 'story_missing', status: 'pending' }),
        } as Response;
      }
      if (url.includes('/job-status') || url.includes('/ai/job/')) {
        return { ok: false, status: 404, json: async () => ({ status: 'not_found' }) } as Response;
      }
      throw new Error(`Unexpected request: ${init?.method || 'GET'} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(callWellflowStory({
      userId: 'user-test',
      childName: 'Миша',
      age: 5,
      gender: 'boy',
      theme: 'Космос',
      interests: ['Звёзды'],
      personality: 'Добрый',
      includeQuestions: true,
      format: 'ILLUSTRATED',
    }, 5000)).rejects.toThrow('Задача генерации не найдена');

    expect(urls.some((url) => url.includes('/latest-story'))).toBe(false);
  });
});
