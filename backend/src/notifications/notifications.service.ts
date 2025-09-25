import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.setupWebPush();
  }

  private setupWebPush() {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT');

    if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } else {
      this.logger.warn(
        'VAPID keys not configured. Web push notifications will not work.',
      );
    }
  }

  async subscribeToPush(userId: string, subscribeDto: SubscribePushDto) {
    const { endpoint, p256dh, auth } = subscribeDto;

    // Check if subscription already exists
    const existingSubscription = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
    });

    if (existingSubscription) {
      // Update existing subscription
      return this.prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: { p256dh, auth },
      });
    }

    // Create new subscription
    return this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        p256dh,
        auth,
      },
    });
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    const subscription = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
    });

    if (subscription) {
      await this.prisma.pushSubscription.delete({
        where: { id: subscription.id },
      });
      return { message: 'Unsubscribed successfully' };
    }

    return { message: 'Subscription not found' };
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data || {},
    });

    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        this.logger.log(`Notification sent to user ${userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to send notification to user ${userId}:`,
          error,
        );

        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.prisma.pushSubscription.delete({
            where: { id: subscription.id },
          });
          this.logger.log(`Removed invalid subscription for user ${userId}`);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPlantsNeedingWater() {
    this.logger.log('Checking plants needing water...');

    const now = new Date();
    const plantsNeedingWater = await this.prisma.plant.findMany({
      where: {
        nextWateringAt: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    // Group plants by user
    const plantsByUser = plantsNeedingWater.reduce((acc, plant) => {
      const userId = plant.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: plant.user,
          plants: [],
        };
      }
      acc[userId].plants.push(plant);
      return acc;
    }, {});

    // Send notifications to each user
    for (const [userId, data] of Object.entries(plantsByUser)) {
      const { plants } = data as any;
      const plantCount = plants.length;

      let title: string;
      let body: string;

      if (plantCount === 1) {
        title = "🌱 Temps d'arroser !";
        body = `${plants[0].name} a besoin d'eau`;
      } else {
        title = "🌱 Temps d'arroser !";
        body = `${plantCount} plantes ont besoin d'eau`;
      }

      await this.sendNotificationToUser(userId, title, body, {
        type: 'watering_reminder',
        plantIds: plants.map((p) => p.id),
        plantCount,
      });
    }

    this.logger.log(
      `Sent watering reminders for ${plantsNeedingWater.length} plants to ${Object.keys(plantsByUser).length} users`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminder() {
    this.logger.log('Sending daily plant care reminders...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const upcomingWaterings = await this.prisma.plant.findMany({
      where: {
        nextWateringAt: {
          lte: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
          },
        },
      },
    });

    // Group by user
    const wateringsByUser = upcomingWaterings.reduce((acc, plant) => {
      const userId = plant.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: plant.user,
          plants: [],
        };
      }
      acc[userId].plants.push(plant);
      return acc;
    }, {});

    // Send daily reminders
    for (const [userId, data] of Object.entries(wateringsByUser)) {
      const { plants } = data as any;
      const plantCount = plants.length;

      if (plantCount > 0) {
        const title = '🌿 Rappel quotidien';
        const body = `${plantCount} plante${plantCount > 1 ? 's' : ''} à surveiller aujourd'hui`;

        await this.sendNotificationToUser(userId, title, body, {
          type: 'daily_reminder',
          plantIds: plants.map((p) => p.id),
          plantCount,
        });
      }
    }

    this.logger.log(
      `Sent daily reminders to ${Object.keys(wateringsByUser).length} users`,
    );
  }

  async testNotification(userId: string) {
    await this.sendNotificationToUser(
      userId,
      '🧪 Test de notification',
      'Si vous voyez ceci, les notifications fonctionnent !',
      { type: 'test' },
    );

    return { message: 'Test notification sent' };
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });
  }
}
