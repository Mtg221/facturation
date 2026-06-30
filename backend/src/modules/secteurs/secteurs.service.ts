import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SecteursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 50, search } = pagination;
    const skip = (page - 1) * limit;

    const where = search
      ? { nom: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.secteursActivite.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { clients: true } } },
        orderBy: { nom: 'asc' },
      }),
      this.prisma.secteursActivite.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const secteur = await this.prisma.secteursActivite.findUnique({
      where: { id },
      include: { _count: { select: { clients: true } } },
    });

    if (!secteur) throw new NotFoundException('Secteur introuvable');

    return secteur;
  }

  async create(dto: CreateSecteurDto) {
    return this.prisma.secteursActivite.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateSecteurDto>) {
    await this.findOne(id);
    return this.prisma.secteursActivite.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.secteursActivite.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Secteur supprimé' };
  }
}
