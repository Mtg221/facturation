import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProduitsService } from './produits.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('produits')
@ApiBearerAuth()
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Get()
  @ApiOperation({ summary: 'Catalogue des produits/services' })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: { societeId?: string | null }) {
    return this.produitsService.findAll(pagination, user.societeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un produit' })
  findOne(@Param('id') id: string, @CurrentUser() user: { societeId?: string | null }) {
    return this.produitsService.findOne(id, user.societeId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Créer un produit/service' })
  create(@Body() dto: CreateProduitDto, @CurrentUser() user: { id: string; societeId?: string | null }) {
    return this.produitsService.create(dto, user.id, user.societeId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.COMPTABLE)
  @ApiOperation({ summary: 'Modifier un produit/service' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProduitDto>,
    @CurrentUser() user: { id: string; societeId?: string | null },
  ) {
    return this.produitsService.update(id, dto, user.id, user.societeId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Supprimer un produit/service' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string; societeId?: string | null }) {
    return this.produitsService.remove(id, user.id, user.societeId);
  }
}
