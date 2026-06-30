import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFactureDto, DetailFactureDto } from './dto/create-facture.dto';
import { FactureFilterDto } from './dto/facture-filter.dto';
import { paginate, getValidatedSortOptions } from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { FacturesNumberService } from './factures-number.service';
import { numberToWords } from '../../common/utils/number-to-words.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FacturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly numberService: FacturesNumberService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(filter: FactureFilterDto) {
    const { page = 1, limit = 20, search, clientId, statut, dateDebut, dateFin } = filter;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { client: { nom: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (clientId) where.clientId = clientId;
    if (statut) where.statut = statut;
    if (dateDebut || dateFin) {
      where.dateEmission = {
        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
        ...(dateFin ? { lte: new Date(dateFin) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.facture.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { id: true, nom: true, code: true } },
          user: { select: { id: true, nom: true, prenom: true } },
          _count: { select: { paiements: true } },
        },
        orderBy: getValidatedSortOptions(filter),
      }),
      this.prisma.facture.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id },
      include: {
        client: { include: { secteurs: { include: { secteur: true } } } },
        user: { select: { id: true, nom: true, prenom: true } },
        details: { include: { produit: true }, orderBy: { ordre: 'asc' } },
        paiements: { include: { user: { select: { nom: true, prenom: true } } }, orderBy: { datePaiement: 'desc' } },
      },
    });

    if (!facture) throw new NotFoundException('Facture introuvable');

    return facture;
  }

  async create(dto: CreateFactureDto, userId: string) {
    const { details, ...factureData } = dto;

    if (!details || details.length === 0) {
      throw new BadRequestException('La facture doit contenir au moins une ligne');
    }

    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Client introuvable');

    const numero = await this.numberService.generateNextNumber();
    const calculatedDetails = this.calculateDetails(details);
    const totals = this.calculateTotals(calculatedDetails, dto.remiseGlobale ?? 0);
    const montantEnLettres = numberToWords(Number(totals.montantTTC));

    const facture = await this.prisma.facture.create({
      data: {
        ...factureData,
        dateEmission: dto.dateEmission ? new Date(dto.dateEmission) : new Date(),
        dateEcheance: new Date(dto.dateEcheance),
        numero,
        userId,
        ...totals,
        resteAPayer: totals.montantTTC,
        montantEnLettres,
        details: {
          create: calculatedDetails.map((d, idx) => ({
            ...d,
            ordre: d.ordre ?? idx,
          })),
        },
      },
      include: {
        client: true,
        details: { orderBy: { ordre: 'asc' } },
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      table: 'factures',
      entityId: facture.id,
      nouvelleValeur: { numero: facture.numero, montantTTC: facture.montantTTC },
    });

    // Notify all users (simplified — in production filter by role)
    try {
      await this.notificationsService.createForAll({
        type: 'FACTURE_CREEE',
        titre: 'Nouvelle facture créée',
        contenu: `Facture ${numero} pour ${client.nom} : ${totals.montantTTC} FCFA`,
        data: { factureId: facture.id },
      });
    } catch { /* notifications non-blocking */ }

    return facture;
  }

  async update(id: string, dto: Partial<CreateFactureDto>, userId: string) {
    const existing = await this.findOne(id);

    if (existing.statut !== 'BROUILLON') {
      throw new BadRequestException(
        'Seules les factures en brouillon peuvent être modifiées',
      );
    }

    const { details, ...factureData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (details) {
        await tx.detailFacture.deleteMany({ where: { factureId: id } });

        const calculatedDetails = this.calculateDetails(details);
        const totals = this.calculateTotals(calculatedDetails, factureData.remiseGlobale ?? Number(existing.remiseGlobale));
        const montantEnLettres = numberToWords(Number(totals.montantTTC));

        const updated = await tx.facture.update({
          where: { id },
          data: {
            ...factureData,
            dateEcheance: factureData.dateEcheance ? new Date(factureData.dateEcheance) : undefined,
            ...totals,
            resteAPayer: new Decimal(totals.montantTTC).minus(existing.montantPaye),
            montantEnLettres,
            details: {
              create: calculatedDetails.map((d, idx) => ({ ...d, ordre: d.ordre ?? idx })),
            },
          },
          include: { details: true, client: true },
        });

        await this.auditService.log({
          userId,
          action: 'UPDATE',
          table: 'factures',
          entityId: id,
          ancienneValeur: { numero: existing.numero, statut: existing.statut },
          nouvelleValeur: { statut: updated.statut },
        });

        return updated;
      }

      return tx.facture.update({
        where: { id },
        data: {
          ...factureData,
          dateEcheance: factureData.dateEcheance ? new Date(factureData.dateEcheance) : undefined,
        },
      });
    });
  }

  async remove(id: string, userId: string) {
    const facture = await this.findOne(id);

    if (facture.statut !== 'BROUILLON') {
      throw new BadRequestException('Seules les factures en brouillon peuvent être supprimées');
    }

    await this.prisma.facture.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({ userId, action: 'DELETE', table: 'factures', entityId: id });

    return { message: 'Facture supprimée' };
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id);
    const numero = await this.numberService.generateNextNumber();

    const facture = await this.prisma.facture.create({
      data: {
        clientId: original.clientId,
        userId,
        numero,
        statut: 'BROUILLON',
        dateEmission: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        notes: original.notes,
        conditionsPaiement: original.conditionsPaiement,
        remiseGlobale: original.remiseGlobale,
        montantHT: original.montantHT,
        montantTVA: original.montantTVA,
        montantTTC: original.montantTTC,
        montantPaye: 0,
        resteAPayer: original.montantTTC,
        montantEnLettres: original.montantEnLettres,
        details: {
          create: original.details.map((d) => ({
            produitId: d.produitId,
            designation: d.designation,
            quantite: d.quantite,
            prixUnitaire: d.prixUnitaire,
            tva: d.tva,
            remise: d.remise,
            montantHT: d.montantHT,
            montantTVA: d.montantTVA,
            montantTTC: d.montantTTC,
            ordre: d.ordre,
          })),
        },
      },
      include: { client: true, details: true },
    });

    await this.auditService.log({
      userId,
      action: 'DUPLICATE',
      table: 'factures',
      entityId: facture.id,
      ancienneValeur: { sourceId: id },
    });

    return facture;
  }

  async updateStatutAfterPayment(factureId: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: factureId },
      include: { paiements: true },
    });

    if (!facture) return;

    const totalPaye = facture.paiements.reduce(
      (sum, p) => sum.plus(p.montant),
      new Decimal(0),
    );

    const resteAPayer = new Decimal(facture.montantTTC).minus(totalPaye);

    let statut = facture.statut;

    if (resteAPayer.lte(0)) {
      statut = 'PAYEE';
    } else if (totalPaye.gt(0)) {
      statut = 'PARTIELLEMENT_PAYEE';
    }

    await this.prisma.facture.update({
      where: { id: factureId },
      data: {
        montantPaye: totalPaye,
        resteAPayer: resteAPayer.lt(0) ? new Decimal(0) : resteAPayer,
        statut,
        montantEnLettres: numberToWords(Number(facture.montantTTC)),
      },
    });
  }

  private calculateDetails(details: DetailFactureDto[]) {
    return details.map((d) => {
      const qty = new Decimal(d.quantite);
      const prix = new Decimal(d.prixUnitaire);
      const remise = new Decimal(d.remise ?? 0).div(100);
      const tva = new Decimal(d.tva ?? 0).div(100);

      const montantHT = qty.times(prix).times(new Decimal(1).minus(remise));
      const montantTVA = montantHT.times(tva);
      const montantTTC = montantHT.plus(montantTVA);

      return {
        ...d,
        montantHT,
        montantTVA,
        montantTTC,
      };
    });
  }

  private calculateTotals(
    details: ReturnType<typeof this.calculateDetails>,
    remiseGlobale: number,
  ) {
    const montantHTAvantRemise = details.reduce(
      (sum, d) => sum.plus(d.montantHT),
      new Decimal(0),
    );

    const remise = new Decimal(remiseGlobale).div(100);
    const montantHT = montantHTAvantRemise.times(new Decimal(1).minus(remise));

    const montantTVA = details.reduce(
      (sum, d) => sum.plus(d.montantTVA.times(new Decimal(1).minus(remise))),
      new Decimal(0),
    );

    const montantTTC = montantHT.plus(montantTVA);

    return {
      montantHT: montantHT.toDecimalPlaces(2),
      montantTVA: montantTVA.toDecimalPlaces(2),
      montantTTC: montantTTC.toDecimalPlaces(2),
    };
  }
}
