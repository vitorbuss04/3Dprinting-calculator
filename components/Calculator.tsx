import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
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
  const [isSaving, setIsSaving] = useState(false);
  const hasFetched = useRef(false);

  // Form State
  const [projectName, setProjectName] = useState('Novo Projeto');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [printHours, setPrintHours] = useState('0');
  const [printMinutes, setPrintMinutes] = useState('0');
  const [weight, setWeight] = useState('0');
  const [failureRate, setFailureRate] = useState('10');
  const [laborHours, setLaborHours] = useState('0');
  const [laborMinutes, setLaborMinutes] = useState('0');
  const [laborRate, setLaborRate] = useState('0');
  const [markup, setMarkup] = useState(100);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      const [p, m, s] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings(),
      ]);
      setPrinters(p);
      setMaterials(m);
      setSettings(s);
      if (p.length > 0) setSelectedPrinterId(p[0].id);
      // Select the first material that is in stock
      const firstInStockMaterial = m.find(mat => (mat.currentStock || 0) > 0);
      if (firstInStockMaterial) {
        setSelectedMaterialId(firstInStockMaterial.id);
      } else if (m.length > 0) {
        setSelectedMaterialId(m[0].id); // fallback to first material if none are in stock
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const result: CalculationResult = useMemo(() => {
    const printer = printers.find(p => p.id === selectedPrinterId);
    const material = materials.find(m => m.id === selectedMaterialId);

    if (!printer || !material) {
      return { depreciationCost: 0, energyCost: 0, materialCost: 0, maintenanceCost: 0, laborCost: 0, machineTotalCost: 0, totalProductionCost: 0, finalPrice: 0, profit: 0 };
    }

    const numPrintHours = parseFloat(printHours) || 0;
    const numPrintMinutes = parseFloat(printMinutes) || 0;
    const numWeight = parseFloat(weight) || 0;
    const numFailureRate = parseFloat(failureRate) || 0;
    const numLaborHours = parseFloat(laborHours) || 0;
    const numLaborMinutes = parseFloat(laborMinutes) || 0;
    const numLaborRate = parseFloat(laborRate) || 0;

    const totalPrintTimeHours = numPrintHours + (numPrintMinutes / 60);
    const totalLaborTimeHours = numLaborHours + (numLaborMinutes / 60);
    const depreciationPerHour = printer.acquisitionCost / printer.lifespanHours;
    const depreciationCost = depreciationPerHour * totalPrintTimeHours;
    const energyCost = (printer.powerConsumption / 1000) * settings.electricityCost * totalPrintTimeHours;
    const costPerGram = material.spoolPrice / material.spoolWeight;
    const materialCostBase = numWeight * costPerGram;
    const materialCost = materialCostBase * (1 + (numFailureRate / 100));
    const maintenanceCost = printer.maintenanceCostPerHour * totalPrintTimeHours;
    const laborCost = totalLaborTimeHours * numLaborRate;
    const machineTotalCost = depreciationCost + maintenanceCost + energyCost;
    const totalProductionCost = machineTotalCost + materialCost + laborCost;
    const finalPrice = totalProductionCost * (1 + (markup / 100));
    const profit = finalPrice - totalProductionCost;

    return { depreciationCost, energyCost, materialCost, maintenanceCost, laborCost, machineTotalCost, totalProductionCost, finalPrice, profit };
  }, [printers, materials, settings, selectedPrinterId, selectedMaterialId, printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup]);

  const saveProject = async () => {
    if (!projectName.trim()) {
      toast.error('Por favor, dê um nome ao projeto.');
      return;
    }
    
    const material = materials.find(m => m.id === selectedMaterialId);
    const materialUsed = parseFloat(weight) || 0;

    if (!material || (material.currentStock || 0) < materialUsed) {
        toast.error('Estoque de material insuficiente para este projeto.');
        return;
    }

    setIsSaving(true);

    const project: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      date: new Date().toISOString(),
      printerId: selectedPrinterId,
      materialId: selectedMaterialId,
      printTimeHours: parseFloat(printHours) || 0,
      printTimeMinutes: parseFloat(printMinutes) || 0,
      modelWeight: materialUsed,
      failureRate: parseFloat(failureRate) || 0,
      laborTimeHours: parseFloat(laborHours) || 0,
      laborTimeMinutes: parseFloat(laborMinutes) || 0,
      laborHourlyRate: parseFloat(laborRate) || 0,
      markup,
      result
    };

    try {
        await StorageService.addProject(project);
        
        // Update material stock
        const updatedStock = (material.currentStock || 0) - materialUsed;
        const updatedMaterial = { ...material, currentStock: updatedStock };
        await StorageService.updateMaterial(updatedMaterial);

        // Update state locally
        setMaterials(materials.map(m => m.id === selectedMaterialId ? updatedMaterial : m));

        toast.success('Projeto salvo e estoque atualizado!');
    } catch (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const chartData = [
    { name: 'Material', value: result.materialCost, color: '#10b981' },
    { name: 'Máquina', value: result.machineTotalCost, color: '#f59e0b' },
    { name: 'Mão de Obra', value: result.laborCost, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  if (printers.length === 0 || materials.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 text-gray-900">Nenhum Ativo Encontrado</h2>
        <p className="text-gray-500 max-w-sm">Por favor, adicione pelo menos uma Impressora e um Material na aba "Meus Ativos" para usar a calculadora.</p>
      </Card>
    );
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name} (${m.type}) - ${(m.currentStock || 0).toFixed(0)}g restantes`,
    disabled: (m.currentStock || 0) === 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <Card title="Detalhes do Projeto">
          <Input label="Nome do Projeto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Impressora" options={printers.map(p => ({ value: p.id, label: p.name }))} value={selectedPrinterId} onChange={(e) => setSelectedPrinterId(e.target.value)} />
            <Select label="Material" options={materialOptions} value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Input label="Tempo (Hrs)" type="number" min="0" value={printHours} onChange={(e) => setPrintHours(e.target.value)} />
            <Input label="Tempo (Min)" type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(e.target.value)} />
            <Input label="Peso (g)" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Falha (%)" type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(e.target.value)} />
          </div>
        </Card>

        <Card title="Valores de Negócio" className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Mão de Obra (Hrs)" type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
            <Input label="Mão de Obra (Min)" type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(e.target.value)} />
            <Input label="Valor Hora" type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} subLabel={settings.currencySymbol} />
          </div>
          <div className="mt-4">
             <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Margem de Lucro (Markup)</label><span className="text-sm font-black text-blue-600">{markup}%</span></div>
             <input type="range" min="0" max="500" step="5" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </Card>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-500 rounded-3xl p-6 shadow-2xl shadow-indigo-500/30 relative overflow-hidden text-white transition-transform hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-white translate-x-1/4 -translate-y-1/4"><CalcIcon size={200} /></div>
            <h3 className="text-blue-100 font-bold uppercase tracking-widest text-[10px] mb-2 drop-shadow-sm">Preço de Venda Sugerido</h3>
            <div className="text-4xl font-black mb-4 drop-shadow-md">{settings.currencySymbol} {result.finalPrice.toFixed(2)}</div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div><span className="block text-blue-100/70 text-[9px] font-bold uppercase tracking-wider mb-1">Custo Produção</span><span className="font-mono text-lg font-bold">{settings.currencySymbol} {result.totalProductionCost.toFixed(2)}</span></div>
              <div><span className="block text-blue-100/70 text-[9px] font-bold uppercase tracking-wider mb-1">Lucro Líquido</span><span className="font-mono text-lg font-bold text-emerald-300">{settings.currencySymbol} {result.profit.toFixed(2)}</span></div>
            </div>
          </div>

          <Card title="Composição de Custos" className="flex flex-col">
            {chartData.length > 0 && (
              <div className="h-48 mb-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value">
                       {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#111827', fontSize: '11px', fontWeight: 'bold' }} formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`, 'Custo']} />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
               <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div> Insumos</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.materialCost.toFixed(2)}</span></div>
               <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></div> Operacional Máquina</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.machineTotalCost.toFixed(2)}</span></div>
               <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div> Mão de Obra</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.laborCost.toFixed(2)}</span></div>
            </div>
          </Card>
        </div>

        <div className="flex-1 flex min-h-[120px]">
          <Button onClick={saveProject} className="w-full h-full text-lg shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 transform active:scale-[0.98]" disabled={isSaving || (materials.find(m => m.id === selectedMaterialId)?.currentStock || 0) < (parseFloat(weight) || 0)}>
            <div className="flex flex-col items-center gap-3">
              {isSaving ? <Loader2 className="animate-spin" size={32} /> : <Save size={32} className="drop-shadow-sm" />} 
              <span className="font-black tracking-tight">{isSaving ? 'Salvando...' : 'Salvar e Deduzir do Estoque'}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};