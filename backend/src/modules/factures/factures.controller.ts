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
  findAll(@Query() filter: FactureFilterDto) {
    return this.facturesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une facture' })
  findOne(@Param('id') id: string) {
    return this.facturesService.findOne(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharger la facture en PDF' })
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const facture = await this.facturesService.findOne(id);
    const buffer = await this.pdfService.generateFacturePdf(facture);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facture-${facture.numero}.pdf"`,
    );
    res.send(buffer);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Créer une facture' })
  create(@Body() dto: CreateFactureDto, @CurrentUser() user: { id: string }) {
    return this.facturesService.create(dto, user.id);
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Dupliquer une facture' })
  duplicate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.facturesService.duplicate(id, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Modifier une facture (brouillon uniquement)' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFactureDto>,
    @CurrentUser() user: { id: string },
  ) {
    return this.facturesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Supprimer une facture (brouillon uniquement)' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.facturesService.remove(id, user.id);
  }
}
