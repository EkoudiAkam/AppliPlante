import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWateringDto } from './dto/create-watering.dto';

@Injectable()
export class WateringsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWateringDto: CreateWateringDto) {
    const { plantId, amountMl, note } = createWateringDto;

    // Check if plant exists and belongs to user
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    // Create watering record
    const watering = await this.prisma.watering.create({
      data: {
        plantId,
        userId,
        amountMl,
        note,
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            species: true,
            waterFrequencyDays: true,
          },
        },
      },
    });

    // Update plant's next watering date based on the watering date, not current date
    const nextWateringAt = new Date(watering.createdAt);
    nextWateringAt.setDate(nextWateringAt.getDate() + plant.waterFrequencyDays);

    await this.prisma.plant.update({
      where: { id: plantId },
      data: { nextWateringAt },
    });

    return watering;
  }

  async findAll(userId: string, plantId?: string) {
    const where: any = { userId };
    if (plantId) {
      // Verify plant belongs to user
      const plant = await this.prisma.plant.findFirst({
        where: { id: plantId, userId },
      });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }
      where.plantId = plantId;
    }

    const waterings = await this.prisma.watering.findMany({
      where,
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            species: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return waterings;
  }

  async findOne(id: string, userId: string) {
    const watering = await this.prisma.watering.findFirst({
      where: { id, userId },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            species: true,
            imageUrl: true,
            waterAmountMl: true,
            waterFrequencyDays: true,
          },
        },
      },
    });

    if (!watering) {
      throw new NotFoundException('Watering record not found');
    }

    return watering;
  }

  async remove(id: string, userId: string) {
    // Check if watering exists and belongs to user
    const watering = await this.prisma.watering.findFirst({
      where: { id, userId },
      include: {
        plant: true,
      },
    });

    if (!watering) {
      throw new NotFoundException('Watering record not found');
    }

    await this.prisma.watering.delete({
      where: { id },
    });

    // Recalculate next watering date based on remaining waterings
    const lastWatering = await this.prisma.watering.findFirst({
      where: { plantId: watering.plantId },
      orderBy: { createdAt: 'desc' },
    });

    let nextWateringAt: Date;
    if (lastWatering) {
      nextWateringAt = new Date(lastWatering.createdAt);
      nextWateringAt.setDate(
        nextWateringAt.getDate() + watering.plant.waterFrequencyDays,
      );
    } else {
      // No waterings left, set to current date + frequency
      nextWateringAt = new Date();
      nextWateringAt.setDate(
        nextWateringAt.getDate() + watering.plant.waterFrequencyDays,
      );
    }

    await this.prisma.plant.update({
      where: { id: watering.plantId },
      data: { nextWateringAt },
    });

    return { message: 'Watering record deleted successfully' };
  }

  async getWateringStats(userId: string, plantId?: string) {
    const where: any = { userId };
    if (plantId) {
      // Verify plant belongs to user
      const plant = await this.prisma.plant.findFirst({
        where: { id: plantId, userId },
      });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }
      where.plantId = plantId;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalWaterings, recentWaterings, avgAmountResult] =
      await Promise.all([
        this.prisma.watering.count({ where }),
        this.prisma.watering.count({
          where: {
            ...where,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.watering.aggregate({
          where,
          _avg: { amountMl: true },
        }),
      ]);

    return {
      totalWaterings,
      recentWaterings,
      averageAmountMl: Math.round(avgAmountResult._avg.amountMl || 0),
    };
  }

  async getWateringHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const waterings = await this.prisma.watering.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by date for chart data
    const groupedByDate = waterings.reduce((acc, watering) => {
      const date = watering.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalAmount: 0,
          waterings: [],
        };
      }
      acc[date].count++;
      acc[date].totalAmount += watering.amountMl;
      acc[date].waterings.push(watering);
      return acc;
    }, {});

    return {
      history: Object.values(groupedByDate).sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
      totalWaterings: waterings.length,
      totalAmount: waterings.reduce((sum, w) => sum + w.amountMl, 0),
    };
  }
}
