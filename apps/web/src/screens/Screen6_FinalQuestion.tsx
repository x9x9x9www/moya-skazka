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
  // После 4-й сцены вопрос показываем здесь, а не в читалке — так он не дублируется.
  const finalQuestion =
    book.questions.find((q) => q.after_scene === 5) ||
    book.questions.find((q) => q.after_scene === 4) ||
    null;

  const themeClass =
    settings.theme === 'light'
      ? 'bg-white text-stone-900'
      : settings.theme === 'dark'
      ? 'bg-stone-900 text-stone-100'
      : 'bg-cream-100 text-stone-900';

  return (
    <div className={`min-h-screen flex flex-col justify-between max-w-md mx-auto transition-colors p-5 pb-8 ${themeClass}`}>
      {/* Шапка финала */}
      <div className="flex items-center justify-between pb-3 border-b border-cream-300/40">
        <div className="text-xs font-bold text-brand-700 bg-brand-50 dark:bg-stone-800 px-3 py-1 rounded-full border border-brand-200 dark:border-stone-700">
          Финал истории (4 / 4)
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
          <Sparkles className="w-4 h-4 fill-amber-400" />
          <span>Сказка завершена</span>
        </div>
      </div>

      <div className="space-y-5 my-auto py-2 overflow-y-auto">
        {/* Иллюстрация счастливого финала */}
        {finalScene?.image_url && (
          <div className="w-full h-52 rounded-3xl overflow-hidden shadow-card border border-cream-300/60 bg-cream-200 relative">
            <img
              src={finalScene.image_url}
              alt="Финал сказки"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Праздничное поздравление с прочтением книги */}
        <div className="text-center space-y-1.5 px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Ты молодец! Сказка прочитана!</span>
          </div>
          <h2 className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 leading-tight">
            Чудесное путешествие завершилось
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mx-auto leading-relaxed">
            Герои сладко засыпают под мерцающим звёздным небом, а впереди вас ждут самые добрые и волшебные сны.
          </p>
        </div>

        {/* Карточка «Вопрос для тёплой беседы перед сном» (Экран 6) */}
        {settings.showQuestions && finalQuestion && (
          <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-100/90 to-amber-50/90 dark:from-stone-800 dark:to-stone-800/60 border border-amber-300/70 dark:border-stone-700 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Вопрос для тёплой беседы перед сном</span>
            </div>

            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug">
              {finalQuestion.question}
            </h3>

            {finalQuestion.parent_hint && (
              <p className="text-xs text-stone-600 dark:text-stone-300 italic pt-2 border-t border-amber-200/80 dark:border-stone-700">
                Подсказка для родителя: {finalQuestion.parent_hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Кнопки действий (Экран 6: горизонтальный ряд) */}
      <div className="flex items-center gap-3 pt-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-cream-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 hover:bg-cream-300"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Прочитать ещё раз</span>
        </button>

        <button
          onClick={onGoToLibrary}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>В библиотеку</span>
        </button>
      </div>
    </div>
  );
};
