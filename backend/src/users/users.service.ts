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
    const stats = await this.prisma.user.findUnique({
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

    if (!stats) {
      throw new NotFoundException('User not found');
    }

    return {
      totalPlants: stats._count.plants,
      totalWaterings: stats._count.waterings,
    };
  }
}
