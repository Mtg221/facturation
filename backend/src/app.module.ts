import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { configValidationSchema } from './config/config.validation';
import { createWinstonLogger } from './config/logger.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SecteursModule } from './modules/secteurs/secteurs.module';
import { ProduitsModule } from './modules/produits/produits.module';
import { FacturesModule } from './modules/factures/factures.module';
import { PaiementsModule } from './modules/paiements/paiements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { MailModule } from './modules/mail/mail.module';
import { FilesModule } from './modules/files/files.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './health/health.module';
import { SocietesModule } from './modules/societes/societes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'auth-short', ttl: 60000, limit: 5 },       // 5 req/min (login, register)
      { name: 'auth-refresh', ttl: 60000, limit: 10 },    // 10 req/min (refresh)
      { name: 'api-short', ttl: 1000, limit: 10 },        // 10 req/sec API générale
      { name: 'api-long', ttl: 60000, limit: 100 },       // 100 req/min API générale
    ]),
    WinstonModule.forRoot(createWinstonLogger()),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    SecteursModule,
    ProduitsModule,
    FacturesModule,
    PaiementsModule,
    DashboardModule,
    NotificationsModule,
    AuditModule,
    PdfModule,
    MailModule,
    FilesModule,
    ReportsModule,
    HealthModule,
    SocietesModule,
  ],
})
export class AppModule {}
