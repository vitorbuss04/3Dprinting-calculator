import React, { useState, useEffect, useMemo } from 'react';
import { Save, Calculator as CalcIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Calculator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [projectName, setProjectName] = useState('Novo Projeto');
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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [p, m, s] = await Promise.all([
          StorageService.getPrinters(),
          StorageService.getMaterials(),
          StorageService.getSettings()
        ]);
        setPrinters(p);
        setMaterials(m);
        setSettings(s);
        if (p.length > 0) setSelectedPrinterId(p[0].id);
        if (m.length > 0) setSelectedMaterialId(m[0].id);
      } catch (e) {
        console.error("Error loading calculator data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const saveProject = async () => {
    setSaving(true);
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
    
    try {
      await StorageService.addProject(project);
      alert('Projeto salvo no histórico!');
    } catch (e) {
      alert('Erro ao salvar projeto.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const chartData = [
    { name: 'Material', value: result.materialCost, color: '#10b981' }, // emerald-500
    { name: 'Máquina', value: result.machineTotalCost, color: '#f59e0b' }, // amber-500
    { name: 'Mão de Obra', value: result.laborCost, color: '#3b82f6' }, // blue-500
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  if (printers.length === 0 || materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 text-gray-900">Nenhum Ativo Encontrado</h2>
        <p className="text-gray-500">Por favor, adicione pelo menos uma Impressora e um Material na aba "Meus Ativos" para usar a calculadora.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* --- Inputs Column --- */}
      <div className="lg:col-span-7 space-y-8">
        <Card title="Detalhes do Projeto">
          <Input label="Nome do Projeto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Impressora"
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
            <Input label="Tempo (Hrs)" type="number" min="0" value={printHours} onChange={(e) => setPrintHours(Number(e.target.value))} />
            <Input label="Tempo (Min)" type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(Number(e.target.value))} />
            <Input label="Peso (g)" type="number" min="0" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            <Input label="Falha (%)" type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(Number(e.target.value))} />
          </div>
        </Card>

        <Card title="Valores de Negócio">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Mão de Obra (Hrs)" type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(Number(e.target.value))} />
            <Input label="Mão de Obra (Min)" type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(Number(e.target.value))} />
            <Input label="Valor Hora" type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} subLabel={settings.currencySymbol} />
          </div>
          <div className="mt-4">
             <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Margem de Lucro (Markup)</label>
                <span className="text-sm font-black text-blue-600">{markup}%</span>
             </div>
             <input
               type="range"
               min="0"
               max="500"
               step="5"
               value={markup}
               onChange={(e) => setMarkup(Number(e.target.value))}
               className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>
        </Card>

        <Button onClick={saveProject} className="w-full py-4 text-lg shadow-2xl shadow-blue-500/20" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
          {saving ? 'Salvando...' : 'Salvar Orçamento'}
        </Button>
      </div>

      {/* --- Results Column --- */}
      <div className="lg:col-span-5 space-y-6">
        {/* Main Price Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-500 rounded-3xl p-8 shadow-2xl shadow-indigo-500/30 relative overflow-hidden text-white transition-transform hover:scale-[1.02]">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white translate-x-1/4 -translate-y-1/4">
            <CalcIcon size={200} />
          </div>
          <h3 className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Preço de Venda Sugerido</h3>
          <div className="text-5xl font-black mb-4">
            {settings.currencySymbol} {result.finalPrice.toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/10">
            <div>
               <span className="block text-blue-100/70 text-[10px] font-bold uppercase tracking-wider mb-1">Custo Produção</span>
               <span className="font-mono text-xl font-bold">{settings.currencySymbol} {result.totalProductionCost.toFixed(2)}</span>
            </div>
            <div>
               <span className="block text-blue-100/70 text-[10px] font-bold uppercase tracking-wider mb-1">Lucro Líquido</span>
               <span className="font-mono text-xl font-bold text-emerald-300">{settings.currencySymbol} {result.profit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <Card title="Composição de Custos" className="flex flex-col">
          <div className="h-64 mb-6">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={8}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#111827' }}
                    formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`, 'Custo']}
                 />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group">
               <span className="flex items-center gap-3 text-sm font-bold text-gray-600 tracking-tight"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div> Insumos</span>
               <span className="font-mono font-bold text-gray-900">{settings.currencySymbol} {result.materialCost.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group">
               <span className="flex items-center gap-3 text-sm font-bold text-gray-600 tracking-tight"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></div> Operacional Máquina</span>
               <span className="font-mono font-bold text-gray-900">{settings.currencySymbol} {result.machineTotalCost.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group">
               <span className="flex items-center gap-3 text-sm font-bold text-gray-600 tracking-tight"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div> Mão de Obra</span>
               <span className="font-mono font-bold text-gray-900">{settings.currencySymbol} {result.laborCost.toFixed(2)}</span>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};