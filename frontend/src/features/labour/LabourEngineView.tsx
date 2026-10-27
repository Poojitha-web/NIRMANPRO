import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { Users, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const LabourEngineView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLabour();
  }, [projectId]);

  const loadLabour = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getLabourRequirements(projectId);
      setData(res);
    } catch {
      toast.error('Failed to calculate labour requirements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-500">Calculating labour engine requirements...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Labour Estimation Engine
          </h2>
          <p className="text-xs text-slate-400">
            Labour manpower days and wages based on Government Minimum Wages Act G.O. Ms. No. 6.
          </p>
        </div>

        <button
          onClick={loadLabour}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Labour Workforce Schedule</h3>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
            Total Labour Cost ({data.zone || 'Zone-I'}): INR {data.totalLabourCost?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Worker Category</th>
                <th className="pb-3 px-2">Productivity Standard</th>
                <th className="pb-3 px-2">Labour Days</th>
                <th className="pb-3 px-2">Daily Wage (INR)</th>
                <th className="pb-3 px-2">Wage Authority</th>
                <th className="pb-3 px-2 text-right">Total Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data.labour?.map((l: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-semibold text-white">{l.workerType}</td>
                  <td className="py-3 px-2 text-slate-400">{l.productivity}</td>
                  <td className="py-3 px-2 font-bold text-amber-400">{l.labourDays} Days</td>
                  <td className="py-3 px-2">₹{l.wage} / day</td>
                  <td className="py-3 px-2 text-slate-400">{l.source}</td>
                  <td className="py-3 px-2 text-right font-bold text-white">₹{l.totalCost.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
