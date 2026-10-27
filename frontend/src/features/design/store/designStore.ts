import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Point {
  x: number;
  y: number;
}

export interface DesignWall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number; // in meters
  height: number;
  thickness: number;
  wallType: string;
  material: string;
  brickType?: string;
  cost?: number;
}

export interface DesignRoom {
  id: string;
  roomName: string;
  x: number;
  y: number;
  length: number;
  width: number;
  area: number;
  flooringType: string;
}

export interface DesignDoor {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doorType: string;
  material?: string;
  position: number; // 0 to 1 along wall
}

export interface DesignWindow {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  windowType: string;
  frameMaterial?: string;
  position: number;
  sillHeight: number;
}

export interface DesignColumn {
  id: string;
  columnId?: string;
  x: number;
  y: number;
  length: number; // m
  width: number; // m
  height: number; // m
  concreteGrade: string; // M20, M25, M30
  steelGrade?: string; // Fe500
  reinforcement?: number;
}

export interface DesignBeam {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  width: number;
  depth: number;
  concreteGrade: string;
  reinforcement?: number;
}

export interface DesignSlab {
  id: string;
  x: number;
  y: number;
  length: number;
  width: number;
  thickness: number;
  concreteGrade: string;
  slabType?: string; // RCC One-way, Two-way
}

export interface DesignStaircase {
  id: string;
  x: number;
  y: number;
  stairWidth: number;
  numSteps: number;
  riser: number;
  tread: number;
  stairType: string;
}

export interface DesignFoundation {
  id: string;
  columnId?: string;
  footingId?: string;
  x: number;
  y: number;
  length: number;
  width: number;
  depth: number;
  pedestalH?: number;
  gradeBeamL?: number;
  footingType?: string;
  concreteGrade?: string;
}

export interface DesignRoof {
  id: string;
  x: number;
  y: number;
  length: number;
  width: number;
  roofType: string;
  roofingMaterial: string;
  waterproofing: string;
}

export type DesignTool =
  | 'select'
  | 'wall'
  | 'column'
  | 'beam'
  | 'slab'
  | 'door'
  | 'window'
  | 'staircase'
  | 'foundation'
  | 'roof'
  | 'dimension'
  | 'move'
  | 'delete'
  | 'center';

export interface HistoryState {
  walls: DesignWall[];
  rooms: DesignRoom[];
  doors: DesignDoor[];
  windows: DesignWindow[];
  columns: DesignColumn[];
  beams: DesignBeam[];
  slabs: DesignSlab[];
  stairs: DesignStaircase[];
  foundations: DesignFoundation[];
  roofs: DesignRoof[];
}

interface DesignStoreState {
  walls: DesignWall[];
  rooms: DesignRoom[];
  doors: DesignDoor[];
  windows: DesignWindow[];
  columns: DesignColumn[];
  beams: DesignBeam[];
  slabs: DesignSlab[];
  stairs: DesignStaircase[];
  foundations: DesignFoundation[];
  roofs: DesignRoof[];

  selectedTool: DesignTool;
  selectedElementId: string | null;
  selectedElementType: 'wall' | 'room' | 'door' | 'window' | 'column' | 'beam' | 'slab' | 'staircase' | 'foundation' | 'roof' | null;

  gridSize: number; // pixels per grid unit (default 30)
  gridScale: number; // meters per grid unit (e.g. 0.5m)
  zoom: number;
  panOffset: Point;
  showGrid: boolean;
  snapToGrid: boolean;
  activeFloorId: string | null;

  history: HistoryState[];
  historyIndex: number;

  setActiveFloorId: (floorId: string | null) => void;
  setTool: (tool: DesignTool) => void;
  selectElement: (id: string | null, type: any) => void;
  clearSelection: () => void;

  addWall: (wall: Omit<DesignWall, 'id'>) => string;
  updateWall: (id: string, data: Partial<DesignWall>) => void;
  deleteWall: (id: string) => void;

  addRoom: (room: Omit<DesignRoom, 'id'>) => string;
  updateRoom: (id: string, data: Partial<DesignRoom>) => void;
  deleteRoom: (id: string) => void;

  addDoor: (door: Omit<DesignDoor, 'id'>) => string;
  updateDoor: (id: string, data: Partial<DesignDoor>) => void;
  deleteDoor: (id: string) => void;

  addWindow: (window: Omit<DesignWindow, 'id'>) => string;
  updateWindow: (id: string, data: Partial<DesignWindow>) => void;
  deleteWindow: (id: string) => void;

  addColumn: (column: Omit<DesignColumn, 'id'>) => string;
  updateColumn: (id: string, data: Partial<DesignColumn>) => void;
  deleteColumn: (id: string) => void;

  addBeam: (beam: Omit<DesignBeam, 'id'>) => string;
  updateBeam: (id: string, data: Partial<DesignBeam>) => void;
  deleteBeam: (id: string) => void;

  addSlab: (slab: Omit<DesignSlab, 'id'>) => string;
  updateSlab: (id: string, data: Partial<DesignSlab>) => void;
  deleteSlab: (id: string) => void;

  addStaircase: (stair: Omit<DesignStaircase, 'id'>) => string;
  updateStaircase: (id: string, data: Partial<DesignStaircase>) => void;
  deleteStaircase: (id: string) => void;

  addFoundation: (foundation: Omit<DesignFoundation, 'id'>) => string;
  updateFoundation: (id: string, data: Partial<DesignFoundation>) => void;
  deleteFoundation: (id: string) => void;

  addRoof: (roof: Omit<DesignRoof, 'id'>) => string;
  updateRoof: (id: string, data: Partial<DesignRoof>) => void;
  deleteRoof: (id: string) => void;

  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point) => void;
  setGridScale: (scale: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  centerCanvas: () => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  clearDesign: () => void;
  loadDesign: (data: {
    walls?: DesignWall[];
    rooms?: DesignRoom[];
    doors?: DesignDoor[];
    windows?: DesignWindow[];
    columns?: DesignColumn[];
    beams?: DesignBeam[];
    slabs?: DesignSlab[];
    stairs?: DesignStaircase[];
    foundations?: DesignFoundation[];
    roofs?: DesignRoof[];
    gridScale?: number;
  }) => void;

  saveToLocalStorage: () => void;
  loadFromLocalStorage: (floorId: string) => boolean;
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  columns: [],
  beams: [],
  slabs: [],
  stairs: [],
  foundations: [],
  roofs: [],

  selectedTool: 'select',
  selectedElementId: null,
  selectedElementType: null,

  gridSize: 30,
  gridScale: 0.5,
  zoom: 1,
  panOffset: { x: 100, y: 100 },
  showGrid: true,
  snapToGrid: true,
  activeFloorId: null,

  history: [{ walls: [], rooms: [], doors: [], windows: [], columns: [], beams: [], slabs: [], stairs: [], foundations: [], roofs: [] }],
  historyIndex: 0,

  setActiveFloorId: (activeFloorId) => set({ activeFloorId }),
  setTool: (tool) => set({ selectedTool: tool, selectedElementId: null, selectedElementType: null }),

  selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),
  clearSelection: () => set({ selectedElementId: null, selectedElementType: null }),

  addWall: (wallData) => {
    const id = `w-${uuidv4().substring(0, 6)}`;
    const newWall: DesignWall = { ...wallData, id };
    set((state) => ({
      walls: [...state.walls, newWall],
      selectedElementId: id,
      selectedElementType: 'wall',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateWall: (id, data) => {
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteWall: (id) => {
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      doors: state.doors.filter((d) => d.wallId !== id),
      windows: state.windows.filter((win) => win.wallId !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addRoom: (roomData) => {
    const id = `r-${uuidv4().substring(0, 6)}`;
    const newRoom: DesignRoom = { ...roomData, id };
    set((state) => ({
      rooms: [...state.rooms, newRoom],
      selectedElementId: id,
      selectedElementType: 'room',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateRoom: (id, data) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteRoom: (id) => {
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addDoor: (doorData) => {
    const id = `d-${uuidv4().substring(0, 6)}`;
    const newDoor: DesignDoor = { ...doorData, id };
    set((state) => ({
      doors: [...state.doors, newDoor],
      selectedElementId: id,
      selectedElementType: 'door',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateDoor: (id, data) => {
    set((state) => ({
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteDoor: (id) => {
    set((state) => ({
      doors: state.doors.filter((d) => d.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addWindow: (windowData) => {
    const id = `win-${uuidv4().substring(0, 6)}`;
    const newWindow: DesignWindow = { ...windowData, id };
    set((state) => ({
      windows: [...state.windows, newWindow],
      selectedElementId: id,
      selectedElementType: 'window',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateWindow: (id, data) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addColumn: (columnData) => {
    const id = `c-${uuidv4().substring(0, 6)}`;
    const newColumn: DesignColumn = { ...columnData, id };
    set((state) => ({
      columns: [...state.columns, newColumn],
      selectedElementId: id,
      selectedElementType: 'column',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateColumn: (id, data) => {
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteColumn: (id) => {
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== id),
      foundations: state.foundations.map((f) => (f.columnId === id ? { ...f, columnId: undefined } : f)),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addBeam: (beamData) => {
    const id = `bm-${uuidv4().substring(0, 6)}`;
    const newBeam: DesignBeam = { ...beamData, id };
    set((state) => ({
      beams: [...state.beams, newBeam],
      selectedElementId: id,
      selectedElementType: 'beam',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateBeam: (id, data) => {
    set((state) => ({
      beams: state.beams.map((b) => (b.id === id ? { ...b, ...data } : b)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteBeam: (id) => {
    set((state) => ({
      beams: state.beams.filter((b) => b.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addSlab: (slabData) => {
    const id = `sl-${uuidv4().substring(0, 6)}`;
    const newSlab: DesignSlab = { ...slabData, id };
    set((state) => ({
      slabs: [...state.slabs, newSlab],
      selectedElementId: id,
      selectedElementType: 'slab',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateSlab: (id, data) => {
    set((state) => ({
      slabs: state.slabs.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteSlab: (id) => {
    set((state) => ({
      slabs: state.slabs.filter((s) => s.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addStaircase: (stairData) => {
    const id = `st-${uuidv4().substring(0, 6)}`;
    const newStair: DesignStaircase = { ...stairData, id };
    set((state) => ({
      stairs: [...state.stairs, newStair],
      selectedElementId: id,
      selectedElementType: 'staircase',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateStaircase: (id, data) => {
    set((state) => ({
      stairs: state.stairs.map((st) => (st.id === id ? { ...st, ...data } : st)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteStaircase: (id) => {
    set((state) => ({
      stairs: state.stairs.filter((st) => st.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addFoundation: (foundationData) => {
    const id = `f-${uuidv4().substring(0, 6)}`;
    const newFoundation: DesignFoundation = { ...foundationData, id };
    set((state) => ({
      foundations: [...state.foundations, newFoundation],
      selectedElementId: id,
      selectedElementType: 'foundation',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateFoundation: (id, data) => {
    set((state) => ({
      foundations: state.foundations.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteFoundation: (id) => {
    set((state) => ({
      foundations: state.foundations.filter((f) => f.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  addRoof: (roofData) => {
    const id = `rf-${uuidv4().substring(0, 6)}`;
    const newRoof: DesignRoof = { ...roofData, id };
    set((state) => ({
      roofs: [...state.roofs, newRoof],
      selectedElementId: id,
      selectedElementType: 'roof',
    }));
    get().pushHistory();
    get().saveToLocalStorage();
    return id;
  },

  updateRoof: (id, data) => {
    set((state) => ({
      roofs: state.roofs.map((rf) => (rf.id === id ? { ...rf, ...data } : rf)),
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  deleteRoof: (id) => {
    set((state) => ({
      roofs: state.roofs.filter((rf) => rf.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().pushHistory();
    get().saveToLocalStorage();
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(3, zoom)) }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setGridScale: (gridScale) => set({ gridScale }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  centerCanvas: () => set({ zoom: 1, panOffset: { x: 150, y: 150 } }),

  pushHistory: () => {
    const { walls, rooms, doors, windows, columns, beams, slabs, stairs, foundations, roofs, history, historyIndex } = get();
    const currentState: HistoryState = {
      walls: JSON.parse(JSON.stringify(walls)),
      rooms: JSON.parse(JSON.stringify(rooms)),
      doors: JSON.parse(JSON.stringify(doors)),
      windows: JSON.parse(JSON.stringify(windows)),
      columns: JSON.parse(JSON.stringify(columns)),
      beams: JSON.parse(JSON.stringify(beams)),
      slabs: JSON.parse(JSON.stringify(slabs)),
      stairs: JSON.parse(JSON.stringify(stairs)),
      foundations: JSON.parse(JSON.stringify(foundations)),
      roofs: JSON.parse(JSON.stringify(roofs)),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        walls: JSON.parse(JSON.stringify(prev.walls || [])),
        rooms: JSON.parse(JSON.stringify(prev.rooms || [])),
        doors: JSON.parse(JSON.stringify(prev.doors || [])),
        windows: JSON.parse(JSON.stringify(prev.windows || [])),
        columns: JSON.parse(JSON.stringify(prev.columns || [])),
        beams: JSON.parse(JSON.stringify(prev.beams || [])),
        slabs: JSON.parse(JSON.stringify(prev.slabs || [])),
        stairs: JSON.parse(JSON.stringify(prev.stairs || [])),
        foundations: JSON.parse(JSON.stringify(prev.foundations || [])),
        roofs: JSON.parse(JSON.stringify(prev.roofs || [])),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        walls: JSON.parse(JSON.stringify(next.walls || [])),
        rooms: JSON.parse(JSON.stringify(next.rooms || [])),
        doors: JSON.parse(JSON.stringify(next.doors || [])),
        windows: JSON.parse(JSON.stringify(next.windows || [])),
        columns: JSON.parse(JSON.stringify(next.columns || [])),
        beams: JSON.parse(JSON.stringify(next.beams || [])),
        slabs: JSON.parse(JSON.stringify(next.slabs || [])),
        stairs: JSON.parse(JSON.stringify(next.stairs || [])),
        foundations: JSON.parse(JSON.stringify(next.foundations || [])),
        roofs: JSON.parse(JSON.stringify(next.roofs || [])),
        historyIndex: historyIndex + 1,
      });
    }
  },

  clearDesign: () => {
    set({
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      columns: [],
      beams: [],
      slabs: [],
      stairs: [],
      foundations: [],
      roofs: [],
      selectedElementId: null,
      selectedElementType: null,
    });
    get().pushHistory();
    get().saveToLocalStorage();
  },

  loadDesign: (data) => {
    set({
      walls: data.walls || [],
      rooms: data.rooms || [],
      doors: data.doors || [],
      windows: data.windows || [],
      columns: data.columns || [],
      beams: data.beams || [],
      slabs: data.slabs || [],
      stairs: data.stairs || [],
      foundations: data.foundations || [],
      roofs: data.roofs || [],
      gridScale: data.gridScale || 0.5,
      history: [
        {
          walls: data.walls || [],
          rooms: data.rooms || [],
          doors: data.doors || [],
          windows: data.windows || [],
          columns: data.columns || [],
          beams: data.beams || [],
          slabs: data.slabs || [],
          stairs: data.stairs || [],
          foundations: data.foundations || [],
          roofs: data.roofs || [],
        },
      ],
      historyIndex: 0,
    });
  },

  saveToLocalStorage: () => {
    const { activeFloorId, walls, rooms, doors, windows, columns, beams, slabs, stairs, foundations, roofs, gridScale } = get();
    if (!activeFloorId) return;
    try {
      const backupData = { walls, rooms, doors, windows, columns, beams, slabs, stairs, foundations, roofs, gridScale, savedAt: Date.now() };
      localStorage.setItem(`nirmanpro_design_backup_${activeFloorId}`, JSON.stringify(backupData));
    } catch (_) {}
  },

  loadFromLocalStorage: (floorId: string) => {
    try {
      const raw = localStorage.getItem(`nirmanpro_design_backup_${floorId}`);
      if (!raw) return false;
      const data = JSON.parse(raw);
      get().loadDesign(data);
      return true;
    } catch (_) {
      return false;
    }
  },
}));
