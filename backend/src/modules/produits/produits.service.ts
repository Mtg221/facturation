import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProduitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { designation: { contains: search, mode: 'insensitive' as const } },
            { reference: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.produit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { designation: 'asc' },
      }),
      this.prisma.produit.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const produit = await this.prisma.produit.findUnique({ where: { id } });
    if (!produit) throw new NotFoundException('Produit introuvable');
    return produit;
  }

  async create(dto: CreateProduitDto, actorId: string) {
    const produit = await this.prisma.produit.create({ data: dto });

    await this.auditService.log({
      userId: actorId,
      action: 'CREATE',
      table: 'produits',
      entityId: produit.id,
      nouvelleValeur: produit,
    });

    return produit;
  }

  async update(id: string, dto: Partial<CreateProduitDto>, actorId: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.produit.update({ where: { id }, data: dto });

    await this.auditService.log({
      userId: actorId,
      action: 'UPDATE',
      table: 'produits',
      entityId: id,
      ancienneValeur: existing,
      nouvelleValeur: updated,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.findOne(id);

    await this.prisma.produit.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'DELETE',
      table: 'produits',
      entityId: id,
      ancienneValeur: existing,
    });

    return { message: 'Produit supprimé' };
  }
}
