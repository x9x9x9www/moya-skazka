import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { BookDetailsDTO } from '@moya-skazka/shared';
import { ReaderSettings } from '../hooks/useReaderSettings';
import { useLullabyAudio } from '../hooks/useLullabyAudio';
import { FairytaleIllustration, ChildAppearanceProps } from '../components/FairytaleIllustration';

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
}) => {
  const [copied, setCopied] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const currentScene = book.scenes.find((s) => s.scene_index === currentSceneIndex) || book.scenes[0];

  const [liveImageUrl, setLiveImageUrl] = React.useState<string | null | undefined>(currentScene?.image_url);

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

  const { isPlaying, toggleMute } = useLullabyAudio(settings.music || 'calm', true);

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

        <button
          onClick={toggleMute}
          className={`p-1.5 px-2.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
              : 'bg-black/5 text-stone-500 hover:text-stone-700'
          }`}
          title={isPlaying ? 'Музыка играет (нажмите для выключения)' : 'Включить фоновую колыбельную'}
        >
          <span>{isPlaying ? '🎵' : '🔇'}</span>
        </button>
      </div>

      {/* Основной контент: Иллюстрация + Текст + Вопрос */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto">
        {/* Крупная сказочная иллюстрация сцены */}
        <FairytaleIllustration
          sceneIndex={currentSceneIndex}
          theme={theme || book.title}
          interest={interest || 'Волшебство'}
          childName={childName || 'Герой'}
          appearance={appearance}
          imageUrl={liveImageUrl || currentScene?.image_url}
        />

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
