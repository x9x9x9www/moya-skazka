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
    hairType: string; // 'кудрявые' | 'короткие' | 'длинные'
    clothingItem: string; // 'уютный свитер' | 'комбинезончик' | 'платьице' | 'толстовка'
    clothingColor: string; // 'изумрудный' | 'солнечно-жёлтый' | 'небесно-голубой' | 'нежно-розовый' | 'терракотовый'
    toy: string; // 'плюшевый мишка' | 'зайка' | 'динозаврик' | 'котёнок' | 'звёздочка'
    eyeColor?: string; // 'карие' | 'голубые' | 'зелёные' | 'серые'
    skinTone?: string; // 'светлая' | 'персиковая' | 'смуглая'
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

  const themesList = [
    'Дружба',
    'Смелость',
    'Спокойный сон',
    'Доброта и забота',
    'Любознательность',
    'Честность',
    'Капризы и эмоции',
    'Волшебные сны',
  ];

  const hairColors = [
    { id: 'светлые', label: 'Светлые', color: '#F7DC6F' },
    { id: 'русые', label: 'Русые', color: '#C49A45' },
    { id: 'тёмные', label: 'Тёмные', color: '#3E2723' },
    { id: 'рыжие', label: 'Рыжие', color: '#E65100' },
  ];

  const hairTypes = [
    { id: 'короткие', label: 'Короткие ✂️' },
    { id: 'длинные', label: 'Длинные 🎀' },
    { id: 'кудрявые', label: 'Кудрявые 🌀' },
    { id: 'прямые', label: 'Прямые ✨' },
  ];

  const clothingItems = [
    { id: 'уютный свитер', label: 'Свитер 🧶' },
    { id: 'комбинезончик', label: 'Комбинезон 👖' },
    { id: 'платьице', label: 'Платьице 👗' },
    { id: 'толстовка', label: 'Толстовка 👕' },
  ];

  const clothingColorList = [
    { id: 'изумрудный', label: 'Изумрудный', bg: '#2E6F5E' },
    { id: 'солнечно-жёлтый', label: 'Жёлтый', bg: '#F5B041' },
    { id: 'небесно-голубой', label: 'Голубой', bg: '#5DADE2' },
    { id: 'нежно-розовый', label: 'Розовый', bg: '#F1948A' },
    { id: 'терракотовый', label: 'Терракот', bg: '#D35400' },
  ];

  const companionToys = [
    { id: 'плюшевый динозаврик', icon: '🦖', label: 'Динозаврик' },
    { id: 'плюшевый мишка', icon: '🧸', label: 'Мишка' },
    { id: 'пушистый зайка', icon: '🐰', label: 'Зайка' },
    { id: 'маленький котёнок', icon: '🐱', label: 'Котёнок' },
    { id: 'волшебная звёздочка', icon: '⭐', label: 'Звёздочка' },
  ];

  const appearance = data.appearance || {
    avatar_id: 'hero_custom',
    hairColor: 'светлые',
    hairType: 'кудрявые',
    clothingItem: 'уютный свитер',
    clothingColor: 'изумрудный',
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

  const activeColorHex =
    hairColors.find((h) => h.id === appearance.hairColor)?.color || '#F7DC6F';
  const activeClothingHex =
    clothingColorList.find((c) => c.id === appearance.clothingColor)?.bg || '#2E6F5E';

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
          Настройте внешность малыша — он оживёт на иллюстрациях и страницах книги
        </p>
      </div>

      {/* Интерактивный нарисованный аватар ребёнка по его параметрам */}
      <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-sm">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-50 flex items-center justify-center">
          {/* Нарисованный малыш */}
          <div className="relative flex flex-col items-center">
            {/* Голова */}
            <div className="relative w-12 h-12 rounded-full bg-[#FFE0BD] border-2 border-[#F3C59D] flex items-center justify-center">
              {/* Волосы */}
              <div
                className={`absolute -top-1 inset-x-0 ${
                  appearance.hairType === 'кудрявые'
                    ? 'h-5 rounded-t-full border-t-2'
                    : appearance.hairType === 'длинные'
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
              className="w-10 h-7 rounded-t-lg -mt-1 border border-black/10 relative flex items-center justify-center"
              style={{ backgroundColor: activeClothingHex }}
            >
              {/* Игрушка в ручках */}
              <div className="absolute -right-2 bottom-0 text-sm">
                {companionToys.find((t) => t.id === appearance.toy)?.icon || '🦖'}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="font-serif font-bold text-sm text-stone-900">
            {data.childName || 'Герой'} • {data.gender === 'girl' ? 'Девочка' : 'Мальчик'}, {data.age} года
          </div>
          <div className="text-[11px] text-stone-500">
            {appearance.hairColor} {appearance.hairType} волосы, {appearance.clothingColor} {appearance.clothingItem}
          </div>
        </div>
      </div>

      {/* Имя ребёнка */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700">Имя ребёнка</label>
        <input
          type="text"
          value={data.childName}
          onChange={(e) => onChange({ ...data, childName: e.target.value })}
          placeholder="Например, Петька"
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-stone-800 shadow-sm"
        />
      </div>

      {/* Пол (Мальчик / Девочка) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700">Пол героя</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...data, gender: 'boy' })}
            className={`py-3 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
              data.gender === 'boy'
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
            }`}
          >
            <span>👦</span>
            <span>Мальчик</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...data, gender: 'girl' })}
            className={`py-3 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
              data.gender === 'girl'
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
            }`}
          >
            <span>👧</span>
            <span>Девочка</span>
          </button>
        </div>
      </div>

      {/* Возраст (2-6 лет) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Возраст</label>
        <div className="grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((ageNum) => {
            const isSelected = data.age === ageNum;
            return (
              <button
                key={ageNum}
                type="button"
                onClick={() => onChange({ ...data, age: ageNum })}
                className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-md scale-105'
                    : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 active:scale-95'
                }`}
              >
                {ageNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Цвет и тип волос */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <label className="text-xs font-bold text-stone-700 block">
          Причёска и цвет волос
        </label>
        
        {/* Цвет волос */}
        <div className="grid grid-cols-4 gap-2">
          {hairColors.map((h) => {
            const isSelected = appearance.hairColor === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => updateAppearance({ hairColor: h.id })}
                className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-500'
                    : 'border-cream-300 bg-cream-50 text-stone-600'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ backgroundColor: h.color }}
                />
                <span className="text-[11px]">{h.label}</span>
              </button>
            );
          })}
        </div>

        {/* Тип волос */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {hairTypes.map((t) => {
            const isSelected = appearance.hairType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updateAppearance({ hairType: t.id })}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-cream-50 text-stone-700 border-cream-300'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Любимая одежда и её цвет */}
      <div className="space-y-3 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm">
        <label className="text-xs font-bold text-stone-700 block">
          Любимая одежда героя
        </label>

        {/* Фасон одежды */}
        <div className="grid grid-cols-2 gap-2">
          {clothingItems.map((c) => {
            const isSelected = appearance.clothingItem === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => updateAppearance({ clothingItem: c.id })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-cream-50 text-stone-700 border-cream-300'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Цвет одежды */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {clothingColorList.map((col) => {
            const isSelected = appearance.clothingColor === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => updateAppearance({ clothingColor: col.id })}
                className={`py-1.5 px-3 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-sm ring-1 ring-brand-500'
                    : 'bg-white border-cream-300 text-stone-600'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full border border-black/20"
                  style={{ backgroundColor: col.bg }}
                />
                <span>{col.label}</span>
              </button>
            );
          })}
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

      {/* Теги «Главная тема» */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Главная тема сказки</label>
        <div className="flex flex-wrap gap-2">
          {themesList.map((theme) => {
            const isSelected = data.theme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => onChange({ ...data, theme })}
                className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100 active:scale-95'
                }`}
              >
                {theme}
              </button>
            );
          })}
        </div>
        <div className="pt-1">
          <input
            type="text"
            value={data.theme}
            onChange={(e) => onChange({ ...data, theme: e.target.value })}
            placeholder="Или введите свою тему (например: Любовь к садику, Уборка игрушек...)"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold text-stone-800 shadow-sm"
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
