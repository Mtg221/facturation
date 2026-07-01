import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacturesNumberService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async generateNextNumber(societeId?: string | null): Promise<string> {
    const year = new Date().getFullYear();
    const scope = societeId ?? 'global';
    const key = `facture_counter:${scope}:${year}`;

    const exists = await this.redis.exists(key);

    if (!exists) {
      const lastFacture = await this.prisma.facture.findFirst({
        where: {
          numero: { startsWith: `FACT-${year}-` },
          ...(societeId ? { societeId } : {}),
        },
        orderBy: { numero: 'desc' },
      });

      let startValue = 0;
      if (lastFacture) {
        const parts = lastFacture.numero.split('-');
        startValue = parseInt(parts[parts.length - 1], 10) || 0;
      }

      await this.redis.set(key, String(startValue));
      await this.redis.expire(key, 366 * 24 * 3600);
    }

    const next = await this.redis.incr(key);
    return `FACT-${year}-${String(next).padStart(5, '0')}`;
  }
}
