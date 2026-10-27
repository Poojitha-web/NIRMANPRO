import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

export interface DetailedQuantityItem {
  id: string;
  itemCode: string;
  category: string;
  description: string;
  floorId?: string;
  floorName?: string;
  element: string;
  dimensions: string;
  formula: string;
  quantity: number;
  unit: string;
}

export interface FloorQuantityResult {
  floorId: string;
  floorName: string;
  floorArea: number;
  roomArea: number;
  totalWallLength: number;
  grossWallArea: number;
  doorArea: number;
  windowArea: number;
  netWallArea: number;
  wallVolume: number;
  brickworkQuantity: number;
  flooringArea: number;
  plasteringArea: number;
  paintingArea: number;
  rccColumnsVolume: number;
  rccBeamsVolume: number;
  rccSlabsVolume: number;
  rccFootingsVolume: number;
  concreteQuantity: number;
  rebarSteelKg: number;
  formworkArea: number;
  excavationVolume: number;
  pccVolume: number;
  roofingArea: number;
  waterproofingArea: number;
}

export interface BuildingQuantitySummary {
  projectId: string;
  projectName: string;
  unitSystem: string;
  floorCount: number;
  totalFloorArea: number;
  totalRoomArea: number;
  totalWallLength: number;
  totalGrossWallArea: number;
  totalDoorArea: number;
  totalWindowArea: number;
  totalNetWallArea: number;
  totalWallVolume: number;
  totalFlooringArea: number;
  totalPlasteringArea: number;
  totalPaintingArea: number;
  totalExcavationVolume: number;
  totalPccVolume: number;
  totalRccVolume: number;
  totalConcreteQuantity: number;
  totalSteelKg: number;
  totalFormworkArea: number;
  totalBrickworkQuantity: number;
  totalRoofingArea: number;
  totalWaterproofingArea: number;
  footingCount: number;
  columnCount: number;
  beamCount: number;
  slabCount: number;
  floorBreakdown: FloorQuantityResult[];
  detailedItems: DetailedQuantityItem[];
}

@Injectable()
export class CalculationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProjectsService))
    private projectsService: ProjectsService,
  ) {}

  async calculateProjectQuantities(projectId: string, userId: string): Promise<BuildingQuantitySummary> {
    const project = await this.projectsService.findOne(projectId, userId);
    const unitSys = project.unitSystem || 'metric';

    const floorResults: FloorQuantityResult[] = [];
    const detailedItems: DetailedQuantityItem[] = [];

    let globalFootingCount = 0;
    let globalColumnCount = 0;
    let globalBeamCount = 0;
    let globalSlabCount = 0;

    for (const floor of project.floors) {
      const floorArea = Math.max(0, (floor.length || 10) * (floor.width || 8));
      const roomArea = floor.rooms.reduce((sum, r) => sum + Math.max(0, r.area || r.length * r.width), 0) || floorArea;

      // 1. Walls
      let totalWallLength = 0;
      let grossWallArea = 0;
      let wallVol = 0;

      if (floor.walls.length > 0) {
        for (const w of floor.walls) {
          const l = w.length || Math.sqrt(Math.pow(w.endX - w.startX, 2) + Math.pow(w.endY - w.startY, 2));
          totalWallLength += l;
          const h = w.height || floor.wallHeight || 3.0;
          const th = w.thickness || floor.wallThickness || 0.23;
          grossWallArea += l * h;
          wallVol += l * h * th;
        }
      } else {
        totalWallLength = 2 * ((floor.length || 10) + (floor.width || 8));
        grossWallArea = totalWallLength * (floor.wallHeight || 3.0);
        wallVol = grossWallArea * (floor.wallThickness || 0.23);
      }

      // 2. Openings
      const doorArea = floor.doors.reduce((sum, d) => sum + Math.max(0, (d.width || 0.9) * (d.height || 2.1)), 0);
      const windowArea = floor.windows.reduce((sum, w) => sum + Math.max(0, (w.width || 1.2) * (w.height || 1.2)), 0);
      const netWallArea = Math.max(0, grossWallArea - doorArea - windowArea);
      const brickworkQuantity = Number((netWallArea * (floor.wallThickness || 0.23)).toFixed(2));

      // 3. Structural elements drawn or default
      let colVol = 0;
      let colRebar = 0;
      let colFormwork = 0;
      globalColumnCount += floor.columns.length;

      if (floor.columns.length > 0) {
        for (const c of floor.columns) {
          const v = (c.width || 0.3) * (c.depth || 0.3) * (c.height || floor.height || 3.0);
          colVol += v;
          colRebar += v * 160; // 160 kg/m3 for columns
          colFormwork += 2 * ((c.width || 0.3) + (c.depth || 0.3)) * (c.height || floor.height || 3.0);
        }
      } else {
        colVol = floorArea * 0.025;
        colRebar = colVol * 160;
        colFormwork = floorArea * 0.15;
      }

      let beamVol = 0;
      let beamRebar = 0;
      let beamFormwork = 0;
      globalBeamCount += floor.beams.length;

      if (floor.beams.length > 0) {
        for (const b of floor.beams) {
          const l = b.length || Math.sqrt(Math.pow(b.endX - b.startX, 2) + Math.pow(b.endY - b.startY, 2));
          const v = l * (b.width || 0.23) * (b.depth || 0.45);
          beamVol += v;
          beamRebar += v * 130; // 130 kg/m3 for beams
          beamFormwork += l * ((b.width || 0.23) + 2 * (b.depth || 0.45));
        }
      } else {
        beamVol = floorArea * 0.025;
        beamRebar = beamVol * 130;
        beamFormwork = floorArea * 0.15;
      }

      let slabVol = 0;
      let slabRebar = 0;
      let slabFormwork = 0;
      globalSlabCount += floor.slabs.length;

      if (floor.slabs.length > 0) {
        for (const s of floor.slabs) {
          const v = (s.length || floor.length) * (s.width || floor.width) * (s.thickness || 0.15);
          slabVol += v;
          slabRebar += v * 90; // 90 kg/m3 for slabs
          slabFormwork += (s.length || floor.length) * (s.width || floor.width);
        }
      } else {
        slabVol = floorArea * 0.15;
        slabRebar = slabVol * 90;
        slabFormwork = floorArea;
      }

      // 4. Foundations (Ground floor gets footings & excavation)
      let footingVol = 0;
      let footingRebar = 0;
      let excavationVol = 0;
      let pccVol = 0;

      if (floor.floorNumber === 0) {
        globalFootingCount += floor.footings.length;
        if (floor.footings.length > 0) {
          for (const ft of floor.footings) {
            const v = (ft.length || 1.5) * (ft.width || 1.5) * (ft.depth || 0.6);
            footingVol += v;
            footingRebar += v * 80;
            // Pit excavation with 0.3m offset
            const exc = ((ft.length || 1.5) + 0.6) * ((ft.width || 1.5) + 0.6) * ((ft.depth || 0.6) + (ft.pedestalH || 0.9) + 0.1);
            excavationVol += exc;
            pccVol += ((ft.length || 1.5) + 0.2) * ((ft.width || 1.5) + 0.2) * 0.1;
          }
        } else {
          // Estimated footings count (approx 6 footings for 80sqm)
          const estimatedFootingCount = Math.max(4, Math.ceil(floorArea / 15));
          globalFootingCount += estimatedFootingCount;
          footingVol = estimatedFootingCount * 1.5 * 1.5 * 0.6;
          footingRebar = footingVol * 80;
          excavationVol = estimatedFootingCount * 2.1 * 2.1 * 1.6;
          pccVol = estimatedFootingCount * 1.7 * 1.7 * 0.1;
        }
      }

      const totalConcrete = colVol + beamVol + slabVol + footingVol;
      const totalRebar = colRebar + beamRebar + slabRebar + footingRebar;
      const totalFormwork = colFormwork + beamFormwork + slabFormwork + (footingVol > 0 ? footingVol * 2 : 0);

      const flooringArea = Number(roomArea.toFixed(2));
      const plasteringArea = Number(((netWallArea * 2) + floorArea).toFixed(2));
      const paintingArea = Number(((netWallArea * 2) + floorArea).toFixed(2));

      // Roof & Waterproofing
      let roofArea = 0;
      let waterproofingArea = 0;
      if (floor.roofs.length > 0) {
        roofArea = floor.roofs.reduce((sum, r) => sum + ((r.length || floor.length) * (r.width || floor.width)), 0);
        waterproofingArea = roofArea;
      } else if (floor.floorNumber === project.floors.length - 1) {
        roofArea = floorArea;
        waterproofingArea = floorArea;
      }

      const floorResult: FloorQuantityResult = {
        floorId: floor.id,
        floorName: floor.floorName,
        floorArea: Number(floorArea.toFixed(2)),
        roomArea: Number(roomArea.toFixed(2)),
        totalWallLength: Number(totalWallLength.toFixed(2)),
        grossWallArea: Number(grossWallArea.toFixed(2)),
        doorArea: Number(doorArea.toFixed(2)),
        windowArea: Number(windowArea.toFixed(2)),
        netWallArea: Number(netWallArea.toFixed(2)),
        wallVolume: Number(wallVol.toFixed(2)),
        brickworkQuantity,
        flooringArea,
        plasteringArea,
        paintingArea,
        rccColumnsVolume: Number(colVol.toFixed(2)),
        rccBeamsVolume: Number(beamVol.toFixed(2)),
        rccSlabsVolume: Number(slabVol.toFixed(2)),
        rccFootingsVolume: Number(footingVol.toFixed(2)),
        concreteQuantity: Number(totalConcrete.toFixed(2)),
        rebarSteelKg: Number(totalRebar.toFixed(2)),
        formworkArea: Number(totalFormwork.toFixed(2)),
        excavationVolume: Number(excavationVol.toFixed(2)),
        pccVolume: Number(pccVol.toFixed(2)),
        roofingArea: Number(roofArea.toFixed(2)),
        waterproofingArea: Number(waterproofingArea.toFixed(2)),
      };

      floorResults.push(floorResult);

      // Populate detailed items with traceable formulas
      detailedItems.push(
        {
          id: `EXC-${floor.id}`,
          itemCode: 'EXC-01',
          category: 'Earthwork',
          description: `Foundation Excavation for ${floor.floorName}`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Foundation Pits',
          dimensions: `${floorResult.excavationVolume} m³`,
          formula: `Footings Pits Excavation = Pits Volume`,
          quantity: floorResult.excavationVolume,
          unit: 'cum',
        },
        {
          id: `PCC-${floor.id}`,
          itemCode: 'PCC-01',
          category: 'PCC Work',
          description: `Plain Cement Concrete 1:4:8 Bed under Footings`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'PCC Bed',
          dimensions: `${floorResult.pccVolume} m³`,
          formula: `Footing Area × 0.10m thickness`,
          quantity: floorResult.pccVolume,
          unit: 'cum',
        },
        {
          id: `BRK-${floor.id}`,
          itemCode: 'MAS-01',
          category: 'Masonry Work',
          description: `230mm Brick Masonry in CM 1:6 for ${floor.floorName}`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Walls',
          dimensions: `L=${floorResult.totalWallLength}m, H=${floor.wallHeight || 3}m`,
          formula: `(Gross Wall Area ${floorResult.grossWallArea}m² - Doors ${floorResult.doorArea}m² - Windows ${floorResult.windowArea}m²) × Thickness ${floor.wallThickness || 0.23}m`,
          quantity: floorResult.brickworkQuantity,
          unit: 'cum',
        },
        {
          id: `RCC-COL-${floor.id}`,
          itemCode: 'RCC-01',
          category: 'Structural RCC',
          description: `RCC M25 Concrete in Columns`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Columns',
          dimensions: `Vol=${floorResult.rccColumnsVolume} m³`,
          formula: `Sum of (Column Width × Depth × Height)`,
          quantity: floorResult.rccColumnsVolume,
          unit: 'cum',
        },
        {
          id: `RCC-SLB-${floor.id}`,
          itemCode: 'RCC-02',
          category: 'Structural RCC',
          description: `RCC M25 Concrete in Roof/Floor Slab`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Slab',
          dimensions: `Area=${floorResult.floorArea} m², T=0.15m`,
          formula: `Floor Area ${floorResult.floorArea}m² × Slab Thickness 0.15m`,
          quantity: floorResult.rccSlabsVolume,
          unit: 'cum',
        },
        {
          id: `STL-${floor.id}`,
          itemCode: 'STL-01',
          category: 'Reinforcement Steel',
          description: `Fe500 TMT Steel Bars in RCC Structure`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Rebar',
          dimensions: `${floorResult.rebarSteelKg} kg`,
          formula: `Column Steel (160kg/m³) + Beam Steel (130kg/m³) + Slab Steel (90kg/m³)`,
          quantity: floorResult.rebarSteelKg,
          unit: 'kg',
        },
        {
          id: `PLS-${floor.id}`,
          itemCode: 'FIN-01',
          category: 'Finishing Work',
          description: `12mm Internal & External Cement Plastering`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Plaster',
          dimensions: `${floorResult.plasteringArea} m²`,
          formula: `(Net Wall Area ${floorResult.netWallArea}m² × 2) + Ceiling Area ${floorResult.floorArea}m²`,
          quantity: floorResult.plasteringArea,
          unit: 'sqm',
        },
        {
          id: `FLR-${floor.id}`,
          itemCode: 'FIN-02',
          category: 'Flooring Work',
          description: `Vitrified Tile Flooring 600x600mm`,
          floorId: floor.id,
          floorName: floor.floorName,
          element: 'Flooring',
          dimensions: `${floorResult.flooringArea} m²`,
          formula: `Net Room Area = ${floorResult.flooringArea} m²`,
          quantity: floorResult.flooringArea,
          unit: 'sqm',
        }
      );
    }

    const totalFloorArea = floorResults.reduce((sum, f) => sum + f.floorArea, 0);
    const totalRoomArea = floorResults.reduce((sum, f) => sum + f.roomArea, 0);
    const totalWallLength = floorResults.reduce((sum, f) => sum + f.totalWallLength, 0);
    const totalGrossWallArea = floorResults.reduce((sum, f) => sum + f.grossWallArea, 0);
    const totalDoorArea = floorResults.reduce((sum, f) => sum + f.doorArea, 0);
    const totalWindowArea = floorResults.reduce((sum, f) => sum + f.windowArea, 0);
    const totalNetWallArea = floorResults.reduce((sum, f) => sum + f.netWallArea, 0);
    const totalWallVolume = floorResults.reduce((sum, f) => sum + f.wallVolume, 0);
    const totalFlooringArea = floorResults.reduce((sum, f) => sum + f.flooringArea, 0);
    const totalPlasteringArea = floorResults.reduce((sum, f) => sum + f.plasteringArea, 0);
    const totalPaintingArea = floorResults.reduce((sum, f) => sum + f.paintingArea, 0);
    const totalExcavationVolume = floorResults.reduce((sum, f) => sum + f.excavationVolume, 0);
    const totalPccVolume = floorResults.reduce((sum, f) => sum + f.pccVolume, 0);
    const totalConcreteQuantity = floorResults.reduce((sum, f) => sum + f.concreteQuantity, 0);
    const totalRccVolume = totalConcreteQuantity;
    const totalSteelKg = floorResults.reduce((sum, f) => sum + f.rebarSteelKg, 0);
    const totalFormworkArea = floorResults.reduce((sum, f) => sum + f.formworkArea, 0);
    const totalBrickworkQuantity = floorResults.reduce((sum, f) => sum + f.brickworkQuantity, 0);
    const totalRoofingArea = floorResults.reduce((sum, f) => sum + f.roofingArea, 0);
    const totalWaterproofingArea = floorResults.reduce((sum, f) => sum + f.waterproofingArea, 0);

    return {
      projectId: project.id,
      projectName: project.projectName,
      unitSystem: unitSys,
      floorCount: floorResults.length,
      totalFloorArea: Number(totalFloorArea.toFixed(2)),
      totalRoomArea: Number(totalRoomArea.toFixed(2)),
      totalWallLength: Number(totalWallLength.toFixed(2)),
      totalGrossWallArea: Number(totalGrossWallArea.toFixed(2)),
      totalDoorArea: Number(totalDoorArea.toFixed(2)),
      totalWindowArea: Number(totalWindowArea.toFixed(2)),
      totalNetWallArea: Number(totalNetWallArea.toFixed(2)),
      totalWallVolume: Number(totalWallVolume.toFixed(2)),
      totalFlooringArea: Number(totalFlooringArea.toFixed(2)),
      totalPlasteringArea: Number(totalPlasteringArea.toFixed(2)),
      totalPaintingArea: Number(totalPaintingArea.toFixed(2)),
      totalExcavationVolume: Number(totalExcavationVolume.toFixed(2)),
      totalPccVolume: Number(totalPccVolume.toFixed(2)),
      totalRccVolume: Number(totalRccVolume.toFixed(2)),
      totalConcreteQuantity: Number(totalConcreteQuantity.toFixed(2)),
      totalSteelKg: Number(totalSteelKg.toFixed(2)),
      totalFormworkArea: Number(totalFormworkArea.toFixed(2)),
      totalBrickworkQuantity: Number(totalBrickworkQuantity.toFixed(2)),
      totalRoofingArea: Number(totalRoofingArea.toFixed(2)),
      totalWaterproofingArea: Number(totalWaterproofingArea.toFixed(2)),
      footingCount: globalFootingCount,
      columnCount: globalColumnCount,
      beamCount: globalBeamCount,
      slabCount: globalSlabCount,
      floorBreakdown: floorResults,
      detailedItems,
    };
  }
}
