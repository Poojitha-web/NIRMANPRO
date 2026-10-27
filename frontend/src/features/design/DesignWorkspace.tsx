import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Text, Group, Arc, Circle } from 'react-konva';
import { Project } from '../../types';
import {
  useDesignStore,
  DesignTool,
  DesignColumn,
  DesignBeam,
  DesignSlab,
  DesignFoundation,
} from './store/designStore';
import { projectsApi } from '../../api/projects';
import {
  MousePointer,
  Square,
  DoorOpen,
  Maximize2,
  Ruler,
  Trash2,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid as GridIcon,
  Magnet,
  Layers,
  Columns as ColumnIcon,
  Box,
  Layers3,
  Anchor,
  Compass,
  Plus,
  Copy,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DesignWorkspaceProps {
  project: Project;
  onRefresh?: () => void;
}

const ROOM_COLORS = [
  'rgba(59,130,246,0.18)',
  'rgba(16,185,129,0.18)',
  'rgba(245,158,11,0.18)',
  'rgba(239,68,68,0.18)',
  'rgba(168,85,247,0.18)',
  'rgba(236,72,153,0.18)',
  'rgba(20,184,166,0.18)',
];
const ROOM_STROKE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6',
];

export const DesignWorkspace: React.FC<DesignWorkspaceProps> = ({ project, onRefresh }) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const currentFloor = project.floors?.[activeFloorIndex] || project.floors?.[0];

  const store = useDesignStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan drag state
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);

  // Floor Management States
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [newWallHeight, setNewWallHeight] = useState('3.0');
  const [newWallThickness, setNewWallThickness] = useState('0.23');
  const [isCopyFloorOpen, setIsCopyFloorOpen] = useState(false);
  const [sourceFloorIdToCopy, setSourceFloorIdToCopy] = useState('');
  const [isRenameFloorOpen, setIsRenameFloorOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Design Validation States
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsApi.createFloor(project.id, {
        floorName: newFloorName || `Floor ${(project.floors?.length || 0)}`,
        wallHeight: parseFloat(newWallHeight) || 3.0,
        wallThickness: parseFloat(newWallThickness) || 0.23,
      });
      toast.success('Floor added successfully!');
      setIsAddFloorOpen(false);
      setNewFloorName('');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to add floor');
    }
  };

  const handleDuplicateFloor = async () => {
    if (!currentFloor) return;
    try {
      await projectsApi.duplicateFloor(currentFloor.id);
      toast.success(`Duplicated ${currentFloor.floorName}!`);
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to duplicate floor');
    }
  };

  const handleCopyFromFloor = async () => {
    if (!currentFloor || !sourceFloorIdToCopy) return;
    try {
      await projectsApi.copyFloorElements(currentFloor.id, sourceFloorIdToCopy);
      toast.success('Floor elements copied successfully!');
      setIsCopyFloorOpen(false);
      loadFloorData(currentFloor.id);
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to copy elements');
    }
  };

  const handleRenameFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFloor || !renameValue.trim()) return;
    try {
      await projectsApi.updateFloor(currentFloor.id, { floorName: renameValue.trim() });
      toast.success('Floor renamed successfully!');
      setIsRenameFloorOpen(false);
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to rename floor');
    }
  };

  const handleDeleteFloor = async () => {
    if (!currentFloor) return;
    if ((project.floors?.length || 0) <= 1) {
      toast.error('A project must have at least one floor.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${currentFloor.floorName}? This cannot be undone.`)) return;
    try {
      await projectsApi.deleteFloor(currentFloor.id);
      toast.success('Floor deleted successfully');
      setActiveFloorIndex(0);
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to delete floor');
    }
  };

  const handleRunValidation = async () => {
    setValidating(true);
    setIsValidationOpen(true);
    try {
      const res = await projectsApi.validateDesign(project.id);
      setValidationResult(res);
    } catch {
      toast.error('Failed to validate project design');
    } finally {
      setValidating(false);
    }
  };

  // Measure canvas container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Load floor data & set active floor ID
  useEffect(() => {
    if (currentFloor) {
      store.setActiveFloorId(currentFloor.id);
      loadFloorData(currentFloor.id);
    }
    setIsDrawing(false);
    setDrawStart(null);
  }, [currentFloor?.id]);

  const loadFloorData = async (floorId: string) => {
    try {
      const design = await projectsApi.getDesign(floorId);
      let layout: any = design.designLayout?.layoutData || design.layoutData;
      if (typeof layout === 'string') {
        try {
          layout = JSON.parse(layout);
        } catch (_) {}
      }

      if (layout && (layout.walls?.length || layout.rooms?.length || layout.columns?.length)) {
        store.loadDesign({
          walls: layout.walls || design.walls || [],
          rooms: layout.rooms || design.rooms || [],
          doors: layout.doors || design.doors || [],
          windows: layout.windows || design.windows || [],
          columns: layout.columns || [],
          beams: layout.beams || [],
          slabs: layout.slabs || [],
          foundations: layout.foundations || [],
          gridScale: layout.gridScale || design.designLayout?.gridScale || 0.5,
        });
      } else {
        // Fallback to local auto-recovery if available
        const recovered = store.loadFromLocalStorage(floorId);
        if (!recovered) {
          store.loadDesign({
            walls: design.walls || [],
            rooms: design.rooms || [],
            doors: design.doors || [],
            windows: design.windows || [],
            columns: [],
            beams: [],
            slabs: [],
            foundations: [],
            gridScale: 0.5,
          });
        }
      }
    } catch {
      store.loadFromLocalStorage(floorId);
    }
  };

  const handleSave = async () => {
    if (!currentFloor) return;
    try {
      const layoutPayload = {
        walls: store.walls,
        rooms: store.rooms,
        doors: store.doors,
        windows: store.windows,
        columns: store.columns,
        beams: store.beams,
        slabs: store.slabs,
        foundations: store.foundations,
        gridScale: store.gridScale,
      };

      await projectsApi.saveDesign(currentFloor.id, {
        walls: store.walls,
        rooms: store.rooms,
        doors: store.doors,
        windows: store.windows,
        gridScale: store.gridScale,
        layoutData: layoutPayload,
      });

      store.saveToLocalStorage();
      toast.success('Design saved successfully!');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to save design layout');
    }
  };

  // Convert screen point → world point
  const toWorld = useCallback(
    (sx: number, sy: number) => {
      const wx = (sx - store.panOffset.x) / store.zoom;
      const wy = (sy - store.panOffset.y) / store.zoom;
      return { x: wx, y: wy };
    },
    [store.zoom, store.panOffset]
  );

  // Snap to grid
  const snap = useCallback(
    (v: number) => {
      if (!store.snapToGrid) return v;
      return Math.round(v / store.gridSize) * store.gridSize;
    },
    [store.snapToGrid, store.gridSize]
  );

  const snapPt = useCallback(
    (sx: number, sy: number) => {
      const w = toWorld(sx, sy);
      return { x: snap(w.x), y: snap(w.y) };
    },
    [toWorld, snap]
  );

  // ─── Mouse Handlers ───
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (e.evt.button === 1 || store.selectedTool === 'move') {
      isPanning.current = true;
      lastPanPoint.current = pos;
      return;
    }

    if (store.selectedTool === 'select' || store.selectedTool === 'center') {
      if (store.selectedTool === 'center') store.centerCanvas();
      return;
    }

    const { x, y } = snapPt(pos.x, pos.y);

    if ((store.selectedTool as string) === 'wall') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart({ x, y });
      } else if (drawStart) {
        const dx = x - drawStart.x;
        const dy = y - drawStart.y;
        const pxLen = Math.sqrt(dx * dx + dy * dy);
        const realLen = parseFloat(((pxLen / store.gridSize) * store.gridScale).toFixed(2));
        if (realLen > 0.05) {
          const wallId = store.addWall({
            startX: drawStart.x,
            startY: drawStart.y,
            endX: x,
            endY: y,
            length: realLen,
            height: currentFloor?.wallHeight ?? 3.0,
            thickness: currentFloor?.wallThickness ?? 0.23,
            wallType: 'brick',
            material: 'brick',
            cost: Math.round(realLen * (currentFloor?.wallHeight ?? 3.0) * 1500),
          });
          toast.success(`Wall created (${realLen}m)`);
        }
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else if ((store.selectedTool as string) === 'room') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart({ x, y });
      } else if (drawStart) {
        const w = Math.abs(x - drawStart.x);
        const h = Math.abs(y - drawStart.y);
        const realW = parseFloat(((w / store.gridSize) * store.gridScale).toFixed(2));
        const realH = parseFloat(((h / store.gridSize) * store.gridScale).toFixed(2));
        if (realW > 0.1 && realH > 0.1) {
          store.addRoom({
            roomName: `Room ${store.rooms.length + 1}`,
            x: Math.min(drawStart.x, x),
            y: Math.min(drawStart.y, y),
            length: realH,
            width: realW,
            area: parseFloat((realW * realH).toFixed(2)),
            flooringType: 'Vitrified Tiles',
          });
          toast.success(`Room added (${realW}m × ${realH}m)`);
        }
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else if (store.selectedTool === 'column') {
      store.addColumn({
        x,
        y,
        length: 0.3,
        width: 0.3,
        height: currentFloor?.height || 3.0,
        concreteGrade: 'M25',
        steelGrade: 'Fe500',
      });
      toast.success('Column placed');
    } else if (store.selectedTool === 'beam') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart({ x, y });
      } else if (drawStart) {
        const dx = (x - drawStart.x) / store.gridSize * store.gridScale;
        const dy = (y - drawStart.y) / store.gridSize * store.gridScale;
        const len = Math.sqrt(dx * dx + dy * dy);
        store.addBeam({
          startX: drawStart.x,
          startY: drawStart.y,
          endX: x,
          endY: y,
          length: Number(len.toFixed(2)),
          width: 0.23,
          depth: 0.45,
          concreteGrade: 'M25',
        });
        toast.success('Beam created');
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else if (store.selectedTool === 'slab') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart({ x, y });
      } else if (drawStart) {
        const w = Math.abs(x - drawStart.x);
        const h = Math.abs(y - drawStart.y);
        const realW = parseFloat(((w / store.gridSize) * store.gridScale).toFixed(2));
        const realH = parseFloat(((h / store.gridSize) * store.gridScale).toFixed(2));
        store.addSlab({
          x: Math.min(drawStart.x, x),
          y: Math.min(drawStart.y, y),
          length: realH,
          width: realW,
          thickness: 0.15,
          concreteGrade: 'M25',
          slabType: 'RCC One-way',
        });
        toast.success('RCC Slab placed');
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else if (store.selectedTool === 'door') {
      // Find wall attachment (Part 7)
      let attachedWall = null;
      let minD = Infinity;
      for (const w of store.walls) {
        const d = pointToSegmentDistance(x, y, w.startX, w.startY, w.endX, w.endY);
        if (d < minD) {
          minD = d;
          attachedWall = w;
        }
      }

      if (!attachedWall || minD > 30) {
        toast.error('Door must be placed on an existing wall!', { icon: '⚠️' });
        return;
      }

      store.addDoor({
        wallId: attachedWall.id,
        x,
        y,
        width: 0.9,
        height: 2.1,
        doorType: 'single',
        position: 0.5,
      });
      toast.success('Door inserted on wall');
    } else if (store.selectedTool === 'window') {
      // Find wall attachment (Part 8)
      let attachedWall = null;
      let minD = Infinity;
      for (const w of store.walls) {
        const d = pointToSegmentDistance(x, y, w.startX, w.startY, w.endX, w.endY);
        if (d < minD) {
          minD = d;
          attachedWall = w;
        }
      }

      if (!attachedWall || minD > 30) {
        toast.error('Window must be placed on an existing wall!', { icon: '⚠️' });
        return;
      }

      store.addWindow({
        wallId: attachedWall.id,
        x,
        y,
        width: 1.2,
        height: 1.2,
        windowType: 'sliding',
        position: 0.5,
        sillHeight: 0.9,
      });
      toast.success('Window attached to wall');
    } else if (store.selectedTool === 'foundation') {
      // Link to nearest column if available (Part 10)
      let nearestCol = store.columns.find(
        (c) => Math.hypot(c.x - x, c.y - y) < 40
      );

      store.addFoundation({
        columnId: nearestCol?.id,
        x,
        y,
        length: 1.2,
        width: 1.2,
        depth: 1.5,
        footingType: 'Isolated Footing',
      });

      if (nearestCol) {
        toast.success(`Footing linked to Column ${nearestCol.id.substring(0, 4)}`);
      } else {
        toast.success('Isolated Footing placed');
      }
    }
  };

  const pointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isPanning.current && lastPanPoint.current) {
      const dx = pos.x - lastPanPoint.current.x;
      const dy = pos.y - lastPanPoint.current.y;
      store.setPanOffset({ x: store.panOffset.x + dx, y: store.panOffset.y + dy });
      lastPanPoint.current = pos;
      return;
    }

    const { x, y } = snapPt(pos.x, pos.y);
    setMousePos({ x, y });
  };

  const handleMouseUp = (e: any) => {
    if (e.evt.button === 1 || isPanning.current) {
      isPanning.current = false;
      lastPanPoint.current = null;
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newZoom = Math.max(0.15, Math.min(4, store.zoom * (direction > 0 ? scaleBy : 1 / scaleBy)));

    const mousePointTo = {
      x: (pointer.x - store.panOffset.x) / store.zoom,
      y: (pointer.y - store.panOffset.y) / store.zoom,
    };
    store.setPanOffset({
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    });
    store.setZoom(newZoom);
  };

  // ─── Grid Lines ───
  const buildGridLines = () => {
    const gs = store.gridSize;
    const worldW = stageSize.width / store.zoom;
    const worldH = stageSize.height / store.zoom;
    const offX = store.panOffset.x / store.zoom;
    const offY = store.panOffset.y / store.zoom;

    const startCol = Math.floor(-offX / gs) - 1;
    const endCol = Math.ceil((worldW - offX) / gs) + 1;
    const startRow = Math.floor(-offY / gs) - 1;
    const endRow = Math.ceil((worldH - offY) / gs) + 1;

    const lines: React.ReactNode[] = [];

    for (let row = startRow; row <= endRow; row++) {
      const y = row * gs;
      const isMajor = row % 5 === 0;
      lines.push(
        <Line
          key={`h-${row}`}
          points={[startCol * gs, y, endCol * gs, y]}
          stroke={isMajor ? '#334155' : '#1e3048'}
          strokeWidth={isMajor ? 1 / store.zoom : 0.5 / store.zoom}
        />
      );
    }

    for (let col = startCol; col <= endCol; col++) {
      const x = col * gs;
      const isMajor = col % 5 === 0;
      lines.push(
        <Line
          key={`v-${col}`}
          points={[x, startRow * gs, x, endRow * gs]}
          stroke={isMajor ? '#334155' : '#1e3048'}
          strokeWidth={isMajor ? 1 / store.zoom : 0.5 / store.zoom}
        />
      );
    }

    lines.push(
      <Line key="axis-x" points={[startCol * gs, 0, endCol * gs, 0]} stroke="#3b82f6" strokeWidth={1.5 / store.zoom} opacity={0.6} />,
      <Line key="axis-y" points={[0, startRow * gs, 0, endRow * gs]} stroke="#3b82f6" strokeWidth={1.5 / store.zoom} opacity={0.6} />
    );

    return lines;
  };

  // Ghost Preview while drawing
  const renderGhost = () => {
    if (!isDrawing || !drawStart) return null;
    const { x, y } = mousePos;

    if (store.selectedTool === 'wall') {
      const dx = x - drawStart.x;
      const dy = y - drawStart.y;
      const pxLen = Math.sqrt(dx * dx + dy * dy);
      const realLen = ((pxLen / store.gridSize) * store.gridScale).toFixed(2);
      const midX = (drawStart.x + x) / 2;
      const midY = (drawStart.y + y) / 2;
      return (
        <Group>
          <Circle x={drawStart.x} y={drawStart.y} radius={5 / store.zoom} fill="#60a5fa" />
          <Line
            points={[drawStart.x, drawStart.y, x, y]}
            stroke="#60a5fa"
            strokeWidth={10 / store.zoom}
            dash={[8 / store.zoom, 4 / store.zoom]}
            opacity={0.8}
          />
          <Circle x={x} y={y} radius={5 / store.zoom} fill="#60a5fa" />
          <Rect
            x={midX - 28 / store.zoom}
            y={midY - 10 / store.zoom}
            width={56 / store.zoom}
            height={18 / store.zoom}
            fill="#1e3a5f"
            cornerRadius={3 / store.zoom}
          />
          <Text
            x={midX - 26 / store.zoom}
            y={midY - 7 / store.zoom}
            text={`${realLen}m`}
            fill="#93c5fd"
            fontSize={11 / store.zoom}
            fontStyle="bold"
            align="center"
            width={52 / store.zoom}
          />
        </Group>
      );
    }

    if ((store.selectedTool as string) === 'room') {
      const rx = Math.min(drawStart.x, x);
      const ry = Math.min(drawStart.y, y);
      const rw = Math.abs(x - drawStart.x);
      const rh = Math.abs(y - drawStart.y);
      const realW = ((rw / store.gridSize) * store.gridScale).toFixed(2);
      const realH = ((rh / store.gridSize) * store.gridScale).toFixed(2);
      return (
        <Group>
          <Rect
            x={rx} y={ry} width={rw} height={rh}
            fill="rgba(59,130,246,0.12)"
            stroke="#3b82f6"
            strokeWidth={2 / store.zoom}
            dash={[6 / store.zoom, 3 / store.zoom]}
          />
          <Text
            x={rx + 4 / store.zoom}
            y={ry + 4 / store.zoom}
            text={`${realW}m × ${realH}m`}
            fill="#93c5fd"
            fontSize={11 / store.zoom}
            fontStyle="bold"
          />
        </Group>
      );
    }
    return null;
  };

  const gs = store.gridSize;
  const selectedWall = store.walls.find((w) => w.id === store.selectedElementId);
  const selectedRoom = store.rooms.find((r) => r.id === store.selectedElementId);
  const selectedDoor = store.doors.find((d) => d.id === store.selectedElementId);
  const selectedWindow = store.windows.find((w) => w.id === store.selectedElementId);
  const selectedColumn = store.columns.find((c) => c.id === store.selectedElementId);
  const selectedFoundation = store.foundations.find((f) => f.id === store.selectedElementId);

  const cursorReal = {
    x: ((mousePos.x / gs) * store.gridScale).toFixed(2),
    y: ((mousePos.y / gs) * store.gridScale).toFixed(2),
  };

  const toolsList: { tool: any; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Select' },
    { tool: 'wall', icon: <div className="w-4 h-0.5 bg-current rounded" />, label: 'Wall' },
    { tool: 'column', icon: <ColumnIcon className="w-4 h-4" />, label: 'Column' },
    { tool: 'beam', icon: <Box className="w-4 h-4 text-amber-400" />, label: 'Beam' },
    { tool: 'slab', icon: <Layers3 className="w-4 h-4 text-emerald-400" />, label: 'Slab' },
    { tool: 'room', icon: <Square className="w-4 h-4" />, label: 'Room' },
    { tool: 'door', icon: <DoorOpen className="w-4 h-4" />, label: 'Door' },
    { tool: 'window', icon: <Ruler className="w-4 h-4" />, label: 'Window' },
    { tool: 'foundation', icon: <Anchor className="w-4 h-4 text-purple-400" />, label: 'Footing' },
    { tool: 'move', icon: <Compass className="w-4 h-4" />, label: 'Pan' },
    { tool: 'delete', icon: <Trash2 className="w-4 h-4 text-rose-400" />, label: 'Delete' },
  ];

  return (
    <div className="flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl" style={{ height: 740 }}>
      {/* ── Floor Tabs & Management ── */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border-b border-slate-700 px-4 py-2 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {project.floors?.map((f, idx) => (
            <button
              key={f.id}
              onClick={() => setActiveFloorIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeFloorIndex === idx
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {f.floorName}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Floor Actions */}
          <button
            onClick={() => setIsAddFloorOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all"
            title="Add New Floor"
          >
            <Plus className="w-3.5 h-3.5 text-brand-400" /> Add Floor
          </button>

          <button
            onClick={handleDuplicateFloor}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all"
            title="Duplicate Current Floor"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" /> Duplicate
          </button>

          {project.floors && project.floors.length > 1 && (
            <button
              onClick={() => {
                const other = project.floors?.find((f) => f.id !== currentFloor?.id);
                if (other) setSourceFloorIdToCopy(other.id);
                setIsCopyFloorOpen(true);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all"
              title="Copy Elements from Another Floor"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" /> Copy From...
            </button>
          )}

          <button
            onClick={() => {
              setRenameValue(currentFloor?.floorName || '');
              setIsRenameFloorOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Rename Current Floor"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {project.floors && project.floors.length > 1 && (
            <button
              onClick={handleDeleteFloor}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Delete Current Floor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded hidden sm:inline">
            1 cell = {store.gridScale}m · Grid {store.gridSize}px
          </span>

          <button
            onClick={handleRunValidation}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            title="Validate Architectural & Structural Design"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Validate Design
          </button>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Design
          </button>
        </div>
      </div>

      {/* ── Top AutoCAD Toolbar ── */}
      <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 text-xs shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={store.undo} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={store.redo} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button onClick={() => store.setZoom(store.zoom * 1.2)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Zoom In (+)">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => store.setZoom(store.zoom / 1.2)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Zoom Out (-)">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={store.centerCanvas} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Center Canvas">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={store.toggleGrid}
            className={`p-1.5 rounded transition-colors ${store.showGrid ? 'bg-brand-600/30 text-brand-400' : 'text-slate-500 hover:bg-slate-800'}`}
            title="Toggle Grid"
          >
            <GridIcon className="w-4 h-4" />
          </button>
          <button
            onClick={store.toggleSnap}
            className={`p-1.5 rounded transition-colors ${store.snapToGrid ? 'bg-brand-600/30 text-brand-400' : 'text-slate-500 hover:bg-slate-800'}`}
            title="Snap to Grid"
          >
            <Magnet className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={store.clearDesign}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="text-yellow-400 font-bold uppercase">{store.selectedTool}</span>
          <span>X: {cursorReal.x}m</span>
          <span>Y: {cursorReal.y}m</span>
          <span>Zoom: {Math.round(store.zoom * 100)}%</span>
        </div>
      </div>

      {/* ── Main Canvas Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar Tool Palette ── */}
        <div className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-2 gap-1 shrink-0 overflow-y-auto">
          {toolsList.map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => {
                store.setTool(tool);
                setIsDrawing(false);
                setDrawStart(null);
              }}
              title={label}
              className={`w-10 h-9 rounded-xl flex items-center justify-center transition-all ${
                store.selectedTool === tool
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* ── Konva Stage Workspace ── */}
        <div
          ref={containerRef}
          className="flex-1 bg-[#0a1628] relative overflow-hidden"
          style={{ cursor: store.selectedTool === 'select' ? 'default' : 'crosshair' }}
        >
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            scaleX={store.zoom}
            scaleY={store.zoom}
            x={store.panOffset.x}
            y={store.panOffset.y}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Grid Layer */}
            <Layer>{store.showGrid && buildGridLines()}</Layer>

            {/* Foundations / Footings Layer */}
            <Layer>
              {store.foundations.map((f) => {
                const isSelected = store.selectedElementId === f.id;
                const sizePx = 40 / store.zoom;
                return (
                  <Group key={f.id} x={f.x} y={f.y} onClick={() => store.selectElement(f.id, 'foundation')}>
                    <Rect
                      x={-sizePx / 2}
                      y={-sizePx / 2}
                      width={sizePx}
                      height={sizePx}
                      fill={isSelected ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.2)'}
                      stroke={isSelected ? '#c084fc' : '#a855f7'}
                      strokeWidth={2 / store.zoom}
                    />
                    <Text
                      x={-sizePx / 2}
                      y={sizePx / 2 + 2}
                      text={`F(${f.length}×${f.width}m)`}
                      fill="#c084fc"
                      fontSize={9 / store.zoom}
                    />
                  </Group>
                );
              })}
            </Layer>

            {/* Slabs Layer */}
            <Layer>
              {store.slabs.map((s) => {
                const isSelected = store.selectedElementId === s.id;
                const wPx = (s.width / store.gridScale) * gs;
                const hPx = (s.length / store.gridScale) * gs;
                return (
                  <Group key={s.id} onClick={() => store.selectElement(s.id, 'slab')}>
                    <Rect
                      x={s.x}
                      y={s.y}
                      width={wPx}
                      height={hPx}
                      fill={isSelected ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.12)'}
                      stroke={isSelected ? '#34d399' : '#10b981'}
                      strokeWidth={1.5 / store.zoom}
                      dash={[4 / store.zoom, 4 / store.zoom]}
                    />
                    <Text
                      x={s.x + 4 / store.zoom}
                      y={s.y + 4 / store.zoom}
                      text={`RCC Slab ${s.thickness * 100}cm`}
                      fill="#34d399"
                      fontSize={10 / store.zoom}
                      fontStyle="bold"
                    />
                  </Group>
                );
              })}
            </Layer>

            {/* Rooms Layer */}
            <Layer>
              {store.rooms.map((r, idx) => {
                const isSelected = store.selectedElementId === r.id;
                const widthPx = (r.width / store.gridScale) * gs;
                const heightPx = (r.length / store.gridScale) * gs;
                const colorIdx = idx % ROOM_COLORS.length;
                return (
                  <Group key={r.id} onClick={() => store.selectElement(r.id, 'room')}>
                    <Rect
                      x={r.x}
                      y={r.y}
                      width={widthPx}
                      height={heightPx}
                      fill={isSelected ? 'rgba(59,130,246,0.30)' : ROOM_COLORS[colorIdx]}
                      stroke={isSelected ? '#60a5fa' : ROOM_STROKE[colorIdx]}
                      strokeWidth={(isSelected ? 2.5 : 1.5) / store.zoom}
                    />
                    <Text
                      x={r.x + 6 / store.zoom}
                      y={r.y + 6 / store.zoom}
                      text={r.roomName}
                      fill={isSelected ? '#93c5fd' : ROOM_STROKE[colorIdx]}
                      fontSize={12 / store.zoom}
                      fontStyle="bold"
                    />
                    <Text
                      x={r.x + 6 / store.zoom}
                      y={r.y + 22 / store.zoom}
                      text={`${r.area} m²`}
                      fill="#64748b"
                      fontSize={10 / store.zoom}
                    />
                  </Group>
                );
              })}
            </Layer>

            {/* Beams & Walls Layer */}
            <Layer>
              {store.beams.map((b) => {
                const isSelected = store.selectedElementId === b.id;
                return (
                  <Group key={b.id} onClick={() => store.selectElement(b.id, 'beam')}>
                    <Line
                      points={[b.startX, b.startY, b.endX, b.endY]}
                      stroke={isSelected ? '#fbbf24' : '#f59e0b'}
                      strokeWidth={8 / store.zoom}
                      dash={[6 / store.zoom, 3 / store.zoom]}
                    />
                  </Group>
                );
              })}

              {store.walls.map((w) => {
                const isSelected = store.selectedElementId === w.id;
                const midX = (w.startX + w.endX) / 2;
                const midY = (w.startY + w.endY) / 2;
                const angle = Math.atan2(w.endY - w.startY, w.endX - w.startX);
                const perpX = (Math.sin(angle) * 14) / store.zoom;
                const perpY = (-Math.cos(angle) * 14) / store.zoom;
                return (
                  <Group key={w.id} onClick={() => store.selectElement(w.id, 'wall')}>
                    <Line
                      points={[w.startX, w.startY, w.endX, w.endY]}
                      stroke={isSelected ? '#60a5fa' : '#cbd5e1'}
                      strokeWidth={(isSelected ? 14 : 10) / store.zoom}
                      lineCap="round"
                    />
                    <Circle x={w.startX} y={w.startY} radius={5 / store.zoom} fill={isSelected ? '#60a5fa' : '#94a3b8'} />
                    <Circle x={w.endX} y={w.endY} radius={5 / store.zoom} fill={isSelected ? '#60a5fa' : '#94a3b8'} />
                    <Rect
                      x={midX + perpX - 22 / store.zoom}
                      y={midY + perpY - 9 / store.zoom}
                      width={44 / store.zoom}
                      height={16 / store.zoom}
                      fill="rgba(15,23,42,0.85)"
                      cornerRadius={3 / store.zoom}
                    />
                    <Text
                      x={midX + perpX - 20 / store.zoom}
                      y={midY + perpY - 6 / store.zoom}
                      text={`${w.length}m`}
                      fill="#60a5fa"
                      fontSize={10 / store.zoom}
                      fontStyle="bold"
                      width={40 / store.zoom}
                      align="center"
                    />
                  </Group>
                );
              })}

              {renderGhost()}
            </Layer>

            {/* Columns Layer */}
            <Layer>
              {store.columns.map((c) => {
                const isSelected = store.selectedElementId === c.id;
                const colSize = 20 / store.zoom;
                return (
                  <Group key={c.id} x={c.x} y={c.y} onClick={() => store.selectElement(c.id, 'column')}>
                    <Rect
                      x={-colSize / 2}
                      y={-colSize / 2}
                      width={colSize}
                      height={colSize}
                      fill={isSelected ? '#ef4444' : '#dc2626'}
                      stroke="#fca5a5"
                      strokeWidth={1.5 / store.zoom}
                    />
                    <Text
                      x={colSize / 2 + 2}
                      y={-6 / store.zoom}
                      text={`C(${c.concreteGrade})`}
                      fill="#ef4444"
                      fontSize={9 / store.zoom}
                      fontStyle="bold"
                    />
                  </Group>
                );
              })}
            </Layer>

            {/* Doors & Windows Layer */}
            <Layer>
              {store.doors.map((d) => {
                const isSelected = store.selectedElementId === d.id;
                return (
                  <Group key={d.id} x={d.x} y={d.y} onClick={() => store.selectElement(d.id, 'door')}>
                    <Arc
                      x={0}
                      y={0}
                      innerRadius={0}
                      outerRadius={22 / store.zoom}
                      angle={90}
                      rotation={-90}
                      fill="rgba(245,158,11,0.25)"
                      stroke={isSelected ? '#fbbf24' : '#f59e0b'}
                      strokeWidth={1.5 / store.zoom}
                    />
                    <Line
                      points={[0, 0, 22 / store.zoom, 0]}
                      stroke={isSelected ? '#fbbf24' : '#f59e0b'}
                      strokeWidth={3 / store.zoom}
                    />
                    <Text
                      x={4 / store.zoom}
                      y={-18 / store.zoom}
                      text={`D(${d.width}m)`}
                      fill="#f59e0b"
                      fontSize={9 / store.zoom}
                    />
                  </Group>
                );
              })}

              {store.windows.map((win) => {
                const isSelected = store.selectedElementId === win.id;
                const wPx = (win.width / store.gridScale) * gs;
                return (
                  <Group key={win.id} x={win.x} y={win.y} onClick={() => store.selectElement(win.id, 'window')}>
                    <Rect
                      x={-wPx / 2}
                      y={-5 / store.zoom}
                      width={wPx}
                      height={10 / store.zoom}
                      fill={isSelected ? 'rgba(6,182,212,0.4)' : 'rgba(6,182,212,0.2)'}
                      stroke={isSelected ? '#22d3ee' : '#06b6d4'}
                      strokeWidth={2 / store.zoom}
                    />
                    <Text
                      x={-wPx / 2}
                      y={-18 / store.zoom}
                      text={`W(${win.width}m)`}
                      fill="#06b6d4"
                      fontSize={9 / store.zoom}
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>

          {/* Scale Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 font-mono backdrop-blur-sm">
            <div className="h-2 border-l border-b border-r border-slate-400" style={{ width: 60 }} />
            <span>{((60 / store.zoom / gs) * store.gridScale).toFixed(1)}m</span>
          </div>
        </div>

        {/* ── Right Properties Panel ── */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-xs shrink-0 overflow-y-auto flex flex-col gap-4">
          <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Properties Panel</h3>

          {/* Canvas Summary */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
            <div>Walls: <span className="text-white font-bold">{store.walls.length}</span></div>
            <div>Columns: <span className="text-white font-bold">{store.columns.length}</span></div>
            <div>Doors: <span className="text-white font-bold">{store.doors.length}</span></div>
            <div>Windows: <span className="text-white font-bold">{store.windows.length}</span></div>
            <div>Footings: <span className="text-white font-bold">{store.foundations.length}</span></div>
            <div>Rooms: <span className="text-white font-bold">{store.rooms.length}</span></div>
          </div>

          {/* Wall Selected Properties (Part 6) */}
          {selectedWall && (
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-brand-500/40">
              <span className="font-bold text-brand-400 block text-xs">Wall Properties (ID: {selectedWall.id})</span>
              <div>
                <label className="text-slate-400 block mb-1">Length (m)</label>
                <input
                  type="number" step="0.05"
                  value={selectedWall.length}
                  onChange={(e) => store.updateWall(selectedWall.id, { length: parseFloat(e.target.value) || 0.1 })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Height (m)</label>
                <input
                  type="number" step="0.1"
                  value={selectedWall.height}
                  onChange={(e) => store.updateWall(selectedWall.id, { height: parseFloat(e.target.value) || 3.0 })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Thickness (m)</label>
                <input
                  type="number" step="0.01"
                  value={selectedWall.thickness}
                  onChange={(e) => store.updateWall(selectedWall.id, { thickness: parseFloat(e.target.value) || 0.23 })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Material / Brick Type</label>
                <select
                  value={selectedWall.material}
                  onChange={(e) => store.updateWall(selectedWall.id, { material: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                >
                  <option value="brick">Red Brick</option>
                  <option value="flyash">Flyash Brick</option>
                  <option value="aac">AAC Block</option>
                  <option value="concrete">Concrete Block</option>
                </select>
              </div>
              <button
                onClick={() => store.deleteWall(selectedWall.id)}
                className="w-full py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded font-semibold transition-colors"
              >
                Delete Wall
              </button>
            </div>
          )}

          {/* Column Properties (Part 9) */}
          {selectedColumn && (
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-red-500/40">
              <span className="font-bold text-red-400 block text-xs">Column Properties</span>
              <div>
                <label className="text-slate-400 block mb-1">Concrete Grade</label>
                <select
                  value={selectedColumn.concreteGrade}
                  onChange={(e) => store.updateColumn(selectedColumn.id, { concreteGrade: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                >
                  <option value="M20">M20 Grade</option>
                  <option value="M25">M25 Grade</option>
                  <option value="M30">M30 Grade</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Steel Grade</label>
                <select
                  value={selectedColumn.steelGrade}
                  onChange={(e) => store.updateColumn(selectedColumn.id, { steelGrade: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                >
                  <option value="Fe415">Fe415</option>
                  <option value="Fe500">Fe500</option>
                  <option value="Fe550">Fe550</option>
                </select>
              </div>
              <button
                onClick={() => store.deleteColumn(selectedColumn.id)}
                className="w-full py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded font-semibold"
              >
                Delete Column
              </button>
            </div>
          )}

          {/* Foundation Properties (Part 10) */}
          {selectedFoundation && (
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-purple-500/40">
              <span className="font-bold text-purple-400 block text-xs">Footing / Foundation</span>
              <div className="text-slate-400">
                Linked Column: <span className="text-white font-bold">{selectedFoundation.columnId || 'Unlinked'}</span>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Footing Type</label>
                <select
                  value={selectedFoundation.footingType}
                  onChange={(e) => store.updateFoundation(selectedFoundation.id, { footingType: e.target.value })}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                >
                  <option value="Isolated Footing">Isolated Footing</option>
                  <option value="Combined Footing">Combined Footing</option>
                  <option value="Raft/Mat Foundation">Raft/Mat Foundation</option>
                </select>
              </div>
              <button
                onClick={() => store.deleteFoundation(selectedFoundation.id)}
                className="w-full py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded font-semibold"
              >
                Delete Footing
              </button>
            </div>
          )}

          {!selectedWall && !selectedRoom && !selectedDoor && !selectedWindow && !selectedColumn && !selectedFoundation && (
            <div className="text-slate-500 text-center py-10 leading-relaxed">
              <GridIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Click any element on canvas to view & edit properties.
            </div>
          )}
        </div>
      </div>

      {/* ── Add Floor Modal ── */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" /> Add New Floor
              </h3>
              <button onClick={() => setIsAddFloorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddFloor} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Floor Name</label>
                <input
                  type="text"
                  placeholder={`Floor ${project.floors?.length || 0}`}
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Wall Height (m)</label>
                  <input
                    type="number" step="0.1"
                    value={newWallHeight}
                    onChange={(e) => setNewWallHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Thickness (m)</label>
                  <input
                    type="number" step="0.01"
                    value={newWallThickness}
                    onChange={(e) => setNewWallThickness(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFloorOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Create Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Copy Elements From Floor Modal ── */}
      {isCopyFloorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" /> Copy Elements to {currentFloor?.floorName}
              </h3>
              <button onClick={() => setIsCopyFloorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Select a source floor to replicate walls, columns, doors, and windows into the active floor. Existing elements on {currentFloor?.floorName} will be replaced.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Source Floor</label>
                <select
                  value={sourceFloorIdToCopy}
                  onChange={(e) => setSourceFloorIdToCopy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {project.floors?.filter((f) => f.id !== currentFloor?.id).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.floorName} ({f.walls?.length || 0} walls, {f.columns?.length || 0} cols)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCopyFloorOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCopyFromFloor}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Copy Elements
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename Floor Modal ── */}
      {isRenameFloorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-400" /> Rename Floor
              </h3>
              <button onClick={() => setIsRenameFloorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameFloor} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">New Floor Name</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameFloorOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Design Validation Modal ── */}
      {isValidationOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white font-display">Design Validation Engine</h3>
              </div>
              <button onClick={() => setIsValidationOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {validating ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Analyzing architectural geometry, structural grids, and openings...
              </div>
            ) : validationResult ? (
              <div className="space-y-4 text-xs">
                {/* Status Banner */}
                {validationResult.isValid && validationResult.warnings.length === 0 ? (
                  <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold">Design is Fully Valid!</p>
                      <p className="text-[11px] text-emerald-400/80">All elements have valid geometry, thicknesses, and structural connections.</p>
                    </div>
                  </div>
                ) : validationResult.isValid ? (
                  <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold">Design is Valid with Warnings</p>
                      <p className="text-[11px] text-amber-400/80">You can proceed to quantity takeoff, but review the advisories below.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold">Design Validation Failed</p>
                      <p className="text-[11px] text-rose-400/80">Please resolve the critical geometrical errors below before quantity takeoff.</p>
                    </div>
                  </div>
                )}

                {/* Element Counts Summary */}
                {validationResult.summary && (
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                    <div>Floors: <span className="font-bold text-white">{validationResult.summary.totalFloors}</span></div>
                    <div>Walls: <span className="font-bold text-white">{validationResult.summary.totalWalls}</span></div>
                    <div>Columns: <span className="font-bold text-white">{validationResult.summary.totalColumns}</span></div>
                    <div>Footings: <span className="font-bold text-white">{validationResult.summary.totalFootings}</span></div>
                    <div>Doors: <span className="font-bold text-white">{validationResult.summary.totalDoors}</span></div>
                    <div>Windows: <span className="font-bold text-white">{validationResult.summary.totalWindows}</span></div>
                    <div>Beams: <span className="font-bold text-white">{validationResult.summary.totalBeams}</span></div>
                    <div>Slabs: <span className="font-bold text-white">{validationResult.summary.totalSlabs}</span></div>
                  </div>
                )}

                {/* Errors List */}
                {validationResult.errors?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">
                      Errors ({validationResult.errors.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {validationResult.errors.map((err: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/40 p-2 rounded-lg text-rose-300 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings List */}
                {validationResult.warnings?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                      Advisories & Warnings ({validationResult.warnings.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {validationResult.warnings.map((warn: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg text-amber-300 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsValidationOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
