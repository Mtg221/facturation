import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueReport(dateDebut: Date, dateFin: Date) {
    const factures = await this.prisma.facture.findMany({
      where: {
        dateEmission: { gte: dateDebut, lte: dateFin },
        statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] },
      },
      include: {
        client: { select: { nom: true, code: true } },
        paiements: true,
      },
      orderBy: { dateEmission: 'desc' },
    });

    const totalHT = factures.reduce((sum, f) => sum + Number(f.montantHT), 0);
    const totalTVA = factures.reduce((sum, f) => sum + Number(f.montantTVA), 0);
    const totalTTC = factures.reduce((sum, f) => sum + Number(f.montantTTC), 0);
    const totalEncaisse = factures.reduce((sum, f) => sum + Number(f.montantPaye), 0);

    return {
      periode: {
        debut: dateDebut.toLocaleDateString('fr-FR'),
        fin: dateFin.toLocaleDateString('fr-FR'),
      },
      synthese: { totalHT, totalTVA, totalTTC, totalEncaisse },
      factures,
    };
  }

  async getImpayesReport() {
    return this.prisma.facture.findMany({
      where: {
        statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'] },
      },
      include: {
        client: { select: { nom: true, code: true, telephone1: true, email: true } },
      },
      orderBy: { dateEcheance: 'asc' },
    });
  }
}
