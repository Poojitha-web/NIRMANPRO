import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RatesService } from './rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatesController {
  constructor(private ratesService: RatesService) {}

  @Get('sources')
  async getRateSources() {
    return this.ratesService.getRateSources();
  }

  @Roles('ADMIN')
  @Post('sources')
  async createRateSource(@Body() body: any) {
    return this.ratesService.createRateSource(body);
  }

  @Roles('ADMIN')
  @Put('sources/:id/status')
  async updateSourceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ratesService.updateRateSourceStatus(id, status);
  }

  @Get('items')
  async getScheduleOfRates(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('rateSourceId') rateSourceId?: string,
    @Query('year') year?: string,
    @Query('state') state?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratesService.getScheduleOfRates({
      search,
      category,
      rateSourceId,
      year,
      state,
      page,
      limit,
    });
  }

  @Get('materials')
  async getMaterialRates(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('rateSourceId') rateSourceId?: string,
  ) {
    return this.ratesService.getMaterialRates({ search, category, rateSourceId });
  }

  @Get('labour')
  async getLabourRates(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('rateSourceId') rateSourceId?: string,
  ) {
    return this.ratesService.getLabourRates({ search, category, rateSourceId });
  }

  @Get('equipment')
  async getEquipmentRates(
    @Query('search') search?: string,
    @Query('rateSourceId') rateSourceId?: string,
  ) {
    return this.ratesService.getEquipmentRates({ search, rateSourceId });
  }

  @Roles('ADMIN')
  @Post('preview-excel')
  @UseInterceptors(FileInterceptor('file'))
  async previewExcel(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please upload a valid Excel file (.xlsx or .xls)');
    }
    return this.ratesService.parseExcelPreview(file.buffer);
  }

  @Roles('ADMIN')
  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
    @Body('config') configJson: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please upload an Excel file to import');
    }
    let config: any = {};
    if (configJson) {
      try {
        config = JSON.parse(configJson);
      } catch (_) {
        throw new BadRequestException('Invalid import configuration JSON');
      }
    }
    return this.ratesService.importExcelData(userId, file.originalname, file.buffer, config);
  }

  @Roles('ADMIN')
  @Get('import-logs')
  async getImportLogs() {
    return this.ratesService.getImportLogs();
  }

  @Post('snapshot/:projectId')
  async createEstimateSnapshot(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ratesService.createEstimateSnapshot(projectId, userId);
  }

  @Get('snapshot/:projectId')
  async getProjectSnapshots(@Param('projectId') projectId: string) {
    return this.ratesService.getProjectSnapshots(projectId);
  }
}
