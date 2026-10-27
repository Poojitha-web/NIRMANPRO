import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects';
import { BoqItem } from '../../types';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save, 
  Wand2, 
  IndianRupee 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const BOQView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [items, setItems] = useState<BoqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);

  // New Item State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUnit, setNewUnit] = useState('sqm');
  const [newQty, setNewQty] = useState(1);
  const [newRate, setNewRate] = useState(100);

  useEffect(() => {
    loadBOQ();
  }, [projectId]);

  const loadBOQ = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getBoq(projectId);
      setItems(res);
    } catch (err) {
      toast.error('Failed to load BOQ items');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.generateBoq(projectId);
      setItems(res);
      toast.success('BOQ generated from floor plan quantities!');
    } catch (err) {
      toast.error('Failed to generate BOQ');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: BoqItem) => {
    setEditingId(item.id);
    setEditRate(item.unitRate);
    setEditQty(item.quantity);
  };

  const saveEdit = async (itemId: string) => {
    try {
      await projectsApi.updateBoqItem(projectId, itemId, {
        unitRate: editRate,
        quantity: editQty,
      });
      toast.success('BOQ item updated');
      setEditingId(null);
      loadBOQ();
    } catch (err) {
      toast.error('Failed to update BOQ item');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await projectsApi.deleteBoqItem(projectId, itemId);
      toast.success('BOQ item deleted');
      loadBOQ();
    } catch (err) {
      toast.error('Failed to delete BOQ item');
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsApi.addBoqItem(projectId, {
        itemName: newItemName,
        description: newDesc,
        unit: newUnit,
        quantity: newQty,
        unitRate: newRate,
      });
      toast.success('Custom BOQ item added');
      setShowAddModal(false);
      loadBOQ();
    } catch (err) {
      toast.error('Failed to add BOQ item');
    }
  };

  const totalBOQAmount = items.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-400" />
            Bill of Quantities (BOQ)
          </h2>
          <p className="text-xs text-slate-400">Detailed itemized list of material & construction works with unit costs.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Auto-Generate BOQ
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Item
          </button>
        </div>
      </div>

      {/* BOQ Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading BOQ table...</div>
      ) : items.length > 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-2">S.No</th>
                  <th className="pb-3 px-2">SOR Code</th>
                  <th className="pb-3 px-2">Item Name & Description</th>
                  <th className="pb-3 px-2">IS Standard</th>
                  <th className="pb-3 px-2">Unit</th>
                  <th className="pb-3 px-2">Quantity</th>
                  <th className="pb-3 px-2">Unit Rate (₹)</th>
                  <th className="pb-3 px-2">Total Amount (₹)</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-2 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className="font-mono font-bold text-sky-400">{item.itemCode || `BOQ-${idx + 1}`}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.rateSource || 'NIRMAN PRO SoR'}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-white">{item.itemName}</div>
                      <div className="text-[11px] text-slate-400">{item.description || item.specification}</div>
                    </td>
                    <td className="py-3 px-2">
                      {item.standardReference ? (
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                          {item.standardReference}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-brand-400">{item.unit}</td>
                    
                    {/* Editable Quantity */}
                    <td className="py-3 px-2">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>

                    {/* Editable Rate */}
                    <td className="py-3 px-2 font-semibold">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        />
                      ) : (
                        `₹${item.unitRate.toLocaleString('en-IN')}`
                      )}
                    </td>

                    <td className="py-3 px-2 font-bold text-emerald-400">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-2 text-right">
                      {editingId === item.id ? (
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="px-2 py-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-bold text-white bg-slate-950/60 text-sm">
                  <td colSpan={7} className="py-4 px-2 text-right uppercase tracking-wider">
                    Total Estimated Material Cost (BOQ):
                  </td>
                  <td className="py-4 px-2 text-emerald-400 font-extrabold text-base">
                    ₹{totalBOQAmount.toLocaleString('en-IN')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-xs">No BOQ items generated yet.</p>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl"
          >
            Auto-Generate BOQ from Floor Plan
          </button>
        </div>
      )}

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCustom} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Custom BOQ Item</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Electrical Main Panel"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Specification details..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Rate (₹)</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
