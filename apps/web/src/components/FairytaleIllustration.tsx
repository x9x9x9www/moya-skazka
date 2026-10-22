import React, { useState } from 'react';
import { FairyStarIcon, FairyBookIcon, ArtPaletteIcon } from './FairytaleIcons';

export interface ChildAppearanceProps {
  gender?: 'boy' | 'girl';
  hairColor?: string;
  hairType?: string;
  clothingItem?: string;
  clothingColor?: string;
  toy?: string;
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
  interest,
  childName,
  imageUrl,
}) => {
  const fallbackSrc = `./illustrations/scene_${sceneIndex}.jpg`;
  const [currentSrc, setCurrentSrc] = useState<string>(imageUrl || fallbackSrc);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  React.useEffect(() => {
    setCurrentSrc(imageUrl || fallbackSrc);
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageUrl, sceneIndex]);

  const handleImageError = () => {
    if (currentSrc !== fallbackSrc) {
      console.warn(`[FairytaleIllustration] Primary image failed, switching to local fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    } else {
      setImageFailed(true);
    }
  };

  // Проверяем, является ли ссылка настоящей картинкой
  const hasValidImage = Boolean(currentSrc) && !imageFailed;

  // Фон под тему истории
  const getThemeGradient = () => {
    switch (interest) {
      case 'Космос':
        return 'from-[#1A1C3B] via-[#2D2A57] to-[#453765]';
      case 'Динозавры':
        return 'from-[#2D5A43] via-[#3E7A5B] to-[#5C9E78]';
      case 'Животные':
        return 'from-[#7A4E2D] via-[#A66C3E] to-[#C88A53]';
      case 'Машинки':
        return 'from-[#2C5282] via-[#3182CE] to-[#4299E1]';
      case 'Природа':
        return 'from-[#2E6F5E] via-[#3F8A75] to-[#56B299]';
      default: // Волшебство
        return 'from-[#553C9A] via-[#6B46C1] to-[#9F7AEA]';
    }
  };

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-card border-2 border-amber-100/80 bg-cream-100 select-none">
      {/* 1. Если реальная нейросетевая иллюстрация получена */}
      {hasValidImage ? (
        <div className="relative w-full h-full">
          <img
            src={currentSrc}
            alt={`Сцена ${sceneIndex} для ${childName}`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
          {/* Мягкая виньетка поверх картины */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />
        </div>
      ) : null}

      {/* 2. Если иллюстрация генерируется нейросетью или загружается */}
      {(!hasValidImage || !imageLoaded) && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getThemeGradient()} flex flex-col items-center justify-center p-6 text-center text-white`}
        >
          {/* Волшебные парящие искры */}
          <FairyStarIcon className="absolute top-4 left-6 w-5 h-5 text-amber-200/80 animate-pulse" />
          <div className="absolute top-8 right-8 text-amber-100/70 text-sm animate-ping">✦</div>
          <div className="absolute bottom-6 left-8 text-amber-200/60 text-lg">✦</div>
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />

          {/* Анимированная иконка художника */}
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg animate-bounce mb-3">
            <ArtPaletteIcon className="w-8 h-8 text-amber-100 drop-shadow" />
          </div>

          <div className="relative z-10 font-serif font-bold text-lg tracking-wide text-amber-100 drop-shadow-sm">
            Nano-Banana 2
          </div>

          <div className="relative z-10 text-xs text-white/90 font-medium max-w-xs mt-1 leading-snug">
            Создаёт тёплую акварельную иллюстрацию для сцены {sceneIndex}...
          </div>

          <div className="relative z-10 mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/15 text-[11px] text-amber-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            <span>Герой: {childName}</span>
          </div>
        </div>
      )}

      {/* Бейдж номера сцены слева вверху */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-white shadow-sm border border-white/20 flex items-center gap-1.5">
        <FairyBookIcon className="w-3.5 h-3.5 text-amber-300" />
        <span>Сцена {sceneIndex} из 4</span>
      </div>

      {/* Бейдж темы / интереса справа вверху */}
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-amber-200 shadow-sm border border-white/20 flex items-center gap-1.5">
        <FairyStarIcon className="w-3.5 h-3.5 text-amber-300" />
        <span>{interest}</span>
      </div>
    </div>
  );
};
