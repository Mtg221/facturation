import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, paginate, getValidatedSortOptions } from '../../common/dto/pagination.dto';
import { hashPassword } from '../../common/utils/bcrypt.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(pagination: PaginationDto, societeId?: string | null) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const base: Record<string, unknown> = {};
    if (societeId) base.societeId = societeId;

    const where = search
      ? {
          ...base,
          OR: [
            { nom: { contains: search, mode: 'insensitive' as const } },
            { prenom: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : base;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          telephone: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: getValidatedSortOptions(pagination),
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        avatar: true,
        telephone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return user;
  }

  async create(dto: CreateUserDto, actorId: string, societeId?: string | null) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) throw new ConflictException('Un compte avec cet email existe déjà');

    const hashedPassword = await hashPassword(dto.motDePasse);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        email: dto.email.toLowerCase(),
        motDePasse: hashedPassword,
        ...(societeId ? { societeId } : {}),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        telephone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'CREATE',
      table: 'users',
      entityId: user.id,
      nouvelleValeur: user,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        telephone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'UPDATE',
      table: 'users',
      entityId: id,
      ancienneValeur: existing,
      nouvelleValeur: updated,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }

    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'DELETE',
      table: 'users',
      entityId: id,
    });

    return { message: 'Utilisateur supprimé' };
  }
}
