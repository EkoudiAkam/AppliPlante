import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { WateringsService } from './waterings.service';
import { CreateWateringDto } from './dto/create-watering.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('waterings')
@UseGuards(JwtAuthGuard)
export class WateringsController {
  constructor(private readonly wateringsService: WateringsService) {}

  @Post()
  async create(@Request() req, @Body() createWateringDto: CreateWateringDto) {
    return this.wateringsService.create(req.user.id, createWateringDto);
  }

  @Get()
  async findAll(@Request() req, @Query('plantId') plantId?: string) {
    return this.wateringsService.findAll(req.user.id, plantId);
  }

  @Get('stats')
  async getWateringStats(@Request() req, @Query('plantId') plantId?: string) {
    return this.wateringsService.getWateringStats(req.user.id, plantId);
  }

  @Get('history')
  async getWateringHistory(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.wateringsService.getWateringHistory(req.user.id, days);
  }

  @Get('plant/:plantId')
  async getWateringsByPlant(@Param('plantId') plantId: string, @Request() req) {
    return this.wateringsService.findAll(req.user.id, plantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.wateringsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.wateringsService.remove(id, req.user.id);
  }
}
