import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('floors/:floorId/design')
@UseGuards(JwtAuthGuard)
export class DesignsController {
  constructor(private designsService: DesignsService) {}

  @Get()
  async getDesign(@Param('floorId') floorId: string) {
    return this.designsService.getFloorDesign(floorId);
  }

  @Put()
  async saveDesign(
    @Param('floorId') floorId: string,
    @Body() body: {
      walls: any[];
      rooms: any[];
      doors: any[];
      windows: any[];
      gridScale?: number;
      layoutData?: any;
    },
  ) {
    return this.designsService.saveFloorDesign(floorId, body);
  }
}
