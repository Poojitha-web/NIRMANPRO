import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types';
import { DesignWorkspace } from '../../features/design/DesignWorkspace';
import { FoundationWorkspace } from '../../features/foundation/FoundationWorkspace';
import { QuantityCalculatorView } from '../../features/calculations/QuantityCalculatorView';
import { MaterialEngineView } from '../../features/materials/MaterialEngineView';
import { LabourEngineView } from '../../features/labour/LabourEngineView';
import { EquipmentEngineView } from '../../features/equipment/EquipmentEngineView';
import { RateAnalysisView } from '../../features/rates/RateAnalysisView';
import { CostEstimationView } from '../../features/costs/CostEstimationView';
import { BOQView } from '../../features/boq/BOQView';
import { ReportsView } from '../../features/reports/ReportsView';
import { 
  PencilRuler, 
  Calculator, 
  FileSpreadsheet, 
  PieChart, 
  FileText, 
  ArrowLeft, 
  Anchor,
  Box,
  Users,
  Truck,
  FileCode,
  Settings,
  Layers,
  ChevronRight,
  Save,
  History,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<
    'config' | 'design' | 'foundation' | 'quantities' | 'materials' | 'labour' | 'equipment' | 'rate-analysis' | 'costs' | 'boq' | 'reports'
  >('design');
  const [loading, setLoading] = useState(true);

  // Config Form State
  const [overheadPct, setOverheadPct] = useState(8);
  const [contingencyPct, setContingencyPct] = useState(5);
  const [gstPct, setGstPct] = useState(18);
  const [soilType, setSoilType] = useState('Medium Clay');
  const [designCode, setDesignCode] = useState('IS 456:2000');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [savingConfig, setSavingConfig] = useState(false);

  // Revisions State
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [newRevisionDesc, setNewRevisionDesc] = useState('');
  const [creatingRevision, setCreatingRevision] = useState(false);

  // Design Validation State
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const loadRevisions = async () => {
    if (!id) return;
    setLoadingRevisions(true);
    try {
      const data = await projectsApi.getRevisions(id);
      setRevisions(data);
    } catch {
      toast.error('Failed to load project revisions');
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleOpenRevisions = () => {
    setIsRevisionsOpen(true);
    loadRevisions();
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setCreatingRevision(true);
    try {
      await projectsApi.createRevision(id, newRevisionDesc);
      toast.success('Project revision snapshot saved!');
      setNewRevisionDesc('');
      loadRevisions();
    } catch {
      toast.error('Failed to create project revision');
    } finally {
      setCreatingRevision(false);
    }
  };

  const handleRestoreRevision = async (revId: string, revNum: number) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to restore Revision R${revNum}? Current unsaved design changes will be overwritten.`)) {
      return;
    }
    try {
      await projectsApi.restoreRevision(id, revId);
      toast.success(`Restored Revision R${revNum} successfully!`);
      setIsRevisionsOpen(false);
      fetchProject();
    } catch {
      toast.error('Failed to restore revision');
    }
  };

  const handleRunValidation = async () => {
    if (!id) return;
    setValidating(true);
    setIsValidationOpen(true);
    try {
      const res = await projectsApi.validateDesign(id);
      setValidationResult(res);
    } catch {
      toast.error('Failed to validate project design');
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await projectsApi.getProject(id!);
      setProject(data);
      setOverheadPct(data.overheadPercentage || 8);
      setContingencyPct(data.contingencyRate || 5);
      setGstPct(data.gstRate || 18);
      setSoilType(data.soilType || 'Medium Clay');
      setDesignCode(data.designCode || 'IS 456:2000');
      setUnitSystem(data.unitSystem || 'metric');
    } catch {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSavingConfig(true);
    try {
      await projectsApi.updateProject(project.id, {
        overheadPercentage: overheadPct,
        contingencyRate: contingencyPct,
        gstRate: gstPct,
        soilType,
        designCode,
        unitSystem,
      });
      toast.success('Project configuration updated!');
      fetchProject();
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-slate-500">Loading NIRMAN PRO workspace...</div>;
  }

  if (!project) {
    return <div className="text-center py-24 text-slate-400">Project not found.</div>;
  }

  const workspaceTabs = [
    { id: 'config', label: '1. Config', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'design', label: '2. 2D Design', icon: <PencilRuler className="w-3.5 h-3.5" /> },
    { id: 'foundation', label: '3. Foundation', icon: <Anchor className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'quantities', label: '4. Quantities', icon: <Calculator className="w-3.5 h-3.5" /> },
    { id: 'materials', label: '5. Materials', icon: <Box className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'labour', label: '6. Labour', icon: <Users className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'equipment', label: '7. Equipment', icon: <Truck className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'rate-analysis', label: '8. Rate Analysis', icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: 'costs', label: '9. Cost Estimate', icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'boq', label: '10. BOQ Schedule', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'reports', label: '11. Reports & Exports', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4 max-w-full">
      {/* Top Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">{project.projectName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {project.buildingType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {(project as any).stageLabel || 'Design In Progress'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {project.companyName || 'NIRMAN PRO Construction'} • {project.location || 'Telangana'} • {project.numberOfFloors} Floor(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunValidation}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Validate Entire Project Design"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Validate Design
          </button>
          <button
            onClick={handleOpenRevisions}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            title="View & Create Project Revisions"
          >
            <History className="w-3.5 h-3.5 text-purple-400" /> Revisions
          </button>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-brand-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'config' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-400" />
                Project Parameters & Rate Configuration
              </h2>
              <p className="text-xs text-slate-400">Configure cost percentages, soil parameters, design standards, and unit systems.</p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Overhead Rate (%)</label>
                  <input
                    type="number" step="0.5"
                    value={overheadPct}
                    onChange={(e) => setOverheadPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contingency Rate (%)</label>
                  <input
                    type="number" step="0.5"
                    value={contingencyPct}
                    onChange={(e) => setContingencyPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number" step="0.5"
                    value={gstPct}
                    onChange={(e) => setGstPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Hard Rock">Hard Rock</option>
                    <option value="Medium Clay">Medium Clay / Hard Moorum</option>
                    <option value="Soft Soil">Soft Soil / Black Cotton</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Design Code Standard</label>
                  <select
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="IS 456:2000">IS 456:2000 (Plain & RCC)</option>
                    <option value="IS 800:2007">IS 800:2007 (Steel Structures)</option>
                    <option value="IS 1893:2016">IS 1893:2016 (Seismic Resistant)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit System</label>
                  <select
                    value={unitSystem}
                    onChange={(e) => setUnitSystem(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="metric">Metric System (m, m², m³, kg)</option>
                    <option value="imperial">Imperial System (ft, ft², ft³, lbs)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-600/20"
                >
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'design' && <DesignWorkspace project={project} onRefresh={fetchProject} />}
        {activeTab === 'foundation' && <FoundationWorkspace project={project} onRefresh={fetchProject} />}
        {activeTab === 'quantities' && <QuantityCalculatorView projectId={project.id} />}
        {activeTab === 'materials' && <MaterialEngineView projectId={project.id} />}
        {activeTab === 'labour' && <LabourEngineView projectId={project.id} />}
        {activeTab === 'equipment' && <EquipmentEngineView projectId={project.id} />}
        {activeTab === 'rate-analysis' && <RateAnalysisView projectId={project.id} />}
        {activeTab === 'costs' && <CostEstimationView projectId={project.id} />}
        {activeTab === 'boq' && <BOQView projectId={project.id} />}
        {activeTab === 'reports' && <ReportsView project={project} />}
      </div>

      {/* ── Project Revisions Drawer Modal ── */}
      {isRevisionsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-display">Project Versioning & Revisions</h3>
              </div>
              <button onClick={() => setIsRevisionsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create Revision Snapshot Form */}
            <form onSubmit={handleCreateRevision} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 shrink-0">
              <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-400" /> Create New Design Revision Snapshot
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., G+2 Floor layout finalized with isolated footings"
                  value={newRevisionDesc}
                  onChange={(e) => setNewRevisionDesc(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={creatingRevision}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/20"
                >
                  <Save className="w-3.5 h-3.5" /> {creatingRevision ? 'Saving...' : 'Save Snapshot'}
                </button>
              </div>
            </form>

            {/* Revisions History List */}
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Saved Revisions ({revisions.length})
              </span>

              {loadingRevisions ? (
                <div className="text-center py-8 text-slate-500">Loading revisions...</div>
              ) : revisions.length > 0 ? (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-mono font-bold text-[11px] border border-purple-500/30">
                          R{rev.revisionNumber}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs">
                          {rev.description || `Revision ${rev.revisionNumber}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Created on {new Date(rev.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreRevision(rev.id, rev.revisionNumber)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0"
                      title="Restore project to this revision"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-950/50 rounded-xl border border-slate-900">
                  No revisions saved yet. Create your first revision snapshot above to track design milestones.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end shrink-0 border-t border-slate-800">
              <button
                onClick={() => setIsRevisionsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Validation Modal ── */}
      {isValidationOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white font-display">Design Validation Engine</h3>
              </div>
              <button onClick={() => setIsValidationOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
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
