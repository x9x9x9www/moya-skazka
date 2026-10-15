import React from 'react';
import { Check, ArrowRight, Sparkles, X, FileText, Image as ImageIcon } from 'lucide-react';

interface Screen8UpgradeModalProps {
  isOpen: boolean;
  bookTitle?: string;
  userBalance: number;
  onUpgrade: () => void;
  onClose: () => void;
  onOpenShop: () => void;
}

export const Screen8_UpgradeModal: React.FC<Screen8UpgradeModalProps> = ({
  isOpen,
  bookTitle,
  userBalance,
  onUpgrade,
  onClose,
  onOpenShop,
}) => {
  if (!isOpen) return null;

  const hasCredit = userBalance >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-cream-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-cream-300 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cream-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Добавить иллюстрации
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-cream-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {bookTitle && (
            <p className="text-xs text-stone-600 text-center">
              Сказка: <span className="font-bold text-stone-800">«{bookTitle}»</span>
            </p>
          )}

          {/* Сравнение «Сейчас → Станет» из макета 8 */}
          <div className="flex items-center justify-between gap-3">
            {/* Сейчас */}
            <div className="flex-1 bg-white p-3.5 rounded-2xl border border-cream-300 text-center flex flex-col items-center">
              <div className="w-16 h-20 bg-cream-200 rounded-xl flex items-center justify-center mb-2 shadow-inner">
                <FileText className="w-8 h-8 text-stone-400" />
              </div>
              <span className="text-[10px] text-stone-500 block uppercase font-bold">
                Сейчас
              </span>
              <span className="text-xs font-bold text-stone-800">
                Текстовая сказка
              </span>
            </div>

            <div className="p-2 rounded-full bg-cream-200 text-stone-400">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Станет */}
            <div className="flex-1 bg-brand-50/60 p-3.5 rounded-2xl border border-brand-300 text-center flex flex-col items-center relative overflow-hidden">
              <div className="w-16 h-20 rounded-xl overflow-hidden mb-2 shadow-sm border border-brand-200">
                <img
                  src="./illustrations/cover_dino.jpg"
                  alt="Станет"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-brand-600 block uppercase font-bold">
                Станет
              </span>
              <span className="text-xs font-bold text-brand-900">
                Иллюстрированная
              </span>
            </div>
          </div>

          {/* Чек-лист преимуществ */}
          <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-cream-300">
            <div className="flex items-center gap-2.5 text-xs text-stone-800 font-semibold">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Красочная сказочная обложка книги</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-stone-800 font-semibold">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>4 уникальные иллюстрации по сюжету</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-stone-800 font-semibold">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Сохранение в библиотеку навсегда</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-stone-800 font-semibold">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Вопросы и подсказки для обсуждения</span>
            </div>
          </div>

          {/* Кнопка действия */}
          <div className="space-y-2.5">
            {hasCredit ? (
              <button
                onClick={onUpgrade}
                className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Добавить иллюстрации (списать 1 кредит)</span>
              </button>
            ) : (
              <button
                onClick={onOpenShop}
                className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Добавить иллюстрации — 199 ₽ (≈ 400 ⭐)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-stone-500 font-semibold text-xs hover:text-stone-800 hover:bg-cream-200 transition-colors"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
