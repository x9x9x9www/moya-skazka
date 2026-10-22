import React, { useState } from 'react';
import { Sparkles, MessageCircleQuestion } from 'lucide-react';
import { WizardHeroData } from './Screen3_WizardHero';

interface Screen4WizardDetailsProps {
  heroData: WizardHeroData;
  canClaimFreeStory: boolean;
  isSubmitting: boolean;
  remainingSeconds?: number;
  creationMessage?: string;
  onSubmit: (details: { personality: string; customWishes: string; includeQuestions: boolean }) => void;
}

export const Screen4_WizardDetails: React.FC<Screen4WizardDetailsProps> = ({
  heroData,
  canClaimFreeStory,
  isSubmitting,
  remainingSeconds,
  creationMessage,
  onSubmit,
}) => {
  const [personality, setPersonality] = useState('Добрый');
  const [customWishes, setCustomWishes] = useState('');
  const [includeQuestions, setIncludeQuestions] = useState(true);

  const personalities = ['Добрый', 'Любопытный', 'Смелый', 'Весёлый', 'Спокойный'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ personality, customWishes, includeQuestions });
  };

  const detectToyEmoji = (toyText: string = ''): string => {
    const t = toyText.toLowerCase();
    if (t.includes('дино')) return '🦖';
    if (t.includes('миш') || t.includes('медв')) return '🧸';
    if (t.includes('зай') || t.includes('крол')) return '🐰';
    if (t.includes('кот') || t.includes('кош')) return '🐱';
    if (t.includes('звезд') || t.includes('звёзд')) return '⭐';
    if (t.includes('машин') || t.includes('кар') || t.includes('поезд') || t.includes('паровоз')) return '🚗';
    if (t.includes('жираф')) return '🦒';
    if (t.includes('робот')) return '🤖';
    if (t.includes('собак') || t.includes('щен') || t.includes('пёс')) return '🐶';
    if (t.includes('кукл')) return '🪆';
    if (t.includes('утк')) return '🦆';
    if (t.includes('лис')) return '🦊';
    if (t.includes('слон')) return '🐘';
    if (t.includes('дракон')) return '🐲';
    if (t.includes('единорог')) return '🦄';
    return '🧸';
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Индикатор прогресса */}
      <div className="text-center">
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          2 из 3
        </span>
        <h2 className="font-serif font-bold text-2xl text-stone-900 mt-2">
          Ещё немного деталей
        </h2>
      </div>

      {/* Характер героя */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">
          Какой характер у героя?
        </label>
        <div className="flex flex-wrap gap-2">
          {personalities.map((item) => {
            const isSelected = personality === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setPersonality(item)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 active:scale-95'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Особые пожелания */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700">
          Особые пожелания (необязательно)
        </label>
        <textarea
          rows={3}
          value={customWishes}
          onChange={(e) => setCustomWishes(e.target.value)}
          placeholder="Например: чтобы герой жил рядом с морем или нашёл волшебный кристалл..."
          maxLength={200}
          className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium text-stone-800 resize-none shadow-sm"
        />
        <div className="text-[11px] text-stone-400 text-right">
          {customWishes.length} / 200
        </div>
      </div>

      {/* Переключатель вопросов для обсуждения с ребёнком (Раздел 6 ТЗ) */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-cream-300 shadow-card">
        <div className="flex items-start gap-3 pr-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
            <MessageCircleQuestion className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 leading-snug">
              Показывать вопросы для ребёнка
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              2–3 вопроса по сюжету с подсказками для родителя
            </div>
          </div>
        </div>

        {/* Нативный Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={includeQuestions}
            onChange={(e) => setIncludeQuestions(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-500"></div>
        </label>
      </div>

      {/* Карточка превью сгенерированного героя */}
      <div className="rounded-3xl bg-amber-50/90 border border-amber-200 p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-200 to-amber-100 shrink-0 border border-amber-300 shadow-inner flex flex-col items-center justify-center text-center">
          <span className="text-2xl">
            {detectToyEmoji(heroData.appearance?.toy)}
          </span>
          <span className="text-[10px] font-bold text-amber-900 mt-0.5">
            {heroData.gender === 'girl' ? '👧' : '👦'} Герой
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-stone-900 truncate">
            {heroData.childName}, {heroData.age} года
          </div>
          <div className="text-xs text-stone-600 mt-0.5 line-clamp-1">
            {heroData.appearance?.hairColor} {heroData.appearance?.hairType} волосы • {heroData.appearance?.clothingItem || 'уютная одежда'}
          </div>
          <div className="text-[11px] font-semibold text-brand-700 mt-1">
            Спутник: {heroData.appearance?.toy || 'любимая игрушка'}
          </div>
        </div>
      </div>

      {/* Кнопка создания */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>
                {creationMessage ||
                  (remainingSeconds && remainingSeconds > 0
                    ? `Создаём сказку... (~${remainingSeconds} с)`
                    : 'Завершаем оформление...')}
              </span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>
                {canClaimFreeStory ? 'Создать сказку бесплатно' : 'Создать сказку (1 кредит)'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
