import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { useAuthStore } from '../store/authStore';
import { DashboardStats, Project } from '../types';
import { 
  Building2, 
  FolderKanban, 
  IndianRupee, 
  PlusCircle, 
  Clock, 
  Layers, 
  ChevronRight, 
  Trash2, 
  Copy, 
  Activity,
  Play,
  FileSpreadsheet,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await projectsApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await projectsApi.duplicateProject(id);
      toast.success('Project duplicated successfully');
      loadStats();
    } catch (err) {
      toast.error('Failed to duplicate project');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await projectsApi.deleteProject(deleteId);
      toast.success('Project deleted');
      setDeleteId(null);
      loadStats();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5" />
              NIRMAN PRO Workspace Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              NIRMAN PRO DASHBOARD
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl font-medium">
              Smart Construction Planning, Quantity Surveying & Cost Estimation Platform
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Welcome back, <strong>{user?.name || 'Engineer'}</strong>! ({user?.role || 'QUANTITY SURVEYOR'})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/projects/new"
              className="px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : stats?.totalProjects || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">Projects in NIRMAN PRO</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : stats?.activeProjects || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">Active design phase</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Projects</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : Math.max(0, (stats?.totalProjects || 0) - (stats?.activeProjects || 0))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Approved & finalized</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Estimated Cost</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{loading ? '...' : (stats?.totalEstimatedCost || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-2">Cumulative BOQ cost sum</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/projects/new"
            className="px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </Link>
          <Link
            to="/projects"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FolderKanban className="w-4 h-4" />
            Open Project
          </Link>
          <button
            onClick={() => {
              if (stats?.recentProjects?.[0]) {
                navigate(`/projects/${stats.recentProjects[0].id}`);
              } else {
                toast.error('No project available to export.');
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Reports
          </button>
        </div>
      </div>

      {/* MY PROJECTS List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <Clock className="w-5 h-5 text-sky-400" />
            MY PROJECTS
          </h2>
          <Link to="/projects" className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1">
            View All ({stats?.totalProjects || 0})
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading projects...</div>
        ) : stats?.recentProjects && stats.recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/design/${p.id}`)}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 cursor-pointer hover:border-sky-500/50 hover:shadow-2xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-base group-hover:text-sky-400 transition-colors line-clamp-1 font-display">
                      {p.projectName}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                      {p.buildingType}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    {p.location && (
                      <p className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        {p.location}
                      </p>
                    )}
                    <p className="line-clamp-2 text-slate-400 text-[11px]">
                      {p.description || 'Smart construction building design project.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Floors</span>
                      <span className="font-semibold text-slate-200">{p.numberOfFloors} Floor{p.numberOfFloors > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Cost</span>
                      <span className="font-bold text-emerald-400">
                        ₹{(p.costEstimate?.totalCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Bar (Section 27) */}
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Lifecycle Stage</span>
                      <span className="font-bold text-sky-400 uppercase tracking-wider">
                        {(p as any).stageLabel || 'Design In Progress'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(p as any).progress || 25}%` }}
                      />
                    </div>
                  </div>

                  {/* Continue Project Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${p.id}`);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Continue Project
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px]">
                    <span className="text-slate-500">
                      Last modified: {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDuplicate(p.id, e)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(p.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">No Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You haven't created any NIRMAN PRO projects yet. Create your first project to start manual 2D drawing.
              </p>
            </div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete NIRMAN PRO Project?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              WARNING: This action will permanently delete all project drawings, 2D floor plans, quantity survey calculations, material statements, and BOQ estimates.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
