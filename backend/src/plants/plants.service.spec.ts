import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

describe('PlantsService', () => {
  let service: PlantsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPlant = {
    id: 'plant-1',
    name: 'Test Plant',
    species: 'Test Species',
    location: 'Living Room',
    waterFrequencyDays: 7,
    nextWateringAt: new Date('2024-01-08'),
    purchaseDate: new Date('2024-01-01'),
    notes: 'Test notes',
    imageUrl: null,
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      plant: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      watering: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PlantsService>(PlantsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPlantDto: CreatePlantDto = {
    name: 'Test Plant',
    species: 'Test Species',
    waterAmountMl: 250,
    waterFrequencyDays: 7,
    purchaseDate: '2023-01-01',
    imageUrl: 'https://example.com/image.jpg',
  };

    it('should create a new plant', async () => {
      // Arrange
      const expectedPlant = {
        id: 'plant-1',
        name: createPlantDto.name,
        species: createPlantDto.species,
        waterAmountMl: createPlantDto.waterAmountMl,
        waterFrequencyDays: createPlantDto.waterFrequencyDays,
        purchaseDate: new Date(createPlantDto.purchaseDate),
        imageUrl: createPlantDto.imageUrl,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastWatered: null,
        _count: { waterings: 0 },
      };
      (prismaService.plant.create as jest.Mock).mockResolvedValue(expectedPlant);

      // Act
      const result = await service.create('user-1', createPlantDto);

      // Assert
      expect(prismaService.plant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createPlantDto.name,
          species: createPlantDto.species,
          waterAmountMl: createPlantDto.waterAmountMl,
          waterFrequencyDays: createPlantDto.waterFrequencyDays,
          purchaseDate: new Date(createPlantDto.purchaseDate),
          imageUrl: createPlantDto.imageUrl,
          userId: 'user-1',
          nextWateringAt: expect.any(Date),
        }),
        include: {
          _count: {
            select: {
              waterings: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedPlant);
    });
  });

  describe('findAll', () => {
    it('should return all plants for a user', async () => {
      // Arrange
      const plantsWithCounts = [
        {
          ...mockPlant,
          _count: { waterings: 5 },
          waterings: [{ id: 'watering-1', createdAt: new Date() }],
        },
      ];
      (prismaService.plant.findMany as jest.Mock).mockResolvedValue(plantsWithCounts);

      // Act
      const result = await service.findAll('user-1');

      // Assert
      expect(prismaService.plant.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          _count: {
            select: {
              waterings: true,
            },
          },
          waterings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([
        {
          ...plantsWithCounts[0],
          lastWatering: plantsWithCounts[0].waterings[0],
          totalWaterings: 5,
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return a single plant', async () => {
      // Arrange
      const plantWithDetails = {
        ...mockPlant,
        _count: { waterings: 5 },
        waterings: [{ id: 'watering-1', createdAt: new Date() }],
      };
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(plantWithDetails);

      // Act
      const result = await service.findOne('plant-1', 'user-1');

      // Assert
      expect(prismaService.plant.findFirst).toHaveBeenCalledWith({
        where: { id: 'plant-1', userId: 'user-1' },
        include: {
          _count: {
            select: {
              waterings: true,
            },
          },
          waterings: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
      expect(result).toEqual({
        ...plantWithDetails,
        totalWaterings: 5,
      });
    });

    it('should throw NotFoundException if plant not found', async () => {
      // Arrange
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('plant-999', 'user-1')).rejects.toThrow('Plant not found');
    });
  });

  describe('update', () => {
    const updatePlantDto: UpdatePlantDto = {
    name: 'Updated Plant',
    species: 'Updated Species',
    waterAmountMl: 300,
    waterFrequencyDays: 5,
  };

    it('should update a plant', async () => {
      // Arrange
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(mockPlant);
      const updatedPlant = {
        ...mockPlant,
        ...updatePlantDto,
        _count: { waterings: 5 },
      };
      (prismaService.plant.update as jest.Mock).mockResolvedValue(updatedPlant);

      // Act
      const result = await service.update('plant-1', 'user-1', updatePlantDto);

      // Assert
      expect(prismaService.plant.findFirst).toHaveBeenCalledWith({
        where: { id: 'plant-1', userId: 'user-1' },
      });
      expect(prismaService.plant.update).toHaveBeenCalledWith({
        where: { id: 'plant-1' },
        data: expect.objectContaining(updatePlantDto),
        include: {
          _count: {
            select: {
              waterings: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedPlant);
    });

    it('should throw NotFoundException if plant not found', async () => {
      // Arrange
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('plant-999', 'user-1', updatePlantDto)).rejects.toThrow('Plant not found');
    });
  });

  describe('remove', () => {
    it('should remove a plant', async () => {
      // Arrange
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(mockPlant);
      (prismaService.plant.delete as jest.Mock).mockResolvedValue(mockPlant);

      // Act
      const result = await service.remove('plant-1', 'user-1');

      // Assert
      expect(prismaService.plant.findFirst).toHaveBeenCalledWith({
        where: { id: 'plant-1', userId: 'user-1' },
      });
      expect(prismaService.plant.delete).toHaveBeenCalledWith({
        where: { id: 'plant-1' },
      });
      expect(result).toEqual({ message: 'Plant deleted successfully' });
    });

    it('should throw NotFoundException if plant not found', async () => {
      // Arrange
      (prismaService.plant.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('plant-999', 'user-1')).rejects.toThrow('Plant not found');
    });
  });

  describe('getPlantsNeedingWater', () => {
    it('should return plants that need watering', async () => {
      // Arrange
      const plantsNeedingWater = [
        {
          ...mockPlant,
          nextWateringAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
          waterings: [{ id: 'watering-1', createdAt: new Date() }],
        },
      ];
      (prismaService.plant.findMany as jest.Mock).mockResolvedValue(plantsNeedingWater);

      // Act
      const result = await service.getPlantsNeedingWater('user-1');

      // Assert
      expect(prismaService.plant.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          nextWateringAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          waterings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { nextWateringAt: 'asc' },
      });
      expect(result).toEqual([
        {
          ...plantsNeedingWater[0],
          lastWatering: plantsNeedingWater[0].waterings[0],
          daysOverdue: expect.any(Number),
        },
      ]);
    });
  });

  describe('getUpcomingWaterings', () => {
    it('should return upcoming waterings within specified days', async () => {
      // Arrange
      const upcomingPlants = [
        {
          ...mockPlant,
          nextWateringAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        },
      ];
      (prismaService.plant.findMany as jest.Mock).mockResolvedValue(upcomingPlants);

      // Act
      const result = await service.getUpcomingWaterings('user-1', 7);

      // Assert
      expect(prismaService.plant.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          nextWateringAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        orderBy: { nextWateringAt: 'asc' },
      });
      expect(result).toEqual([
        {
          ...upcomingPlants[0],
          daysUntilWatering: expect.any(Number),
        },
      ]);
    });
  });
});