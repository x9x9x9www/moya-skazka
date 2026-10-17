import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Star,
  CheckCircle2,
  Clock,
  TrendingUp,
  Volume2,
  Sliders,
  Award,
} from 'lucide-react';
import { ChildProfileDTO } from '@moya-skazka/shared';

interface Screen2HomeProps {
  activeChild: ChildProfileDTO | null;
  canClaimFreeStory: boolean;
  balance: number;
  dailyIdea: any;
  onStartCreateStory: () => void;
  onNavigateTab: (tab: string) => void;
  onRefreshIdea: () => void;
  onSaveIdea: () => void;
}

// All tabs with their rich previews for the 3D iPhone showcase
const showcaseTabs = [
  {
    id: 'create',
    label: 'Создать',
    fullName: 'Создать сказку',
    icon: Sparkles,
    badge: 'Новинка',
    color: 'from-accent-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-accent-400',
    buttonText: 'Начать создание',
  },
  {
    id: 'books',
    label: 'Книги',
    fullName: 'Мои книги',
    icon: BookOpen,
    badge: '2 сказки',
    color: 'from-indigo-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-indigo-400',
    buttonText: 'Открыть библиотеку',
  },
  {
    id: 'shop',
    label: 'Магазин',
    fullName: 'Магазин кредитов',
    icon: ShoppingBag,
    badge: 'Stars',
    color: 'from-amber-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-amber-400',
    buttonText: 'Купить сказки',
  },
  {
    id: 'friends',
    label: 'Друзья',
    fullName: 'Пригласить друзей',
    icon: Users,
    badge: '+1 в подарок',
    color: 'from-sky-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-sky-400',
    buttonText: 'Поделиться ссылкой',
  },
  {
    id: 'stats',
    label: 'Аналитика',
    fullName: 'Аналитика чтения',
    icon: BarChart3,
    badge: '94% фокус',
    color: 'from-emerald-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-emerald-400',
    buttonText: 'Смотреть детали',
  },
  {
    id: 'settings',
    label: 'Настройки',
    fullName: 'Настройки чтения',
    icon: Settings,
    badge: 'Аудио',
    color: 'from-slate-500/20 via-slate-800/40 to-slate-900/60',
    accentColor: 'text-slate-300',
    buttonText: 'Открыть настройки',
  },
];

export const Screen2_Home: React.FC<Screen2HomeProps> = ({
  activeChild,
  canClaimFreeStory,
  balance,
  onStartCreateStory,
  onNavigateTab,
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const childName = activeChild ? activeChild.name : 'малыша';
  const currentTab = showcaseTabs[activeTabIdx];

  // 3D Phone direct DOM ref for zero-lag 120fps hardware-accelerated tilt
  const phoneRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const isHoveredRef = useRef(false);

  // Default resting 3D angle (angled perspective showcase)
  const defaultTransform = 'perspective(1200px) rotateY(-14deg) rotateX(6deg) rotateZ(-1.5deg) translateZ(0)';

  const setPhoneTransform = (xRatio: number, yRatio: number) => {
    if (!phoneRef.current) return;
    const rotateY = xRatio * 15;
    const rotateX = -yRatio * 10;
    phoneRef.current.style.transform = `perspective(1200px) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg) translateZ(0)`;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const yRatio = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    rafId.current = requestAnimationFrame(() => {
      setPhoneTransform(xRatio, yRatio);
    });
  };

  const handlePointerEnter = () => {
    isHoveredRef.current = true;
    if (phoneRef.current) {
      phoneRef.current.style.transition = 'transform 0.1s ease-out';
    }
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (phoneRef.current) {
      phoneRef.current.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      phoneRef.current.style.transform = defaultTransform;
    }
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleTabAction = (tabId: string) => {
    if (tabId === 'create') {
      onStartCreateStory();
    } else if (tabId === 'stats') {
      // Switches showcase preview to stats
      setActiveTabIdx(4);
    } else {
      onNavigateTab(tabId);
    }
  };

  return (
    <div className="p-4 space-y-5 pb-28 max-w-md mx-auto screen-transition relative select-none">
      {/* Soft Ambient Glows (graphite/indigo tones, pleasant and never harsh) */}
      <div className="glow-top pointer-events-none" />
      <div className="glow-bottom pointer-events-none" />

      {/* Greeting Header */}
      <div className="text-center pt-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-400" />
          <span className="text-[11px] font-medium text-glass-300">
            {canClaimFreeStory ? 'Первая сказка в подарок' : `Баланс: ${balance} сказок`}
          </span>
        </div>
        <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
          Добрый вечер
        </h2>
        <p className="text-xs text-glass-400 mt-1">
          Создайте новую добрую сказку для {childName}
        </p>
      </div>

      {/* Interactive Tabs Carousel Switcher (Controls Phone Screen) */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/8 backdrop-blur-md overflow-x-auto no-scrollbar">
        {showcaseTabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = idx === activeTabIdx;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabIdx(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/15'
                  : 'text-glass-400 hover:text-glass-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.accentColor : 'text-glass-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Interactive iPhone Showcase */}
      <div className="relative z-10 flex justify-center py-2">
        <div
          className="phone-3d-wrapper cursor-grab active:cursor-grabbing"
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {/* Physical Phone Enclosure matching Titanium Black iPhone */}
          <div
            ref={phoneRef}
            className="relative w-[275px] h-[520px] rounded-[3rem] bg-[#0c0d11] p-[9px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_0_2px_rgba(255,255,255,0.06)] overflow-hidden"
            style={{
              transform: defaultTransform,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            {/* Phone Titanium Outer Bezel Rim */}
            <div className="absolute inset-0 rounded-[3rem] pointer-events-none border border-white/10" />

            {/* Specular Diagonal Glass Reflection */}
            <div className="phone-reflection pointer-events-none" />

            {/* Phone Screen Display */}
            <div className="relative w-full h-full rounded-[2.4rem] bg-[#12141a] border border-white/8 overflow-hidden flex flex-col justify-between">
              {/* Dynamic Island & Status Bar */}
              <div className="pt-3 px-6 flex items-center justify-between text-[11px] font-semibold text-glass-400 select-none relative z-20">
                <span className="tracking-tight text-white/90">21:45</span>
                {/* Dynamic Island pill */}
                <div className="w-20 h-5 bg-black rounded-full border border-white/5 flex items-center justify-center gap-1.5 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400/80 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-glass-700" />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/90">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-[3px] border border-white/60 p-[1px] flex items-center">
                    <div className="w-full h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Dynamic Screen Content for Active Tab */}
              <div className="flex-1 px-4 py-2 flex flex-col justify-between overflow-hidden">
                {/* Tab Header Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      {React.createElement(currentTab.icon, {
                        className: `w-3.5 h-3.5 ${currentTab.accentColor}`,
                      })}
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      {currentTab.fullName}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-glass-300 font-medium">
                    {currentTab.badge}
                  </span>
                </div>

                {/* 1. Preview: CREATE STORY */}
                {currentTab.id === 'create' && (
                  <div className="space-y-3 py-2 animate-in fade-in duration-300">
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-glass-400">Герой сказки:</span>
                        <span className="text-[11px] font-bold text-white">{childName}, 4 года</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-accent-500/20 text-accent-300 font-medium">
                          Динозавры
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 text-glass-300 font-medium">
                          Космос
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 text-glass-300 font-medium">
                          Дружба
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-accent-500/15 via-white/[0.04] to-transparent border border-accent-500/20 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-accent-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Персональный сюжет</span>
                      </div>
                      <p className="text-[10px] text-glass-400 leading-relaxed">
                        4 добрые сцены, воспитательные вопросы перед сном и нежные 3D-иллюстрации.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Preview: BOOKS */}
                {currentTab.id === 'books' && (
                  <div className="space-y-2 py-2 animate-in fade-in duration-300">
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          Миша и динозавр Дино
                        </div>
                        <div className="text-[10px] text-glass-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>4 сцены • Прочитано</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          Тайна упавшей звёздочки
                        </div>
                        <div className="text-[10px] text-glass-400">
                          Иллюстрированная книга
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Preview: SHOP */}
                {currentTab.id === 'shop' && (
                  <div className="space-y-2.5 py-2 animate-in fade-in duration-300">
                    <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 p-3 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-amber-300/80 font-medium">Ваш баланс</div>
                        <div className="text-sm font-bold text-white">
                          {balance} {balance === 1 ? 'сказка' : 'сказок'}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                        ⭐
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                        <div className="text-[11px] font-bold text-white">1 сказка</div>
                        <div className="text-[10px] text-glass-400">50 ⭐ (100 ₽)</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-accent-500/15 border border-accent-500/30">
                        <div className="text-[11px] font-bold text-accent-300">5 сказок</div>
                        <div className="text-[10px] text-glass-400">190 ⭐ (-24%)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Preview: FRIENDS / REFERRALS */}
                {currentTab.id === 'friends' && (
                  <div className="space-y-2.5 py-2 animate-in fade-in duration-300">
                    <div className="rounded-2xl bg-gradient-to-br from-sky-500/15 to-transparent border border-sky-500/20 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Подарочная книга</span>
                        <span className="text-sky-400">+1 сказка</span>
                      </div>
                      <p className="text-[10px] text-glass-400">
                        За каждого приглашённого родителя, создавшего сказку.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/8 p-3 flex items-center justify-between">
                      <span className="text-[11px] text-glass-400">Приглашено друзей</span>
                      <span className="text-[11px] font-bold text-white">2 родителя</span>
                    </div>
                  </div>
                )}

                {/* 5. Preview: STATS / ANALYTICS (Requested specifically!) */}
                {currentTab.id === 'stats' && (
                  <div className="space-y-2.5 py-1 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-glass-400 mb-0.5">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Время чтения</span>
                        </div>
                        <div className="text-sm font-bold text-white">48 мин</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-glass-400 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-accent-400" />
                          <span>Стрик дней</span>
                        </div>
                        <div className="text-sm font-bold text-white">7 дней</div>
                      </div>
                    </div>

                    {/* Weekly Activity Mini Graph */}
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-glass-400">
                        <span>Активность на этой неделе</span>
                        <span className="text-emerald-400 font-semibold">+14 новых слов</span>
                      </div>
                      <div className="flex items-end justify-between h-8 pt-1 px-1 gap-1">
                        {[40, 60, 50, 85, 90, 70, 100].map((h, i) => (
                          <div key={i} className="flex-1 bg-white/10 rounded-sm overflow-hidden h-full flex items-end">
                            <div
                              className="w-full bg-gradient-to-t from-accent-600 to-accent-400 rounded-sm"
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-glass-500 font-mono">
                        <span>ПН</span>
                        <span>ВТ</span>
                        <span>СР</span>
                        <span>ЧТ</span>
                        <span>ПТ</span>
                        <span>СБ</span>
                        <span>ВС</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Preview: SETTINGS */}
                {currentTab.id === 'settings' && (
                  <div className="space-y-2 py-2 animate-in fade-in duration-300">
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-slate-300" />
                        <span className="text-[11px] text-glass-300">Колыбельная музыка</span>
                      </div>
                      <div className="w-7 h-4 bg-accent-500 rounded-full flex items-center justify-end px-0.5">
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-slate-300" />
                        <span className="text-[11px] text-glass-300">Размер текста</span>
                      </div>
                      <span className="text-[10px] font-bold text-accent-400">Комфортный</span>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-slate-300" />
                        <span className="text-[11px] text-glass-300">Вопросы в конце</span>
                      </div>
                      <div className="w-7 h-4 bg-accent-500 rounded-full flex items-center justify-end px-0.5">
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button inside Phone Screen */}
                <button
                  onClick={() => handleTabAction(currentTab.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <span>{currentTab.buttonText}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-glass-400" />
                </button>
              </div>

              {/* iPhone Bottom Home Indicator Bar */}
              <div className="pb-2 pt-1 flex justify-center">
                <div className="w-24 h-1 bg-white/25 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Call to Action Button */}
      <div className="relative z-10 pt-1">
        <button
          onClick={onStartCreateStory}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-base shadow-glow btn-press flex items-center justify-center gap-2 border border-accent-400/30"
        >
          <Sparkles className="w-5 h-5 text-accent-200" />
          <span>
            {canClaimFreeStory ? 'Создать сказку бесплатно' : 'Создать новую сказку'}
          </span>
        </button>
      </div>

      {/* Fast Navigation Grid */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {showcaseTabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isCurrent = idx === activeTabIdx;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTabIdx(idx);
                if (tab.id !== 'stats') {
                  handleTabAction(tab.id);
                }
              }}
              className={`glass-card flex flex-col items-center justify-center p-3 btn-press text-center group transition-all ${
                isCurrent ? 'border-accent-500/40 bg-white/10' : 'hover:bg-white/8'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center mb-1.5 border border-white/5 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${tab.accentColor}`} />
              </div>
              <span className="text-[11px] font-semibold text-glass-300 group-hover:text-white transition-colors leading-tight">
                {tab.fullName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story Prompt Helper Card */}
      <div
        className="glass-card p-4 flex items-center gap-3.5 relative z-10 group cursor-pointer btn-press border border-white/10"
        onClick={onStartCreateStory}
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center border border-accent-500/25 shrink-0">
          <Sparkles className="w-5 h-5 text-accent-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white mb-0.5">
            Сказка на ночь для {childName}
          </h4>
          <p className="text-xs text-glass-400">
            Персональный герой, поучительный финал и вопросы
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-glass-500 group-hover:text-accent-400 transition-colors shrink-0" />
      </div>
    </div>
  );
};
