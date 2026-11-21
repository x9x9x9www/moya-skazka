import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { preloadImage, preloadImages, isImagePreloaded } from './imagePreloader';

describe('imagePreloader', () => {
  const originalWindow = (global as any).window;
  const originalImage = (global as any).Image;

  beforeEach(() => {
    vi.restoreAllMocks();
    (global as any).window = global;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    (global as any).Image = originalImage;
  });

  it('handles empty and null URLs gracefully', async () => {
    expect(isImagePreloaded('')).toBe(false);
    expect(isImagePreloaded(null)).toBe(false);
    expect(isImagePreloaded(undefined)).toBe(false);

    await expect(preloadImage('')).resolves.toBeUndefined();
    await expect(preloadImage(null)).resolves.toBeUndefined();
    await expect(preloadImages([])).resolves.toEqual([]);
  });

  it('marks image as preloaded on successful load', async () => {
    const testUrl = 'https://example.com/test-scene-1.webp';
    expect(isImagePreloaded(testUrl)).toBe(false);

    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      complete = false;
      private _src = '';

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          this.complete = true;
          if (this.onload) this.onload();
        }, 5);
      }

      get src() {
        return this._src;
      }
    };

    await preloadImage(testUrl);
    expect(isImagePreloaded(testUrl)).toBe(true);
  });

  it('handles preload error gracefully without rejecting', async () => {
    const badUrl = 'https://example.com/broken.webp';

    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      complete = false;

      set src(_value: string) {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 5);
      }
    };

    await expect(preloadImage(badUrl)).resolves.toBeUndefined();
  });
});
