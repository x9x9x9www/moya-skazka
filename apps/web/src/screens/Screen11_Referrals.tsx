import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Users, Sparkles, Send, MessageCircle, Mail, MoreHorizontal } from 'lucide-react';

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
    const text = 'Создай волшебную персонализированную сказку для своего ребёнка в приложении «Моя сказка»! Первая история бесплатно:';
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="p-4 space-y-6 pb-28 max-w-md mx-auto screen-transition">
      {/* Gift hero */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-accent-500/30 to-accent-600/20 text-accent-400 flex items-center justify-center border border-accent-500/20 mb-4">
          <Gift className="w-14 h-14" />
          <div className="absolute -top-2 -right-2 glass-surface-light text-accent-400 p-1.5 rounded-full">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <h2 className="font-serif font-bold text-2xl text-white mb-2">
          Дарите волшебство друзьям
        </h2>

        <p className="text-xs text-glass-400 max-w-xs leading-relaxed">
          Пригласите друга. Когда он впервые оплатит сказку или набор, вы получите одну иллюстрированную книгу бесплатно.
        </p>
      </div>

      {/* Referral link field */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-glass-300">Ваша персональная ссылка</label>
        <div className="flex items-center gap-2 glass-card p-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-glass-300 outline-none select-all truncate"
          />
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all btn-press ${
              copied
                ? 'bg-accent-500/20 text-accent-400'
                : 'bg-white/5 text-glass-300 hover:bg-white/10'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>
      </div>

      {/* Share button */}
      <div>
        <button
          onClick={handleShare}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-base shadow-glow btn-press flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Поделиться ссылкой</span>
        </button>

        {/* Share channels */}
        <div className="flex items-center justify-around pt-3 px-2">
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 hover:text-accent-400 btn-press transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-glass-400">Telegram</span>
          </button>

          <button
            onClick={() => {
              const text = 'Создай волшебную сказку для своего ребёнка: ' + referralLink;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex flex-col items-center gap-1.5 hover:text-accent-400 btn-press transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-glass-400">WhatsApp</span>
          </button>

          <button
            onClick={() => {
              const text = 'Создай волшебную сказку для своего ребёнка: ' + referralLink;
              window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex flex-col items-center gap-1.5 hover:text-accent-400 btn-press transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-glass-400">Сообщение</span>
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
            className="flex flex-col items-center gap-1.5 hover:text-accent-400 btn-press transition-all text-center"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 text-glass-400 flex items-center justify-center border border-white/10">
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-glass-400">Ещё</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {qualifiedFriendsCount}
          </div>
          <div className="text-xs font-medium text-glass-400">
            Оплативших друга
          </div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-accent-400 mb-1">
            {giftCreditsEarned}
          </div>
          <div className="text-xs font-medium text-glass-400">
            Подарочные книги
          </div>
        </div>
      </div>
    </div>
  );
};
