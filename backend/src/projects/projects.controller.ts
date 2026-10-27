import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CalculationsService } from '../calculations/calculations.service';
import { MaterialsService } from '../materials/materials.service';
import { CostsService } from '../costs/costs.service';
import { BoqService } from '../boq/boq.service';

@Controller(['projects', 'project'])
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private calculationsService: CalculationsService,
    private materialsService: MaterialsService,
    private costsService: CostsService,
    private boqService: BoqService,
  ) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.projectsService.findAll(userId);
  }

  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    return this.projectsService.getStats(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.findOne(id, userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @Post(':id/initialize')
  async initialize(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.projectsService.initializeProject(id, userId, body);
  }

  @Get(':id/design')
  async getProjectDesign(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.getProjectDesign(id, userId);
  }

  @Put(':id/design')
  @Post(':id/save')
  async saveProjectDesign(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.projectsService.saveProjectDesign(id, userId, body);
  }

  @Post(':id/design/autosave')
  async autosaveProjectDesign(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.projectsService.saveProjectDesign(id, userId, body);
  }

  @Get(':id/quantities')
  async getQuantities(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.calculationsService.calculateProjectQuantities(id, userId);
  }

  @Get(':id/materials')
  async getMaterials(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const quantities = await this.calculationsService.calculateProjectQuantities(id, userId);
    return this.materialsService.calculateMaterialRequirements(quantities);
  }

  @Get(':id/labour')
  async getLabour(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const quantities = await this.calculationsService.calculateProjectQuantities(id, userId);
    return this.materialsService.calculateLabourRequirements(quantities);
  }

  @Get(':id/equipment')
  async getEquipment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const quantities = await this.calculationsService.calculateProjectQuantities(id, userId);
    return this.materialsService.calculateEquipmentRequirements(quantities);
  }

  @Get(':id/rate-analysis')
  async getRateAnalysis(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const quantities = await this.calculationsService.calculateProjectQuantities(id, userId);
    return this.materialsService.calculateRateAnalysis(quantities);
  }

  @Get(':id/cost')
  async getCost(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.costsService.getProjectCostEstimate(id, userId);
  }

  @Get(':id/boq')
  async getBoq(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.boqService.getProjectBoq(id, userId);
  }

  @Get(':id/reports')
  async getReports(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const project = await this.projectsService.findOne(id, userId);
    const quantities = await this.calculationsService.calculateProjectQuantities(id, userId);
    const costEstimate = await this.costsService.getProjectCostEstimate(id, userId);
    const boq = await this.boqService.getProjectBoq(id, userId);

    return {
      project,
      quantities,
      costEstimate,
      boq,
      generatedAt: new Date(),
    };
  }

  @Post(':id/reports/pdf')
  async generatePdfReport(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const project = await this.projectsService.findOne(id, userId);
    return {
      message: 'PDF Report data generated successfully',
      projectId: id,
      projectName: project.projectName,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/reports/excel')
  async generateExcelReport(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const project = await this.projectsService.findOne(id, userId);
    return {
      message: 'Excel Report data generated successfully',
      projectId: id,
      projectName: project.projectName,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.remove(id, userId);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.duplicate(id, userId);
  }

  @Get(':id/validate')
  async validateDesign(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.validateProjectDesign(id, userId);
  }

  @Get(':id/revisions')
  async getRevisions(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.getRevisions(id, userId);
  }

  @Post(':id/revisions')
  async createRevision(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { description?: string },
  ) {
    return this.projectsService.createRevision(id, userId, body.description);
  }

  @Post(':id/revisions/:revisionId/restore')
  async restoreRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.restoreRevision(id, revisionId, userId);
  }
}
