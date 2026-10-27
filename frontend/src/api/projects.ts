import api from './client';

export const projectsApi = {
  getProjects: async () => {
    const res = await api.get('/projects');
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/projects/stats');
    return res.data;
  },
  getProject: async (id: string) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  createProject: async (data: any) => {
    const res = await api.post('/projects', data);
    return res.data;
  },
  updateProject: async (id: string, data: any) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  deleteProject: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
  duplicateProject: async (id: string) => {
    const res = await api.post(`/projects/${id}/duplicate`);
    return res.data;
  },
  // Design Layout API
  getDesign: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/design`);
    return res.data;
  },
  saveDesign: async (projectId: string, data: any) => {
    const res = await api.put(`/projects/${projectId}/design`, data);
    return res.data;
  },
  autosaveDesign: async (projectId: string, data: any) => {
    const res = await api.post(`/projects/${projectId}/design/autosave`, data);
    return res.data;
  },
  // Engine & Quantities API
  getQuantities: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/quantities`);
    return res.data;
  },
  getMaterialRequirements: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/materials`);
    return res.data;
  },
  getLabourRequirements: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/labour`);
    return res.data;
  },
  getEquipmentRequirements: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/equipment`);
    return res.data;
  },
  getRateAnalysis: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/rate-analysis`);
    return res.data;
  },
  getCost: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/cost`);
    return res.data;
  },
  getBoq: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/boq`);
    return res.data;
  },
  getReports: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/reports`);
    return res.data;
  },
  exportPdfReport: async (projectId: string) => {
    const res = await api.post(`/projects/${projectId}/reports/pdf`);
    return res.data;
  },
  exportExcelReport: async (projectId: string) => {
    const res = await api.post(`/projects/${projectId}/reports/excel`);
    return res.data;
  },
  // Legacy BOQ item operations
  getCalculations: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/quantities`);
    return res.data;
  },
  generateBoq: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/boq`);
    return res.data;
  },
  addBoqItem: async (projectId: string, data: any) => {
    const res = await api.post(`/projects/${projectId}/boq`, data);
    return res.data;
  },
  updateBoqItem: async (projectId: string, itemId: string, data: any) => {
    const res = await api.put(`/projects/${projectId}/boq/${itemId}`, data);
    return res.data;
  },
  deleteBoqItem: async (projectId: string, itemId: string) => {
    const res = await api.delete(`/projects/${projectId}/boq/${itemId}`);
    return res.data;
  },
  getCosts: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/cost`);
    return res.data;
  },
  calculateCosts: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/cost`);
    return res.data;
  },
  getMaterials: async () => {
    const res = await api.get('/materials');
    return res.data;
  },
  updateMaterial: async (id: string, unitRate: number) => {
    const res = await api.put(`/materials/${id}`, { unitRate });
    return res.data;
  },
  // Floor Management
  createFloor: async (projectId: string, data: any) => {
    const res = await api.post(`/floors/project/${projectId}`, data);
    return res.data;
  },
  updateFloor: async (floorId: string, data: any) => {
    const res = await api.put(`/floors/${floorId}`, data);
    return res.data;
  },
  deleteFloor: async (floorId: string) => {
    const res = await api.delete(`/floors/${floorId}`);
    return res.data;
  },
  duplicateFloor: async (floorId: string) => {
    const res = await api.post(`/floors/${floorId}/duplicate`);
    return res.data;
  },
  copyFloorElements: async (targetFloorId: string, sourceFloorId: string) => {
    const res = await api.post(`/floors/${targetFloorId}/copy-from/${sourceFloorId}`);
    return res.data;
  },
  // Design Validation
  validateDesign: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/validate`);
    return res.data;
  },
  // Revisions & Versioning
  getRevisions: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/revisions`);
    return res.data;
  },
  createRevision: async (projectId: string, description?: string) => {
    const res = await api.post(`/projects/${projectId}/revisions`, { description });
    return res.data;
  },
  restoreRevision: async (projectId: string, revisionId: string) => {
    const res = await api.post(`/projects/${projectId}/revisions/${revisionId}/restore`);
    return res.data;
  },
};
