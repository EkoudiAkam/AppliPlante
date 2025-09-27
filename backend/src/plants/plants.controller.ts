import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('plants')
@UseGuards(JwtAuthGuard)
export class PlantsController {
  private readonly logger = new Logger(PlantsController.name);
  
  constructor(private readonly plantsService: PlantsService) {}

  @Post()
  async create(@Request() req, @Body() createPlantDto: CreatePlantDto) {
    this.logger.log('Received plant creation request');
    this.logger.log('Request body:', JSON.stringify(createPlantDto, null, 2));
    this.logger.log('User ID:', req.user.id);
    
    return this.plantsService.create(req.user.id, createPlantDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.plantsService.findAll(req.user.id);
  }

  @Get('needing-water')
  async getPlantsNeedingWater(@Request() req) {
    return this.plantsService.getPlantsNeedingWater(req.user.id);
  }

  @Get('upcoming-waterings')
  async getUpcomingWaterings(
    @Request() req,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.plantsService.getUpcomingWaterings(req.user.id, days);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.plantsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePlantDto: UpdatePlantDto,
  ) {
    return this.plantsService.update(id, req.user.id, updatePlantDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.plantsService.remove(id, req.user.id);
  }
}
