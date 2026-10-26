import { useEffect, useState } from 'react';

export type ReaderFontSize = 'small' | 'medium' | 'large';
export type ReaderTheme = 'warm' | 'light' | 'dark';
export type ReaderMusic = 'calm' | 'fairy' | 'forest' | 'off';

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  theme: ReaderTheme;
  showQuestions: boolean;
  autoPlay: boolean;
  music: ReaderMusic;
}

const STORAGE_KEY = 'moya_skazka_reader_settings';

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontSize: 'medium',
      theme: 'warm',
      showQuestions: true,
      autoPlay: false,
      music: 'calm',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}

    // Глобальная синхронизация темы со всей страницей и Telegram WebApp
    const theme = settings.theme || 'warm';
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    // Сбрасываем старые классы тем
    ['theme-warm', 'theme-light', 'theme-dark'].forEach((cls) => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });

    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);

    // Tailwind dark: класс
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    // Telegram WebApp цвета шапки и фона
    const headerColor = theme === 'dark' ? '#12131A' : theme === 'light' ? '#FFFFFF' : '#FAF6F0';
    const bgColor = theme === 'dark' ? '#12131A' : theme === 'light' ? '#F8FAFC' : '#FAF6F0';

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.setHeaderColor?.(headerColor);
        tg.setBackgroundColor?.(bgColor);
      } catch {}
    }

    // Мета-тег theme-color для браузеров (Safari / Chrome bar)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', headerColor);
    }
  }, [settings]);

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
  };
}
