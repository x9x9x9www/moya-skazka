import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquareQuote,
  Volume2,
  VolumeX,
  MessageSquare,
  MessageSquareOff,
} from 'lucide-react';
import { BookDetailsDTO } from '@moya-skazka/shared';
import { ReaderSettings } from '../hooks/useReaderSettings';
import { useLullabyAudio } from '../hooks/useLullabyAudio';
import { FairytaleIllustration, ChildAppearanceProps } from '../components/FairytaleIllustration';
import { FairyStarIcon } from '../components/FairytaleIcons';

interface Screen5ReaderProps {
  book: BookDetailsDTO;
  currentSceneIndex: number;
  settings: ReaderSettings;
  childName?: string;
  theme?: string;
  interest?: string;
  appearance?: ChildAppearanceProps;
  onPrevScene: () => void;
  onNextScene: () => void;
  onClose: () => void;
  onToggleQuestions?: () => void;
  onCycleFontSize?: () => void;
}

export const Screen5_Reader: React.FC<Screen5ReaderProps> = ({
  book,
  currentSceneIndex,
  settings,
  childName,
  theme,
  interest,
  appearance,
  onPrevScene,
  onNextScene,
  onClose,
  onToggleQuestions,
  onCycleFontSize,
}) => {
  const currentScene = book.scenes.find((s) => s.scene_index === currentSceneIndex) || book.scenes[0];

  const [liveImageUrl, setLiveImageUrl] = React.useState<string | null | undefined>(currentScene?.image_url);
  const [skippedScenes, setSkippedScenes] = React.useState<number[]>([]);

  React.useEffect(() => {
    setLiveImageUrl(currentScene?.image_url);
    const handler = (e: any) => {
      if (e.detail?.sceneIndex === currentSceneIndex && e.detail?.url) {
        setLiveImageUrl(e.detail.url);
      }
    };
    window.addEventListener('ms_scene_image_updated', handler);
    return () => window.removeEventListener('ms_scene_image_updated', handler);
  }, [currentSceneIndex, currentScene?.image_url]);

  // Вопросы после 2-й сцены показываем в читалке, а вопрос после 4-й — на финальном экране
  const isQuestionSkipped = skippedScenes.includes(currentSceneIndex);
  const questionForThisScene =
    settings.showQuestions && currentSceneIndex !== 4 && !isQuestionSkipped
      ? book.questions.find((q) => q.after_scene === currentSceneIndex)
      : null;

  // Применяем классы темы читалки (Экран 12)
  const themeClass =
    settings.theme === 'light'
      ? 'reader-theme-light bg-white text-[#292524]'
      : settings.theme === 'dark'
      ? 'reader-theme-dark bg-stone-900 text-stone-100'
      : 'reader-theme-warm bg-cream-100 text-[#292524]';

  const fontClass =
    settings.fontSize === 'small'
      ? 'reader-font-small'
      : settings.fontSize === 'large'
      ? 'reader-font-large'
      : 'reader-font-medium';

  const { isPlaying, toggleMute } = useLullabyAudio(settings.music || 'calm', true);

  // Буквица (Drop Cap): отделяем первую букву текста
  const text = currentScene?.text || '';
  const firstLetter = text.charAt(0);
  const restOfText = text.slice(1);

  return (
    <div className={`min-h-screen flex flex-col justify-between max-w-md mx-auto transition-colors duration-300 relative ${themeClass}`}>
      {/* 1. Воздушная шапка читалки */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md bg-inherit/90 border-b border-cream-300/40">
        <button
          onClick={onClose}
          className="p-2 -ml-1 rounded-full text-stone-600 hover:text-stone-900 active:scale-95 transition-all hover:bg-black/5"
          aria-label="В библиотеку"
          title="Вернуться на главную"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Номер страницы */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-bold font-mono tracking-wider">
          <FairyStarIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>{currentSceneIndex} из 4</span>
        </div>

        {/* Элементы управления: размер шрифта, вопросы, колыбельная */}
        <div className="flex items-center gap-1.5">
          {onCycleFontSize && (
            <button
              onClick={onCycleFontSize}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold font-mono tracking-tight flex items-center justify-center transition-all active:scale-95 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 border border-black/5 dark:border-white/10"
              title={`Размер шрифта: ${settings.fontSize === 'small' ? 'Мелкий' : settings.fontSize === 'large' ? 'Крупный' : 'Стандартный'}`}
            >
              <span className="font-serif font-black text-xs">
                {settings.fontSize === 'small' ? 'A–' : settings.fontSize === 'large' ? 'A+' : 'Aa'}
              </span>
            </button>
          )}

          <button
            onClick={onToggleQuestions}
            className={`p-2 rounded-full text-xs font-semibold flex items-center justify-center transition-all active:scale-95 ${
              settings.showQuestions
                ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-stone-800 dark:border-stone-700'
                : 'bg-black/5 text-stone-400 hover:text-stone-600 dark:bg-white/5'
            }`}
            title={settings.showQuestions ? 'Скрыть вопросы для обсуждения' : 'Показать вопросы для обсуждения'}
          >
            {settings.showQuestions ? (
              <MessageSquare className="w-4 h-4 text-brand-700 dark:text-brand-300" />
            ) : (
              <MessageSquareOff className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className={`p-2 rounded-full text-xs font-semibold flex items-center justify-center transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:border-amber-700/60 shadow-xs'
                : 'bg-black/5 text-stone-400 hover:text-stone-600 dark:bg-white/5'
            }`}
            title={isPlaying ? 'Музыка играет (нажмите для выключения)' : 'Включить фоновую колыбельную'}
          >
            {isPlaying ? (
              <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-300 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Основной контент сцены: Иллюстрация + Буквица + Свиток беседы (pb-44 предотвращает наложение нижнего дока) */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto pb-44 scroll-smooth overscroll-contain">
        {/* Крупная сказочная иллюстрация с мягким виньетированием и Ken Burns эффектом */}
        <div className="relative rounded-3xl overflow-hidden shadow-card border border-amber-200/60 bg-cream-100">
          <div
            key={currentSceneIndex}
            className="w-full transition-all duration-500 ease-out animate-ken-burns"
          >
            <FairytaleIllustration
              sceneIndex={currentSceneIndex}
              theme={theme || book.title}
              interest={interest || 'Волшебство'}
              childName={childName || 'Герой'}
              appearance={appearance}
              imageUrl={liveImageUrl || currentScene?.image_url}
            />
          </div>

          {/* Мягкое виньетирование снизу: картинка плавно перетекает в текст без грубой линии среза */}
          <div
            className={`absolute inset-x-0 bottom-0 h-20 pointer-events-none transition-colors duration-300 ${
              settings.theme === 'light'
                ? 'bg-gradient-to-t from-white via-white/50 to-transparent'
                : settings.theme === 'dark'
                ? 'bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent'
                : 'bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/60 to-transparent'
            }`}
          />
        </div>

        {/* Текст сцены: строго выравнивание text-left (убирает неестественные пробелы мобильных экранов) */}
        <div className="px-1 pt-1">
          {firstLetter ? (
            <p className={`font-serif leading-[1.85] text-[#292524] dark:text-stone-100 text-left ${fontClass}`}>
              <span className="float-left font-serif font-bold text-4xl leading-none pt-1 pr-3 pb-0.5 text-emerald-800 dark:text-amber-400 select-none">
                {firstLetter}
              </span>
              {restOfText}
            </p>
          ) : (
            <p className={`font-serif leading-[1.85] text-[#292524] dark:text-stone-100 text-left ${fontClass}`}>
              {currentScene?.text}
            </p>
          )}
        </div>

        {/* 3. Педагогическая врезка-вопрос: «Свиток доброй беседы» */}
        {questionForThisScene && (
          <div className="rounded-3xl p-5 bg-[#FAF4E8] dark:bg-stone-800/95 border border-[#EADBC8] dark:border-stone-700 shadow-sm space-y-2.5 relative overflow-hidden">
            {/* Декоративная искорка на фоне свитка */}
            <div className="absolute top-2 right-3 pointer-events-none opacity-20">
              <FairyStarIcon className="w-10 h-10 text-amber-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-200/80 dark:bg-amber-900/50 flex items-center justify-center shrink-0 shadow-inner text-amber-800 dark:text-amber-300">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 tracking-wide uppercase">
                  Свиток доброй беседы
                </span>
              </div>
              <button
                onClick={() => setSkippedScenes((prev) => [...prev, currentSceneIndex])}
                className="text-[11px] font-bold text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors py-0.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
              >
                Пропустить ›
              </button>
            </div>

            <p className="font-serif font-bold text-sm text-[#292524] dark:text-stone-100 leading-snug">
              {questionForThisScene.question}
            </p>

            {questionForThisScene.parent_hint && (
              <p className="text-xs text-stone-600 dark:text-stone-300 italic pt-2 border-t border-[#EADBC8]/70 dark:border-stone-700 leading-relaxed flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 not-italic font-bold">💡</span>
                <span>{questionForThisScene.parent_hint}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4. Плавающая стеклянная панель управления (Floating Glass Dock) */}
      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 pointer-events-none">
        <div className="pointer-events-auto rounded-3xl backdrop-blur-xl bg-white/75 dark:bg-stone-900/85 border border-white/60 dark:border-stone-700/60 shadow-2xl p-2.5 flex items-center justify-between gap-3">
          {/* Кнопка Назад */}
          <button
            onClick={onPrevScene}
            disabled={currentSceneIndex <= 1}
            className={`p-3 rounded-2xl transition-all flex items-center justify-center ${
              currentSceneIndex > 1
                ? 'bg-cream-200/80 hover:bg-cream-300 text-stone-700 dark:bg-stone-800 dark:text-stone-200 active:scale-95 shadow-xs'
                : 'opacity-30 cursor-not-allowed text-stone-400'
            }`}
            title="Предыдущая сцена"
            aria-label="Предыдущая страница"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Точечный индикатор 4 страниц: золотые светлячки */}
          <div className="flex items-center gap-2 px-2" title={`Страница ${currentSceneIndex} из 4`}>
            {[1, 2, 3, 4].map((idx) => {
              const isCurrent = idx === currentSceneIndex;
              const isPassed = idx < currentSceneIndex;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-300 rounded-full ${
                    isCurrent
                      ? 'w-6 h-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.85)]'
                      : isPassed
                      ? 'w-2 h-2 bg-emerald-600/80 dark:bg-emerald-500/80'
                      : 'w-2 h-2 bg-stone-300/80 dark:bg-stone-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Большая удобная кнопка «Дальше» для листания одним пальцем */}
          <button
            onClick={onNextScene}
            className="flex-1 max-w-[175px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:from-brand-600 hover:to-brand-500 active:scale-[0.97] text-white font-bold text-sm shadow-lg shadow-brand-700/25 transition-all flex items-center justify-center gap-2"
          >
            <span>{currentSceneIndex >= 4 ? 'К финалу' : 'Дальше'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
