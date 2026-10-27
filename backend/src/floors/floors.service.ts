import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class FloorsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  async findByProject(projectId: string, userId: string) {
    await this.projectsService.findOne(projectId, userId);
    return this.prisma.floor.findMany({
      where: { projectId },
      include: {
        walls: true,
        rooms: true,
        doors: true,
        windows: true,
        designLayout: true,
      },
      orderBy: { floorNumber: 'asc' },
    });
  }

  async create(projectId: string, userId: string, data: any) {
    await this.projectsService.findOne(projectId, userId);
    const count = await this.prisma.floor.count({ where: { projectId } });
    const floor = await this.prisma.floor.create({
      data: {
        projectId,
        floorName: data.floorName || `Floor ${count}`,
        floorNumber: count,
        length: data.length || 10,
        width: data.width || 8,
        height: data.height || 3.0,
        wallHeight: data.wallHeight || 3.0,
        wallThickness: data.wallThickness || 0.23,
      },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { numberOfFloors: count + 1 },
    });

    return floor;
  }

  async update(floorId: string, userId: string, data: any) {
    const floor = await this.prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw new NotFoundException('Floor not found');
    await this.projectsService.findOne(floor.projectId, userId);

    return this.prisma.floor.update({
      where: { id: floorId },
      data,
    });
  }

  async remove(floorId: string, userId: string) {
    const floor = await this.prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw new NotFoundException('Floor not found');
    await this.projectsService.findOne(floor.projectId, userId);

    const deleted = await this.prisma.floor.delete({ where: { id: floorId } });
    const count = await this.prisma.floor.count({ where: { projectId: floor.projectId } });
    
    await this.prisma.project.update({
      where: { id: floor.projectId },
      data: { numberOfFloors: Math.max(1, count) },
    });

    return deleted;
  }

  async duplicateFloor(floorId: string, userId: string) {
    const sourceFloor = await this.prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        walls: true,
        rooms: true,
        doors: true,
        windows: true,
        columns: true,
        beams: true,
        slabs: true,
        staircases: true,
        footings: true,
        roofs: true,
        designLayout: true,
      },
    });
    if (!sourceFloor) throw new NotFoundException('Source floor not found');
    await this.projectsService.findOne(sourceFloor.projectId, userId);

    const count = await this.prisma.floor.count({ where: { projectId: sourceFloor.projectId } });

    return this.prisma.$transaction(async (tx) => {
      const newFloor = await tx.floor.create({
        data: {
          projectId: sourceFloor.projectId,
          floorName: `${sourceFloor.floorName} (Copy)`,
          floorNumber: count,
          length: sourceFloor.length,
          width: sourceFloor.width,
          height: sourceFloor.height,
          wallHeight: sourceFloor.wallHeight,
          wallThickness: sourceFloor.wallThickness,
        },
      });

      let wallsToClone: any[] = sourceFloor.walls;
      let colsToClone: any[] = sourceFloor.columns;
      let doorsToClone: any[] = sourceFloor.doors;
      let windowsToClone: any[] = sourceFloor.windows;
      let footingsToClone: any[] = sourceFloor.footings;
      let beamsToClone: any[] = sourceFloor.beams;
      let slabsToClone: any[] = sourceFloor.slabs;

      if (wallsToClone.length === 0 && sourceFloor.designLayout?.layoutData) {
        try {
          const parsed = typeof sourceFloor.designLayout.layoutData === 'string'
            ? JSON.parse(sourceFloor.designLayout.layoutData)
            : sourceFloor.designLayout.layoutData;
          if (parsed) {
            if (Array.isArray(parsed.walls)) wallsToClone = parsed.walls;
            if (Array.isArray(parsed.columns)) colsToClone = parsed.columns;
            if (Array.isArray(parsed.doors)) doorsToClone = parsed.doors;
            if (Array.isArray(parsed.windows)) windowsToClone = parsed.windows;
            if (Array.isArray(parsed.foundations || parsed.footings)) footingsToClone = parsed.foundations || parsed.footings;
            if (Array.isArray(parsed.beams)) beamsToClone = parsed.beams;
            if (Array.isArray(parsed.slabs)) slabsToClone = parsed.slabs;
          }
        } catch (_) {}
      }

      const wallMap: Record<string, string> = {};
      for (const w of wallsToClone) {
        const newWall = await tx.wall.create({
          data: {
            floorId: newFloor.id,
            startX: Number(w.startX) || 0,
            startY: Number(w.startY) || 0,
            endX: Number(w.endX) || 0,
            endY: Number(w.endY) || 0,
            length: Number(w.length) || 1,
            height: Number(w.height) || 3.0,
            thickness: Number(w.thickness) || 0.23,
            wallType: w.wallType || 'brick',
            material: w.material || 'brick',
          },
        });
        if (w.id) wallMap[w.id] = newWall.id;
      }

      for (const d of doorsToClone) {
        const wId = wallMap[d.wallId] || Object.values(wallMap)[0] || d.wallId;
        if (wId) {
          await tx.door.create({
            data: {
              floorId: newFloor.id,
              wallId: wId,
              width: Number(d.width) || 0.9,
              height: Number(d.height) || 2.1,
              doorType: d.doorType || 'single',
              material: d.material || 'Wood',
              position: Number(d.position) || 0.5,
            },
          });
        }
      }

      for (const win of windowsToClone) {
        const wId = wallMap[win.wallId] || Object.values(wallMap)[0] || win.wallId;
        if (wId) {
          await tx.window.create({
            data: {
              floorId: newFloor.id,
              wallId: wId,
              width: Number(win.width) || 1.2,
              height: Number(win.height) || 1.2,
              windowType: win.windowType || 'sliding',
              frameMaterial: win.frameMaterial || 'UPVC',
              position: Number(win.position) || 0.5,
              sillHeight: Number(win.sillHeight) || 0.9,
            },
          });
        }
      }

      const colMap: Record<string, string> = {};
      for (const col of colsToClone) {
        const newCol = await tx.column.create({
          data: {
            floorId: newFloor.id,
            columnId: col.columnId || col.id || 'C-1',
            x: Number(col.x) || 0,
            y: Number(col.y) || 0,
            width: Number(col.width) || 0.3,
            depth: Number(col.depth) || 0.3,
            height: Number(col.height) || 3.0,
            concreteGrade: col.concreteGrade || 'M25',
            reinforcement: Number(col.reinforcement) || 1.5,
          },
        });
        if (col.id) colMap[col.id] = newCol.id;
      }

      for (const ft of footingsToClone) {
        await tx.footing.create({
          data: {
            floorId: newFloor.id,
            footingId: ft.footingId || ft.id || 'F-1',
            columnId: ft.columnId ? (colMap[ft.columnId] || null) : null,
            x: Number(ft.x) || 0,
            y: Number(ft.y) || 0,
            length: Number(ft.length) || 1.5,
            width: Number(ft.width) || 1.5,
            depth: Number(ft.depth) || 0.6,
            pedestalH: Number(ft.pedestalH) || 0.9,
            gradeBeamL: Number(ft.gradeBeamL) || 3.0,
            concreteGrade: ft.concreteGrade || 'M25',
          },
        });
      }

      for (const b of beamsToClone) {
        await tx.beam.create({
          data: {
            floorId: newFloor.id,
            startX: Number(b.startX) || 0,
            startY: Number(b.startY) || 0,
            endX: Number(b.endX) || 0,
            endY: Number(b.endY) || 0,
            length: Number(b.length) || 3.0,
            width: Number(b.width) || 0.23,
            depth: Number(b.depth) || 0.45,
            concreteGrade: b.concreteGrade || 'M25',
            reinforcement: Number(b.reinforcement) || 1.5,
          },
        });
      }

      for (const s of slabsToClone) {
        await tx.slab.create({
          data: {
            floorId: newFloor.id,
            x: Number(s.x) || 0,
            y: Number(s.y) || 0,
            length: Number(s.length) || 5.0,
            width: Number(s.width) || 4.0,
            thickness: Number(s.thickness) || 0.15,
            concreteGrade: s.concreteGrade || 'M25',
          },
        });
      }

      for (const st of sourceFloor.staircases) {
        await tx.staircase.create({
          data: {
            floorId: newFloor.id,
            x: st.x,
            y: st.y,
            stairWidth: st.stairWidth,
            numSteps: st.numSteps,
            riser: st.riser,
            tread: st.tread,
            stairType: st.stairType,
          },
        });
      }

      for (const r of sourceFloor.roofs) {
        await tx.roof.create({
          data: {
            floorId: newFloor.id,
            x: r.x,
            y: r.y,
            length: r.length,
            width: r.width,
            roofType: r.roofType,
            roofingMaterial: r.roofingMaterial,
            waterproofing: r.waterproofing,
          },
        });
      }

      for (const rm of sourceFloor.rooms) {
        await tx.room.create({
          data: {
            floorId: newFloor.id,
            roomName: rm.roomName,
            x: rm.x,
            y: rm.y,
            length: rm.length,
            width: rm.width,
            area: rm.area,
            flooringType: rm.flooringType,
          },
        });
      }

      if (sourceFloor.designLayout) {
        await tx.designLayout.create({
          data: {
            floorId: newFloor.id,
            gridScale: sourceFloor.designLayout.gridScale,
            layoutData: sourceFloor.designLayout.layoutData,
          },
        });
      }

      await tx.project.update({
        where: { id: sourceFloor.projectId },
        data: { numberOfFloors: count + 1 },
      });

      return tx.floor.findUnique({
        where: { id: newFloor.id },
        include: {
          walls: true,
          rooms: true,
          doors: true,
          windows: true,
          columns: true,
          beams: true,
          slabs: true,
          staircases: true,
          footings: true,
          roofs: true,
          designLayout: true,
        },
      });
    });
  }

  async copyElements(targetFloorId: string, sourceFloorId: string, userId: string) {
    const targetFloor = await this.prisma.floor.findUnique({ where: { id: targetFloorId } });
    if (!targetFloor) throw new NotFoundException('Target floor not found');
    await this.projectsService.findOne(targetFloor.projectId, userId);

    const sourceFloor = await this.prisma.floor.findUnique({
      where: { id: sourceFloorId },
      include: {
        walls: true,
        rooms: true,
        doors: true,
        windows: true,
        columns: true,
        beams: true,
        slabs: true,
        staircases: true,
        footings: true,
        roofs: true,
        designLayout: true,
      },
    });
    if (!sourceFloor) throw new NotFoundException('Source floor not found');
    await this.projectsService.findOne(sourceFloor.projectId, userId);

    return this.prisma.$transaction(async (tx) => {
      // Clear existing elements on target floor
      await tx.door.deleteMany({ where: { floorId: targetFloorId } });
      await tx.window.deleteMany({ where: { floorId: targetFloorId } });
      await tx.footing.deleteMany({ where: { floorId: targetFloorId } });
      await tx.column.deleteMany({ where: { floorId: targetFloorId } });
      await tx.beam.deleteMany({ where: { floorId: targetFloorId } });
      await tx.slab.deleteMany({ where: { floorId: targetFloorId } });
      await tx.staircase.deleteMany({ where: { floorId: targetFloorId } });
      await tx.roof.deleteMany({ where: { floorId: targetFloorId } });
      await tx.room.deleteMany({ where: { floorId: targetFloorId } });
      await tx.wall.deleteMany({ where: { floorId: targetFloorId } });

      let wallsToClone: any[] = sourceFloor.walls;
      let colsToClone: any[] = sourceFloor.columns;
      let doorsToClone: any[] = sourceFloor.doors;
      let windowsToClone: any[] = sourceFloor.windows;
      let footingsToClone: any[] = sourceFloor.footings;
      let beamsToClone: any[] = sourceFloor.beams;
      let slabsToClone: any[] = sourceFloor.slabs;

      if (wallsToClone.length === 0 && sourceFloor.designLayout?.layoutData) {
        try {
          const parsed = typeof sourceFloor.designLayout.layoutData === 'string'
            ? JSON.parse(sourceFloor.designLayout.layoutData)
            : sourceFloor.designLayout.layoutData;
          if (parsed) {
            if (Array.isArray(parsed.walls)) wallsToClone = parsed.walls;
            if (Array.isArray(parsed.columns)) colsToClone = parsed.columns;
            if (Array.isArray(parsed.doors)) doorsToClone = parsed.doors;
            if (Array.isArray(parsed.windows)) windowsToClone = parsed.windows;
            if (Array.isArray(parsed.foundations || parsed.footings)) footingsToClone = parsed.foundations || parsed.footings;
            if (Array.isArray(parsed.beams)) beamsToClone = parsed.beams;
            if (Array.isArray(parsed.slabs)) slabsToClone = parsed.slabs;
          }
        } catch (_) {}
      }

      const wallMap: Record<string, string> = {};
      for (const w of wallsToClone) {
        const newWall = await tx.wall.create({
          data: {
            floorId: targetFloorId,
            startX: Number(w.startX) || 0,
            startY: Number(w.startY) || 0,
            endX: Number(w.endX) || 0,
            endY: Number(w.endY) || 0,
            length: Number(w.length) || 1,
            height: Number(w.height) || 3.0,
            thickness: Number(w.thickness) || 0.23,
            wallType: w.wallType || 'brick',
            material: w.material || 'brick',
          },
        });
        if (w.id) wallMap[w.id] = newWall.id;
      }

      for (const d of doorsToClone) {
        const wId = wallMap[d.wallId] || Object.values(wallMap)[0] || d.wallId;
        if (wId) {
          await tx.door.create({
            data: {
              floorId: targetFloorId,
              wallId: wId,
              width: Number(d.width) || 0.9,
              height: Number(d.height) || 2.1,
              doorType: d.doorType || 'single',
              material: d.material || 'Wood',
              position: Number(d.position) || 0.5,
            },
          });
        }
      }

      for (const win of windowsToClone) {
        const wId = wallMap[win.wallId] || Object.values(wallMap)[0] || win.wallId;
        if (wId) {
          await tx.window.create({
            data: {
              floorId: targetFloorId,
              wallId: wId,
              width: Number(win.width) || 1.2,
              height: Number(win.height) || 1.2,
              windowType: win.windowType || 'sliding',
              frameMaterial: win.frameMaterial || 'UPVC',
              position: Number(win.position) || 0.5,
              sillHeight: Number(win.sillHeight) || 0.9,
            },
          });
        }
      }

      const colMap: Record<string, string> = {};
      for (const col of colsToClone) {
        const newCol = await tx.column.create({
          data: {
            floorId: targetFloorId,
            columnId: col.columnId || col.id || 'C-1',
            x: Number(col.x) || 0,
            y: Number(col.y) || 0,
            width: Number(col.width) || 0.3,
            depth: Number(col.depth) || 0.3,
            height: Number(col.height) || 3.0,
            concreteGrade: col.concreteGrade || 'M25',
            reinforcement: Number(col.reinforcement) || 1.5,
          },
        });
        if (col.id) colMap[col.id] = newCol.id;
      }

      for (const ft of footingsToClone) {
        await tx.footing.create({
          data: {
            floorId: targetFloorId,
            footingId: ft.footingId || ft.id || 'F-1',
            columnId: ft.columnId ? (colMap[ft.columnId] || null) : null,
            x: Number(ft.x) || 0,
            y: Number(ft.y) || 0,
            length: Number(ft.length) || 1.5,
            width: Number(ft.width) || 1.5,
            depth: Number(ft.depth) || 0.6,
            pedestalH: Number(ft.pedestalH) || 0.9,
            gradeBeamL: Number(ft.gradeBeamL) || 3.0,
            concreteGrade: ft.concreteGrade || 'M25',
          },
        });
      }

      for (const b of sourceFloor.beams) {
        await tx.beam.create({
          data: {
            floorId: targetFloorId,
            startX: b.startX,
            startY: b.startY,
            endX: b.endX,
            endY: b.endY,
            length: b.length,
            width: b.width,
            depth: b.depth,
            concreteGrade: b.concreteGrade,
            reinforcement: b.reinforcement,
          },
        });
      }

      for (const s of sourceFloor.slabs) {
        await tx.slab.create({
          data: {
            floorId: targetFloorId,
            x: s.x,
            y: s.y,
            length: s.length,
            width: s.width,
            thickness: s.thickness,
            concreteGrade: s.concreteGrade,
          },
        });
      }

      for (const st of sourceFloor.staircases) {
        await tx.staircase.create({
          data: {
            floorId: targetFloorId,
            x: st.x,
            y: st.y,
            stairWidth: st.stairWidth,
            numSteps: st.numSteps,
            riser: st.riser,
            tread: st.tread,
            stairType: st.stairType,
          },
        });
      }

      for (const r of sourceFloor.roofs) {
        await tx.roof.create({
          data: {
            floorId: targetFloorId,
            x: r.x,
            y: r.y,
            length: r.length,
            width: r.width,
            roofType: r.roofType,
            roofingMaterial: r.roofingMaterial,
            waterproofing: r.waterproofing,
          },
        });
      }

      for (const rm of sourceFloor.rooms) {
        await tx.room.create({
          data: {
            floorId: targetFloorId,
            roomName: rm.roomName,
            x: rm.x,
            y: rm.y,
            length: rm.length,
            width: rm.width,
            area: rm.area,
            flooringType: rm.flooringType,
          },
        });
      }

      if (sourceFloor.designLayout) {
        await tx.designLayout.upsert({
          where: { floorId: targetFloorId },
          update: {
            gridScale: sourceFloor.designLayout.gridScale,
            layoutData: sourceFloor.designLayout.layoutData,
          },
          create: {
            floorId: targetFloorId,
            gridScale: sourceFloor.designLayout.gridScale,
            layoutData: sourceFloor.designLayout.layoutData,
          },
        });
      }

      return tx.floor.findUnique({
        where: { id: targetFloorId },
        include: {
          walls: true,
          rooms: true,
          doors: true,
          windows: true,
          columns: true,
          beams: true,
          slabs: true,
          staircases: true,
          footings: true,
          roofs: true,
          designLayout: true,
        },
      });
    });
  }
}

