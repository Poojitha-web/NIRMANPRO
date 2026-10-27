import React, { useState } from 'react';
import { Project } from '../../types';
import { projectsApi } from '../../api/projects';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Building2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ReportsView: React.FC<{ project: Project }> = ({ project }) => {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const generatePDF = async () => {
    setLoadingPdf(true);
    try {
      const quantities = await projectsApi.getQuantities(project.id);
      const boq = await projectsApi.getBoq(project.id);
      const costs = await projectsApi.getCost(project.id);
      const materials = await projectsApi.getMaterialRequirements(project.id);
      const labour = await projectsApi.getLabourRequirements(project.id);
      const equipment = await projectsApi.getEquipmentRequirements(project.id);

      const doc = new jsPDF();

      // Header with NIRMAN PRO branding
      doc.setFontSize(22);
      doc.setTextColor(2, 132, 199); // Sky blue
      doc.text('NIRMAN PRO', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Smart Construction Planning, Quantity Surveying & Cost Estimation Platform', 14, 26);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 32);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 35, 196, 35);

      // Section 1: Project Overview
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Project Overview & Rate Database Parameters', 14, 43);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Project Name: ${project.projectName}`, 14, 50);
      doc.text(`Company Name: ${project.companyName || 'N/A'}`, 110, 50);
      doc.text(`Engineer Name: ${project.engineerName || 'N/A'}`, 14, 56);
      doc.text(`Building Type: ${project.buildingType}`, 110, 56);
      doc.text(`Location: ${project.location || 'N/A'}`, 14, 62);
      doc.text(`Number of Floors: ${project.numberOfFloors}`, 110, 62);
      doc.text(`Design Code: ${project.designCode || 'IS 456:2000'}`, 14, 68);
      doc.text(`Unit System: ${(project.unitSystem || 'metric').toUpperCase()}`, 110, 68);
      doc.text(`Rate Source: ${(project as any).rateSource?.sourceName || 'Government Schedule of Rates 2026-27'}`, 14, 74);
      doc.text(`Pricing Zone: ${(project as any).zone || 'Zone-I (Urban/Municipal)'}`, 110, 74);

      // Section 2: Cost Summary Table
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Cost Estimation Summary', 14, 85);

      (doc as any).autoTable({
        startY: 89,
        head: [['Cost Component', 'Amount (INR)']],
        body: [
          ['Material Cost (BOQ)', `INR ${(costs?.materialCost || 0).toLocaleString('en-IN')}`],
          ['Labour Cost', `INR ${(costs?.laborCost || 0).toLocaleString('en-IN')}`],
          ['Equipment Cost', `INR ${(costs?.equipmentCost || 0).toLocaleString('en-IN')}`],
          ['Overheads', `INR ${(costs?.overheads || 0).toLocaleString('en-IN')}`],
          ['GST Rate', `INR ${(costs?.gst || 0).toLocaleString('en-IN')}`],
          ['Contingency Rate', `INR ${(costs?.contingency || 0).toLocaleString('en-IN')}`],
          ['TOTAL ESTIMATED PROJECT COST', `INR ${(costs?.totalCost || 0).toLocaleString('en-IN')}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199] },
      });

      // Section 3: Material Statement
      let finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(13);
      doc.text('3. Material Requirement Statement', 14, finalY + 12);

      (doc as any).autoTable({
        startY: finalY + 16,
        head: [['Material', 'Unit', 'Required Qty', 'Total Cost (INR)']],
        body: (materials?.materials || []).map((m: any) => [
          m.material,
          m.unit,
          m.finalQuantity,
          `INR ${m.totalCost.toLocaleString('en-IN')}`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
      });

      // Section 4: Bill of Quantities (BOQ)
      finalY = (doc as any).lastAutoTable.finalY || 200;
      if (finalY > 220) doc.addPage();

      doc.setFontSize(13);
      doc.text('4. Bill of Quantities (BOQ) - Government Schedule of Rates', 14, finalY > 220 ? 20 : finalY + 12);

      const boqList = Array.isArray(boq) ? boq : boq?.items || [];
      (doc as any).autoTable({
        startY: finalY > 220 ? 25 : finalY + 16,
        head: [['Item Code', 'Item Description', 'IS Standard', 'Unit', 'Quantity', 'Rate (INR)', 'Total Amount (INR)']],
        body: boqList.map((i: any, idx: number) => [
          i.itemCode || `SOR-${idx + 1}`,
          `${i.itemName}${i.description ? ' - ' + i.description : ''}`,
          i.standardReference || '-',
          i.unit,
          i.quantity,
          `INR ${i.unitRate}`,
          `INR ${(i.totalAmount || 0).toLocaleString('en-IN')}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`${project.projectName.replace(/\s+/g, '_')}_NIRMAN_PRO_Report.pdf`);
      toast.success('NIRMAN PRO PDF Report generated and downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    } finally {
      setLoadingPdf(false);
    }
  };

  const generateExcel = async () => {
    setLoadingExcel(true);
    try {
      const quantities = await projectsApi.getQuantities(project.id);
      const boq = await projectsApi.getBoq(project.id);
      const costs = await projectsApi.getCost(project.id);
      const materials = await projectsApi.getMaterialRequirements(project.id);

      const workbook = new ExcelJS.Workbook();
      
      // Sheet 1: Project Summary & Cost
      const summarySheet = workbook.addWorksheet('NIRMAN PRO Summary');
      summarySheet.columns = [
        { header: 'Cost Category', key: 'category', width: 30 },
        { header: 'Amount (INR)', key: 'amount', width: 25 },
      ];
      summarySheet.addRow({ category: 'Material Cost', amount: costs?.materialCost || 0 });
      summarySheet.addRow({ category: 'Labour Cost', amount: costs?.laborCost || 0 });
      summarySheet.addRow({ category: 'Equipment Cost', amount: costs?.equipmentCost || 0 });
      summarySheet.addRow({ category: 'Overheads', amount: costs?.overheads || 0 });
      summarySheet.addRow({ category: 'GST', amount: costs?.gst || 0 });
      summarySheet.addRow({ category: 'Contingency', amount: costs?.contingency || 0 });
      summarySheet.addRow({ category: 'TOTAL PROJECT COST', amount: costs?.totalCost || 0 });

      // Sheet 2: BOQ
      const boqSheet = workbook.addWorksheet('Bill of Quantities');
      boqSheet.columns = [
        { header: 'Item Code', key: 'itemCode', width: 15 },
        { header: 'Item Name', key: 'itemName', width: 35 },
        { header: 'Description / Specification', key: 'desc', width: 40 },
        { header: 'IS Standard', key: 'standard', width: 18 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Quantity', key: 'qty', width: 12 },
        { header: 'Unit Rate (INR)', key: 'rate', width: 15 },
        { header: 'Total Amount (INR)', key: 'total', width: 20 },
      ];

      const boqList = Array.isArray(boq) ? boq : boq?.items || [];
      boqList.forEach((i: any, idx: number) => {
        boqSheet.addRow({
          itemCode: i.itemCode || `SOR-${idx + 1}`,
          itemName: i.itemName,
          desc: i.description || i.specification || '',
          standard: i.standardReference || '',
          unit: i.unit,
          qty: i.quantity,
          rate: i.unitRate,
          total: i.totalAmount,
        });
      });

      // Sheet 3: Material Statement
      const matSheet = workbook.addWorksheet('Material Statement');
      matSheet.columns = [
        { header: 'Material Name', key: 'mat', width: 30 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Quantity', key: 'qty', width: 12 },
        { header: 'Rate (INR)', key: 'rate', width: 15 },
        { header: 'Total Cost (INR)', key: 'cost', width: 20 },
      ];

      (materials?.materials || []).forEach((m: any) => {
        matSheet.addRow({
          mat: m.material,
          unit: m.unit,
          qty: m.finalQuantity,
          rate: m.rate,
          cost: m.totalCost,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${project.projectName.replace(/\s+/g, '_')}_NIRMAN_PRO_BOQ.xlsx`);

      toast.success('NIRMAN PRO Excel Report generated and downloaded!');
    } catch (err) {
      toast.error('Failed to generate Excel report');
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
          <FileText className="w-5 h-5 text-sky-400" />
          NIRMAN PRO Project Reports & Export Module
        </h2>
        <p className="text-xs text-slate-400">Generate professional NIRMAN PRO engineering PDF reports & Excel spreadsheets for clients and contractors.</p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* PDF Export Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Complete Project PDF Report</h3>
              <p className="text-xs text-slate-400">Includes executive summary, material statement, and itemized BOQ report.</p>
            </div>
          </div>

          <button
            onClick={generatePDF}
            disabled={loadingPdf}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {loadingPdf ? 'Generating NIRMAN PRO PDF...' : 'Download PDF Report'}
          </button>
        </div>

        {/* Excel Export Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">BOQ Excel Spreadsheet (.xlsx)</h3>
              <p className="text-xs text-slate-400">Formatted Excel workbook with Cost Estimation, BOQ & Material Statement worksheets.</p>
            </div>
          </div>

          <button
            onClick={generateExcel}
            disabled={loadingExcel}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {loadingExcel ? 'Generating NIRMAN PRO Excel...' : 'Download Excel Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
