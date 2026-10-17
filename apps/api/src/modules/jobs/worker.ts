import { prisma } from '@moya-skazka/database';
import { GeminiAIProvider } from '../../services/ai/gemini.ai.provider';
import { MockAIProvider } from '../../services/ai/mock.ai.provider';
import { WellflowAIProvider } from '../../services/ai/wellflow.ai.provider';
import { config } from '../../config/index';
import { CreditsService } from '../credits/credits.service';

const textProvider =
  config.AI_TEXT_PROVIDER === 'wellflow'
    ? new WellflowAIProvider()
    : config.AI_TEXT_PROVIDER === 'gemini'
    ? new GeminiAIProvider()
    : new MockAIProvider();

const imageProvider =
  config.AI_IMAGE_PROVIDER === 'wellflow'
    ? new WellflowAIProvider()
    : config.AI_IMAGE_PROVIDER === 'gemini'
    ? new GeminiAIProvider()
    : new MockAIProvider();

const workerId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;

export class JobWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[JobWorker] Воркер ${workerId} запущен (poll interval: ${config.JOB_POLL_INTERVAL_MS}ms)`);
    this.scheduleNextTick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
    console.log(`[JobWorker] Воркер ${workerId} остановлен`);
  }

  private scheduleNextTick() {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      try {
        await this.processNextJob();
      } catch (err) {
        console.error('[JobWorker] Ошибка цикла обработки:', err);
      } finally {
        this.scheduleNextTick();
      }
    }, config.JOB_POLL_INTERVAL_MS);
  }

  /**
   * Атомарная блокировка следующей свободной задачи: SELECT ... FOR UPDATE SKIP LOCKED
   */
  public async processNextJob(): Promise<boolean> {
    const candidate = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT "id" FROM "jobs"
         WHERE "status" IN ('PENDING', 'FAILED_RETRYABLE')
           AND ("locked_at" IS NULL OR "locked_at" < NOW() - INTERVAL '5 minutes')
         ORDER BY "created_at" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`
      );

      if (!rows || rows.length === 0) return null;

      const jobId = rows[0].id;

      // Помечаем задачу как взятую в обработку
      const lockedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          locked_at: new Date(),
          locked_by: workerId,
          attempts: { increment: 1 },
        },
        include: {
          book: {
            include: {
              child: true,
              scenes: true,
            },
          },
        },
      });

      return lockedJob;
    });

    if (!candidate) return false;

    console.log(`[JobWorker] Обработка задачи ${candidate.id} (тип: ${candidate.type}, попытка: ${candidate.attempts})`);

    try {
      if (candidate.type === 'GENERATE_TEXT') {
        await this.handleGenerateText(candidate);
      } else if (candidate.type === 'GENERATE_ILLUSTRATIONS') {
        await this.handleGenerateIllustrations(candidate);
      }

      // Успешное завершение задачи
      await prisma.job.update({
        where: { id: candidate.id },
        data: {
          status: 'COMPLETED',
          locked_at: null,
          locked_by: null,
        },
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'Неизвестная ошибка генерации';
      console.error(`[JobWorker] Сбой задачи ${candidate.id}:`, errorMessage);

      const isFinal = candidate.attempts >= candidate.max_attempts;

      await prisma.job.update({
        where: { id: candidate.id },
        data: {
          status: isFinal ? 'FAILED_FINAL' : 'FAILED_RETRYABLE',
          last_error: errorMessage,
          locked_at: null,
          locked_by: null,
        },
      });

      if (isFinal) {
        // Переводим книгу в FAILED_FINAL и автоматически возвращаем зарезервированный кредит!
        await prisma.book.update({
          where: { id: candidate.book_id },
          data: { status: 'FAILED_FINAL' },
        });

        await CreditsService.releaseReservation(candidate.book_id, errorMessage);

        await prisma.event.create({
          data: {
            user_id: candidate.book.user_id,
            event_name: 'book_generation_failed',
            properties_json: { book_id: candidate.book_id, error: errorMessage },
          },
        });
      }

      return false;
    }
  }

  /**
   * Обработка генерации текста сказки и вопросов
   */
  private async handleGenerateText(job: any) {
    const { book } = job;
    const { child } = book;

    await prisma.book.update({
      where: { id: book.id },
      data: { status: 'TEXT_GENERATING' },
    });

    const story = await textProvider.generateStory({
      childName: child.name,
      age: child.age,
      interests: (child.interests_json as string[]) || ['волшебство'],
      theme: book.theme,
      appearance: child.appearance_json as any,
      includeQuestions: true,
    });

    // Сохраняем в транзакции: обновляем книгу, создаем 4 сцены и вопросы
    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: book.id },
        data: {
          title: story.title,
          character_bible_json: story.characters as any,
          story_outline_json: story.story_outline as any,
          status: book.format === 'TEXT' ? 'TEXT_READY' : 'ILLUSTRATIONS_QUEUED',
        },
      });

      // Удаляем старые сцены при повторной попытке
      await tx.bookScene.deleteMany({ where: { book_id: book.id } });
      for (const scene of story.scenes) {
        await tx.bookScene.create({
          data: {
            book_id: book.id,
            scene_index: scene.index,
            text: scene.text,
            image_prompt: scene.image_prompt,
          },
        });
      }

      // Сохраняем педагогические вопросы
      await tx.bookQuestion.deleteMany({ where: { book_id: book.id } });
      for (const q of story.questions) {
        await tx.bookQuestion.create({
          data: {
            book_id: book.id,
            after_scene: q.after_scene,
            question: q.question,
            parent_hint: q.parent_hint,
            skill_tag: q.skill_tag,
          },
        });
      }
    });

    // Если книга иллюстрированная — ставим задачу на генерацию картинок
    if (book.format === 'ILLUSTRATED') {
      await prisma.job.create({
        data: {
          book_id: book.id,
          type: 'GENERATE_ILLUSTRATIONS',
          status: 'PENDING',
        },
      });
    }

    // Учитываем затраты провайдера
    await prisma.job.update({
      where: { id: job.id },
      data: { provider_cost: story.estimatedCost },
    });
  }

  /**
   * Обработка генерации обложки и 4 иллюстраций
   */
  private async handleGenerateIllustrations(job: any) {
    const { book } = job;

    await prisma.book.update({
      where: { id: book.id },
      data: { status: 'ILLUSTRATING' },
    });

    const scenes = await prisma.bookScene.findMany({
      where: { book_id: book.id },
      orderBy: { scene_index: 'asc' },
    });

    let totalCost = 0;

    // 1. Генерация обложки
    const coverPrompt = `Fairytale book cover: ${book.title}. Warm enchanting style, highly detailed.`;
    const coverImg = await imageProvider.generateImage({
      prompt: coverPrompt,
      type: 'cover',
      characterBible: JSON.stringify(book.character_bible_json),
    });
    totalCost += coverImg.generationCost;

    const coverAsset = await prisma.asset.create({
      data: {
        owner_id: book.user_id,
        storage_key: coverImg.storageKey,
        type: 'COVER',
        status: 'READY',
        generation_cost: coverImg.generationCost,
      },
    });

    await prisma.book.update({
      where: { id: book.id },
      data: { cover_asset_id: coverAsset.id },
    });

    // 2. Генерация 4 иллюстраций для сцен
    for (const scene of scenes) {
      const sceneImg = await imageProvider.generateImage({
        prompt: scene.image_prompt,
        type: 'scene',
        characterBible: JSON.stringify(book.character_bible_json),
        sceneIndex: scene.scene_index,
      });
      totalCost += sceneImg.generationCost;

      const sceneAsset = await prisma.asset.create({
        data: {
          owner_id: book.user_id,
          storage_key: sceneImg.storageKey,
          type: 'SCENE',
          status: 'READY',
          generation_cost: sceneImg.generationCost,
        },
      });

      await prisma.bookScene.update({
        where: { id: scene.id },
        data: { image_asset_id: sceneAsset.id },
      });
    }

    // 3. Финализация книги: статус ILLUSTRATED и списание резерва кредита
    await prisma.book.update({
      where: { id: book.id },
      data: { status: 'ILLUSTRATED' },
    });

    await CreditsService.consumeReservation(book.id);

    await prisma.job.update({
      where: { id: job.id },
      data: { provider_cost: totalCost },
    });

    await prisma.event.create({
      data: {
        user_id: book.user_id,
        event_name: 'book_generation_completed',
        properties_json: { book_id: book.id, total_cost: totalCost },
      },
    });
  }
}

export const jobWorker = new JobWorker();
