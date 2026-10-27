import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { Calculator, FileCode, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RateAnalysisView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRateAnalysis();
  }, [projectId]);

  const loadRateAnalysis = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getRateAnalysis(projectId);
      setData(res);
    } catch {
      toast.error('Failed to load rate analysis data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-500">Calculating Rate Analysis breakdown...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-brand-400" />
            Rate Analysis Module
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive breakdown of material, labour, equipment, overheads, and wastage components per unit work item.
          </p>
        </div>

        <button
          onClick={loadRateAnalysis}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.rateAnalysis?.map((ra: any) => (
          <div key={ra.itemCode} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-400 font-mono">{ra.itemCode}</span>
                <h3 className="text-sm font-bold text-white">{ra.itemName}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  ₹{ra.finalRate} / {ra.unit}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">Spec: {ra.spec}</div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Material Component</span>
                <span className="font-semibold text-white">₹{ra.materialComponent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Labour Component</span>
                <span className="font-semibold text-white">₹{ra.labourComponent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Equipment Component</span>
                <span className="font-semibold text-white">₹{ra.equipmentComponent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Overheads & Profit ({ra.overheadPct}%)</span>
                <span className="text-slate-300">+₹{((ra.materialComponent + ra.labourComponent + ra.equipmentComponent) * (ra.overheadPct / 100)).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Wastage Factor ({ra.wastagePct}%)</span>
                <span className="text-slate-300">+₹{(ra.materialComponent * (ra.wastagePct / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
