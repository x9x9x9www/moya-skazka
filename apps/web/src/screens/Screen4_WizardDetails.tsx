import React, { useState, useRef } from 'react';
import { Sparkles, MessageCircleQuestion, Check, Edit2, Camera, RefreshCw } from 'lucide-react';
import { WizardHeroData } from './Screen3_WizardHero';
import { resolveChildAvatar, resolveChildAvatarKey } from '../utils/avatarResolver';
import { api } from '../api/client';

export interface Screen4WizardDetailsProps {
  heroData: WizardHeroData;
  canClaimFreeStory: boolean;
  isSubmitting: boolean;
  remainingSeconds?: number;
  creationMessage?: string;
  onEditHero?: () => void;
  onUpdateHero?: (data: WizardHeroData) => void;
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
  onUpdateHero,
  onSubmit,
}) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && !file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setUploadError('Пожалуйста, выберите файл фотографии (JPG, PNG, WEBP).');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Не удалось прочитать файл фото'));
        reader.readAsDataURL(file);
      });

      const img = new Image();
      const optimizedBase64 = await new Promise<string>((resolve) => {
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(rawBase64);
        img.src = rawBase64;
      });

      const res = await api.generateCharacterAvatar(
        optimizedBase64,
        heroData.appearance?.clothingItem || '',
        'image/jpeg',
        {
          knownGender: heroData.gender,
          knownName: heroData.childName,
          knownAge: heroData.age,
        }
      );

      const traits = res.traits || {};
      const targetGender = heroData.gender || (traits.gender as 'boy' | 'girl') || 'boy';
      const targetHair = traits.hairColor || heroData.appearance?.hairColor || 'русые';
      const targetSkin = traits.skinTone || heroData.appearance?.skinTone || 'светлая';
      const targetFeatures = traits.distinctiveFeatures || heroData.appearance?.distinctiveFeatures || '';

      const targetAvatarId = res.avatar_id || resolveChildAvatarKey({
        gender: targetGender,
        hairColor: targetHair,
        skinTone: targetSkin,
        distinctiveFeatures: targetFeatures,
      });

      const updatedHero: WizardHeroData = {
        ...heroData,
        appearance: {
          ...heroData.appearance,
          avatar_url: res.avatarUrl,
          avatar_id: targetAvatarId,
          hairColor: targetHair,
          hairType: traits.hairType || heroData.appearance?.hairType || 'кудрявые',
          eyeColor: traits.eyeColor || heroData.appearance?.eyeColor || 'карие',
          skinTone: targetSkin,
          distinctiveFeatures: targetFeatures,
        },
      };

      onUpdateHero?.(updatedHero);
    } catch (err: any) {
      console.warn('[Screen4_WizardDetails] Ошибка генерации аватара по фото:', err.message);
      setUploadError('Не удалось создать аватар по фото. Попробуйте ещё раз.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

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
  const [customWishes, setCustomWishes] = useState(() => heroData.customWishes || '');
  const [includeQuestions, setIncludeQuestions] = useState(true);

  React.useEffect(() => {
    const initialId = getInitialThemeId();
    setSelectedOptionId(initialId);
    if (initialId === 'custom' && heroData.theme) {
      setCustomThemeInput(heroData.theme);
    }
    if (heroData.customWishes) {
      setCustomWishes(heroData.customWishes);
    }
  }, [heroData.theme, heroData.customWishes]);

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

      {/* Карточка превью сгенерированного героя с кнопкой изменения и загрузкой фото */}
      <div className="rounded-3xl bg-amber-50/90 border border-amber-200 p-3.5 sm:p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm shrink-0 bg-cream-50 cursor-pointer group"
              title="Нажмите, чтобы загрузить фото"
            >
              <img
                src={avatarUrl}
                alt={heroData.childName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-stone-900 truncate">
                {heroData.childName}{heroData.age ? `, ${formatChildAgeRus(heroData.age)}` : ''}
              </div>
              <div className="text-xs text-stone-600 truncate mt-0.5">
                {heroData.appearance?.hairColor ? `${heroData.appearance.hairColor} волосы • ` : ''}
                {heroData.appearance?.toy ? `Спутник: ${heroData.appearance.toy}` : (heroData.appearance?.clothingItem || 'Маленький герой')}
              </div>
              {heroData.interests && heroData.interests.length > 0 && (
                <div className="text-[11px] text-brand-800 font-medium truncate mt-0.5 flex items-center gap-1">
                  <span className="text-rose-500">❤️</span>
                  <span>Любит: {heroData.interests.join(', ')}</span>
                </div>
              )}
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

        {/* Быстрая загрузка фото прямо в настройке сказки */}
        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 active:scale-95 transition-all py-0.5"
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>{isUploadingPhoto ? 'Создаём 3D аватар по фото...' : 'Загрузить фото ребёнка'}</span>
          </button>
          {heroData.appearance?.avatar_url && !heroData.appearance.avatar_url.includes('illustrations/avatars/') && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              ✓ 3D аватар по фото
            </span>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
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
              Добрые вопросы для совместной беседы во время и после чтения
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
                {creationMessage || 'Создаём сказку... Обычно сказка готова за 1–2 минуты'}
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
