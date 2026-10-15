import { useEffect, useState } from 'react';

export type ReaderFontSize = 'small' | 'medium' | 'large';
export type ReaderTheme = 'warm' | 'light' | 'dark';

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  theme: ReaderTheme;
  showQuestions: boolean;
  autoPlay: boolean;
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
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
  };
}
