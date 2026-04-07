import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, Calculator as CalcIcon, AlertTriangle, Loader2, Plus, Trash2, Package, Activity, Info, BarChart3, Settings2 } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult, AdditionalItem, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { cn } from '../utils/cn';

// Interface local para UI que permite strings nos inputs
interface UIAdditionalItem extends Omit<AdditionalItem, 'price' | 'quantity'> {
  price: string | number;
  quantity: string | number;
}

export const Calculator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasFetched = useRef(false);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);

  // Form State
  const [selectedFolderId, setSelectedFolderId] = useState<string | number>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [partName, setPartName] = useState('PEÇA_001');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | number>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | number>('');

  // Inputs as strings to allow empty states
  const [printHours, setPrintHours] = useState('0');
  const [printMinutes, setPrintMinutes] = useState('0');
  const [weight, setWeight] = useState('0');
  const [failureRate, setFailureRate] = useState('10');
  const [laborHours, setLaborHours] = useState('0');
  const [laborMinutes, setLaborMinutes] = useState('0');
  const [laborRate, setLaborRate] = useState('0');
  const [markup, setMarkup] = useState(100);

  // Additional Items State
  const [additionalItems, setAdditionalItems] = useState<UIAdditionalItem[]>([]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      const [p, m, s, f] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings(),
        StorageService.getFolders(),
      ]);
      setPrinters(p);
      setMaterials(m);
      setSettings(s);
      setFolders(f);
      if (p.length > 0) setSelectedPrinterId(p[0].id);

      // Select most recent folder by default if exists
      if (f.length > 0) setSelectedFolderId(f[0].id);

      const firstInStockMaterial = m.find(mat => (mat.currentStock || 0) > 0);
      if (firstInStockMaterial) {
        setSelectedMaterialId(firstInStockMaterial.id);
      } else if (m.length > 0) {
        setSelectedMaterialId(m[0].id);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddAdditionalItem = () => {
    const newItem: UIAdditionalItem = {
      id: crypto.randomUUID(),
      name: '',
      price: '',
      quantity: 1
    };
    setAdditionalItems([...additionalItems, newItem]);
  };

  const handleRemoveAdditionalItem = (id: string) => {
    setAdditionalItems(additionalItems.filter(item => item.id !== id));
  };

  const updateAdditionalItem = (id: string, field: keyof UIAdditionalItem, value: string | number) => {
    setAdditionalItems(additionalItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const result: CalculationResult = useMemo(() => {
    const printer = printers.find(p => p.id === selectedPrinterId);
    const material = materials.find(m => m.id === selectedMaterialId);

    if (!printer || !material) {
      return { depreciationCost: 0, energyCost: 0, materialCost: 0, additionalCost: 0, maintenanceCost: 0, laborCost: 0, machineTotalCost: 0, totalProductionCost: 0, finalPrice: 0, profit: 0 };
    }

    const numPrintHours = parseFloat(printHours.toString().replace(',', '.')) || 0;
    const numPrintMinutes = parseFloat(printMinutes.toString().replace(',', '.')) || 0;
    const numWeight = parseFloat(weight.toString().replace(',', '.')) || 0;
    const numFailureRate = parseFloat(failureRate.toString().replace(',', '.')) || 0;
    const numLaborHours = parseFloat(laborHours.toString().replace(',', '.')) || 0;
    const numLaborMinutes = parseFloat(laborMinutes.toString().replace(',', '.')) || 0;
    const numLaborRate = parseFloat(laborRate.toString().replace(',', '.')) || 0;

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

    const additionalCost = additionalItems.reduce((acc, item) => {
      const p = typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) || 0 : item.price;
      const q = typeof item.quantity === 'string' ? parseFloat(item.quantity.replace(',', '.')) || 0 : item.quantity;
      return acc + (p * q);
    }, 0);

    const machineTotalCost = depreciationCost + maintenanceCost + energyCost;
    const totalProductionCost = machineTotalCost + materialCost + laborCost + additionalCost;

    const finalPrice = totalProductionCost * (1 + (markup / 100));
    const profit = finalPrice - totalProductionCost;

    return { depreciationCost, energyCost, materialCost, additionalCost, maintenanceCost, laborCost, machineTotalCost, totalProductionCost, finalPrice, profit };
  }, [printers, materials, settings, selectedPrinterId, selectedMaterialId, printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup, additionalItems]);

  const saveProject = async () => {
    if (!partName.trim()) {
      toast.error('Por favor, dê um nome para a peça/impressão.');
      return;
    }

    let finalFolderId = selectedFolderId;

    if (isCreatingFolder) {
      if (!newFolderName.trim()) {
        toast.error('Por favor, digite o nome do novo projeto.');
        return;
      }
      try {
        const newFolder = await StorageService.createFolder(newFolderName);
        setFolders([newFolder, ...folders]);
        finalFolderId = newFolder.id;
        setIsCreatingFolder(false);
        setNewFolderName('');
      } catch (error) {
        toast.error('Erro ao criar pasta do projeto.');
        return;
      }
    } else if (!finalFolderId) {
      toast.error('Selecione um projeto ou crie um novo.');
      return;
    }

    const material = materials.find(m => m.id === selectedMaterialId);
    const materialUsed = parseFloat(weight.toString().replace(',', '.')) || 0;

    if (!material || (material.currentStock || 0) < materialUsed) {
      toast.error('Estoque de material insuficiente para este projeto.');
      return;
    }

    setIsSaving(true);

    const project: Project = {
      id: crypto.randomUUID(),
      folderId: finalFolderId as string,
      name: partName,
      date: new Date().toISOString(),
      printerId: selectedPrinterId as string,
      materialId: selectedMaterialId as string,
      additionalItems: additionalItems.map(item => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) || 0 : item.price,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity.replace(',', '.')) || 0 : item.quantity
      })),
      printTimeHours: parseFloat(printHours.toString().replace(',', '.')) || 0,
      printTimeMinutes: parseFloat(printMinutes.toString().replace(',', '.')) || 0,
      modelWeight: materialUsed,
      failureRate: parseFloat(failureRate.toString().replace(',', '.')) || 0,
      laborTimeHours: parseFloat(laborHours.toString().replace(',', '.')) || 0,
      laborTimeMinutes: parseFloat(laborMinutes.toString().replace(',', '.')) || 0,
      laborHourlyRate: parseFloat(laborRate.toString().replace(',', '.')) || 0,
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
    } catch (error: any) {
      console.error(error);
      toast.error('Não foi possível salvar o projeto. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = [
    { name: 'Material', value: result.materialCost, color: '#FF5C00' },
    { name: 'Máquina', value: result.machineTotalCost, color: '#475569' },
    { name: 'Mão de Obra', value: result.laborCost, color: '#00E0FF' },
    { name: 'Adicionais', value: result.additionalCost, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">CARREGANDO CALCULADORA...</span>
    </div>
  );

  if (printers.length === 0 || materials.length === 0) {
    return (
      <Card variant="industrial" className="flex flex-col items-center justify-center h-96 text-center border-dashed">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-none mb-6">
          <AlertTriangle className="text-primary" size={32} />
        </div>
        <h2 className="text-xl font-technical font-bold mb-2 text-white uppercase tracking-wider">EQUIPAMENTO NÃO CONFIGURADO</h2>
        <p className="text-slate-500 max-w-sm mb-8 text-xs font-technical uppercase">Adicione impressoras e materiais antes de usar a calculadora.</p>
        <Button variant="primary">
          CONFIGURAR IMPRESSORAS E MATERIAIS
        </Button>
      </Card>
    );
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name} // ${(m.currentStock || 0).toFixed(0)}g_REM`,
    disabled: (m.currentStock || 0) === 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      <div className="lg:col-span-7 space-y-6">
        {/* Module: Project Identification */}
        <Card variant="industrial" className="relative">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 -mx-6 px-6">
            <Settings2 className="text-primary" size={16} />
            <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white">IDENTIFICAÇÃO DO PROJETO</span>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 border border-slate-800/50">
              {isCreatingFolder ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <Input
                      label="NOME DO NOVO PROJETO"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Digite o nome..."
                    />
                  </div>
                  <Button variant="secondary" onClick={() => setIsCreatingFolder(false)} className="mb-0 text-[10px]">CANCELAR</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">PASTA DO PROJETO</label>
                    <button onClick={() => setIsCreatingFolder(true)} className="text-[9px] font-technical font-bold text-primary hover:underline flex items-center gap-1">
                      <Plus size={10} /> CRIAR NOVO
                    </button>
                  </div>
                  <Select
                    label=""
                    options={[{ value: '', label: 'Selecione um projeto...' }, ...folders.map(f => ({ value: f.id, label: f.name }))]}
                    value={selectedFolderId}
                    onChange={(val) => setSelectedFolderId(val)}
                  />
                </div>
              )}
            </div>

            <Input 
                label="NOME DA PEÇA" 
                value={partName} 
                onChange={(e) => setPartName(e.target.value.toUpperCase())} 
                placeholder="PEÇA_ALPHA" 
                className="font-technical tracking-widest"
            />
          </div>
        </Card>

        {/* Module: Machine Parameters */}
        <Card variant="industrial">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 -mx-6 px-6">
            <Activity className="text-secondary" size={16} />
            <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white">CONFIG. DA MÁQUINA</span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="IMPRESSORA" options={printers.map(p => ({ value: p.id, label: p.name }))} value={selectedPrinterId} onChange={(val) => setSelectedPrinterId(val)} />
              <Select label="MATERIAL" options={materialOptions} value={selectedMaterialId} onChange={(val) => setSelectedMaterialId(val)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input label="HORAS" type="number" min="0" value={printHours} onChange={(e) => setPrintHours(e.target.value)} className="text-center text-primary" />
              <Input label="MINUTOS" type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(e.target.value)} className="text-center text-primary" />
              <Input label="PESO (g)" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} className="text-center text-secondary" />
              <Input label="FALHA (%)" type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(e.target.value)} className="text-center text-red-500" />
            </div>
          </div>
        </Card>

        {/* Module: Human & Business Parameters */}
        <Card variant="industrial">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 -mx-6 px-6">
            <Info className="text-slate-400" size={16} />
            <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white">MÃO DE OBRA E NEGÓCIO</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Input label="HORAS TRABALHO" type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
            <Input label="MINUTOS TRABALHO" type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(e.target.value)} />
            <Input label="VALOR POR HORA" type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
          </div>

          <div className="p-4 bg-slate-900/30 border border-slate-800">
            <div className="flex justify-between mb-4">
              <label className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">
                MARGEM DE LUCRO <span className="text-primary ml-2">[{markup}%]</span>
              </label>
            </div>
            <input 
                type="range" 
                min="0" 
                max="500" 
                step="5" 
                value={markup} 
                onChange={(e) => setMarkup(Number(e.target.value))} 
                className="w-full h-1 bg-slate-800 rounded-none appearance-none cursor-pointer accent-primary" 
            />
            <div className="flex justify-between text-[8px] font-technical text-slate-600 uppercase mt-2 tracking-tighter">
              <span>SEM MARGEM</span>
              <span>MARGEM MÉDIA</span>
              <span>MARGEM MÁXIMA</span>
            </div>
          </div>
        </Card>

        {/* Additional Items Section */}
        <Card variant="industrial">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4 -mx-6 px-6">
            <div className="flex items-center gap-3">
              <Package className="text-slate-400" size={16} />
              <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white">ITENS ADICIONAIS</span>
            </div>
            <Button
              onClick={handleAddAdditionalItem}
              variant="secondary"
              className="py-1 px-3 text-[9px]"
            >
              <Plus size={12} className="mr-1" /> ADICIONAR
            </Button>
          </div>

          {additionalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-dashed border-slate-800 text-slate-600">
              <span className="text-[10px] font-technical uppercase">Nenhum item adicional</span>
            </div>
          ) : (
            <div className="space-y-2">
              {additionalItems.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? "NOME DO ITEM" : undefined}
                      value={item.name}
                      placeholder="Nome do item"
                      onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label={index === 0 ? "PREÇO UN." : undefined}
                      type="number"
                      value={item.price}
                      onChange={(e) => updateAdditionalItem(item.id, 'price', e.target.value)}
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      label={index === 0 ? "QTD" : undefined}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateAdditionalItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalItem(item.id)}
                    className="p-2.5 text-slate-600 hover:text-red-500 transition-colors border border-transparent hover:border-red-900/50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-4 mt-6 border-t border-slate-800">
                <div className="bg-slate-900/80 px-4 py-2 border border-slate-800 flex items-center gap-6">
                  <span className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">SUBTOTAL ADICIONAIS</span>
                  <span className="font-technical font-bold text-white text-lg">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column: Results Cockpit */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-0" style={{ maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
        <div className="bg-slate-950 border border-slate-700 p-8 relative overflow-hidden text-white shadow-2xl">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary translate-x-2 -translate-y-2" />
          
          <div className="relative z-10">
            <h3 className="text-primary font-technical font-extrabold uppercase tracking-[0.3em] text-[10px] mb-6 flex items-center gap-2">
                <Activity size={12} /> RESULTADO EM TEMPO REAL
            </h3>
            
            <div className="text-6xl font-technical font-bold mb-8 tracking-tighter text-white tabular-nums">
              {settings.currencySymbol} {result.finalPrice.toFixed(2)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800">
                <span className="text-[9px] font-technical font-bold text-slate-500 uppercase tracking-widest block mb-1">CUSTO DE PRODUÇÃO</span>
                <span className="font-technical text-lg font-bold text-white tabular-nums">{settings.currencySymbol}{result.totalProductionCost.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800">
                <span className="text-[9px] font-technical font-bold text-secondary uppercase tracking-widest block mb-1">LUCRO LÍQUIDO</span>
                <span className="font-technical text-lg font-bold text-secondary tabular-nums">{settings.currencySymbol}{result.profit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <Card variant="industrial" className="flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 -mx-6 px-6">
            <BarChart3 className="text-primary" size={16} />
            <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white">DISTRIBUIÇÃO DE CUSTOS</span>
          </div>
          
          {chartData.length > 0 ? (() => {
            const total = chartData.reduce((sum, item) => sum + item.value, 0);
            return (
              <div className="space-y-3">
                {chartData.map(item => {
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-technical font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="font-technical font-bold text-white text-[10px] tabular-nums">
                          {settings.currencySymbol}{item.value.toFixed(2)}
                          <span className="text-slate-600 ml-1.5 text-[8px]">{pct.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/60 h-[3px]">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : (
            <div className="h-32 flex items-center justify-center text-slate-700">
              <span className="text-[10px] font-technical uppercase">Aguardando dados</span>
            </div>
          )}
        </Card>

        <Button
          onClick={saveProject}
          variant="primary"
          className="w-full py-3.5 text-sm font-technical !tracking-[0.4em]"
          disabled={isSaving || (materials.find(m => m.id === selectedMaterialId)?.currentStock || 0) < (parseFloat(weight) || 0)}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2.5" size={16} /> : <Save size={16} className="mr-2.5" />}
          <span>{isSaving ? 'SALVANDO...' : 'SALVAR PROJETO'}</span>
        </Button>
      </div>
    </div>
  );
};
