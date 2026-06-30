import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcryptUtil from '../../common/utils/bcrypt.util';

jest.mock('../../common/utils/bcrypt.util');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mocked_token'),
};

const mockConfig = {
  get: jest.fn((key: string, def?: string) => def ?? 'test_value'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', motDePasse: 'Password1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        motDePasse: 'hashed',
        isActive: true,
        role: 'ADMIN',
      });
      (bcryptUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', motDePasse: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@test.com',
        motDePasse: 'hashed',
        isActive: true,
        role: 'ADMIN',
        nom: 'Admin',
        prenom: 'Test',
        refreshToken: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      (bcryptUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (bcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed_refresh');

      const result = await service.login({ email: 'admin@test.com', motDePasse: 'Admin@12345' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('motDePasse');
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        service.register({
          email: 'existing@test.com',
          nom: 'Test',
          prenom: 'User',
          motDePasse: 'Password1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({
        id: '2',
        email: 'new@test.com',
        nom: 'New',
        prenom: 'User',
        role: 'LECTURE',
        isActive: true,
        refreshToken: null,
        motDePasse: 'hashed',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register({
        email: 'new@test.com',
        nom: 'New',
        prenom: 'User',
        motDePasse: 'Password1',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('new@test.com');
    });
  });
});
