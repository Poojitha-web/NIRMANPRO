import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Get()
  async findAll() {
    return this.materialsService.findAll();
  }

  @Put(':id')
  async updateRate(@Param('id') id: string, @Body('unitRate') unitRate: number) {
    return this.materialsService.updateRate(id, unitRate);
  }
}
