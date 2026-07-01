import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getKpis(societeId?: string | null) {
    const scope = societeId ?? 'global';
    const cacheKey = `dashboard:kpis:${scope}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const scopeWhere = societeId ? { societeId } : {};

    const [
      totalClients,
      newClientsThisMonth,
      facturesStats,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      this.prisma.client.count({ where: { isActive: true, ...scopeWhere } }),
      this.prisma.client.count({
        where: { createdAt: { gte: startOfMonth }, isActive: true, ...scopeWhere },
      }),
      this.prisma.facture.groupBy({
        by: ['statut'],
        where: scopeWhere,
        _count: true,
        _sum: { montantTTC: true, resteAPayer: true, montantPaye: true },
      }),
      this.prisma.paiement.aggregate({
        where: { datePaiement: { gte: startOfMonth }, ...scopeWhere },
        _sum: { montant: true },
      }),
      this.prisma.paiement.aggregate({
        where: { datePaiement: { gte: startOfLastMonth, lte: endOfLastMonth }, ...scopeWhere },
        _sum: { montant: true },
      }),
    ]);

    const totalFactures = facturesStats.reduce((sum, s) => sum + s._count, 0);
    const facturesPayees = facturesStats.find((s) => s.statut === 'PAYEE')?._count ?? 0;
    const facturesEnRetard = facturesStats.find((s) => s.statut === 'EN_RETARD')?._count ?? 0;
    const montantImpaye = facturesStats.reduce(
      (sum, s) => sum + Number(s._sum.resteAPayer ?? 0),
      0,
    );

    const revenueMois = Number(revenueThisMonth._sum.montant ?? 0);
    const revenueMoisDernier = Number(revenueLastMonth._sum.montant ?? 0);
    const croissance =
      revenueMoisDernier > 0
        ? ((revenueMois - revenueMoisDernier) / revenueMoisDernier) * 100
        : 0;

    const result = {
      totalClients,
      newClientsThisMonth,
      totalFactures,
      facturesPayees,
      facturesEnRetard,
      montantImpaye,
      revenueMois,
      croissanceRevenu: Math.round(croissance * 100) / 100,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  async getRevenueChart(year?: number, societeId?: string | null) {
    const targetYear = year ?? new Date().getFullYear();
    const scope = societeId ?? 'global';
    const cacheKey = `dashboard:revenue:${scope}:${targetYear}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const paiements = await this.prisma.paiement.findMany({
      where: {
        datePaiement: { gte: startDate, lte: endDate },
        ...(societeId ? { societeId } : {}),
      },
      select: { montant: true, datePaiement: true },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      mois: new Date(targetYear, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
      revenue: 0,
    }));

    paiements.forEach((p) => {
      const month = p.datePaiement.getMonth();
      monthlyData[month].revenue += Number(p.montant);
    });

    await this.redis.set(cacheKey, JSON.stringify(monthlyData), CACHE_TTL);

    return monthlyData;
  }

  async getPaymentStatusChart(societeId?: string | null) {
    const scope = societeId ?? 'global';
    const cacheKey = `dashboard:payment-status:${scope}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stats = await this.prisma.facture.groupBy({
      by: ['statut'],
      where: societeId ? { societeId } : undefined,
      _count: true,
    });

    const result = stats.map((s) => ({ statut: s.statut, count: s._count }));

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  async getTopClients(limit = 10, societeId?: string | null) {
    const scope = societeId ?? 'global';
    const cacheKey = `dashboard:top-clients:${scope}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const clients = await this.prisma.client.findMany({
      where: { isActive: true, ...(societeId ? { societeId } : {}) },
      include: {
        factures: {
          where: { statut: { in: ['PAYEE', 'PARTIELLEMENT_PAYEE'] } },
          select: { montantPaye: true },
        },
        _count: { select: { factures: true } },
      },
    });

    const ranked = clients
      .map((c) => ({
        id: c.id,
        nom: c.nom,
        code: c.code,
        totalFactures: c._count.factures,
        totalPaye: c.factures.reduce((sum, f) => sum + Number(f.montantPaye), 0),
      }))
      .sort((a, b) => b.totalPaye - a.totalPaye)
      .slice(0, limit);

    await this.redis.set(cacheKey, JSON.stringify(ranked), CACHE_TTL);

    return ranked;
  }
}
