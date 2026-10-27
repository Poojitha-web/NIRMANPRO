import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DesignsService {
  constructor(private prisma: PrismaService) {}

  async getFloorDesign(floorId: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        walls: true,
        rooms: true,
        doors: true,
        windows: true,
        designLayout: true,
      },
    });

    if (!floor) throw new NotFoundException('Floor not found');

    // Parse layoutData string back to JSON if present
    if (floor.designLayout && typeof floor.designLayout.layoutData === 'string') {
      try {
        (floor.designLayout as any).layoutData = JSON.parse(floor.designLayout.layoutData);
      } catch (_) {}
    }
    return floor;
  }

  async saveFloorDesign(floorId: string, payload: {
    walls: any[];
    rooms: any[];
    doors: any[];
    windows: any[];
    gridScale?: number;
    layoutData?: any;
  }) {
    const floor = await this.prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw new NotFoundException('Floor not found');

    // Transaction to replace walls, rooms, doors, windows, layout
    await this.prisma.$transaction(async (tx) => {
      // Clear existing floor elements
      await tx.door.deleteMany({ where: { floorId } });
      await tx.window.deleteMany({ where: { floorId } });
      await tx.wall.deleteMany({ where: { floorId } });
      await tx.room.deleteMany({ where: { floorId } });

      const wallIdMap = new Map<string, string>();

      // Create new walls
      for (const w of payload.walls || []) {
        const wall = await tx.wall.create({
          data: {
            floorId,
            startX: w.startX,
            startY: w.startY,
            endX: w.endX,
            endY: w.endY,
            length: w.length || Math.sqrt(Math.pow(w.endX - w.startX, 2) + Math.pow(w.endY - w.startY, 2)),
            height: w.height || floor.wallHeight,
            thickness: w.thickness || floor.wallThickness,
            wallType: w.wallType || 'brick',
            material: w.material || 'brick',
          },
        });
        if (w.id) wallIdMap.set(w.id, wall.id);
      }

      // Create rooms
      for (const r of payload.rooms || []) {
        await tx.room.create({
          data: {
            floorId,
            roomName: r.roomName || 'Room',
            x: r.x || 0,
            y: r.y || 0,
            length: r.length || 4,
            width: r.width || 4,
            area: r.area || (r.length || 4) * (r.width || 4),
            flooringType: r.flooringType || 'cement',
          },
        });
      }

      // Create doors
      for (const d of payload.doors || []) {
        const mappedWallId = wallIdMap.get(d.wallId) || d.wallId;
        const wallExists = await tx.wall.findUnique({ where: { id: mappedWallId } });
        if (wallExists) {
          await tx.door.create({
            data: {
              floorId,
              wallId: mappedWallId,
              width: d.width || 0.9,
              height: d.height || 2.1,
              doorType: d.doorType || 'single',
              position: d.position || 0.5,
            },
          });
        }
      }

      // Create windows
      for (const win of payload.windows || []) {
        const mappedWallId = wallIdMap.get(win.wallId) || win.wallId;
        const wallExists = await tx.wall.findUnique({ where: { id: mappedWallId } });
        if (wallExists) {
          await tx.window.create({
            data: {
              floorId,
              wallId: mappedWallId,
              width: win.width || 1.2,
              height: win.height || 1.2,
              windowType: win.windowType || 'sliding',
              position: win.position || 0.5,
              sillHeight: win.sillHeight || 0.9,
            },
          });
        }
      }

      // Upsert DesignLayout — store layoutData as JSON string
      const layoutDataStr = JSON.stringify(payload.layoutData || payload);
      await tx.designLayout.upsert({
        where: { floorId },
        update: {
          gridScale: payload.gridScale || 0.5,
          layoutData: layoutDataStr,
        },
        create: {
          floorId,
          gridScale: payload.gridScale || 0.5,
          layoutData: layoutDataStr,
        },
      });
    });

    return this.getFloorDesign(floorId);
  }
}
