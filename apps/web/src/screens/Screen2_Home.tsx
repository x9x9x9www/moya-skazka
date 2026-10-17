import React, { useState } from 'react';
import { Sparkles, BookOpen, ShoppingBag, Users, RefreshCw, BookmarkCheck } from 'lucide-react';
import { ChildProfileDTO } from '@moya-skazka/shared';

interface Screen2HomeProps {
  activeChild: ChildProfileDTO | null;
  canClaimFreeStory: boolean;
  balance: number;
  dailyIdea: any;
  onStartCreateStory: () => void;
  onNavigateTab: (tab: string) => void;
  onRefreshIdea: () => void;
  onSaveIdea: () => void;
}

export const Screen2_Home: React.FC<Screen2HomeProps> = ({
  activeChild,
  canClaimFreeStory,
  balance,
  dailyIdea,
  onStartCreateStory,
  onNavigateTab,
  onRefreshIdea,
  onSaveIdea,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const childName = activeChild ? activeChild.name : 'малыша';

  const handleSave = () => {
    setIsSaved(true);
    onSaveIdea();
  };

  const handleStart = () => {
    if (!canClaimFreeStory && balance <= 0) {
      onNavigateTab('shop');
      return;
    }
    onStartCreateStory();
  };

  return (
    <div className="p-4 space-y-5 pb-24 max-w-md mx-auto">
      {/* Главный уютный баннер (Экран 2) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white p-6 shadow-xl">
        {/* Декоративные сказочные сияния */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-0 right-4 w-28 h-28 opacity-15">
          <Sparkles className="w-full h-full text-white" />
        </div>

        <div className="relative z-10">
          {canClaimFreeStory ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-900 text-xs font-bold mb-3 shadow-sm">
              <span>🎁</span>
              <span>Первая сказка бесплатно</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
              <span>✨</span>
              <span>Для {childName}</span>
            </div>
          )}

          <h2 className="font-serif font-bold text-2xl leading-snug mb-2">
            Добрый вечер! Готовы к новому приключению?
          </h2>

          <p className="text-xs text-white/85 mb-5 font-sans">
            Создайте уникальную сказку, где {childName} станет главным героем
          </p>

          <button
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-cream-100 active:scale-[0.98] transition-all text-brand-800 font-bold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>
              {canClaimFreeStory
                ? 'Создать первую сказку бесплатно'
                : balance > 0
                ? 'Создать новую сказку (1 кредит)'
                : 'Пополнить баланс и создать сказку'}
            </span>
          </button>
        </div>
      </div>

      {/* Быстрые плитки (Мои книги / Магазин / Пригласить друзей) */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('books')}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-cream-300 shadow-card hover:bg-cream-50 active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 shadow-inner">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-bold text-stone-800">Мои книги</span>
        </button>

        <button
          onClick={() => onNavigateTab('shop')}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-cream-300 shadow-card hover:bg-cream-50 active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2 shadow-inner">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-xs font-bold text-stone-800">Магазин</span>
        </button>

        <button
          onClick={() => onNavigateTab('friends')}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-cream-300 shadow-card hover:bg-cream-50 active:scale-95 transition-all text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-2 shadow-inner">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-bold text-stone-800">Пригласить</span>
        </button>
      </div>

      {/* Блок «Сказка дня» (Экран 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-lg text-stone-900">
            Сказка дня
          </h3>
          <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
            Персонально
          </span>
        </div>

        <div className="rounded-3xl bg-white border border-cream-300 shadow-card overflow-hidden">
          <div className="flex p-4 gap-3.5 items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-amber-50 shrink-0 border border-cream-300">
              <img
                src="./illustrations/cover_star.jpg"
                alt="Сказка дня"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-bold text-sm text-stone-900 truncate mb-1">
                {dailyIdea?.title || `${childName} и потерянная звёздочка`}
              </h4>
              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {dailyIdea?.blurb || 'Добрая история о смелости, дружбе и о том, как зажечь свет в темноте.'}
              </p>
            </div>
          </div>

          <div className="flex border-t border-cream-200 bg-cream-50/60 p-2 gap-2">
            <button
              onClick={onRefreshIdea}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span>Другая идея</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                isSaved
                  ? 'bg-brand-50 text-brand-700 border border-brand-300'
                  : 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Сохранено' : 'Сохранить'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
