import React from 'react';
import { Home, Sparkles, BookOpen, ShoppingBag, Users } from 'lucide-react';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'create', label: 'Создать', icon: Sparkles },
    { id: 'books', label: 'Книги', icon: BookOpen },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag },
    { id: 'friends', label: 'Друзья', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-cream-300/80 pb-safe pt-2 px-2 max-w-md mx-auto shadow-lg bg-paper-texture">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Центральная кнопка «Создать» — приподнятая сказочная сфера
          if (tab.id === 'create') {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 py-0.5 px-2 group relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-amber-200 flex items-center justify-center shadow-md border border-amber-300/50 glow-fairy spring-transition group-hover:scale-105 group-active:scale-95">
                  <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/60 animate-pulse-subtle" />
                </div>
                <span className="text-[10px] mt-1 font-bold text-brand-800">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-700 bg-brand-50/70 font-bold'
                  : 'text-stone-400 hover:text-stone-600 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px] text-brand-700' : 'stroke-[1.6px]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-sm" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold text-brand-800' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
