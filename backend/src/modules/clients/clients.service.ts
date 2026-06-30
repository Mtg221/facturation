import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientFilterDto } from './dto/client-filter.dto';
import { paginate, getValidatedSortOptions } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import * as fastCsv from 'fast-csv';
import { Readable } from 'stream';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filter: ClientFilterDto) {
    const { page = 1, limit = 20, search, secteurId, isActive, ville } = filter;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone1: { contains: search } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;
    if (ville) where.ville = { contains: ville, mode: 'insensitive' };
    if (secteurId) {
      where.secteurs = { some: { secteurId } };
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          secteurs: { include: { secteur: true } },
          _count: { select: { factures: true } },
        },
        orderBy: getValidatedSortOptions(filter),
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        secteurs: { include: { secteur: true } },
        _count: { select: { factures: true } },
      },
    });

    if (!client) throw new NotFoundException('Client introuvable');

    return client;
  }

  async create(dto: CreateClientDto, actorId: string) {
    const { secteurIds, ...clientData } = dto;

    const code = await this.generateClientCode();

    const client = await this.prisma.client.create({
      data: {
        ...clientData,
        code,
        secteurs: secteurIds?.length
          ? { create: secteurIds.map((secteurId) => ({ secteurId })) }
          : undefined,
      },
      include: { secteurs: { include: { secteur: true } } },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'CREATE',
      table: 'clients',
      entityId: client.id,
      nouvelleValeur: client,
    });

    return client;
  }

  async update(id: string, dto: UpdateClientDto, actorId: string) {
    const existing = await this.findOne(id);
    const { secteurIds, ...clientData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (secteurIds !== undefined) {
        await tx.clientSecteur.deleteMany({ where: { clientId: id } });

        if (secteurIds.length > 0) {
          await tx.clientSecteur.createMany({
            data: secteurIds.map((secteurId) => ({ clientId: id, secteurId })),
          });
        }
      }

      return tx.client.update({
        where: { id },
        data: clientData,
        include: { secteurs: { include: { secteur: true } } },
      });
    });

    await this.auditService.log({
      userId: actorId,
      action: 'UPDATE',
      table: 'clients',
      entityId: id,
      ancienneValeur: existing,
      nouvelleValeur: updated,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const client = await this.findOne(id);

    const openInvoices = await this.prisma.facture.count({
      where: {
        clientId: id,
        statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'] },
      },
    });

    if (openInvoices > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${openInvoices} facture(s) en cours pour ce client`,
      );
    }

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'DELETE',
      table: 'clients',
      entityId: id,
      ancienneValeur: client,
    });

    return { message: 'Client supprimé' };
  }

  async exportCsv(): Promise<Buffer> {
    const clients = await this.prisma.client.findMany({
      include: { secteurs: { include: { secteur: true } } },
      orderBy: { nom: 'asc' },
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fastCsv.format({ headers: true, delimiter: ';' });

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);

      clients.forEach((c) => {
        stream.write({
          Code: c.code,
          Nom: c.nom,
          Email: c.email ?? '',
          Telephone: c.telephone1 ?? '',
          Ville: c.ville ?? '',
          Pays: c.pays,
          NINEA: c.ninea ?? '',
          Secteurs: c.secteurs.map((cs) => cs.secteur.nom).join(', '),
          Actif: c.isActive ? 'Oui' : 'Non',
          'Créé le': c.createdAt.toLocaleDateString('fr-FR'),
        });
      });

      stream.end();
    });
  }

  private async generateClientCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CLI-${year}-`;

    // Use transaction with lock or find the max existing code
    const lastClient = await this.prisma.client.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastClient) {
      const parts = lastClient.code.split('-');
      nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
}
