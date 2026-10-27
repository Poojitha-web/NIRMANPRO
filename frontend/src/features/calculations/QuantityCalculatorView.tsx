import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { BuildingQuantitySummary } from '../../types';
import { 
  Calculator, 
  Layers, 
  Ruler, 
  Building2, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const QuantityCalculatorView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<BuildingQuantitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalculations();
  }, [projectId]);

  const loadCalculations = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getCalculations(projectId);
      setData(res);
    } catch (err) {
      toast.error('Failed to calculate building quantities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-500">Calculating construction quantities...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Recalculate button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-400" />
            Quantity Surveying Summary
          </h2>
          <p className="text-xs text-slate-400">Automated area, volume, and material calculations based on floor plans.</p>
        </div>

        <button
          onClick={loadCalculations}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate
        </button>
      </div>

      {/* Building Overall Quantity Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Floor Area</span>
          <div className="text-xl font-bold text-white mt-1">{data.totalFloorArea} m²</div>
          <span className="text-[10px] text-slate-500">Gross built-up area</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Net Wall Area</span>
          <div className="text-xl font-bold text-brand-400 mt-1">{data.totalNetWallArea} m²</div>
          <span className="text-[10px] text-slate-500">After door/window deductions</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Wall Volume</span>
          <div className="text-xl font-bold text-amber-400 mt-1">{data.totalWallVolume} m³</div>
          <span className="text-[10px] text-slate-500">Brick masonry volume</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Concrete Quantity</span>
          <div className="text-xl font-bold text-cyan-400 mt-1">{data.totalConcreteQuantity} m³</div>
          <span className="text-[10px] text-slate-500">RCC Slabs & Beams</span>
        </div>
      </div>

      {/* Detailed Quantity Breakdown Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Floor-wise Detailed Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Floor Name</th>
                <th className="pb-3 px-2">Floor Area</th>
                <th className="pb-3 px-2">Gross Wall</th>
                <th className="pb-3 px-2">Openings (D+W)</th>
                <th className="pb-3 px-2">Net Wall Area</th>
                <th className="pb-3 px-2">Wall Volume</th>
                <th className="pb-3 px-2">Plastering Area</th>
                <th className="pb-3 px-2">Painting Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data.floorBreakdown.map((f) => (
                <tr key={f.floorId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-semibold text-white">{f.floorName}</td>
                  <td className="py-3 px-2">{f.floorArea} m²</td>
                  <td className="py-3 px-2">{f.grossWallArea} m²</td>
                  <td className="py-3 px-2 text-rose-400">{(f.doorArea + f.windowArea).toFixed(2)} m²</td>
                  <td className="py-3 px-2 font-bold text-brand-400">{f.netWallArea} m²</td>
                  <td className="py-3 px-2">{f.wallVolume} m³</td>
                  <td className="py-3 px-2">{f.plasteringArea} m²</td>
                  <td className="py-3 px-2">{f.paintingArea} m²</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-brand-500/30 font-bold text-white bg-brand-950/20">
                <td className="py-3 px-2">TOTAL BUILDING</td>
                <td className="py-3 px-2">{data.totalFloorArea} m²</td>
                <td className="py-3 px-2">{data.totalGrossWallArea} m²</td>
                <td className="py-3 px-2 text-rose-400">{(data.totalDoorArea + data.totalWindowArea).toFixed(2)} m²</td>
                <td className="py-3 px-2 text-brand-400">{data.totalNetWallArea} m²</td>
                <td className="py-3 px-2">{data.totalWallVolume} m³</td>
                <td className="py-3 px-2">{data.totalPlasteringArea} m²</td>
                <td className="py-3 px-2">{data.totalPaintingArea} m²</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
