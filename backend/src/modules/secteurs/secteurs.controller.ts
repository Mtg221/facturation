import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SecteursService } from './secteurs.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('secteurs')
@ApiBearerAuth()
@Controller('secteurs')
export class SecteursController {
  constructor(private readonly secteursService: SecteursService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des secteurs d\'activité' })
  findAll(@Query() pagination: PaginationDto) {
    return this.secteursService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un secteur' })
  findOne(@Param('id') id: string) {
    return this.secteursService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Créer un secteur' })
  create(@Body() dto: CreateSecteurDto) {
    return this.secteursService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Modifier un secteur' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateSecteurDto>) {
    return this.secteursService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un secteur' })
  remove(@Param('id') id: string) {
    return this.secteursService.remove(id);
  }
}
