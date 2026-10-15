import { prisma } from '@moya-skazka/database';
import { JobType } from '@moya-skazka/shared';

export class JobsService {
  /**
   * Постановка задачи в очередь jobs
   */
  public static async enqueue(bookId: string, type: JobType): Promise<string> {
    const job = await prisma.job.create({
      data: {
        book_id: bookId,
        type,
        status: 'PENDING',
        attempts: 0,
        max_attempts: 3,
      },
    });

    return job.id;
  }

  /**
   * Получение статуса задачи для клиента
   */
  public static async getJobStatus(jobId: string, userId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        book: {
          select: {
            id: true,
            user_id: true,
            status: true,
            title: true,
          },
        },
      },
    });

    if (!job) {
      throw new Error('Задача не найдена');
    }

    // Ownership check (Раздел 12 ТЗ)
    if (job.book.user_id !== userId) {
      throw new Error('Доступ запрещен: задача принадлежит другому пользователю');
    }

    let progressPercentage = 10;
    if (job.status === 'PROCESSING') {
      progressPercentage = job.type === 'GENERATE_TEXT' ? 50 : 75;
    } else if (job.status === 'COMPLETED') {
      progressPercentage = 100;
    }

    return {
      job_id: job.id,
      book_id: job.book_id,
      type: job.type,
      status: job.status,
      book_status: job.book.status,
      attempts: job.attempts,
      progress_percentage: progressPercentage,
      error: job.last_error,
    };
  }

  /**
   * Ручной перезапуск задачи администратором
   */
  public static async retryJobByAdmin(jobId: string, adminId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Задача не найдена');

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        attempts: 0,
        last_error: null,
        locked_at: null,
        locked_by: null,
      },
    });

    await prisma.event.create({
      data: {
        user_id: null,
        event_name: 'admin_job_retry',
        properties_json: { job_id: jobId, admin_id: adminId },
      },
    });

    return updated;
  }
}
