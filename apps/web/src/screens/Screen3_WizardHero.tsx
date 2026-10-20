import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

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
    toy: string; // 'плюшевый мишка' | 'зайка' | 'динозаврик' | 'котёнок' | 'звёздочка' | 'быстрая машинка'
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
  onBack: () => void;
}

export const Screen3_WizardHero: React.FC<Screen3WizardHeroProps> = ({
  data,
  onChange,
  onNext,
}) => {
  const interestsList = [
    { id: 'Динозавры', icon: '🦖', label: 'Динозавры' },
    { id: 'Космос', icon: '🚀', label: 'Космос' },
    { id: 'Животные', icon: '🦊', label: 'Животные' },
    { id: 'Волшебство', icon: '🪄', label: 'Волшебство' },
    { id: 'Машинки', icon: '🚗', label: 'Машинки' },
    { id: 'Природа', icon: '🌿', label: 'Природа' },
  ];

  // Расширенный список популярных и терапевтических тем
  const themesList = [
    { id: 'Дружба и верность', label: 'Дружба и верность 🤝' },
    { id: 'Доброта и забота', label: 'Доброта и забота 💛' },
    { id: 'Смелость и победа над страхами', label: 'Смелость и отвага 🦁' },
    { id: 'Спокойный и сладкий сон', label: 'Спокойный сон 🌙' },
    { id: 'Волшебные сны и звездопад', label: 'Волшебные сны 🌌' },
    { id: 'Тёплые объятия перед сном', label: 'Уют перед сном 🧸' },
    { id: 'Заколдованный лес и тайны', label: 'Заколдованный лес 🌲' },
    { id: 'Космическое путешествие', label: 'Космос и звёзды 🚀' },
    { id: 'Морские глубины и киты', label: 'Подводный мир 🐬' },
    { id: 'Страна дружелюбных динозавров', label: 'Остров динозавров 🦕' },
    { id: 'Город добрых машинок', label: 'Город машинок 🚗' },
    { id: 'Замок маленьких фей и магов', label: 'Замок фей 🪄' },
    { id: 'Капризы и управление эмоциями', label: 'Капризы и эмоции 🎈' },
    { id: 'Честность и искренность', label: 'Честность ✨' },
    { id: 'Умение делиться и дружить', label: 'Умение делиться 💫' },
    { id: 'Любознательность и открытия', label: 'Любознательность 🔍' },
    { id: 'Порядок и уборка игрушек', label: 'Уборка игрушек 🧹' },
    { id: 'Любовь к детскому садику', label: 'Любимый садик 🎒' },
    { id: 'Смелый поход к врачу', label: 'Поход к врачу 🩺' },
    { id: 'Появление братика или сестрёнки', label: 'Братик или сестрёнка 👶' },
    { id: 'Бережное отношение к природе', label: 'Забота о природе 🌿' },
  ];

  // Быстрые подсказки-идеи для одежды
  const clothingSuggestions = [
    { icon: '🌧️', text: 'Жёлтый дождевик и сапожки' },
    { icon: '⭐', text: 'Уютная пижамка со звёздочками' },
    { icon: '🧶', text: 'Тёплый вязаный свитер' },
    { icon: '👗', text: 'Сказочное пышное платьице' },
    { icon: '👖', text: 'Джинсовый комбинезончик' },
    { icon: '🚀', text: 'Костюм юного космонавта' },
    { icon: '🦕', text: 'Футболка с динозавриком' },
    { icon: '👑', text: 'Бархатная мантия волшебника' },
    { icon: '🦊', text: 'Толстовка с рыжей лисичкой' },
    { icon: '🦸', text: 'Костюм доброго супергероя' },
  ];

  const companionToys = [
    { id: 'плюшевый динозаврик', icon: '🦖', label: 'Динозаврик' },
    { id: 'плюшевый мишка', icon: '🧸', label: 'Мишка' },
    { id: 'пушистый зайка', icon: '🐰', label: 'Зайка' },
    { id: 'маленький котёнок', icon: '🐱', label: 'Котёнок' },
    { id: 'волшебная звёздочка', icon: '⭐', label: 'Звёздочка' },
    { id: 'быстрая машинка', icon: '🚗', label: 'Машинка' },
  ];

  const appearance = data.appearance || {
    avatar_id: 'hero_custom',
    hairColor: 'светлые',
    hairType: 'кудрявые',
    clothingItem: 'жёлтый дождевик и сапожки',
    clothingColor: 'солнечно-жёлтый',
    toy: 'плюшевый динозаврик',
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

  // Цвет волос для превью
  const hairColorsMap: Record<string, string> = {
    светлые: '#F7DC6F',
    русые: '#C49A45',
    тёмные: '#3E2723',
    рыжие: '#E65100',
  };
  const activeColorHex = hairColorsMap[appearance.hairColor] || '#C49A45';

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
          Настройте одежду, спутника и тему — малыш оживёт на иллюстрациях сказки
        </p>
      </div>

      {/* Интерактивный нарисованный аватар ребёнка по его параметрам */}
      <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-sm">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-50 flex items-center justify-center">
          {/* Нарисованный малыш */}
          <div className="relative flex flex-col items-center">
            {/* Голова */}
            <div className="relative w-12 h-12 rounded-full bg-[#FFE0BD] border-2 border-[#F3C59D] flex items-center justify-center">
              {/* Волосы по параметрам из профиля */}
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
                <div className="absolute -top-1.5 right-0 text-[10px]">🎀</div>
              )}
              {/* Глазки */}
              <div className="flex gap-2 mt-2">
                <div className="w-1.5 h-1.5 bg-[#2D3436] rounded-full" />
                <div className="w-1.5 h-1.5 bg-[#2D3436] rounded-full" />
              </div>
            </div>
            {/* Одежда */}
            <div
              className="w-10 h-7 rounded-t-lg -mt-1 border border-black/10 relative flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: activeClothingHex }}
            >
              {/* Игрушка в ручках */}
              <div className="absolute -right-2 bottom-0 text-sm">
                {companionToys.find((t) => t.id === appearance.toy)?.icon || '🦖'}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2.5 text-center">
          <div className="font-serif font-bold text-base text-stone-900">
            {data.childName || 'Герой'} • {data.gender === 'girl' ? 'Девочка' : 'Мальчик'}, {data.age} года
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/60 text-[11px] font-medium text-amber-900 mt-1.5 shadow-xs">
            <span>✨</span>
            <span>{appearance.hairColor} {appearance.hairType} волосы (из профиля)</span>
          </div>
        </div>
      </div>

      {/* Одежда героя (Свободный ввод + подсказки) */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <span>👕</span>
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
                  className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 hover:border-brand-300 active:scale-95'
                  }`}
                >
                  <span className="mr-1">{sug.icon}</span>
                  <span>{sug.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Любимая игрушка-спутник */}
      <div className="space-y-2 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <label className="text-xs font-bold text-stone-700 block">
          Игрушка-спутник (будет помогать герою в сказке)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {companionToys.map((toy) => {
            const isSelected = appearance.toy === toy.id;
            return (
              <button
                key={toy.id}
                type="button"
                onClick={() => updateAppearance({ toy: toy.id })}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500'
                    : 'bg-cream-50 border-cream-300 text-stone-700'
                }`}
              >
                <span className="text-xl mb-0.5">{toy.icon}</span>
                <span className="text-[10px] font-bold">{toy.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Сетка карточек «Что любит?» */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Что любит ребёнок?</label>
        <div className="grid grid-cols-3 gap-2.5">
          {interestsList.map((item) => {
            const isSelected = data.interests.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleInterest(item.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 shadow-sm ring-1 ring-brand-500'
                    : 'bg-white border-cream-300 hover:bg-cream-50 active:scale-95'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-brand-800' : 'text-stone-700'}`}>
                  {item.label}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-brand-600 mt-1" />
                )}
              </button>
            );
          })}
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
                className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
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
          <span>Далее к деталям</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
