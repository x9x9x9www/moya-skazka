import React, { useState } from 'react';
import { Sparkles, MessageCircleQuestion } from 'lucide-react';
import { WizardHeroData } from './Screen3_WizardHero';

interface Screen4WizardDetailsProps {
  heroData: WizardHeroData;
  canClaimFreeStory: boolean;
  isSubmitting: boolean;
  onSubmit: (details: { personality: string; customWishes: string; includeQuestions: boolean }) => void;
  onBack: () => void;
}

export const Screen4_WizardDetails: React.FC<Screen4WizardDetailsProps> = ({
  heroData,
  canClaimFreeStory,
  isSubmitting,
  onSubmit,
  onBack,
}) => {
  const [personality, setPersonality] = useState('Добрый');
  const [customWishes, setCustomWishes] = useState('');
  const [includeQuestions, setIncludeQuestions] = useState(true);

  const personalities = ['Добрый', 'Любопытный', 'Смелый', 'Весёлый', 'Спокойный'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ personality, customWishes, includeQuestions });
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto screen-transition">
      {/* Progress */}
      <div className="text-center">
        <span className="text-xs font-bold text-accent-400 bg-accent-500/15 px-3 py-1 rounded-full border border-accent-500/20">
          2 из 3
        </span>
        <h2 className="font-serif font-bold text-2xl text-white mt-2">
          Ещё немного деталей
        </h2>
      </div>

      {/* Personality */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-glass-300">
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
                className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all btn-press ${
                  isSelected
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white/5 text-glass-400 border-white/10 hover:bg-white/8'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom wishes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-glass-300">
          Особые пожелания (необязательно)
        </label>
        <textarea
          rows={3}
          value={customWishes}
          onChange={(e) => setCustomWishes(e.target.value)}
          placeholder="Например: чтобы герой жил рядом с морем или нашёл волшебный кристалл..."
          maxLength={200}
          className="w-full px-4 py-3 rounded-2xl glass-input text-xs font-medium resize-none"
        />
        <div className="text-[11px] text-glass-500 text-right">
          {customWishes.length} / 200
        </div>
      </div>

      {/* Questions toggle */}
      <div className="flex items-center justify-between glass-card p-4">
        <div className="flex items-start gap-3 pr-3">
          <div className="w-9 h-9 rounded-2xl bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0 mt-0.5 border border-accent-500/20">
            <MessageCircleQuestion className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-snug">
              Показывать вопросы для ребёнка
            </div>
            <div className="text-xs text-glass-400 mt-0.5">
              2–3 вопроса по сюжету с подсказками для родителя
            </div>
          </div>
        </div>

        <div
          className={`toggle-track shrink-0 ${includeQuestions ? 'active' : ''}`}
          onClick={() => setIncludeQuestions(!includeQuestions)}
        >
          <div className="toggle-thumb" />
        </div>
      </div>

      {/* Hero preview card */}
      <div className="glass-card p-4 flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-500/20 to-accent-600/10 shrink-0 border border-accent-500/20 flex flex-col items-center justify-center text-center">
          <span className="text-2xl">
            {heroData.appearance?.toy?.includes('дино')
              ? '🦖'
              : heroData.appearance?.toy?.includes('миш')
              ? '🧸'
              : heroData.appearance?.toy?.includes('зай')
              ? '🐰'
              : heroData.appearance?.toy?.includes('кот')
              ? '🐱'
              : '⭐'}
          </span>
          <span className="text-[10px] font-bold text-glass-400 mt-0.5">
            Герой
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">
            {heroData.childName}, {heroData.age} года
          </div>
          <div className="text-xs text-glass-400 mt-0.5">
            {heroData.appearance?.hairColor} {heroData.appearance?.hairType} волосы — {heroData.appearance?.clothingColor} {heroData.appearance?.clothingItem}
          </div>
          <div className="text-[11px] font-semibold text-accent-400 mt-1">
            Спутник: {heroData.appearance?.toy || 'любимая игрушка'}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 text-white font-bold text-base shadow-glow btn-press flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Создаём волшебство...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
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
