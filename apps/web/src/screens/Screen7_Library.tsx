import React, { useState } from 'react';
import { Plus, BookOpen, Sparkles, Image as ImageIcon } from 'lucide-react';
import { BookSummaryDTO } from '@moya-skazka/shared';

interface Screen7LibraryProps {
  books: BookSummaryDTO[];
  onSelectBook: (bookId: string) => void;
  onCreateNewStory: () => void;
  onUpgradeBook: (bookId: string) => void;
}

export const Screen7_Library: React.FC<Screen7LibraryProps> = ({
  books,
  onSelectBook,
  onCreateNewStory,
  onUpgradeBook,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ILLUSTRATED' | 'TEXT'>('ALL');

  const filteredBooks = books.filter((b) => {
    if (filter === 'ILLUSTRATED') return b.format === 'ILLUSTRATED';
    if (filter === 'TEXT') return b.format === 'TEXT';
    return true;
  });

  const illustratedCount = books.filter((b) => b.format === 'ILLUSTRATED').length;
  const textCount = books.filter((b) => b.format === 'TEXT').length;

  return (
    <div className="p-4 space-y-5 pb-28 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-2xl text-stone-900">
          Мои книги
        </h2>
        <span className="text-xs font-semibold text-stone-500">
          Всего: {books.length}
        </span>
      </div>

      {/* Фильтры-табы (Экран 7) */}
      <div className="flex bg-cream-200/80 p-1 rounded-2xl border border-cream-300">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'ALL'
              ? 'bg-white text-brand-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Все ({books.length})
        </button>
        <button
          onClick={() => setFilter('ILLUSTRATED')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'ILLUSTRATED'
              ? 'bg-white text-brand-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Иллюстрированные ({illustratedCount})
        </button>
        <button
          onClick={() => setFilter('TEXT')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'TEXT'
              ? 'bg-white text-brand-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Текстовые ({textCount})
        </button>
      </div>

      {/* Сетка карточек книг (2 колонки) */}
      <div className="grid grid-cols-2 gap-3.5">
        {filteredBooks.map((book) => {
          const isIllustrated = book.format === 'ILLUSTRATED';

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book.id)}
              className="group bg-white rounded-3xl overflow-hidden border border-cream-300 shadow-card hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-amber-50 overflow-hidden">
                <img
                  src={book.cover_url || './illustrations/cover_dino.jpg'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!isIllustrated && (
                  <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] bg-white/90 text-stone-800 font-bold px-2 py-1 rounded-full shadow-sm">
                      Текстовая версия
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xs text-stone-900 line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h3>
                  <div className="text-[10px] text-stone-500 mb-2">
                    Для: {book.child_name}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isIllustrated
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {isIllustrated ? 'Иллюстрированная' : 'Текстовая'} • 4 стр.
                  </span>

                  {!isIllustrated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgradeBook(book.id);
                      }}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ImageIcon className="w-3 h-3 text-brand-600" />
                      <span>Добавить картинки</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Карточка «+ Создать новую сказку» */}
        <button
          onClick={onCreateNewStory}
          className="rounded-3xl border-2 border-dashed border-cream-400/80 hover:border-brand-500 hover:bg-brand-50/30 p-4 flex flex-col items-center justify-center text-center gap-2 aspect-[4/3] active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shadow-inner">
            <Plus className="w-5 h-5 text-brand-600" />
          </div>
          <span className="text-xs font-bold text-stone-700">
            Создать новую сказку
          </span>
        </button>
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bg-white border border-cream-300">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-700 mb-1">Книг пока нет</p>
          <p className="text-xs text-stone-500 mb-4">
            Создайте первую бесплатную сказку для вашего ребёнка прямо сейчас!
          </p>
          <button
            onClick={onCreateNewStory}
            className="py-2.5 px-4 rounded-xl bg-brand-500 text-white font-bold text-xs"
          >
            Создать бесплатно
          </button>
        </div>
      )}
    </div>
  );
};
