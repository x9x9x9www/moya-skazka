import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  Check,
  Plus,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock,
  Heart,
  CloudRain,
  Shirt,
  Scissors,
} from 'lucide-react';
import {
  BoyAvatar,
  GirlAvatar,
  FairyStarIcon,
  DinoIcon,
  SpaceRocketIcon,
  WoodlandFoxIcon,
  MagicWandIcon,
  ToyCarIcon,
  TeddyBearIcon,
  NatureLeafIcon,
  BlocksIcon,
  ArtPaletteIcon,
  TrainSteamIcon,
  OceanDolphinIcon,
  MusicNotesIcon,
  SportBallIcon,
  PrincessCrownIcon,
} from '../components/FairytaleIcons';
import { api } from '../api/client';

export interface WizardHeroData {
  childName: string;
  age: number;
  gender: 'boy' | 'girl';
  interests: string[];
  theme: string;
  appearance: {
    avatar_id: string;
    hairColor: string; // 'светлые' | 'русые' | 'тёмные' | 'рыжие'
    hairType: string; // 'кудрявые' | 'короткие' | 'длинные' | 'прямые'
    clothingItem: string; // Свободный ввод: 'жёлтый дождевик и резиновые сапожки', 'уютная пижамка...'
    clothingColor: string; // акцентный цвет или автоопределённый
    toy: string; // Свободный ввод: 'плюшевый жирафик Тоша', 'робот Боб', 'зайка'...
    eyeColor?: string; // 'карие' | 'голубые' | 'зелёные' | 'серые'
    skinTone?: string; // 'светлая' | 'персиковая' | 'смуглая'
    hairLength?: string;
    hairStructure?: string;
  };
}

interface Screen3WizardHeroProps {
  data: WizardHeroData;
  onChange: (data: WizardHeroData) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Screen3_WizardHero: React.FC<Screen3WizardHeroProps> = ({
  data,
  onChange,
  onNext,
}) => {
  const [customInterest, setCustomInterest] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [visionSuccess, setVisionSuccess] = useState<string | null>(null);
  const [showManualAppearance, setShowManualAppearance] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Популярные интересы для быстрого выбора с векторными сказочными иконками
  const interestsList = [
    { id: 'Динозавры', icon: <DinoIcon className="w-6 h-6" />, label: 'Динозавры' },
    { id: 'Космос', icon: <SpaceRocketIcon className="w-6 h-6" />, label: 'Космос' },
    { id: 'Животные', icon: <WoodlandFoxIcon className="w-6 h-6" />, label: 'Животные' },
    { id: 'Волшебство', icon: <MagicWandIcon className="w-6 h-6" />, label: 'Волшебство' },
    { id: 'Машинки', icon: <ToyCarIcon className="w-6 h-6" />, label: 'Машинки' },
    { id: 'Природа', icon: <NatureLeafIcon className="w-6 h-6" />, label: 'Природа' },
    { id: 'Лего и конструктор', icon: <BlocksIcon className="w-6 h-6" />, label: 'Лего' },
    { id: 'Рисование', icon: <ArtPaletteIcon className="w-6 h-6" />, label: 'Рисование' },
    { id: 'Поезда', icon: <TrainSteamIcon className="w-6 h-6" />, label: 'Поезда' },
    { id: 'Море и дельфины', icon: <OceanDolphinIcon className="w-6 h-6" />, label: 'Море' },
    { id: 'Музыка', icon: <MusicNotesIcon className="w-6 h-6" />, label: 'Музыка' },
    { id: 'Спорт и мяч', icon: <SportBallIcon className="w-6 h-6" />, label: 'Спорт' },
  ];

  // Расширенный список популярных и терапевтических тем (без сырых эмодзи)
  const themesList = [
    { id: 'Дружба и верность', label: 'Дружба и верность' },
    { id: 'Доброта и забота', label: 'Доброта и забота' },
    { id: 'Смелость и победа над страхами', label: 'Смелость и отвага' },
    { id: 'Спокойный и сладкий сон', label: 'Спокойный сон' },
    { id: 'Волшебные сны и звездопад', label: 'Волшебные сны' },
    { id: 'Тёплые объятия перед сном', label: 'Уют перед сном' },
    { id: 'Заколдованный лес и тайны', label: 'Заколдованный лес' },
    { id: 'Космическое путешествие', label: 'Космос и звёзды' },
    { id: 'Морские глубины и киты', label: 'Подводный мир' },
    { id: 'Страна дружелюбных динозавров', label: 'Остров динозавров' },
    { id: 'Город добрых машинок', label: 'Город машинок' },
    { id: 'Замок маленьких фей и магов', label: 'Замок фей' },
    { id: 'Капризы и управление эмоциями', label: 'Капризы и эмоции' },
    { id: 'Честность и искренность', label: 'Честность и правда' },
    { id: 'Умение делиться и дружить', label: 'Умение делиться' },
    { id: 'Любознательность и открытия', label: 'Любознательность' },
    { id: 'Порядок и уборка игрушек', label: 'Уборка игрушек' },
    { id: 'Любовь к детскому садику', label: 'Любимый садик' },
    { id: 'Смелый поход к врачу', label: 'Поход к врачу' },
    { id: 'Появление братика или сестрёнки', label: 'Братик или сестрёнка' },
    { id: 'Бережное отношение к природе', label: 'Забота о природе' },
  ];

  // Быстрые подсказки-идеи для одежды с векторными иконками
  const clothingSuggestions = [
    { icon: <CloudRain className="w-3.5 h-3.5 text-sky-500" />, text: 'Жёлтый дождевик и сапожки' },
    { icon: <FairyStarIcon className="w-3.5 h-3.5" />, text: 'Уютная пижамка со звёздочками' },
    { icon: <Shirt className="w-3.5 h-3.5 text-amber-700" />, text: 'Тёплый вязаный свитер' },
    { icon: <PrincessCrownIcon className="w-3.5 h-3.5" />, text: 'Сказочное пышное платьице' },
    { icon: <Shirt className="w-3.5 h-3.5 text-blue-600" />, text: 'Джинсовый комбинезончик' },
    { icon: <SpaceRocketIcon className="w-3.5 h-3.5" />, text: 'Костюм юного космонавта' },
    { icon: <DinoIcon className="w-3.5 h-3.5" />, text: 'Футболка с динозавриком' },
    { icon: <MagicWandIcon className="w-3.5 h-3.5" />, text: 'Бархатная мантия волшебника' },
    { icon: <WoodlandFoxIcon className="w-3.5 h-3.5" />, text: 'Толстовка с рыжей лисичкой' },
    { icon: <FairyStarIcon className="w-3.5 h-3.5 text-amber-500" />, text: 'Костюм доброго супергероя' },
  ];

  // Быстрые подсказки-идеи для игрушки-спутника с векторными иконками
  const companionToys = [
    { id: 'плюшевый динозаврик', icon: <DinoIcon className="w-4 h-4" />, label: 'Динозаврик' },
    { id: 'плюшевый мишка', icon: <TeddyBearIcon className="w-4 h-4" />, label: 'Мишка' },
    { id: 'пушистый зайка', icon: <WoodlandFoxIcon className="w-4 h-4" />, label: 'Зайка' },
    { id: 'маленький котёнок', icon: <WoodlandFoxIcon className="w-4 h-4" />, label: 'Котёнок' },
    { id: 'волшебная звёздочка', icon: <FairyStarIcon className="w-4 h-4" />, label: 'Звёздочка' },
    { id: 'быстрая машинка', icon: <ToyCarIcon className="w-4 h-4" />, label: 'Машинка' },
    { id: 'плюшевый жирафик', icon: <TeddyBearIcon className="w-4 h-4" />, label: 'Жирафик' },
    { id: 'заводной робот', icon: <BlocksIcon className="w-4 h-4" />, label: 'Робот' },
  ];

  // Параметры ручной настройки внешности
  const hairColorsList = [
    { id: 'светлые', label: 'Светлые', color: '#F7DC6F' },
    { id: 'русые', label: 'Русые', color: '#C49A45' },
    { id: 'тёмные', label: 'Тёмные', color: '#3E2723' },
    { id: 'рыжие', label: 'Рыжие', color: '#E65100' },
  ];

  const hairTypesList = [
    {
      id: 'короткие',
      label: 'Короткие',
      icon: <Scissors className="w-3.5 h-3.5 text-stone-600" />,
    },
    {
      id: 'прямые',
      label: 'Прямые',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 stroke-stone-600" strokeWidth="1.5">
          <line x1="4" y1="2" x2="4" y2="14" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="14" strokeLinecap="round" />
          <line x1="12" y1="2" x2="12" y2="14" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'кудрявые',
      label: 'Кудрявые',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 stroke-stone-600" strokeWidth="1.5">
          <path d="M4 3C6 3 6 6 4 6C2 6 2 9 4 9C6 9 6 12 4 12" strokeLinecap="round" />
          <path d="M10 3C12 3 12 6 10 6C8 6 8 9 10 9C12 9 12 12 10 12" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'длинные',
      label: 'Длинные',
      icon: <PrincessCrownIcon className="w-3.5 h-3.5" />,
    },
  ];

  const eyeColorsList = [
    { id: 'карие', label: 'Карие', color: '#5D4037' },
    { id: 'голубые', label: 'Голубые', color: '#42A5F5' },
    { id: 'зелёные', label: 'Зелёные', color: '#4CAF50' },
    { id: 'серые', label: 'Серые', color: '#90A4AE' },
  ];

  const skinTonesList = [
    { id: 'светлая', label: 'Светлая', color: '#FFE0BD' },
    { id: 'персиковая', label: 'Персиковая', color: '#FAD0B3' },
    { id: 'смуглая', label: 'Смуглая', color: '#D7A173' },
  ];

  const appearance = data.appearance || {
    avatar_id: 'hero_custom',
    hairColor: 'светлые',
    hairType: 'кудрявые',
    clothingItem: 'жёлтый дождевик и сапожки',
    clothingColor: 'солнечно-жёлтый',
    toy: 'плюшевый динозаврик',
    eyeColor: 'карие',
    skinTone: 'светлая',
  };

  const updateAppearance = (patch: Partial<typeof appearance>) => {
    onChange({
      ...data,
      appearance: {
        ...appearance,
        ...patch,
      },
    });
  };

  const toggleInterest = (id: string) => {
    const updated = data.interests.includes(id)
      ? data.interests.filter((i) => i !== id)
      : [...data.interests, id];
    onChange({ ...data, interests: updated });
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!data.interests.includes(trimmed)) {
      onChange({ ...data, interests: [...data.interests, trimmed] });
    }
    setCustomInterest('');
  };

  // Zero-Storage Vision: Обработка загруженного фото ребенка исключительно в оперативной памяти
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i)) {
      setVisionError('Пожалуйста, выберите фото в формате JPG, PNG или WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setVisionError('Размер фото не должен превышать 5 МБ.');
      return;
    }

    setIsAnalyzing(true);
    setVisionError(null);
    setVisionSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        let base64String = reader.result as string;
        try {
          const res = await api.analyzeCharacterPhoto(base64String, file.type);
          // Zero-Storage: немедленно зануляем ссылку на base64
          base64String = '';

          if (res.error === 'FACE_NOT_DETECTED') {
            setVisionError(
              res.message ||
                'Не удалось чётко разглядеть личико. Попробуйте другое фото или просто выберите параметры вручную ниже.'
            );
            setShowManualAppearance(true);
          } else {
            const newAppearance = {
              ...appearance,
              hairColor: res.hairColor || appearance.hairColor,
              hairType: res.hairType || appearance.hairType,
              eyeColor: res.eyeColor || appearance.eyeColor,
              skinTone: res.skinTone || appearance.skinTone,
            };

            const patch: Partial<WizardHeroData> = {
              appearance: newAppearance,
            };
            if (res.gender) {
              patch.gender = res.gender;
            }
            if (res.approxAge && res.approxAge >= 1 && res.approxAge <= 12) {
              patch.age = res.approxAge;
            }

            onChange({
              ...data,
              ...patch,
            });

            setVisionSuccess(
              res.distinctiveFeatures
                ? `Мы увидели героя! Особенность: «${res.distinctiveFeatures}». Проверьте, всё ли верно — при желании вы можете поправить любую деталь ниже.`
                : 'Мы увидели героя! Проверьте, всё ли верно — при желании вы можете поправить любую деталь ниже.'
            );
          }
        } catch (err: any) {
          base64String = '';
          setVisionError(
            err?.message ||
              'Не удалось чётко разглядеть личико. Попробуйте другое фото или просто выберите параметры вручную ниже.'
          );
          setShowManualAppearance(true);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsAnalyzing(false);
      setVisionError('Не удалось прочитать файл фото. Попробуйте ещё раз.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Цвет волос для превью
  const hairColorsMap: Record<string, string> = {
    светлые: '#F7DC6F',
    русые: '#C49A45',
    тёмные: '#3E2723',
    рыжие: '#E65100',
  };
  const activeColorHex = hairColorsMap[appearance.hairColor] || '#C49A45';

  // Тон кожи для превью
  const skinTonesMap: Record<string, string> = {
    светлая: '#FFE0BD',
    персиковая: '#FAD0B3',
    смуглая: '#D7A173',
  };
  const activeSkinHex = skinTonesMap[appearance.skinTone || 'светлая'] || '#FFE0BD';

  // Цвет глаз для превью
  const eyeColorsMap: Record<string, string> = {
    карие: '#4E342E',
    голубые: '#29B6F6',
    зелёные: '#43A047',
    серые: '#78909C',
  };
  const activeEyeHex = eyeColorsMap[appearance.eyeColor || 'карие'] || '#2D3436';

  // Автоматическое определение цвета одежды по тексту для превью аватара
  const detectClothingHex = (clothingText: string = '', fallbackColor: string = '') => {
    const text = (clothingText + ' ' + fallbackColor).toLowerCase();
    if (text.includes('жёлт')) return '#F5B041';
    if (text.includes('голуб')) return '#5DADE2';
    if (text.includes('син')) return '#2980B9';
    if (text.includes('розов')) return '#F1948A';
    if (text.includes('зелён') || text.includes('изумруд')) return '#2E6F5E';
    if (text.includes('красн')) return '#E74C3C';
    if (text.includes('терракот')) return '#D35400';
    if (text.includes('фиолет') || text.includes('сирен')) return '#8E44AD';
    if (text.includes('оранж')) return '#E67E22';
    if (text.includes('бел')) return '#F4F6F6';
    if (text.includes('сер')) return '#95A5A6';
    return '#2E6F5E';
  };
  const activeClothingHex = detectClothingHex(appearance.clothingItem, appearance.clothingColor);

  // Динамическое определение эмодзи для игрушки героя
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
    if (t.includes('плед') || t.includes('одеял')) return '🧣';
    return '🧸';
  };

  // Список кастомных интересов (которые не входят в базовый список)
  const standardInterestIds = interestsList.map((i) => i.id);
  const customInterestsList = data.interests.filter((i) => !standardInterestIds.includes(i));

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Индикатор прогресса */}
      <div className="text-center">
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          1 из 3: Создание героя
        </span>
        <h2 className="font-serif font-bold text-2xl text-stone-900 mt-2">
          Кто станет главным героем?
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Настройте внешность, одежду и спутника — малыш оживёт на иллюстрациях сказки
        </p>
      </div>

      {/* 🔒 Блок Zero-Storage: Создать героя по фото (по желанию) */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border border-amber-200/90 p-4 shadow-sm space-y-3">
        <div>
          <div className="font-serif font-bold text-base text-stone-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>✨ Создать героя по фото (по желанию)</span>
          </div>
          <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed flex items-start gap-1.5 bg-white/70 p-2.5 rounded-xl border border-amber-100">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong className="font-semibold text-stone-700">🔒 Мы заботимся о безопасности:</strong> снимок анализируется мгновенно в оперативной памяти и сразу навсегда удаляется. Мы никогда не храним фото детей.
            </span>
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoSelected}
          className="hidden"
          id="hero-photo-upload"
        />

        {/* Состояние 1: Загрузка / Анализ фото */}
        {isAnalyzing ? (
          <div className="p-4 rounded-2xl bg-amber-100/80 border border-amber-300 flex items-center gap-3 animate-pulse shadow-inner">
            <div className="w-8 h-8 rounded-full border-3 border-amber-600 border-t-transparent animate-spin shrink-0" />
            <div className="text-xs font-semibold text-amber-900 leading-snug">
              Художник изучает черты лица и подбирает краски... 🎨
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Кнопка выбора файла */}
            <label
              htmlFor="hero-photo-upload"
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white hover:bg-amber-50/60 cursor-pointer transition-all flex items-center justify-center gap-3 shadow-xs active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-800">
                  {visionSuccess ? 'Выбрать другое фото' : 'Загрузить портрет малыша'}
                </div>
                <div className="text-[10px] text-stone-500">
                  JPG, PNG или WEBP до 5 МБ • Мгновенный анализ
                </div>
              </div>
            </label>

            {/* Состояние 2: Успех автоподбора */}
            {visionSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{visionSuccess}</div>
              </div>
            )}

            {/* Состояние 3: Ошибка / Нечеткое фото */}
            {visionError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{visionError}</div>
              </div>
            )}

            {/* Кнопка-альтернатива «Или настройте внешность вручную» */}
            <button
              type="button"
              onClick={() => setShowManualAppearance(!showManualAppearance)}
              className="w-full py-2 px-3 text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Выбрать внешность в деталях</span>
              {showManualAppearance ? (
                <ChevronUp className="w-3.5 h-3.5 text-brand-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-brand-500" />
              )}
            </button>

            {/* Разворачивающийся блок ручной настройки параметров внешности */}
            {showManualAppearance && (
              <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-300 space-y-4 animate-in fade-in">
                {/* Имя и возраст */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Имя героя
                    </label>
                    <input
                      type="text"
                      value={data.childName}
                      onChange={(e) => onChange({ ...data, childName: e.target.value })}
                      placeholder="Имя малыша"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Возраст
                    </label>
                    <div className="flex gap-1">
                      {[2, 3, 4, 5, 6].map((ageNum) => (
                        <button
                          key={ageNum}
                          type="button"
                          onClick={() => onChange({ ...data, age: ageNum })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            data.age === ageNum
                              ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                              : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                          }`}
                        >
                          {ageNum}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Пол */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Пол героя
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, gender: 'boy' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                        data.gender === 'boy'
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                      }`}
                    >
                      <BoyAvatar className="w-4 h-4 shrink-0" />
                      <span>Мальчик</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, gender: 'girl' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                        data.gender === 'girl'
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                      }`}
                    >
                      <GirlAvatar className="w-4 h-4 shrink-0" />
                      <span>Девочка</span>
                    </button>
                  </div>
                </div>

                {/* Цвет волос */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Цвет волос
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {hairColorsList.map((item) => {
                      const isSel = appearance.hairColor === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateAppearance({ hairColor: item.id })}
                          className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-white border-brand-500 shadow-xs ring-1 ring-brand-500 font-bold'
                              : 'bg-white/70 border-cream-300 hover:bg-white text-stone-700'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Тип волос */}
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Причёска
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {hairTypesList.map((item) => {
                      const isSel = appearance.hairType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateAppearance({ hairType: item.id })}
                          className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                            isSel
                              ? 'bg-white border-brand-500 shadow-xs ring-1 ring-brand-500 font-bold'
                              : 'bg-white/70 border-cream-300 hover:bg-white text-stone-700'
                          }`}
                        >
                          <span className="text-sm shrink-0">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Цвет глаз и Тон кожи */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Цвет глаз
                    </label>
                    <div className="space-y-1">
                      {eyeColorsList.map((item) => {
                        const isSel = appearance.eyeColor === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateAppearance({ eyeColor: item.id })}
                            className={`w-full py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                              isSel
                                ? 'bg-white border-brand-500 shadow-2xs font-bold text-brand-900'
                                : 'bg-white/60 border-cream-300 text-stone-600'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      Тон кожи
                    </label>
                    <div className="space-y-1">
                      {skinTonesList.map((item) => {
                        const isSel = appearance.skinTone === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateAppearance({ skinTone: item.id })}
                            className={`w-full py-1 px-2 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                              isSel
                                ? 'bg-white border-brand-500 shadow-2xs font-bold text-brand-900'
                                : 'bg-white/60 border-cream-300 text-stone-600'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Интерактивный нарисованный аватар ребёнка по его параметрам */}
      <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-sm">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-50 flex items-center justify-center">
          {/* Нарисованный малыш */}
          <div className="relative flex flex-col items-center">
            {/* Голова */}
            <div
              className="relative w-12 h-12 rounded-full border-2 border-black/10 flex items-center justify-center transition-colors duration-300 shadow-inner"
              style={{ backgroundColor: activeSkinHex }}
            >
              {/* Волосы по параметрам */}
              <div
                className={`absolute -top-1 inset-x-0 ${
                  appearance.hairType?.includes('кудр')
                    ? 'h-5 rounded-t-full border-t-2'
                    : appearance.hairType?.includes('длин')
                    ? 'h-7 rounded-t-xl'
                    : 'h-4 rounded-t-full'
                }`}
                style={{ backgroundColor: activeColorHex }}
              />
              {data.gender === 'girl' && (
                <div className="absolute -top-1.5 right-0">
                  <PrincessCrownIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {/* Глазки с цветом */}
              <div className="flex gap-2 mt-2">
                <div
                  className="w-1.5 h-1.5 rounded-full border border-black/20 shadow-xs transition-colors duration-300"
                  style={{ backgroundColor: activeEyeHex }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full border border-black/20 shadow-xs transition-colors duration-300"
                  style={{ backgroundColor: activeEyeHex }}
                />
              </div>
            </div>
            {/* Одежда */}
            <div
              className="w-10 h-7 rounded-t-lg -mt-1 border border-black/10 relative flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: activeClothingHex }}
            >
              {/* Игрушка в ручках */}
              <div className="absolute -right-2 bottom-0 text-sm">
                {detectToyEmoji(appearance.toy)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2.5 text-center">
          <div className="font-serif font-bold text-base text-stone-900">
            {data.childName || 'Герой'} • {data.gender === 'girl' ? 'Девочка' : 'Мальчик'}, {data.age} года
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/60 text-[11px] font-medium text-amber-900 mt-1.5 shadow-xs">
            <FairyStarIcon className="w-3 h-3 text-amber-600" />
            <span>
              {appearance.hairColor} {appearance.hairType} волосы • {appearance.eyeColor || 'карие'} глаза
            </span>
          </div>
        </div>
      </div>

      {/* Одежда героя (Свободный ввод + подсказки) */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-brand-700" />
            <span>Во что одет герой в сказке?</span>
          </label>
          <span className="text-[11px] font-medium text-brand-700">впишите любое</span>
        </div>

        {/* Текстовое поле ввода одежды */}
        <div className="relative">
          <input
            type="text"
            value={appearance.clothingItem || ''}
            onChange={(e) => updateAppearance({ clothingItem: e.target.value })}
            placeholder="Например: жёлтый дождевик и резиновые сапожки, пижамка с динозавриками, нарядное платьице..."
            className="w-full px-4 py-3.5 pr-9 rounded-2xl bg-cream-50/70 border border-cream-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-stone-800 text-sm shadow-inner transition-all placeholder:text-stone-400 placeholder:font-normal"
          />
          {appearance.clothingItem && (
            <button
              type="button"
              onClick={() => updateAppearance({ clothingItem: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 flex items-center justify-center text-xs transition-colors"
              title="Очистить"
            >
              ✕
            </button>
          )}
        </div>

        {/* Быстрые идеи для вдохновения */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-stone-500">
            Идеи для быстрого выбора:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {clothingSuggestions.map((sug) => {
              const isSelected = appearance.clothingItem === sug.text;
              return (
                <button
                  key={sug.text}
                  type="button"
                  onClick={() => updateAppearance({ clothingItem: sug.text })}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium border text-left whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 hover:border-brand-300 active:scale-95'
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">{sug.icon}</span>
                  <span className="leading-tight">{sug.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Любимая игрушка-спутник (Свободный ввод + быстрые подсказки) */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <TeddyBearIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Любимая игрушка-спутник</span>
          </label>
          <span className="text-[11px] font-medium text-brand-700">впишите любую</span>
        </div>

        {/* Текстовое поле свободного ввода игрушки */}
        <div className="relative">
          <input
            type="text"
            value={appearance.toy || ''}
            onChange={(e) => updateAppearance({ toy: e.target.value })}
            placeholder="Например: плюшевый жирафик Тоша, робот Боб, любимый зайка, синий паровозик..."
            className="w-full px-4 py-3.5 pr-9 rounded-2xl bg-cream-50/70 border border-cream-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-stone-800 text-sm shadow-inner transition-all placeholder:text-stone-400 placeholder:font-normal"
          />
          {appearance.toy && (
            <button
              type="button"
              onClick={() => updateAppearance({ toy: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 flex items-center justify-center text-xs transition-colors"
              title="Очистить"
            >
              ✕
            </button>
          )}
        </div>

        {/* Быстрые подсказки-идеи для игрушки */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-stone-500">
            Или выберите из популярных:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {companionToys.map((toy) => {
              const isSelected = appearance.toy === toy.id || appearance.toy === toy.label;
              return (
                <button
                  key={toy.id}
                  type="button"
                  onClick={() => updateAppearance({ toy: toy.id })}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium border text-left whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 hover:border-brand-300 active:scale-95'
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">{toy.icon}</span>
                  <span className="leading-tight">{toy.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Что любит ребёнок? (Популярные карточки + свободный ввод увлечений) */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-400/40" />
            <span>Что любит ребёнок?</span>
          </label>
          <span className="text-[11px] font-medium text-brand-700">можно добавить своё</span>
        </div>

        {/* Сетка популярных увлечений */}
        <div className="grid grid-cols-3 gap-2">
          {interestsList.map((item) => {
            const isSelected = data.interests.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleInterest(item.id)}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 shadow-sm ring-1 ring-brand-500'
                    : 'bg-cream-50/60 border-cream-300 hover:bg-cream-100 active:scale-95'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-brand-800' : 'text-stone-700'}`}>
                  {item.label}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-brand-600 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Поле добавления собственного увлечения */}
        <div className="space-y-2 pt-2 border-t border-cream-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomInterest();
                }
              }}
              placeholder="Добавьте своё увлечение (например: Мыльные пузыри, Пазлы...)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-cream-50/70 border border-cream-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold text-stone-800 shadow-inner placeholder:text-stone-400 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={handleAddCustomInterest}
              disabled={!customInterest.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </div>

          {/* Добавленные родительские интересы */}
          {customInterestsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {customInterestsList.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-300 text-brand-900 text-xs font-semibold shadow-xs"
                >
                  <FairyStarIcon className="w-3 h-3 text-brand-600" />
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className="w-4 h-4 rounded-full bg-brand-200/70 hover:bg-brand-300 text-brand-800 flex items-center justify-center text-[10px] ml-0.5"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Теги «Главная тема» (Расширенный список + свободный ввод) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-700">Главная тема сказки</label>
          <span className="text-[11px] text-stone-400">выберите или введите свою</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {themesList.map((item) => {
            const isSelected = data.theme === item.id || data.theme === item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ ...data, theme: item.id })}
                className={`inline-flex items-center justify-center px-3.5 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm scale-[1.02]'
                    : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 active:scale-95'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="pt-1">
          <input
            type="text"
            value={data.theme}
            onChange={(e) => onChange({ ...data, theme: e.target.value })}
            placeholder="Или введите свою тему (например: Первый полёт на самолёте, Поход в цирк...)"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold text-stone-800 shadow-sm placeholder:text-stone-400 placeholder:font-normal"
          />
        </div>
      </div>

      {/* Кнопка Далее */}
      <div className="pt-2">
        <button
          onClick={onNext}
          disabled={!data.childName.trim() || data.interests.length === 0}
          className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Дальше к сказке</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
