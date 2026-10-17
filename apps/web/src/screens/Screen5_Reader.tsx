import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquareQuote, Music, VolumeX, Sparkles } from 'lucide-react';
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
  const questionForThisScene = settings.showQuestions
    ? book.questions.find((q) => q.after_scene === currentSceneIndex)
    : null;

  // Reader theme classes — these stay light/dark/warm for reading comfort
  const themeClass =
    settings.theme === 'light'
      ? 'reader-theme-light bg-white text-stone-900'
      : settings.theme === 'dark'
      ? 'reader-theme-dark bg-glass-950 text-glass-100'
      : 'reader-theme-warm bg-cream-100 text-stone-900';

  const fontClass =
    settings.fontSize === 'small'
      ? 'reader-font-small'
      : settings.fontSize === 'large'
      ? 'reader-font-large'
      : 'reader-font-medium';

  const isDark = settings.theme === 'dark';
  const { isPlaying, toggleMute } = useLullabyAudio(settings.music || 'calm', true);

  return (
    <div className={`min-h-screen flex flex-col justify-between max-w-md mx-auto transition-colors duration-300 ${themeClass}`}>
      {/* Reader header */}
      <div className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md border-b ${
        isDark ? 'bg-glass-950/90 border-white/5' : 'bg-white/90 border-stone-200/50'
      }`}>
        <button
          onClick={onClose}
          className={`p-2 -ml-1 rounded-full transition-colors ${
            isDark ? 'text-glass-400 hover:text-white hover:bg-white/5' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          aria-label="В библиотеку"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
          isDark ? 'bg-white/5 text-glass-300' : 'bg-stone-100 text-stone-600'
        }`}>
          {currentSceneIndex} / 4
        </div>

        <button
          onClick={toggleMute}
          className={`p-1.5 px-2.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all btn-press ${
            isPlaying
              ? isDark
                ? 'bg-accent-500/15 text-accent-400 border border-accent-500/20'
                : 'bg-accent-50 text-accent-700 border border-accent-200'
              : isDark
                ? 'bg-white/5 text-glass-500'
                : 'bg-stone-100 text-stone-500'
          }`}
          title={isPlaying ? 'Музыка играет (нажмите для выключения)' : 'Включить фоновую колыбельную'}
        >
          {isPlaying ? <Music className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto">
        {/* Illustration */}
        <FairytaleIllustration
          sceneIndex={currentSceneIndex}
          theme={theme || book.title}
          interest={interest || 'Волшебство'}
          childName={childName || 'Герой'}
          appearance={appearance}
          imageUrl={currentScene?.image_url}
        />

        {/* Prompt details panel */}
        {currentScene?.image_prompt && (
          <div className={`rounded-2xl p-3 space-y-2 ${
            isDark ? 'bg-white/5 border border-white/8' : 'bg-stone-50 border border-stone-200'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowPromptDetails((prev) => !prev)}
                className={`flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity text-left ${
                  isDark ? 'text-glass-200' : 'text-stone-700'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-accent-400' : 'text-accent-600'}`} />
                <span className="underline decoration-dotted underline-offset-2">
                  {showPromptDetails ? 'Скрыть 3D-промпт' : '3D Pixar-промпт этой сцены'}
                </span>
              </button>

              <button
                onClick={() => {
                  if (currentScene?.image_prompt) {
                    navigator.clipboard?.writeText(currentScene.image_prompt);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] shrink-0 btn-press flex items-center gap-1 ${
                  isDark ? 'bg-white/10 text-glass-200' : 'bg-stone-200 text-stone-700'
                }`}
              >
                <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
              </button>
            </div>

            {showPromptDetails && (
              <div className={`pt-2 border-t space-y-1.5 animate-fade-in ${
                isDark ? 'border-white/5' : 'border-stone-200'
              }`}>
                <p className={`text-[11px] font-mono p-2.5 rounded-xl border leading-relaxed select-all ${
                  isDark ? 'bg-glass-900 border-white/5 text-glass-300' : 'bg-white border-stone-200 text-stone-700'
                }`}>
                  {currentScene.image_prompt}
                </p>
                <p className={`text-[10px] italic ${isDark ? 'text-glass-500' : 'text-stone-500'}`}>
                  Скопируйте и вставьте в Midjourney, ChatGPT (DALL-E 3) или Leonardo для получения точной 3D-иллюстрации в стиле Pixar.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scene text */}
        <div className={`font-serif leading-relaxed px-1 text-justify ${fontClass}`}>
          {currentScene?.text}
        </div>

        {/* Question block */}
        {questionForThisScene && (
          <div className={`rounded-3xl p-4.5 border space-y-2 ${
            isDark
              ? 'bg-accent-500/10 border-accent-500/20'
              : 'bg-accent-50 border-accent-200'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-accent-300' : 'text-accent-800'
            }`}>
              <MessageSquareQuote className={`w-4 h-4 ${isDark ? 'text-accent-400' : 'text-accent-600'}`} />
              <span>Поговорите с ребёнком</span>
            </div>

            <p className={`font-serif font-bold text-sm leading-snug ${
              isDark ? 'text-white' : 'text-stone-900'
            }`}>
              {questionForThisScene.question}
            </p>

            {questionForThisScene.parent_hint && (
              <p className={`text-xs italic pt-1 border-t ${
                isDark ? 'text-glass-400 border-accent-500/15' : 'text-stone-600 border-accent-200/50'
              }`}>
                Подсказка для родителя: {questionForThisScene.parent_hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className={`sticky bottom-0 z-30 p-4 backdrop-blur-md border-t flex items-center gap-3 ${
        isDark ? 'bg-glass-950/90 border-white/5' : 'bg-white/90 border-stone-200/50'
      }`}>
        {currentSceneIndex > 1 ? (
          <button
            onClick={onPrevScene}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 btn-press ${
              isDark ? 'bg-white/5 text-glass-300' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        ) : null}

        <button
          onClick={onNextScene}
          className="flex-1 py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md btn-press"
        >
          <span>Продолжить</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
