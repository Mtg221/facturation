import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs du tableau de bord' })
  getKpis(@CurrentUser() user: { societeId?: string | null }) {
    return this.dashboardService.getKpis(user?.societeId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Graphique des revenus mensuels' })
  getRevenueChart(@Query('year') year: number | undefined, @CurrentUser() user: { societeId?: string | null }) {
    return this.dashboardService.getRevenueChart(year, user?.societeId);
  }

  @Get('payment-status')
  @ApiOperation({ summary: 'Répartition des statuts de facturation' })
  getPaymentStatusChart(@CurrentUser() user: { societeId?: string | null }) {
    return this.dashboardService.getPaymentStatusChart(user?.societeId);
  }

  @Get('top-clients')
  @ApiOperation({ summary: 'Top clients par chiffre d\'affaires' })
  getTopClients(@Query('limit') limit: number | undefined, @CurrentUser() user: { societeId?: string | null }) {
    return this.dashboardService.getTopClients(limit, user?.societeId);
  }
}
