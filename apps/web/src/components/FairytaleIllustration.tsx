import React, { useState, useEffect } from 'react';
import { FairyStarIcon, ArtPaletteIcon } from './FairytaleIcons';
import { Sparkles, Wand2 } from 'lucide-react';
import { getFairytaleFallbackIllustration } from '../services/storyGenerator';

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

const MAGIC_CRAFT_MESSAGES = [
  'Волшебная кисть смешивает звёздные краски...',
  'Сказочный художник наносит мягкие мазки на холст...',
  'Оживляем акварельный мир специально для тебя...',
  'Добрые светлячки зажигают фонарики на картине...',
  'Звёздная пыль проявляет волшебный сюжет...',
];

export const FairytaleIllustration: React.FC<FairytaleIllustrationProps> = ({
  sceneIndex,
  theme,
  interest,
  childName,
  imageUrl,
}) => {
  const fallbackSrc = getFairytaleFallbackIllustration(theme || interest, sceneIndex);
  const [currentSrc, setCurrentSrc] = useState<string>(imageUrl || '');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (imageUrl) {
      setCurrentSrc(imageUrl);
      setImageLoaded(false);
      setImageFailed(false);
    } else {
      setCurrentSrc('');
      setImageLoaded(false);
      setImageFailed(false);
    }
  }, [imageUrl, sceneIndex]);

  // Ротация сказочных фраз во время создания иллюстрации
  useEffect(() => {
    if (imageLoaded) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MAGIC_CRAFT_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [imageLoaded]);

  const handleImageError = () => {
    if (currentSrc && currentSrc !== fallbackSrc) {
      console.warn(`[FairytaleIllustration] Primary image failed, switching to local fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setImageLoaded(false);
    } else {
      console.warn(`[FairytaleIllustration] Image load failed: ${currentSrc}`);
      setImageFailed(true);
    }
  };

  // Проверяем, есть ли ссылка на картинку и не завершилась ли она ошибкой
  const hasValidImage = Boolean(currentSrc) && !imageFailed;

  // Фон под тему истории
  const getThemeGradient = () => {
    switch (interest) {
      case 'Космос':
        return 'from-[#16192E] via-[#2A2B4C] to-[#1E2340]';
      case 'Динозавры':
        return 'from-[#143D32] via-[#1F5F4E] to-[#2D7360]';
      case 'Животные':
        return 'from-[#3D2817] via-[#5C3D24] to-[#7A5230]';
      case 'Машинки':
        return 'from-[#1A365D] via-[#2B4C7E] to-[#3B629B]';
      case 'Природа':
        return 'from-[#12382E] via-[#1F5F4E] to-[#347B67]';
      default: // Волшебство
        return 'from-[#23173B] via-[#3B255E] to-[#4F337E]';
    }
  };

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-card border-2 border-amber-100/80 bg-cream-100 select-none">
      {/* 1. Если иллюстрация готова и загружена */}
      {hasValidImage ? (
        <div className="relative w-full h-full">
          <img
            src={currentSrc}
            alt={`Сцена ${sceneIndex} для ${childName}`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
          {/* Мягкая виньетка поверх картины */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />
        </div>
      ) : null}

      {/* 2. Волшебный экран создания иллюстрации в мастерской */}
      {(!hasValidImage || !imageLoaded) && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getThemeGradient()} flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden`}
        >
          {/* Мерцающие волшебные искры и светлячки */}
          <FairyStarIcon className="absolute top-5 left-6 w-5 h-5 text-amber-200/70 animate-pulse pointer-events-none" />
          <div className="absolute top-7 right-8 text-amber-200/60 text-xs animate-ping pointer-events-none">✦</div>
          <div className="absolute bottom-8 left-8 text-amber-300/50 text-base animate-pulse pointer-events-none">✦</div>
          <div className="absolute bottom-5 right-9 text-amber-100/40 text-sm pointer-events-none">✨</div>

          {/* Мягкие световые пятна (Ambient Magic Glow) */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Центральный парящий медальон сказочного художника */}
          <div className="relative z-10 mb-3.5">
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-white/25 via-amber-200/20 to-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
              <ArtPaletteIcon className="w-8 h-8 text-amber-100 drop-shadow-md animate-pulse" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400/90 border border-white text-stone-900 flex items-center justify-center shadow-sm">
                <Wand2 className="w-3.5 h-3.5 text-stone-950" />
              </div>
            </div>
            {/* Внешний пульсирующий ореол */}
            <div className="absolute -inset-2 rounded-full border border-amber-300/30 animate-ping pointer-events-none opacity-40" />
          </div>

          {/* Заголовок мастерской */}
          <div className="relative z-10 font-serif font-bold text-lg tracking-wide text-amber-100 drop-shadow flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/50 shrink-0" />
            <span>Волшебная мастерская</span>
          </div>

          {/* Динамическая сказочная фраза с плавной сменой */}
          <div className="relative z-10 h-9 flex items-center justify-center max-w-xs mt-1 px-2">
            <p
              key={messageIndex}
              className="text-xs text-amber-100/95 font-medium leading-snug drop-shadow-xs transition-opacity duration-500 animate-in fade-in"
            >
              {MAGIC_CRAFT_MESSAGES[messageIndex]}
            </p>
          </div>

          {/* Индикатор светлячков и плашка героя */}
          <div className="relative z-10 mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[11px] text-amber-200 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              <span className="font-medium">Герой сказки: {childName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
