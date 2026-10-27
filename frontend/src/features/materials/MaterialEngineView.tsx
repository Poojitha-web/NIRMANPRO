import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { Box, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const MaterialEngineView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [projectId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getMaterialRequirements(projectId);
      setData(res);
    } catch {
      toast.error('Failed to calculate material requirements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-500">Calculating material engine requirements...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            Material Estimation Engine
          </h2>
          <p className="text-xs text-slate-400">
            Raw construction material requirements derived from quantity takeoff with wastage factors.
          </p>
        </div>

        <button
          onClick={loadMaterials}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Bill of Materials (BOM)</h3>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
            Total Material Cost: INR {data.totalMaterialCost?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Material Description</th>
                <th className="pb-3 px-2">Unit</th>
                <th className="pb-3 px-2">Base Net Qty</th>
                <th className="pb-3 px-2">Wastage %</th>
                <th className="pb-3 px-2">Gross Required Qty</th>
                <th className="pb-3 px-2">SoR Rate (INR)</th>
                <th className="pb-3 px-2 text-right">Total Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data.materials?.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-semibold text-white">{m.material}</td>
                  <td className="py-3 px-2 uppercase">{m.unit}</td>
                  <td className="py-3 px-2">{m.quantity}</td>
                  <td className="py-3 px-2 text-amber-400 font-medium">{m.wastage}</td>
                  <td className="py-3 px-2 font-bold text-emerald-400">{m.finalQuantity}</td>
                  <td className="py-3 px-2">₹{m.rate}</td>
                  <td className="py-3 px-2 text-right font-bold text-white">₹{m.totalCost.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
