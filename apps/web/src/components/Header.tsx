import React from 'react';
import { ArrowLeft, Plus, Settings, Sparkles, ShieldAlert, Bell } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-cream-100/90 backdrop-blur-md px-4 pt-3 pb-2 border-b border-cream-300/60">
      <div className="flex items-center justify-between">
        {/* Левая часть: кнопка Назад или Профиль ребёнка */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-stone-700 hover:text-stone-900 active:scale-95 transition-transform rounded-full hover:bg-cream-200"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : activeChild ? (
            <button
              onClick={onOpenChildModal}
              className="flex items-center gap-2 bg-cream-200/90 hover:bg-cream-300/80 active:scale-95 transition-all px-2.5 py-1.5 rounded-full border border-cream-300 shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 text-stone-800 text-xs flex items-center justify-center overflow-hidden border border-amber-300 shadow-inner">
                {activeChild.name.endsWith('а') || activeChild.name.endsWith('я') ? '👧' : '👦'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-800 leading-tight">
                  {activeChild.name}
                </div>
                <div className="text-[10px] text-stone-500 leading-tight">
                  {activeChild.age} года
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-cream-200/80 flex items-center justify-center text-sm shadow-inner">
              ✨
            </div>
          )}
        </div>

        {/* Центр: строго одна надпись «Моя Сказка» */}
        <div className="text-center">
          <div className="font-serif font-bold text-base text-stone-900 tracking-tight">
            Моя Сказка
          </div>
        </div>

        {/* Правая часть: Баланс кредитов, колокольчик и настройки */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 bg-amber-100/90 text-amber-900 border border-amber-200/80 px-2 py-1 rounded-full text-xs font-bold shadow-sm"
            title="Доступные книжные кредиты"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>{balance}</span>
          </div>

          <button
            onClick={() =>
              alert(
                '✨ Добро пожаловать в «Моя сказка»!\n\nПервая история для вашего малыша доступна совершенно бесплатно. Приятного чтения!'
              )
            }
            className="relative p-1.5 text-stone-600 hover:text-stone-900 active:scale-95 transition-transform rounded-full hover:bg-cream-200"
            aria-label="Уведомления"
            title="Уведомления"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-stone-600 hover:text-stone-900 active:scale-95 transition-transform rounded-full hover:bg-cream-200"
            aria-label="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
