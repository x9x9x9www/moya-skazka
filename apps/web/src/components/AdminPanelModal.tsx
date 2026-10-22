import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ShieldCheck, BarChart3 } from 'lucide-react';
import { api } from '../api/client';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'analytics' | 'orders' | 'jobs' | 'credits'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Форма ручной корректировки баланса с аудитом
  const [targetUserId, setTargetUserId] = useState('');
  const [delta, setDelta] = useState<number>(1);
  const [sourceType, setSourceType] = useState('gift');
  const [reason, setReason] = useState('');
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const data = await api.getAdminAnalytics();
        setAnalytics(data);
      } else if (tab === 'orders') {
        const data = await api.getAdminOrders();
        setOrders(data);
      } else if (tab === 'jobs') {
        const data = await api.getAdminJobs();
        setJobs(data);
      }
    } catch (err: any) {
      console.warn('Admin load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await api.retryAdminJob(jobId);
      loadData();
    } catch (err: any) {
      alert(`Ошибка retry: ${err.message}`);
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !reason.trim()) return;

    try {
      await api.adjustAdminCredits(targetUserId, delta, sourceType, reason);
      setAdjustMessage(`Успешно! Баланс изменён на ${delta > 0 ? '+' : ''}${delta}`);
      setReason('');
      setTimeout(() => setAdjustMessage(null), 3000);
    } catch (err: any) {
      alert(`Ошибка корректировки: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-stone-900 text-stone-100 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-700 max-h-[90vh] flex flex-col">
        {/* Шапка админки */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-400" />
            <h2 className="font-serif font-bold text-lg text-white">
              Панель администратора
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Табы админки */}
        <div className="flex gap-1 bg-stone-800/80 p-1 rounded-2xl my-3 text-xs font-bold">
          <button
            onClick={() => setTab('analytics')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'analytics' ? 'bg-accent-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Воронка
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'orders' ? 'bg-accent-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Заказы Stars
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'jobs' ? 'bg-accent-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Очередь AI
          </button>
          <button
            onClick={() => setTab('credits')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'credits' ? 'bg-accent-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Баланс
          </button>
        </div>

        {/* Контент табов */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4 text-xs">
          {loading && (
            <div className="text-center py-8 text-stone-400">
              Загрузка данных...
            </div>
          )}

          {/* 1. Воронка аналитики */}
          {!loading && tab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                  <div className="text-stone-400 mb-1">Пользователей</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics?.total_users || 0}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                  <div className="text-stone-400 mb-1">Бесплатных сказок</div>
                  <div className="text-2xl font-bold text-accent-400">
                    {analytics?.free_stories_claimed || 0}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                  <div className="text-stone-400 mb-1">Оплаченных заказов</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {analytics?.total_paid_orders || 0}
                  </div>
                </div>

                <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                  <div className="text-stone-400 mb-1">Всего книг в БД</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {analytics?.total_books || 0}
                  </div>
                </div>
              </div>

              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
                <div className="font-bold text-sm text-stone-200 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-accent-400" />
                  <span>Статистика задач генерации</span>
                </div>
                <div className="space-y-1.5 text-stone-300">
                  {analytics?.jobs_stats?.map((stat: any) => (
                    <div key={stat.status} className="flex justify-between py-1 border-b border-stone-700/50">
                      <span className="font-mono text-stone-400">{stat.status}</span>
                      <span className="font-bold">{stat._count?.id} шт.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Заказы Telegram Stars */}
          {!loading && tab === 'orders' && (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Заказов пока нет</div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{o.sku === 'SINGLE_BOOK_1' ? '1 сказка' : '5 сказок'}</span>
                      <span className="text-amber-400">{o.stars_amount} ⭐ ({o.rub_reference_amount} ₽)</span>
                    </div>
                    <div className="text-stone-400 font-mono text-[11px] truncate">
                      Charge ID: {o.telegram_charge_id || 'Ожидает оплаты'}
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>Статус: {o.status}</span>
                      <span>TG: {o.user?.telegram_user_id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. Очередь задач генерации и ошибки */}
          {!loading && tab === 'jobs' && (
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Очередь задач пуста</div>
              ) : (
                jobs.map((j) => (
                  <div key={j.id} className="bg-stone-800/60 p-3 rounded-2xl border border-stone-700 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white truncate max-w-[200px]">
                        {j.book?.title || j.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : j.status.includes('FAILED')
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-stone-400 text-[11px]">
                      <span>Попыток: {j.attempts} / {j.max_attempts}</span>
                      <span>Себестоимость AI: ${parseFloat(j.provider_cost || '0').toFixed(4)}</span>
                    </div>

                    {j.last_error && (
                      <div className="bg-rose-950/60 border border-rose-900/60 text-rose-300 p-2 rounded-xl text-[11px]">
                        Ошибка: {j.last_error}
                      </div>
                    )}

                    {j.status.includes('FAILED') && (
                      <button
                        onClick={() => handleRetryJob(j.id)}
                        className="mt-1 py-1.5 px-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Повторить генерацию (Retry)</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Ручная корректировка баланса с аудитом */}
          {!loading && tab === 'credits' && (
            <form onSubmit={handleAdjustCredits} className="space-y-3 bg-stone-800/60 p-4 rounded-2xl border border-stone-700">
              <div className="font-bold text-sm text-stone-200">
                Корректировка баланса пользователя
              </div>

              {adjustMessage && (
                <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 p-2.5 rounded-xl text-xs font-bold">
                  {adjustMessage}
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1">ID пользователя (UUID)</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white outline-none focus:border-accent-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">Дельта (+/-)</label>
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white outline-none focus:border-accent-500 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Тип кредита</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white outline-none focus:border-accent-500 text-xs font-bold"
                  >
                    <option value="gift">GIFT (подарок)</option>
                    <option value="paid">PAID (оплаченный)</option>
                    <option value="admin_adjustment">ADMIN_ADJUSTMENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Причина для журнала аудита</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Обязательно: обращение в саппорт / компенсация сбоя"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white outline-none focus:border-accent-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-bold text-xs mt-2"
              >
                Записать в журнал аудита и изменить баланс
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
