import React, { useState } from 'react';

export interface ChildAppearanceProps {
  gender?: 'boy' | 'girl';
  hairColor?: string; // 'светлые' | 'русые' | 'тёмные' | 'рыжие'
  hairType?: string; // 'кудрявые' | 'короткие' | 'длинные'
  clothingItem?: string; // 'уютный свитер' | 'комбинезончик' | 'платьице' | 'толстовка'
  clothingColor?: string; // 'изумрудный' | 'солнечно-жёлтый' | 'небесно-голубой' | 'нежно-розовый' | 'терракотовый'
  toy?: string; // 'плюшевый мишка' | 'зайка' | 'динозаврик' | 'котёнок' | 'звёздочка'
}

interface FairytaleIllustrationProps {
  sceneIndex: number;
  theme: string;
  interest: string;
  childName: string;
  appearance?: ChildAppearanceProps;
  imageUrl?: string | null;
}

export const FairytaleIllustration: React.FC<FairytaleIllustrationProps> = ({
  sceneIndex,
  theme,
  interest,
  childName,
  appearance,
  imageUrl,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Цвета волос
  const hairColors: Record<string, string> = {
    светлые: '#F7DC6F',
    русые: '#C49A45',
    тёмные: '#3E2723',
    рыжие: '#E65100',
  };

  // Цвета одежды
  const clothingColors: Record<string, { fill: string; accent: string }> = {
    изумрудный: { fill: '#2E6F5E', accent: '#3F8A75' },
    'солнечно-жёлтый': { fill: '#F5B041', accent: '#F8C471' },
    'небесно-голубой': { fill: '#5DADE2', accent: '#85C1E9' },
    'нежно-розовый': { fill: '#F1948A', accent: '#F5B7B1' },
    терракотовый: { fill: '#D35400', accent: '#E59866' },
  };

  const selectedHairColor =
    hairColors[appearance?.hairColor?.toLowerCase() || 'светлые'] || '#F7DC6F';
  const selectedClothing =
    clothingColors[appearance?.clothingColor?.toLowerCase() || 'изумрудный'] || {
      fill: '#2E6F5E',
      accent: '#3F8A75',
    };
  const isGirl = appearance?.gender === 'girl';
  const isCurly = appearance?.hairType === 'кудрявые';
  const isLong = appearance?.hairType === 'длинные';
  const toyType = appearance?.toy?.toLowerCase() || 'динозаврик';

  // Иконка спутника
  const toyEmoji = toyType.includes('мишка')
    ? '🧸'
    : toyType.includes('зайка')
    ? '🐰'
    : toyType.includes('котик')
    ? '🐱'
    : toyType.includes('звёзд')
    ? '⭐'
    : '🦖';

  // Палитра фона по интересу
  const getSceneBackdrop = () => {
    switch (interest) {
      case 'Космос':
        return {
          sky: 'linear-gradient(180deg, #1A1C3B 0%, #302B63 60%, #4D3B73 100%)',
          accent: '#FFEAA7',
          elements: 'space',
        };
      case 'Динозавры':
        return {
          sky: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)',
          accent: '#81C784',
          elements: 'dino',
        };
      case 'Животные':
        return {
          sky: 'linear-gradient(180deg, #FFF9C4 0%, #FFF176 50%, #E8F5E9 100%)',
          accent: '#A5D6A7',
          elements: 'animals',
        };
      case 'Машинки':
        return {
          sky: 'linear-gradient(180deg, #E1F5FE 0%, #B3E5FC 60%, #C8E6C9 100%)',
          accent: '#FF8A65',
          elements: 'cars',
        };
      case 'Природа':
        return {
          sky: 'linear-gradient(180deg, #E0F2F1 0%, #B2DFDB 60%, #80CBC4 100%)',
          accent: '#81C784',
          elements: 'nature',
        };
      default: // Волшебство
        return {
          sky: 'linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 50%, #FFE0B2 100%)',
          accent: '#FFD54F',
          elements: 'magic',
        };
    }
  };

  const backdrop = getSceneBackdrop();

  // Защита от случайных стоковых фотографий (типа Unsplash с казино):
  // Показываем внешнюю картинку только если это НЕ Unsplash
  const isUnsplash = Boolean(imageUrl && imageUrl.includes('unsplash.com'));
  const canShowImage = Boolean(imageUrl) && !isUnsplash && !imageFailed;

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-card border-2 border-amber-100/80 bg-cream-100 select-none">
      {/* Если есть проверенная внешняя иллюстрация и она загрузилась */}
      {canShowImage ? (
        <img
          src={imageUrl!}
          alt={`Сцена ${sceneIndex}`}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      ) : (
        /* Иллюстрация в тёплом стиле 3D Disney Pixar анимации */
        <div
          className="w-full h-full relative overflow-hidden flex items-end justify-center"
          style={{ background: backdrop.sky }}
        >
          {/* 3D Pixar Объёмный солнечный свет (God rays) и волшебные парящие искры */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-100/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-3 left-4 text-white/80 text-lg animate-pulse">✨</div>
          <div className="absolute top-8 left-1/4 text-amber-200/70 text-xs animate-ping">✦</div>
          <div className="absolute top-6 right-6 text-amber-200/90 text-2xl drop-shadow-md">
            {interest === 'Космос' || sceneIndex === 4 ? '🌙' : interest === 'Волшебство' ? '🌟' : '☀️'}
          </div>
          <div className="absolute top-10 left-12 w-20 h-7 bg-white/35 rounded-full blur-[2px]" />
          <div className="absolute top-14 right-16 w-28 h-8 bg-white/30 rounded-full blur-[2px]" />

          {/* Тематические сказочные задние планы */}
          {backdrop.elements === 'space' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-8 left-1/3 text-xl opacity-80">🪐</div>
              <div className="absolute top-16 right-1/4 text-2xl opacity-90 animate-bounce">🚀</div>
              <div className="absolute bottom-12 left-6 text-sm text-amber-100">⭐️ ⭐️ ⭐️</div>
            </div>
          )}

          {backdrop.elements === 'dino' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-10 right-6 text-5xl opacity-90">🦕</div>
              <div className="absolute bottom-8 left-6 text-3xl opacity-80">🌿</div>
              <div className="absolute bottom-6 left-16 text-2xl opacity-80">🌱</div>
            </div>
          )}

          {backdrop.elements === 'animals' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-8 right-8 text-4xl opacity-90">🦊</div>
              <div className="absolute bottom-7 left-8 text-3xl opacity-80">🦔</div>
              <div className="absolute top-12 left-1/4 text-2xl opacity-80">🐿️</div>
            </div>
          )}

          {backdrop.elements === 'magic' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-12 right-6 text-4xl opacity-85">🏰</div>
              <div className="absolute top-14 left-8 text-2xl text-amber-300 animate-pulse">🪄</div>
              <div className="absolute bottom-8 left-10 text-3xl opacity-80">🍄</div>
            </div>
          )}

          {backdrop.elements === 'cars' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-7 left-1/4 text-2xl opacity-80">🌈</div>
              <div className="absolute bottom-10 right-6 text-4xl opacity-95">🚗</div>
              <div className="absolute bottom-12 left-6 text-2xl opacity-85">🚦</div>
              <div className="absolute bottom-8 left-1/3 text-xl opacity-80">🚙</div>
              <div className="absolute top-10 right-1/4 text-lg opacity-80">🎈</div>
            </div>
          )}

          {backdrop.elements === 'nature' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-10 right-8 text-4xl opacity-90">🌸</div>
              <div className="absolute bottom-7 left-6 text-3xl opacity-80">🦋</div>
              <div className="absolute bottom-9 left-20 text-3xl opacity-80">🌼</div>
            </div>
          )}

          {/* Акварельные холмы на переднем плане */}
          <div className="absolute -bottom-10 -left-12 -right-12 h-32 bg-amber-100/90 rounded-[100%] border-t-2 border-amber-200/60 shadow-inner" />
          <div className="absolute -bottom-14 -left-8 -right-8 h-32 bg-[#FAF6F0] rounded-[100%] border-t border-amber-200/50" />

          {/* Персонаж ребёнка (строго по выбранным параметрам внешности) */}
          <div className="relative z-10 flex flex-col items-center mb-4 transition-transform hover:scale-105 duration-300">
            {/* Голова и волосы (3D объём с подповерхностным рассеиванием SSS) */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-b from-[#FFF3E3] via-[#FFE2C2] to-[#F5CCA2] border-2 border-[#F3C59D] shadow-md flex items-center justify-center">
              {/* Причёска */}
              <div
                className={`absolute -top-1 inset-x-0 ${
                  isCurly
                    ? 'h-6 rounded-t-full border-t-4 border-l-2 border-r-2'
                    : isLong
                    ? 'h-8 rounded-t-2xl'
                    : 'h-5 rounded-t-full'
                }`}
                style={{ backgroundColor: selectedHairColor }}
              />

              {/* Косички или бантики для девочки */}
              {isGirl && (
                <>
                  <div
                    className="absolute -left-2 top-2 w-3.5 h-6 rounded-full"
                    style={{ backgroundColor: selectedHairColor }}
                  />
                  <div
                    className="absolute -right-2 top-2 w-3.5 h-6 rounded-full"
                    style={{ backgroundColor: selectedHairColor }}
                  />
                  <div className="absolute -top-2 right-1 text-xs">🎀</div>
                </>
              )}

              {/* Кудри по бокам если кудрявый */}
              {isCurly && !isGirl && (
                <>
                  <div
                    className="absolute -left-1.5 top-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedHairColor }}
                  />
                  <div
                    className="absolute -right-1.5 top-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedHairColor }}
                  />
                </>
              )}

              {/* 3D Pixar Глазки с двойными бликами и румяные щёчки */}
              <div className="relative z-10 flex flex-col items-center mt-1.5 space-y-0.5">
                <div className="flex gap-3">
                  <div className="w-2.5 h-3 bg-[#1A1A24] rounded-full relative overflow-hidden shadow-inner">
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/80 rounded-full" />
                  </div>
                  <div className="w-2.5 h-3 bg-[#1A1A24] rounded-full relative overflow-hidden shadow-inner">
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                    <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/80 rounded-full" />
                  </div>
                </div>
                {/* Улыбка и персиковые румяные щёчки (Subsurface scattering) */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="w-2.5 h-1.5 bg-pink-400/50 rounded-full blur-[0.5px]" />
                  <div className="w-2.5 h-1 border-b-2 border-[#D35400] rounded-full" />
                  <div className="w-2.5 h-1.5 bg-pink-400/50 rounded-full blur-[0.5px]" />
                </div>
              </div>
            </div>

            {/* Тело и одежда */}
            <div className="relative -mt-1 flex items-center justify-center">
              <div
                className={`w-12 ${
                  isGirl ? 'h-11 rounded-b-2xl' : 'h-10 rounded-2xl'
                } border border-black/10 shadow-sm flex items-center justify-center relative`}
                style={{ backgroundColor: selectedClothing.fill }}
              >
                {/* Воротничок */}
                <div className="absolute -top-1 w-5 h-2 bg-white/70 rounded-full" />

                {/* Любимая игрушка-спутник в ручках */}
                <div className="absolute -right-3 bottom-0 text-xl filter drop-shadow">
                  {toyEmoji}
                </div>
              </div>
            </div>

            {/* Имя и бейдж героя */}
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-200/60 shadow-sm text-[10px] font-bold text-stone-800 flex items-center gap-1">
              <span>{childName}</span>
              <span className="text-[9px] opacity-70">
                • {appearance?.hairColor || 'светлые'} кудри
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Бейдж номера сцены */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-cream-300 text-stone-800 text-[11px] font-bold shadow-sm flex items-center gap-1">
        <span>📖</span>
        <span>Сцена {sceneIndex} из 4</span>
      </div>

      {/* Бейдж темы */}
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-brand-500/90 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
        {theme}
      </div>
    </div>
  );
};
