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
      // В реальном Telegram WebApp вызывается tg.openInvoice(...)
      // Для мгновенной проверки симулируем подтверждение и начисление
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl border-t border-cream-300 max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 className="font-serif font-bold text-lg text-stone-900">
            Оплата
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Оплата успешно завершена!
            </h3>
            <p className="text-xs text-stone-600">
              +{credits} {credits === 1 ? 'кредит добавлен' : 'кредитов добавлено'} на ваш баланс.
            </p>
          </div>
        ) : (
          <div className="py-5 space-y-5">
            {/* Карточка товара из макета 10 */}
            <div className="flex items-center gap-3.5 bg-cream-100/70 p-4 rounded-2xl border border-cream-300">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                <Sparkles className="w-7 h-7 text-amber-500 fill-amber-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {title}
                </h3>
                <p className="text-xs text-stone-500">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Детализация заказа */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{credits} {credits === 1 ? 'книжный кредит' : 'книжных кредитов'}</span>
                <span className="font-bold text-stone-900">{rubPrice} ₽</span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-stone-900">К оплате</span>
                <div className="text-right">
                  <div className="font-bold text-base text-stone-900">{rubPrice} ₽</div>
                  <div className="text-xs text-amber-600 font-bold">≈ {starsPrice} ⭐</div>
                </div>
              </div>
            </div>

            {/* Большая кнопка оплаты через Stars */}
            <button
              onClick={handlePayStars}
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Открытие Telegram Stars...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Оплатить {starsPrice} ⭐</span>
                </>
              )}
            </button>

            {/* Подписи безопасности из макета 10 */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Безопасная оплата через Telegram</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                <span>Кредиты сразу на балансе</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
