import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { FacturesService } from './factures.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { FactureFilterDto } from './dto/facture-filter.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PdfService } from '../pdf/pdf.service';
import { RequestUser } from '../../common/types/request-user.type';

@ApiTags('factures')
@ApiBearerAuth()
@Controller('factures')
export class FacturesController {
  constructor(
    private readonly facturesService: FacturesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des factures' })
  findAll(@Query() filter: FactureFilterDto, @CurrentUser() user: RequestUser) {
    return this.facturesService.findAll(filter, user.societeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une facture' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.facturesService.findOne(id, user.societeId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger la facture en PDF' })
  async getPdf(@Param('id') id: string, @Res() res: Response, @CurrentUser() user: RequestUser) {
    const facture = await this.facturesService.findOne(id, user.societeId);
    const buffer = await this.pdfService.generateFacturePdf(facture, user.societeId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${facture.numero}.pdf"`);
    res.send(buffer);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Créer une facture' })
  create(@Body() dto: CreateFactureDto, @CurrentUser() user: RequestUser) {
    return this.facturesService.create(dto, user.id, user.societeId);
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Dupliquer une facture' })
  duplicate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.facturesService.duplicate(id, user.id, user.societeId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Modifier une facture (brouillon uniquement)' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFactureDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.facturesService.update(id, dto, user.id, user.societeId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Supprimer une facture (brouillon uniquement)' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.facturesService.remove(id, user.id, user.societeId);
  }
}
