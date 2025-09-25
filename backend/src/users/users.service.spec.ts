import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    passwordHash: 'hashedPassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUserResponse = {
    id: 'user-1',
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await service.findById('user-1');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('user-999')).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUserResponse);
    });

    it('should return null if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    const updateUserDto: UpdateUserDto = {
      firstname: 'Updated',
      lastname: 'Name',
    };

    it('should update user profile', async () => {
      // Arrange
      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateProfile('user-1', updateUserDto);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const updateWithEmail = { ...updateUserDto, email: 'existing@example.com' };
      const existingUser = { ...mockUser, email: 'existing@example.com', id: 'user-2' };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.updateProfile('user-1', updateWithEmail)).rejects.toThrow('Email is already taken');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      // Arrange
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.deleteAccount('user-1');

      // Assert
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prismaService.user.delete as jest.Mock).mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.deleteAccount('user-999')).rejects.toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const mockStats = {
        _count: {
          plants: 5,
          waterings: 25,
        },
      };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockStats);

      // Act
      const result = await service.getUserStats('user-1');

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          _count: {
            select: {
              plants: true,
              waterings: true,
            },
          },
        },
      });
      expect(result).toEqual({
        totalPlants: 5,
        totalWaterings: 25,
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserStats('user-999')).rejects.toThrow('User not found');
    });
  });
});