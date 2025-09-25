import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  async subscribeToPush(
    @Request() req,
    @Body() subscribeDto: SubscribePushDto,
  ) {
    return this.notificationsService.subscribeToPush(req.user.id, subscribeDto);
  }

  @Delete('unsubscribe/:endpoint')
  async unsubscribeFromPush(
    @Request() req,
    @Param('endpoint') endpoint: string,
  ) {
    // Decode the endpoint parameter
    const decodedEndpoint = decodeURIComponent(endpoint);
    return this.notificationsService.unsubscribeFromPush(
      req.user.id,
      decodedEndpoint,
    );
  }

  @Get('subscriptions')
  async getUserSubscriptions(@Request() req) {
    return this.notificationsService.getUserSubscriptions(req.user.id);
  }

  @Post('test')
  async testNotification(@Request() req) {
    return this.notificationsService.testNotification(req.user.id);
  }
}
