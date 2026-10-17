import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, HeartHandshake, CheckCircle } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface Screen10PaymentSheetProps {
  isOpen: boolean;
  sku: 'single_book_1' | 'pack_5';
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const Screen10_PaymentSheet: React.FC<Screen10PaymentSheetProps> = ({
  isOpen,
  sku,
  onClose,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { tg, haptic } = useTelegram();

  if (!isOpen) return null;

  const isSingle = sku === 'single_book_1';
  const title = isSingle ? 'Одна сказка' : 'Пять сказок';
  const subtitle = isSingle ? 'Для одного волшебного вечера' : 'Создавайте истории, когда захотите';
  const credits = isSingle ? 1 : 5;
  const rubPrice = isSingle ? 199 : 799;
  const starsPrice = isSingle ? 400 : 1600;

  const handlePayStars = async () => {
    setIsProcessing(true);
    haptic.medium();

    try {
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        haptic.success();

        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1200);
      }, 1000);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-card bg-glass-900/95 w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h2 className="font-serif font-bold text-lg text-white">
            Оплата
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-glass-500 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-accent-500 mx-auto animate-bounce" />
            <h3 className="font-serif font-bold text-xl text-white">
              Оплата успешно завершена!
            </h3>
            <p className="text-xs text-glass-400">
              +{credits} {credits === 1 ? 'кредит добавлен' : 'кредитов добавлено'} на ваш баланс.
            </p>
          </div>
        ) : (
          <div className="py-5 space-y-5">
            {/* Product card */}
            <div className="flex items-center gap-3.5 glass-card p-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center shrink-0 border border-accent-500/20">
                <Sparkles className="w-7 h-7 text-accent-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  {title}
                </h3>
                <p className="text-xs text-glass-400">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Order details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-glass-400">
                <span>{credits} {credits === 1 ? 'книжный кредит' : 'книжных кредитов'}</span>
                <span className="font-bold text-white">{rubPrice} P</span>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                <span className="font-bold text-sm text-white">К оплате</span>
                <div className="text-right">
                  <div className="font-bold text-base text-white">{rubPrice} P</div>
                  <div className="text-xs text-accent-400 font-bold">~ {starsPrice} Stars</div>
                </div>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayStars}
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg btn-press flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Открытие Telegram Stars...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Оплатить {starsPrice} Stars</span>
                </>
              )}
            </button>

            {/* Security badges */}
            <div className="flex items-center justify-between text-[11px] text-glass-500 pt-1 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-500" />
                <span>Безопасная оплата через Telegram</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-400" />
                <span>Кредиты сразу на балансе</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
