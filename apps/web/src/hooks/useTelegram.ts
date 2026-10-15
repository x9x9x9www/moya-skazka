import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
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

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      setIsReady(true);
    }
  }, [tg]);

  const haptic = {
    light: () => {
      try {
        tg?.HapticFeedback?.impactOccurred('light');
      } catch {}
    },
    medium: () => {
      try {
        tg?.HapticFeedback?.impactOccurred('medium');
      } catch {}
    },
    success: () => {
      try {
        tg?.HapticFeedback?.notificationOccurred('success');
      } catch {}
    },
    selection: () => {
      try {
        tg?.HapticFeedback?.selectionChanged();
      } catch {}
    },
  };

  return {
    tg,
    isReady,
    user: tg?.initDataUnsafe?.user,
    startParam: tg?.initDataUnsafe?.start_param,
    initData: tg?.initData || 'dev_user_123456789',
    haptic,
  };
}
