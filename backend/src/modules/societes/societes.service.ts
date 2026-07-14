import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateSocieteDto } from './dto/create-societe.dto';
import { UpdateSocieteDto } from './dto/update-societe.dto';
import { CreateSocieteAdminDto } from './dto/create-societe-admin.dto';
import { hashPassword } from '../../common/utils/bcrypt.util';
import * as crypto from 'crypto';

@Injectable()
export class SocietesService {
  private readonly logger = new Logger(SocietesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.societe.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { users: true, factures: true, clients: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const societe = await this.prisma.societe.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { users: true, factures: true, clients: true, produits: true },
        },
      },
    });
    if (!societe) throw new NotFoundException('Société introuvable');
    return societe;
  }

  async create(dto: CreateSocieteDto) {
    return this.prisma.societe.create({ data: dto });
  }

  async update(id: string, dto: UpdateSocieteDto) {
    await this.findOne(id);
    return this.prisma.societe.update({ where: { id }, data: dto });
  }

  async updateMySociete(societeId: string, dto: UpdateSocieteDto) {
    const societe = await this.prisma.societe.findFirst({ where: { id: societeId, deletedAt: null } });
    if (!societe) throw new NotFoundException('Société introuvable');
    return this.prisma.societe.update({ where: { id: societeId }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.societe.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Société désactivée' };
  }

  async createAdmin(societeId: string, dto: CreateSocieteAdminDto) {
    await this.findOne(societeId);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Un compte avec cet email existe déjà');

    const tempPassword = await hashPassword(crypto.randomBytes(32).toString('hex'));
    const passwordSetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        nom: dto.nom,
        prenom: dto.prenom,
        motDePasse: tempPassword,
        role: 'ADMIN',
        societeId,
        isActive: true,
        emailVerified: true,
        passwordSetToken,
        passwordSetTokenExpiry: tokenExpiry,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        societeId: true,
        createdAt: true,
      },
    });

    // Envoi de l'email de définition de mot de passe (non bloquant)
    this.mailService.sendSetPasswordEmail(
      dto.email.toLowerCase(),
      dto.prenom,
      passwordSetToken,
    ).catch((err) => {
      this.logger.error(
        `Échec de l'envoi du mail de définition de mot de passe à ${dto.email}: ${err.message}`,
      );
    });

    return user;
  }

  async getSocieteUsers(societeId: string) {
    await this.findOne(societeId);
    return this.prisma.user.findMany({
      where: { societeId, deletedAt: null },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSocieteStats(societeId: string) {
    await this.findOne(societeId);

    const [factures, clients, users, chiffre] = await Promise.all([
      this.prisma.facture.count({ where: { societeId, deletedAt: null } }),
      this.prisma.client.count({ where: { societeId, deletedAt: null } }),
      this.prisma.user.count({ where: { societeId, deletedAt: null } }),
      this.prisma.facture.aggregate({
        where: { societeId, deletedAt: null, statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] } },
        _sum: { montantPaye: true },
      }),
    ]);

    return {
      factures,
      clients,
      users,
      chiffreAffaires: chiffre._sum.montantPaye ?? 0,
    };
  }

  async getPlatformStats() {
    const [societes, users, factures, chiffre] = await Promise.all([
      this.prisma.societe.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, role: { not: 'SUPERADMIN' } } }),
      this.prisma.facture.count({ where: { deletedAt: null } }),
      this.prisma.facture.aggregate({
        where: { deletedAt: null, statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] } },
        _sum: { montantPaye: true },
      }),
    ]);

    return {
      societes,
      users,
      factures,
      chiffreAffairesTotal: chiffre._sum.montantPaye ?? 0,
    };
  }
}
