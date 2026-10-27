import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  calculateProjectStage(project: any) {
    const hasEstimate = project.costEstimate && (project.costEstimate.totalCost || 0) > 0;
    const hasFloors = project.floors && project.floors.length > 0;
    const hasWalls = project.floors && project.floors.some((f: any) => (f.walls?.length || 0) > 0);
    const hasBoq = project.boqItems && (project.boqItems.length || 0) > 0;

    if (hasEstimate && hasBoq) {
      return { stage: 'REPORTS_READY', stageLabel: 'Reports Ready', progress: 100, stepNumber: 11 };
    } else if (hasEstimate) {
      return { stage: 'ESTIMATION_COMPLETED', stageLabel: 'Cost Estimated', progress: 80, stepNumber: 9 };
    } else if (hasWalls) {
      return { stage: 'QUANTITY_COMPLETED', stageLabel: 'Quantities Calculated', progress: 50, stepNumber: 4 };
    } else if (hasFloors) {
      return { stage: 'DESIGN_IN_PROGRESS', stageLabel: 'Design In Progress', progress: 25, stepNumber: 2 };
    }
    return { stage: 'PLANNING', stageLabel: 'Planning Stage', progress: 10, stepNumber: 1 };
  }

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        floors: {
          select: {
            id: true,
            floorName: true,
            floorNumber: true,
            walls: { select: { id: true } },
          },
        },
        boqItems: { select: { id: true } },
        costEstimate: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => ({
      ...p,
      ...this.calculateProjectStage(p),
    }));
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        floors: {
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
          orderBy: { floorNumber: 'asc' },
        },
        boqItems: true,
        costEstimate: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    // Parse design layout strings for all floors
    for (const floor of project.floors) {
      if (floor.designLayout && typeof floor.designLayout.layoutData === 'string') {
        try {
          (floor.designLayout as any).layoutData = JSON.parse(floor.designLayout.layoutData);
        } catch (_) {}
      }
    }

    return {
      ...project,
      ...this.calculateProjectStage(project),
    };
  }

  async create(userId: string, dto: CreateProjectDto) {
    const {
      floorLength = 10,
      floorWidth = 8,
      floorHeight = 3.0,
      wallHeight = 3.0,
      wallThickness = 0.23,
      templateType = 'blank',
      numberOfFloors = 1,
      ...projectData
    } = dto;

    try {
      const createdProject = await this.prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            projectName: projectData.projectName,
            companyName: projectData.companyName || null,
            engineerName: projectData.engineerName || null,
            projectType: projectData.projectType || 'Residential',
            buildingType: projectData.buildingType || 'Individual House',
            location: projectData.location || null,
            numberOfFloors: numberOfFloors || 1,
            soilType: projectData.soilType || 'Gravel',
            designCode: projectData.designCode || 'IS 456:2000',
            description: projectData.description || null,
            unitSystem: projectData.unitSystem || 'metric',
            zone: projectData.zone || 'Zone-I',
            rateSourceId: projectData.rateSourceId || null,
            gstRate: projectData.gstRate !== undefined ? projectData.gstRate : 18.0,
            overheadPercentage: projectData.overheadPercentage !== undefined ? projectData.overheadPercentage : 14.0,
            contingencyRate: projectData.contingencyRate !== undefined ? projectData.contingencyRate : 3.0,
            userId,
            costEstimate: {
              create: {},
            },
          },
        });

        // Default empty layout JSON
        const emptyLayout = JSON.stringify({
          walls: [],
          columns: [],
          beams: [],
          slabs: [],
          doors: [],
          windows: [],
          stairs: [],
          foundations: [],
          roofs: [],
        });

        // Create floors
        for (let i = 0; i < (numberOfFloors || 1); i++) {
          const floorName = i === 0 ? 'Ground Floor' : i === 1 ? 'First Floor' : i === 2 ? 'Second Floor' : `Floor ${i}`;
          const floor = await tx.floor.create({
            data: {
              projectId: project.id,
              floorName,
              floorNumber: i,
              length: floorLength,
              width: floorWidth,
              height: floorHeight,
              wallHeight,
              wallThickness,
            },
          });

          // Create default DesignLayout
          await tx.designLayout.create({
            data: {
              floorId: floor.id,
              gridScale: 0.5,
              layoutData: emptyLayout,
            },
          });

          // If basic template, generate default perimeter walls and rooms
          if (templateType === 'basic' && i === 0) {
            await this.generateBasicTemplateTx(tx, floor.id, floorLength, floorWidth, wallHeight, wallThickness);
          }
        }

        return project;
      });

      return this.findOne(createdProject.id, userId);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to initialize project record');
    }
  }

  async initializeProject(id: string, userId: string, body: any) {
    const project = await this.findOne(id, userId);
    return project;
  }

  async getProjectDesign(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    const primaryFloor = project.floors[0];
    if (!primaryFloor) throw new NotFoundException('Floor not found for project');

    return {
      projectId: project.id,
      floorId: primaryFloor.id,
      floor: primaryFloor,
      layoutData: primaryFloor.designLayout?.layoutData || {
        walls: primaryFloor.walls || [],
        columns: primaryFloor.columns || [],
        beams: primaryFloor.beams || [],
        slabs: primaryFloor.slabs || [],
        doors: primaryFloor.doors || [],
        windows: primaryFloor.windows || [],
        stairs: primaryFloor.staircases || [],
        foundations: primaryFloor.footings || [],
        roofs: primaryFloor.roofs || [],
      },
    };
  }

  async saveProjectDesign(id: string, userId: string, body: any) {
    const project = await this.findOne(id, userId);
    const floorId = body.floorId || project.floors[0]?.id;

    if (!floorId) throw new NotFoundException('Floor ID not found');

    let layout = body.layoutData;
    if (typeof layout === 'string') {
      try {
        layout = JSON.parse(layout);
      } catch (_) {}
    }
    if (!layout || typeof layout !== 'object') {
      layout = body;
    }

    const layoutDataStr = typeof body.layoutData === 'string' ? body.layoutData : JSON.stringify(body.layoutData || body);

    await this.prisma.$transaction(async (tx) => {
      await tx.designLayout.upsert({
        where: { floorId },
        update: {
          gridScale: body.gridScale || 0.5,
          layoutData: layoutDataStr,
        },
        create: {
          floorId,
          gridScale: body.gridScale || 0.5,
          layoutData: layoutDataStr,
        },
      });

      // Synchronize relational elements if provided
      if (layout && (layout.walls || layout.columns || layout.doors || layout.windows || layout.beams || layout.slabs || layout.foundations || layout.footings)) {
        await tx.door.deleteMany({ where: { floorId } });
        await tx.window.deleteMany({ where: { floorId } });
        await tx.footing.deleteMany({ where: { floorId } });
        await tx.column.deleteMany({ where: { floorId } });
        await tx.beam.deleteMany({ where: { floorId } });
        await tx.slab.deleteMany({ where: { floorId } });
        await tx.wall.deleteMany({ where: { floorId } });

        const wallMap: Record<string, string> = {};
        if (Array.isArray(layout.walls)) {
          for (const w of layout.walls) {
            const created = await tx.wall.create({
              data: {
                floorId,
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
            if (w.id) wallMap[w.id] = created.id;
          }
        }

        const colMap: Record<string, string> = {};
        if (Array.isArray(layout.columns)) {
          for (const c of layout.columns) {
            const created = await tx.column.create({
              data: {
                floorId,
                columnId: c.columnId || c.id || 'C-1',
                x: Number(c.x) || 0,
                y: Number(c.y) || 0,
                width: Number(c.width) || 0.3,
                depth: Number(c.depth) || 0.3,
                height: Number(c.height) || 3.0,
                concreteGrade: c.concreteGrade || 'M25',
                reinforcement: Number(c.reinforcement) || 1.5,
              },
            });
            if (c.id) colMap[c.id] = created.id;
          }
        }

        if (Array.isArray(layout.doors)) {
          for (const d of layout.doors) {
            const wId = wallMap[d.wallId] || Object.values(wallMap)[0];
            if (wId) {
              await tx.door.create({
                data: {
                  floorId,
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
        }

        if (Array.isArray(layout.windows)) {
          for (const win of layout.windows) {
            const wId = wallMap[win.wallId] || Object.values(wallMap)[0];
            if (wId) {
              await tx.window.create({
                data: {
                  floorId,
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
        }

        const footings = layout.foundations || layout.footings;
        if (Array.isArray(footings)) {
          for (const ft of footings) {
            await tx.footing.create({
              data: {
                floorId,
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
        }

        if (Array.isArray(layout.beams)) {
          for (const b of layout.beams) {
            await tx.beam.create({
              data: {
                floorId,
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
        }

        if (Array.isArray(layout.slabs)) {
          for (const s of layout.slabs) {
            await tx.slab.create({
              data: {
                floorId,
                x: Number(s.x) || 0,
                y: Number(s.y) || 0,
                length: Number(s.length) || 5.0,
                width: Number(s.width) || 4.0,
                thickness: Number(s.thickness) || 0.15,
                concreteGrade: s.concreteGrade || 'M25',
              },
            });
          }
        }
      }
    });

    return { message: 'Design saved successfully', projectId: id, floorId };
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(id, userId);
    const { startDate, completionDate, ...rest } = dto as any;
    return this.prisma.project.update({
      where: { id },
      data: rest,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);

    const dupProject = await this.prisma.project.create({
      data: {
        userId,
        projectName: `${original.projectName} (Copy)`,
        companyName: original.companyName,
        engineerName: original.engineerName,
        projectType: original.projectType,
        buildingType: original.buildingType,
        location: original.location,
        numberOfFloors: original.numberOfFloors,
        soilType: original.soilType,
        designCode: original.designCode,
        description: original.description,
        unitSystem: original.unitSystem,
        costEstimate: { create: {} },
      },
    });

    for (const floor of original.floors) {
      const newFloor = await this.prisma.floor.create({
        data: {
          projectId: dupProject.id,
          floorName: floor.floorName,
          floorNumber: floor.floorNumber,
          length: floor.length,
          width: floor.width,
          height: floor.height,
          wallHeight: floor.wallHeight,
          wallThickness: floor.wallThickness,
        },
      });

      const wallIdMap = new Map<string, string>();
      for (const w of floor.walls) {
        const newWall = await this.prisma.wall.create({
          data: {
            floorId: newFloor.id,
            startX: w.startX,
            startY: w.startY,
            endX: w.endX,
            endY: w.endY,
            length: w.length,
            height: w.height,
            thickness: w.thickness,
            wallType: w.wallType,
            material: w.material,
          },
        });
        wallIdMap.set(w.id, newWall.id);
      }

      for (const r of floor.rooms) {
        await this.prisma.room.create({
          data: {
            floorId: newFloor.id,
            roomName: r.roomName,
            x: r.x,
            y: r.y,
            length: r.length,
            width: r.width,
            area: r.area,
            flooringType: r.flooringType,
          },
        });
      }

      for (const d of floor.doors) {
        const newWallId = wallIdMap.get(d.wallId);
        if (newWallId) {
          await this.prisma.door.create({
            data: {
              floorId: newFloor.id,
              wallId: newWallId,
              width: d.width,
              height: d.height,
              doorType: d.doorType,
              position: d.position,
            },
          });
        }
      }

      for (const win of floor.windows) {
        const newWallId = wallIdMap.get(win.wallId);
        if (newWallId) {
          await this.prisma.window.create({
            data: {
              floorId: newFloor.id,
              wallId: newWallId,
              width: win.width,
              height: win.height,
              windowType: win.windowType,
              position: win.position,
              sillHeight: win.sillHeight,
            },
          });
        }
      }

      if (floor.designLayout) {
        await this.prisma.designLayout.create({
          data: {
            floorId: newFloor.id,
            gridScale: floor.designLayout.gridScale,
            layoutData: typeof floor.designLayout.layoutData === 'string'
              ? floor.designLayout.layoutData
              : JSON.stringify(floor.designLayout.layoutData),
          },
        });
      }
    }

    return this.findOne(dupProject.id, userId);
  }

  async getStats(userId: string) {
    const totalProjects = await this.prisma.project.count({ where: { userId } });
    const activeProjects = await this.prisma.project.count({
      where: { userId, status: 'active' },
    });

    const costEstimates = await this.prisma.costEstimate.findMany({
      where: { project: { userId } },
      select: { totalCost: true },
    });

    const totalEstimatedCost = costEstimates.reduce((sum, c) => sum + (c.totalCost || 0), 0);

    const recentProjects = await this.prisma.project.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        costEstimate: true,
        floors: {
          select: {
            id: true,
            floorName: true,
            floorNumber: true,
            walls: { select: { id: true } },
          },
        },
        boqItems: { select: { id: true } },
      },
    });

    return {
      totalProjects,
      activeProjects,
      totalEstimatedCost,
      recentProjects: recentProjects.map((p) => ({
        ...p,
        ...this.calculateProjectStage(p),
      })),
    };
  }

  private async generateBasicTemplateTx(
    tx: any,
    floorId: string,
    l: number,
    w: number,
    h: number,
    t: number,
  ) {
    const topWall = await tx.wall.create({
      data: { floorId, startX: 0, startY: 0, endX: l, endY: 0, length: l, height: h, thickness: t },
    });
    const rightWall = await tx.wall.create({
      data: { floorId, startX: l, startY: 0, endX: l, endY: w, length: w, height: h, thickness: t },
    });
    const bottomWall = await tx.wall.create({
      data: { floorId, startX: l, startY: w, endX: 0, endY: w, length: l, height: h, thickness: t },
    });
    const leftWall = await tx.wall.create({
      data: { floorId, startX: 0, startY: w, endX: 0, endY: 0, length: w, height: h, thickness: t },
    });

    await tx.room.create({
      data: {
        floorId,
        roomName: 'Main Hall',
        x: 0,
        y: 0,
        length: l,
        width: w,
        area: l * w,
        flooringType: 'Vitrified Tiles',
      },
    });

    await tx.door.create({
      data: { floorId, wallId: bottomWall.id, width: 1.0, height: 2.1, doorType: 'single', position: 0.5 },
    });

    await tx.window.create({
      data: { floorId, wallId: topWall.id, width: 1.2, height: 1.2, windowType: 'sliding', position: 0.3 },
    });

    const templateLayout = JSON.stringify({
      walls: [
        { id: topWall.id, startX: 0, startY: 0, endX: l, endY: 0, length: l, height: h, thickness: t, wallType: 'brick', material: 'brick' },
        { id: rightWall.id, startX: l, startY: 0, endX: l, endY: w, length: w, height: h, thickness: t, wallType: 'brick', material: 'brick' },
        { id: bottomWall.id, startX: l, startY: w, endX: 0, endY: w, length: l, height: h, thickness: t, wallType: 'brick', material: 'brick' },
        { id: leftWall.id, startX: 0, startY: w, endX: 0, endY: 0, length: w, height: h, thickness: t, wallType: 'brick', material: 'brick' },
      ],
      columns: [],
      beams: [],
      slabs: [],
      doors: [{ id: 'd1', wallId: bottomWall.id, x: l / 2, y: w, width: 1.0, height: 2.1, doorType: 'single', position: 0.5 }],
      windows: [{ id: 'win1', wallId: topWall.id, x: l * 0.3, y: 0, width: 1.2, height: 1.2, windowType: 'sliding', position: 0.3, sillHeight: 0.9 }],
      stairs: [],
      foundations: [],
      roofs: [],
    });

    await tx.designLayout.upsert({
      where: { floorId },
      update: { layoutData: templateLayout },
      create: { floorId, gridScale: 0.5, layoutData: templateLayout },
    });
  }

  async validateProjectDesign(projectId: string, userId: string) {
    const project = await this.findOne(projectId, userId);

    const errors: string[] = [];
    const warnings: string[] = [];
    let totalWalls = 0;
    let totalColumns = 0;
    let totalBeams = 0;
    let totalSlabs = 0;
    let totalDoors = 0;
    let totalWindows = 0;
    let totalFootings = 0;
    let totalRooms = 0;

    for (const floor of project.floors) {
      const floorName = floor.floorName || `Floor ${floor.floorNumber}`;
      const floorWalls = floor.walls || [];
      const floorCols = floor.columns || [];
      const floorBeams = floor.beams || [];
      const floorSlabs = floor.slabs || [];
      const floorDoors = floor.doors || [];
      const floorWindows = floor.windows || [];
      const floorFootings = floor.footings || [];
      const floorRooms = floor.rooms || [];

      totalWalls += floorWalls.length;
      totalColumns += floorCols.length;
      totalBeams += floorBeams.length;
      totalSlabs += floorSlabs.length;
      totalDoors += floorDoors.length;
      totalWindows += floorWindows.length;
      totalFootings += floorFootings.length;
      totalRooms += floorRooms.length;

      // Check wall dimensions
      for (const w of floorWalls) {
        if (w.length <= 0) errors.push(`[${floorName}] Wall #${w.id.slice(0, 6)} has invalid length (${w.length}m <= 0)`);
        if (w.height <= 0) errors.push(`[${floorName}] Wall #${w.id.slice(0, 6)} has invalid height (${w.height}m <= 0)`);
        if (w.thickness <= 0) errors.push(`[${floorName}] Wall #${w.id.slice(0, 6)} has invalid thickness (${w.thickness}m <= 0)`);
      }

      // Check door and window attachments
      const wallIdSet = new Set(floorWalls.map((w: any) => w.id));
      for (const d of floorDoors) {
        if (d.width <= 0 || d.height <= 0) {
          errors.push(`[${floorName}] Door #${d.id.slice(0, 6)} has invalid dimensions (${d.width}m x ${d.height}m)`);
        }
        if (!wallIdSet.has(d.wallId)) {
          warnings.push(`[${floorName}] Door #${d.id.slice(0, 6)} is not attached to a valid wall on this floor.`);
        }
      }

      for (const win of floorWindows) {
        if (win.width <= 0 || win.height <= 0) {
          errors.push(`[${floorName}] Window #${win.id.slice(0, 6)} has invalid dimensions (${win.width}m x ${win.height}m)`);
        }
        if (!wallIdSet.has(win.wallId)) {
          warnings.push(`[${floorName}] Window #${win.id.slice(0, 6)} is not attached to a valid wall on this floor.`);
        }
      }

      // Check column dimensions
      for (const c of floorCols) {
        if (c.width <= 0 || c.depth <= 0 || c.height <= 0) {
          errors.push(`[${floorName}] Column #${c.columnId || c.id.slice(0, 6)} has invalid dimensions`);
        }
      }

      // Ground floor structural footings check
      if (floor.floorNumber === 0 && floorCols.length > 0 && floorFootings.length === 0) {
        warnings.push(`[${floorName}] Ground Floor has ${floorCols.length} columns defined, but no footings/foundations placed.`);
      }

      // Beam and slab dimension checks
      for (const b of floorBeams) {
        if (b.length <= 0 || b.width <= 0 || b.depth <= 0) {
          errors.push(`[${floorName}] Beam #${b.id.slice(0, 6)} has invalid dimensions`);
        }
      }

      for (const s of floorSlabs) {
        if (s.length <= 0 || s.width <= 0 || s.thickness <= 0) {
          errors.push(`[${floorName}] Slab #${s.id.slice(0, 6)} has invalid dimensions`);
        }
      }
    }

    if (totalWalls === 0 && totalColumns === 0) {
      warnings.push('Project design canvas is currently empty. Draw at least one wall or column to compute quantities.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalFloors: project.floors.length,
        totalWalls,
        totalColumns,
        totalBeams,
        totalSlabs,
        totalDoors,
        totalWindows,
        totalFootings,
        totalRooms,
      },
      validatedAt: new Date(),
    };
  }

  async createRevision(projectId: string, userId: string, description?: string) {
    const project = await this.findOne(projectId, userId);

    const latestRevision = await this.prisma.projectRevision.findFirst({
      where: { projectId },
      orderBy: { revisionNumber: 'desc' },
    });
    const revisionNumber = (latestRevision?.revisionNumber || 0) + 1;

    // Snapshot of floors, elements, layouts, and parameters
    const designSnapshot = JSON.stringify({
      projectName: project.projectName,
      unitSystem: project.unitSystem,
      soilType: project.soilType,
      designCode: project.designCode,
      overheadPercentage: project.overheadPercentage,
      contingencyRate: project.contingencyRate,
      gstRate: project.gstRate,
      floors: project.floors,
    });

    const costSnapshot = JSON.stringify(project.costEstimate || {});

    const revision = await this.prisma.projectRevision.create({
      data: {
        projectId,
        revisionNumber,
        description: description || `Revision R${revisionNumber} snapshot`,
        designSnapshot,
        costSnapshot,
      },
    });

    return revision;
  }

  async getRevisions(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    return this.prisma.projectRevision.findMany({
      where: { projectId },
      orderBy: { revisionNumber: 'desc' },
    });
  }

  async restoreRevision(projectId: string, revisionId: string, userId: string) {
    await this.findOne(projectId, userId);
    const revision = await this.prisma.projectRevision.findUnique({
      where: { id: revisionId },
    });
    if (!revision || revision.projectId !== projectId) {
      throw new NotFoundException('Revision not found for this project');
    }

    const data = JSON.parse(revision.designSnapshot);
    if (!data.floors || !Array.isArray(data.floors)) {
      throw new BadRequestException('Invalid revision snapshot data');
    }

    // Restore floors and elements in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Remove current floors for project
      await tx.floor.deleteMany({ where: { projectId } });

      for (let i = 0; i < data.floors.length; i++) {
        const f = data.floors[i];
        const newFloor = await tx.floor.create({
          data: {
            projectId,
            floorName: f.floorName || `Floor ${i}`,
            floorNumber: i,
            length: f.length || 10,
            width: f.width || 8,
            height: f.height || 3.0,
            wallHeight: f.wallHeight || 3.0,
            wallThickness: f.wallThickness || 0.23,
          },
        });

        const wallMap: Record<string, string> = {};
        for (const w of f.walls || []) {
          const nw = await tx.wall.create({
            data: {
              floorId: newFloor.id,
              startX: w.startX,
              startY: w.startY,
              endX: w.endX,
              endY: w.endY,
              length: w.length,
              height: w.height,
              thickness: w.thickness,
              wallType: w.wallType,
              material: w.material,
            },
          });
          wallMap[w.id] = nw.id;
        }

        for (const d of f.doors || []) {
          await tx.door.create({
            data: {
              floorId: newFloor.id,
              wallId: wallMap[d.wallId] || d.wallId,
              width: d.width,
              height: d.height,
              doorType: d.doorType,
              material: d.material,
              position: d.position,
            },
          });
        }

        for (const win of f.windows || []) {
          await tx.window.create({
            data: {
              floorId: newFloor.id,
              wallId: wallMap[win.wallId] || win.wallId,
              width: win.width,
              height: win.height,
              windowType: win.windowType,
              frameMaterial: win.frameMaterial,
              position: win.position,
              sillHeight: win.sillHeight,
            },
          });
        }

        const colMap: Record<string, string> = {};
        for (const col of f.columns || []) {
          const nc = await tx.column.create({
            data: {
              floorId: newFloor.id,
              columnId: col.columnId,
              x: col.x,
              y: col.y,
              width: col.width,
              depth: col.depth,
              height: col.height,
              concreteGrade: col.concreteGrade,
              reinforcement: col.reinforcement,
            },
          });
          colMap[col.id] = nc.id;
        }

        for (const ft of f.footings || []) {
          await tx.footing.create({
            data: {
              floorId: newFloor.id,
              footingId: ft.footingId,
              columnId: ft.columnId ? colMap[ft.columnId] : null,
              x: ft.x,
              y: ft.y,
              length: ft.length,
              width: ft.width,
              depth: ft.depth,
              pedestalH: ft.pedestalH,
              gradeBeamL: ft.gradeBeamL,
              concreteGrade: ft.concreteGrade,
            },
          });
        }

        for (const b of f.beams || []) {
          await tx.beam.create({
            data: {
              floorId: newFloor.id,
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

        for (const s of f.slabs || []) {
          await tx.slab.create({
            data: {
              floorId: newFloor.id,
              x: s.x,
              y: s.y,
              length: s.length,
              width: s.width,
              thickness: s.thickness,
              concreteGrade: s.concreteGrade,
            },
          });
        }

        for (const st of f.staircases || []) {
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

        for (const r of f.roofs || []) {
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

        for (const rm of f.rooms || []) {
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

        if (f.designLayout) {
          const lData = typeof f.designLayout.layoutData === 'object'
            ? JSON.stringify(f.designLayout.layoutData)
            : f.designLayout.layoutData;
          await tx.designLayout.create({
            data: {
              floorId: newFloor.id,
              gridScale: f.designLayout.gridScale || 0.5,
              layoutData: lData,
            },
          });
        }
      }

      await tx.project.update({
        where: { id: projectId },
        data: {
          numberOfFloors: data.floors.length,
          soilType: data.soilType || undefined,
          designCode: data.designCode || undefined,
          overheadPercentage: data.overheadPercentage || undefined,
          contingencyRate: data.contingencyRate || undefined,
          gstRate: data.gstRate || undefined,
          unitSystem: data.unitSystem || undefined,
        },
      });
    });

    return { message: `Revision R${revision.revisionNumber} restored successfully`, projectId };
  }
}
