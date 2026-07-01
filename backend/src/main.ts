import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as csurf from 'csurf';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { WinstonModule } from 'nest-winston';
import { createWinstonLogger } from './config/logger.config';

function validateCorsOrigins(origins: string): string[] {
  const urls = origins.split(',').map((o) => o.trim());
  const validUrls: string[] = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        validUrls.push(url);
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return validUrls.length > 0 ? validUrls : ['http://localhost:5173'];
}

function validateCriticalSecrets(configService: ConfigService, logger: any) {
  const forbiddenPatterns = [
    'CHANGE_ME',
    'your_email',
    'your_app_password',
    'yourdomain.com',
    'change_me',
    'dummy',
    'test',
    'default',
    'secret123',
    'password123',
  ];

  const criticalSecrets = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'MAIL_USER',
    'MAIL_PASS',
  ];

  for (const secret of criticalSecrets) {
    const value = configService.get<string>(secret) || '';
    
    // Check for forbidden patterns
    for (const pattern of forbiddenPatterns) {
      if (value.toLowerCase().includes(pattern.toLowerCase())) {
        const errorMsg = `🚨 SECURITY ERROR: ${secret} contains default/placeholder value "${pattern}"! Please set a secure your secure value in .env before starting in production.`;
        logger.error(errorMsg, 'SecurityValidation');
        throw new Error(errorMsg);
      }
    }
    
    // Check minimum length for JWT secrets
    if (secret.includes('SECRET') && value.length < 32) {
      const errorMsg = `🚨 SECURITY ERROR: ${secret} must be at least 32 characters! Current length: ${value.length}. Generate with: openssl rand -base64 32`;
      logger.error(errorMsg, 'SecurityValidation');
      throw new Error(errorMsg);
    }
    
    // Check for empty critical secrets
    if (!value || value.trim() === '') {
      const errorMsg = `🚨 SECURITY ERROR: ${secret} is not set! Please configure it in .env`;
      logger.error(errorMsg, 'SecurityValidation');
      throw new Error(errorMsg);
    }
  }
  
  logger.log('✅ All critical secrets validated successfully', 'SecurityValidation');
}

async function bootstrap() {
  const logger = WinstonModule.createLogger(createWinstonLogger());

  const app = await NestFactory.create(AppModule, { logger });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS', '');
  const corsOrigins = corsOriginsEnv || 'https://facturation-rust.vercel.app,http://localhost:5173';
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Validate critical secrets are not using default/placeholder values
  if (isProduction) {
    validateCriticalSecrets(configService, logger);
  }

  // Helmet with proper CSP
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              fontSrc: ["'self'"],
              connectSrc: ["'self'"],
              frameAncestors: ["'self'"],
              formAction: ["'self'"],
              baseUri: ["'self'"],
              objectSrc: ["'none'"],
            },
          }
        : false,
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
      xssFilter: true,
      frameguard: { action: 'sameorigin' },
      permittedCrossDomainPolicies: false,
    }),
  );

  app.use(compression());
  app.use(cookieParser());
  
  // Body parser limits (DoS prevention)
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  // Trust proxy and handle X-Forwarded-Proto for secure cookies behind proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // CSRF Protection (Double Submit Cookie Pattern)
  // Only apply to state-changing methods, exclude auth endpoints
  const csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      key: 'csrf-token',
    },
  });

  app.use((req, res, next) => {
    const publicAuthPaths = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/auth/logout-all',
    ];
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isPublicAuth = publicAuthPaths.some((p) => req.path.startsWith(p));
    
    if (isMutation && !isPublicAuth) {
      return csrfProtection(req, res, next);
    }
    next();
  });

  // Endpoint to get CSRF token for frontend
  expressApp.get('/api/csrf-token', csrfProtection, (req: any, res: any) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Health check endpoint (no prefix, no auth, no CSRF)
  expressApp.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Strict CORS validation
  app.enableCors({
    origin: validateCorsOrigins(corsOrigins),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Facturation API')
      .setDescription('Professional SaaS Invoicing Platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('clients', 'Client management')
      .addTag('secteurs', 'Business sector management')
      .addTag('produits', 'Product/service catalog')
      .addTag('factures', 'Invoice management')
      .addTag('paiements', 'Payment management')
      .addTag('dashboard', 'Dashboard & analytics')
      .addTag('notifications', 'Notification management')
      .addTag('reports', 'Reports & exports')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}/api`, 'Bootstrap');
  if (!isProduction) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
