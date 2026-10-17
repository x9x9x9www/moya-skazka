import React from 'react';
import { RotateCcw, BookOpen, Sparkles, Heart } from 'lucide-react';
import { BookDetailsDTO } from '@moya-skazka/shared';
import { ReaderSettings } from '../hooks/useReaderSettings';

interface Screen6FinalQuestionProps {
  book: BookDetailsDTO;
  settings: ReaderSettings;
  onRestart: () => void;
  onGoToLibrary: () => void;
}

export const Screen6_FinalQuestion: React.FC<Screen6FinalQuestionProps> = ({
  book,
  settings,
  onRestart,
  onGoToLibrary,
}) => {
  const finalScene = book.scenes.find((s) => s.scene_index === 4) || book.scenes[book.scenes.length - 1];
  const finalQuestion = book.questions.find((q) => q.after_scene === 5) || {
    question: 'Что тебе больше всего понравилось в этой истории?',
    parent_hint: 'Предложите рассказать, что запомнилось и почему. Можно спросить, как бы ребёнок поступил на месте героя.',
  };

  const isDark = settings.theme === 'dark';
  const themeClass =
    settings.theme === 'light'
      ? 'bg-white text-stone-900'
      : settings.theme === 'dark'
      ? 'bg-glass-950 text-glass-100'
      : 'bg-cream-100 text-stone-900';

  return (
    <div className={`min-h-screen flex flex-col justify-between max-w-md mx-auto transition-colors p-5 pb-8 ${themeClass}`}>
      {/* Final header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-white/5' : 'border-stone-200/50'
      }`}>
        <div className={`text-xs font-bold px-3 py-1 rounded-full border ${
          isDark ? 'text-accent-400 bg-accent-500/15 border-accent-500/20' : 'text-accent-700 bg-accent-50 border-accent-200'
        }`}>
          Финал истории (4 / 4)
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-accent-500">
          <Sparkles className="w-4 h-4" />
          <span>Сказка завершена</span>
        </div>
      </div>

      <div className="space-y-6 my-auto py-4 overflow-y-auto">
        {/* Final scene illustration */}
        {finalScene?.image_url && (
          <div className={`w-full h-56 rounded-3xl overflow-hidden shadow-card border ${
            isDark ? 'border-white/5 bg-glass-800' : 'border-stone-200 bg-stone-100'
          }`}>
            <img
              src={finalScene.image_url}
              alt="Финал"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Final text */}
        <p className="font-serif leading-relaxed px-1 text-justify text-base">
          {finalScene?.text}
        </p>

        {/* Final question card */}
        {settings.showQuestions && (
          <div className={`rounded-3xl p-5 border space-y-2.5 ${
            isDark
              ? 'bg-accent-500/10 border-accent-500/15'
              : 'bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-accent-300' : 'text-accent-800'
            }`}>
              <Heart className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
              <span>Последний вопрос для закрепления</span>
            </div>

            <h3 className={`font-serif font-bold text-base leading-snug ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}>
              {finalQuestion.question}
            </h3>

            {finalQuestion.parent_hint && (
              <p className={`text-xs italic pt-2 border-t ${
                isDark ? 'text-glass-400 border-accent-500/10' : 'text-stone-600 border-accent-200/50'
              }`}>
                Подсказка для родителя: {finalQuestion.parent_hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-3">
        <button
          onClick={onRestart}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs btn-press flex items-center justify-center gap-1.5 ${
            isDark ? 'bg-white/5 text-glass-300 hover:bg-white/8' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Прочитать ещё раз</span>
        </button>

        <button
          onClick={onGoToLibrary}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs shadow-md btn-press flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>В библиотеку</span>
        </button>
      </div>
    </div>
  );
};
