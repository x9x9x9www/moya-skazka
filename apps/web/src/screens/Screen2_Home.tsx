import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Compass,
  Gift,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import {
  FairyStarIcon,
  FairyGiftIcon,
  FairyBookIcon,
} from '../components/FairytaleIcons';
import { ChildProfileDTO } from '@moya-skazka/shared';

interface Screen2HomeProps {
  activeChild: ChildProfileDTO | null;
  canClaimFreeStory: boolean;
  balance: number;
  dailyIdea: any;
  booksCount?: number;
  onStartCreateStory: () => void;
  onNavigateTab: (tab: string) => void;
  onRefreshIdea: () => void;
  onSaveIdea: () => void;
}

function pluralizeBooks(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} сказок`;
  if (rem > 1 && rem < 5) return `${count} сказки`;
  if (rem === 1) return `${count} сказка`;
  return `${count} сказок`;
}

function pluralizeCredits(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} сказок`;
  if (rem > 1 && rem < 5) return `${count} сказки`;
  if (rem === 1) return `${count} сказка`;
  return `${count} сказок`;
}

export const Screen2_Home: React.FC<Screen2HomeProps> = ({
  activeChild,
  canClaimFreeStory,
  balance,
  dailyIdea,
  booksCount,
  onStartCreateStory,
  onNavigateTab,
  onRefreshIdea,
  onSaveIdea,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const childName = activeChild ? activeChild.name : 'малыша';

  // Получаем реальное число книг из пропса или локального хранилища
  const storiesCount =
    typeof booksCount === 'number'
      ? booksCount
      : (() => {
          try {
            const raw = localStorage.getItem('ms_books');
            return raw ? JSON.parse(raw).length : 0;
          } catch {
            return 0;
          }
        })();

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
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
      {/* 1. БАННЕР ГЕРОЯ: Волшебная книга-раскладушка в ночном небе */}
      <div className="relative rounded-3xl overflow-hidden bg-night-sky text-white p-6 shadow-2xl border border-amber-300/20 spring-transition">
        {/* Теплое лунное сияние (Lunar Ambient Glow) */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-6 w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 opacity-90 shadow-[0_0_28px_rgba(243,183,85,0.6)] pointer-events-none flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-amber-50/50" />
        </div>

        {/* Мерцающие волшебные звезды (SVG Shimmering Stars) */}
        <svg
          className="absolute top-5 left-8 w-3.5 h-3.5 text-amber-300 animate-star-shimmer pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
        <svg
          className="absolute top-10 right-20 w-4 h-4 text-amber-200 animate-star-shimmer-delay-1 pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
        <svg
          className="absolute bottom-16 right-7 w-2.5 h-2.5 text-amber-300 animate-star-shimmer-delay-2 pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
        <svg
          className="absolute bottom-8 left-10 w-3 h-3 text-amber-100 animate-star-shimmer-delay-3 pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        {/* Объемная раскладушка (3D Pop-up fairy book ornament) */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-15 pointer-events-none animate-float-slow">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 20C35 15 15 22 10 25V75C15 72 35 65 50 70C65 65 85 72 90 75V25C85 22 65 15 50 20Z"
              stroke="#F3B755"
              strokeWidth="3"
            />
            <path d="M50 20V70" stroke="#F3B755" strokeWidth="2" strokeDasharray="2 2" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Верхний бейдж */}
          {canClaimFreeStory ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 text-xs font-bold mb-3.5 shadow-md border border-amber-300/60">
              <FairyGiftIcon className="w-3.5 h-3.5" />
              <span>Первая сказка бесплатно</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-200 text-xs font-medium mb-3.5 border border-white/15 shadow-sm">
              <FairyStarIcon className="w-3.5 h-3.5" />
              <span>Сказка для {childName}</span>
            </div>
          )}

          {/* Книжный заголовок */}
          <h2 className="font-serif font-bold text-2xl leading-snug mb-2 text-stone-50 drop-shadow-sm">
            Добрый вечер! Готовы к новому приключению?
          </h2>

          <p className="text-xs text-amber-100/80 mb-5 font-sans leading-relaxed">
            Создайте уникальную сказку, где {childName} станет главным героем
          </p>

          {/* Главная кнопка действия: Золотая с мягким пульсирующим ореолом (glow-gold) */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F5B955] via-[#F3B755] to-[#E39E2F] hover:brightness-105 active:scale-[0.98] spring-transition text-stone-950 font-bold text-sm glow-gold animate-glow-gold flex items-center justify-center gap-2 border border-amber-200/60 shadow-lg"
          >
            <Wand2 className="w-4 h-4 text-stone-900 fill-stone-900/30" />
            <span className="tracking-wide">Открыть вечернюю сказку</span>
            <FairyStarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. БЫСТРЫЕ ЗАКЛАДКИ: Кремово-золотистая карусель с тиснением */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Быстрые закладки
          </span>
          <span className="text-[11px] text-brand-700 font-medium">Волшебный мир</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 scrollbar-none snap-x">
          {/* Закладка 1: Полка сказок */}
          <button
            onClick={() => onNavigateTab('books')}
            className="w-[145px] shrink-0 snap-start p-3.5 rounded-2xl bg-cream-100/90 bg-paper-texture border border-amber-900/10 shadow-card shadow-inner-paper hover:border-amber-400/40 active:scale-[0.98] spring-transition text-left flex flex-col justify-between"
          >
            <div>
              {/* Превью корешков книг на полке */}
              <div className="flex items-end gap-1.5 h-9 mb-2.5 px-0.5">
                <div className="w-3 h-8 bg-brand-600 rounded-t-sm border-t border-amber-300/70 shadow-sm relative overflow-hidden">
                  <div className="w-full h-0.5 bg-amber-300/50 mt-1" />
                </div>
                <div className="w-3.5 h-9 bg-amber-800 rounded-t-sm border-t border-amber-300/80 shadow-sm relative overflow-hidden">
                  <div className="w-full h-0.5 bg-amber-300/60 mt-1" />
                  <div className="w-full h-0.5 bg-amber-300/60 mt-0.5" />
                </div>
                <div className="w-2.5 h-7 bg-slate-700 rounded-t-sm border-t border-amber-300/50 shadow-sm relative overflow-hidden">
                  <div className="w-full h-0.5 bg-amber-300/40 mt-1" />
                </div>
                <div className="w-3 h-8.5 bg-rose-900 rounded-t-sm border-t border-amber-300/70 shadow-sm relative overflow-hidden">
                  <div className="w-full h-0.5 bg-amber-300/60 mt-1" />
                </div>
              </div>

              <h4 className="font-serif font-bold text-xs text-stone-900 mb-0.5">
                Полка сказок
              </h4>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-1 border-t border-amber-900/5">
              <span>{pluralizeBooks(storiesCount)}</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
            </div>
          </button>

          {/* Закладка 2: Волшебный ларец */}
          <button
            onClick={() => onNavigateTab('shop')}
            className="w-[145px] shrink-0 snap-start p-3.5 rounded-2xl bg-cream-100/90 bg-paper-texture border border-amber-900/10 shadow-card shadow-inner-paper hover:border-amber-400/40 active:scale-[0.98] spring-transition text-left flex flex-col justify-between"
          >
            <div>
              {/* Светящаяся золотая звезда */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/60 flex items-center justify-center mb-2.5 glow-gold shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-600 fill-amber-400 animate-pulse-subtle" />
              </div>

              <h4 className="font-serif font-bold text-xs text-stone-900 mb-0.5">
                Волшебный ларец
              </h4>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-1 border-t border-amber-900/5">
              <span className="text-amber-700 font-semibold">
                {balance > 0 ? pluralizeCredits(balance) : 'Пополнить'}
              </span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
            </div>
          </button>

          {/* Закладка 3: Подарить сказку друзьям */}
          <button
            onClick={() => onNavigateTab('friends')}
            className="w-[155px] shrink-0 snap-start p-3.5 rounded-2xl bg-cream-100/90 bg-paper-texture border border-amber-900/10 shadow-card shadow-inner-paper hover:border-amber-400/40 active:scale-[0.98] spring-transition text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-powder-peach to-orange-100 border border-amber-300/40 flex items-center justify-center shadow-sm">
                  <Gift className="w-5 h-5 text-amber-800" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-bold text-[10px] shadow-sm border border-amber-300/70">
                  <FairyGiftIcon className="w-2.5 h-2.5" />
                  <span>+1 подарок</span>
                </span>
              </div>

              <h4 className="font-serif font-bold text-xs text-stone-900 mb-0.5">
                Подарить сказку
              </h4>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-1 border-t border-amber-900/5">
              <span>Пригласить</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. КАРТОЧКА «СКАЗКА ДНЯ»: Раскрытая книга с градиентом корешка */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-lg text-stone-900">
            Сказка дня
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200 shadow-inner-paper">
            <FairyBookIcon className="w-3.5 h-3.5" />
            <span>Выбор вечера</span>
          </span>
        </div>

        {/* Раскрытая книга */}
        <div className="relative rounded-3xl bg-cream-100 border border-amber-900/10 shadow-card shadow-inner-paper overflow-hidden bg-paper-texture">
          {/* Эффект корешка раскрытой книги (spine gradient) */}
          <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 pointer-events-none bg-gradient-to-r from-black/0 via-black/[0.04] to-black/0 z-10" />
          <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 pointer-events-none bg-amber-900/10 z-10" />

          {/* Контент раскрытых страниц */}
          <div className="relative z-0 p-4">
            <div className="flex gap-4 items-center">
              {/* Иллюстрация: rounded-2xl и золотая кайма border border-amber-200/50 */}
              <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-amber-50 shrink-0 border border-amber-200/50 shadow-md">
                <img
                  src={dailyIdea?.coverUrl || './illustrations/cover_star.jpg'}
                  alt="Сказка дня"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none" />
              </div>

              {/* Текст и аннотация */}
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-sm text-stone-900 truncate mb-1">
                  {dailyIdea?.title || `${childName} и потерянная звёздочка`}
                </h4>
                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed font-sans">
                  {dailyIdea?.blurb ||
                    'Добрая история о смелости, дружбе и о том, как зажечь свет в темноте.'}
                </p>
              </div>
            </div>
          </div>

          {/* Нижняя панель действий */}
          <div className="flex items-center border-t border-amber-900/10 bg-amber-50/50 p-2.5 gap-2.5">
            {/* Кнопка «Другая идея»: Прозрачная с иконкой компаса */}
            <button
              onClick={onRefreshIdea}
              className="flex-1 py-2.5 px-3 rounded-xl bg-transparent hover:bg-stone-200/40 active:scale-95 spring-transition border border-stone-300/70 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-stone-600" />
              <span>Другая идея</span>
            </button>

            {/* Кнопка «Сохранить»: Изящная шелковая закладка (ленточка) */}
            <button
              onClick={handleSave}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 spring-transition shadow-sm ${
                isSaved
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 glow-gold'
                  : 'bg-brand-500 text-white hover:bg-brand-600 border border-brand-400/40 glow-fairy'
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isSaved
                    ? 'text-amber-700 fill-amber-500'
                    : 'text-amber-200 fill-amber-200/80'
                }`}
              />
              <span className="inline-flex items-center gap-1">
                <span>{isSaved ? 'В закладках' : 'Сохранить'}</span>
                {isSaved && <FairyStarIcon className="w-3 h-3" />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
