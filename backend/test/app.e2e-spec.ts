import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com', motDePasse: 'WrongPass1' })
        .expect(401);
    });

    it('should return 400 for missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'notanemail' })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });
});
