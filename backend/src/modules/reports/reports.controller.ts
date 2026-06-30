import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Rapport de revenus par période' })
  getRevenueReport(
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
  ) {
    return this.reportsService.getRevenueReport(
      new Date(dateDebut),
      new Date(dateFin),
    );
  }

  @Get('impayes')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Rapport des factures impayées' })
  getImpayesReport() {
    return this.reportsService.getImpayesReport();
  }
}
