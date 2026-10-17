import React from 'react';
import { Sparkles, Gift, Palette, MessageSquareQuote, ShieldCheck, ArrowRight } from 'lucide-react';

interface Screen1OnboardingProps {
  onStart: () => void;
}

export const Screen1_Onboarding: React.FC<Screen1OnboardingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-glass-950 flex flex-col justify-between p-5 max-w-md mx-auto relative overflow-hidden">
      {/* Ambient glow */}
      <div className="glow-top" />
      <div className="glow-bottom" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4 relative z-10">
        {/* Card with illustration */}
        <div className="w-full relative rounded-3xl overflow-hidden glass-card mb-6">
          <div className="h-64 relative overflow-hidden bg-gradient-to-b from-glass-800 to-glass-900">
            <img
              src="./illustrations/scene_1.jpg"
              alt="Сказочный герой и динозаврик"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-glass-950/80 via-transparent to-transparent" />
            <div className="absolute top-4 right-4 glass-surface-light px-3 py-1 rounded-full text-xs font-bold text-accent-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span>Волшебство для детей</span>
            </div>
          </div>

          <div className="p-6 text-center">
            <h1 className="font-serif font-bold text-2xl text-white mb-2">
              Моя сказка
            </h1>
            <p className="text-sm text-glass-400 leading-relaxed">
              Персональные сказки для вашего ребёнка с заботой и волшебством
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="w-full space-y-3.5 px-2 mb-6">
          {[
            { icon: Gift, label: 'Первая история бесплатно', color: 'text-accent-400', bg: 'from-accent-500/20 to-accent-600/10' },
            { icon: Palette, label: 'Красивые иллюстрации', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/10' },
            { icon: MessageSquareQuote, label: 'Вопросы для обсуждения', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10' },
            { icon: ShieldCheck, label: 'Без подписки и скрытых платежей', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${item.bg} ${item.color} flex items-center justify-center shrink-0 border border-white/5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-glass-200">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <div className="pb-4 relative z-10">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-base shadow-glow btn-press flex items-center justify-center gap-2"
        >
          <span>Открыть приложение</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
