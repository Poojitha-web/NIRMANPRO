import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { projectsApi } from '../../api/projects';
import { Anchor, ShieldAlert, CheckCircle2, Layers, Cpu, Compass } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const FoundationWorkspace: React.FC<{ project: Project; onRefresh?: () => void }> = ({ project, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [groundFloor, setGroundFloor] = useState<any>(null);
  const [footings, setFootings] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    loadFoundationData();
  }, [project.id]);

  const loadFoundationData = async () => {
    setLoading(true);
    try {
      const gf = project.floors?.find((f) => f.floorNumber === 0) || project.floors?.[0];
      setGroundFloor(gf);

      if (gf) {
        const design = await projectsApi.getDesign(gf.id);
        const layoutData = typeof design.layoutData === 'string' ? JSON.parse(design.layoutData) : (design.layoutData || {});
        setFootings(layoutData.foundations || design.foundations || gf.footings || []);
        setColumns(layoutData.columns || design.columns || gf.columns || []);
      }
    } catch {
      toast.error('Failed to load foundation design');
    } finally {
      setLoading(false);
    }
  };

  const totalFootingVol = footings.reduce((sum, f) => sum + ((f.length || 1.5) * (f.width || 1.5) * (f.depth || 0.6)), 0);
  const totalExcavation = footings.reduce((sum, f) => sum + (((f.length || 1.5) + 0.6) * ((f.width || 1.5) + 0.6) * ((f.depth || 0.6) + (f.pedestalH || 0.9) + 0.1)), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Anchor className="w-5 h-5 text-purple-400" />
            Foundation & Substructure Design
          </h2>
          <p className="text-xs text-slate-400">
            Define footings, pedestals, grade beams, and column linkages for ground foundation level.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-purple-400 font-mono bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
            Soil Type: {project.soilType || 'Medium Clay / Hard Moorum'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Footings</span>
          <div className="text-xl font-bold text-white mt-1">{footings.length} Pits</div>
          <span className="text-[10px] text-purple-400 font-medium">Isolated / Combined</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Excavation Volume</span>
          <div className="text-xl font-bold text-amber-400 mt-1">{totalExcavation.toFixed(2)} m³</div>
          <span className="text-[10px] text-slate-500">Pit excavation in earth</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Footing Concrete (RCC)</span>
          <div className="text-xl font-bold text-cyan-400 mt-1">{totalFootingVol.toFixed(2)} m³</div>
          <span className="text-[10px] text-slate-500">M25 Grade concrete</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Column Linkages</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {columns.length > 0 ? `${footings.filter(f => f.columnId).length} / ${columns.length}` : '0 / 0'}
          </div>
          <span className="text-[10px] text-slate-500">Footings linked to columns</span>
        </div>
      </div>

      {/* Structural Relationship Hierarchy Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          Foundation-to-Column Structural Hierarchy
        </h3>

        {footings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No footing elements placed yet. Draw footings on the Building Planner 2D Canvas!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {footings.map((f, idx) => {
              const linkedCol = columns.find((c) => c.id === f.columnId);
              return (
                <div key={f.id || idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400">Footing #{idx + 1}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      {f.footingType || 'Isolated Footing'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    <div>Dimensions: {f.length || 1.5}m × {f.width || 1.5}m × {f.depth || 0.6}m</div>
                    <div>Pedestal Height: {f.pedestalH || 0.9}m</div>
                    <div>Concrete Grade: {f.concreteGrade || 'M25'}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Column Link:</span>
                    {linkedCol ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Column C-{linkedCol.id.substring(0, 4)}
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Unlinked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
