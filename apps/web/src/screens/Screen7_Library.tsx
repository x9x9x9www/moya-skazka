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
    <div className="p-4 space-y-5 pb-28 max-w-md mx-auto screen-transition">
      <div className="flex items-center justify-between">
        <h2 className="font-serif font-bold text-2xl text-white">
          Мои книги
        </h2>
        <span className="text-xs font-semibold text-glass-500">
          Всего: {books.length}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex glass-surface-light p-1 rounded-2xl">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'ALL'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-glass-400 hover:text-glass-200'
          }`}
        >
          Все ({books.length})
        </button>
        <button
          onClick={() => setFilter('ILLUSTRATED')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'ILLUSTRATED'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-glass-400 hover:text-glass-200'
          }`}
        >
          С картинками ({illustratedCount})
        </button>
        <button
          onClick={() => setFilter('TEXT')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filter === 'TEXT'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-glass-400 hover:text-glass-200'
          }`}
        >
          Текстовые ({textCount})
        </button>
      </div>

      {/* Book grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {filteredBooks.map((book) => {
          const isIllustrated = book.format === 'ILLUSTRATED';

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book.id)}
              className="group glass-card overflow-hidden hover:bg-white/8 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-glass-800 overflow-hidden rounded-t-[1.5rem]">
                <img
                  src={book.cover_url || './illustrations/cover_dino.jpg'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                {!isIllustrated && (
                  <div className="absolute inset-0 bg-glass-900/40 backdrop-blur-[1px] flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] glass-surface-light text-white font-bold px-2 py-1 rounded-full">
                      Текстовая версия
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xs text-white line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h3>
                  <div className="text-[10px] text-glass-500 mb-2">
                    Для: {book.child_name}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isIllustrated
                        ? 'bg-accent-500/15 text-accent-400 border border-accent-500/20'
                        : 'bg-white/5 text-glass-400 border border-white/10'
                    }`}
                  >
                    {isIllustrated ? 'Иллюстрированная' : 'Текстовая'} — 4 стр.
                  </span>

                  {!isIllustrated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpgradeBook(book.id);
                      }}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/20 text-accent-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Добавить картинки</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Create new story card */}
        <button
          onClick={onCreateNewStory}
          className="rounded-3xl border-2 border-dashed border-glass-700 hover:border-accent-500/50 hover:bg-accent-500/5 p-4 flex flex-col items-center justify-center text-center gap-2 aspect-[4/3] btn-press transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center border border-accent-500/20">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-glass-300">
            Создать новую сказку
          </span>
        </button>
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 px-4 glass-card">
          <BookOpen className="w-10 h-10 text-glass-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-glass-300 mb-1">Книг пока нет</p>
          <p className="text-xs text-glass-500 mb-4">
            Создайте первую бесплатную сказку для вашего ребёнка прямо сейчас!
          </p>
          <button
            onClick={onCreateNewStory}
            className="py-2.5 px-4 rounded-xl bg-accent-500 text-white font-bold text-xs btn-press"
          >
            Создать бесплатно
          </button>
        </div>
      )}
    </div>
  );
};
