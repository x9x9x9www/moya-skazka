import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

// 1. Аватары героев (Мальчик и Девочка) вместо 👦 и 👧
export const BoyAvatar: React.FC<IconProps> = ({ className = 'w-7 h-7', style }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <circle cx="18" cy="18" r="17" fill="url(#boy-bg)" stroke="#F3B755" strokeWidth="1.5" />
    <defs>
      <linearGradient id="boy-bg" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E0F2FE" />
        <stop stopColor="#BAE6FD" />
      </linearGradient>
    </defs>
    {/* Волосы сзади */}
    <path d="M11 18C11 12 14 8 18 8C22 8 25 12 25 18H11Z" fill="#854D0E" />
    {/* Личико */}
    <circle cx="18" cy="19" r="7.5" fill="#FDE68A" />
    {/* Глазки */}
    <circle cx="15.5" cy="18.5" r="1.1" fill="#1E293B" />
    <circle cx="20.5" cy="18.5" r="1.1" fill="#1E293B" />
    <circle cx="15.8" cy="18.2" r="0.4" fill="#FFFFFF" />
    <circle cx="20.8" cy="18.2" r="0.4" fill="#FFFFFF" />
    {/* Улыбка */}
    <path d="M16 21.5C16.8 22.8 19.2 22.8 20 21.5" stroke="#B45309" strokeWidth="1.1" strokeLinecap="round" />
    {/* Румянец */}
    <ellipse cx="14" cy="20.5" rx="1.2" ry="0.8" fill="#FCA5A5" opacity="0.6" />
    <ellipse cx="22" cy="20.5" rx="1.2" ry="0.8" fill="#FCA5A5" opacity="0.6" />
    {/* Задорная челка */}
    <path d="M12 14C14 11 17 11 19 13C21 11 23 12 24 15C22 14 19 14.5 18 16C17 14 14 13.5 12 14Z" fill="#A16207" />
    {/* Маленькая корона искателя приключений */}
    <path d="M15 9L16.5 11L18 8.5L19.5 11L21 9V12H15V9Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
  </svg>
);

export const GirlAvatar: React.FC<IconProps> = ({ className = 'w-7 h-7', style }) => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <circle cx="18" cy="18" r="17" fill="url(#girl-bg)" stroke="#F472B6" strokeWidth="1.5" />
    <defs>
      <linearGradient id="girl-bg" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FCE7F3" />
        <stop stopColor="#FBCFE8" />
      </linearGradient>
    </defs>
    {/* Пышные хвостики */}
    <ellipse cx="10" cy="17" rx="3.5" ry="5.5" fill="#B45309" transform="rotate(-15 10 17)" />
    <ellipse cx="26" cy="17" rx="3.5" ry="5.5" fill="#B45309" transform="rotate(15 26 17)" />
    {/* Бантики */}
    <circle cx="11.5" cy="14" r="1.5" fill="#EC4899" />
    <circle cx="24.5" cy="14" r="1.5" fill="#EC4899" />
    {/* Личико */}
    <circle cx="18" cy="19" r="7.5" fill="#FDE68A" />
    {/* Глазки с ресничками */}
    <circle cx="15.5" cy="18.5" r="1.1" fill="#1E293B" />
    <circle cx="20.5" cy="18.5" r="1.1" fill="#1E293B" />
    <circle cx="15.8" cy="18.2" r="0.4" fill="#FFFFFF" />
    <circle cx="20.8" cy="18.2" r="0.4" fill="#FFFFFF" />
    <path d="M14.5 17.2L15.5 17.8" stroke="#1E293B" strokeWidth="0.7" strokeLinecap="round" />
    <path d="M21.5 17.2L20.5 17.8" stroke="#1E293B" strokeWidth="0.7" strokeLinecap="round" />
    {/* Улыбка */}
    <path d="M16 21.5C16.8 22.8 19.2 22.8 20 21.5" stroke="#B45309" strokeWidth="1.1" strokeLinecap="round" />
    {/* Нежный румянец */}
    <ellipse cx="13.8" cy="20.5" rx="1.3" ry="0.9" fill="#F43F5E" opacity="0.5" />
    <ellipse cx="22.2" cy="20.5" rx="1.3" ry="0.9" fill="#F43F5E" opacity="0.5" />
    {/* Челка с пробором */}
    <path d="M11 16C12.5 12 16 11 18 12C20 11 23.5 12 25 16C23 13.5 20 13.5 18 15C16 13.5 13 13.5 11 16Z" fill="#D97706" />
    {/* Волшебная звездочка в волосах */}
    <path d="M18 9L18.7 10.5L20.3 10.8L19.1 12L19.4 13.6L18 12.8L16.6 13.6L16.9 12L15.7 10.8L17.3 10.5L18 9Z" fill="#FACC15" />
  </svg>
);

// 2. Сказочные тематические векторные иконки
export const FairyStarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path
      d="M12 1.5L14.7 8.3L21.5 11L14.7 13.7L12 20.5L9.3 13.7L2.5 11L9.3 8.3L12 1.5Z"
      fill="url(#star-gold-grad)"
      stroke="#D97706"
      strokeWidth="0.75"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11" r="1.5" fill="#FFFFFF" opacity="0.9" />
    <defs>
      <linearGradient id="star-gold-grad" x1="2.5" y1="1.5" x2="21.5" y2="20.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

export const FairyGiftIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Коробка */}
    <rect x="4" y="9" width="16" height="12" rx="2.5" fill="url(#gift-box-grad)" stroke="#D97706" strokeWidth="1" />
    {/* Крышка */}
    <rect x="3" y="6" width="18" height="3.5" rx="1.5" fill="#FDE047" stroke="#D97706" strokeWidth="1" />
    {/* Вертикальная ленточка */}
    <rect x="10.5" y="6" width="3" height="15" fill="#E11D48" />
    {/* Праздничный бантик */}
    <path
      d="M12 6C10.5 4 8.5 4 8 5C7.5 6 9 6.8 12 6.5C15 6.8 16.5 6 16 5C15.5 4 13.5 4 12 6Z"
      fill="#F43F5E"
      stroke="#BE123C"
      strokeWidth="0.75"
    />
    <circle cx="12" cy="6" r="1.2" fill="#FFE4E6" />
    <defs>
      <linearGradient id="gift-box-grad" x1="4" y1="9" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

export const FairyBookIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 19.5V6C4 4.9 4.9 4 6 4C7.8 4 10.2 4.8 12 6C13.8 4.8 16.2 4 18 4C19.1 4 20 4.9 20 6V19.5C18.2 18.5 15.8 18 14 18C12 18 10 18.8 8 20C6 18.8 4 18 4 19.5Z"
      fill="#FAF6F0"
      stroke="#1F5F4E"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 6V19" stroke="#1F5F4E" strokeWidth="1.2" strokeLinecap="round" />
    {/* Шелковая закладка */}
    <path d="M16 4V13L18 11.5L20 13V4" fill="#F59E0B" stroke="#D97706" strokeWidth="0.6" />
  </svg>
);

export const DinoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M17 4C14.5 4 12 5.5 12 8C12 10.5 10.5 11 9 11.5C6.5 12.3 4 14.5 4 17.5C4 18.9 5.1 20 6.5 20C8 20 9 19 10 17.5C11 19 12.5 20 14 20C15.5 20 16 19 16.5 17.5C17.5 17.5 19 17 19.5 15C20.5 11 21 7 19 5C18.2 4.3 17.6 4 17 4Z"
      fill="#10B981"
      stroke="#047857"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Глазик */}
    <circle cx="16" cy="7" r="1.2" fill="#064E3B" />
    <circle cx="16.3" cy="6.7" r="0.4" fill="#FFFFFF" />
    {/* Зубки / улыбка */}
    <path d="M18.5 8.5C18 9 17 9 16.5 9" stroke="#064E3B" strokeWidth="0.8" strokeLinecap="round" />
    {/* Пятнышки на спине */}
    <circle cx="13" cy="14" r="1" fill="#34D399" />
    <circle cx="15" cy="12" r="1.2" fill="#34D399" />
    <circle cx="10" cy="15" r="0.8" fill="#34D399" />
  </svg>
);

export const SpaceRocketIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Пламя */}
    <path d="M8.5 18C7 19.5 7.5 21.5 8 22C8.5 21.5 10.5 22 12 20.5" fill="#F97316" stroke="#EA580C" strokeWidth="0.8" />
    <path d="M9.5 18.5C8.8 19.5 9 20.5 9.5 21C10 20.5 11 20.8 11.5 19.5" fill="#FDE047" />
    {/* Крылья */}
    <path d="M7 14L4 16.5V18.5L7.5 17.5" fill="#6366F1" stroke="#4338CA" strokeWidth="1" strokeLinejoin="round" />
    <path d="M15 14L18 16.5V18.5L14.5 17.5" fill="#6366F1" stroke="#4338CA" strokeWidth="1" strokeLinejoin="round" />
    {/* Корпус */}
    <path
      d="M11 2C8.5 5 7 10 7 16C8.5 17 13.5 17 15 16C15 10 13.5 5 11 2Z"
      fill="#EEF2FF"
      stroke="#4338CA"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Нос ракеты */}
    <path d="M11 2C9.8 3.5 9 5.5 8.5 7.5C10 7.8 12 7.8 13.5 7.5C13 5.5 12.2 3.5 11 2Z" fill="#EF4444" />
    {/* Иллюминатор */}
    <circle cx="11" cy="11.5" r="2.2" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.8" />
    <circle cx="10.5" cy="10.8" r="0.6" fill="#FFFFFF" />
  </svg>
);

export const WoodlandFoxIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Ушки */}
    <path d="M6 5L9 11L4 10L6 5Z" fill="#EA580C" stroke="#C2410C" strokeWidth="0.8" />
    <path d="M18 5L20 10L15 11L18 5Z" fill="#EA580C" stroke="#C2410C" strokeWidth="0.8" />
    <path d="M6.5 6.5L8 10L5.5 9.5L6.5 6.5Z" fill="#FEF08A" />
    <path d="M17.5 6.5L18.5 9.5L16 10L17.5 6.5Z" fill="#FEF08A" />
    {/* Мордочка */}
    <path
      d="M4 11C4 16 8 20 12 21C16 20 20 16 20 11C16 12.5 14 11 12 9.5C10 11 8 12.5 4 11Z"
      fill="#F97316"
      stroke="#EA580C"
      strokeWidth="1"
    />
    {/* Белые щёчки */}
    <path d="M4.5 13C6.5 16.5 9.5 19 12 21C9 18 7.5 14 4.5 13Z" fill="#FFFBEB" />
    <path d="M19.5 13C17.5 16.5 14.5 19 12 21C15 18 16.5 14 19.5 13Z" fill="#FFFBEB" />
    {/* Глазки */}
    <circle cx="8.5" cy="13.5" r="1.1" fill="#1C1917" />
    <circle cx="15.5" cy="13.5" r="1.1" fill="#1C1917" />
    {/* Носик */}
    <ellipse cx="12" cy="19.5" rx="1.3" ry="0.9" fill="#1C1917" />
  </svg>
);

export const MagicWandIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Палочка */}
    <path d="M5 19L14 10" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M6.5 17.5L8.5 15.5" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
    {/* Наконечник звезды */}
    <path
      d="M16 3L17.2 6.5L20.5 7.5L17.5 9.8L18.5 13.5L15.5 11.2L12.5 13.5L13.5 9.8L10.5 7.5L13.8 6.5L16 3Z"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* Искорки */}
    <circle cx="10" cy="4" r="0.8" fill="#F59E0B" />
    <circle cx="21" cy="4" r="1" fill="#F59E0B" />
    <circle cx="21" cy="14" r="0.8" fill="#F59E0B" />
  </svg>
);

export const ToyCarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 14C3.5 14 3 14.5 3 15V17C3 17.5 3.5 18 4 18H5.5C5.8 16.8 6.8 16 8 16C9.2 16 10.2 16.8 10.5 18H15.5C15.8 16.8 16.8 16 18 16C19.2 16 20.2 16.8 20.5 18H21C21.5 18 22 17.5 22 17V14C21.5 13 20 12.5 19 12.5L16 9.5C15.5 9 14.5 9 14 9H8C7 9 6.2 9.8 5.8 10.8L4.5 13C4.2 13.3 4 13.6 4 14Z"
      fill="#EF4444"
      stroke="#B91C1C"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Окошки */}
    <path d="M8 10.5H13V13H6.8L8 10.5Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="0.8" />
    <path d="M14.5 10.5H16L18 13H14.5V10.5Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="0.8" />
    {/* Колеса */}
    <circle cx="8" cy="18" r="2.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
    <circle cx="8" cy="18" r="1" fill="#F8FAFC" />
    <circle cx="18" cy="18" r="2.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
    <circle cx="18" cy="18" r="1" fill="#F8FAFC" />
  </svg>
);

export const TeddyBearIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Ушки */}
    <circle cx="6.5" cy="7.5" r="3" fill="#B45309" stroke="#78350F" strokeWidth="0.8" />
    <circle cx="6.5" cy="7.5" r="1.5" fill="#FDE68A" />
    <circle cx="17.5" cy="7.5" r="3" fill="#B45309" stroke="#78350F" strokeWidth="0.8" />
    <circle cx="17.5" cy="7.5" r="1.5" fill="#FDE68A" />
    {/* Голова */}
    <circle cx="12" cy="11.5" r="6" fill="#D97706" stroke="#92400E" strokeWidth="1" />
    {/* Глазки */}
    <circle cx="9.8" cy="10" r="1" fill="#1C1917" />
    <circle cx="14.2" cy="10" r="1" fill="#1C1917" />
    {/* Мордочка */}
    <ellipse cx="12" cy="13.2" rx="2.8" ry="2.1" fill="#FEF3C7" />
    <ellipse cx="12" cy="12.4" rx="1.1" ry="0.7" fill="#451A03" />
    <path d="M12 13.2V14.2" stroke="#451A03" strokeWidth="0.8" />
    <path d="M10.8 14.2C11.3 14.7 12.7 14.7 13.2 14.2" stroke="#451A03" strokeWidth="0.8" strokeLinecap="round" />
    {/* Бантик на шее */}
    <path d="M12 18.5L9.5 17L9.5 20L12 18.5ZM12 18.5L14.5 17L14.5 20L12 18.5Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.6" />
    <circle cx="12" cy="18.5" r="1" fill="#FEE2E2" />
  </svg>
);

export const NatureLeafIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M19 4C14 4.5 8 8 6 13C4 18 6.5 20 8 20C9.5 20 15 19 18 14C20 9 20 5 19 4Z"
      fill="#10B981"
      stroke="#047857"
      strokeWidth="1.2"
    />
    <path d="M7 19C9 16 13 12 19 4" stroke="#047857" strokeWidth="1" strokeLinecap="round" />
    <path d="M11 14C13 14.5 15 14 16 13" stroke="#047857" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M9 16C10 17 12 17 13 16.5" stroke="#047857" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

export const BlocksIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Нижний синий блок */}
    <rect x="4" y="13" width="16" height="8" rx="1.5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
    <rect x="7" y="11" width="3" height="2" rx="0.5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.8" />
    <rect x="14" y="11" width="3" height="2" rx="0.5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.8" />
    {/* Верхний желтый блок */}
    <rect x="8" y="5" width="8" height="6" rx="1.5" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
    <rect x="10.5" y="3.5" width="3" height="1.5" rx="0.5" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
  </svg>
);

export const ArtPaletteIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 3C6.5 3 3 7.5 3 13C3 17.5 6 21 10.5 21C12 21 13 20 13 18.5C13 17.5 13.5 17 14.5 17H16C19 17 21 14.5 21 11C21 6.5 17 3 12 3Z"
      fill="#FDE68A"
      stroke="#B45309"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="8.5" r="1.5" fill="#EF4444" />
    <circle cx="12" cy="6.5" r="1.5" fill="#3B82F6" />
    <circle cx="16" cy="8.5" r="1.5" fill="#10B981" />
    <circle cx="17.5" cy="12.5" r="1.5" fill="#F59E0B" />
    <circle cx="10" cy="17" r="1.5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.75" />
  </svg>
);

export const TrainSteamIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Облачко пара */}
    <circle cx="17" cy="4" r="1.5" fill="#E2E8F0" />
    <circle cx="19" cy="5.5" r="1.8" fill="#E2E8F0" />
    {/* Корпус поезда */}
    <rect x="3" y="10" width="13" height="8" rx="1.5" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
    <rect x="13" y="8" width="8" height="10" rx="1.5" fill="#E11D48" stroke="#BE123C" strokeWidth="1" />
    {/* Труба */}
    <rect x="5" y="7" width="3" height="3" fill="#334155" />
    <path d="M4.5 7H8.5V6H4.5V7Z" fill="#334155" />
    {/* Окошко кабины */}
    <rect x="15" y="9.5" width="4.5" height="4" rx="1" fill="#BAE6FD" />
    {/* Колеса */}
    <circle cx="6" cy="18.5" r="2.2" fill="#334155" stroke="#0F172A" strokeWidth="0.8" />
    <circle cx="11" cy="18.5" r="2.2" fill="#334155" stroke="#0F172A" strokeWidth="0.8" />
    <circle cx="17" cy="18.5" r="2.5" fill="#334155" stroke="#0F172A" strokeWidth="0.8" />
  </svg>
);

export const OceanDolphinIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Волны */}
    <path d="M2 19C4 18 6 18 8 19C10 20 12 20 14 19C16 18 18 18 20 19C21 19.5 21.5 20 22 20" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
    {/* Дельфин */}
    <path
      d="M5 15C6.5 12 9.5 9 14 8C17 7.5 19 6 20 5C19.5 7.5 18 10 16.5 11.5L18 11C16.5 13 14 14 11 14C8 14 6 15 5 15Z"
      fill="#38BDF8"
      stroke="#0284C7"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Плавничок */}
    <path d="M12.5 8.5C13 6.5 14.5 6 15 6C14.8 7.5 14 8.5 13.5 9" fill="#0284C7" />
    <circle cx="17" cy="8.5" r="0.8" fill="#082F49" />
  </svg>
);

export const MusicNotesIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 17V6L20 4V15" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 10L20 8" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="6.5" cy="17.5" r="2.5" fill="#A78BFA" stroke="#7C3AED" strokeWidth="1" />
    <circle cx="17.5" cy="15.5" r="2.5" fill="#A78BFA" stroke="#7C3AED" strokeWidth="1" />
  </svg>
);

export const SportBallIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
    <polygon points="12,8 15,10 14,13 10,13 9,10" fill="#0F172A" />
    <line x1="12" y1="3" x2="12" y2="8" stroke="#0F172A" strokeWidth="1" />
    <line x1="15" y1="10" x2="19.5" y2="8" stroke="#0F172A" strokeWidth="1" />
    <line x1="14" y1="13" x2="17.5" y2="17.5" stroke="#0F172A" strokeWidth="1" />
    <line x1="10" y1="13" x2="6.5" y2="17.5" stroke="#0F172A" strokeWidth="1" />
    <line x1="9" y1="10" x2="4.5" y2="8" stroke="#0F172A" strokeWidth="1" />
  </svg>
);

export const PrincessCrownIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M3 17L5 7L9 12L12 5L15 12L19 7L21 17H3Z"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <rect x="3" y="17" width="18" height="3" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
    <circle cx="5" cy="7" r="1.3" fill="#EC4899" />
    <circle cx="12" cy="5" r="1.6" fill="#3B82F6" />
    <circle cx="19" cy="7" r="1.3" fill="#EC4899" />
    <circle cx="12" cy="18.5" r="0.9" fill="#FFFFFF" />
  </svg>
);

// Универсальный маппер иконок интересов
export const FairytaleInterestIcon: React.FC<{ id: string; className?: string }> = ({ id, className = 'w-5 h-5' }) => {
  switch (id.toLowerCase()) {
    case 'динозавры':
      return <DinoIcon className={className} />;
    case 'космос':
      return <SpaceRocketIcon className={className} />;
    case 'животные':
      return <WoodlandFoxIcon className={className} />;
    case 'волшебство':
      return <MagicWandIcon className={className} />;
    case 'машинки':
      return <ToyCarIcon className={className} />;
    case 'природа':
    case 'природа и лес':
      return <NatureLeafIcon className={className} />;
    case 'лего':
    case 'лего и конструктор':
      return <BlocksIcon className={className} />;
    case 'рисование':
      return <ArtPaletteIcon className={className} />;
    case 'поезда':
      return <TrainSteamIcon className={className} />;
    case 'море':
    case 'море и дельфины':
    case 'морской мир':
      return <OceanDolphinIcon className={className} />;
    case 'музыка':
      return <MusicNotesIcon className={className} />;
    case 'спорт':
    case 'спорт и мяч':
      return <SportBallIcon className={className} />;
    case 'принцессы':
    case 'принцессы и замки':
      return <PrincessCrownIcon className={className} />;
    default:
      return <FairyStarIcon className={className} />;
  }
};

// 3. Дополнительные векторные иконки для игрушек и параметров
export const FluffyBunnyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Длинные ушки */}
    <ellipse cx="8.5" cy="6" rx="2" ry="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
    <ellipse cx="8.5" cy="6" rx="1" ry="3.5" fill="#FBCFE8" />
    <ellipse cx="15.5" cy="6" rx="2" ry="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
    <ellipse cx="15.5" cy="6" rx="1" ry="3.5" fill="#FBCFE8" />
    {/* Голова */}
    <circle cx="12" cy="14" r="6.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
    {/* Глазки */}
    <circle cx="9.5" cy="13" r="1.1" fill="#1E293B" />
    <circle cx="14.5" cy="13" r="1.1" fill="#1E293B" />
    <circle cx="9.8" cy="12.7" r="0.4" fill="#FFFFFF" />
    <circle cx="14.8" cy="12.7" r="0.4" fill="#FFFFFF" />
    {/* Носик */}
    <polygon points="12,15 11,14.2 13,14.2" fill="#F43F5E" />
    {/* Щечки / улыбка */}
    <ellipse cx="8" cy="15" rx="1.2" ry="0.8" fill="#FCA5A5" opacity="0.6" />
    <ellipse cx="16" cy="15" rx="1.2" ry="0.8" fill="#FCA5A5" opacity="0.6" />
    <path d="M12 15.2C11.5 16 10.5 16 10 15.5M12 15.2C12.5 16 13.5 16 14 15.5" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

export const SweetKittenIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Острые ушки */}
    <polygon points="5,11 6,4 11,8" fill="#FED7AA" stroke="#EA580C" strokeWidth="0.9" />
    <polygon points="6,9 7,6 10,8" fill="#F472B6" />
    <polygon points="19,11 18,4 13,8" fill="#FED7AA" stroke="#EA580C" strokeWidth="0.9" />
    <polygon points="18,9 17,6 14,8" fill="#F472B6" />
    {/* Голова */}
    <circle cx="12" cy="13.5" r="6.5" fill="#FFEDD5" stroke="#F97316" strokeWidth="1" />
    {/* Глазки */}
    <ellipse cx="9.5" cy="13" rx="1.1" ry="1.4" fill="#047857" />
    <ellipse cx="14.5" cy="13" rx="1.1" ry="1.4" fill="#047857" />
    <circle cx="9.8" cy="12.5" r="0.5" fill="#FFFFFF" />
    <circle cx="14.8" cy="12.5" r="0.5" fill="#FFFFFF" />
    {/* Носик и мордочка */}
    <polygon points="12,15.2 11.2,14.4 12.8,14.4" fill="#F43F5E" />
    <path d="M12 15.3V16M12 16C11.5 16.5 10.8 16.5 10.3 16.2M12 16C12.5 16.5 13.2 16.5 13.7 16.2" stroke="#9A3412" strokeWidth="0.8" strokeLinecap="round" />
    {/* Усики */}
    <line x1="5.5" y1="14" x2="8" y2="14.5" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
    <line x1="5.5" y1="16" x2="8" y2="15.5" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
    <line x1="18.5" y1="14" x2="16" y2="14.5" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
    <line x1="18.5" y1="16" x2="16" y2="15.5" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
  </svg>
);

export const StraightHairIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="17" y1="4" x2="17" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const CurlyHairIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M7 4C5 6.5 5 9 7 11.5C9 14 9 16.5 7 19M12 4C10 6.5 10 9 12 11.5C14 14 14 16.5 12 19M17 4C15 6.5 15 9 17 11.5C19 14 19 16.5 17 19"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Универсальный маппер иконки игрушки-спутника
export const FairytaleToyIcon: React.FC<{ toy?: string; className?: string }> = ({ toy = '', className = 'w-5 h-5' }) => {
  const t = (toy || '').toLowerCase();
  if (t.includes('дино')) return <DinoIcon className={className} />;
  if (t.includes('миш') || t.includes('медв')) return <TeddyBearIcon className={className} />;
  if (t.includes('зай') || t.includes('крол')) return <FluffyBunnyIcon className={className} />;
  if (t.includes('кот') || t.includes('кош')) return <SweetKittenIcon className={className} />;
  if (t.includes('звезд') || t.includes('звёзд')) return <FairyStarIcon className={className} />;
  if (t.includes('машин') || t.includes('кар') || t.includes('поезд') || t.includes('паровоз')) return <ToyCarIcon className={className} />;
  if (t.includes('лис')) return <WoodlandFoxIcon className={className} />;
  if (t.includes('ракета') || t.includes('космос')) return <SpaceRocketIcon className={className} />;
  if (t.includes('палочк') || t.includes('волшеб')) return <MagicWandIcon className={className} />;
  return <TeddyBearIcon className={className} />;
};

