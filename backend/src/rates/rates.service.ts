import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class RatesService {
  constructor(private prisma: PrismaService) {}

  // 1. Rate Sources Management
  async getRateSources() {
    return this.prisma.rateSource.findMany({
      orderBy: { importedAt: 'desc' },
      include: {
        _count: {
          select: {
            items: true,
            materials: true,
            labour: true,
            equipment: true,
            scheduleRates: true,
          },
        },
      },
    });
  }

  async createRateSource(data: any) {
    return this.prisma.rateSource.create({
      data: {
        sourceName: data.sourceName,
        sourceType: data.sourceType || 'SSR',
        organization: data.organization || 'Government of Telangana',
        edition: data.edition || 'Part-III Buildings - Civil Items',
        year: data.year || '2026-27',
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date('2026-06-01'),
        state: data.state || 'Telangana',
        location: data.location || 'Telangana',
        reference: data.reference || null,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async updateRateSourceStatus(id: string, status: string) {
    const source = await this.prisma.rateSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException('Rate source not found');
    return this.prisma.rateSource.update({
      where: { id },
      data: { status },
    });
  }

  // 2. Schedule of Rates Querying
  async getScheduleOfRates(query: {
    search?: string;
    category?: string;
    rateSourceId?: string;
    year?: string;
    state?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { itemCode: { contains: query.search } },
        { itemDescription: { contains: query.search } },
        { category: { contains: query.search } },
        { standardReference: { contains: query.search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.rateSourceId) where.rateSourceId = query.rateSourceId;
    if (query.year) where.year = query.year;
    if (query.state) where.state = query.state;

    const [items, total] = await Promise.all([
      this.prisma.scheduleOfRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { itemCode: 'asc' },
        include: { rateSource: true },
      }),
      this.prisma.scheduleOfRate.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 3. Materials, Labour & Equipment Queries
  async getMaterialRates(query: { search?: string; category?: string; rateSourceId?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { materialName: { contains: query.search } },
        { materialCode: { contains: query.search } },
        { category: { contains: query.search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.rateSourceId) where.rateSourceId = query.rateSourceId;

    return this.prisma.materialRate.findMany({
      where,
      orderBy: { materialName: 'asc' },
      include: { rateSource: true },
    });
  }

  async getLabourRates(query: { search?: string; category?: string; rateSourceId?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { labourType: { contains: query.search } },
        { category: { contains: query.search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.rateSourceId) where.rateSourceId = query.rateSourceId;

    return this.prisma.labourRate.findMany({
      where,
      orderBy: { labourType: 'asc' },
      include: { rateSource: true },
    });
  }

  async getEquipmentRates(query: { search?: string; rateSourceId?: string }) {
    const where: any = {};
    if (query.search) {
      where.equipmentName = { contains: query.search };
    }
    if (query.rateSourceId) where.rateSourceId = query.rateSourceId;

    return this.prisma.equipmentRate.findMany({
      where,
      orderBy: { equipmentName: 'asc' },
      include: { rateSource: true },
    });
  }

  // 4. Admin Excel Import & Inspection Parser
  async parseExcelPreview(fileBuffer: Buffer) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheets = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = (rows[0] || []).map((h: any) => String(h || '').trim());
        const sampleData = rows.slice(1, 11).map((r) => {
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h || `Col_${idx + 1}`] = r[idx] !== undefined ? r[idx] : null;
          });
          return rowObj;
        });

        return {
          sheetName,
          totalRows: Math.max(0, rows.length - 1),
          totalCols: headers.length,
          headers,
          sampleData,
        };
      });

      return {
        sheets,
        suggestedMapping: {
          itemCode: ['SOR Item Code', 'Item Code', 'Item No', 'Code', 'S.No'],
          itemDescription: ['Material / Item Description', 'Description', 'Item Description', 'Work Description'],
          unit: ['Unit', 'UOM'],
          rate: ['Scheduled Rate (Rs.)', 'Rate', 'Scheduled Rate', 'Rate (Rs.)', 'Unit Rate'],
          category: ['Section', 'Category', 'Work Category'],
          subCategory: ['Subsection', 'Sub Category'],
          sectionCode: ['Section Code', 'Sec Code'],
          source: ['Source', 'Rate Source', 'Schedule'],
          year: ['SSR Year', 'Year', 'Edition'],
          effectiveDate: ['Effective From', 'Effective Date'],
          part: ['Part', 'Department Part'],
        },
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse Excel file: ${err.message}`);
    }
  }

  async importExcelData(userId: string, filename: string, fileBuffer: Buffer, config: any) {
    const {
      sheetName,
      columnMapping, // { itemCode: 'SOR Item Code', itemDescription: 'Material / Item Description', ... }
      targetType = 'ScheduleOfRate', // ScheduleOfRate | MaterialRate | LabourRate | EquipmentRate
      rateSourceId,
      sourceName = 'Imported SOR Database',
    } = config;

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const ws = workbook.Sheets[sheetName || workbook.SheetNames[0]];
    if (!ws) throw new BadRequestException(`Sheet '${sheetName}' not found in Excel workbook`);

    const rawRows: any[] = XLSX.utils.sheet_to_json(ws);
    const recordsFound = rawRows.length;

    let importedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const errors: string[] = [];

    let sourceObj = rateSourceId
      ? await this.prisma.rateSource.findUnique({ where: { id: rateSourceId } })
      : null;

    if (!sourceObj) {
      sourceObj = await this.prisma.rateSource.create({
        data: {
          sourceName,
          year: '2026-27',
          state: 'Telangana',
          location: 'Telangana',
        },
      });
    }

    const activeSourceId = sourceObj.id;

    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
      const getVal = (fieldKey: string) => {
        const colName = columnMapping[fieldKey];
        if (!colName) return null;
        const val = row[colName];
        return val !== undefined && val !== null ? String(val).trim() : null;
      };

      const itemCode = getVal('itemCode') || `ITEM-${idx + 1}`;
      const description = getVal('itemDescription') || getVal('description');
      const unit = getVal('unit');
      const rateStr = getVal('rate');
      const rateNum = rateStr ? parseFloat(rateStr.replace(/[^0-9.]/g, '')) : NaN;
      const category = getVal('category') || 'General Construction';
      const subCategory = getVal('subCategory');
      const sectionCode = getVal('sectionCode');
      const subsectionCode = getVal('subsectionCode');
      const part = getVal('part');
      const effectiveFrom = getVal('effectiveDate');

      // Validation Rules
      if (!description || !unit || isNaN(rateNum) || rateNum < 0) {
        invalidCount++;
        errors.push(`Row ${idx + 2}: Invalid or missing required fields (Description/Unit/Rate)`);
        continue;
      }

      // Check duplicates and upsert
      try {
        if (targetType === 'ScheduleOfRate') {
          const existing = await this.prisma.scheduleOfRate.findFirst({
            where: { itemCode, rateSourceId: activeSourceId },
          });

          if (existing) {
            duplicateCount++;
          }

          await this.prisma.scheduleOfRate.upsert({
            where: { id: existing?.id || `sor-${idx}-${Date.now()}` },
            update: {
              itemDescription: description,
              unit,
              rate: rateNum,
              category,
              subCategory,
              sectionCode,
              subsectionCode,
              part,
              rateSourceId: activeSourceId,
            },
            create: {
              itemCode,
              itemDescription: description,
              unit,
              rate: rateNum,
              category,
              subCategory,
              sectionCode,
              subsectionCode,
              part,
              source: sourceObj.sourceName,
              year: sourceObj.year,
              state: sourceObj.state,
              location: sourceObj.location,
              effectiveDate: effectiveFrom ? new Date(effectiveFrom) : new Date('2026-06-01'),
              rateSourceId: activeSourceId,
            },
          });
          importedCount++;
        } else if (targetType === 'MaterialRate') {
          await this.prisma.materialRate.upsert({
            where: { materialName: description },
            update: { unitRate: rateNum, unit, category, rateSourceId: activeSourceId },
            create: {
              materialCode: itemCode,
              materialName: description,
              unit,
              unitRate: rateNum,
              category,
              sectionCode,
              rateSourceId: activeSourceId,
            },
          });
          importedCount++;
        }
      } catch (err: any) {
        invalidCount++;
        errors.push(`Row ${idx + 2}: ${err.message}`);
      }
    }

    // Save Import Audit Log
    const importLog = await this.prisma.rateImportLog.create({
      data: {
        filename,
        uploadedBy: userId,
        sourceName: sourceObj.sourceName,
        recordsFound,
        importedCount,
        duplicateCount,
        invalidCount,
        failedCount: invalidCount,
        errorDetails: errors.length > 0 ? errors.slice(0, 50).join('\n') : null,
        status: invalidCount === recordsFound ? 'FAILED' : 'COMPLETED',
      },
    });

    return {
      importLog,
      summary: {
        filename,
        sourceName: sourceObj.sourceName,
        recordsFound,
        importedCount,
        duplicateCount,
        invalidCount,
        errors: errors.slice(0, 10),
      },
    };
  }

  async getImportLogs() {
    return this.prisma.rateImportLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // 5. Estimate Snapshot Creation
  async createEstimateSnapshot(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rateSource: true,
        boqItems: true,
        costEstimate: true,
        floors: {
          include: {
            walls: true,
            columns: true,
            beams: true,
            slabs: true,
            doors: true,
            windows: true,
            footings: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const snapshotData = JSON.stringify({
      projectName: project.projectName,
      companyName: project.companyName,
      engineerName: project.engineerName,
      buildingType: project.buildingType,
      numberOfFloors: project.numberOfFloors,
      unitSystem: project.unitSystem,
      zone: project.zone,
      gstRate: project.gstRate,
      overheadPercentage: project.overheadPercentage,
      contingencyRate: project.contingencyRate,
      costEstimate: project.costEstimate,
      boqItems: project.boqItems,
      floors: project.floors,
    });

    return this.prisma.projectEstimateSnapshot.create({
      data: {
        projectId: project.id,
        rateSourceId: project.rateSourceId || null,
        rateSourceName: project.rateSource?.sourceName || 'Telangana Common SoR 2026-27',
        rateSourceYear: project.rateSource?.year || '2026-27',
        zone: project.zone || 'Zone-I',
        totalCost: project.costEstimate?.totalCost || 0,
        snapshotData,
      },
    });
  }

  async getProjectSnapshots(projectId: string) {
    return this.prisma.projectEstimateSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
    });
  }
}
