import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BoqService } from './boq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/boq')
@UseGuards(JwtAuthGuard)
export class BoqController {
  constructor(private boqService: BoqService) {}

  @Get()
  async getBoqItems(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boqService.getBoqItems(projectId, userId);
  }

  @Post('generate')
  async generateBoq(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boqService.generateBoq(projectId, userId);
  }

  @Post()
  async addCustomItem(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.boqService.addCustomItem(projectId, userId, body);
  }

  @Put(':itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.boqService.updateItem(itemId, userId, body);
  }

  @Delete(':itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boqService.removeItem(itemId, userId);
  }
}
