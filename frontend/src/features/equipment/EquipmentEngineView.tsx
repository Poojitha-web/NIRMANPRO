import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { Truck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const EquipmentEngineView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
  }, [projectId]);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getEquipmentRequirements(projectId);
      setData(res);
    } catch {
      toast.error('Failed to calculate equipment requirements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-500">Calculating equipment engine requirements...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Equipment & Machinery Engine
          </h2>
          <p className="text-xs text-slate-400">
            Plant, machinery, and equipment operating costs based on Government SoR hire & fuel rates.
          </p>
        </div>

        <button
          onClick={loadEquipment}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Equipment Deployment Schedule</h3>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-xl">
            Total Equipment Cost ({data.zone || 'Zone-I'}): INR {data.totalEquipmentCost?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Machinery / Equipment Name</th>
                <th className="pb-3 px-2">Deployed Count</th>
                <th className="pb-3 px-2">Estimated Days</th>
                <th className="pb-3 px-2">Operating Hours</th>
                <th className="pb-3 px-2">SoR Hourly Rate</th>
                <th className="pb-3 px-2 text-right">Total Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data.equipment?.map((e: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-semibold text-white">{e.equipmentName}</td>
                  <td className="py-3 px-2">{e.quantity} Unit(s)</td>
                  <td className="py-3 px-2 text-slate-300">{e.durationDays} Days</td>
                  <td className="py-3 px-2 font-bold text-cyan-400">{e.operatingHours} Hours</td>
                  <td className="py-3 px-2">₹{e.rate?.toFixed(2)} / hr</td>
                  <td className="py-3 px-2 text-right font-bold text-white">₹{e.totalCost?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
