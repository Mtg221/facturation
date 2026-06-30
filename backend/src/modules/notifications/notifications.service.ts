import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TypeNotification } from '@prisma/client';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

interface CreateNotificationDto {
  userId: string;
  type: TypeNotification;
  titre: string;
  contenu: string;
  data?: Record<string, unknown>;
}

interface CreateForAllDto {
  type: TypeNotification;
  titre: string;
  contenu: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private gateway: { emitToUser?: (userId: string, notification: unknown) => void } = {};

  setGateway(gateway: { emitToUser: (userId: string, notification: unknown) => void }) {
    this.gateway = gateway;
  }

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({ data: dto as any });

    if (this.gateway.emitToUser) {
      this.gateway.emitToUser(dto.userId, notification);
    }

    return notification;
  }

  async createForAll(dto: CreateForAllDto) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    await this.prisma.notification.createMany({
      data: users.map((u) => ({ ...dto, userId: u.id })) as any,
    });
  }

  async findAll(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, lu: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { lu: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
    return { message: 'Toutes les notifications marquées comme lues' };
  }

  constructor(private readonly prisma: PrismaService) {}
}
