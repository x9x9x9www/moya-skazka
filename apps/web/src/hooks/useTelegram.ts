import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
          start_param?: string;
        };
        themeParams: Record<string, string>;
        colorScheme: 'light' | 'dark';
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const haptic = {
  light: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {}
  },
  medium: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    } catch {}
  },
  success: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch {}
  },
  selection: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch {}
  },
  error: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } catch {}
  },
  warning: () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
    } catch {}
  },
};

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor?.('#FAF6F0');
        tg.setBackgroundColor?.('#FAF6F0');
        tg.enableClosingConfirmation?.();
      } catch {}
      setIsReady(true);
    }
  }, [tg]);

  return {
    tg,
    isReady,
    user: tg?.initDataUnsafe?.user,
    startParam: tg?.initDataUnsafe?.start_param,
    initData: tg?.initData || 'dev_user_123456789',
    haptic,
  };
}
