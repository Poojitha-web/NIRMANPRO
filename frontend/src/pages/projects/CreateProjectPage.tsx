import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { ratesApi, RateSource } from '../../api/rates';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Square, 
  Copy, 
  Layout,
  Globe,
  Compass,
  Layers,
  ShieldAlert,
  Database,
  Coins
} from 'lucide-react';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State: Project Details
  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [buildingType, setBuildingType] = useState('Individual House');
  const [location, setLocation] = useState('');
  const [numberOfFloors, setNumberOfFloors] = useState(1);
  const [soilType, setSoilType] = useState('Gravel');
  const [designCode, setDesignCode] = useState('IS 456:2000');
  const [description, setDescription] = useState('');

  // Step 2 State: Project Configuration & Rate Database Settings
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [floorLength, setFloorLength] = useState(10);
  const [floorWidth, setFloorWidth] = useState(8);
  const [floorHeight, setFloorHeight] = useState(3.0);
  const [wallHeight, setWallHeight] = useState(3.0);
  const [wallThickness, setWallThickness] = useState(0.23);

  // Rate Database & Cost Parameters
  const [rateSources, setRateSources] = useState<RateSource[]>([]);
  const [rateSourceId, setRateSourceId] = useState('');
  const [zone, setZone] = useState('Zone-I');
  const [gstRate, setGstRate] = useState(18.0);
  const [overheadPercentage, setOverheadPercentage] = useState(14.0);
  const [contingencyRate, setContingencyRate] = useState(3.0);

  // Step 3 State: Layout Template
  const [templateType, setTemplateType] = useState<'blank' | 'basic' | 'copy'>('blank');

  useEffect(() => {
    ratesApi.getSources().then((sources) => {
      setRateSources(sources);
      if (sources.length > 0) {
        setRateSourceId(sources[0].id);
      }
    }).catch((err) => console.error('Error fetching rate sources:', err));
  }, []);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error('Project Name is required');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const payload = {
        projectName,
        companyName,
        engineerName,
        projectType,
        buildingType,
        location,
        numberOfFloors,
        soilType,
        designCode,
        description,
        unitSystem,
        floorLength,
        floorWidth,
        floorHeight,
        wallHeight,
        wallThickness,
        templateType,
        rateSourceId,
        zone,
        gstRate,
        overheadPercentage,
        contingencyRate,
      };

      const project = await projectsApi.createProject(payload);
      toast.success('NIRMAN PRO Project created successfully!');
      navigate(`/design/${project.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">Create NIRMAN PRO Project</h1>
        <p className="text-xs text-slate-400 mt-1">Configure project specifications, structural design codes, and fixed unit system.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-sky-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-800'}`}>
            1
          </div>
          <span className="text-xs hidden sm:inline">Project Details</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-800 mx-3" />

        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-sky-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-800'}`}>
            2
          </div>
          <span className="text-xs hidden sm:inline font-bold">Unit Configuration</span>
        </div>
        <div className="flex-1 h-0.5 bg-slate-800 mx-3" />

        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-sky-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-800'}`}>
            3
          </div>
          <span className="text-xs hidden sm:inline">Planner Setup</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* STEP 1: Project Details */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">Step 1: Project Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Luxury Villa Construction Phase 1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Builders Ltd."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Engineer Name</label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="e.g. Er. R. K. Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Type *</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Building Type *</label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Individual House">Individual House</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Office">Office</option>
                  <option value="Commercial Building">Commercial Building</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Plot 42, Green Valley, Bangalore"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Floors</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={numberOfFloors}
                  onChange={(e) => setNumberOfFloors(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Rock">Rock</option>
                  <option value="Gravel">Gravel</option>
                  <option value="Sand">Sand</option>
                  <option value="Silt">Silt</option>
                  <option value="Clay">Clay</option>
                  <option value="Expansive Soil">Expansive Soil</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Design Code</label>
                <input
                  type="text"
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value)}
                  placeholder="e.g. IS 456:2000 / NBC 2016"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Scope of work, structural parameters, or special site instructions..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20"
              >
                NEXT
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Project Configuration & Fixed Unit System */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-5">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">Step 2: Project Configuration</h2>

            {/* Unit System Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Unit System *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setUnitSystem('metric')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    unitSystem === 'metric'
                      ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">METRIC SYSTEM</span>
                    {unitSystem === 'metric' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Length: <strong>mm, cm, m</strong></li>
                    <li>• Area: <strong>m² (sq.m)</strong></li>
                    <li>• Volume: <strong>m³ (cum)</strong></li>
                  </ul>
                </div>

                <div
                  onClick={() => setUnitSystem('imperial')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    unitSystem === 'imperial'
                      ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">IMPERIAL SYSTEM</span>
                    {unitSystem === 'imperial' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Length: <strong>in, ft</strong></li>
                    <li>• Area: <strong>ft² (sq.ft)</strong></li>
                    <li>• Volume: <strong>ft³ (cu.ft)</strong></li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300 mt-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>IMPORTANT:</strong> Once selected, the unit system remains fixed for this project to prevent unit mixing.
                </span>
              </div>
            </div>

            {/* Default Dimensions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Length ({unitSystem === 'metric' ? 'm' : 'ft'})</label>
                <input
                  type="number"
                  step="0.1"
                  value={floorLength}
                  onChange={(e) => setFloorLength(parseFloat(e.target.value) || 10)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Width ({unitSystem === 'metric' ? 'm' : 'ft'})</label>
                <input
                  type="number"
                  step="0.1"
                  value={floorWidth}
                  onChange={(e) => setFloorWidth(parseFloat(e.target.value) || 8)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Wall Height ({unitSystem === 'metric' ? 'm' : 'ft'})</label>
                <input
                  type="number"
                  step="0.1"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(parseFloat(e.target.value) || 3.0)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Official Rate Database & Location Pricing Configuration */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                Schedule of Rates & Cost Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Schedule of Rates Source *</label>
                  <select
                    value={rateSourceId}
                    onChange={(e) => setRateSourceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                  >
                    {rateSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sourceName} ({s.year || '2026-27'})
                      </option>
                    ))}
                    <option value="">Default NIRMAN PRO Cost Engine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Geographic Pricing Zone *</label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Zone-I">Zone-I (Municipal Corporations & Urban areas)</option>
                    <option value="Zone-II">Zone-II (Municipalities & Special grade)</option>
                    <option value="Zone-III">Zone-III (Rural Areas & Gram Panchayats)</option>
                  </select>
                </div>
              </div>

              {/* Tax & Financial Parameters */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contractor Overhead %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={overheadPercentage}
                    onChange={(e) => setOverheadPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contingencies %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={contingencyRate}
                    onChange={(e) => setContingencyRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20"
              >
                NEXT
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Initial Canvas Setup */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">Step 3: Building Planner Setup</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setTemplateType('blank')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  templateType === 'blank'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-xl shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Square className="w-8 h-8 text-sky-400 mb-3" />
                <h3 className="font-bold text-sm text-white mb-1">Blank Canvas</h3>
                <p className="text-xs text-slate-400">Open an interactive 2D grid workspace to manually draw walls and columns.</p>
              </div>

              <div
                onClick={() => setTemplateType('basic')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  templateType === 'basic'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-xl shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Layout className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-bold text-sm text-white mb-1">Basic Template</h3>
                <p className="text-xs text-slate-400">Pre-creates perimeter walls, main hall, door, and sliding window.</p>
              </div>

              <div
                onClick={() => setTemplateType('copy')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  templateType === 'copy'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-xl shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Copy className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-bold text-sm text-white mb-1">Standard Layout</h3>
                <p className="text-xs text-slate-400">Pre-configured 2-BHK apartment layout ready for customization.</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleCreateProject}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Project...' : 'Initialize Project & Open Building Planner'}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
