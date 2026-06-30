import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacturesNumberService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async generateNextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const key = `facture_counter:${year}`;

    const exists = await this.redis.exists(key);

    if (!exists) {
      // Seed from DB max for this year
      const lastFacture = await this.prisma.facture.findFirst({
        where: { numero: { startsWith: `FACT-${year}-` } },
        orderBy: { numero: 'desc' },
        // bypass soft-delete middleware since this is an internal query
      });

      let startValue = 0;
      if (lastFacture) {
        const parts = lastFacture.numero.split('-');
        startValue = parseInt(parts[parts.length - 1], 10) || 0;
      }

      await this.redis.set(key, String(startValue));
      await this.redis.expire(key, 366 * 24 * 3600); // 1 year TTL
    }

    const next = await this.redis.incr(key);
    return `FACT-${year}-${String(next).padStart(5, '0')}`;
  }
}
