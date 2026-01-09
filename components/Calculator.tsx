import React, { useState, useEffect, useMemo } from 'react';
import { Save, Calculator as CalcIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select, neuShadowIn } from './UIComponents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Calculator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projectName, setProjectName] = useState('Novo Projeto');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [printHours, setPrintHours] = useState(0);
  const [printMinutes, setPrintMinutes] = useState(0);
  const [weight, setWeight] = useState(0);
  const [failureRate, setFailureRate] = useState(10);
  const [laborHours, setLaborHours] = useState(0);
  const [laborMinutes, setLaborMinutes] = useState(0);
  const [laborRate, setLaborRate] = useState(0);
  const [markup, setMarkup] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [p, m, s] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings()
      ]);
      setPrinters(p); setMaterials(m); setSettings(s);
      if (p.length > 0) setSelectedPrinterId(p[0].id);
      if (m.length > 0) setSelectedMaterialId(m[0].id);
      setLoading(false);
    };
    fetchData();
  }, []);

  const result: CalculationResult = useMemo(() => {
    const printer = printers.find(p => p.id === selectedPrinterId);
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!printer || !material) return { depreciationCost: 0, energyCost: 0, materialCost: 0, maintenanceCost: 0, laborCost: 0, machineTotalCost: 0, totalProductionCost: 0, finalPrice: 0, profit: 0 };
    const totalPrintTimeHours = printHours + (printMinutes / 60);
    const depreciationCost = (printer.acquisitionCost / printer.lifespanHours) * totalPrintTimeHours;
    const energyCost = (printer.powerConsumption / 1000) * settings.electricityCost * totalPrintTimeHours;
    const materialCost = (weight * (material.spoolPrice / material.spoolWeight)) * (1 + (failureRate / 100));
    const maintenanceCost = printer.maintenanceCostPerHour * totalPrintTimeHours;
    const laborCost = (laborHours + (laborMinutes / 60)) * laborRate;
    const totalProductionCost = depreciationCost + energyCost + materialCost + maintenanceCost + laborCost;
    const finalPrice = totalProductionCost * (1 + (markup / 100));
    return { depreciationCost, energyCost, materialCost, maintenanceCost, laborCost, machineTotalCost: depreciationCost + maintenanceCost + energyCost, totalProductionCost, finalPrice, profit: finalPrice - totalProductionCost };
  }, [printers, materials, settings, selectedPrinterId, selectedMaterialId, printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup]);

  const saveProject = async () => {
    setSaving(true);
    try {
      await StorageService.addProject({ id: crypto.randomUUID(), name: projectName, date: new Date().toISOString(), printerId: selectedPrinterId, materialId: selectedMaterialId, printTimeHours: printHours, printTimeMinutes: printMinutes, modelWeight: weight, failureRate, laborTimeHours: laborHours, laborTimeMinutes: laborMinutes, laborHourlyRate: laborRate, markup, result });
      alert('Orçamento Registrado!');
    } catch (e) { alert('Erro na Persistência'); } finally { setSaving(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  const chartData = [
    { name: 'Filamento', value: result.materialCost, color: '#10b981' },
    { name: 'Hardware', value: result.machineTotalCost, color: '#f59e0b' },
    { name: 'Mão de Obra', value: result.laborCost, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-visible p-1">
      <div className="lg:col-span-7 flex flex-col gap-8 overflow-y-auto no-scrollbar pb-6 px-1">
        <Card title="Engenharia do Modelo">
          <Input label="ID do Projeto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <div className="grid grid-cols-2 gap-5">
            <Select label="Hardware Ativo" options={printers.map(p => ({ value: p.id, label: p.name }))} value={selectedPrinterId} onChange={(e) => setSelectedPrinterId(e.target.value)} />
            <Select label="Polímero" options={materials.map(m => ({ value: m.id, label: m.name }))} value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-2 overflow-visible">
            <Input label="Hrs" type="number" value={printHours} onChange={(e) => setPrintHours(Number(e.target.value))} />
            <Input label="Min" type="number" value={printMinutes} onChange={(e) => setPrintMinutes(Number(e.target.value))} />
            <Input label="Massa(g)" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            <Input label="Segurança(%)" type="number" value={failureRate} onChange={(e) => setFailureRate(Number(e.target.value))} />
          </div>
        </Card>

        <Card title="Configuração Comercial">
          <div className="grid grid-cols-3 gap-5">
            <Input label="M.O. Hrs" type="number" value={laborHours} onChange={(e) => setLaborHours(Number(e.target.value))} />
            <Input label="M.O. Min" type="number" value={laborMinutes} onChange={(e) => setLaborMinutes(Number(e.target.value))} />
            <Input label="Taxa Lab" type="number" value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} subLabel={settings.currencySymbol} />
          </div>
          <div className="mt-4 px-1 overflow-visible">
            <div className="flex justify-between mb-2 text-[0.7rem] font-black text-gray-400 uppercase tracking-widest">
              <span>Margem de Lucro (Markup)</span>
              <span className="text-blue-600">{markup}%</span>
            </div>
            <div className={`p-4 rounded-xl ${neuShadowIn} border border-white/20`}>
              <input type="range" min="0" max="500" step="5" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-8 min-h-0 overflow-visible">
        <div className="flex-1 min-h-0 flex flex-col gap-8 overflow-visible">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2.5vw] p-8 text-white shadow-2xl shadow-indigo-500/40 shrink-0 relative overflow-visible">
            <div className="relative z-10">
              <h4 className="text-[0.65rem] font-black uppercase tracking-[0.4em] opacity-80 mb-3">Valor de Mercado Final</h4>
              <div className="text-[clamp(1.8rem,3.5vw,3.5rem)] font-black leading-none tracking-tighter">{settings.currencySymbol} {result.finalPrice.toFixed(2)}</div>
              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10 text-[0.75rem] font-bold uppercase tracking-tight">
                <div>Custo Produção: <br/><span className="opacity-70">{settings.currencySymbol}{result.totalProductionCost.toFixed(2)}</span></div>
                <div className="text-emerald-300">Net Profit: <br/>{settings.currencySymbol}{result.profit.toFixed(2)}</div>
              </div>
            </div>
            <CalcIcon className="absolute top-1/2 right-0 -translate-y-1/2 opacity-[0.03] translate-x-1/4 pointer-events-none" size={200} />
          </div>

          <Card title="Breakdown de Custos" className="flex-1 overflow-visible">
            <div className="h-full flex flex-col overflow-visible">
              <div className="flex-1 min-h-0 overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" paddingAngle={8} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4 shrink-0 overflow-visible">
                {chartData.map((d, i) => (
                  <div key={i} className={`flex justify-between text-[0.65rem] font-black uppercase p-3 rounded-xl ${neuShadowIn} border border-white/30 bg-transparent`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                      <span className="opacity-60">{d.name}</span>
                    </div>
                    <span>{settings.currencySymbol}{d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Button onClick={saveProject} disabled={saving} className="h-[12vh] min-h-[70px] w-full bg-blue-600 text-white shadow-2xl shadow-blue-500/30 text-xl group overflow-visible">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="group-hover:scale-125 transition-transform" />} 
          <span>Finalizar Orçamento</span>
        </Button>
      </div>
    </div>
  );
};
