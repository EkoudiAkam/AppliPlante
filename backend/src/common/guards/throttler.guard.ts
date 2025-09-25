import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the default tracker
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    // Generate a unique key for rate limiting
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    return `${suffix}-${route}-${name}`;
  }
}
