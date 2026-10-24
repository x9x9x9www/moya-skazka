import {
  BookDetailsDTO,
  BookSummaryDTO,
  ChildProfileDTO,
  UserBalanceDTO,
  UserDTO,
} from '@moya-skazka/shared';
import { getActiveApiUrl } from '../services/storyGenerator';

const API_BASE = '/api/v1';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Локальная разработка через Vite dev server
    if (host === 'localhost' || host === '127.0.0.1') {
      const viteApi = (import.meta as any).env?.VITE_API_URL;
      return viteApi ? viteApi.replace(/\/$/, '') : '';
    }
    // На продакшене (GitHub Pages, Telegram WebApp): используем переданный api_url или активный мост
    const active = getActiveApiUrl();
    if (active) return active.replace(/\/$/, '');
  }
  return '';
}

class ApiClient {
  private token: string | null = localStorage.getItem('auth_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = baseUrl ? `${baseUrl}${API_BASE}${cleanEndpoint}` : `${API_BASE}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = { message: `Ошибка сервера (${response.status})` };
        }
        throw new Error(errBody.message || 'Ошибка выполнения запроса');
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Ошибка запроса к ${endpoint}:`, err.message);
      throw err;
    }
  }

  // 1. Авторизация
  public async loginWithTelegram(initData: string, startParam?: string | null) {
    const res = await this.request<{ token: string; user: UserDTO }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ init_data: initData, start_param: startParam }),
    });
    this.setToken(res.token);
    return res;
  }

  // 2. Текущий пользователь
  public async getMe(): Promise<{ user: UserDTO; balance: UserBalanceDTO; can_claim_free_story: boolean }> {
    return await this.request('/me');
  }

  // 3. Дети
  public async getChildren(): Promise<ChildProfileDTO[]> {
    return await this.request('/children');
  }

  public async createChild(data: any): Promise<ChildProfileDTO> {
    return await this.request('/children', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateChild(id: string, data: any): Promise<ChildProfileDTO> {
    return await this.request(`/children/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // 4. Сказка дня
  public async getDailyIdea(childId: string) {
    return await this.request<any>(`/daily-idea?child_id=${childId}`);
  }

  public async refreshDailyIdea(childId: string) {
    return await this.request<any>('/daily-idea/refresh', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId }),
    });
  }

  // 5. Книги и задачи
  public async createFreeBook(data: any) {
    return await this.request<{ book_id: string; job_id: string; status: string }>('/books/free', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async createPaidBook(data: any) {
    return await this.request<{ book_id: string; job_id: string; status: string }>('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async upgradeBook(bookId: string) {
    return await this.request<{ book_id: string; job_id: string; status: string }>(`/books/${bookId}/upgrade`, {
      method: 'POST',
    });
  }

  public async getBooks(format?: string): Promise<BookSummaryDTO[]> {
    const query = format && format !== 'ALL' ? `?format=${format}` : '';
    return await this.request(`/books${query}`);
  }

  public async getBook(id: string): Promise<BookDetailsDTO> {
    return await this.request(`/books/${id}`);
  }

  public async getJobStatus(jobId: string) {
    return await this.request<{
      job_id: string;
      status: string;
      attempts: number;
      progress_percentage: number;
      error?: string;
    }>(`/jobs/${jobId}`);
  }

  // 6. Магазин
  public async getCatalog() {
    return await this.request<any[]>('/catalog');
  }

  public async createOrder(sku: string, idempotencyKey: string) {
    return await this.request<{ order_id: string; stars_amount: number; status: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ sku, idempotency_key: idempotencyKey }),
    });
  }

  public async getCredits() {
    return await this.request<any[]>('/credits');
  }

  // 7. Рефералы
  public async getReferrals() {
    return await this.request<{
      referral_link: string;
      qualified_friends_count: number;
      gift_credits_earned: number;
    }>('/referrals/me');
  }

  // 8. Удаление аккаунта
  public async deleteAccount() {
    return await this.request<{ ok: boolean }>('/privacy/delete', {
      method: 'POST',
    });
  }

  // 9. Админка
  public async getAdminOrders() {
    return await this.request<any[]>('/admin/orders');
  }

  public async getAdminJobs() {
    return await this.request<any[]>('/admin/jobs');
  }

  public async retryAdminJob(jobId: string) {
    return await this.request<any>(`/admin/jobs/${jobId}/retry`, { method: 'POST' });
  }

  public async adjustAdminCredits(userId: string, delta: number, sourceType: string, reason: string) {
    return await this.request<any>('/admin/credits/adjust', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, delta, source_type: sourceType, reason }),
    });
  }

  public async getAdminAnalytics() {
    return await this.request<any>('/admin/analytics');
  }

  // 12. Анализ фото ребёнка для автоподбора параметров внешности (без сохранения фото)
  public async analyzeChildPhoto(imageBase64: string): Promise<{
    status: 'ok' | 'fallback';
    analysis: {
      gender?: 'boy' | 'girl';
      estimatedAge?: number;
      hairColor?: string;
      hairLength?: 'короткие' | 'длинные';
      hairStructure?: 'прямые' | 'кудрявые';
      hairType?: string;
      eyeColor?: string;
      skinTone?: string;
      clothingDescription?: string;
      clothingColor?: string;
      confidenceTip?: string;
      avatar_id?: string;
      distinctiveFeatures?: string;
    };
  }> {
    try {
      const res: any = await this.request('/ai/analyze-photo', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      });
      if (res && res.analysis) return res;
      return { status: 'ok', analysis: res };
    } catch (err: any) {
      console.warn('[ApiClient] Ошибка analyzeChildPhoto, возврат фоллбэка:', err.message);
      return {
        status: 'fallback',
        analysis: {
          gender: 'boy',
          estimatedAge: 4,
          hairColor: 'русые',
          hairLength: 'короткие',
          hairStructure: 'прямые',
          hairType: 'короткие',
          eyeColor: 'карие',
          skinTone: 'персиковая',
          avatar_id: 'boy_brown',
          clothingDescription: 'уютный свитер',
          clothingColor: 'изумрудный',
          confidenceTip: 'Установили базовые параметры внешности — вы можете скорректировать их вручную.',
        },
      };
    }
  }

  // 13. Безопасный анализ фото ребенка для автосоздания персонажа (Zero-Storage Vision)
  public async analyzeCharacterPhoto(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
  ): Promise<{
    gender?: 'boy' | 'girl';
    approxAge?: number;
    hairColor?: 'светлые' | 'русые' | 'тёмные' | 'рыжие';
    hairType?: 'кудрявые' | 'короткие' | 'длинные' | 'прямые';
    eyeColor?: 'карие' | 'голубые' | 'зелёные' | 'серые';
    skinTone?: 'светлая' | 'персиковая' | 'смуглая';
    distinctiveFeatures?: string;
    avatar_id?: string;
    error?: 'FACE_NOT_DETECTED' | string;
    message?: string;
  }> {
    try {
      // 1. Пробуем маршрут /character/analyze-photo
      const res: any = await this.request('/character/analyze-photo', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = res?.analysis || res;
      return {
        gender: data.gender || 'boy',
        approxAge: data.approxAge || data.estimatedAge || 4,
        hairColor: data.hairColor || 'русые',
        hairType: data.hairType || (data.hairStructure === 'кудрявые' ? 'кудрявые' : data.hairLength || 'короткие'),
        eyeColor: data.eyeColor || 'карие',
        skinTone: data.skinTone || 'персиковая',
        distinctiveFeatures: data.distinctiveFeatures || '',
        avatar_id: data.avatar_id,
        error: data.error,
        message: data.message,
      };
    } catch (err: any) {
      // 2. Если первый маршрут дал сбой (например, в мосте зарегистрирован только /ai/analyze-photo)
      try {
        const alt: any = await this.request('/ai/analyze-photo', {
          method: 'POST',
          body: JSON.stringify({ imageBase64, mimeType }),
        });
        const data = alt?.analysis || alt;
        return {
          gender: data.gender || 'boy',
          approxAge: data.approxAge || data.estimatedAge || 4,
          hairColor: data.hairColor || 'русые',
          hairType: data.hairType || (data.hairStructure === 'кудрявые' ? 'кудрявые' : data.hairLength || 'короткие'),
          eyeColor: data.eyeColor || 'карие',
          skinTone: data.skinTone || 'персиковая',
          distinctiveFeatures: data.distinctiveFeatures || '',
          avatar_id: data.avatar_id,
        };
      } catch (innerErr: any) {
        console.warn('[ApiClient] Фоллбэк автоподбора персонажа при недоступности сети:', innerErr.message);
        return {
          gender: 'boy',
          approxAge: 4,
          hairColor: 'русые',
          hairType: 'короткие',
          eyeColor: 'карие',
          skinTone: 'персиковая',
          avatar_id: 'boy_brown',
          distinctiveFeatures: 'милая открытая улыбка',
        };
      }
    }
  }
}

export const api = new ApiClient();
