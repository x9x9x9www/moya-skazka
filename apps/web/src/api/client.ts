import {
  BookDetailsDTO,
  BookSummaryDTO,
  ChildProfileDTO,
  DailyIdeaDTO,
  UserBalanceDTO,
  UserDTO,
} from '@moya-skazka/shared';
import { getActiveApiUrl } from '../services/storyGenerator';
import { getApiUrlCandidates, isRetryableApiFailure, markApiUrlFailed, rememberApiUrl, resolveConfiguredApiUrl } from '../services/apiUrlResolver';
import { isSameOriginApi } from '../services/runtimeConfig';
import { resolveChildAvatar, resolveChildAvatarKey } from '../utils/avatarResolver';
import { inferRussianNameGender } from '../utils/russianGrammar';

const API_BASE = '/api/v1';

type ChildGender = 'boy' | 'girl';

type PhotoAnalysisContext = { knownGender?: string; knownName?: string };

function resolvePhotoAnalysisGender(providerGender: unknown, context?: PhotoAnalysisContext): ChildGender {
  if (context?.knownGender === 'boy' || context?.knownGender === 'girl') {
    return context.knownGender;
  }
  if (providerGender === 'boy' || providerGender === 'girl') return providerGender;
  return inferRussianNameGender(context?.knownName) || 'boy';
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      const viteApi = resolveConfiguredApiUrl(
        (import.meta as any).env?.VITE_API_BRIDGE_URL,
        (import.meta as any).env?.VITE_API_URL,
      );
      return viteApi ? viteApi.replace(/\/$/, '') : '';
    }
    return getActiveApiUrl();
  }
  return '';
}

export function createTimeoutSignal(ms = 15000): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
    try {
      return (AbortSignal as any).timeout(ms);
    } catch {}
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error(`Timeout of ${ms}ms exceeded`)), ms);
    return controller.signal;
  }
  return undefined;
}

class ApiClient {
  private token: string | null = localStorage.getItem('auth_token');
  private baseFailures: Record<string, number> = {};

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
      ...(options.headers as Record<string, string>),
    };

    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const isLocalDev = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const viteApi = resolveConfiguredApiUrl(
      (import.meta as any).env?.VITE_API_BRIDGE_URL,
      (import.meta as any).env?.VITE_API_URL,
    );
    const apiBases = await getApiUrlCandidates(viteApi);
    const candidates = apiBases.length ? apiBases : (isLocalDev || isSameOriginApi() ? [''] : []);
    let lastError: any = null;

    for (const base of candidates) {
      const url = `${base}${API_BASE}${cleanEndpoint}`;
      try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
          let errBody: any;
          try {
            errBody = await response.json();
          } catch {
            errBody = { message: `Ошибка сервера (${response.status})` };
          }
          const error = new Error(errBody.message || 'Ошибка выполнения запроса');
          (error as any).status = response.status;
          throw error;
        }

        if (base) {
          this.baseFailures[base] = 0;
          rememberApiUrl(base);
        }
        return await response.json();
      } catch (err: any) {
        lastError = err;
        const status = Number(err?.status);
        const isTransportFailure = isRetryableApiFailure(status || undefined, err);
        console.warn('[ApiClient] Запрос не выполнен:', status ? `HTTP ${status}` : (err?.name === 'AbortError' ? 'timeout' : 'network error'));
        if (base && isTransportFailure) {
          this.baseFailures[base] = (this.baseFailures[base] || 0) + 1;
          markApiUrlFailed(base);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error(`Ошибка запроса к ${endpoint}`);
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

  // 4. Сказка дня (Пункт 14 ТЗ)
  public async getDailyIdea(childId: string, localDate?: string): Promise<DailyIdeaDTO> {
    const dateQuery = localDate ? `&date=${encodeURIComponent(localDate)}` : '';
    return await this.request<DailyIdeaDTO>(`/daily-idea?child_id=${encodeURIComponent(childId)}${dateQuery}`);
  }

  public async refreshDailyIdea(childId: string, localDate?: string): Promise<DailyIdeaDTO> {
    return await this.request<DailyIdeaDTO>('/daily-idea/refresh', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, local_date: localDate }),
    });
  }

  public async saveDailyIdea(childId: string, ideaId?: string): Promise<{ ok: boolean; is_saved: boolean; idea?: DailyIdeaDTO }> {
    return await this.request<{ ok: boolean; is_saved: boolean; idea?: DailyIdeaDTO }>('/daily-idea/save', {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, idea_id: ideaId }),
    });
  }

  public async getSavedDailyIdeas(childId?: string): Promise<any[]> {
    const q = childId ? `?child_id=${encodeURIComponent(childId)}` : '';
    return await this.request<any[]>(`/daily-idea/saved${q}`);
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
    return await this.request<{ order_id: string; stars_amount: number; status: string; invoice_link?: string }>('/orders', {
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
  public async analyzeChildPhoto(
    imageBase64: string,
    context?: { knownGender?: string; knownName?: string; knownAge?: number }
  ): Promise<{
    status: 'ok' | 'fallback';
    analysis: {
      gender?: 'boy' | 'girl';
      estimatedAge?: number;
      approxAge?: number;
      hairColor?: string;
      hairLength?: 'короткие' | 'длинные';
      hairStructure?: 'прямые' | 'кудрявые';
      hairType?: string;
      eyeColor?: string;
      skinTone?: string;
      clothingItem?: string;
      clothingDescription?: string;
      clothingColor?: string;
      confidenceTip?: string;
      avatar_id?: string;
      distinctiveFeatures?: string;
      hasGlasses?: boolean;
    };
  }> {
    try {
      const res: any = await this.request('/ai/analyze-photo', {
        method: 'POST',
        signal: createTimeoutSignal(60000),
        body: JSON.stringify({
          imageBase64,
          knownGender: context?.knownGender,
          knownName: context?.knownName,
          knownAge: context?.knownAge,
        }),
      });
      if (res && res.analysis) {
        return {
          ...res,
          analysis: {
            ...res.analysis,
            gender: resolvePhotoAnalysisGender(res.analysis.gender, context),
          },
        };
      }
      return {
        status: 'ok',
        analysis: {
          ...res,
          gender: resolvePhotoAnalysisGender(res?.gender, context),
        },
      };
    } catch (err: any) {
      console.warn('[ApiClient] Ошибка analyzeChildPhoto, возврат фоллбэка:', err.message);
      const fbGender = resolvePhotoAnalysisGender(undefined, context);
      const isGirl = fbGender === 'girl';
      return {
        status: 'fallback',
        analysis: {
          gender: fbGender,
          estimatedAge: context?.knownAge || 4,
          approxAge: context?.knownAge || 4,
          hairColor: 'русые',
          hairLength: isGirl ? 'длинные' : 'короткие',
          hairStructure: 'прямые',
          hairType: isGirl ? 'длинные' : 'короткие',
          eyeColor: 'карие',
          skinTone: 'персиковая',
          avatar_id: `${fbGender}_brown`,
          clothingItem: isGirl ? 'платьице' : 'уютный свитер',
          clothingDescription: isGirl ? 'платьице' : 'уютный свитер',
          clothingColor: isGirl ? 'нежно-розовый' : 'небесно-голубой',
          confidenceTip: 'Установили базовые параметры внешности — вы можете скорректировать их в один клик.',
        },
      };
    }
  }

  // 13. Безопасный анализ фото ребенка для автосоздания персонажа (Zero-Storage Vision)
  public async analyzeCharacterPhoto(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    context?: { knownGender?: string; knownName?: string; knownAge?: number }
  ): Promise<{
    gender?: 'boy' | 'girl';
    approxAge?: number;
    hairColor?: 'светлые' | 'русые' | 'тёмные' | 'рыжие';
    hairType?: 'кудрявые' | 'короткие' | 'длинные' | 'прямые';
    eyeColor?: 'карие' | 'голубые' | 'зелёные' | 'серые';
    skinTone?: 'светлая' | 'персиковая' | 'смуглая';
    distinctiveFeatures?: string;
    hasGlasses?: boolean;
    clothingItem?: string;
    clothingColor?: string;
    avatar_id?: string;
    error?: 'FACE_NOT_DETECTED' | string;
    message?: string;
  }> {
    const payload = {
      imageBase64,
      mimeType,
      knownGender: context?.knownGender,
      knownName: context?.knownName,
      knownAge: context?.knownAge,
    };
    try {
      // 1. Пробуем маршрут /character/analyze-photo
      const res: any = await this.request('/character/analyze-photo', {
        method: 'POST',
        signal: createTimeoutSignal(15000),
        body: JSON.stringify(payload),
      });
      const data = res?.analysis || res;
      return {
        gender: resolvePhotoAnalysisGender(data.gender, context),
        approxAge: data.approxAge || data.estimatedAge || context?.knownAge || 4,
        hairColor: data.hairColor || 'русые',
        hairType: data.hairType || (data.hairStructure === 'кудрявые' ? 'кудрявые' : data.hairLength || 'короткие'),
        eyeColor: data.eyeColor || 'карие',
        skinTone: data.skinTone || 'персиковая',
        distinctiveFeatures: data.distinctiveFeatures || '',
        hasGlasses: data.hasGlasses || false,
        clothingItem: data.clothingItem,
        clothingColor: data.clothingColor,
        avatar_id: data.avatar_id,
        error: data.error,
        message: data.message,
      };
    } catch (err: any) {
      const status = typeof err?.status === 'number' ? err.status : undefined;
      const hasRouteFallback = status === 404;
      if (hasRouteFallback) {
        // 2. Если первый маршрут дал 404 (например, в мосте зарегистрирован только /ai/analyze-photo)
        try {
          const alt: any = await this.request('/ai/analyze-photo', {
            method: 'POST',
            signal: createTimeoutSignal(15000),
            body: JSON.stringify(payload),
          });
          const data = alt?.analysis || alt;
          return {
            gender: resolvePhotoAnalysisGender(data.gender, context),
            approxAge: data.approxAge || data.estimatedAge || context?.knownAge || 4,
            hairColor: data.hairColor || 'русые',
            hairType: data.hairType || (data.hairStructure === 'кудрявые' ? 'кудрявые' : data.hairLength || 'короткие'),
            eyeColor: data.eyeColor || 'карие',
            skinTone: data.skinTone || 'персиковая',
            distinctiveFeatures: data.distinctiveFeatures || '',
            hasGlasses: data.hasGlasses || false,
            clothingItem: data.clothingItem,
            clothingColor: data.clothingColor,
            avatar_id: data.avatar_id,
            error: data.error,
            message: data.message,
          };
        } catch (altError: any) {
          const altStatus = typeof altError?.status === 'number' ? altError.status : undefined;
          if (!isRetryableApiFailure(altStatus, altError)) throw altError;
        }
      } else if (!isRetryableApiFailure(status, err)) {
        throw err;
      }
      console.warn('[ApiClient] analyzeCharacterPhoto использует ручной фоллбэк:', status ? `HTTP ${status}` : (err?.name === 'AbortError' ? 'timeout' : 'network error'));
      const fbGender = resolvePhotoAnalysisGender(undefined, context);
      const isGirl = fbGender === 'girl';
      return {
        gender: fbGender,
        approxAge: context?.knownAge || 4,
        hairColor: 'русые',
        hairType: isGirl ? 'длинные' : 'короткие',
        eyeColor: 'карие',
        skinTone: 'персиковая',
        distinctiveFeatures: '',
        hasGlasses: false,
        avatar_id: `${fbGender}_brown`,
      };
    }
  }

  // 14. Мгновенная генерация 3D-аватарки по фото ребенка + наряд (Zero-Storage Vision + Nano-Banana-2)
  public async generateCharacterAvatar(
    imageBase64: string,
    outfit?: string,
    mimeType: string = 'image/jpeg',
    context?: { knownGender?: string; knownName?: string; knownAge?: number }
  ): Promise<{
    status: 'ok' | 'fallback';
    failureReason?: 'network' | 'generation';
    traitsAnalyzed?: boolean;
    avatarUrl: string;
    avatar_id?: string;
    traits: {
      gender?: 'boy' | 'girl';
      approxAge?: number;
      hairColor?: string;
      hairType?: string;
      eyeColor?: string;
      skinTone?: string;
      distinctiveFeatures?: string;
      clothingItem?: string;
      clothingColor?: string;
      hasGlasses?: boolean;
    };
  }> {
    try {
      const res: any = await this.request('/character/generate-avatar', {
        method: 'POST',
        signal: createTimeoutSignal(120000),
        body: JSON.stringify({
          imageBase64,
          outfit,
          mimeType,
          knownGender: context?.knownGender,
          knownName: context?.knownName,
          knownAge: context?.knownAge,
        }),
      });
      if (res && res.avatarUrl) {
        return {
          status: res.status === 'fallback' ? 'fallback' : 'ok',
          failureReason: res.status === 'fallback' ? 'generation' : undefined,
          traitsAnalyzed: res.traitsAnalyzed,
          avatarUrl: res.avatarUrl,
          avatar_id: res.avatar_id,
          traits: res.traits || {},
        };
      }
      throw new Error('Ответ сервера не содержит avatarUrl');
    } catch (err: any) {
      const status = Number(err?.status);
      const isTransportError = !status && (err?.name === 'AbortError' || err instanceof TypeError);
      const failureReason = isTransportError ? 'network' : 'generation';
      console.warn('[ApiClient] generateCharacterAvatar использует канонический аватар после ошибки запроса:', status ? `HTTP ${status}` : (err?.name === 'AbortError' ? 'timeout' : 'network error'));
      const inferredGender = context?.knownName ? inferRussianNameGender(context.knownName) : null;
      const fbGender: 'boy' | 'girl' =
        context?.knownGender === 'girl' || context?.knownGender === 'boy'
          ? (context.knownGender as 'boy' | 'girl')
          : (inferredGender as 'boy' | 'girl') || 'boy';
      const isGirl = fbGender === 'girl';
      const traits = {
        gender: fbGender,
        approxAge: context?.knownAge || 4,
        hairColor: 'русые',
        hairType: isGirl ? 'длинные' : 'короткие',
        eyeColor: 'карие',
        skinTone: 'светлая',
        distinctiveFeatures: '',
        clothingItem: isGirl ? 'платьице' : 'уютный свитер',
        clothingColor: isGirl ? 'нежно-розовый' : 'небесно-голубой',
      };
      const avatarId = resolveChildAvatarKey(traits);
      return {
        status: 'fallback',
        failureReason,
        traitsAnalyzed: false,
        avatarUrl: resolveChildAvatar({ avatar_id: avatarId }),
        avatar_id: avatarId,
        traits,
      };
    }
  }
}

export const api = new ApiClient();

