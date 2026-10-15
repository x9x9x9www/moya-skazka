import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Global singleton for Prisma Client
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Хелпер для выполнения транзакций со строгой блокировкой строк (SELECT ... FOR UPDATE)
 */
export async function withRowLock<T>(
  tableName: string,
  id: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Выполняем блокировку строки в PostgreSQL
    await tx.$executeRawUnsafe(
      `SELECT id FROM "${tableName}" WHERE id = $1::uuid FOR UPDATE`,
      id
    );
    return await callback(tx as unknown as PrismaClient);
  });
}
