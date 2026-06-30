import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientFilterDto } from './dto/client-filter.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des clients' })
  findAll(@Query() filter: ClientFilterDto) {
    return this.clientsService.findAll(filter);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exporter les clients en CSV' })
  async exportCsv(@Res() res: Response) {
    const buffer = await this.clientsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
    res.send('﻿' + buffer.toString('utf-8'));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un client' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Créer un client' })
  create(@Body() dto: CreateClientDto, @CurrentUser() user: { id: string }) {
    return this.clientsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Modifier un client' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.clientsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Supprimer un client' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.clientsService.remove(id, user.id);
  }
}
