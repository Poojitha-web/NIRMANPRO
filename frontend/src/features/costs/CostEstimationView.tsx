import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { CostEstimate } from '../../types';
import { 
  PieChart, 
  RefreshCw
} from 'lucide-react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-hot-toast';

const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

export const CostEstimationView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [costs, setCosts] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCosts();
  }, [projectId]);

  const loadCosts = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getCosts(projectId);
      setCosts(res);
    } catch (err) {
      toast.error('Failed to load cost estimates');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.calculateCosts(projectId);
      setCosts(res);
      toast.success('Cost estimate recalculated from BOQ!');
    } catch (err) {
      toast.error('Failed to recalculate costs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-500">Calculating project cost breakdown...</div>;
  }

  if (!costs) return null;

  const chartData = [
    { name: 'Material Cost', value: costs.materialCost || 0 },
    { name: 'Labor Cost', value: costs.laborCost || 0 },
    { name: 'Equipment Cost', value: costs.equipmentCost || 0 },
    { name: 'Overheads', value: costs.overheads || 0 },
    { name: 'GST (18%)', value: costs.gst || 0 },
    { name: 'Contingency (5%)', value: costs.contingency || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <PieChart className="w-5 h-5 text-sky-400" />
            NIRMAN PRO Cost Estimation Engine
          </h2>
          <p className="text-xs text-slate-400">Total Project Cost = Material + Labor + Equipment + Overheads + GST + Contingency</p>
        </div>

        <button
          onClick={handleRecalculate}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate Costs
        </button>
      </div>

      {/* Highlight Total Cost Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Estimated Project Cost</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
            ₹{(costs.totalCost || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Includes material, labour, equipment, GST & contingency</p>
        </div>
      </div>

      {/* Cost Cards Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Material</span>
          <div className="text-base font-bold text-sky-400 mt-1">₹{(costs.materialCost || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Labor</span>
          <div className="text-base font-bold text-emerald-400 mt-1">₹{(costs.laborCost || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Equipment</span>
          <div className="text-base font-bold text-amber-400 mt-1">₹{(costs.equipmentCost || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Overheads</span>
          <div className="text-base font-bold text-purple-400 mt-1">₹{(costs.overheads || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">GST (18%)</span>
          <div className="text-base font-bold text-pink-400 mt-1">₹{(costs.gst || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Contingency</span>
          <div className="text-base font-bold text-rose-400 mt-1">₹{(costs.contingency || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cost Share Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Category Cost Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
