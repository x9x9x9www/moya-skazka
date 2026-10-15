import crypto from 'crypto';
import { config } from '../../config/index';
import { prisma } from '@moya-skazka/database';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class AuthService {
  /**
   * Криптографическая валидация HMAC-SHA256 подписи initData из Telegram WebApp
   */
  public static verifyTelegramInitData(initDataRaw: string): TelegramUserData {
    // В режиме разработки разрешаем тестовые данные
    if (config.NODE_ENV === 'development' && initDataRaw.startsWith('dev_user_')) {
      const mockId = parseInt(initDataRaw.replace('dev_user_', ''), 10) || 123456789;
      return {
        id: mockId,
        first_name: 'Тестовый',
        username: `parent_${mockId}`,
      };
    }

    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) {
      throw new Error('Telegram initData: отсутствует обязательный параметр hash');
    }

    // Собираем data_check_string в алфавитном порядке ключей
    const pairs: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') {
        pairs.push(`${key}=${value}`);
      }
    });
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    // secret_key = HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      // Для защиты безопасности не доверяем несовпадающей подписи
      throw new Error('Telegram initData: неверная подпись HMAC-SHA256');
    }

    // Проверка auth_date (< 24 часа в продакшене)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (config.NODE_ENV === 'production' && now - authDate > 86400) {
      throw new Error('Telegram initData: сессия истекла (auth_date старше 24 часов)');
    }

    const userJson = params.get('user');
    if (!userJson) {
      throw new Error('Telegram initData: отсутствует объект user');
    }

    try {
      return JSON.parse(userJson) as TelegramUserData;
    } catch {
      throw new Error('Telegram initData: повреждённый JSON объекта user');
    }
  }

  /**
   * Атомарный вход или регистрация пользователя с реферальной привязкой
   */
  public static async authenticateOrRegister(
    tgUser: TelegramUserData,
    startParam?: string | null
  ) {
    const telegramUserId = BigInt(tgUser.id);

    // 1. Поиск или создание пользователя
    let user = await prisma.user.findUnique({
      where: { telegram_user_id: telegramUserId },
    });

    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_user_id: telegramUserId,
          first_name: tgUser.first_name || null,
          username: tgUser.username || null,
        },
      });

      // Логируем аналитическое событие регистрации
      await prisma.event.create({
        data: {
          user_id: user.id,
          event_name: 'app_opened',
          properties_json: { is_new_user: true, start_param: startParam || null },
        },
      });
    }

    // 2. Обработка реферальной атрибуции только при первом входе нового пользователя
    if (isNewUser && startParam && startParam.startsWith('ref_')) {
      await this.attributeReferral(user.id, startParam);
    }

    return { user, isNewUser };
  }

  /**
   * Реферальная атрибуция (строго один раз на пользователя, без самоприглашений)
   */
  private static async attributeReferral(inviteeId: string, startParam: string) {
    const inviterToken = startParam.trim();

    // Находим пригласившего пользователя по его персональному токену или ID
    // По ТЗ персональная ссылка содержит startapp=ref_<user_id_short> или токен
    const inviterUserId = inviterToken.replace('ref_', '');

    const inviter = await prisma.user.findFirst({
      where: {
        OR: [
          { id: inviterUserId.length === 36 ? inviterUserId : undefined },
          { telegram_user_id: !isNaN(Number(inviterUserId)) ? BigInt(inviterUserId) : undefined },
        ],
      },
    });

    if (!inviter || inviter.id === inviteeId) {
      // Запрет самоприглашения или несуществующий inviter
      return;
    }

    try {
      await prisma.referral.create({
        data: {
          inviter_id: inviter.id,
          invitee_id: inviteeId,
          referral_token: inviterToken,
        },
      });

      await prisma.event.create({
        data: {
          user_id: inviteeId,
          event_name: 'referral_opened',
          properties_json: { inviter_id: inviter.id },
        },
      });
    } catch {
      // Если запись уже существует (UNIQUE invitee_id) — игнорируем повторную попытку
    }
  }
}
