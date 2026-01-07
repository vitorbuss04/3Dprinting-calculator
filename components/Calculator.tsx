import React, { useState, useEffect, useMemo } from 'react';
import { Save, Calculator as CalcIcon, AlertTriangle } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Calculator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });

  // Form State
  const [projectName, setProjectName] = useState('New Project');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [printHours, setPrintHours] = useState(0);
  const [printMinutes, setPrintMinutes] = useState(0);
  const [weight, setWeight] = useState(0); // grams
  const [failureRate, setFailureRate] = useState(10); // %
  const [laborHours, setLaborHours] = useState(0);
  const [laborMinutes, setLaborMinutes] = useState(0);
  const [laborRate, setLaborRate] = useState(0);
  const [markup, setMarkup] = useState(100); // %

  useEffect(() => {
    const p = StorageService.getPrinters();
    const m = StorageService.getMaterials();
    setPrinters(p);
    setMaterials(m);
    setSettings(StorageService.getSettings());
    if (p.length > 0) setSelectedPrinterId(p[0].id);
    if (m.length > 0) setSelectedMaterialId(m[0].id);
  }, []);

  // Calculation Logic
  const result: CalculationResult = useMemo(() => {
    const printer = printers.find(p => p.id === selectedPrinterId);
    const material = materials.find(m => m.id === selectedMaterialId);

    if (!printer || !material) {
      return {
        depreciationCost: 0, energyCost: 0, materialCost: 0, maintenanceCost: 0,
        laborCost: 0, machineTotalCost: 0, totalProductionCost: 0, finalPrice: 0, profit: 0
      };
    }

    const totalPrintTimeHours = printHours + (printMinutes / 60);
    const totalLaborTimeHours = laborHours + (laborMinutes / 60);

    // 1. Depreciation
    const depreciationPerHour = printer.acquisitionCost / printer.lifespanHours;
    const depreciationCost = depreciationPerHour * totalPrintTimeHours;

    // 2. Energy
    const energyCost = (printer.powerConsumption / 1000) * settings.electricityCost * totalPrintTimeHours;

    // 3. Material (with failure rate)
    const costPerGram = material.spoolPrice / material.spoolWeight;
    const materialCostBase = weight * costPerGram;
    const materialCost = materialCostBase * (1 + (failureRate / 100));

    // 4. Maintenance
    const maintenanceCost = printer.maintenanceCostPerHour * totalPrintTimeHours;

    // 5. Labor
    const laborCost = totalLaborTimeHours * laborRate;

    const machineTotalCost = depreciationCost + maintenanceCost + energyCost;
    const totalProductionCost = machineTotalCost + materialCost + laborCost;
    const finalPrice = totalProductionCost * (1 + (markup / 100));
    const profit = finalPrice - totalProductionCost;

    return {
      depreciationCost,
      energyCost,
      materialCost,
      maintenanceCost,
      laborCost,
      machineTotalCost,
      totalProductionCost,
      finalPrice,
      profit
    };
  }, [
    printers, materials, settings, selectedPrinterId, selectedMaterialId,
    printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup
  ]);

  const saveProject = () => {
    const project: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      date: new Date().toISOString(),
      printerId: selectedPrinterId,
      materialId: selectedMaterialId,
      printTimeHours: printHours,
      printTimeMinutes: printMinutes,
      modelWeight: weight,
      failureRate,
      laborTimeHours: laborHours,
      laborTimeMinutes: laborMinutes,
      laborHourlyRate: laborRate,
      markup,
      result
    };
    const current = StorageService.getProjects();
    StorageService.saveProjects([project, ...current]);
    alert('Project saved to history!');
  };

  const chartData = [
    { name: 'Material', value: result.materialCost, color: '#10b981' }, // emerald-500
    { name: 'Machine', value: result.machineTotalCost, color: '#f59e0b' }, // amber-500
    { name: 'Labor', value: result.laborCost, color: '#3b82f6' }, // blue-500
  ].filter(d => d.value > 0);

  if (printers.length === 0 || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">No Assets Found</h2>
        <p className="text-slate-400">Please add at least one Printer and one Material in the "My Assets" tab to use the calculator.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* --- Inputs Column --- */}
      <div className="lg:col-span-7 space-y-6">
        <Card title="Project Details">
          <Input label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Printer"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
            />
            <Select
              label="Material"
              options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Input label="Time (Hrs)" type="number" min="0" value={printHours} onChange={(e) => setPrintHours(Number(e.target.value))} />
            <Input label="Time (Min)" type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(Number(e.target.value))} />
            <Input label="Weight (g)" type="number" min="0" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            <Input label="Fail Rate (%)" type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(Number(e.target.value))} />
          </div>
        </Card>

        <Card title="Business Values">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Labor (Hrs)" type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(Number(e.target.value))} />
            <Input label="Labor (Min)" type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(Number(e.target.value))} />
            <Input label="Hourly Rate" type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} subLabel={settings.currencySymbol} />
          </div>
          <div className="mt-4">
             <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-300">Markup (Profit Margin)</label>
                <span className="text-sm font-bold text-blue-400">{markup}%</span>
             </div>
             <input
               type="range"
               min="0"
               max="500"
               step="5"
               value={markup}
               onChange={(e) => setMarkup(Number(e.target.value))}
               className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>
        </Card>

        <Button onClick={saveProject} className="w-full py-4 text-lg">
          <Save size={20} /> Save Quote to History
        </Button>
      </div>

      {/* --- Results Column --- */}
      <div className="lg:col-span-5 space-y-4">
        {/* Main Price Card */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalcIcon size={120} />
          </div>
          <h3 className="text-slate-300 font-medium mb-1">Suggested Selling Price</h3>
          <div className="text-4xl font-bold text-white mb-2">
            {settings.currencySymbol} {result.finalPrice.toFixed(2)}
          </div>
          <div className="flex gap-4 text-sm mt-4">
            <div>
               <span className="block text-slate-400">Total Cost</span>
               <span className="font-mono text-red-300">{settings.currencySymbol} {result.totalProductionCost.toFixed(2)}</span>
            </div>
            <div>
               <span className="block text-slate-400">Est. Profit</span>
               <span className="font-mono text-emerald-400">{settings.currencySymbol} {result.profit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <Card title="Cost Breakdown" className="h-[400px] flex flex-col">
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`, 'Cost']}
                 />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4 text-sm">
             <div className="flex justify-between items-center p-2 rounded bg-slate-900/50">
               <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Material (+ Fail Rate)</span>
               <span className="font-mono">{settings.currencySymbol} {result.materialCost.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center p-2 rounded bg-slate-900/50">
               <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Machine (Energy/Depr)</span>
               <span className="font-mono">{settings.currencySymbol} {result.machineTotalCost.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center p-2 rounded bg-slate-900/50">
               <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Labor</span>
               <span className="font-mono">{settings.currencySymbol} {result.laborCost.toFixed(2)}</span>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};