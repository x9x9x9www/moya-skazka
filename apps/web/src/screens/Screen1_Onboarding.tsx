import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Heart,
  Moon,
  BookOpen,
  Star,
  Camera,
  Upload,
  Loader2,
  Scissors,
  Search,
  Compass,
  Smile,
  Coffee,
  Map,
  Pencil,
} from 'lucide-react';
import {
  BoyAvatar,
  GirlAvatar,
  FairyStarIcon,
  FairytaleInterestIcon,
  PrincessCrownIcon,
  TeddyBearIcon,
  SpaceRocketIcon,
  NatureLeafIcon,
  MagicWandIcon,
  FluffyBunnyIcon,
  SweetKittenIcon,
  DinoIcon,
  ToyCarIcon,
  StraightHairIcon,
  CurlyHairIcon,
} from '../components/FairytaleIcons';
import { api } from '../api/client';

export interface ChildRegistrationData {
  name: string;
  age: number;
  gender: 'boy' | 'girl';
  hairColor: string; // 'светлые' | 'русые' | 'тёмные' | 'рыжие'
  hairType?: string; // 'короткие' | 'длинные' | 'кудрявые' | 'прямые' | 'короткие прямые' etc.
  hairLength?: string; // 'короткие' | 'длинные'
  hairStructure?: string; // 'прямые' | 'кудрявые'
  eyeColor: string; // 'карие' | 'голубые' | 'зелёные' | 'серые'
  skinTone: string; // 'светлая' | 'персиковая' | 'смуглая'
  personality: string;
  storyPreference: string;
  bedtimeRitual: string;
  interests: string[];
  toy: string;
}

interface Screen1OnboardingProps {
  isSecondChild?: boolean;
  onComplete: (data: ChildRegistrationData) => void;
  onBack?: () => void;
}

export const Screen1_Onboarding: React.FC<Screen1OnboardingProps> = ({
  isSecondChild = false,
  onComplete,
  onBack,
}) => {
  // Текущий шаг регистрации (1: Внешность и базовые данные, 2: Характер и увлечения)
  const [step, setStep] = useState<1 | 2>(1);

  // Состояние формы с умными предзаполненными значениями для супер-быстрой регистрации
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [age, setAge] = useState<number>(4);

  // Внешность: цвет волос, тип и длина волос, цвет глаз, цвет кожи
  const [hairColor, setHairColor] = useState('русые');
  const [hairLength, setHairLength] = useState<'короткие' | 'длинные'>('короткие');
  const [hairStructure, setHairStructure] = useState<'прямые' | 'кудрявые'>('прямые');
  const [eyeColor, setEyeColor] = useState('карие');
  const [skinTone, setSkinTone] = useState('персиковая');

  // Опциональная автонастройка по фото
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoAnalysisTip, setPhotoAnalysisTip] = useState<string | null>(null);

  // Характер и психоэмоциональные предпочтения
  const [personality, setPersonality] = useState('Добрый и заботливый');
  const [storyPreference, setStoryPreference] = useState('Уютные и добрые истории');
  const [bedtimeRitual, setBedtimeRitual] = useState('Чтение в тёплых объятиях');

  // Игрушка-спутник
  const [toy, setToy] = useState('плюшевый мишка');
  const [customToy, setCustomToy] = useState('');
  const [isCustomToy, setIsCustomToy] = useState(false);

  // Интересы (множественный выбор)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Динозавры',
    'Животные',
    'Волшебство',
  ]);

  // Варианты внешности
  const HAIR_COLORS = [
    { id: 'светлые', label: 'Светлые', preview: '#F7DC6F', icon: '👱' },
    { id: 'русые', label: 'Русые', preview: '#C49A45', icon: '🧑‍🦰' },
    { id: 'тёмные', label: 'Тёмные', preview: '#3E2723', icon: '🧑‍🦱' },
    { id: 'рыжие', label: 'Рыжие', preview: '#E65100', icon: '🦊' },
  ];

  const EYE_COLORS = [
    { id: 'карие', label: 'Карие', preview: '#795548', icon: '🤎' },
    { id: 'голубые', label: 'Голубые', preview: '#42A5F5', icon: '💙' },
    { id: 'зелёные', label: 'Зелёные', preview: '#4CAF50', icon: '💚' },
    { id: 'серые', label: 'Серые', preview: '#78909C', icon: '🩶' },
  ];

  const HAIR_LENGTHS = [
    { id: 'короткие' as const, label: 'Короткие', icon: <Scissors className="w-4 h-4 text-brand-600" /> },
    { id: 'длинные' as const, label: 'Длинные', icon: <PrincessCrownIcon className="w-4 h-4 text-amber-500" /> },
  ];

  const HAIR_STRUCTURES = [
    { id: 'прямые' as const, label: 'Прямые', icon: <StraightHairIcon className="w-4 h-4 text-brand-600" /> },
    { id: 'кудрявые' as const, label: 'Кудрявые', icon: <CurlyHairIcon className="w-4 h-4 text-amber-500" /> },
  ];

  const SKIN_TONES = [
    { id: 'светлая', label: 'Светлая', preview: '#FFE0BD' },
    { id: 'персиковая', label: 'Персиковая', preview: '#FCD0A1' },
    { id: 'смуглая', label: 'Смуглая', preview: '#D19C74' },
  ];

  // Вопросы по характеру
  const PERSONALITY_TRAITS = [
    {
      id: 'Добрый и заботливый',
      label: 'Добрый и заботливый',
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-100" />,
      desc: 'Ласковый, сопереживает и помогает друзьям',
    },
    {
      id: 'Смелый первооткрыватель',
      label: 'Смелый первооткрыватель',
      icon: <SpaceRocketIcon className="w-5 h-5 text-brand-600" />,
      desc: 'Любит подвиги и исследует новое',
    },
    {
      id: 'Любознательный исследователь',
      label: 'Любознательный',
      icon: <Search className="w-5 h-5 text-amber-600" />,
      desc: 'Задаёт 100 вопросов обо всём на свете',
    },
    {
      id: 'Мечтатель и фантазёр',
      label: 'Мечтатель',
      icon: <FairyStarIcon className="w-5 h-5 text-amber-500" />,
      desc: 'Видит сказку и чудеса в простых вещах',
    },
    {
      id: 'Весёлый непоседа',
      label: 'Весёлый непоседа',
      icon: <Smile className="w-5 h-5 text-emerald-600" />,
      desc: 'Обожает смех, шалости и задорные игры',
    },
    {
      id: 'Спокойный и рассудительный',
      label: 'Спокойный',
      icon: <NatureLeafIcon className="w-5 h-5 text-emerald-700" />,
      desc: 'Вдумчивый, внимательный и терпеливый',
    },
  ];

  const STORY_PREFERENCES = [
    { id: 'Уютные и добрые истории', label: 'Уютные и добрые', icon: <Coffee className="w-4 h-4 text-amber-600" /> },
    { id: 'Захватывающие приключения', label: 'Захватывающие приключения', icon: <Compass className="w-4 h-4 text-blue-600" /> },
    { id: 'Тайны и волшебство', label: 'Тайны и волшебство', icon: <MagicWandIcon className="w-4 h-4 text-brand-600" /> },
    { id: 'Смешные и озорные моменты', label: 'Смешные и озорные', icon: <Smile className="w-4 h-4 text-amber-500" /> },
  ];

  const BEDTIME_RITUALS = [
    { id: 'Чтение в тёплых объятиях', label: 'Чтение в обнимку', icon: <BookOpen className="w-4 h-4 text-brand-600" /> },
    { id: 'Сказка с любимой игрушкой', label: 'Сказка с игрушкой', icon: <TeddyBearIcon className="w-4 h-4 text-amber-600" /> },
    { id: 'Тихий разговор перед сном', label: 'Разговор по душам', icon: <Moon className="w-4 h-4 text-indigo-500 fill-indigo-100" /> },
  ];

  const TOYS = [
    { id: 'плюшевый мишка', label: 'Мишка', icon: <TeddyBearIcon className="w-3.5 h-3.5" /> },
    { id: 'пушистый зайка', label: 'Зайка', icon: <FluffyBunnyIcon className="w-3.5 h-3.5" /> },
    { id: 'плюшевый динозаврик', label: 'Динозаврик', icon: <DinoIcon className="w-3.5 h-3.5" /> },
    { id: 'маленький котёнок', label: 'Котёнок', icon: <SweetKittenIcon className="w-3.5 h-3.5" /> },
    { id: 'волшебная звёздочка', label: 'Звёздочка', icon: <FairyStarIcon className="w-3.5 h-3.5" /> },
    { id: 'быстрая машинка', label: 'Машинка', icon: <ToyCarIcon className="w-3.5 h-3.5" /> },
  ];

  const INTERESTS_LIST = [
    { id: 'Динозавры', label: 'Динозавры' },
    { id: 'Космос', label: 'Космос' },
    { id: 'Животные', label: 'Животные' },
    { id: 'Волшебство', label: 'Волшебство' },
    { id: 'Машинки', label: 'Машинки' },
    { id: 'Принцессы и замки', label: 'Принцессы' },
    { id: 'Морской мир', label: 'Морской мир' },
    { id: 'Природа и лес', label: 'Природа' },
  ];

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzingPhoto(true);
      setPhotoAnalysisTip(null);

      // Читаем файл в DataURL
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Оптимизируем размер через canvas до max 800px для мгновенной передачи
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
        img.onerror = () => resolve(base64Data);
        img.src = base64Data;
      });

      setPhotoPreview(optimizedBase64);

      // Отправляем в AI Vision API
      const res = await api.analyzeChildPhoto(optimizedBase64);
      if (res && res.analysis) {
        const a = res.analysis;
        if (a.hairColor) setHairColor(a.hairColor);
        if (a.hairLength) setHairLength(a.hairLength);
        if (a.hairStructure) setHairStructure(a.hairStructure);
        if (a.eyeColor) setEyeColor(a.eyeColor);
        if (a.skinTone) setSkinTone(a.skinTone);
        if (a.gender) setGender(a.gender);
        if (a.estimatedAge && Number(a.estimatedAge) >= 2 && Number(a.estimatedAge) <= 6) {
          setAge(Number(a.estimatedAge));
        }
        setPhotoAnalysisTip(a.confidenceTip || 'Внешность малыша определена!');
      }
    } catch (err: any) {
      console.warn('[Screen1] Ошибка анализа фото:', err);
      setPhotoAnalysisTip('Не удалось распознать фото. Вы можете легко настроить параметры вручную ниже.');
    } finally {
      setIsAnalyzingPhoto(false);
      e.target.value = '';
    }
  };

  const handleClearPhoto = () => {
    setPhotoPreview(null);
    setPhotoAnalysisTip(null);
  };

  const handleNextStep = () => {
    // Если родитель не ввёл имя, аккуратно подставим "Малыш"
    if (!name.trim()) {
      setName(gender === 'girl' ? 'Алиса' : 'Миша');
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalToy = isCustomToy && customToy.trim() ? customToy.trim() : toy;
    const finalName = name.trim() || (gender === 'girl' ? 'Алиса' : 'Миша');

    onComplete({
      name: finalName,
      age,
      gender,
      hairColor,
      hairType: `${hairLength} ${hairStructure}`,
      hairLength,
      hairStructure,
      eyeColor,
      skinTone,
      personality,
      storyPreference,
      bedtimeRitual,
      interests: selectedInterests.length > 0 ? selectedInterests : ['Динозавры', 'Волшебство'],
      toy: finalToy,
    });
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-between p-4 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Верхний бар с прогрессом и заголовком */}
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between mb-3">
          {isSecondChild && onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 p-1.5 rounded-full hover:bg-cream-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-500" />
              <span>{isSecondChild ? 'Второй ребёнок' : 'Регистрация профиля'}</span>
            </div>
          )}

          {/* Быстрый индикатор шага 1/2 */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <span className={step === 1 ? 'text-brand-700 font-extrabold' : 'text-stone-400'}>
              1. Герой
            </span>
            <span className="text-stone-300">•</span>
            <span className={step === 2 ? 'text-brand-700 font-extrabold' : 'text-stone-400'}>
              2. Характер
            </span>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full h-1.5 bg-cream-300/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-amber-500 transition-all duration-300 rounded-full"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="mt-4">
          <h1 className="font-serif font-bold text-2xl text-stone-900 tracking-tight flex items-center gap-2">
            <span>
              {step === 1
                ? isSecondChild
                  ? 'Новый сказочный герой'
                  : 'Кто наш главный герой?'
                : 'Характер и увлечения'}
            </span>
            <FairyStarIcon className="w-5 h-5 text-amber-500 shrink-0" />
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            {step === 1
              ? 'Заполните за 15 секунд, чтобы сказки оживали именно для вашего ребёнка'
              : 'Чтобы история была по-настоящему душевной и бережно поддерживала ребёнка'}
          </p>
        </div>
      </div>

      {/* ШАГ 1: Имя, Возраст, Пол, Внешность (Волосы, Глаза, Кожа) */}
      {step === 1 && (
        <div className="space-y-4 pb-20">
          {/* Опциональный блок: Автонастройка по фото (по желанию родителя) */}
          <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/30 rounded-3xl p-4 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>Настроить героя по фото</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      по желанию
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 leading-tight mt-0.5">
                    AI подберёт причёску и глазки. Вы сможете всё скорректировать. Фото не сохраняется.
                  </div>
                </div>
              </div>
            </div>

            {/* Состояние: идёт анализ */}
            {isAnalyzingPhoto && (
              <div className="flex items-center justify-center gap-2.5 py-3.5 px-3 rounded-2xl bg-white/90 border border-amber-200 text-amber-900 text-xs font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>AI бережно анализирует черты лица малыша...</span>
              </div>
            )}

            {/* Состояние: фото успешно загружено */}
            {!isAnalyzingPhoto && photoPreview && (
              <div className="p-3 rounded-2xl bg-white/90 border border-amber-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-300 shadow-xs shrink-0">
                    <img src={photoPreview} alt="Превью" className="w-full h-full object-cover" />
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Внешность определена!</span>
                    </div>
                    <div className="text-[11px] text-stone-600 leading-tight mt-0.5 truncate">
                      {photoAnalysisTip || 'Параметры заполнены. Вы можете изменить любые поля ниже.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-xs"
                    title="Сбросить фото"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Состояние: фото ещё не загружено (кнопка выбора) */}
            {!isAnalyzingPhoto && !photoPreview && (
              <div>
                <input
                  type="file"
                  id="child-photo-input"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="child-photo-input"
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
                >
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>Загрузить фото для автоподбора</span>
                </label>
              </div>
            )}
          </div>

          {/* Интерактивная живая карточка героя с визуализацией выбора */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-cream-300 transition-all p-1.5"
              style={{
                backgroundColor:
                  skinTone === 'светлая'
                    ? '#FFF2E0'
                    : skinTone === 'смуглая'
                    ? '#F3DEC9'
                    : '#FFE7D1',
              }}
            >
              {gender === 'girl' ? (
                <GirlAvatar className="w-13 h-13 drop-shadow-sm" />
              ) : (
                <BoyAvatar className="w-13 h-13 drop-shadow-sm" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Будущий герой сказки
              </div>
              <div className="font-serif font-bold text-lg text-stone-900 leading-tight">
                {name.trim() || (gender === 'girl' ? 'Алиса' : 'Миша')}
              </div>
              <div className="text-xs text-stone-600 flex items-center gap-2 mt-0.5">
                <span>{age} года/лет</span>
                <span>•</span>
                <span>{hairColor} волосы</span>
                <span>•</span>
                <span>{eyeColor} глаза</span>
              </div>
            </div>
          </div>

          {/* Поле ввода имени */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-stone-800">
              Имя ребёнка <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Миша, София, Лев"
              className="w-full px-4 py-3 rounded-2xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-base text-stone-900 placeholder:text-stone-400 placeholder:font-normal"
            />
            {/* Быстрые подсказки имён */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-stone-400 shrink-0">Популярные:</span>
              {['Миша', 'Алиса', 'Тёма', 'Ева', 'Марк', 'Соня'].map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setName(suggested)}
                  className="px-2.5 py-0.5 rounded-full bg-cream-200/70 text-stone-700 text-[11px] font-medium hover:bg-cream-300 transition-colors shrink-0"
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>

          {/* Пол и Возраст */}
          <div className="grid grid-cols-2 gap-3">
            {/* Пол */}
            <div className="bg-white rounded-3xl p-3.5 border border-cream-300 shadow-sm space-y-2">
              <span className="block text-xs font-bold text-stone-800">Пол</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGender('boy');
                    setHairLength('короткие');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    gender === 'boy'
                      ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-500/30'
                      : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                  }`}
                >
                  <BoyAvatar className="w-5 h-5 shrink-0" />
                  <span>Мальчик</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGender('girl');
                    setHairLength('длинные');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    gender === 'girl'
                      ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/30'
                      : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                  }`}
                >
                  <GirlAvatar className="w-5 h-5 shrink-0" />
                  <span>Девочка</span>
                </button>
              </div>
            </div>

            {/* Возраст */}
            <div className="bg-white rounded-3xl p-3.5 border border-cream-300 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Возраст</span>
                <span className="text-xs font-bold text-brand-700">{age} {age < 5 ? 'года' : 'лет'}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAge(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                      age === num
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30 scale-105'
                        : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Внешность: Цвет волос */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Цвет волос</span>
              </label>
              <span className="text-[11px] font-bold text-stone-500 capitalize">{hairColor}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {HAIR_COLORS.map((item) => {
                const isSelected = hairColor === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHairColor(item.id)}
                    className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-black/10 flex items-center justify-center text-xs"
                      style={{ backgroundColor: item.preview }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </div>
                    <span className="text-[11px] font-bold text-stone-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Внешность: Тип и длина волос */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Тип волос</span>
              </label>
              <span className="text-[11px] font-bold text-stone-500 capitalize">
                {hairLength}, {hairStructure}
              </span>
            </div>

            {/* Длина волос: короткие / длинные */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Длина</div>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_LENGTHS.map((item) => {
                  const isSelected = hairLength === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHairLength(item.id)}
                      className={`py-2 px-3 rounded-2xl border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 text-brand-800 shadow-sm'
                          : 'border-cream-300 bg-cream-50 hover:bg-cream-100 text-stone-700'
                      }`}
                    >
                      <span className="text-sm shrink-0 flex items-center justify-center">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Структура волос: прямые / кудрявые */}
            <div className="space-y-1.5 pt-1 border-t border-cream-200">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Структура</div>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_STRUCTURES.map((item) => {
                  const isSelected = hairStructure === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHairStructure(item.id)}
                      className={`py-2 px-3 rounded-2xl border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 text-brand-800 shadow-sm'
                          : 'border-cream-300 bg-cream-50 hover:bg-cream-100 text-stone-700'
                      }`}
                    >
                      <span className="text-sm shrink-0 flex items-center justify-center">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Внешность: Цвет глаз */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Цвет глаз</span>
              </label>
              <span className="text-[11px] font-bold text-stone-500 capitalize">{eyeColor}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {EYE_COLORS.map((item) => {
                const isSelected = eyeColor === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEyeColor(item.id)}
                    className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-black/10 flex items-center justify-center text-xs"
                      style={{ backgroundColor: item.preview }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </div>
                    <span className="text-[11px] font-bold text-stone-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Внешность: Оттенок кожи */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Оттенок кожи</span>
              </label>
              <span className="text-[11px] font-bold text-stone-500 capitalize">{skinTone}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SKIN_TONES.map((item) => {
                const isSelected = skinTone === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSkinTone(item.id)}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full shadow-inner border border-black/10 shrink-0"
                      style={{ backgroundColor: item.preview }}
                    />
                    <span className="text-xs font-bold text-stone-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ШАГ 2: Вопросы о характере, Предпочтения, Любимая игрушка, Интересы */}
      {step === 2 && (
        <div className="space-y-4 pb-20">
          {/* Вопрос 1: Характер (ключевой вопрос) */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Главная черта характера ребёнка</span>
              </label>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Сказка бережно подстроится под темперамент и поможет раскрыть лучшие качества
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {PERSONALITY_TRAITS.map((item) => {
                const isSelected = personality === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersonality(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <div className="mb-2">{item.icon}</div>
                    <div className="text-xs font-bold text-stone-800 leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Вопрос 2: Что больше всего любит в историях */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Что больше нравится в историях?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STORY_PREFERENCES.map((item) => {
                const isSelected = storyPreference === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStoryPreference(item.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-xs font-bold text-stone-800">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Вопрос 3: Ритуал перед сном */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Любимый ритуал перед сном</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BEDTIME_RITUALS.map((item) => {
                const isSelected = bedtimeRitual === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBedtimeRitual(item.id)}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-[11px] font-bold text-stone-800 leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Любимая игрушка или спутник героя */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Любимая игрушка или друг</span>
              </label>
              <span className="text-[10px] text-stone-400">Появится в иллюстрациях!</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TOYS.map((t) => {
                const isSelected = !isCustomToy && toy === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setIsCustomToy(false);
                      setToy(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                    }`}
                  >
                    <span className="shrink-0 flex items-center justify-center">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomToy(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                  isCustomToy
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                }`}
              >
                <Pencil className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Своя игрушка...</span>
              </button>
            </div>

            {isCustomToy && (
              <input
                type="text"
                value={customToy}
                onChange={(e) => setCustomToy(e.target.value)}
                placeholder="Например, синий трактор, белая собачка..."
                className="w-full mt-2 px-3.5 py-2.5 rounded-2xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-medium"
              />
            )}
          </div>

          {/* Интересы ребёнка */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-sm space-y-2.5">
            <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
              <span>Интересы и увлечения (выберите 2–3)</span>
              <span className="text-[10px] font-normal text-stone-400">
                Выбрано: {selectedInterests.length}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS_LIST.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                    }`}
                  >
                    <FairytaleInterestIcon id={item.id} className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Фиксированная нижняя панель с кнопками перехода */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-100/90 backdrop-blur-md border-t border-cream-300/60 max-w-md mx-auto z-30">
        {step === 1 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Далее: Характер и увлечения</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-4 px-4 rounded-2xl bg-cream-200 hover:bg-cream-300 text-stone-700 font-bold text-sm transition-all flex items-center justify-center"
              title="Вернуться к шагу 1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 active:scale-[0.98] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-white text-white" />
              <span>{isSecondChild ? 'Сохранить героя' : 'Готово! Открыть сказки'}</span>
              <FairyStarIcon className="w-4 h-4 text-amber-200" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
