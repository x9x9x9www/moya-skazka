import { z } from 'zod';

// ========================================================
// Защита от инъекций и ограничение длины полей (Раздел 15 ТЗ)
// ========================================================
const safeText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Минимум ${min} символов`)
    .max(max, `Максимум ${max} символов`)
    .regex(/^[^<>{}[\]\\/`]+$/, 'Текст содержит недопустимые спецсимволы');

// 1. Авторизация
export const TelegramAuthSchema = z.object({
  init_data: z.string().min(1, 'init_data обязательна'),
  start_param: z.string().max(64).optional().nullable(),
});

// 2. Профиль ребенка
export const ChildAppearanceSchema = z.object({
  avatar_id: z.string().default('boy_1'),
  hair: z.string().max(50).optional(),
  clothing: z.string().max(50).optional(),
  personality: z.string().max(50).optional(),
});

export const CreateChildProfileSchema = z.object({
  name: safeText(2, 50),
  age: z.number().int().min(2, 'Возраст от 2 лет').max(6, 'Возраст до 6 лет'),
  interests: z.array(z.string().max(30)).min(1, 'Выберите хотя бы один интерес').max(6),
  appearance: ChildAppearanceSchema,
});

export const UpdateChildProfileSchema = CreateChildProfileSchema.partial();

// 3. Создание книг
export const CreateFreeBookSchema = z.object({
  child_id: z.string().uuid(),
  theme: z.string().max(100),
  interests: z.array(z.string().max(30)).min(1).max(6),
  custom_wishes: z.string().max(200).optional().nullable(),
  include_questions: z.boolean().default(true),
});

export const CreatePaidBookSchema = z.object({
  child_id: z.string().uuid(),
  theme: z.string().max(100),
  interests: z.array(z.string().max(30)).min(1).max(6),
  custom_wishes: z.string().max(200).optional().nullable(),
  include_questions: z.boolean().default(true),
});

// 4. Заказ и оплата
export const CreateOrderSchema = z.object({
  sku: z.enum(['single_book_1', 'pack_5']),
  idempotency_key: z.string().min(8).max(128),
});

// 5. Админ: корректировка баланса
export const AdminAdjustCreditsSchema = z.object({
  user_id: z.string().uuid(),
  delta: z.number().int().refine((d) => d !== 0, 'Дельта не может быть нулевой'),
  source_type: z.enum(['paid', 'gift', 'admin_adjustment']),
  reason: z.string().min(5, 'Причина корректировки обязательна для аудита').max(255),
});

// 6. Валидация ответа AI
export const AIStoryResponseSchema = z.object({
  title: z.string().min(3).max(200),
  age: z.number().int().min(2).max(6),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      visual_description: z.string(),
    })
  ),
  story_outline: z.string(),
  scenes: z.array(
    z.object({
      index: z.number().int().min(1).max(4),
      text: z.string().min(20),
      image_prompt: z.string().min(10),
    })
  ).length(4, 'Сказка должна состоять строго из 4 сцен'),
  questions: z.array(
    z.object({
      after_scene: z.number().int().refine((v) => [2, 4, 5].includes(v), 'Вопросы допустимы после 2, 4 сцены или в финале (5)'),
      question: z.string().min(5),
      parent_hint: z.string().optional().nullable(),
      skill_tag: z.string(),
    })
  ).min(2).max(3),
});
