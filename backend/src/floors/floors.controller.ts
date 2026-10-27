import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FloorsService } from './floors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('floors')
@UseGuards(JwtAuthGuard)
export class FloorsController {
  constructor(private floorsService: FloorsService) {}

  @Get('project/:projectId')
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.floorsService.findByProject(projectId, userId);
  }

  @Post('project/:projectId')
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.floorsService.create(projectId, userId, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.floorsService.update(id, userId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.floorsService.remove(id, userId);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.floorsService.duplicateFloor(id, userId);
  }

  @Post(':id/copy-from/:sourceId')
  async copyFrom(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.floorsService.copyElements(id, sourceId, userId);
  }
}
