import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPlantDto: CreatePlantDto) {
    const { purchaseDate, ...plantData } = createPlantDto;

    // Calculate next watering date
    const nextWateringAt = new Date();
    nextWateringAt.setDate(
      nextWateringAt.getDate() + createPlantDto.waterFrequencyDays,
    );

    const plant = await this.prisma.plant.create({
      data: {
        ...plantData,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        nextWateringAt,
        userId,
      },
      include: {
        _count: {
          select: {
            waterings: true,
          },
        },
      },
    });

    return plant;
  }

  async findAll(userId: string) {
    const plants = await this.prisma.plant.findMany({
      where: { userId },
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

    return plants.map((plant) => ({
      ...plant,
      lastWatering: plant.waterings[0] || null,
      totalWaterings: plant._count.waterings,
    }));
  }

  async findOne(id: string, userId: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id, userId },
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

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return {
      ...plant,
      totalWaterings: plant._count.waterings,
    };
  }

  async update(id: string, userId: string, updatePlantDto: UpdatePlantDto) {
    // Check if plant exists and belongs to user
    const existingPlant = await this.prisma.plant.findFirst({
      where: { id, userId },
    });

    if (!existingPlant) {
      throw new NotFoundException('Plant not found');
    }

    const { purchaseDate, waterFrequencyDays, ...plantData } = updatePlantDto;

    // Recalculate next watering date if frequency changed
    let nextWateringAt = existingPlant.nextWateringAt;
    if (
      waterFrequencyDays &&
      waterFrequencyDays !== existingPlant.waterFrequencyDays
    ) {
      const lastWatering = await this.prisma.watering.findFirst({
        where: { plantId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (lastWatering) {
        nextWateringAt = new Date(lastWatering.createdAt);
        nextWateringAt.setDate(nextWateringAt.getDate() + waterFrequencyDays);
      } else {
        nextWateringAt = new Date();
        nextWateringAt.setDate(nextWateringAt.getDate() + waterFrequencyDays);
      }
    }

    const updatedPlant = await this.prisma.plant.update({
      where: { id },
      data: {
        ...plantData,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        waterFrequencyDays,
        nextWateringAt,
      },
      include: {
        _count: {
          select: {
            waterings: true,
          },
        },
      },
    });

    return updatedPlant;
  }

  async remove(id: string, userId: string) {
    // Check if plant exists and belongs to user
    const existingPlant = await this.prisma.plant.findFirst({
      where: { id, userId },
    });

    if (!existingPlant) {
      throw new NotFoundException('Plant not found');
    }

    await this.prisma.plant.delete({
      where: { id },
    });

    return { message: 'Plant deleted successfully' };
  }

  async getPlantsNeedingWater(userId: string) {
    const now = new Date();

    const plants = await this.prisma.plant.findMany({
      where: {
        userId,
        nextWateringAt: {
          lte: now,
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

    return plants.map((plant) => ({
      ...plant,
      lastWatering: plant.waterings[0] || null,
      daysOverdue: Math.floor(
        (now.getTime() - plant.nextWateringAt.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  async getUpcomingWaterings(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const plants = await this.prisma.plant.findMany({
      where: {
        userId,
        nextWateringAt: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { nextWateringAt: 'asc' },
    });

    return plants.map((plant) => ({
      ...plant,
      daysUntilWatering: Math.ceil(
        (plant.nextWateringAt.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
