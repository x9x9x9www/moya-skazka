import { prisma } from '@moya-skazka/database';
import { config } from '../../config/index';
import { CreditsService } from '../credits/credits.service';
import { OrderSku } from '@moya-skazka/shared';

export class OrdersService {
  /**
   * Создание заказа и подготовка инвойса Telegram Stars
   */
  public static async createOrder(userId: string, sku: 'single_book_1' | 'pack_5', idempotencyKey: string) {
    const isSingle = sku === 'single_book_1';
    const starsAmount = isSingle ? config.STARS_PRICE_SINGLE_BOOK : config.STARS_PRICE_PACK_5;
    const rubRef = isSingle ? config.RUB_REF_SINGLE_BOOK : config.RUB_REF_PACK_5;

    const dbSku: OrderSku = isSingle ? 'SINGLE_BOOK_1' : 'PACK_5';

    // Проверяем идемпотентность
    const existingOrder = await prisma.order.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    if (existingOrder) {
      return {
        order_id: existingOrder.id,
        stars_amount: existingOrder.stars_amount,
        status: existingOrder.status,
      };
    }

    const order = await prisma.order.create({
      data: {
        user_id: userId,
        sku: dbSku,
        stars_amount: starsAmount,
        rub_reference_amount: rubRef,
        status: 'CREATED',
        idempotency_key: idempotencyKey,
      },
    });

    await prisma.event.create({
      data: {
        user_id: userId,
        event_name: 'checkout_started',
        properties_json: { order_id: order.id, sku, stars_amount: starsAmount },
      },
    });

    return {
      order_id: order.id,
      stars_amount: order.stars_amount,
      status: order.status,
    };
  }

  /**
   * Обработка вебхука Telegram Stars (идемпотентность, начисление и реферальная награда)
   */
  public static async handleTelegramWebhook(payload: any) {
    // 1. Предварительная проверка готовности к оплате
    if (payload.pre_checkout_query) {
      const query = payload.pre_checkout_query;
      return {
        method: 'answerPreCheckoutQuery',
        pre_checkout_query_id: query.id,
        ok: true,
      };
    }

    // 2. Успешная оплата (successful_payment)
    if (payload.message && payload.message.successful_payment) {
      const payment = payload.message.successful_payment;
      const telegramChargeId = payment.telegram_payment_charge_id;
      const orderId = payment.invoice_payload; // orderId передаётся в payload инвойса

      if (!orderId || !telegramChargeId) {
        return { ok: true };
      }

      await prisma.$transaction(async (tx) => {
        // Проверяем, не был ли этот telegram_charge_id уже обработан (защита от дубликатов вебхука)
        const duplicateCharge = await tx.order.findUnique({
          where: { telegram_charge_id: telegramChargeId },
        });

        if (duplicateCharge) {
          console.log(`[OrdersService] Дублирующий webhook для charge_id: ${telegramChargeId}`);
          return;
        }

        const order = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (!order || order.status === 'FULFILLED') {
          return;
        }

        // Обновляем статус заказа
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'FULFILLED',
            telegram_charge_id: telegramChargeId,
          },
        });

        // Начисляем кредиты покупателю (+1 или +5)
        const skuKey = order.sku === 'SINGLE_BOOK_1' ? 'single_book_1' : 'pack_5';
        await CreditsService.addCreditsForOrder(order.user_id, order.id, skuKey);

        // 3. Проверка реферальной награды (+1 gift пригласившему за первую подтверждённую оплату)
        await OrdersService.checkAndAwardReferralReward(tx, order.user_id, order.id);

        await tx.event.create({
          data: {
            user_id: order.user_id,
            event_name: 'payment_confirmed',
            properties_json: {
              order_id: order.id,
              stars: order.stars_amount,
              telegram_charge_id: telegramChargeId,
            },
          },
        });
      });
    }

    return { ok: true };
  }

  /**
   * Начисление реферальной награды (+1 gift) strictly 1 раз за первую оплату
   */
  private static async checkAndAwardReferralReward(tx: any, inviteeId: string, qualifyingOrderId: string) {
    const referral = await tx.referral.findUnique({
      where: { invitee_id: inviteeId },
    });

    if (!referral) {
      return; // Пользователь пришел без реферальной ссылки
    }

    // Проверяем, не была ли уже выдана награда за этого реферала
    const existingReward = await tx.referralReward.findUnique({
      where: { referral_id: referral.id },
    });

    if (existingReward) {
      return; // Награда выдается только один раз
    }

    // Создаем запись начисления +1 GIFT кредита пригласившему
    const ledgerEntry = await tx.creditLedger.create({
      data: {
        user_id: referral.inviter_id,
        source_type: 'GIFT',
        source_id: `ref_reward_${referral.id}`,
        delta: 1,
        status: 'CONFIRMED',
        reason: 'Подарок за первую оплату приглашённого друга',
      },
    });

    // Фиксируем факт выдачи награды с уникальным ограничением
    await tx.referralReward.create({
      data: {
        referral_id: referral.id,
        order_id: qualifyingOrderId,
        credit_ledger_id: ledgerEntry.id,
        status: 'AWARDED',
      },
    });

    await tx.referral.update({
      where: { id: referral.id },
      data: { qualifying_order_id: qualifyingOrderId },
    });

    await tx.event.create({
      data: {
        user_id: referral.inviter_id,
        event_name: 'referral_rewarded',
        properties_json: { invitee_id: inviteeId, reward_ledger_id: ledgerEntry.id },
      },
    });
  }
}
