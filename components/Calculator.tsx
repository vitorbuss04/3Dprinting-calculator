import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, Calculator as CalcIcon, AlertTriangle, Loader2, Plus, Trash2, Package, RefreshCw } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult, AdditionalItem, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
  const [partName, setPartName] = useState('Peça 01');
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

    const numPrintHours = parseFloat(printHours.replace(',', '.')) || 0;
    const numPrintMinutes = parseFloat(printMinutes.replace(',', '.')) || 0;
    const numWeight = parseFloat(weight.replace(',', '.')) || 0;
    const numFailureRate = parseFloat(failureRate.replace(',', '.')) || 0;
    const numLaborHours = parseFloat(laborHours.replace(',', '.')) || 0;
    const numLaborMinutes = parseFloat(laborMinutes.replace(',', '.')) || 0;
    const numLaborRate = parseFloat(laborRate.replace(',', '.')) || 0;

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
    const materialUsed = parseFloat(weight.replace(',', '.')) || 0;

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
      printTimeHours: parseFloat(printHours.replace(',', '.')) || 0,
      printTimeMinutes: parseFloat(printMinutes.replace(',', '.')) || 0,
      modelWeight: materialUsed,
      failureRate: parseFloat(failureRate.replace(',', '.')) || 0,
      laborTimeHours: parseFloat(laborHours.replace(',', '.')) || 0,
      laborTimeMinutes: parseFloat(laborMinutes.replace(',', '.')) || 0,
      laborHourlyRate: parseFloat(laborRate.replace(',', '.')) || 0,
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
    { name: 'Material', value: result.materialCost, color: '#10b981' },
    { name: 'Máquina', value: result.machineTotalCost, color: '#f59e0b' },
    { name: 'Mão de Obra', value: result.laborCost, color: '#3b82f6' },
    { name: 'Outros', value: result.additionalCost, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  if (printers.length === 0 || materials.length === 0) {
    return (
      <Card variant="default" className="flex flex-col items-center justify-center h-96 text-center border-dashed border-2 bg-gray-50/50 dark:bg-white/5 dark:border-white/10">
        <div className="p-4 bg-orange-100 rounded-full mb-4 animate-bounce dark:bg-orange-900/20">
          <AlertTriangle className="text-orange-500 dark:text-orange-400" size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Setup Necessário</h2>
        <p className="text-gray-500 max-w-sm mb-6 dark:text-gray-400">Para começar a calcular, adicione suas impressoras e materiais.</p>
        <Button variant="primary" onClick={() => { }} className="shadow-orange-200 bg-orange-500 hover:bg-orange-600 dark:shadow-none">
          Ir para Meus Ativos (Use o Menu)
        </Button>
      </Card>
    );
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name} (${m.type}) - ${(m.currentStock || 0).toFixed(0)}g restantes`,
    disabled: (m.currentStock || 0) === 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
      <div className="lg:col-span-7 space-y-6">
        <Card title="" variant="glass" className="relative z-20">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"><CalcIcon size={20} /></div>
            <h3 className="font-bold text-gray-800 text-lg dark:text-gray-100">Detalhes do Projeto</h3>
          </div>

          <div className="mb-6 bg-white/50 p-4 rounded-xl border border-white/40 shadow-sm dark:bg-white/5 dark:border-white/5">
            {isCreatingFolder ? (
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <Input
                    label="Nome do Novo Projeto"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ex: Armadura Homem de Ferro"
                    autoFocus
                    className="bg-white dark:bg-black/20"
                  />
                </div>
                <Button variant="ghost" onClick={() => setIsCreatingFolder(false)} className="mb-0 bg-white hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300">Cancelar</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 dark:text-gray-400">Projeto / Pasta</label>
                  <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 dark:text-blue-400 dark:hover:text-blue-300">
                    <Plus size={12} /> Novo Projeto
                  </button>
                </div>
                <Select
                  label=""
                  options={[{ value: '', label: 'Selecione um projeto...' }, ...folders.map(f => ({ value: f.id, label: f.name }))]}
                  value={selectedFolderId}
                  onChange={(val) => setSelectedFolderId(val)}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-5">
            <Input label="Nome da Peça / Impressão" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Ex: Capacete - Parte Superior" className="font-medium" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Impressora" options={printers.map(p => ({ value: p.id, label: p.name }))} value={selectedPrinterId} onChange={(val) => setSelectedPrinterId(val)} />
              <Select label="Material" options={materialOptions} value={selectedMaterialId} onChange={(val) => setSelectedMaterialId(val)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 dark:bg-white/5 dark:border-white/5">
              <Input label="Tempo (Hrs)" type="number" min="0" value={printHours} onChange={(e) => setPrintHours(e.target.value)} className="bg-white text-center font-bold text-blue-900 dark:bg-black/20 dark:text-blue-300" />
              <Input label="Tempo (Min)" type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(e.target.value)} className="bg-white text-center font-bold text-blue-900 dark:bg-black/20 dark:text-blue-300" />
              <Input label="Peso (g)" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-white text-center font-bold text-emerald-700 dark:bg-black/20 dark:text-emerald-400" />
              <Input label="Falha (%)" type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(e.target.value)} className="bg-white text-center font-bold text-red-700 dark:bg-black/20 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"><AlertTriangle size={20} /></div> {/* Using AlertTriangle as generic icon, maybe change */}
            <h3 className="font-bold text-gray-800 text-lg dark:text-gray-100">Valores de Negócio</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Input label="Mão de Obra (Hrs)" type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
            <Input label="Mão de Obra (Min)" type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(e.target.value)} />
            <Input label="Valor Hora" type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} icon={<span className="text-gray-500 font-bold text-xs dark:text-gray-400">{settings.currencySymbol}</span>} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
            <div className="flex justify-between mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 dark:text-gray-400">
                Margem de Lucro (Markup)
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] dark:bg-blue-500/20 dark:text-blue-300">{markup}%</span>
              </label>
            </div>
            <input type="range" min="0" max="500" step="5" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-600 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:from-blue-900 dark:to-blue-500" />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2">
              <span>0% (Custo)</span>
              <span>500% (5x)</span>
            </div>
          </div>
        </Card>

        {/* Additional Items Section */}
        <Card className="relative group overflow-hidden" variant="neumorphic">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"><Package size={20} /></div>
              <h3 className="font-bold text-gray-800 text-lg dark:text-gray-100">Outros Materiais</h3>
            </div>
            <Button
              onClick={handleAddAdditionalItem}
              size="sm"
              variant="secondary"
              className="shadow-none bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30 dark:hover:text-violet-200"
              leftIcon={<Plus size={16} />}
            >
              Adicionar
            </Button>
          </div>

          {additionalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-500">
              <Package size={32} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum item adicional.</p>
              <p className="text-xs opacity-70">Adicione parafusos, eletrônicos, embalagens, etc.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {additionalItems.map((item, index) => (
                <div key={item.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300 p-3 bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-white/5 dark:border-white/10">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? "Nome do Item" : undefined}
                      value={item.name}
                      placeholder="Ex: Parafuso M3"
                      onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                      className="bg-gray-50 border-transparent focus:bg-white dark:bg-black/20 dark:focus:bg-black/40"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label={index === 0 ? "Preço Unit." : undefined}
                      type="number"
                      min="0"
                      value={item.price}
                      placeholder="0.00"
                      onChange={(e) => updateAdditionalItem(item.id, 'price', e.target.value)}
                      className="bg-gray-50 border-transparent focus:bg-white dark:bg-black/20 dark:focus:bg-black/40"
                      icon={<span className="text-[10px] text-gray-500 dark:text-gray-400">{settings.currencySymbol}</span>}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      label={index === 0 ? "Qtd" : undefined}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateAdditionalItem(item.id, 'quantity', e.target.value)}
                      className="bg-gray-50 border-transparent focus:bg-white dark:bg-black/20 dark:focus:bg-black/40"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalItem(item.id)}
                    className={cn(
                      "p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors dark:hover:bg-red-900/20",
                      index === 0 ? "mt-6" : "mt-0"
                    )}
                    title="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t border-gray-100 mt-4 dark:border-white/10">
                <div className="bg-violet-50 px-4 py-2 rounded-xl flex items-center gap-3 dark:bg-violet-500/10">
                  <p className="text-xs text-violet-600 font-bold uppercase tracking-wider dark:text-violet-400">Total Adicionais</p>
                  <p className="font-mono font-bold text-violet-900 text-lg dark:text-violet-300">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-white transition-all hover:shadow-blue-900/20 group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

          <div className="relative z-10">
            <h3 className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-1">Preço Sugerido</h3>
            <div className="text-5xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {settings.currencySymbol} {result.finalPrice.toFixed(2)}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo Produção</span>
                <span className="font-mono text-xl font-bold">{settings.currencySymbol} {result.totalProductionCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Lucro Líquido</span>
                <span className="font-mono text-xl font-bold text-emerald-400">{settings.currencySymbol} {result.profit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <Card title="Composição de Custos" className="flex flex-col" variant="neumorphic">
          {chartData.length > 0 ? (
            <div className="h-56 -ml-4">
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
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(21, 25, 33, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)', fontSize: '12px', fontWeight: 'bold', color: '#F9FAFB' }}
                    itemStyle={{ color: '#F9FAFB' }}
                    formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300">
              <span className="text-sm font-medium">Aguardando dados...</span>
            </div>
          )}

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5"><span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Insumos</span><span className="font-mono font-bold text-gray-900 text-xs dark:text-gray-200">{settings.currencySymbol} {result.materialCost.toFixed(2)}</span></div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5"><span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Máquina</span><span className="font-mono font-bold text-gray-900 text-xs dark:text-gray-200">{settings.currencySymbol} {result.machineTotalCost.toFixed(2)}</span></div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5"><span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Mão de Obra</span><span className="font-mono font-bold text-gray-900 text-xs dark:text-gray-200">{settings.currencySymbol} {result.laborCost.toFixed(2)}</span></div>
            {result.additionalCost > 0 && <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5"><span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"><div className="w-2 h-2 rounded-full bg-violet-500"></div> Adicionais</span><span className="font-mono font-bold text-gray-900 text-xs dark:text-gray-200">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</span></div>}
          </div>
        </Card>

        <div className="flex-1 flex min-h-[100px]">
          <Button
            onClick={saveProject}
            variant="primary"
            className="w-full h-full text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
            disabled={isSaving || (materials.find(m => m.id === selectedMaterialId)?.currentStock || 0) < (parseFloat(weight) || 0)}
          >
            <div className="flex flex-col items-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
              <span className="font-bold">{isSaving ? 'Salvando...' : 'Salvar Projeto'}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
