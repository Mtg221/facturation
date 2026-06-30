import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs du tableau de bord' })
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Graphique des revenus mensuels' })
  getRevenueChart(@Query('year') year?: number) {
    return this.dashboardService.getRevenueChart(year);
  }

  @Get('payment-status')
  @ApiOperation({ summary: 'Répartition des statuts de facturation' })
  getPaymentStatusChart() {
    return this.dashboardService.getPaymentStatusChart();
  }

  @Get('top-clients')
  @ApiOperation({ summary: 'Top clients par chiffre d\'affaires' })
  getTopClients(@Query('limit') limit?: number) {
    return this.dashboardService.getTopClients(limit);
  }
}
