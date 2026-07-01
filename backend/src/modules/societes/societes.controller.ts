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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SocietesService } from './societes.service';
import { FilesService } from '../files/files.service';
import { CreateSocieteDto } from './dto/create-societe.dto';
import { UpdateSocieteDto } from './dto/update-societe.dto';
import { CreateSocieteAdminDto } from './dto/create-societe-admin.dto';
import { RequestUser } from '../../common/types/request-user.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('societes')
export class SocietesController {
  constructor(
    private readonly societesService: SocietesService,
    private readonly filesService: FilesService,
  ) {}

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

  @Post(':id/logo')
  @Roles(Role.SUPERADMIN)
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async uploadLogoSuperAdmin(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logoUrl = await this.filesService.uploadLogo(file, id);
    return this.societesService.update(id, { logoUrl });
  }

  // ── ADMIN (company-level) endpoints ───────────────────────────────────────

  @Patch('me/infos')
  @Roles(Role.ADMIN)
  updateMySociete(@Request() req: { user: RequestUser }, @Body() dto: UpdateSocieteDto) {
    if (!req.user.societeId) throw new ForbiddenException('Aucune société associée');
    return this.societesService.updateMySociete(req.user.societeId, dto);
  }

  @Post('me/logo')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async uploadLogoAdmin(
    @Request() req: { user: RequestUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!req.user.societeId) throw new ForbiddenException('Aucune société associée');
    const logoUrl = await this.filesService.uploadLogo(file, req.user.societeId);
    return this.societesService.updateMySociete(req.user.societeId, { logoUrl });
  }
}
