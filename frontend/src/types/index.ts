export interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  companyName?: string;
  role: 'ADMIN' | 'QUANTITY SURVEYOR' | 'SITE ENGINEER' | 'CONTRACTOR';
  profileImage?: string;
  isVerified?: boolean;
  authenticationProvider: 'email' | 'google' | 'otp';
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  projectName: string;
  companyName?: string;
  engineerName?: string;
  projectType: string;
  buildingType: string;
  location?: string;
  numberOfFloors: number;
  soilType?: string;
  designCode?: string;
  description?: string;
  unitSystem: 'metric' | 'imperial';
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
  updatedAt: string;
  floors?: Floor[];
  costEstimate?: CostEstimate;
  boqItems?: BoqItem[];
}

export interface Floor {
  id: string;
  projectId: string;
  floorName: string;
  floorNumber: number;
  length: number;
  width: number;
  height: number;
  wallHeight: number;
  wallThickness: number;
  walls?: Wall[];
  rooms?: Room[];
  doors?: Door[];
  windows?: Window[];
  columns?: Column[];
  beams?: Beam[];
  slabs?: Slab[];
  staircases?: Staircase[];
  footings?: Footing[];
  roofs?: Roof[];
  designLayout?: DesignLayout;
}

export interface Wall {
  id: string;
  floorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  height: number;
  thickness: number;
  wallType: string;
  material: string;
}

export interface Column {
  id: string;
  floorId: string;
  columnId: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  concreteGrade: string;
  reinforcement: number;
}

export interface Beam {
  id: string;
  floorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  width: number;
  depth: number;
  concreteGrade: string;
  reinforcement: number;
}

export interface Slab {
  id: string;
  floorId: string;
  x: number;
  y: number;
  length: number;
  width: number;
  thickness: number;
  concreteGrade: string;
}

export interface Staircase {
  id: string;
  floorId: string;
  x: number;
  y: number;
  stairWidth: number;
  numSteps: number;
  riser: number;
  tread: number;
  stairType: string;
}

export interface Footing {
  id: string;
  floorId: string;
  columnId?: string;
  footingId: string;
  x: number;
  y: number;
  length: number;
  width: number;
  depth: number;
  pedestalH: number;
  gradeBeamL: number;
  concreteGrade: string;
}

export interface Roof {
  id: string;
  floorId: string;
  x: number;
  y: number;
  length: number;
  width: number;
  roofType: string;
  roofingMaterial: string;
  waterproofing: string;
}

export interface Room {
  id: string;
  floorId: string;
  roomName: string;
  x: number;
  y: number;
  length: number;
  width: number;
  area: number;
  flooringType: string;
}

export interface Door {
  id: string;
  floorId: string;
  wallId: string;
  width: number;
  height: number;
  doorType: string;
  material?: string;
  position: number;
}

export interface Window {
  id: string;
  floorId: string;
  wallId: string;
  width: number;
  height: number;
  windowType: string;
  frameMaterial?: string;
  position: number;
  sillHeight: number;
}

export interface MaterialRate {
  id: string;
  materialName: string;
  unit: string;
  unitRate: number;
  category: string;
  updatedAt: string;
}

export interface BoqItem {
  id: string;
  projectId: string;
  itemNumber: number;
  itemName: string;
  description?: string;
  unit: string;
  quantity: number;
  unitRate: number;
  totalAmount: number;
  category: string;
  isCustom: boolean;
  itemCode?: string;
  specification?: string;
  standardReference?: string;
  rateSource?: string;
  rateYear?: string;
}

export interface CostEstimate {
  id: string;
  projectId: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheads: number;
  gst: number;
  contingency: number;
  totalCost: number;
  costPerSqFt?: number;
  costPerFloor?: number;
}

export interface DesignLayout {
  id: string;
  floorId: string;
  gridScale: number;
  layoutData: any;
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
  flooringArea: number;
  plasteringArea: number;
  paintingArea: number;
  concreteQuantity: number;
  brickworkQuantity: number;
  slabQuantity: number;
  foundationQuantity: number;
}

export interface BuildingQuantitySummary {
  projectId: string;
  projectName: string;
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
  totalConcreteQuantity: number;
  totalBrickworkQuantity: number;
  totalSlabQuantity: number;
  totalFoundationQuantity: number;
  floorBreakdown: FloorQuantityResult[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalEstimatedCost: number;
  recentProjects: Project[];
}
