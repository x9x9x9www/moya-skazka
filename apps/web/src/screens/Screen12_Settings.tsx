import React, { useState } from 'react';
import {
  Type,
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  FileText,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  Music,
  TreePine,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { ReaderFontSize, ReaderSettings, ReaderTheme } from '../hooks/useReaderSettings';

interface Screen12SettingsProps {
  settings: ReaderSettings;
  onUpdateSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  onDeleteAccount: () => Promise<void>;
  onClose: () => void;
}

export const Screen12_Settings: React.FC<Screen12SettingsProps> = ({
  settings,
  onUpdateSetting,
  onDeleteAccount,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto screen-transition">
      <div>
        <h2 className="font-serif font-bold text-2xl text-white">
          Настройки чтения
        </h2>
        <p className="text-xs text-glass-400 mt-0.5">
          Персонализируйте отображение текста и вопросы
        </p>
      </div>

      {/* Toggle switches */}
      <div className="glass-card p-4 space-y-4">
        {/* Show questions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">
              Показывать вопросы
            </div>
            <div className="text-xs text-glass-400">
              2–3 вопроса во время чтения
            </div>
          </div>
          <div
            className={`toggle-track ${settings.showQuestions ? 'active' : ''}`}
            onClick={() => onUpdateSetting('showQuestions', !settings.showQuestions)}
          >
            <div className="toggle-thumb" />
          </div>
        </div>

        {/* Auto-play */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <div className="text-sm font-bold text-white">
              Автопроигрывание страниц
            </div>
            <div className="text-xs text-glass-400">
              (по желанию)
            </div>
          </div>
          <div
            className={`toggle-track ${settings.autoPlay ? 'active' : ''}`}
            onClick={() => onUpdateSetting('autoPlay', !settings.autoPlay)}
          >
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-glass-300">Размер текста</label>
        <div className="grid grid-cols-3 gap-2 glass-card p-1.5">
          {(['small', 'medium', 'large'] as ReaderFontSize[]).map((size) => {
            const isSelected = settings.fontSize === size;
            const fontScale = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-base' : 'text-xl';

            return (
              <button
                key={size}
                type="button"
                onClick={() => onUpdateSetting('fontSize', size)}
                className={`py-3 rounded-xl font-serif font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-glass-400 hover:bg-white/5'
                }`}
              >
                <span className={fontScale}>A</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-glass-300">Фон страницы</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Светлый', icon: Sun, bg: 'bg-white', text: 'text-glass-800' },
            { id: 'warm', label: 'Тёплый', icon: Coffee, bg: 'bg-stone-200', text: 'text-stone-900' },
            { id: 'dark', label: 'Тёмный', icon: Moon, bg: 'bg-glass-900', text: 'text-white' },
          ].map((themeItem) => {
            const isSelected = settings.theme === themeItem.id;
            const Icon = themeItem.icon;

            return (
              <button
                key={themeItem.id}
                type="button"
                onClick={() => onUpdateSetting('theme', themeItem.id as ReaderTheme)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  isSelected
                    ? 'border-accent-500 ring-2 ring-accent-500/30 shadow-sm'
                    : 'border-white/10'
                } ${themeItem.bg}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-accent-500' : 'text-glass-500'}`} />
                <span className={`text-xs font-bold ${themeItem.text}`}>
                  {themeItem.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background music */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-glass-300">Фоновая музыка для чтения</label>
        <div className="glass-card divide-y divide-white/5 overflow-hidden text-xs">
          {[
            { id: 'calm', label: 'Спокойная (колыбельная)', icon: Music },
            { id: 'fairy', label: 'Сказочные переливы', icon: Sparkles },
            { id: 'forest', label: 'Звуки волшебного леса', icon: TreePine },
            { id: 'off', label: 'Без музыки', icon: VolumeX },
          ].map((item) => {
            const isSelected = (settings.music || 'calm') === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateSetting('music' as any, item.id as any)}
                className="w-full p-3.5 flex items-center justify-between text-glass-200 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-accent-400' : 'text-glass-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isSelected ? (
                  <span className="text-xs font-bold text-accent-400 bg-accent-500/15 px-2 py-0.5 rounded-full border border-accent-500/20">
                    Активно
                  </span>
                ) : (
                  <span className="text-glass-600">›</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-glass-500 italic px-1">
          Настройки применяются ко всем книгам.
        </p>
      </div>

      {/* Account section */}
      <div className="pt-2 space-y-3">
        <h3 className="text-xs font-bold text-glass-400 uppercase tracking-wider px-1">
          Аккаунт и правовая информация
        </h3>

        <div className="glass-card divide-y divide-white/5 overflow-hidden text-xs">
          <div className="p-3.5 flex items-center justify-between text-glass-300">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-accent-400" />
              <span>Согласие на обработку (v1.0)</span>
            </div>
            <span className="text-[10px] text-accent-400 font-bold bg-accent-500/15 px-2 py-0.5 rounded-full border border-accent-500/20">
              Принято
            </span>
          </div>

          <a
            href="https://example.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 flex items-center justify-between text-glass-300 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-glass-500" />
              <span>Политика конфиденциальности (152-ФЗ)</span>
            </div>
            <span className="text-glass-600">›</span>
          </a>

          <a
            href="https://t.me/MoyaSkazkaSupport"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 flex items-center justify-between text-glass-300 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-glass-500" />
              <span>Помощь и поддержка</span>
            </div>
            <span className="text-glass-600">›</span>
          </a>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full p-3.5 flex items-center justify-between text-rose-400 hover:bg-rose-500/10 transition-colors font-bold text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Удалить аккаунт и данные</span>
            </div>
            <span className="text-rose-500">›</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="font-serif font-bold text-lg text-white">
                Удалить все данные?
              </h4>
              <p className="text-xs text-glass-400 mt-1 leading-relaxed">
                Это действие безвозвратно удалит профили детей, все сгенерированные сказки и остаток книжных кредитов в соответствии с политикой 152-ФЗ.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 text-glass-300 font-bold text-xs hover:bg-white/10 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:bg-rose-700 btn-press"
              >
                {isDeleting ? 'Удаляем...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
