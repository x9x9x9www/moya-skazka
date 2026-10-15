import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/index';
import { prisma } from '@moya-skazka/database';
import {
  AdminAdjustCreditsSchema,
  CreateChildProfileSchema,
  CreateFreeBookSchema,
  CreateOrderSchema,
  CreatePaidBookSchema,
  TelegramAuthSchema,
  UpdateChildProfileSchema,
} from '@moya-skazka/shared';
import { AuthService } from './modules/auth/auth.service';
import { CreditsService } from './modules/credits/credits.service';
import { JobsService } from './modules/jobs/jobs.service';
import { OrdersService } from './modules/orders/orders.service';
import { jobWorker } from './modules/jobs/worker';

export const app = fastify({
  logger: config.NODE_ENV === 'development',
});

// Регистрация CORS
app.register(cors, {
  origin: true,
  credentials: true,
});

// Регистрация JWT
app.register(jwt, {
  secret: config.JWT_SECRET,
});

// Регистрация Swagger
app.register(swagger, {
  swagger: {
    info: {
      title: 'API «Моя сказка» — Telegram Mini App',
      description: 'Серверный API детских персонализированных сказок',
      version: '1.0.0',
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Middleware аутентификации
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Требуется авторизация через Telegram',
      request_id: req.id,
    });
  }
}

// Middleware проверки роли администратора
export async function authenticateAdmin(req: FastifyRequest, reply: FastifyReply) {
  await authenticate(req, reply);
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    // В режиме разработки с флагом ENABLE_ADMIN_DEV_LOGIN разрешаем доступ
    if (config.ENABLE_ADMIN_DEV_LOGIN && req.headers['x-admin-secret'] === config.ADMIN_SECRET_KEY) {
      return;
    }
    return reply.status(403).send({
      code: 'FORBIDDEN',
      message: 'Доступ разрешён только администраторам',
      request_id: req.id,
    });
  }
}

// ========================================================
// Маршруты API (версия 1)
// ========================================================
app.register(
  async (api) => {
    // ----------------------------------------------------
    // 1. Авторизация
    // ----------------------------------------------------
    api.post('/auth/telegram', async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = TelegramAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      try {
        const tgUser = AuthService.verifyTelegramInitData(parsed.data.init_data);
        const { user } = await AuthService.authenticateOrRegister(tgUser, parsed.data.start_param);

        const token = app.jwt.sign(
          {
            id: user.id,
            telegram_user_id: user.telegram_user_id.toString(),
            role: user.role,
          },
          { expiresIn: config.JWT_EXPIRES_IN }
        );

        return {
          token,
          user: {
            id: user.id,
            telegram_user_id: user.telegram_user_id.toString(),
            first_name: user.first_name,
            username: user.username,
            role: user.role,
            free_text_claimed_at: user.free_text_claimed_at?.toISOString() || null,
            default_questions_enabled: user.default_questions_enabled,
            timezone: user.timezone,
          },
        };
      } catch (err: any) {
        return reply.status(401).send({
          code: 'AUTH_FAILED',
          message: err.message,
          request_id: req.id,
        });
      }
    });

    // ----------------------------------------------------
    // 2. Текущий профиль и баланс (/me)
    // ----------------------------------------------------
    api.get('/me', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: authUser.id },
      });

      const balance = await CreditsService.getUserBalance(user.id);

      return {
        user: {
          id: user.id,
          telegram_user_id: user.telegram_user_id.toString(),
          first_name: user.first_name,
          username: user.username,
          role: user.role,
          free_text_claimed_at: user.free_text_claimed_at?.toISOString() || null,
          default_questions_enabled: user.default_questions_enabled,
          timezone: user.timezone,
        },
        balance,
        can_claim_free_story: user.free_text_claimed_at === null,
      };
    });

    // ----------------------------------------------------
    // 3. Профили детей (/children)
    // ----------------------------------------------------
    api.get('/children', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;
      const children = await prisma.childProfile.findMany({
        where: { user_id: authUser.id, is_active: true },
        orderBy: { created_at: 'desc' },
      });

      return children.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        age: c.age,
        interests: c.interests_json,
        appearance: c.appearance_json,
        is_active: c.is_active,
      }));
    });

    api.post('/children', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const parsed = CreateChildProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      const child = await prisma.childProfile.create({
        data: {
          user_id: authUser.id,
          name: parsed.data.name,
          age: parsed.data.age,
          interests_json: parsed.data.interests,
          appearance_json: parsed.data.appearance,
        },
      });

      await prisma.event.create({
        data: {
          user_id: authUser.id,
          event_name: 'child_profile_saved',
          properties_json: { child_id: child.id, age: child.age },
        },
      });

      return reply.status(201).send({
        id: child.id,
        user_id: child.user_id,
        name: child.name,
        age: child.age,
        interests: child.interests_json,
        appearance: child.appearance_json,
        is_active: child.is_active,
      });
    });

    api.patch('/children/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const { id } = req.params as { id: string };

      const existing = await prisma.childProfile.findUnique({ where: { id } });
      if (!existing || existing.user_id !== authUser.id) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'Профиль ребёнка не найден',
          request_id: req.id,
        });
      }

      const parsed = UpdateChildProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      const updated = await prisma.childProfile.update({
        where: { id },
        data: {
          name: parsed.data.name,
          age: parsed.data.age,
          interests_json: parsed.data.interests,
          appearance_json: parsed.data.appearance,
        },
      });

      return {
        id: updated.id,
        user_id: updated.user_id,
        name: updated.name,
        age: updated.age,
        interests: updated.interests_json,
        appearance: updated.appearance_json,
        is_active: updated.is_active,
      };
    });

    // ----------------------------------------------------
    // 4. Сказка дня (/daily-idea)
    // ----------------------------------------------------
    api.get('/daily-idea', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const { child_id } = req.query as { child_id: string };
      if (!child_id) {
        return reply.status(400).send({ code: 'BAD_REQUEST', message: 'child_id обязателен', request_id: req.id });
      }

      const today = new Date().toISOString().split('T')[0];
      let idea = await prisma.dailyIdea.findUnique({
        where: {
          child_id_local_date: { child_id, local_date: today },
        },
      });

      if (!idea) {
        const child = await prisma.childProfile.findUnique({ where: { id: child_id } });
        const childName = child?.name || 'Малыш';
        idea = await prisma.dailyIdea.create({
          data: {
            child_id,
            local_date: today,
            title: `${childName} и потерянная звёздочка`,
            blurb: `Добрая история о смелости, дружбе и о том, как даже самый маленький поступок зажигает свет в темноте.`,
            theme: 'Дружба и смелость',
            status: 'ACTIVE',
          },
        });
      }

      return idea;
    });

    api.post('/daily-idea/refresh', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const { child_id } = req.body as { child_id: string };
      const today = new Date().toISOString().split('T')[0];

      const child = await prisma.childProfile.findUnique({ where: { id: child_id } });
      const childName = child?.name || 'Малыш';

      const ideasPool = [
        {
          title: `${childName} и тайна сонного облачка`,
          blurb: 'Успокаивающая вечерняя сказка о том, как облачко искало самое уютное место для сна.',
          theme: 'Спокойный сон',
        },
        {
          title: `${childName} и маленький динозаврик Дино`,
          blurb: 'Весёлое приключение о взаимовыручке и строительстве волшебного мостика через ручей.',
          theme: 'Взаимопомощь',
        },
        {
          title: `${childName} и компас капитана ветра`,
          blurb: 'История о любознательности, исследовании природы и верности своему слову.',
          theme: 'Любознательность',
        },
      ];

      const randomIdea = ideasPool[Math.floor(Math.random() * ideasPool.length)];

      const updatedIdea = await prisma.dailyIdea.upsert({
        where: { child_id_local_date: { child_id, local_date: today } },
        create: {
          child_id,
          local_date: today,
          title: randomIdea.title,
          blurb: randomIdea.blurb,
          theme: randomIdea.theme,
          status: 'REFRESHED',
        },
        update: {
          title: randomIdea.title,
          blurb: randomIdea.blurb,
          theme: randomIdea.theme,
          status: 'REFRESHED',
        },
      });

      return updatedIdea;
    });

    // ----------------------------------------------------
    // 5. Создание сказок (/books/free и /books)
    // ----------------------------------------------------
    api.post('/books/free', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const parsed = CreateFreeBookSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      // Проверяем принадлежность ребенка
      const child = await prisma.childProfile.findUnique({ where: { id: parsed.data.child_id } });
      if (!child || child.user_id !== authUser.id) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Профиль ребёнка не найден', request_id: req.id });
      }

      try {
        // Атомарное резервирование права на бесплатную книгу
        await CreditsService.claimFreeStory(authUser.id);
      } catch (err: any) {
        return reply.status(403).send({
          code: 'FREE_STORY_ALREADY_CLAIMED',
          message: err.message,
          request_id: req.id,
        });
      }

      // Создаем текстовую книгу со статусом DRAFT
      const book = await prisma.book.create({
        data: {
          user_id: authUser.id,
          child_id: child.id,
          title: `Сказка для ${child.name}`,
          theme: parsed.data.theme,
          format: 'TEXT',
          status: 'DRAFT',
        },
      });

      // Ставим задачу генерации текста в очередь jobs
      const jobId = await JobsService.enqueue(book.id, 'GENERATE_TEXT');

      await prisma.event.create({
        data: {
          user_id: authUser.id,
          event_name: 'free_story_started',
          properties_json: { book_id: book.id, job_id: jobId },
        },
      });

      return reply.status(201).send({
        book_id: book.id,
        job_id: jobId,
        status: 'text_generating',
      });
    });

    api.post('/books', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const parsed = CreatePaidBookSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      const child = await prisma.childProfile.findUnique({ where: { id: parsed.data.child_id } });
      if (!child || child.user_id !== authUser.id) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Профиль ребёнка не найден', request_id: req.id });
      }

      // Создаем запись книги
      const book = await prisma.book.create({
        data: {
          user_id: authUser.id,
          child_id: child.id,
          title: `Иллюстрированная сказка для ${child.name}`,
          theme: parsed.data.theme,
          format: 'ILLUSTRATED',
          status: 'DRAFT',
        },
      });

      try {
        // Атомарно блокируем строку и резервируем 1 кредит
        await CreditsService.reserveCredit(authUser.id, book.id);
      } catch (err: any) {
        // Удаляем черновик книги, если кредитов не хватило
        await prisma.book.delete({ where: { id: book.id } });
        return reply.status(402).send({
          code: 'INSUFFICIENT_CREDITS',
          message: err.message,
          request_id: req.id,
        });
      }

      // Ставим задачу генерации текста и картинок
      const jobId = await JobsService.enqueue(book.id, 'GENERATE_TEXT');

      return reply.status(201).send({
        book_id: book.id,
        job_id: jobId,
        status: 'text_generating',
      });
    });

    api.post('/books/:id/upgrade', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const { id } = req.params as { id: string };

      const book = await prisma.book.findUnique({ where: { id } });
      if (!book || book.user_id !== authUser.id) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Книга не найдена', request_id: req.id });
      }

      if (book.format === 'ILLUSTRATED') {
        return reply.status(400).send({
          code: 'ALREADY_ILLUSTRATED',
          message: 'Книга уже содержит иллюстрации',
          request_id: req.id,
        });
      }

      try {
        // Резервируем 1 кредит на апгрейд
        await CreditsService.reserveCredit(authUser.id, book.id);
      } catch (err: any) {
        return reply.status(402).send({
          code: 'INSUFFICIENT_CREDITS',
          message: err.message,
          request_id: req.id,
        });
      }

      await prisma.book.update({
        where: { id: book.id },
        data: { format: 'ILLUSTRATED' },
      });

      // Ставим задачу генерации 5 картинок по зафиксированному тексту
      const jobId = await JobsService.enqueue(book.id, 'GENERATE_ILLUSTRATIONS');

      await prisma.event.create({
        data: {
          user_id: authUser.id,
          event_name: 'upgrade_offer_clicked',
          properties_json: { book_id: book.id, job_id: jobId },
        },
      });

      return reply.status(202).send({
        book_id: book.id,
        job_id: jobId,
        status: 'illustrations_queued',
      });
    });

    // ----------------------------------------------------
    // 6. Библиотека и просмотр сказок (/books)
    // ----------------------------------------------------
    api.get('/books', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;
      const { format } = req.query as { format?: string };

      const whereClause: any = { user_id: authUser.id };
      if (format && (format === 'TEXT' || format === 'ILLUSTRATED')) {
        whereClause.format = format;
      }

      const books = await prisma.book.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          child: { select: { name: true } },
          cover_asset: { select: { storage_key: true } },
        },
      });

      return books.map((b) => ({
        id: b.id,
        child_id: b.child_id,
        child_name: b.child.name,
        title: b.title,
        status: b.status,
        format: b.format,
        cover_url: b.cover_asset ? `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800` : null,
        created_at: b.created_at.toISOString(),
      }));
    });

    api.get('/books/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const { id } = req.params as { id: string };

      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          scenes: { orderBy: { scene_index: 'asc' }, include: { image_asset: true } },
          questions: { orderBy: { after_scene: 'asc' } },
        },
      });

      if (!book) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Книга не найдена', request_id: req.id });
      }

      // Ownership check (Раздел 12 ТЗ)
      if (book.user_id !== authUser.id) {
        return reply.status(403).send({
          code: 'FORBIDDEN',
          message: 'Доступ к чужой книге запрещён',
          request_id: req.id,
        });
      }

      return {
        id: book.id,
        title: book.title,
        status: book.status,
        format: book.format,
        can_upgrade: book.format === 'TEXT' && book.status === 'TEXT_READY',
        scenes: book.scenes.map((s) => ({
          scene_index: s.scene_index,
          text: s.text,
          image_url: s.image_asset ? `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800` : null,
        })),
        questions: book.questions.map((q) => ({
          after_scene: q.after_scene,
          question: q.question,
          parent_hint: q.parent_hint,
          skill_tag: q.skill_tag,
        })),
      };
    });

    // ----------------------------------------------------
    // 7. Статус фоновой задачи (/jobs/:id)
    // ----------------------------------------------------
    api.get('/jobs/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const { id } = req.params as { id: string };

      try {
        return await JobsService.getJobStatus(id, authUser.id);
      } catch (err: any) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: err.message,
          request_id: req.id,
        });
      }
    });

    // ----------------------------------------------------
    // 8. Магазин и заказы Telegram Stars (/catalog, /orders, /telegram/webhook)
    // ----------------------------------------------------
    api.get('/catalog', async () => {
      return [
        {
          sku: 'single_book_1',
          title: 'Одна сказка',
          description: 'Для одного волшебного вечера',
          credits: 1,
          stars_amount: config.STARS_PRICE_SINGLE_BOOK,
          rub_reference_amount: config.RUB_REF_SINGLE_BOOK,
          discount_percent: 0,
        },
        {
          sku: 'pack_5',
          title: 'Выгодный набор: Пять сказок',
          description: 'Создавайте истории, когда захотите',
          credits: 5,
          stars_amount: config.STARS_PRICE_PACK_5,
          rub_reference_amount: config.RUB_REF_PACK_5,
          discount_percent: 20,
        },
      ];
    });

    api.post('/orders', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const authUser = (req as any).user;
      const parsed = CreateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      const orderData = await OrdersService.createOrder(authUser.id, parsed.data.sku, parsed.data.idempotency_key);
      return reply.status(201).send(orderData);
    });

    api.post('/telegram/webhook', async (req: FastifyRequest) => {
      return await OrdersService.handleTelegramWebhook(req.body);
    });

    // ----------------------------------------------------
    // 9. История баланса и рефералы (/credits, /referrals/me)
    // ----------------------------------------------------
    api.get('/credits', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;
      const ledger = await prisma.creditLedger.findMany({
        where: { user_id: authUser.id },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      return ledger.map((entry) => ({
        id: entry.id,
        source_type: entry.source_type,
        delta: entry.delta,
        reason: entry.reason,
        created_at: entry.created_at.toISOString(),
      }));
    });

    api.get('/referrals/me', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;

      const friendsCount = await prisma.referral.count({
        where: { inviter_id: authUser.id, qualifying_order_id: { not: null } },
      });

      const giftCredits = await prisma.referralReward.count({
        where: { referral: { inviter_id: authUser.id }, status: 'AWARDED' },
      });

      return {
        referral_link: `https://t.me/${config.TELEGRAM_BOT_USERNAME}?startapp=ref_${authUser.id}`,
        qualified_friends_count: friendsCount,
        gift_credits_earned: giftCredits,
      };
    });

    // ----------------------------------------------------
    // 10. Удаление аккаунта и данных (152-ФЗ / GDPR)
    // ----------------------------------------------------
    api.post('/privacy/delete', { preHandler: [authenticate] }, async (req: FastifyRequest) => {
      const authUser = (req as any).user;

      // Каскадно очищаем все данные пользователя
      await prisma.$transaction(async (tx) => {
        await tx.childProfile.deleteMany({ where: { user_id: authUser.id } });
        await tx.book.deleteMany({ where: { user_id: authUser.id } });
        await tx.order.deleteMany({ where: { user_id: authUser.id } });
        await tx.creditLedger.deleteMany({ where: { user_id: authUser.id } });
        await tx.user.delete({ where: { id: authUser.id } });
      });

      return { ok: true, message: 'Все персональные данные успешно удалены' };
    });

    // ----------------------------------------------------
    // 11. Админ-панель (/admin/*)
    // ----------------------------------------------------
    api.get('/admin/orders', { preHandler: [authenticateAdmin] }, async () => {
      return await prisma.order.findMany({
        orderBy: { created_at: 'desc' },
        take: 100,
        include: { user: { select: { telegram_user_id: true, username: true } } },
      });
    });

    api.get('/admin/jobs', { preHandler: [authenticateAdmin] }, async () => {
      return await prisma.job.findMany({
        orderBy: { created_at: 'desc' },
        take: 100,
        include: { book: { select: { title: true, user_id: true } } },
      });
    });

    api.post('/admin/jobs/:id/retry', { preHandler: [authenticateAdmin] }, async (req: FastifyRequest) => {
      const { id } = req.params as { id: string };
      const authUser = (req as any).user;
      return await JobsService.retryJobByAdmin(id, authUser.id);
    });

    api.post('/admin/credits/adjust', { preHandler: [authenticateAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = AdminAdjustCreditsSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
          request_id: req.id,
        });
      }

      const authUser = (req as any).user;
      await CreditsService.adminAdjustBalance(
        parsed.data.user_id,
        parsed.data.delta,
        parsed.data.source_type,
        parsed.data.reason,
        authUser.id
      );

      return { ok: true, message: 'Баланс успешно скорректирован с записью в аудит' };
    });

    api.get('/admin/analytics', { preHandler: [authenticateAdmin] }, async () => {
      const totalUsers = await prisma.user.count();
      const freeClaimed = await prisma.user.count({ where: { free_text_claimed_at: { not: null } } });
      const totalOrders = await prisma.order.count({ where: { status: 'FULFILLED' } });
      const totalBooks = await prisma.book.count();

      const jobsStats = await prisma.job.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { provider_cost: true },
      });

      return {
        total_users: totalUsers,
        free_stories_claimed: freeClaimed,
        total_paid_orders: totalOrders,
        total_books: totalBooks,
        jobs_stats: jobsStats,
      };
    });
  },
  { prefix: '/api/v1' }
);

// Запуск сервера
export async function startServer() {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`[Fastify] Сервер запущен на http://${config.HOST}:${config.PORT}`);
    console.log(`[Fastify] Документация Swagger доступна на http://${config.HOST}:${config.PORT}/docs`);

    // Запускаем воркер фоновых задач в том же процессе для удобства локальной разработки
    if (config.JOB_WORKER_TYPE === 'db') {
      jobWorker.start();
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
