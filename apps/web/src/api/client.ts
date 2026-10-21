import {
  BookDetailsDTO,
  BookSummaryDTO,
  ChildProfileDTO,
  UserBalanceDTO,
  UserDTO,
} from '@moya-skazka/shared';

const API_BASE = '/api/v1';

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
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
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
      eyeColor?: string;
      skinTone?: string;
      clothingDescription?: string;
      clothingColor?: string;
      confidenceTip?: string;
    };
  }> {
    return await this.request('/ai/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  }
}

export const api = new ApiClient();
