import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditsService } from '../src/modules/credits/credits.service';
import { prisma } from '@moya-skazka/database';

describe('CreditsService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserBalance logic (FIFO priority: GIFT before PAID)', () => {
    it('exhausts gift credits first when SPEND entries occur', async () => {
      const mockLedger = [
        { source_type: 'PAID', delta: 5, created_at: new Date('2026-01-01T10:00:00Z') },
        { source_type: 'GIFT', delta: 1, created_at: new Date('2026-01-01T11:00:00Z') },
        { source_type: 'SPEND', delta: -1, created_at: new Date('2026-01-01T12:00:00Z') },
      ];

      vi.spyOn(prisma.creditLedger, 'findMany').mockResolvedValue(mockLedger as any);
      vi.spyOn(prisma.creditReservation, 'count').mockResolvedValue(0);

      const balance = await CreditsService.getUserBalance('user-123');

      // 1 gift should be consumed first, paid should remain 5
      expect(balance.gift).toBe(0);
      expect(balance.paid).toBe(5);
      expect(balance.total).toBe(5);
      expect(balance.available).toBe(5);
    });

    it('correctly deducts from paid when gift is insufficient', async () => {
      const mockLedger = [
        { source_type: 'PAID', delta: 5, created_at: new Date('2026-01-01T10:00:00Z') },
        { source_type: 'GIFT', delta: 1, created_at: new Date('2026-01-01T11:00:00Z') },
        { source_type: 'SPEND', delta: -2, created_at: new Date('2026-01-01T12:00:00Z') },
      ];

      vi.spyOn(prisma.creditLedger, 'findMany').mockResolvedValue(mockLedger as any);
      vi.spyOn(prisma.creditReservation, 'count').mockResolvedValue(0);

      const balance = await CreditsService.getUserBalance('user-123');

      // 1 gift consumed, 1 paid consumed -> gift: 0, paid: 4, total: 4
      expect(balance.gift).toBe(0);
      expect(balance.paid).toBe(4);
      expect(balance.total).toBe(4);
      expect(balance.available).toBe(4);
    });

    it('accounts for active reservations in available balance', async () => {
      const mockLedger = [
        { source_type: 'PAID', delta: 3, created_at: new Date('2026-01-01T10:00:00Z') },
      ];

      vi.spyOn(prisma.creditLedger, 'findMany').mockResolvedValue(mockLedger as any);
      vi.spyOn(prisma.creditReservation, 'count').mockResolvedValue(1);

      const balance = await CreditsService.getUserBalance('user-123');

      expect(balance.total).toBe(3);
      expect(balance.reserved).toBe(1);
      expect(balance.available).toBe(2);
    });
  });
});
