import React from 'react';
import { Sparkles, Check, ShieldCheck, Flame, Star } from 'lucide-react';

interface Screen9ShopProps {
  onBuySku: (sku: 'single_book_1' | 'pack_5') => void;
  isAdmin?: boolean;
  onAdminAddCredits?: (count: number) => void;
}

export const Screen9_Shop: React.FC<Screen9ShopProps> = ({ onBuySku, isAdmin, onAdminAddCredits }) => {
  return (
    <div className="p-4 space-y-5 pb-28 max-w-md mx-auto">
      <div className="text-center py-2">
        <h2 className="font-serif font-bold text-2xl text-stone-900">
          Магазин сказок
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Звёздочки для новых иллюстрированных историй и волшебных открытий
        </p>
      </div>

      {/* Панель администратора: получение кредитов без ограничений */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-stone-900 to-stone-850 text-stone-100 rounded-3xl p-5 border-2 border-amber-500/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <span className="font-bold text-sm text-white">Админ-доступ (@dinar_fazlyev)</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              Unlimited
            </span>
          </div>
          <p className="text-xs text-stone-300">
            Вам открыт доступ без ограничений. Начисляйте книжные кредиты в 1 клик без оплаты:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => onAdminAddCredits && onAdminAddCredits(10)}
              className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md active:scale-95 transition-all text-center"
            >
              +10 сказок
            </button>
            <button
              onClick={() => onAdminAddCredits && onAdminAddCredits(50)}
              className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md active:scale-95 transition-all text-center"
            >
              +50 сказок
            </button>
            <button
              onClick={() => onAdminAddCredits && onAdminAddCredits(999)}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs shadow-md active:scale-95 transition-all text-center"
            >
              ∞ Безлимит
            </button>
          </div>
        </div>
      )}

      {/* Карточка 1: Одиночная сказка (Экран 9) */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-card flex items-center justify-between gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100/80 flex items-center justify-center shrink-0 border border-amber-200">
          <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-base text-stone-900">
            Одна волшебная сказка
          </h3>
          <p className="text-xs text-stone-500 mb-1.5">
            Идеально для уютного совместного чтения
          </p>
          <div className="font-bold text-sm text-stone-900">
            199 ₽ <span className="text-xs text-stone-500 font-normal">(≈ 400 ⭐)</span>
          </div>
        </div>

        <button
          onClick={() => onBuySku('single_book_1')}
          className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
        >
          Купить
        </button>
      </div>

      {/* Карточка 2: Выгодный набор 5 сказок (Экран 9) */}
      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl p-5 border-2 border-amber-300 shadow-card">
        {/* Бейдж "Выгодный набор" */}
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
          <Flame className="w-3 h-3 fill-white" />
          <span>Выгодный набор</span>
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="w-16 h-16 rounded-2xl bg-amber-200/60 flex items-center justify-center shrink-0 border border-amber-300">
            <Sparkles className="w-8 h-8 text-amber-600 fill-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Полка из 5 сказок
            </h3>
            <p className="text-xs text-stone-600 mb-1.5">
              Маленькая семейная библиотека на всю неделю
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base text-stone-900">799 ₽</span>
              <span className="text-xs text-stone-400 line-through">995 ₽</span>
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded-md">
                -20%
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              (≈ 1 600 ⭐)
            </div>
          </div>
        </div>

        <button
          onClick={() => onBuySku('pack_5')}
          className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Забрать 5 сказок за 799 ₽ (1 600 ⭐)</span>
        </button>
      </div>

      {/* Буллиты гарантий из макета 9 */}
      <div className="space-y-2.5 pt-2 px-2">
        <div className="flex items-center gap-3 text-xs text-stone-700 font-semibold">
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>Без подписки — покупайте только когда нужно</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-700 font-semibold">
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>Звёздочки не сгорают и ждут нужного момента</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-700 font-semibold">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span>Удобная и безопасная оплата через Telegram Stars</span>
        </div>
      </div>
    </div>
  );
};
