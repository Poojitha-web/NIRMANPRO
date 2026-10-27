import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { BoqService } from '../boq/boq.service';

@Injectable()
export class CostsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectsService))
    private projectsService: ProjectsService,
    @Inject(forwardRef(() => BoqService))
    private boqService: BoqService,
  ) {}

  async getCostEstimate(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    let estimate = await this.prisma.costEstimate.findUnique({
      where: { projectId },
    });

    if (!estimate || estimate.totalCost === 0) {
      estimate = await this.calculateCostEstimate(projectId, userId);
    }

    return estimate;
  }

  async getProjectCostEstimate(projectId: string, userId: string) {
    return this.getCostEstimate(projectId, userId);
  }

  async calculateCostEstimate(projectId: string, userId: string) {
    const project = await this.projectsService.findOne(projectId, userId);
    
    // Get BOQ items sum
    const boqItems = await this.boqService.getBoqItems(projectId, userId);
    const materialCost = boqItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // Standard cost ratios:
    const laborCost = Number((materialCost * 0.30).toFixed(2));
    const equipmentCost = Number((materialCost * 0.10).toFixed(2));
    const directTotal = materialCost + laborCost + equipmentCost;

    // Use project configured rates
    const overheadPct = (project.overheadPercentage || 8) / 100;
    const gstPct = (project.gstRate || 18) / 100;
    const contingencyPct = (project.contingencyRate || 5) / 100;

    const overheads = Number((directTotal * overheadPct).toFixed(2));
    const taxableAmount = directTotal + overheads;
    const gst = Number((taxableAmount * gstPct).toFixed(2));
    const contingency = Number((taxableAmount * contingencyPct).toFixed(2));

    const totalCost = Number((taxableAmount + gst + contingency).toFixed(2));
    const numFloors = Math.max(1, project.numberOfFloors || 1);
    const costPerFloor = Number((totalCost / numFloors).toFixed(2));
    
    let builtUpArea = 0;
    for (const f of project.floors) {
      builtUpArea += (f.length || 10) * (f.width || 8);
    }
    const totalSqFt = (builtUpArea || 80) * 10.7639; // m² to sq ft
    const costPerSqFt = Number((totalCost / Math.max(1, totalSqFt)).toFixed(2));

    const estimate = await this.prisma.costEstimate.upsert({
      where: { projectId },
      update: {
        materialCost,
        laborCost,
        equipmentCost,
        overheads,
        gst,
        contingency,
        totalCost,
        costPerFloor,
        costPerSqFt,
      },
      create: {
        projectId,
        materialCost,
        laborCost,
        equipmentCost,
        overheads,
        gst,
        contingency,
        totalCost,
        costPerFloor,
        costPerSqFt,
      },
    });

    return estimate;
  }

  async updateCostEstimate(projectId: string, userId: string, data: any) {
    await this.projectsService.findOne(projectId, userId);

    const m = data.materialCost !== undefined ? Number(data.materialCost) : 0;
    const l = data.laborCost !== undefined ? Number(data.laborCost) : 0;
    const e = data.equipmentCost !== undefined ? Number(data.equipmentCost) : 0;
    const o = data.overheads !== undefined ? Number(data.overheads) : 0;
    const g = data.gst !== undefined ? Number(data.gst) : 0;
    const c = data.contingency !== undefined ? Number(data.contingency) : 0;

    const totalCost = Number((m + l + e + o + g + c).toFixed(2));

    return this.prisma.costEstimate.upsert({
      where: { projectId },
      update: {
        materialCost: m,
        laborCost: l,
        equipmentCost: e,
        overheads: o,
        gst: g,
        contingency: c,
        totalCost,
      },
      create: {
        projectId,
        materialCost: m,
        laborCost: l,
        equipmentCost: e,
        overheads: o,
        gst: g,
        contingency: c,
        totalCost,
      },
    });
  }
}
