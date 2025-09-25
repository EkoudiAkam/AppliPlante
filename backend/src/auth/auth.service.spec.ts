import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse = {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'JWT_ACCESS_EXPIRATION':
          return '15m';
        case 'JWT_REFRESH_EXPIRATION':
          return '7d';
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstname: 'Test',
      lastname: 'User',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUserResponse);
      jwtService.signAsync = jest.fn()
        .mockResolvedValueOnce('accessToken')
        .mockResolvedValueOnce('refreshToken');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashedPassword',
          firstname: registerDto.firstname,
          lastname: registerDto.lastname,
        },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        user: mockUserResponse,
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      });
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync = jest.fn()
        .mockResolvedValueOnce('accessToken')
        .mockResolvedValueOnce('refreshToken');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstname: mockUser.firstname,
          lastname: mockUser.lastname,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      });
    });

    it('should throw error with invalid email', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'validRefreshToken';
    const payload = { sub: 'user-1', email: 'test@example.com' };

    it('should successfully refresh token', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(payload);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserResponse);
      jwtService.signAsync = jest.fn()
        .mockResolvedValueOnce('newAccessToken')
        .mockResolvedValueOnce('newRefreshToken');

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: configService.get('JWT_REFRESH_SECRET'),
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        accessToken: 'newAccessToken',
      });
    });

    it('should throw error with invalid refresh token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(payload);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow('User not found');
    });
  });
});