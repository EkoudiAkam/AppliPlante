import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    const { email, ...otherData } = updateUserDto;

    // Check if email is being updated and if it's already taken
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email is already taken');
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          email,
          ...otherData,
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

      return updatedUser;
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async deleteAccount(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'Account deleted successfully' };
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async getUserStats(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            plants: true,
            waterings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculer les statistiques du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [wateringsThisMonth, plantsWateredTodayResult] = await Promise.all([
      this.prisma.watering.count({
        where: {
          userId: id,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.watering.findMany({
        where: {
          userId: id,
          createdAt: { gte: startOfToday },
        },
        select: {
          plantId: true,
        },
        distinct: ['plantId'],
      }),
    ]);

    const plantsWateredToday = plantsWateredTodayResult.length;

    // Calculer la moyenne d'arrosages par jour ce mois
    const daysInMonth = now.getDate(); // Nombre de jours écoulés ce mois
    const averageWateringsPerDay = daysInMonth > 0 ? wateringsThisMonth / daysInMonth : 0;

    return {
      totalPlants: user._count.plants,
      totalWaterings: user._count.waterings,
      wateringsThisMonth,
      averageWateringsPerDay,
      plantsWateredToday,
    };
  }
}
