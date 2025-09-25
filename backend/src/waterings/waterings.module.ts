import { Module } from '@nestjs/common';
import { WateringsService } from './waterings.service';
import { WateringsController } from './waterings.controller';

@Module({
  controllers: [WateringsController],
  providers: [WateringsService],
  exports: [WateringsService],
})
export class WateringsModule {}
