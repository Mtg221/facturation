import { Controller, Post, Get, Delete, Body, UseGuards, HttpCode, HttpStatus, Res, Req, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'auth-short': { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives, réessayez plus tard' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.login(dto, res, deviceFingerprint, ip, userAgent);
  }

  @Public()
  @Post('register')
  @Throttle({ 'auth-short': { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Créer un compte' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives, réessayez plus tard' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string;
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.register(dto, res, deviceFingerprint, ip, userAgent);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'auth-refresh': { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Renouveler les tokens' })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({ status: 429, description: 'Trop de tentatives, réessayez plus tard' })
  async refresh(@CurrentUser() user: { sub: string; refreshToken: string }, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    const ip = req.ip || req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string;
    return this.authService.refreshTokens(user.sub, user.refreshToken, res, deviceFingerprint, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion' })
  async logout(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    return this.authService.logout(user.id, res, deviceFingerprint);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion de tous les appareils' })
  async logoutAll(@CurrentUser() user: { id: string }, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    return this.authService.logoutAll(user.id, res, deviceFingerprint);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur connecté' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les sessions actives' })
  getSessions(@CurrentUser() user: { id: string }) {
    return this.authService.getActiveSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Révoquer une session spécifique' })
  revokeSession(@CurrentUser() user: { id: string }, @Param('sessionId') sessionId: string) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Vérifier l\'adresse email via token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}