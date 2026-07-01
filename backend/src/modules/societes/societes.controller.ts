import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SocietesService } from './societes.service';
import { CreateSocieteDto } from './dto/create-societe.dto';
import { UpdateSocieteDto } from './dto/update-societe.dto';
import { CreateSocieteAdminDto } from './dto/create-societe-admin.dto';
import { RequestUser } from '../../common/types/request-user.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('societes')
export class SocietesController {
  constructor(private readonly societesService: SocietesService) {}

  // ── SUPERADMIN endpoints ──────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPERADMIN)
  findAll() {
    return this.societesService.findAll();
  }

  @Get('platform/stats')
  @Roles(Role.SUPERADMIN)
  getPlatformStats() {
    return this.societesService.getPlatformStats();
  }

  @Post()
  @Roles(Role.SUPERADMIN)
  create(@Body() dto: CreateSocieteDto) {
    return this.societesService.create(dto);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.societesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSocieteDto) {
    return this.societesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.societesService.remove(id);
  }

  @Post(':id/admin')
  @Roles(Role.SUPERADMIN)
  createAdmin(@Param('id') id: string, @Body() dto: CreateSocieteAdminDto) {
    return this.societesService.createAdmin(id, dto);
  }

  @Get(':id/users')
  @Roles(Role.SUPERADMIN)
  getSocieteUsers(@Param('id') id: string) {
    return this.societesService.getSocieteUsers(id);
  }

  @Get(':id/stats')
  @Roles(Role.SUPERADMIN)
  getSocieteStats(@Param('id') id: string) {
    return this.societesService.getSocieteStats(id);
  }

  // ── ADMIN (company-level) endpoint ────────────────────────────────────────

  @Patch('me/infos')
  @Roles(Role.ADMIN)
  updateMySociete(@Request() req: { user: RequestUser }, @Body() dto: UpdateSocieteDto) {
    if (!req.user.societeId) throw new ForbiddenException('Aucune société associée');
    return this.societesService.updateMySociete(req.user.societeId, dto);
  }
}
