import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { FacturesService } from '../factures/factures.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class PaiementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facturesService: FacturesService,
    private readonly auditService: AuditService,
    private readonly pdfService: PdfService,
  ) {}

  async findAll(factureId?: string, pagination?: PaginationDto, societeId?: string | null) {
    const { page = 1, limit = 20 } = pagination ?? {};
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (factureId) where.factureId = factureId;
    if (societeId) where.societeId = societeId;

    const [data, total] = await Promise.all([
      this.prisma.paiement.findMany({
        where,
        skip,
        take: limit,
        include: {
          facture: { select: { numero: true, client: { select: { nom: true } } } },
          user: { select: { nom: true, prenom: true } },
        },
        orderBy: { datePaiement: 'desc' },
      }),
      this.prisma.paiement.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string, societeId?: string | null) {
    const paiement = await this.prisma.paiement.findFirst({
      where: { id, ...(societeId ? { societeId } : {}) },
      include: {
        facture: {
          include: {
            client: true,
            details: { orderBy: { ordre: 'asc' } },
          },
        },
        user: { select: { nom: true, prenom: true } },
      },
    });

    if (!paiement) throw new NotFoundException('Paiement introuvable');

    return paiement;
  }

  async create(dto: CreatePaiementDto, userId: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: dto.factureId },
    });

    if (!facture) throw new NotFoundException('Facture introuvable');

    if (facture.statut === 'PAYEE' || facture.statut === 'ANNULEE') {
      throw new BadRequestException(
        `La facture est déjà ${facture.statut === 'PAYEE' ? 'payée' : 'annulée'}`,
      );
    }

    const montant = new Decimal(dto.montant);
    if (montant.gt(facture.resteAPayer)) {
      throw new BadRequestException(
        `Le montant (${dto.montant}) dépasse le reste à payer (${facture.resteAPayer})`,
      );
    }

    const paiement = await this.prisma.paiement.create({
      data: {
        factureId: dto.factureId,
        userId,
        ...(facture.societeId ? { societeId: facture.societeId } : {}),
        montant: dto.montant,
        mode: dto.mode,
        datePaiement: dto.datePaiement ? new Date(dto.datePaiement) : new Date(),
        numeroCheque: dto.numeroCheque,
        banque: dto.banque,
        reference: dto.reference,
        commentaire: dto.commentaire,
        recuPar: dto.recuPar,
        payePar: dto.payePar,
      },
      include: { facture: { include: { client: true } }, user: true },
    });

    await this.facturesService.updateStatutAfterPayment(dto.factureId);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      table: 'paiements',
      entityId: paiement.id,
      nouvelleValeur: { montant: dto.montant, mode: dto.mode, factureId: dto.factureId },
    });

    return paiement;
  }

  async remove(id: string, userId: string, societeId?: string | null) {
    const paiement = await this.findOne(id, societeId);

    await this.prisma.paiement.delete({ where: { id } });

    await this.facturesService.updateStatutAfterPayment(paiement.factureId);

    await this.auditService.log({
      userId,
      action: 'DELETE',
      table: 'paiements',
      entityId: id,
      ancienneValeur: { montant: paiement.montant, factureId: paiement.factureId },
    });

    return { message: 'Paiement annulé' };
  }

  async getRecu(id: string, societeId: string | null = null): Promise<Buffer> {
    const paiement = await this.findOne(id, societeId);
    return this.pdfService.generateRecuPdf(paiement, societeId);
  }
}
