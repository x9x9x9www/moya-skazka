import React, { useState } from 'react';
import { X, Check, UserPlus, Sparkles, Camera, Loader2, Upload, Scissors, Settings } from 'lucide-react';
import { ChildProfileDTO } from '@moya-skazka/shared';
import { api } from '../api/client';
import {
  BoyAvatar,
  GirlAvatar,
  FairytaleInterestIcon,
  FairytaleToyIcon,
  StraightHairIcon,
  CurlyHairIcon,
  PrincessCrownIcon,
} from './FairytaleIcons';

interface ChildProfileModalProps {
  isOpen: boolean;
  childrenList: ChildProfileDTO[];
  activeChildId: string | null;
  onClose: () => void;
  onSelectChild: (childId: string) => void;
  onCreateChild: (data: { name: string; age: number; interests: string[]; appearance: any }) => Promise<void>;
  onAddNewChild?: () => void;
  onOpenSettings?: () => void;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({
  isOpen,
  childrenList,
  activeChildId,
  onClose,
  onSelectChild,
  onCreateChild,
  onAddNewChild,
  onOpenSettings,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(4);
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [hairColor, setHairColor] = useState('светлые');
  const [hairType, setHairType] = useState('короткие');
  const [clothingColor, setClothingColor] = useState('изумрудный');
  const [toy, setToy] = useState('плюшевый динозаврик');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Динозавры', 'Волшебство']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoTip, setPhotoTip] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoPreview(compressedDataUrl);

          setIsAnalyzingPhoto(true);
          try {
            const res = await api.analyzeChildPhoto(compressedDataUrl);
            if (res && res.analysis) {
              const a = res.analysis;
              if (a.gender === 'boy' || a.gender === 'girl') setGender(a.gender);
              if (a.estimatedAge && Number(a.estimatedAge) >= 2 && Number(a.estimatedAge) <= 6) {
                setAge(Number(a.estimatedAge));
              }
              if (a.hairColor) setHairColor(a.hairColor);
              if (a.hairLength || a.hairStructure) {
                if (a.hairStructure === 'кудрявые') setHairType('кудрявые');
                else if (a.hairLength === 'длинные') setHairType('длинные');
                else if (a.hairLength === 'короткие') setHairType('короткие');
              }
              if (a.clothingColor) setClothingColor(a.clothingColor);
              setPhotoTip(a.confidenceTip || 'Внешность определена по фото!');
            }
          } catch (err) {
            console.warn('ChildProfileModal photo analysis failed:', err);
          } finally {
            setIsAnalyzingPhoto(false);
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearPhoto = () => {
    setPhotoPreview(null);
    setPhotoTip(null);
  };

  if (!isOpen) return null;

  const interestsList = [
    { id: 'Динозавры', label: 'Динозавры' },
    { id: 'Космос', label: 'Космос' },
    { id: 'Животные', label: 'Животные' },
    { id: 'Волшебство', label: 'Волшебство' },
    { id: 'Машинки', label: 'Машинки' },
    { id: 'Природа', label: 'Природа' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateChild({
        name: name.trim(),
        age,
        interests: selectedInterests,
        appearance: {
          avatar_id: 'hero_custom',
          gender,
          hairColor,
          hairType,
          clothingItem: gender === 'girl' ? 'платьице' : 'уютный свитер',
          clothingColor,
          toy,
        },
      });
      setName('');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-cream-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-cream-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-cream-300">
          <div className="font-serif font-bold text-lg text-stone-800">
            {isCreating ? 'Создание профиля героя' : 'Профили детей'}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-cream-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCreating ? (
          <div className="py-4 space-y-3">
            <p className="text-xs text-stone-500 mb-2">
              Выберите героя для сказок или добавьте нового:
            </p>

            {childrenList.map((child) => {
              const isSelected = child.id === activeChildId;
              return (
                <div
                  key={child.id}
                  onClick={() => {
                    onSelectChild(child.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50 border-brand-500 shadow-sm'
                      : 'bg-white border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-serif font-bold flex items-center justify-center text-sm shadow-inner">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 text-sm">{child.name}</div>
                      <div className="text-xs text-stone-500">
                        {child.age} года • {(child.interests || []).join(', ')}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-brand-600" />}
                </div>
              );
            })}

            <button
              onClick={() => {
                if (onAddNewChild) {
                  onClose();
                  onAddNewChild();
                } else {
                  setIsCreating(true);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-2xl border-2 border-dashed border-brand-500/40 text-brand-700 font-bold text-sm hover:bg-brand-50/50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Добавить ещё одного ребёнка</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-cream-200/80 hover:bg-cream-300 text-stone-700 font-bold text-xs transition-colors mt-2"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Настройки приложения и чтения</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="py-4 space-y-4">
            {/* AI автоподбор по фото (опционально) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>Настроить по фото</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      по желанию
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 leading-tight mt-0.5">
                    AI подберёт параметры внешности. Фото не сохраняется (152-ФЗ).
                  </div>
                </div>
              </div>

              {isAnalyzingPhoto && (
                <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/90 border border-amber-200 text-amber-900 text-xs font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  <span>AI определяет черты лица малыша...</span>
                </div>
              )}

              {!isAnalyzingPhoto && photoPreview && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-amber-300 shadow-xs shrink-0">
                    <img src={photoPreview} alt="Превью" className="w-full h-full object-cover" />
                    <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Внешность определена!</span>
                    </div>
                    <div className="text-[10px] text-stone-600 truncate">{photoTip || 'Параметры заполнены ниже'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-xs"
                    title="Сбросить фото"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!isAnalyzingPhoto && !photoPreview && (
                <div>
                  <input
                    type="file"
                    id="modal-child-photo-input"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-child-photo-input"
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-700" />
                    <span>Загрузить фото для автоподбора</span>
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Имя ребёнка
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Петька"
                required
                className="w-full px-4 py-3 rounded-2xl bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
              />
            </div>

            {/* Пол */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Пол
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('boy')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    gender === 'boy'
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-white text-stone-700 border-cream-300'
                  }`}
                >
                  <BoyAvatar className="w-4 h-4 shrink-0" />
                  <span>Мальчик</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('girl')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    gender === 'girl'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white text-stone-700 border-cream-300'
                  }`}
                >
                  <GirlAvatar className="w-4 h-4 shrink-0" />
                  <span>Девочка</span>
                </button>
              </div>
            </div>

            {/* Возраст */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Возраст ({age} года)
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAge(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      age === num
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-white text-stone-700 border-cream-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Волосы */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Цвет волос
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'светлые', label: 'Светлые' },
                  { id: 'русые', label: 'Русые' },
                  { id: 'тёмные', label: 'Тёмные' },
                  { id: 'рыжие', label: 'Рыжие' },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHairColor(h.id)}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                      hairColor === h.id
                        ? 'bg-brand-50 border-brand-500 text-brand-800'
                        : 'bg-white border-cream-300 text-stone-600'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Тип волос */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Тип волос
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'короткие', label: 'Короткие', icon: <Scissors className="w-3 h-3 text-brand-600" /> },
                  { id: 'длинные', label: 'Длинные', icon: <PrincessCrownIcon className="w-3 h-3 text-amber-500" /> },
                  { id: 'кудрявые', label: 'Кудрявые', icon: <CurlyHairIcon className="w-3 h-3 text-amber-500" /> },
                  { id: 'прямые', label: 'Прямые', icon: <StraightHairIcon className="w-3 h-3 text-brand-600" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHairType(t.id)}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      hairType === t.id
                        ? 'bg-brand-50 border-brand-500 text-brand-800'
                        : 'bg-white border-cream-300 text-stone-600'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Любимая игрушка-спутник */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Игрушка-спутник
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'плюшевый динозаврик', label: 'Динозаврик' },
                  { id: 'плюшевый мишка', label: 'Мишка' },
                  { id: 'пушистый зайка', label: 'Зайка' },
                  { id: 'маленький котёнок', label: 'Котёнок' },
                  { id: 'волшебная звёздочка', label: 'Звёздочка' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setToy(t.id)}
                    className={`py-1.5 px-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      toy === t.id
                        ? 'bg-brand-50 border-brand-500 text-brand-800'
                        : 'bg-white border-cream-300 text-stone-600'
                    }`}
                  >
                    <FairytaleToyIcon toy={t.id} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Что любит ребёнок?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {interestsList.map((item) => {
                  const isSelected = selectedInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 text-brand-800'
                          : 'bg-white border-cream-300 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FairytaleInterestIcon id={item.id} className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 rounded-2xl bg-cream-200 text-stone-700 font-bold text-sm"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 py-3 rounded-2xl bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
