import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

interface CreateAuditLogDto {
  userId?: string;
  action: string;
  table: string;
  entityId?: string;
  ancienneValeur?: unknown;
  nouvelleValeur?: unknown;
  adresseIP?: string;
  navigateur?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogDto) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          table: data.table,
          entityId: data.entityId,
          ancienneValeur: data.ancienneValeur ? JSON.parse(JSON.stringify(data.ancienneValeur)) : undefined,
          nouvelleValeur: data.nouvelleValeur ? JSON.parse(JSON.stringify(data.nouvelleValeur)) : undefined,
          adresseIP: data.adresseIP,
          navigateur: data.navigateur,
        },
      });
    } catch {
      // Audit failures must never break the main flow
    }
  }

  async findAll(pagination: PaginationDto, table?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = table ? { table } : {};

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { nom: true, prenom: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }
}
