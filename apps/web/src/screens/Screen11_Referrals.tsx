import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Sparkles } from 'lucide-react';

interface Screen11ReferralsProps {
  referralLink: string;
  qualifiedFriendsCount: number;
  giftCreditsEarned: number;
}

export const Screen11_Referrals: React.FC<Screen11ReferralsProps> = ({
  referralLink,
  qualifiedFriendsCount,
  giftCreditsEarned,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = 'Привет! В приложении «Моя сказка» можно создать волшебную историю, где твой малыш — главный герой. Первая сказка в подарок: ';
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto">
      {/* Иллюстрация подарка */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-lg mb-4">
          <Gift className="w-14 h-14" />
          <div className="absolute -top-2 -right-2 bg-white text-brand-700 p-1.5 rounded-full shadow-md">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
        </div>

        <h2 className="font-serif font-bold text-2xl text-stone-900 mb-2">
          Дарите волшебство друзьям
        </h2>

        <p className="text-xs text-stone-600 max-w-xs leading-relaxed">
          Поделитесь с близкими: когда друг откроет для себя сказки, вы получите одну подарочную иллюстрированную книгу для своего малыша.
        </p>
      </div>

      {/* Поле со ссылкой и кнопкой копирования */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">Ваша персональная ссылка</label>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-cream-300 shadow-sm">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-stone-700 outline-none select-all truncate"
          />
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-cream-200 text-stone-700 hover:bg-cream-300'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>
      </div>

      {/* Большая кнопка Поделиться */}
      <div>
        <button
          onClick={handleShare}
          className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Поделиться ссылкой</span>
        </button>

        {/* 4 канала шеринга из макета 11 */}
        <div className="flex items-center justify-around pt-3 px-2 text-stone-600">
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 hover:text-brand-600 active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-200 shadow-xs">
              <span className="text-lg">✈️</span>
            </div>
            <span className="text-[11px] font-medium">Telegram</span>
          </button>

          <button
            onClick={() => {
              const text = 'Создай волшебную сказку для своего ребёнка: ' + referralLink;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex flex-col items-center gap-1.5 hover:text-brand-600 active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
              <span className="text-lg">💬</span>
            </div>
            <span className="text-[11px] font-medium">WhatsApp</span>
          </button>

          <button
            onClick={() => {
              const text = 'Создай волшебную сказку для своего ребёнка: ' + referralLink;
              window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex flex-col items-center gap-1.5 hover:text-brand-600 active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <span className="text-lg">✉️</span>
            </div>
            <span className="text-[11px] font-medium">Сообщение</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Моя сказка',
                  text: 'Создай персональную сказку для ребёнка!',
                  url: referralLink,
                }).catch(() => {});
              } else {
                handleCopy();
              }
            }}
            className="flex flex-col items-center gap-1.5 hover:text-brand-600 active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center border border-stone-200 shadow-xs">
              <span className="text-base font-bold">•••</span>
            </div>
            <span className="text-[11px] font-medium">Ещё</span>
          </button>
        </div>
      </div>

      {/* Счётчики результатов из макета 11 */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-white p-4 rounded-3xl border border-cream-300 text-center shadow-card">
          <div className="text-2xl font-bold text-stone-900 mb-1">
            {qualifiedFriendsCount}
          </div>
          <div className="text-xs font-medium text-stone-500">
            Оплативших друга
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-cream-300 text-center shadow-card">
          <div className="text-2xl font-bold text-brand-700 mb-1">
            {giftCreditsEarned}
          </div>
          <div className="text-xs font-medium text-stone-500">
            Подарочные книги
          </div>
        </div>
      </div>
    </div>
  );
};
