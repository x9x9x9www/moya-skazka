import React from 'react';
import { Home, Sparkles, BookOpen, ShoppingBag, Users } from 'lucide-react';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'books', label: 'Книги', icon: BookOpen },
    { id: 'create', label: 'Создать', icon: Sparkles },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag },
    { id: 'friends', label: 'Друзья', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none pb-safe">
      <div className="mx-4 mb-3 rounded-full border border-cream-300/80 dark:border-white/15 shadow-2xl bg-white/90 dark:bg-[#16192E]/92 backdrop-blur-xl pointer-events-auto px-2 py-1.5 flex items-center justify-around bg-paper-texture transition-colors duration-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Центральная кнопка «Создать» — приподнятая парящая сказочная сфера
          if (tab.id === 'create') {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-6 py-0.5 px-2 group relative"
                aria-label="Создать сказку"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-amber-200 flex items-center justify-center shadow-xl border-2 border-amber-300/60 glow-fairy spring-transition group-hover:scale-105 group-active:scale-95">
                  <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/60 animate-pulse-subtle" />
                </div>
                <span className="text-[10px] mt-1 font-bold text-brand-800 dark:text-brand-300 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-300 ${
                isActive
                  ? 'scale-105 font-bold text-brand-800 dark:text-brand-300'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 active:scale-95'
              }`}
            >
              {/* Мягкое эллиптическое свечение (Spotlight Glow) для активной вкладки */}
              {isActive && (
                <div className="absolute inset-0 rounded-full spotlight-glow pointer-events-none animate-in fade-in duration-300" />
              )}

              <div className="relative">
                <Icon
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'w-5 h-5 stroke-[2.3px] text-brand-700 dark:text-brand-400 drop-shadow-xs'
                      : 'w-5 h-5 stroke-[1.6px]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold text-brand-800 dark:text-brand-300' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
