import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';
import { Response, Request } from 'express';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, res: Response, deviceFingerprint?: string, ip?: string, userAgent?: string) {
    const email = dto.email.toLowerCase();

    // Constant-time lookup + bcrypt to prevent timing attacks
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Dummy hash for constant-time comparison when user doesn't exist
    const dummyHash = '$2b$12$dummyhashdummyhashdummyhashdummyhashdummyhas';
    const hashToCompare = user?.motDePasse ?? dummyHash;

    const passwordValid = await comparePassword(dto.motDePasse, hashToCompare);

    // Artificial delay to further mask timing
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!user || !user.isActive || !passwordValid) {
      await this.auditService.log({
        userId: user?.id,
        action: 'LOGIN_FAILED',
        table: 'users',
        entityId: user?.id,
        adresseIP: ip,
        navigateur: userAgent,
        nouvelleValeur: { email, reason: !user ? 'user_not_found' : !user.isActive ? 'inactive' : 'invalid_password' },
      });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.emailVerified && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte mail.');
    }

    const tokens = await this.createSession(user.id, res, deviceFingerprint, ip, userAgent);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      table: 'users',
      entityId: user.id,
      adresseIP: ip,
      navigateur: userAgent,
    });

    const { motDePasse: _, refreshToken: __, ...userWithoutSensitive } = user;

    return { accessToken: tokens.accessToken, user: userWithoutSensitive };
  }

  async register(dto: RegisterDto, res: Response, deviceFingerprint?: string, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const hashedPassword = await hashPassword(dto.motDePasse);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        nom: dto.nom,
        prenom: dto.prenom,
        motDePasse: hashedPassword,
        role: dto.role ?? 'LECTURE',
      },
    });

    const tokens = await this.createSession(user.id, res, deviceFingerprint, ip, userAgent);

    await this.auditService.log({
      userId: user.id,
      action: 'REGISTER',
      table: 'users',
      entityId: user.id,
      adresseIP: ip,
      navigateur: userAgent,
    });

    const { motDePasse: _, refreshToken: __, ...userWithoutSensitive } = user;

    return { accessToken: tokens.accessToken, user: userWithoutSensitive };
  }

  async refreshTokens(userId: string, refreshToken: string, res: Response, deviceFingerprint?: string, ip?: string) {
    // Find session by refresh token hash
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let matchedSession: { id: string; refreshToken: string; deviceHash: string } | null = null;

    for (const session of sessions) {
      const match = await comparePassword(refreshToken, session.refreshToken);
      if (match) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      // Token reuse attack detected - revoke ALL sessions for this user
      await this.revokeAllSessions(userId);
      this.clearRefreshTokenCookie(res);

      await this.auditService.log({
        userId,
        action: 'SECURITY_ALERT',
        table: 'user_sessions',
        entityId: userId,
        nouvelleValeur: { reason: 'refresh_token_reuse_detected', ip, deviceFingerprint },
      });

      throw new ForbiddenException('Token de rafraîchissement invalide - session révoquée pour sécurité');
    }

    // Verify device fingerprint if provided
    if (deviceFingerprint && matchedSession.deviceHash) {
      const deviceMatch = await comparePassword(deviceFingerprint, matchedSession.deviceHash);
      if (!deviceMatch) {
        await this.revokeSession(userId, matchedSession.id);
        this.clearRefreshTokenCookie(res);

        await this.auditService.log({
          userId,
          action: 'SECURITY_ALERT',
          table: 'user_sessions',
          entityId: matchedSession.id,
          nouvelleValeur: { reason: 'device_fingerprint_mismatch', ip },
        });

        throw new ForbiddenException('Changement de device détecté - reconnexion requise');
      }
    }

    // ROTATION: Create new session, revoke old one
    await this.prisma.userSession.update({
      where: { id: matchedSession.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.createSession(userId, res, deviceFingerprint, ip, undefined);

    await this.auditService.log({
      userId,
      action: 'TOKEN_REFRESH',
      table: 'user_sessions',
      entityId: matchedSession.id,
      adresseIP: ip,
    });

    return { accessToken: tokens.accessToken };
  }

  async logout(userId: string, res: Response, deviceFingerprint?: string) {
    if (deviceFingerprint) {
      // Revoke only current device session
      const sessions = await this.prisma.userSession.findMany({
        where: { userId, revokedAt: null },
      });

      for (const session of sessions) {
        const match = await comparePassword(deviceFingerprint, session.deviceHash);
        if (match) {
          await this.prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      // Revoke all sessions if no device fingerprint
      await this.revokeAllSessions(userId);
    }

    this.clearRefreshTokenCookie(res);

    await this.auditService.log({
      userId,
      action: 'LOGOUT',
      table: 'user_sessions',
      nouvelleValeur: { deviceFingerprint },
    });

    return { message: 'Déconnexion réussie' };
  }

  async logoutAll(userId: string, res: Response, deviceFingerprint?: string) {
    await this.revokeAllSessions(userId, deviceFingerprint ? { excludeDeviceHash: deviceFingerprint } : {});
    this.clearRefreshTokenCookie(res);

    await this.auditService.log({
      userId,
      action: 'LOGOUT_ALL',
      table: 'user_sessions',
    });

    return { message: 'Toutes les sessions ont été révoquées' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        avatar: true,
        telephone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        societeId: true,
        societe: {
          select: { id: true, nom: true, logoUrl: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    return user;
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceHash: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      device: s.deviceHash.substring(0, 8) + '...',
      ip: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({ where: { id: sessionId } });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session introuvable');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      action: 'REVOKE_SESSION',
      table: 'user_sessions',
      entityId: sessionId,
    });

    return { message: 'Session révoquée' };
  }

  private async createSession(
    userId: string,
    res: Response,
    deviceFingerprint?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.generateTokens(userId);

    const deviceHash = deviceFingerprint ? await hashPassword(deviceFingerprint) : 'unknown';
    const refreshTokenHash = await hashPassword(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.userSession.create({
      data: {
        userId,
        deviceHash,
        ipAddress: ip,
        userAgent: userAgent?.substring(0, 500),
        refreshToken: refreshTokenHash,
        expiresAt,
      },
    });

    // Also update user table for backward compatibility
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: refreshTokenHash,
        refreshTokenDevice: deviceHash,
        refreshTokenIP: ip,
        lastLogin: new Date(),
      },
    });

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return tokens;
  }

  private async revokeAllSessions(userId: string, options?: { excludeDeviceHash?: string }) {
    const where: Record<string, unknown> = { userId, revokedAt: null };

    if (options?.excludeDeviceHash) {
      where.deviceHash = { not: await hashPassword(options.excludeDeviceHash) };
    }

    await this.prisma.userSession.updateMany({
      where,
      data: { revokedAt: new Date() },
    });

    // Also clear user table refresh token if all sessions revoked
    if (!options?.excludeDeviceHash) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null, refreshTokenDevice: null, refreshTokenIP: null },
      });
    }
  }

  private async revokeSessionById(userId: string, sessionId: string) {
    await this.prisma.userSession.update({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    };
    res.cookie('refreshToken', token, cookieOptions);
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });
  }

  private async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, societeId: true },
    });
    const payload = { sub: userId, role: user?.role, societeId: user?.societeId ?? null };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) throw new NotFoundException('Lien de vérification invalide ou expiré');

    if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
      throw new BadRequestException('Ce lien de vérification a expiré. Contactez votre administrateur pour en obtenir un nouveau.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null },
    });

    return { message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' };
  }
}