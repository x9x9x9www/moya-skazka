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
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-surface pb-safe pt-1.5 px-2 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-accent-400 scale-105'
                  : 'text-glass-500 hover:text-glass-300 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent-500 rounded-full" />
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold text-accent-400' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
