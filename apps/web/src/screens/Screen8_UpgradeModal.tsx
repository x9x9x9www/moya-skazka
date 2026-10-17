import React from 'react';
import { Check, ArrowRight, Sparkles, X, FileText, Image as ImageIcon } from 'lucide-react';

interface Screen8UpgradeModalProps {
  isOpen: boolean;
  bookTitle?: string;
  coverUrl?: string;
  userBalance: number;
  onUpgrade: () => void;
  onClose: () => void;
  onOpenShop: () => void;
}

export const Screen8_UpgradeModal: React.FC<Screen8UpgradeModalProps> = ({
  isOpen,
  bookTitle,
  coverUrl,
  userBalance,
  onUpgrade,
  onClose,
  onOpenShop,
}) => {
  if (!isOpen) return null;

  const hasCredit = userBalance >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="glass-card bg-glass-900/95 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <h2 className="font-serif font-bold text-lg text-white">
              Добавить иллюстрации
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-glass-500 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {bookTitle && (
            <p className="text-xs text-glass-400 text-center">
              Сказка: <span className="font-bold text-white">«{bookTitle}»</span>
            </p>
          )}

          {/* Before → After comparison */}
          <div className="flex items-center justify-between gap-3">
            {/* Before */}
            <div className="flex-1 bg-white/5 p-3.5 rounded-2xl border border-white/5 text-center flex flex-col items-center">
              <div className="w-16 h-20 bg-glass-800 rounded-xl flex items-center justify-center mb-2 border border-white/5">
                <FileText className="w-8 h-8 text-glass-500" />
              </div>
              <span className="text-[10px] text-glass-500 block uppercase font-bold">
                Сейчас
              </span>
              <span className="text-xs font-bold text-glass-300">
                Текстовая сказка
              </span>
            </div>

            <div className="p-2 rounded-full bg-white/5 text-glass-500">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* After */}
            <div className="flex-1 bg-accent-500/10 p-3.5 rounded-2xl border border-accent-500/20 text-center flex flex-col items-center relative overflow-hidden">
              <div className="w-16 h-20 rounded-xl overflow-hidden mb-2 border border-accent-500/20">
                <img
                  src={coverUrl || './illustrations/cover_star.jpg'}
                  alt="Станет"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-accent-400 block uppercase font-bold">
                Станет
              </span>
              <span className="text-xs font-bold text-accent-300">
                Иллюстрированная
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2.5 glass-card p-4">
            {[
              'Красочная сказочная обложка книги',
              '4 уникальные иллюстрации по сюжету',
              'Сохранение в библиотеку навсегда',
              'Вопросы и подсказки для обсуждения',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-glass-200 font-semibold">
                <div className="w-5 h-5 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            {hasCredit ? (
              <button
                onClick={onUpgrade}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-sm shadow-glow btn-press flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Добавить иллюстрации (списать 1 кредит)</span>
              </button>
            ) : (
              <button
                onClick={onOpenShop}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-sm shadow-glow btn-press flex items-center justify-center gap-2"
              >
                <span>Добавить иллюстрации — 199 P (~ 400 Stars)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-glass-500 font-semibold text-xs hover:text-white hover:bg-white/5 transition-colors"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
