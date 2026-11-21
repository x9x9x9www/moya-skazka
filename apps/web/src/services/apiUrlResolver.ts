import { isSameOriginApi } from './runtimeConfig';

export interface ApiUrlSources {
  manifestUrl?: string | null;
  explicitUrl?: string | null;
  cachedUrl?: string | null;
  defaultUrl?: string | null;
  localUrls?: string[];
}

export function resolveConfiguredApiUrl(bridgeUrl?: string, apiUrl?: string): string {
  return bridgeUrl || apiUrl || '';
}

const FAILED_URL_TTL_MS = 30_000;
const failedApiUrls = new Map<string, number>();
let latestManifestUrl = '';

export function isRetryableApiFailure(status?: number, error?: unknown): boolean {
  if (status !== undefined) return status >= 500;
  const name = (error as { name?: string } | null)?.name;
  return error instanceof TypeError || name === 'AbortError' || name === 'SyntaxError';
}

export function normalizeApiUrl(value?: string | null): string {
  if (!value) return '';
  const clean = value.trim().replace(/\/+$/, '');
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password) return '';
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export function extractExplicitApiUrl(
  search: string,
  hash: string,
  telegramStartParam?: string | null
): string {
  const searchParams = new URLSearchParams(search);
  let candidate = searchParams.get('api_url');
  if (!candidate && hash) {
    const hashClean = hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hashClean.includes('?') ? hashClean.slice(hashClean.indexOf('?') + 1) : hashClean);
    candidate = hashParams.get('api_url');
    if (!candidate) {
      const startParam = hashParams.get('tgWebAppStartParam') || hashParams.get('start_param');
      if (startParam?.startsWith('http://') || startParam?.startsWith('https://')) candidate = startParam;
    }
  }
  if (!candidate && (telegramStartParam?.startsWith('http://') || telegramStartParam?.startsWith('https://'))) {
    candidate = telegramStartParam;
  }
  return normalizeApiUrl(candidate);
}

export function buildApiUrlCandidates(sources: ApiUrlSources): string[] {
  const candidates = [
    ...(sources.localUrls || []),
    sources.explicitUrl,
    sources.manifestUrl,
    sources.cachedUrl,
    sources.defaultUrl,
  ];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of candidates) {
    const url = normalizeApiUrl(value);
    const failedAt = url ? failedApiUrls.get(url) : undefined;
    if (!url || seen.has(url) || (failedAt && Date.now() - failedAt < FAILED_URL_TTL_MS)) continue;
    if (failedAt) failedApiUrls.delete(url);
    seen.add(url);
    result.push(url);
  }
  return result;
}

export function markApiUrlFailed(url?: string | null): void {
  const clean = normalizeApiUrl(url);
  if (!clean) return;
  failedApiUrls.set(clean, Date.now());
  try {
    if (typeof localStorage !== 'undefined' && normalizeApiUrl(localStorage.getItem('ms_api_url')) === clean) {
      localStorage.removeItem('ms_api_url');
    }
  } catch {}
}

export function rememberApiUrl(url?: string | null): void {
  const clean = normalizeApiUrl(url);
  if (!clean) return;
  failedApiUrls.delete(clean);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ms_api_url', clean);
  } catch {}
}

export function resetBadApiUrls(): void {
  failedApiUrls.clear();
}

export function getLatestManifestApiUrl(): string {
  return latestManifestUrl;
}

export function isApiUrlFailed(url?: string | null): boolean {
  const clean = normalizeApiUrl(url);
  const failedAt = clean ? failedApiUrls.get(clean) : undefined;
  if (!clean || !failedAt) return false;
  if (Date.now() - failedAt >= FAILED_URL_TTL_MS) {
    failedApiUrls.delete(clean);
    return false;
  }
  return true;
}

export async function getApiUrlCandidates(defaultUrl = ''): Promise<string[]> {
  if (typeof window === 'undefined') return buildApiUrlCandidates({ defaultUrl });
  if (isSameOriginApi()) {
    latestManifestUrl = '';
    return [''];
  }

  let telegramStartParam: string | null = null;
  try {
    const value = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (typeof value === 'string') telegramStartParam = value;
  } catch {}
  const explicitUrl = extractExplicitApiUrl(window.location.search, window.location.hash, telegramStartParam);
  let cachedUrl = '';
  try {
    cachedUrl = localStorage.getItem('ms_api_url') || '';
  } catch {}

  let manifestUrl = '';
  latestManifestUrl = '';
  try {
    const path = window.location.pathname;
    const pageBase = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
    const project = window.location.hostname.endsWith('.github.io') ? path.split('/').filter(Boolean)[0] : '';
    const manifestPath = project ? `/${project}/active_tunnel.json` : `${pageBase}active_tunnel.json`;
    const manifestRequestUrl = new URL(`${manifestPath}?_t=${Date.now()}`, window.location.origin).toString();
    const response = await fetch(manifestRequestUrl, { cache: 'no-store' });
    if (response.ok) {
      const payload = await response.json();
      manifestUrl = typeof payload?.url === 'string' ? payload.url : '';
      latestManifestUrl = normalizeApiUrl(manifestUrl);
    }
  } catch {}

  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const localUrls = isLocalDev ? ['http://localhost:4040', 'http://127.0.0.1:4040'] : [];

  const candidates = buildApiUrlCandidates({ manifestUrl, explicitUrl, cachedUrl, defaultUrl, localUrls });
  if (isLocalDev) candidates.push('');
  return candidates;
}
