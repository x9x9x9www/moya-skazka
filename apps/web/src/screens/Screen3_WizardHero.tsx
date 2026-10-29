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
  RefreshCw,
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
import { resolveChildAvatar, resolveChildAvatarKey, ALL_AVATAR_KEYS } from '../utils/avatarResolver';
import { api } from '../api/client';

export interface WizardHeroData {
  childName: string;
  age: number;
  gender: 'boy' | 'girl';
  interests: string[];
  theme: string;
  appearance: {
    avatar_id: string;
    avatar_url?: string;
    hairColor: string; // 'светлые' | 'русые' | 'тёмные' | 'рыжие'
    hairType: string; // 'кудрявые' | 'короткие' | 'длинные' | 'прямые'
    clothingItem: string; // 'костюм супергероя', 'скафандр космонавта', 'жёлтый дождевик и сапожки'...
    clothingColor: string; // акцентный цвет или автоопределённый
    toy: string; // 'плюшевый динозаврик', 'робот Боб', 'зайка'...
    eyeColor?: string; // 'карие' | 'голубые' | 'зелёные' | 'серые'
    skinTone?: string; // 'светлая' | 'персиковая' | 'смуглая'
    distinctiveFeatures?: string;
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

interface FairytaleOutfitOption {
  id: string;
  title: string;
  icon: string;
  clothingValue: string;
}

const FAIRYTALE_OUTFITS: FairytaleOutfitOption[] = [
  { id: 'superhero', title: 'Костюм супергероя', icon: '🦸‍♂️', clothingValue: 'костюм супергероя' },
  { id: 'astronaut', title: 'Скафандр космонавта', icon: '🚀', clothingValue: 'скафандр космонавта' },
  { id: 'dinosaur', title: 'Уютный кигуруми динозаврика', icon: '🦖', clothingValue: 'уютный кигуруми динозаврика' },
  { id: 'wizard', title: 'Мантия маленького мага', icon: '🪄', clothingValue: 'мантия маленького мага' },
  { id: 'dress', title: 'Праздничное бальное платье', icon: '👑', clothingValue: 'праздничное бальное платье' },
  { id: 'raincoat', title: 'Жёлтый дождевик и сапожки', icon: '🌧️', clothingValue: 'жёлтый дождевик и сапожки' },
  { id: 'pajama', title: 'Мягкая пижамка со звёздами', icon: '🧸', clothingValue: 'мягкая пижамка со звёздами' },
  { id: 'custom', title: 'Свой вариант', icon: '✏️', clothingValue: '' },
];

interface AvatarPresetItem {
  id: string;
  gender: 'boy' | 'girl';
  title: string;
  hairColor: string;
  hairType: string;
  skinTone: string;
  distinctiveFeatures: string;
}

const PRESET_AVATARS: AvatarPresetItem[] = [
  { id: 'boy_blonde', gender: 'boy', title: 'Светлые', hairColor: 'светлые', hairType: 'короткие', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'boy_brown', gender: 'boy', title: 'Русые', hairColor: 'русые', hairType: 'короткие', skinTone: 'персиковая', distinctiveFeatures: '' },
  { id: 'boy_dark', gender: 'boy', title: 'Тёмные', hairColor: 'тёмные', hairType: 'короткие', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'boy_ginger', gender: 'boy', title: 'Рыжие', hairColor: 'рыжие', hairType: 'кудрявые', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'boy_glasses', gender: 'boy', title: 'В очках 👓', hairColor: 'русые', hairType: 'короткие', skinTone: 'светлая', distinctiveFeatures: 'очки' },
  { id: 'boy_tan', gender: 'boy', title: 'Смуглый', hairColor: 'тёмные', hairType: 'короткие', skinTone: 'смуглая', distinctiveFeatures: '' },
  { id: 'girl_blonde', gender: 'girl', title: 'Светлые', hairColor: 'светлые', hairType: 'длинные', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'girl_brown', gender: 'girl', title: 'Русые', hairColor: 'русые', hairType: 'кудрявые', skinTone: 'персиковая', distinctiveFeatures: '' },
  { id: 'girl_dark', gender: 'girl', title: 'Тёмные', hairColor: 'тёмные', hairType: 'длинные', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'girl_ginger', gender: 'girl', title: 'Рыжие', hairColor: 'рыжие', hairType: 'кудрявые', skinTone: 'светлая', distinctiveFeatures: '' },
  { id: 'girl_glasses', gender: 'girl', title: 'В очках 👓', hairColor: 'русые', hairType: 'длинные', skinTone: 'светлая', distinctiveFeatures: 'очки' },
  { id: 'girl_tan', gender: 'girl', title: 'Смуглый', hairColor: 'тёмные', hairType: 'длинные', skinTone: 'смуглая', distinctiveFeatures: '' },
];

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
  const [isPhotoBased, setIsPhotoBased] = useState<boolean>(() => {
    return Boolean(
      data.appearance?.avatar_url &&
      !data.appearance.avatar_url.includes('illustrations/avatars/')
    );
  });
  const [isCustomOutfitSelected, setIsCustomOutfitSelected] = useState<boolean>(false);
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
    { id: 'Тёплые объятия и нежность', label: 'Тепло и уют' },
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

  // Мгновенная генерация 3D-аватарки по фото ребенка (Zero-Storage Vision + Nano-Banana-2)
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && !file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setVisionError('Пожалуйста, выберите файл фотографии (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setVisionError('Размер фото слишком большой (более 30 МБ). Попробуйте другой снимок.');
      return;
    }

    setIsAnalyzing(true);
    setVisionError(null);
    setVisionSuccess(null);

    try {
      const reader = new FileReader();
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Не удалось прочитать файл фото'));
        reader.readAsDataURL(file);
      });

      // Оптимизируем размер через canvas до max 800px для мгновенной передачи в AI Vision
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

      // Запуск серверного конвейера: быстрый Vision анализ + подбор 3D Pixar аватара
      const res = await api.generateCharacterAvatar(
        optimizedBase64,
        appearance.clothingItem,
        'image/jpeg',
        {
          knownGender: data.gender,
          knownName: data.childName,
          knownAge: data.age,
        }
      );

      const traits = res.traits || {};
      const targetGender = (data.gender as 'boy' | 'girl') || (traits.gender as 'boy' | 'girl') || 'boy';
      const targetHair = traits.hairColor || appearance.hairColor || 'русые';
      const targetHairType = traits.hairType || appearance.hairType || 'кудрявые';
      const targetSkin = traits.skinTone || appearance.skinTone || 'светлая';
      const targetEye = traits.eyeColor || appearance.eyeColor || 'голубые';
      const targetFeatures = traits.distinctiveFeatures || appearance.distinctiveFeatures || '';
      const targetClothingItem = traits.clothingItem || appearance.clothingItem || (targetGender === 'girl' ? 'платьице' : 'уютный свитер');
      const targetClothingColor = traits.clothingColor || appearance.clothingColor || (targetGender === 'girl' ? 'нежно-розовый' : 'небесно-голубой');

      const targetAvatarId = res.avatar_id || resolveChildAvatarKey({
        gender: targetGender,
        hairColor: targetHair,
        skinTone: targetSkin,
        distinctiveFeatures: targetFeatures,
      });

      const newAppearance = {
        ...appearance,
        avatar_url: res.avatarUrl,
        avatar_id: targetAvatarId,
        hairColor: targetHair,
        hairType: targetHairType,
        eyeColor: targetEye,
        skinTone: targetSkin,
        distinctiveFeatures: targetFeatures,
        clothingItem: targetClothingItem,
        clothingColor: targetClothingColor,
      };

      const patch: Partial<WizardHeroData> = {
        appearance: newAppearance,
        gender: targetGender,
      };
      if (traits.approxAge && traits.approxAge >= 1 && traits.approxAge <= 12) {
        patch.age = traits.approxAge;
      }

      onChange({
        ...data,
        ...patch,
      });

      setIsPhotoBased(true);
      setShowManualAppearance(false);
      setVisionSuccess('✨ Герой ожил по фото!');
    } catch (err: any) {
      console.warn('[Screen3] Ошибка генерации аватара по фото:', err);
      setVisionError(
        err?.message ||
          'Не удалось создать аватар по фото. Попробуйте другой снимок или настройте героя вручную.'
      );
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Кнопка [ 🔄 Сделать другое фото ]
  const handleRetakePhoto = () => {
    setIsPhotoBased(false);
    setVisionSuccess(null);
    setVisionError(null);
    updateAppearance({
      avatar_url: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Переключение на готовые 3D-пресеты
  const handleApplyPreset = (preset: AvatarPresetItem) => {
    const updatedAppearance = {
      ...appearance,
      avatar_id: preset.id,
      avatar_url: undefined, // сбрасываем AI URL для отображения локального 3D аватара
      hairColor: preset.hairColor,
      hairType: preset.hairType,
      skinTone: preset.skinTone,
      distinctiveFeatures: preset.distinctiveFeatures,
    };
    setIsPhotoBased(false);
    onChange({
      ...data,
      gender: preset.gender,
      appearance: updatedAppearance,
    });
  };

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

  // Текст кратких черт лица для заблокированной плашки
  const traitsSummaryText = [
    `${appearance.hairColor || 'русые'} ${appearance.hairType || 'кудрявые'} волосы`,
    `${appearance.eyeColor || 'голубые'} глаза`,
    appearance.distinctiveFeatures?.includes('очк')
      ? 'очки 👓'
      : appearance.distinctiveFeatures || '',
  ]
    .filter(Boolean)
    .join(', ');

  // Проверка, выбран ли наряд из стандартного списка чипсов
  const isOutfitChipActive = (outfit: FairytaleOutfitOption) => {
    if (outfit.id === 'custom') {
      return (
        isCustomOutfitSelected ||
        (Boolean(appearance.clothingItem) &&
          !FAIRYTALE_OUTFITS.filter((o) => o.id !== 'custom').some(
            (o) => (appearance.clothingItem || '').toLowerCase() === o.clothingValue.toLowerCase()
          ))
      );
    }
    return (appearance.clothingItem || '').toLowerCase() === outfit.clothingValue.toLowerCase();
  };

  // Список кастомных интересов (которые не входят в базовый список)
  const standardInterestIds = interestsList.map((i) => i.id);
  const customInterestsList = data.interests.filter((i) => !standardInterestIds.includes(i));

  // Пресеты аватаров, отфильтрованные по выбранному полу
  const currentGenderPresets = PRESET_AVATARS.filter((p) => p.gender === (data.gender || 'boy'));

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Скрытый инпут загрузки фото */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
        id="hero-photo-upload"
      />

      {/* Индикатор прогресса */}
      <div className="text-center">
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          1 из 3: Создание героя
        </span>
        <h2 className="font-serif font-bold text-2xl text-stone-900 mt-2">
          Кто станет главным героем?
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          {isPhotoBased
            ? '3D Pixar герой ожил по фото! Выберите наряд и спутника'
            : 'Загрузите фото для мгновенной 3D-аватарки или выберите готовый образ'}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* Состояние А: Процесс генерации 3D-аватара (10-15 сек) */}
      {/* ========================================================================= */}
      {isAnalyzing && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 border-2 border-amber-300 shadow-md text-center space-y-3 animate-pulse">
          <div className="relative mx-auto w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-600 animate-bounce" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-amber-950">
              Волшебная кисть рисует 3D Pixar портрет... 🎨
            </h3>
            <p className="text-xs text-amber-800 mt-1 max-w-xs mx-auto leading-relaxed">
              Считываем черты лица (Zero-Storage: фото сразу удаляется) → Создаём сияющий 3D-образ (~10–15 сек)
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Состояние Б: Готовый 3D-портрет по фото ребенка */}
      {/* ========================================================================= */}
      {!isAnalyzing && isPhotoBased && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          {/* Круглая карточка с 3D-портретом в сияющей золотой рамке */}
          <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-b from-amber-50/90 via-white to-amber-50/60 border border-amber-200/90 shadow-md relative overflow-hidden">
            {/* Бейдж: ✨ Герой ожил по фото! */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white text-xs font-bold shadow-sm mb-3.5">
              <Sparkles className="w-3.5 h-3.5 fill-amber-200 text-white animate-spin-slow" />
              <span>✨ Герой ожил по фото!</span>
            </div>

            {/* Сияющая золотая рамка вокруг портрета крупным планом */}
            <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_28px_rgba(245,158,11,0.5)] ring-4 ring-amber-300/70">
              <div className="w-full h-full rounded-full overflow-hidden bg-cream-50 border-2 border-white shadow-inner flex items-center justify-center">
                <img
                  src={resolveChildAvatar(appearance)}
                  alt={data.childName || 'Герой'}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              {/* Игрушка-спутник на бейдже */}
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white/95 border border-amber-300 shadow-md flex items-center justify-center text-base">
                {detectToyEmoji(appearance.toy)}
              </div>
            </div>

            {/* Имя и возраст */}
            <div className="mt-3.5 text-center">
              <div className="font-serif font-bold text-lg text-stone-900">
                {data.childName || 'Главный герой'} • {data.gender === 'girl' ? 'Девочка' : 'Мальчик'}, {data.age} {data.age === 1 ? 'год' : data.age < 5 ? 'года' : 'лет'}
              </div>
            </div>

            {/* Кнопка под портретом: [ 🔄 Сделать другое фото ] */}
            <button
              type="button"
              onClick={handleRetakePhoto}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>🔄 Сделать другое фото</span>
            </button>
          </div>

          {/* 🔒 Блокировка анатомических переключателей */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 shadow-xs flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-stone-900 flex items-center gap-2">
                <span>Черты лица определены по фото</span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                  🔒 Заблокировано
                </span>
              </div>
              <p className="text-stone-700 mt-0.5 leading-snug">
                🔒 Черты лица определены по фото: <strong className="font-semibold text-stone-900">{traitsSummaryText}</strong>.
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Ручные переключатели причёски и глаз скрыты, чтобы сохранить портретное сходство с фото малыша.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Состояние В: Без фото / Ручной режим со свободными 3D-пресетами */}
      {/* ========================================================================= */}
      {!isAnalyzing && !isPhotoBased && (
        <div className="space-y-4 animate-in fade-in">
          {/* Карточка загрузки фото с защитой Zero-Storage */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border border-amber-200/90 p-4 shadow-sm space-y-3">
            <div>
              <div className="font-serif font-bold text-base text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Мгновенная 3D-аватарка по фото</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed flex items-start gap-1.5 bg-white/70 p-2.5 rounded-xl border border-amber-100">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-stone-700">🔒 Zero-Storage безопасность:</strong> фото анализируется за пару секунд в памяти и тут же навсегда удаляется.
                </span>
              </p>
            </div>

            {/* Большая кнопка загрузки фото */}
            <label
              htmlFor="hero-photo-upload"
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white hover:bg-amber-50/60 cursor-pointer transition-all flex items-center justify-center gap-3 shadow-xs active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-800">
                  Загрузить портрет малыша 📸
                </div>
                <div className="text-[10px] text-stone-500">
                  Создаст персональный 3D Pixar портрет за 10–15 секунд
                </div>
              </div>
            </label>

            {/* Ошибка если была */}
            {visionError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{visionError}</div>
              </div>
            )}
          </div>

          {/* Превью текущего 3D Pixar аватара */}
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-sm">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-cream-50 flex items-center justify-center ring-2 ring-amber-300">
              <img
                src={resolveChildAvatar({
                  gender: data.gender,
                  hairColor: appearance.hairColor,
                  hairType: appearance.hairType,
                  hairStructure: appearance.hairStructure,
                  skinTone: appearance.skinTone,
                  distinctiveFeatures: appearance.distinctiveFeatures,
                  avatar_id: appearance.avatar_id,
                })}
                alt={data.childName || 'Герой'}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-0 right-1 w-7 h-7 rounded-full bg-white/95 border border-amber-300 shadow-md flex items-center justify-center text-sm">
                {detectToyEmoji(appearance.toy)}
              </div>
            </div>
            <div className="mt-2.5 text-center">
              <div className="font-serif font-bold text-base text-stone-900">
                {data.childName || 'Герой'} • {data.gender === 'girl' ? 'Девочка' : 'Мальчик'}, {data.age} года
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/60 text-[11px] font-medium text-amber-900 mt-1.5 shadow-xs">
                <FairyStarIcon className="w-3 h-3 text-amber-600" />
                <span>
                  {appearance.hairColor} • {appearance.skinTone || 'персиковая'} кожа
                  {appearance.distinctiveFeatures?.includes('очк') ? ' • в очках 👓' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Сетка готовых локальных 3D-пресетов из /illustrations/avatars/ */}
          <div className="p-4 rounded-3xl bg-white border border-cream-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Быстрые 3D-образы (нажмите для выбора)</span>
              </label>
              <div className="flex gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, gender: 'boy' })}
                  className={`px-2 py-0.5 rounded-lg border transition-all ${
                    data.gender === 'boy'
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  Мальчик
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, gender: 'girl' })}
                  className={`px-2 py-0.5 rounded-lg border transition-all ${
                    data.gender === 'girl'
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  Девочка
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {currentGenderPresets.map((preset) => {
                const isSelected = appearance.avatar_id === preset.id;
                const avatarImg = resolveChildAvatar({ avatar_id: preset.id });
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-400 scale-[1.02]'
                        : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-amber-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white shadow-xs mb-1">
                      <img
                        src={avatarImg}
                        alt={preset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-stone-800 leading-tight">
                      {preset.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Переключатель разворота детальных селекторов */}
            <button
              type="button"
              onClick={() => setShowManualAppearance(!showManualAppearance)}
              className="w-full py-1.5 px-3 text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center justify-center gap-1.5 transition-colors pt-2 border-t border-cream-200"
            >
              <span>{showManualAppearance ? 'Скрыть детальные настройки' : 'Точная настройка волос и глаз'}</span>
              {showManualAppearance ? (
                <ChevronUp className="w-3.5 h-3.5 text-brand-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-brand-500" />
              )}
            </button>

            {/* Детальные ручные селекторы (волосы, глаза, кожа) */}
            {showManualAppearance && (
              <div className="space-y-4 pt-2 border-t border-cream-200 animate-in fade-in">
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

                {/* Причёска */}
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

                {/* Очки в сказке */}
                <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                  <span className="text-[11px] font-bold text-stone-700">Герой носит очки?</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateAppearance({
                        distinctiveFeatures: appearance.distinctiveFeatures?.includes('очк')
                          ? ''
                          : 'очки',
                      })
                    }
                    className={`py-1 px-3 rounded-lg text-xs font-bold border transition-all ${
                      appearance.distinctiveFeatures?.includes('очк')
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                    }`}
                  >
                    {appearance.distinctiveFeatures?.includes('очк') ? 'Да, в очках 👓' : 'Нет'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Блок выбора «Сказочного наряда» («В чём отправимся в сказку?») */}
      {/* ========================================================================= */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-amber-200/90 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="font-serif font-bold text-sm text-stone-900">В чём отправимся в сказку?</span>
          </label>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Сказочный наряд
          </span>
        </div>
        <p className="text-[11px] text-stone-500">
          Выберите костюм для приключений — в нём герой будет путешествовать во всех сценах сказки:
        </p>

        {/* Сетка чипсов нарядов */}
        <div className="grid grid-cols-2 gap-2">
          {FAIRYTALE_OUTFITS.map((outfit) => {
            const isSelected = isOutfitChipActive(outfit);
            const isCustom = outfit.id === 'custom';

            return (
              <button
                key={outfit.id}
                type="button"
                onClick={() => {
                  if (isCustom) {
                    setIsCustomOutfitSelected(true);
                  } else {
                    setIsCustomOutfitSelected(false);
                    updateAppearance({ clothingItem: outfit.clothingValue });
                  }
                }}
                className={`p-2.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm scale-[1.02] font-bold'
                    : 'bg-stone-50 hover:bg-amber-50/60 text-stone-800 border-stone-200'
                }`}
              >
                <span className="text-lg shrink-0">{outfit.icon}</span>
                <span className="leading-snug">{outfit.title}</span>
              </button>
            );
          })}
        </div>

        {/* Поле свободного ввода (Свой вариант) */}
        {(isCustomOutfitSelected ||
          (appearance.clothingItem &&
            !FAIRYTALE_OUTFITS.filter((o) => o.id !== 'custom').some(
              (o) => (appearance.clothingItem || '').toLowerCase() === o.clothingValue.toLowerCase()
            ))) && (
          <div className="space-y-1.5 pt-2 animate-in fade-in">
            <label className="text-[11px] font-bold text-stone-700 block">
              ✏️ Опишите свой особенный наряд:
            </label>
            <div className="relative">
              <input
                type="text"
                value={appearance.clothingItem || ''}
                onChange={(e) => updateAppearance({ clothingItem: e.target.value })}
                placeholder="Например: костюм маленького пирата, рыцарские доспехи, крылышки бабочки..."
                className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              {appearance.clothingItem && (
                <button
                  type="button"
                  onClick={() => updateAppearance({ clothingItem: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Любимая игрушка-спутник (Свободный ввод + быстрые подсказки) */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* Что любит ребёнок? (Популярные карточки + свободный ввод увлечений) */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* Главная тема сказки */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* Кнопка Далее */}
      {/* ========================================================================= */}
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
