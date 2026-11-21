/**
 * Утилита предварительной загрузки (Preloading) картинок в кэш браузера.
 * Позволяет отображать иллюстрации сцен и аватары моментально (0 мс задержки),
 * без белых экранов и без долгих спиннеров при перелистывании страниц.
 */

const preloadedUrls = new Set<string>();

export function preloadImage(url?: string | null): Promise<void> {
  if (!url || typeof window === 'undefined') {
    return Promise.resolve();
  }
  const cleanUrl = url.trim();
  if (!cleanUrl || preloadedUrls.has(cleanUrl)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadedUrls.add(cleanUrl);
      resolve();
    };
    img.onerror = () => {
      // Даже при ошибке разрешаем промис, чтобы не блокировать цепочку
      resolve();
    };
    img.src = cleanUrl;
    if (img.complete) {
      preloadedUrls.add(cleanUrl);
      resolve();
    }
  });
}

export function preloadImages(urls: Array<string | null | undefined>): Promise<void[]> {
  const valid = urls.filter((u): u is string => Boolean(u && typeof u === 'string'));
  return Promise.all(valid.map((u) => preloadImage(u)));
}

export function isImagePreloaded(url?: string | null): boolean {
  if (!url) return false;
  return preloadedUrls.has(url.trim());
}
