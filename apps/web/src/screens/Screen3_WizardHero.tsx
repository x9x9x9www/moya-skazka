import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export interface WizardHeroData {
  childName: string;
  age: number;
  interests: string[];
  theme: string;
  appearance: {
    avatar_id: string;
    hair: string;
    clothing: string;
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
  onBack,
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

  const toggleInterest = (id: string) => {
    const updated = data.interests.includes(id)
      ? data.interests.filter((i) => i !== id)
      : [...data.interests, id];
    onChange({ ...data, interests: updated });
  };

  const setAge = (age: number) => {
    onChange({ ...data, age });
  };

  const setTheme = (theme: string) => {
    onChange({ ...data, theme });
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Индикатор прогресса */}
      <div className="text-center">
        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          1 из 3
        </span>
        <h2 className="font-serif font-bold text-2xl text-stone-900 mt-2">
          Расскажите о герое
        </h2>
      </div>

      {/* Аватар персонажа (выбор внешности без фото ребёнка по ТЗ) */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-tr from-amber-200 to-amber-100 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80"
            alt="Герой"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs text-stone-500 mt-2 font-medium">
          Внешность настраивается параметрами
        </span>
      </div>

      {/* Имя ребёнка */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700">Имя ребёнка</label>
        <input
          type="text"
          value={data.childName}
          onChange={(e) => onChange({ ...data, childName: e.target.value })}
          placeholder="Например, Миша"
          className="w-full px-4 py-3.5 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-stone-800 shadow-sm"
        />
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
                onClick={() => setAge(ageNum)}
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

      {/* Сетка карточек «Что любит?» */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Что любит?</label>
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
        <label className="text-xs font-bold text-stone-700">Главная тема</label>
        <div className="flex flex-wrap gap-2">
          {themesList.map((theme) => {
            const isSelected = data.theme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => setTheme(theme)}
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
            onChange={(e) => setTheme(e.target.value)}
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
          <span>Далее</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
