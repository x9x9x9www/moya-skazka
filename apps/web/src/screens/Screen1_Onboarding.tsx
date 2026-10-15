import React from 'react';
import { Sparkles, Gift, Palette, MessageSquareQuote, ShieldCheck, ArrowRight } from 'lucide-react';

interface Screen1OnboardingProps {
  onStart: () => void;
}

export const Screen1_Onboarding: React.FC<Screen1OnboardingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Верхняя часть с карточкой и сказочной иллюстрацией */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4">
        {/* Карточка с иллюстрацией из макета 1 */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-card border border-cream-300 bg-white mb-6">
          <div className="h-64 relative overflow-hidden bg-gradient-to-b from-brand-100 to-amber-50">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80"
              alt="Сказочный лес"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-700 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Волшебство для детей</span>
            </div>
          </div>

          <div className="p-6 text-center">
            <h1 className="font-serif font-bold text-2xl text-stone-900 mb-2">
              Моя сказка
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed font-sans">
              Персональные сказки для вашего ребёнка с заботой и волшебством
            </p>
          </div>
        </div>

        {/* Список ключевых преимуществ с иконками как на макете */}
        <div className="w-full space-y-3.5 px-2 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 shadow-sm">
              <Gift className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-sm font-semibold text-stone-800">
              Первая история бесплатно
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
              <Palette className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-stone-800">
              Красивые иллюстрации
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
              <MessageSquareQuote className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-stone-800">
              Вопросы для обсуждения
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-stone-800">
              Без подписки и скрытых платежей
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка старта */}
      <div className="pb-4">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Открыть приложение</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
