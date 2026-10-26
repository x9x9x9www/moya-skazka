import { ArrowLeft } from 'lucide-react';
import { BoyAvatar, GirlAvatar, FairyStarIcon } from './FairytaleIcons';
import { ChildProfileDTO } from '@moya-skazka/shared';
import { resolveChildAvatar } from '../utils/avatarResolver';

interface HeaderProps {
  currentScreen: string;
  activeChild: ChildProfileDTO | null;
  balance: number;
  onBack?: () => void;
  onOpenChildModal: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeChild,
  balance,
  onBack,
  onOpenChildModal,
}) => {
  const showBackButton = onBack && currentScreen !== 'home' && currentScreen !== 'onboarding';

  return (
    <header className="sticky top-0 z-40 bg-cream-100/60 dark:bg-[#12131A]/75 backdrop-blur-md px-4 py-2.5 border-b border-cream-200/40 dark:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Левая часть: кнопка Назад или Крупный круглый аватар ребенка с мягкой золотой каймой и именем */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white active:scale-95 transition-transform rounded-full hover:bg-cream-200 dark:hover:bg-white/10"
              aria-label="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : activeChild ? (
            <button
              onClick={onOpenChildModal}
              className="flex items-center gap-2.5 bg-white/75 dark:bg-[#1C1F2E]/85 hover:bg-white/90 dark:hover:bg-[#23273D] active:scale-95 transition-all pl-1.5 pr-3 py-1 rounded-full border border-cream-300/80 dark:border-white/15 shadow-xs backdrop-blur-sm group"
              title="Переключить профиль ребёнка или открыть настройки"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-amber-400/80 shadow-sm shrink-0 bg-cream-50 dark:bg-stone-800 group-hover:ring-amber-500 transition-all">
                <img
                  src={resolveChildAvatar({
                    gender:
                      (activeChild as any).gender ||
                      activeChild.appearance?.gender ||
                      (activeChild.name.endsWith('а') || activeChild.name.endsWith('я') ? 'girl' : 'boy'),
                    hairColor: activeChild.appearance?.hairColor,
                    hairType: (activeChild.appearance as any)?.hairType,
                    hairStructure: (activeChild.appearance as any)?.hairStructure,
                    skinTone: (activeChild.appearance as any)?.skinTone,
                    distinctiveFeatures: (activeChild.appearance as any)?.distinctiveFeatures,
                    avatar_id: (activeChild.appearance as any)?.avatar_id,
                  })}
                  alt={activeChild.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-100 leading-tight">
                  {activeChild.name}
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  {activeChild.age} года
                </div>
              </div>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/60 flex items-center justify-center ring-2 ring-amber-300/60 dark:ring-amber-500/40 shadow-inner">
              <FairyStarIcon className="w-4 h-4 text-amber-600 dark:text-amber-300" />
            </div>
          )}
        </div>

        {/* Правая часть: Статус-пилюля с балансом кредитов (золотая звезда + цифра) с эффектом стекла */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 bg-white/70 dark:bg-[#1C1F2E]/85 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-400/30 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all hover:bg-white/90 dark:hover:bg-[#23273D]"
            title="Доступные книжные кредиты"
          >
            <FairyStarIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="font-mono text-xs">{balance}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
