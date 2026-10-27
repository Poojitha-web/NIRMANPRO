import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CalculationsService } from '../calculations/calculations.service';

@Injectable()
export class BoqService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectsService))
    private projectsService: ProjectsService,
    @Inject(forwardRef(() => CalculationsService))
    private calculationsService: CalculationsService,
  ) {}

  async getBoqItems(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    const items = await this.prisma.boqItem.findMany({
      where: { projectId },
      orderBy: { itemNumber: 'asc' },
    });

    if (!items || items.length === 0) {
      return this.generateBoq(projectId, userId);
    }
    return items;
  }

  async getProjectBoq(projectId: string, userId: string) {
    const items = await this.getBoqItems(projectId, userId);
    const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    return {
      projectId,
      items,
      totalAmount,
      totalItems: items.length,
    };
  }

  async generateBoq(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    const qty = await this.calculationsService.calculateProjectQuantities(projectId, userId);

    const materialRates = await this.prisma.materialRate.findMany();
    const rateMap = new Map<string, number>();
    materialRates.forEach(m => rateMap.set(m.materialName.toLowerCase(), m.unitRate));

    const getRate = (name: string, defaultRate: number) => {
      const match = Array.from(rateMap.entries()).find(([k]) => k.includes(name.toLowerCase()));
      return match ? match[1] : defaultRate;
    };

    const itemsToCreate = [
      {
        itemNumber: 1,
        itemName: 'Earth Excavation for Foundation',
        description: 'Excavation in ordinary soil including trimming of sides and ramming of bottom',
        unit: 'cum',
        quantity: Math.max(10, qty.totalExcavationVolume || 10),
        unitRate: getRate('Excavation', 250),
        category: 'Foundation Work',
      },
      {
        itemNumber: 2,
        itemName: 'Plain Cement Concrete (PCC 1:4:8)',
        description: 'PCC bed under foundation with coarse aggregate 40mm nominal size',
        unit: 'cum',
        quantity: Math.max(2, qty.totalPccVolume || 4),
        unitRate: getRate('PCC', 4500),
        category: 'Foundation Work',
      },
      {
        itemNumber: 3,
        itemName: 'Reinforced Cement Concrete (RCC M25)',
        description: 'RCC work in slabs, beams, columns, and lintels including shuttering',
        unit: 'cum',
        quantity: Math.max(5, qty.totalConcreteQuantity || 15),
        unitRate: getRate('RCC (M25)', 8200),
        category: 'Structural Work',
      },
      {
        itemNumber: 4,
        itemName: 'Steel Reinforcement (Fe 500 TMT Bars)',
        description: 'High yield strength deformed steel bars for RCC structures',
        unit: 'kg',
        quantity: Math.max(200, (qty.totalConcreteQuantity || 15) * 80),
        unitRate: getRate('Reinforcement Steel', 75),
        category: 'Structural Work',
      },
      {
        itemNumber: 5,
        itemName: 'Brickwork Construction (230mm Thick)',
        description: 'First class brick masonry in cement mortar 1:6 for main walls',
        unit: 'cum',
        quantity: Math.max(5, qty.totalWallVolume || 12),
        unitRate: getRate('Brickwork (230mm)', 6500),
        category: 'Masonry Work',
      },
      {
        itemNumber: 6,
        itemName: 'Cement Plastering (12mm Thick)',
        description: 'Internal & external wall plastering in cement mortar 1:4',
        unit: 'sqm',
        quantity: Math.max(20, qty.totalPlasteringArea || 120),
        unitRate: getRate('Cement Plaster (12mm)', 280),
        category: 'Finishing Work',
      },
      {
        itemNumber: 7,
        itemName: 'Flooring (Vitrified Tiles)',
        description: 'Premium vitrified tiles 600x600mm laid on cement mortar bed',
        unit: 'sqm',
        quantity: Math.max(10, qty.totalFlooringArea || 80),
        unitRate: getRate('Vitrified Tiles', 1200),
        category: 'Finishing Work',
      },
      {
        itemNumber: 8,
        itemName: 'Wooden Flush Doors',
        description: 'Teak wood framed flush doors with stainless steel fittings',
        unit: 'sqm',
        quantity: Math.max(2, qty.totalDoorArea || 6),
        unitRate: getRate('Wooden Door', 4500),
        category: 'Doors & Windows',
      },
      {
        itemNumber: 9,
        itemName: 'UPVC Sliding Windows',
        description: 'Three-track UPVC sliding windows with 5mm clear glass and mosquito mesh',
        unit: 'sqm',
        quantity: Math.max(2, qty.totalWindowArea || 8),
        unitRate: getRate('UPVC Window', 4500),
        category: 'Doors & Windows',
      },
      {
        itemNumber: 10,
        itemName: 'Painting & Finishing (2 Coats Emulsion)',
        description: 'Application of 1 coat primer and 2 coats premium acrylic emulsion paint',
        unit: 'sqm',
        quantity: Math.max(20, qty.totalPaintingArea || 150),
        unitRate: getRate('Painting', 180),
        category: 'Painting Work',
      },
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.boqItem.deleteMany({ where: { projectId } });

      for (const item of itemsToCreate) {
        const q = Number(item.quantity.toFixed(2));
        const r = Number(item.unitRate.toFixed(2));
        await tx.boqItem.create({
          data: {
            projectId,
            itemNumber: item.itemNumber,
            itemName: item.itemName,
            description: item.description,
            unit: item.unit,
            quantity: q,
            unitRate: r,
            totalAmount: Number((q * r).toFixed(2)),
            category: item.category,
            isCustom: false,
          },
        });
      }
    });

    const items = await this.prisma.boqItem.findMany({
      where: { projectId },
      orderBy: { itemNumber: 'asc' },
    });

    return items;
  }

  async addCustomItem(projectId: string, userId: string, data: any) {
    await this.projectsService.findOne(projectId, userId);
    const count = await this.prisma.boqItem.count({ where: { projectId } });
    const q = Number(data.quantity || 1);
    const r = Number(data.unitRate || 0);

    return this.prisma.boqItem.create({
      data: {
        projectId,
        itemNumber: count + 1,
        itemName: data.itemName,
        description: data.description,
        unit: data.unit || 'nos',
        quantity: q,
        unitRate: r,
        totalAmount: Number((q * r).toFixed(2)),
        category: data.category || 'Custom Work',
        isCustom: true,
      },
    });
  }

  async updateItem(itemId: string, userId: string, data: any) {
    const item = await this.prisma.boqItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('BOQ item not found');
    await this.projectsService.findOne(item.projectId, userId);

    const q = data.quantity !== undefined ? Number(data.quantity) : item.quantity;
    const r = data.unitRate !== undefined ? Number(data.unitRate) : item.unitRate;

    return this.prisma.boqItem.update({
      where: { id: itemId },
      data: {
        ...data,
        quantity: q,
        unitRate: r,
        totalAmount: Number((q * r).toFixed(2)),
      },
    });
  }

  async removeItem(itemId: string, userId: string) {
    const item = await this.prisma.boqItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('BOQ item not found');
    await this.projectsService.findOne(item.projectId, userId);

    return this.prisma.boqItem.delete({ where: { id: itemId } });
  }
}
