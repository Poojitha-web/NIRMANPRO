import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CalculationsService } from './calculations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/calculations')
@UseGuards(JwtAuthGuard)
export class CalculationsController {
  constructor(private calculationsService: CalculationsService) {}

  @Get()
  async getCalculations(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.calculationsService.calculateProjectQuantities(projectId, userId);
  }
}
