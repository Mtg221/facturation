import {
  Controller, Get, Post, Delete, Body, Param, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('paiements')
@ApiBearerAuth()
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des paiements' })
  findAll(
    @Query('factureId') factureId: string | undefined,
    @Query() pagination: PaginationDto,
  ) {
    return this.paiementsService.findAll(factureId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un paiement' })
  findOne(@Param('id') id: string) {
    return this.paiementsService.findOne(id);
  }

  @Get(':id/recu')
  @ApiOperation({ summary: 'Télécharger le reçu de paiement en PDF' })
  async getRecu(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.paiementsService.getRecu(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-${id}.pdf"`);
    res.send(buffer);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE, Role.CAISSIER)
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  create(@Body() dto: CreatePaiementDto, @CurrentUser() user: { id: string }) {
    return this.paiementsService.create(dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Annuler un paiement' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.paiementsService.remove(id, user.id);
  }
}
