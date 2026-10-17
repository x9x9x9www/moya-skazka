import React from 'react';
import { ArrowLeft, Plus, Settings, Sparkles, Bell } from 'lucide-react';
import { ChildProfileDTO } from '@moya-skazka/shared';

interface HeaderProps {
  currentScreen: string;
  activeChild: ChildProfileDTO | null;
  balance: number;
  onBack?: () => void;
  onOpenChildModal: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeChild,
  balance,
  onBack,
  onOpenChildModal,
  onOpenSettings,
  onOpenAdmin,
}) => {
  const showBackButton = onBack && currentScreen !== 'home' && currentScreen !== 'onboarding';

  return (
    <header className="sticky top-0 z-40 glass-surface px-4 pt-3 pb-2">
      <div className="flex items-center justify-between">
        {/* Left: Back or Child profile */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-glass-400 hover:text-white active:scale-95 transition-all rounded-full hover:bg-white/5"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : activeChild ? (
            <button
              onClick={onOpenChildModal}
              className="flex items-center gap-2 glass-surface-light hover:bg-white/12 active:scale-95 transition-all px-2.5 py-1.5 rounded-full"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent-500/40 to-accent-400/20 text-white text-xs font-bold flex items-center justify-center overflow-hidden border border-accent-500/30">
                {activeChild.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {activeChild.name}
                </div>
                <div className="text-[10px] text-glass-400 leading-tight">
                  {activeChild.age} года
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-glass-500 ml-0.5" />
            </button>
          ) : (
            <div className="font-serif font-bold text-white text-lg tracking-tight">
              Моя сказка
            </div>
          )}
        </div>

        {/* Center: App title */}
        <div className="text-center">
          <div className="text-[13px] font-bold text-white/90 tracking-tight">
            Моя сказка
          </div>
          <div className="text-[10px] text-glass-500 tracking-wide uppercase">
            мини-приложение
          </div>
        </div>

        {/* Right: Credits, bell, settings */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 glass-surface-light text-accent-400 px-2 py-1 rounded-full text-xs font-bold"
            title="Доступные книжные кредиты"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            <span>{balance}</span>
          </div>

          <button
            onClick={() =>
              alert(
                'Добро пожаловать в «Моя сказка»!\n\nПервая история для вашего малыша доступна совершенно бесплатно. Приятного чтения!'
              )
            }
            className="relative p-1.5 text-glass-400 hover:text-white active:scale-95 transition-all rounded-full hover:bg-white/5"
            aria-label="Уведомления"
            title="Уведомления"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-glass-400 hover:text-white active:scale-95 transition-all rounded-full hover:bg-white/5"
            aria-label="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
