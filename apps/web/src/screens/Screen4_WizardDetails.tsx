import React, { useState } from 'react';
import { Sparkles, MessageCircleQuestion, Check, Edit2 } from 'lucide-react';
import { WizardHeroData } from './Screen3_WizardHero';
import { resolveChildAvatar } from '../utils/avatarResolver';

export interface Screen4WizardDetailsProps {
  heroData: WizardHeroData;
  canClaimFreeStory: boolean;
  isSubmitting: boolean;
  remainingSeconds?: number;
  creationMessage?: string;
  onEditHero?: () => void;
  onSubmit: (details: {
    personality: string;
    storyMood?: string;
    theme?: string;
    customWishes: string;
    includeQuestions: boolean;
  }) => void;
}

interface UnifiedThemeOption {
  id: string;
  title: string;
  theme: string;
  mood: string;
  emoji: string;
  desc: string;
  badge?: string;
}

export const UNIFIED_THEME_OPTIONS: UnifiedThemeOption[] = [
  {
    id: 'friendship',
    title: 'Дружба и взаимовыручка',
    theme: 'Дружба и взаимовыручка',
    mood: 'Дружба',
    emoji: '🤝',
    desc: 'О доброте, взаимной поддержке и настоящих друзьях',
    badge: 'Любимое',
  },
  {
    id: 'adventure',
    title: 'Смелое приключение',
    theme: 'Смелое приключение',
    mood: 'Приключение',
    emoji: '🚀',
    desc: 'Храбрость, исследование неизведанного и победа добра',
  },
  {
    id: 'creativity',
    title: 'Творчество и изобретения',
    theme: 'Творчество и изобретения',
    mood: 'Творчество',
    emoji: '🎨',
    desc: 'Фантазия, мастерство, чудеса и находчивость',
  },
  {
    id: 'humor',
    title: 'Весёлая путаница и смех',
    theme: 'Весёлая путаница и смех',
    mood: 'Юмор и смех',
    emoji: '😄',
    desc: 'Забавные происшествия, улыбки и добрая игра',
  },
  {
    id: 'bedtime',
    title: 'Спокойный сон (Сказка на ночь)',
    theme: 'Спокойный сон',
    mood: 'Спокойный сон',
    emoji: '🌙',
    desc: 'Уютная, убаюкивающая и согревающая история перед сном',
    badge: 'На ночь',
  },
  {
    id: 'dinosaurs',
    title: 'Динозавры и тайны природы',
    theme: 'Динозавры и древние тайны',
    mood: 'Приключение',
    emoji: '🦕',
    desc: 'Древние следы, зелёные джунгли и загадки природы',
  },
  {
    id: 'custom',
    title: 'Своя тема',
    theme: '',
    mood: 'Приключение',
    emoji: '✏️',
    desc: 'Любая ваша идея — от подводных лодок до полёта к звёздам',
  },
];

function formatChildAgeRus(age?: number): string {
  if (!age) return '';
  const rem10 = age % 10;
  const rem100 = age % 100;
  if (rem100 >= 11 && rem100 <= 19) return `${age} лет`;
  if (rem10 === 1) return `${age} год`;
  if (rem10 >= 2 && rem10 <= 4) return `${age} года`;
  return `${age} лет`;
}

function detectMoodForCustomTheme(themeText: string): string {
  const t = themeText.toLowerCase();
  if (t.includes('сон') || t.includes('ночь') || t.includes('колыбель') || t.includes('уют')) {
    return 'Спокойный сон';
  }
  if (t.includes('смех') || t.includes('весел') || t.includes('шут') || t.includes('путан')) {
    return 'Юмор и смех';
  }
  if (t.includes('творч') || t.includes('изобр') || t.includes('рисун') || t.includes('мастер') || t.includes('краск')) {
    return 'Творчество';
  }
  if (t.includes('друж') || t.includes('помощ') || t.includes('забот') || t.includes('вместе')) {
    return 'Дружба';
  }
  return 'Приключение';
}

export const Screen4_WizardDetails: React.FC<Screen4WizardDetailsProps> = ({
  heroData,
  canClaimFreeStory,
  isSubmitting,
  remainingSeconds,
  creationMessage,
  onEditHero,
  onSubmit,
}) => {
  // Определяем начальную опцию на основе переданной темы
  const getInitialThemeId = (): string => {
    const current = (heroData.theme || '').toLowerCase();
    if (current.includes('дин') || current.includes('тайны прир')) return 'dinosaurs';
    if (current.includes('сон') || current.includes('ночь')) return 'bedtime';
    if (current.includes('весел') || current.includes('смех') || current.includes('путан')) return 'humor';
    if (current.includes('творч') || current.includes('изобр')) return 'creativity';
    if (current.includes('приключ') || current.includes('смел')) return 'adventure';
    if (current.includes('дружб')) return 'friendship';
    if (heroData.theme && heroData.theme.trim()) return 'custom';
    return 'friendship';
  };

  const [selectedOptionId, setSelectedOptionId] = useState<string>(getInitialThemeId);
  const [customThemeInput, setCustomThemeInput] = useState<string>(() => {
    const initial = getInitialThemeId();
    return initial === 'custom' ? (heroData.theme || '') : '';
  });
  const [customWishes, setCustomWishes] = useState('');
  const [includeQuestions, setIncludeQuestions] = useState(true);

  React.useEffect(() => {
    const initialId = getInitialThemeId();
    setSelectedOptionId(initialId);
    if (initialId === 'custom' && heroData.theme) {
      setCustomThemeInput(heroData.theme);
    }
  }, [heroData.theme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const chosenOption = UNIFIED_THEME_OPTIONS.find((opt) => opt.id === selectedOptionId) || UNIFIED_THEME_OPTIONS[0];
    const finalTheme = selectedOptionId === 'custom'
      ? (customThemeInput.trim() || 'Удивительное приключение')
      : chosenOption.theme;
    const finalMood = selectedOptionId === 'custom'
      ? detectMoodForCustomTheme(finalTheme)
      : chosenOption.mood;

    onSubmit({
      personality: 'Добрый',
      storyMood: finalMood,
      theme: finalTheme,
      customWishes: customWishes.trim(),
      includeQuestions,
    });
  };

  const avatarUrl = resolveChildAvatar({
    avatar_url: heroData.appearance?.avatar_url,
    avatar_id: heroData.appearance?.avatar_id,
    gender: heroData.gender,
    hairColor: heroData.appearance?.hairColor,
    hairType: heroData.appearance?.hairType,
    hairStructure: heroData.appearance?.hairStructure,
    skinTone: heroData.appearance?.skinTone,
    distinctiveFeatures: heroData.appearance?.distinctiveFeatures,
  });

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Заголовок */}
      <div className="text-center pt-1">
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Создание сказки
        </span>
        <h2 className="font-serif font-bold text-2xl text-stone-900 mt-2">
          О чём будет сказка?
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Выберите любимый сюжет — сюжет и настроение подстроятся автоматически
        </p>
      </div>

      {/* Карточка превью сгенерированного героя с кнопкой изменения */}
      <div className="rounded-3xl bg-amber-50/90 border border-amber-200 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm shrink-0 bg-cream-50">
            <img
              src={avatarUrl}
              alt={heroData.childName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-stone-900 truncate">
              {heroData.childName}{heroData.age ? `, ${formatChildAgeRus(heroData.age)}` : ''}
            </div>
            <div className="text-xs text-stone-600 truncate mt-0.5">
              {heroData.appearance?.hairColor ? `${heroData.appearance.hairColor} волосы • ` : ''}
              {heroData.appearance?.toy ? `Спутник: ${heroData.appearance.toy}` : (heroData.appearance?.clothingItem || 'Маленький герой')}
            </div>
          </div>
        </div>

        {onEditHero && (
          <button
            type="button"
            onClick={onEditHero}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 text-xs font-bold text-stone-700 border border-amber-200 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            title="Редактировать внешность героя"
          >
            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Изменить</span>
          </button>
        )}
      </div>

      {/* Единый селектор «Тема и настроение» (7 опций) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-stone-700 block">
          Выберите тему сказки
        </label>
        <div className="space-y-2">
          {UNIFIED_THEME_OPTIONS.map((item) => {
            const isSelected = selectedOptionId === item.id;
            return (
              <div key={item.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedOptionId(item.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/70 border-brand-500 ring-2 ring-brand-500/30 shadow-sm'
                      : 'bg-white border-cream-300 hover:border-amber-200 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-stone-300 bg-stone-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* Поле для ввода своей темы */}
                {isSelected && item.id === 'custom' && (
                  <div className="pt-1 px-1">
                    <input
                      type="text"
                      value={customThemeInput}
                      onChange={(e) => setCustomThemeInput(e.target.value)}
                      placeholder="Например: Путешествие на подводной лодке..."
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium text-stone-800 shadow-sm"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Особые пожелания к сказке */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
          <span>Особые пожелания к сказке</span>
          <span className="text-[11px] font-normal text-stone-400">необязательно</span>
        </label>
        <textarea
          rows={3}
          value={customWishes}
          onChange={(e) => setCustomWishes(e.target.value)}
          placeholder="Например: чтобы герой нашёл волшебный компас или помог птенцу взлететь..."
          maxLength={200}
          className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium text-stone-800 resize-none shadow-sm placeholder:text-stone-400"
        />
        <div className="text-[11px] text-stone-400 text-right">
          {customWishes.length} / 200
        </div>
      </div>

      {/* Вопросы для совместной беседы */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-cream-300 shadow-card">
        <div className="flex items-start gap-3 pr-3">
          <div className="w-9 h-9 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
            <MessageCircleQuestion className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900 leading-snug">
              Вопросы для совместной беседы
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              2–3 добрых вопроса, чтобы обсудить сказку после чтения
            </div>
          </div>
        </div>

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

      {/* Большая CTA-кнопка создания сказки */}
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
                {canClaimFreeStory ? 'Создать сказку бесплатно' : 'Создать сказку'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
