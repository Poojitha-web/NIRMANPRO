import React, { useState, useEffect } from 'react';
import { ratesApi, RateSource, ScheduleOfRateItem, MaterialRateItem, LabourRateItem, EquipmentRateItem, ImportLog } from '../../api/rates';
import { toast } from 'react-hot-toast';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  ShieldCheck,
  Building,
  Wrench,
  Users,
  HardHat,
  FileText,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

export const RateDatabaseAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sor' | 'materials' | 'labour' | 'equipment' | 'sources' | 'logs'>('sor');
  const [sources, setSources] = useState<RateSource[]>([]);
  const [sorItems, setSorItems] = useState<ScheduleOfRateItem[]>([]);
  const [materials, setMaterials] = useState<MaterialRateItem[]>([]);
  const [labourItems, setLabourItems] = useState<LabourRateItem[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentRateItem[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  // Upload Modal & Inspection State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [importing, setImporting] = useState(false);

  // Dynamic Column Mapping State
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({
    itemCode: '',
    itemDescription: '',
    unit: '',
    rate: '',
    category: '',
    subCategory: '',
    standardReference: '',
    specification: '',
  });

  const [newSourceForm, setNewSourceForm] = useState({
    sourceName: '',
    sourceCode: '',
    state: 'Telangana',
    year: '2026-27',
    publisher: 'Government of Telangana PWD',
    description: '',
  });
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, searchQuery, selectedSourceId]);

  const loadSources = async () => {
    try {
      const data = await ratesApi.getSources();
      setSources(data);
    } catch (err) {
      console.error('Failed to load rate sources', err);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sor') {
        const data = await ratesApi.getScheduleOfRates({
          search: searchQuery,
          rateSourceId: selectedSourceId || undefined,
        });
        setSorItems(data.items || []);
      } else if (activeTab === 'materials') {
        const data = await ratesApi.getMaterialRates({
          search: searchQuery,
          rateSourceId: selectedSourceId || undefined,
        });
        setMaterials(data);
      } else if (activeTab === 'labour') {
        const data = await ratesApi.getLabourRates({
          search: searchQuery,
          rateSourceId: selectedSourceId || undefined,
        });
        setLabourItems(data);
      } else if (activeTab === 'equipment') {
        const data = await ratesApi.getEquipmentRates({
          search: searchQuery,
          rateSourceId: selectedSourceId || undefined,
        });
        setEquipmentItems(data);
      } else if (activeTab === 'sources') {
        await loadSources();
      } else if (activeTab === 'logs') {
        const logs = await ratesApi.getImportLogs();
        setImportLogs(logs);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch rate database entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setLoading(true);
      try {
        const preview = await ratesApi.previewExcel(file);
        setPreviewData(preview);
        if (preview.sheets && preview.sheets.length > 0) {
          const firstSheet = preview.sheets[0];
          setSelectedSheet(firstSheet.name);
          autoMapColumns(firstSheet.columns);
        }
        toast.success(`Parsed ${file.name} successfully`);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to preview Excel file');
      } finally {
        setLoading(false);
      }
    }
  };

  const autoMapColumns = (columns: string[]) => {
    const mapping: { [key: string]: string } = {
      itemCode: '',
      itemDescription: '',
      unit: '',
      rate: '',
      category: '',
      subCategory: '',
      standardReference: '',
      specification: '',
    };

    columns.forEach((col) => {
      const lower = col.toLowerCase();
      if (lower.includes('code') || lower.includes('item no') || lower.includes('sl.no')) mapping.itemCode = col;
      else if (lower.includes('desc') || lower.includes('particular') || lower.includes('material')) mapping.itemDescription = col;
      else if (lower.includes('unit')) mapping.unit = col;
      else if (lower.includes('rate') || lower.includes('price') || lower.includes('cost') || lower.includes('amount')) mapping.rate = col;
      else if (lower.includes('category') || lower.includes('section')) mapping.category = col;
      else if (lower.includes('sub')) mapping.subCategory = col;
      else if (lower.includes('standard') || lower.includes('is ') || lower.includes('ref')) mapping.standardReference = col;
      else if (lower.includes('spec') || lower.includes('detail')) mapping.specification = col;
    });

    setColumnMapping(mapping);
  };

  const handleImportExcel = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file');
      return;
    }

    setImporting(true);
    try {
      const config = {
        sheetName: selectedSheet,
        columnMapping,
        targetSourceId: selectedSourceId || (sources[0]?.id || ''),
      };
      const result = await ratesApi.importExcel(selectedFile, config);
      toast.success(`Import complete! ${result.importedCount || result.recordsCount || 0} items processed`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewData(null);
      fetchTabData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import Excel rate database');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ratesApi.createSource(newSourceForm);
      toast.success('Rate Source added successfully');
      setIsAddSourceModalOpen(false);
      loadSources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add Rate Source');
    }
  };

  const activeSheetObj = previewData?.sheets?.find((s: any) => s.name === selectedSheet);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 rounded-2xl border border-sky-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              NIRMAN PRO Rate Database & SoR Engine
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Government Schedule of Rates (SoR), Material, Labour & Equipment database import, column mapping, and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddSourceModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Rate Source
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Import Excel Rate DB
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sor'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Schedule of Rates (SoR)
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          Material Rates
        </button>

        <button
          onClick={() => setActiveTab('labour')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'labour'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardHat className="w-4 h-4" />
          Labour Rates (Zones I-III)
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'equipment'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Equipment & Machinery
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sources'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Rate Sources ({sources.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          Import Audit Logs
        </button>
      </div>

      {/* Filters Toolbar */}
      {activeTab !== 'logs' && activeTab !== 'sources' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by code, item description, or IS code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs text-slate-400 font-semibold">Source:</span>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
              >
                <option value="">All Rate Sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sourceName} ({s.year || '2026-27'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchTabData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 min-h-[400px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs font-semibold">Loading official rate database entries...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: Schedule of Rates (SoR) */}
            {activeTab === 'sor' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                    Standard Schedule of Rates ({sorItems.length} Items)
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">SOR Code</th>
                        <th className="p-3">Description & Standard</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3 text-right">Scheduled Rate (₹)</th>
                        <th className="p-3 text-center">IS Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {sorItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            No Schedule of Rates items found. Upload an Excel database or seed rates.
                          </td>
                        </tr>
                      ) : (
                        sorItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                              {item.itemCode}
                            </td>
                            <td className="p-3">
                              <p className="font-medium text-slate-100">{item.itemDescription}</p>
                              {item.specification && (
                                <p className="text-[10px] text-slate-400 mt-0.5 italic">{item.specification}</p>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300 whitespace-nowrap">{item.unit}</td>
                            <td className="p-3 text-right font-bold text-emerald-400 font-mono whitespace-nowrap">
                              ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              {item.standardReference ? (
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                                  {item.standardReference}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Material Rates */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Primary Construction Material Rates ({materials.length} Items)
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Material Code</th>
                        <th className="p-3">Material Description</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3 text-right">Base Rate (₹)</th>
                        <th className="p-3 text-right">Market Rate (₹)</th>
                        <th className="p-3 text-center">Wastage %</th>
                        <th className="p-3 text-center">GST %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-500">
                            No Material Rates found in database.
                          </td>
                        </tr>
                      ) : (
                        materials.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">{m.materialCode}</td>
                            <td className="p-3 font-medium text-slate-100">{m.materialName}</td>
                            <td className="p-3 text-slate-400">{m.category}</td>
                            <td className="p-3 font-mono text-slate-300">{m.unit}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-100">₹{m.baseRate.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono text-emerald-400">₹{(m.marketRate || m.baseRate).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center font-mono text-amber-400">{m.wastagePercentage || 0}%</td>
                            <td className="p-3 text-center font-mono text-sky-400">{m.gstPercentage || 18}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Labour Rates */}
            {activeTab === 'labour' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  Labour Schedule Rates by Geographic Zone ({labourItems.length} Trades)
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Trade Code</th>
                        <th className="p-3">Trade Designation</th>
                        <th className="p-3">Skill Level</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3 text-right">Zone-I (Urban/Corp) ₹</th>
                        <th className="p-3 text-right">Zone-II (Municipality) ₹</th>
                        <th className="p-3 text-right">Zone-III (Rural) ₹</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {labourItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-500">
                            No Labour Schedule Rates found.
                          </td>
                        </tr>
                      ) : (
                        labourItems.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">{l.tradeCode}</td>
                            <td className="p-3 font-medium text-slate-100">{l.tradeName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold text-[10px]">
                                {l.skillCategory}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300">{l.unit}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{l.zone1Rate.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono font-bold text-sky-400">₹{l.zone2Rate.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-300">₹{l.zone3Rate.toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Equipment Rates */}
            {activeTab === 'equipment' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  Equipment & Construction Machinery Rates ({equipmentItems.length} Machinery)
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Machinery Code</th>
                        <th className="p-3">Equipment Name & Capacity</th>
                        <th className="p-3">Shift Unit</th>
                        <th className="p-3 text-right">Hire Rate (₹)</th>
                        <th className="p-3 text-right">Fuel Cost (₹)</th>
                        <th className="p-3 text-right">Crew Cost (₹)</th>
                        <th className="p-3 text-right">Total Shift Rate (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {equipmentItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-500">
                            No Equipment Rates found.
                          </td>
                        </tr>
                      ) : (
                        equipmentItems.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-purple-400 whitespace-nowrap">{e.equipmentCode}</td>
                            <td className="p-3 font-medium text-slate-100">
                              {e.equipmentName} {e.capacity ? `(${e.capacity})` : ''}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{e.unit}</td>
                            <td className="p-3 text-right font-mono text-slate-300">₹{e.hireRatePerShift.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono text-amber-400">₹{e.fuelCostPerShift.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono text-sky-400">₹{e.crewCostPerShift.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{e.totalShiftRate.toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Rate Sources */}
            {activeTab === 'sources' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Active Schedule of Rates Authorities ({sources.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sources.map((s) => (
                    <div key={s.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                          {s.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-sky-400">{s.sourceCode}</span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-base text-white">{s.sourceName}</h4>
                        <p className="text-xs text-slate-400 mt-1">{s.description || 'Official PWD Schedule of Rates database'}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                        <span>Publisher: <strong className="text-slate-200">{s.publisher || 'Government PWD'}</strong></span>
                        <span>Year: <strong className="text-slate-200">{s.year || '2026-27'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: Import Audit Logs */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Excel Rate Import Audit Logs ({importLogs.length})
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Import Date</th>
                        <th className="p-3">Uploaded File</th>
                        <th className="p-3">User</th>
                        <th className="p-3 text-center">Records Found</th>
                        <th className="p-3 text-center">Valid Imported</th>
                        <th className="p-3 text-center">Duplicates</th>
                        <th className="p-3 text-center">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {importLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-500">
                            No import logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        importLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                              {new Date(log.importedAt).toLocaleString()}
                            </td>
                            <td className="p-3 font-medium text-sky-400 flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 shrink-0" />
                              {log.fileName}
                            </td>
                            <td className="p-3 text-slate-200">{log.user?.name || log.user?.email || 'Admin'}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-100">{log.recordsCount}</td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-400">{log.validCount}</td>
                            <td className="p-3 text-center font-mono text-amber-400">{log.duplicateCount}</td>
                            <td className="p-3 text-center font-mono text-rose-400">{log.errorCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* EXCEL IMPORT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-6 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-sky-400" />
                <h2 className="text-lg font-extrabold text-white">Import Excel Rate Database</h2>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Selection Box */}
            {!previewData ? (
              <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-8 text-center space-y-4 bg-slate-950/50 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-sky-400 mx-auto" />
                <div>
                  <h3 className="font-bold text-sm text-white">Upload Construction Rate Database Workbook</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Government SoR, PWD SSR, or custom material/labour Excel files (.xlsx, .xls)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-file-input"
                />
                <label
                  htmlFor="excel-file-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 cursor-pointer transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  Choose Excel File
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File & Worksheet Info */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{selectedFile?.name}</p>
                      <p className="text-[10px] text-slate-400">Total Worksheets: {previewData.sheets?.length || 0}</p>
                    </div>
                  </div>

                  <select
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(e.target.value);
                      const sh = previewData.sheets?.find((s: any) => s.name === e.target.value);
                      if (sh) autoMapColumns(sh.columns);
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    {previewData.sheets?.map((s: any) => (
                      <option key={s.name} value={s.name}>
                        Sheet: {s.name} ({s.rowCount} rows)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Validation Stats Badge */}
                {activeSheetObj && (
                  <div className="grid grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Rows</p>
                      <p className="text-sm font-black font-mono text-white">{activeSheetObj.rowCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Columns Detected</p>
                      <p className="text-sm font-black font-mono text-sky-400">{activeSheetObj.columns?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Sample Data</p>
                      <p className="text-sm font-black font-mono text-emerald-400">{activeSheetObj.sampleRows?.length || 0} rows</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Status</p>
                      <p className="text-xs font-bold font-mono text-emerald-400 mt-0.5">READY</p>
                    </div>
                  </div>
                )}

                {/* Dynamic Column Mapper Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Dynamic Column Mapper
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {Object.keys(columnMapping).map((key) => (
                      <div key={key}>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')} Column
                        </label>
                        <select
                          value={columnMapping[key]}
                          onChange={(e) =>
                            setColumnMapping({ ...columnMapping, [key]: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Ignore / Unmapped --</option>
                          {activeSheetObj?.columns?.map((c: string) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewData(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Select Different File
                  </button>

                  <button
                    onClick={handleImportExcel}
                    disabled={importing}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importing Database...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Import Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD RATE SOURCE MODAL */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Schedule of Rates Source</h3>
              <button onClick={() => setIsAddSourceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  value={newSourceForm.sourceName}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, sourceName: e.target.value })}
                  placeholder="e.g. Government of Telangana Common Schedule of Rates 2026-27"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Code *</label>
                  <input
                    type="text"
                    required
                    value={newSourceForm.sourceCode}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, sourceCode: e.target.value })}
                    placeholder="TS_SOR_2026_27"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State / Location</label>
                  <input
                    type="text"
                    value={newSourceForm.state}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Schedule Year</label>
                  <input
                    type="text"
                    value={newSourceForm.year}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Publisher Authority</label>
                  <input
                    type="text"
                    value={newSourceForm.publisher}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newSourceForm.description}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, description: e.target.value })}
                  placeholder="Official PWD schedule of rates reference..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSourceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
