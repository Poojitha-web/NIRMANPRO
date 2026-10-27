import api from './client';

export interface RateSource {
  id: string;
  sourceName: string;
  sourceCode: string;
  state?: string;
  year?: string;
  publisher?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  description?: string;
  createdAt: string;
}

export interface ScheduleOfRateItem {
  id: string;
  itemCode: string;
  itemDescription: string;
  category: string;
  subCategory?: string;
  unit: string;
  rate: number;
  labourComponentRate?: number;
  materialComponentRate?: number;
  equipmentComponentRate?: number;
  standardReference?: string;
  specification?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  rateSourceId?: string;
  rateSource?: RateSource;
}

export interface MaterialRateItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  baseRate: number;
  marketRate?: number;
  gstPercentage?: number;
  wastagePercentage?: number;
  specification?: string;
  standardReference?: string;
}

export interface LabourRateItem {
  id: string;
  tradeCode: string;
  tradeName: string;
  skillCategory: string;
  unit: string;
  zone1Rate: number;
  zone2Rate: number;
  zone3Rate: number;
}

export interface EquipmentRateItem {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  capacity?: string;
  unit: string;
  hireRatePerShift: number;
  fuelCostPerShift: number;
  crewCostPerShift: number;
  totalShiftRate: number;
}

export interface ImportLog {
  id: string;
  fileName: string;
  recordsCount: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  importedAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export const ratesApi = {
  getSources: async (): Promise<RateSource[]> => {
    const res = await api.get('/rates/sources');
    return res.data;
  },

  createSource: async (data: Partial<RateSource>): Promise<RateSource> => {
    const res = await api.post('/rates/sources', data);
    return res.data;
  },

  updateSourceStatus: async (id: string, status: string): Promise<RateSource> => {
    const res = await api.put(`/rates/sources/${id}/status`, { status });
    return res.data;
  },

  getScheduleOfRates: async (params?: {
    search?: string;
    category?: string;
    rateSourceId?: string;
    year?: string;
    state?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/rates/items', { params });
    return res.data;
  },

  getMaterialRates: async (params?: { search?: string; category?: string; rateSourceId?: string }) => {
    const res = await api.get('/rates/materials', { params });
    return res.data;
  },

  getLabourRates: async (params?: { search?: string; category?: string; rateSourceId?: string }) => {
    const res = await api.get('/rates/labour', { params });
    return res.data;
  },

  getEquipmentRates: async (params?: { search?: string; rateSourceId?: string }) => {
    const res = await api.get('/rates/equipment', { params });
    return res.data;
  },

  previewExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/rates/preview-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  importExcel: async (file: File, config: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));
    const res = await api.post('/rates/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getImportLogs: async (): Promise<ImportLog[]> => {
    const res = await api.get('/rates/import-logs');
    return res.data;
  },

  createSnapshot: async (projectId: string) => {
    const res = await api.post(`/rates/snapshot/${projectId}`);
    return res.data;
  },

  getProjectSnapshots: async (projectId: string) => {
    const res = await api.get(`/rates/snapshot/${projectId}`);
    return res.data;
  },
};
