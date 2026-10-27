import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CostsService } from './costs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/costs')
@UseGuards(JwtAuthGuard)
export class CostsController {
  constructor(private costsService: CostsService) {}

  @Get()
  async getCostEstimate(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.costsService.getCostEstimate(projectId, userId);
  }

  @Post('calculate')
  async calculateCostEstimate(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.costsService.calculateCostEstimate(projectId, userId);
  }

  @Put()
  async updateCostEstimate(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.costsService.updateCostEstimate(projectId, userId, body);
  }
}
