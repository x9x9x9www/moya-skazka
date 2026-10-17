import React from 'react';
import { Sparkles, Check, ShieldCheck, Flame, Star } from 'lucide-react';

interface Screen9ShopProps {
  onBuySku: (sku: 'single_book_1' | 'pack_5') => void;
}

export const Screen9_Shop: React.FC<Screen9ShopProps> = ({ onBuySku }) => {
  return (
    <div className="p-4 space-y-5 pb-28 max-w-md mx-auto screen-transition">
      <div className="text-center py-2">
        <h2 className="font-serif font-bold text-2xl text-white">
          Магазин сказок
        </h2>
        <p className="text-xs text-glass-400 mt-1">
          Покупайте книжные кредиты для создания иллюстрированных сказок
        </p>
      </div>

      {/* Single story card */}
      <div className="glass-card p-5 flex items-center justify-between gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center shrink-0 border border-amber-500/20">
          <Star className="w-8 h-8 text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-base text-white">
            Одна сказка
          </h3>
          <p className="text-xs text-glass-400 mb-1.5">
            Для одного волшебного вечера
          </p>
          <div className="font-bold text-sm text-white">
            199 P <span className="text-xs text-glass-500 font-normal">(~ 400 Stars)</span>
          </div>
        </div>

        <button
          onClick={() => onBuySku('single_book_1')}
          className="py-2.5 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs btn-press"
        >
          Купить
        </button>
      </div>

      {/* Bundle card */}
      <div className="relative glass-card p-5 border-accent-500/30">
        {/* Badge */}
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
          <Flame className="w-3 h-3" />
          <span>Выгодный набор</span>
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center shrink-0 border border-accent-500/20">
            <Sparkles className="w-8 h-8 text-accent-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-base text-white">
              Пять сказок
            </h3>
            <p className="text-xs text-glass-400 mb-1.5">
              Создавайте истории, когда захотите
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base text-white">799 P</span>
              <span className="text-xs text-glass-500 line-through">995 P</span>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded-md">
                -20%
              </span>
            </div>
            <div className="text-[11px] text-glass-500">
              (~ 1 600 Stars)
            </div>
          </div>
        </div>

        <button
          onClick={() => onBuySku('pack_5')}
          className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-sm shadow-glow btn-press flex items-center justify-center gap-2"
        >
          <span>Купить набор за 799 P (1 600 Stars)</span>
        </button>
      </div>

      {/* Guarantees */}
      <div className="space-y-2.5 pt-2 px-2">
        {[
          { icon: Check, label: 'Без подписки — покупайте только когда нужно' },
          { icon: Check, label: 'Кредиты сохраняются навсегда на вашем балансе' },
          { icon: ShieldCheck, label: 'Удобная и безопасная оплата через Telegram Stars' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 text-xs text-glass-300 font-semibold">
              <div className="w-5 h-5 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
