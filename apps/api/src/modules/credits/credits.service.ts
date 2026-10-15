import { prisma } from '@moya-skazka/database';
import { CreditSourceType } from '@moya-skazka/shared';

export interface UserBalance {
  total: number;
  paid: number;
  gift: number;
  reserved: number;
  available: number;
}

export class CreditsService {
  /**
   * Получение детального баланса пользователя
   */
  public static async getUserBalance(userId: string): Promise<UserBalance> {
    const ledger = await prisma.creditLedger.findMany({
      where: {
        user_id: userId,
        status: 'CONFIRMED',
      },
    });

    let paid = 0;
    let gift = 0;

    for (const entry of ledger) {
      if (entry.source_type === 'PAID') {
        paid += entry.delta;
      } else if (entry.source_type === 'GIFT') {
        gift += entry.delta;
      } else if (entry.source_type === 'SPEND') {
        // Списание сначала гасит gift, затем paid
        paid += entry.delta;
      } else if (entry.source_type === 'ADMIN_ADJUSTMENT') {
        paid += entry.delta;
      }
    }

    const total = Math.max(0, paid + gift);

    // Активные незавершенные резервации
    const activeReservationsCount = await prisma.creditReservation.count({
      where: {
        user_id: userId,
        status: 'RESERVED',
      },
    });

    const available = Math.max(0, total - activeReservationsCount);

    return {
      total,
      paid: Math.max(0, paid),
      gift: Math.max(0, gift),
      reserved: activeReservationsCount,
      available,
    };
  }

  /**
   * Атомарное право на первую бесплатную сказку (ровно 1 раз на аккаунт)
   */
  public static async claimFreeStory(userId: string): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // Блокируем запись пользователя и проверяем, не использована ли бесплатная сказка
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `UPDATE "users"
         SET "free_text_claimed_at" = NOW(), "updated_at" = NOW()
         WHERE "id" = $1::uuid AND "free_text_claimed_at" IS NULL
         RETURNING "id"`,
        userId
      );

      if (!rows || rows.length === 0) {
        throw new Error('Бесплатная сказка уже была получена для этого аккаунта');
      }

      return true;
    });
  }

  /**
   * Атомарное резервирование ровно 1 кредита с защитой от гонки (SELECT ... FOR UPDATE)
   */
  public static async reserveCredit(userId: string, bookId: string): Promise<string> {
    return await prisma.$transaction(async (tx) => {
      // 1. Блокируем пользователя от параллельных списаний
      await tx.$executeRawUnsafe(
        `SELECT "id" FROM "users" WHERE "id" = $1::uuid FOR UPDATE`,
        userId
      );

      // 2. Рассчитываем доступный баланс внутри транзакции
      const ledgerEntries = await tx.creditLedger.findMany({
        where: { user_id: userId, status: 'CONFIRMED' },
      });

      const totalBalance = ledgerEntries.reduce((acc, entry) => acc + entry.delta, 0);

      const reservedCount = await tx.creditReservation.count({
        where: { user_id: userId, status: 'RESERVED' },
      });

      const available = totalBalance - reservedCount;

      if (available < 1) {
        throw new Error('Недостаточно кредитов на балансе для создания сказки');
      }

      // 3. Создаем запись резервации
      const reservation = await tx.creditReservation.create({
        data: {
          user_id: userId,
          book_id: bookId,
          status: 'RESERVED',
        },
      });

      return reservation.id;
    });
  }

  /**
   * Финализация резервации при успешной генерации (CONSUMED) + списание в ledger
   */
  public static async consumeReservation(bookId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.creditReservation.findFirst({
        where: { book_id: bookId, status: 'RESERVED' },
      });

      if (!reservation) {
        return; // Резервация уже обработана
      }

      // 1. Переводим резервацию в CONSUMED
      await tx.creditReservation.update({
        where: { id: reservation.id },
        data: { status: 'CONSUMED' },
      });

      // 2. Добавляем запись о расходе (-1) в неизменяемый журнал credit_ledger
      await tx.creditLedger.create({
        data: {
          user_id: reservation.user_id,
          source_type: 'SPEND',
          source_id: reservation.id,
          delta: -1,
          status: 'CONFIRMED',
          book_id: bookId,
          reason: 'Генерация книги',
        },
      });
    });
  }

  /**
   * Снятие резерва при фатальной ошибке генерации (RELEASED) — кредит возвращается
   */
  public static async releaseReservation(bookId: string, reason?: string): Promise<void> {
    const reservation = await prisma.creditReservation.findFirst({
      where: { book_id: bookId, status: 'RESERVED' },
    });

    if (reservation) {
      await prisma.creditReservation.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED' },
      });

      await prisma.event.create({
        data: {
          user_id: reservation.user_id,
          event_name: 'credit_reservation_released',
          properties_json: { book_id: bookId, reason: reason || 'Ошибка генерации' },
        },
      });
    }
  }

  /**
   * Начисление кредитов за успешный заказ Telegram Stars (+1 или +5)
   */
  public static async addCreditsForOrder(
    userId: string,
    orderId: string,
    sku: 'single_book_1' | 'pack_5'
  ): Promise<void> {
    const delta = sku === 'single_book_1' ? 1 : 5;

    await prisma.$transaction(async (tx) => {
      // Проверка на идемпотентность: не начисляли ли уже за этот order_id
      const existing = await tx.creditLedger.findFirst({
        where: { source_id: orderId, source_type: 'PAID' },
      });

      if (existing) {
        return;
      }

      await tx.creditLedger.create({
        data: {
          user_id: userId,
          source_type: 'PAID',
          source_id: orderId,
          delta,
          status: 'CONFIRMED',
          reason: `Покупка ${sku === 'single_book_1' ? '1 сказки' : 'пакета 5 сказок'}`,
        },
      });
    });
  }

  /**
   * Ручная корректировка баланса администратором с записью в аудит
   */
  public static async adminAdjustBalance(
    userId: string,
    delta: number,
    sourceType: 'paid' | 'gift' | 'admin_adjustment',
    reason: string,
    adminId: string
  ): Promise<void> {
    const dbSourceType: CreditSourceType =
      sourceType === 'gift' ? 'GIFT' : sourceType === 'paid' ? 'PAID' : 'ADMIN_ADJUSTMENT';

    await prisma.creditLedger.create({
      data: {
        user_id: userId,
        source_type: dbSourceType,
        source_id: `admin_${adminId}`,
        delta,
        status: 'CONFIRMED',
        reason,
      },
    });

    await prisma.event.create({
      data: {
        user_id: userId,
        event_name: 'admin_balance_adjustment',
        properties_json: { delta, reason, admin_id: adminId },
      },
    });
  }
}
