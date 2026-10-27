import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.materialRate.findMany({
      orderBy: { materialName: 'asc' },
    });
  }

  async updateRate(id: string, unitRate: number) {
    const rate = await this.prisma.materialRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Material rate not found');

    return this.prisma.materialRate.update({
      where: { id },
      data: { unitRate },
    });
  }

  async calculateMaterialRequirements(quantities: any, rateSourceId?: string) {
    const materialRates = await this.prisma.materialRate.findMany({
      where: rateSourceId ? { rateSourceId } : {},
      orderBy: { materialName: 'asc' },
    });

    const rateMap = new Map<string, number>();
    materialRates.forEach((r) => {
      rateMap.set(r.materialName.toLowerCase(), r.unitRate);
      if (r.materialCode) rateMap.set(r.materialCode.toLowerCase(), r.unitRate);
    });

    const totalRcc = quantities.totalRccVolume || quantities.totalConcreteQuantity || 15;
    const totalSteel = quantities.totalSteelKg || 1200;
    const totalBrickwork = quantities.totalBrickworkQuantity || quantities.totalWallVolume || 10;
    const flooringArea = quantities.totalFlooringArea || 80;
    const plasterArea = quantities.totalPlasteringArea || 120;
    const paintArea = quantities.totalPaintingArea || 120;

    const cementBags = Math.ceil(totalRcc * 8 + totalBrickwork * 1.4 + plasterArea * 0.2);
    const sandCum = Number((totalRcc * 0.45 + totalBrickwork * 0.25 + plasterArea * 0.02).toFixed(2));
    const aggregateCum = Number((totalRcc * 0.85).toFixed(2));
    const bricksCount = Math.ceil(totalBrickwork * 500); // 500 bricks per cum
    const steelKg = Math.ceil(totalSteel);
    const tilesSqm = Number(flooringArea.toFixed(2));
    const paintLiters = Number((paintArea / 10).toFixed(2));

    const getRate = (keyword: string, fallback: number) => {
      const match = Array.from(rateMap.entries()).find(([k]) => k.includes(keyword.toLowerCase()));
      return match ? match[1] : fallback;
    };

    const materials = [
      {
        material: 'Cement (OPC/PPC 53 Grade)',
        unit: 'bags',
        quantity: cementBags,
        wastage: '5%',
        finalQuantity: Math.ceil(cementBags * 1.05),
        rate: getRate('cement', 380),
        totalCost: Math.ceil(cementBags * 1.05) * getRate('cement', 380),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Sand (Coarse & Fine M-Sand)',
        unit: 'cum',
        quantity: sandCum,
        wastage: '8%',
        finalQuantity: Number((sandCum * 1.08).toFixed(2)),
        rate: getRate('sand', 1200),
        totalCost: Number((sandCum * 1.08 * getRate('sand', 1200)).toFixed(2)),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Coarse Aggregate (20mm IS:383)',
        unit: 'cum',
        quantity: aggregateCum,
        wastage: '5%',
        finalQuantity: Number((aggregateCum * 1.05).toFixed(2)),
        rate: getRate('aggregate', 1400),
        totalCost: Number((aggregateCum * 1.05 * getRate('aggregate', 1400)).toFixed(2)),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Reinforcement Steel (Fe500 TMT)',
        unit: 'kg',
        quantity: steelKg,
        wastage: '5%',
        finalQuantity: Math.ceil(steelKg * 1.05),
        rate: getRate('steel', 75),
        totalCost: Math.ceil(steelKg * 1.05) * getRate('steel', 75),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Burnt Clay Bricks / AAC Blocks',
        unit: 'nos',
        quantity: bricksCount,
        wastage: '10%',
        finalQuantity: Math.ceil(bricksCount * 1.10),
        rate: getRate('brick', 9),
        totalCost: Math.ceil(bricksCount * 1.10) * getRate('brick', 9),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Vitrified Flooring Tiles (600x600)',
        unit: 'sqm',
        quantity: tilesSqm,
        wastage: '5%',
        finalQuantity: Number((tilesSqm * 1.05).toFixed(2)),
        rate: getRate('vitrified', 604),
        totalCost: Number((tilesSqm * 1.05 * getRate('vitrified', 604)).toFixed(2)),
        source: 'Telangana SoR 2026-27',
      },
      {
        material: 'Acrylic Emulsion Paint',
        unit: 'liters',
        quantity: paintLiters,
        wastage: '5%',
        finalQuantity: Number((paintLiters * 1.05).toFixed(2)),
        rate: getRate('emulsion', 233),
        totalCost: Number((paintLiters * 1.05 * getRate('emulsion', 233)).toFixed(2)),
        source: 'Telangana SoR 2026-27',
      },
    ];

    return {
      materials,
      totalMaterialCost: materials.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }

  async calculateLabourRequirements(quantities: any, zone: string = 'Zone-I', rateSourceId?: string) {
    const dbLabour = await this.prisma.labourRate.findMany({
      where: rateSourceId ? { rateSourceId } : {},
    });

    const getWage = (typeKeyword: string, fallback: number) => {
      const match = dbLabour.find((l) => l.labourType.toLowerCase().includes(typeKeyword.toLowerCase()));
      if (!match) return fallback;
      if (zone === 'Zone-II') return match.zoneIIRate || match.dailyRate;
      if (zone === 'Zone-III') return match.zoneIIIRate || match.dailyRate;
      return match.zoneIRate || match.dailyRate;
    };

    const totalRcc = quantities.totalRccVolume || quantities.totalConcreteQuantity || 15;
    const brickVol = quantities.totalBrickworkQuantity || 10;
    const plasterArea = quantities.totalPlasteringArea || 120;
    const paintArea = quantities.totalPaintingArea || 120;
    const steelKg = quantities.totalSteelKg || 1200;

    const masonDays = Math.ceil(brickVol / 1.2 + totalRcc / 2.5 + plasterArea / 15);
    const helperDays = Math.ceil(masonDays * 1.5);
    const carpenterDays = Math.ceil(totalRcc * 1.8);
    const barBenderDays = Math.ceil(steelKg / 150);
    const painterDays = Math.ceil(paintArea / 35);
    const electricianDays = Math.ceil(totalRcc * 0.4);
    const plumberDays = Math.ceil(totalRcc * 0.3);

    const masonWage = getWage('mason', 925);
    const helperWage = getWage('helper', 765);
    const carpenterWage = getWage('carpenter', 925);
    const barBenderWage = getWage('rebar', 940);
    const painterWage = getWage('painter', 900);
    const electricianWage = getWage('electrician', 895);
    const plumberWage = getWage('plumber', 910);

    const labour = [
      { workerType: 'Mason (Class I)', requiredWorkers: 4, productivity: '1.2 cum/day', labourDays: masonDays, wage: masonWage, totalCost: masonDays * masonWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Helper / Mazdoor', requiredWorkers: 6, productivity: '1.5 helpers/mason', labourDays: helperDays, wage: helperWage, totalCost: helperDays * helperWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Carpenter (Formwork)', requiredWorkers: 3, productivity: '2.5 sqm/day', labourDays: carpenterDays, wage: carpenterWage, totalCost: carpenterDays * carpenterWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Bar Bender (Steel)', requiredWorkers: 2, productivity: '150 kg/day', labourDays: barBenderDays, wage: barBenderWage, totalCost: barBenderDays * barBenderWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Painter', requiredWorkers: 2, productivity: '35 sqm/day', labourDays: painterDays, wage: painterWage, totalCost: painterDays * painterWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Electrician (Licensed)', requiredWorkers: 1, productivity: 'Point based', labourDays: electricianDays, wage: electricianWage, totalCost: electricianDays * electricianWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
      { workerType: 'Plumber', requiredWorkers: 1, productivity: 'Point based', labourDays: plumberDays, wage: plumberWage, totalCost: plumberDays * plumberWage, zone, source: 'G.O.Ms.No.6, LET&F Dept.' },
    ];

    return {
      zone,
      labour,
      totalLabourCost: labour.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }

  async calculateEquipmentRequirements(quantities: any, zone: string = 'Zone-I', rateSourceId?: string) {
    const dbEquipment = await this.prisma.equipmentRate.findMany({
      where: rateSourceId ? { rateSourceId } : {},
    });

    const getEquipRate = (keyword: string, fallback: number) => {
      const match = dbEquipment.find((e) => e.equipmentName.toLowerCase().includes(keyword.toLowerCase()));
      if (!match) return fallback;
      if (zone === 'Zone-II') return match.zoneIITotal || match.hourlyRate;
      if (zone === 'Zone-III') return match.zoneIIITotal || match.hourlyRate;
      return match.zoneITotal || match.hourlyRate;
    };

    const excavationVol = quantities.totalExcavationVolume || 20;
    const totalRcc = quantities.totalRccVolume || quantities.totalConcreteQuantity || 15;

    const excavatorHours = Math.ceil(excavationVol / 25);
    const mixerHours = Math.ceil(totalRcc * 1.5);
    const vibratorHours = Math.ceil(totalRcc * 1.0);
    const transitHours = Math.ceil(totalRcc / 6);
    const compactorHours = Math.ceil(excavationVol / 40);

    const excavatorRate = getEquipRate('shovel', 3969.3);
    const mixerRate = getEquipRate('mixer', 627.3);
    const vibratorRate = getEquipRate('vibrator', 339.5);
    const transitRate = getEquipRate('transit', 3042);
    const compactorRate = getEquipRate('roller', 1954.7);

    const equipment = [
      { equipmentName: 'Excavator / Shovel (0.85 cum)', quantity: 1, durationDays: Math.max(1, Math.ceil(excavatorHours / 8)), operatingHours: Math.max(2, excavatorHours), rate: excavatorRate, totalCost: Math.max(2, excavatorHours) * excavatorRate, zone, source: 'Telangana SoR 2026-27' },
      { equipmentName: 'Concrete Mixer (300/200 Ltr Diesel)', quantity: 1, durationDays: Math.max(1, Math.ceil(mixerHours / 8)), operatingHours: Math.max(4, mixerHours), rate: mixerRate, totalCost: Math.max(4, mixerHours) * mixerRate, zone, source: 'Telangana SoR 2026-27' },
      { equipmentName: 'Needle Vibrator 40mm (Petrol)', quantity: 2, durationDays: Math.max(1, Math.ceil(vibratorHours / 8)), operatingHours: Math.max(4, vibratorHours), rate: vibratorRate, totalCost: Math.max(4, vibratorHours) * vibratorRate, zone, source: 'Telangana SoR 2026-27' },
      { equipmentName: 'Transit Mixer 2 cum', quantity: 1, durationDays: Math.max(1, Math.ceil(transitHours / 8)), operatingHours: Math.max(3, transitHours), rate: transitRate, totalCost: Math.max(3, transitHours) * transitRate, zone, source: 'Telangana SoR 2026-27' },
      { equipmentName: 'Road Roller Diesel 10 t', quantity: 1, durationDays: Math.max(1, Math.ceil(compactorHours / 8)), operatingHours: Math.max(2, compactorHours), rate: compactorRate, totalCost: Math.max(2, compactorHours) * compactorRate, zone, source: 'Telangana SoR 2026-27' },
    ];

    return {
      zone,
      equipment,
      totalEquipmentCost: equipment.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }

  async calculateRateAnalysis(quantities: any, rateSourceId?: string) {
    const rateAnalysis = [
      {
        itemCode: 'MAS-01',
        itemName: 'Brickwork 230mm in CM 1:6',
        unit: 'cum',
        materialComponent: 4200.00,
        labourComponent: 1550.00,
        equipmentComponent: 150.00,
        wastagePct: 5,
        overheadPct: 10,
        finalRate: 6500.00,
        spec: 'IS:2212 Brick Masonry'
      },
      {
        itemCode: 'RCC-01',
        itemName: 'RCC M25 Structural Concrete',
        unit: 'cum',
        materialComponent: 5400.00,
        labourComponent: 1900.00,
        equipmentComponent: 350.00,
        wastagePct: 3,
        overheadPct: 8,
        finalRate: 8200.00,
        spec: 'IS:456 Plain & Reinforced Concrete'
      },
      {
        itemCode: 'STL-01',
        itemName: 'Fe500 TMT Steel Reinforcement',
        unit: 'kg',
        materialComponent: 58.00,
        labourComponent: 12.00,
        equipmentComponent: 2.00,
        wastagePct: 5,
        overheadPct: 5,
        finalRate: 75.00,
        spec: 'IS:1786 High Strength Deformed Steel Bars'
      },
      {
        itemCode: 'FIN-01',
        itemName: '12mm Wall Cement Plaster 1:4',
        unit: 'sqm',
        materialComponent: 140.00,
        labourComponent: 110.00,
        equipmentComponent: 10.00,
        wastagePct: 5,
        overheadPct: 8,
        finalRate: 280.00,
        spec: 'IS:1661 Cement Plastering'
      },
      {
        itemCode: 'FIN-02',
        itemName: 'Vitrified Tile Flooring 600x600mm',
        unit: 'sqm',
        materialComponent: 750.00,
        labourComponent: 340.00,
        equipmentComponent: 30.00,
        wastagePct: 5,
        overheadPct: 8,
        finalRate: 1200.00,
        spec: 'IS:15622 Ceramic & Vitrified Tiles'
      }
    ];

    return { rateAnalysis };
  }
}
