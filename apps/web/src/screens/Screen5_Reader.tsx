import React from 'react';
import { ArrowLeft, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { BookDetailsDTO } from '@moya-skazka/shared';
import { ReaderSettings } from '../hooks/useReaderSettings';

interface Screen5ReaderProps {
  book: BookDetailsDTO;
  currentSceneIndex: number;
  settings: ReaderSettings;
  onPrevScene: () => void;
  onNextScene: () => void;
  onClose: () => void;
}

export const Screen5_Reader: React.FC<Screen5ReaderProps> = ({
  book,
  currentSceneIndex,
  settings,
  onPrevScene,
  onNextScene,
  onClose,
}) => {
  const currentScene = book.scenes.find((s) => s.scene_index === currentSceneIndex) || book.scenes[0];
  const questionForThisScene = settings.showQuestions
    ? book.questions.find((q) => q.after_scene === currentSceneIndex)
    : null;

  // Применяем классы темы читалки (Экран 12)
  const themeClass =
    settings.theme === 'light'
      ? 'reader-theme-light bg-white text-stone-900'
      : settings.theme === 'dark'
      ? 'reader-theme-dark bg-stone-900 text-stone-100'
      : 'reader-theme-warm bg-cream-100 text-stone-900';

  const fontClass =
    settings.fontSize === 'small'
      ? 'reader-font-small'
      : settings.fontSize === 'large'
      ? 'reader-font-large'
      : 'reader-font-medium';

  return (
    <div className={`min-h-screen flex flex-col justify-between max-w-md mx-auto transition-colors duration-300 ${themeClass}`}>
      {/* Шапка читалки */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md bg-inherit/90 border-b border-cream-300/40">
        <button
          onClick={onClose}
          className="p-2 -ml-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-black/5"
          aria-label="В библиотеку"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="px-3 py-1 rounded-full bg-black/5 text-xs font-bold font-mono tracking-wider">
          {currentSceneIndex} / 4
        </div>

        <div className="w-8" />
      </div>

      {/* Основной контент: Иллюстрация + Текст + Вопрос */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto">
        {/* Крупная иллюстрация сцены (для иллюстрированной книги) */}
        {currentScene?.image_url ? (
          <div className="w-full h-64 rounded-3xl overflow-hidden shadow-card border border-cream-300/60 bg-cream-200">
            <img
              src={currentScene.image_url}
              alt={`Сцена ${currentSceneIndex}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-24 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex items-center justify-center text-xs text-amber-800 font-medium">
            📖 Текстовый формат сказки
          </div>
        )}

        {/* Текст сцены с уютной книжной типографикой Literata */}
        <div className={`font-serif leading-relaxed px-1 text-justify ${fontClass}`}>
          {currentScene?.text}
        </div>

        {/* Педагогическая врезка-вопрос для родителя (Раздел 6 ТЗ) */}
        {questionForThisScene && (
          <div className="rounded-3xl p-4.5 bg-amber-50/90 dark:bg-stone-800/90 border border-amber-200 dark:border-stone-700 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <MessageSquareQuote className="w-4 h-4 text-amber-600" />
              <span>Поговорите с ребёнком</span>
            </div>

            <p className="font-serif font-bold text-sm text-stone-800 dark:text-stone-100 leading-snug">
              {questionForThisScene.question}
            </p>

            {questionForThisScene.parent_hint && (
              <p className="text-xs text-stone-600 dark:text-stone-300 italic pt-1 border-t border-amber-200/50 dark:border-stone-700">
                Подсказка для родителя: {questionForThisScene.parent_hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Нижняя навигация между сценами */}
      <div className="sticky bottom-0 z-30 p-4 backdrop-blur-md bg-inherit/90 border-t border-cream-300/40 flex items-center gap-3">
        {currentSceneIndex > 1 ? (
          <button
            onClick={onPrevScene}
            className="flex-1 py-3.5 rounded-2xl bg-cream-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        ) : null}

        <button
          onClick={onNextScene}
          className="flex-1 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <span>Продолжить</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
