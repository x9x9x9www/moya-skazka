import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  FileText,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { ReaderFontSize, ReaderSettings, ReaderTheme } from '../hooks/useReaderSettings';

interface Screen12SettingsProps {
  settings: ReaderSettings;
  onUpdateSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  onDeleteAccount: () => Promise<void>;
  onOpenAdmin?: () => void;
}

export const Screen12_Settings: React.FC<Screen12SettingsProps> = ({
  settings,
  onUpdateSetting,
  onDeleteAccount,
  onOpenAdmin,
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
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      <div>
        <h2 className="font-serif font-bold text-2xl text-stone-900">
          Настройки чтения
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Персонализируйте отображение текста и вопросы
        </p>
      </div>

      {/* 1. Блок переключателей из макета 12 */}
      <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-4">
        {/* Показывать вопросы */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-stone-900">
              Показывать вопросы
            </div>
            <div className="text-xs text-stone-500">
              2–3 вопроса во время чтения
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showQuestions}
              onChange={(e) => onUpdateSetting('showQuestions', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>

        {/* Автопроигрывание страниц */}
        <div className="flex items-center justify-between pt-3 border-t border-cream-200">
          <div>
            <div className="text-sm font-bold text-stone-900">
              Автопроигрывание страниц
            </div>
            <div className="text-xs text-stone-500">
              (по желанию)
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoPlay}
              onChange={(e) => onUpdateSetting('autoPlay', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>
      </div>

      {/* 2. Размер текста (A / A / A) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Размер текста</label>
        <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-2xl border border-cream-300 shadow-card">
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
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-cream-100'
                }`}
              >
                <span className={fontScale}>A</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Тема фона (Светлый, Тёплый, Тёмный) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Фон страницы</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Светлый', icon: Sun, bg: 'bg-white', text: 'text-stone-800' },
            { id: 'warm', label: 'Тёплый', icon: Coffee, bg: 'bg-cream-200', text: 'text-amber-900' },
            { id: 'dark', label: 'Тёмный', icon: Moon, bg: 'bg-stone-900', text: 'text-white' },
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
                    ? 'border-brand-500 ring-2 ring-brand-500 shadow-sm'
                    : 'border-cream-300'
                } ${themeItem.bg}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-brand-600' : 'text-stone-500'}`} />
                <span className={`text-xs font-bold ${themeItem.text}`}>
                  {themeItem.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Музыка для фона (Экран 12 макета) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Фоновая музыка для чтения</label>
        <div className="bg-white rounded-3xl border border-cream-300 shadow-card divide-y divide-cream-200 overflow-hidden text-xs">
          {[
            { id: 'calm', label: 'Спокойная (колыбельная)', icon: '🎵' },
            { id: 'fairy', label: 'Сказочные переливы', icon: '✨' },
            { id: 'forest', label: 'Звуки волшебного леса', icon: '🍃' },
            { id: 'off', label: 'Без музыки', icon: '🔇' },
          ].map((item) => {
            const isSelected = (settings.music || 'calm') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateSetting('music' as any, item.id as any)}
                className="w-full p-3.5 flex items-center justify-between text-stone-800 hover:bg-cream-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected ? (
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Активно ✓
                  </span>
                ) : (
                  <span className="text-stone-300">›</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-stone-500 italic px-1">
          Настройки применяются ко всем книгам.
        </p>
      </div>
      <div className="pt-2 space-y-3">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider px-1">
          Аккаунт и правовая информация
        </h3>

        <div className="bg-white rounded-3xl border border-cream-300 shadow-card divide-y divide-cream-200 overflow-hidden text-xs">
          <div className="p-3.5 flex items-center justify-between text-stone-700">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Согласие на обработку (v1.0)</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Принято
            </span>
          </div>

          <a
            href="https://example.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 flex items-center justify-between text-stone-700 hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-stone-500" />
              <span>Политика конфиденциальности (152-ФЗ)</span>
            </div>
            <span className="text-stone-400">›</span>
          </a>

          <a
            href="https://t.me/MoyaSkazkaSupport"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 flex items-center justify-between text-stone-700 hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-stone-500" />
              <span>Помощь и поддержка</span>
            </div>
            <span className="text-stone-400">›</span>
          </a>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full p-3.5 flex items-center justify-between text-stone-700 hover:bg-cream-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-brand-600" />
                <span>Панель управления (Admin)</span>
              </div>
              <span className="text-stone-400">›</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full p-3.5 flex items-center justify-between text-rose-600 hover:bg-rose-50 transition-colors font-bold text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Удалить аккаунт и данные</span>
            </div>
            <span className="text-rose-400">›</span>
          </button>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления аккаунта */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="font-serif font-bold text-lg text-stone-900">
                Удалить все данные?
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Это действие безвозвратно удалит профили детей, все сгенерированные сказки и остаток книжных кредитов в соответствии с политикой 152-ФЗ.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-cream-200 text-stone-700 font-bold text-xs"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:bg-rose-700"
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
