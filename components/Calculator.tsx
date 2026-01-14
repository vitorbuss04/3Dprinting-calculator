import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, Calculator as CalcIcon, AlertTriangle, Loader2, Plus, Trash2, Package } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult, AdditionalItem, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';



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
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [partName, setPartName] = useState('Peça 01'); // Was projectName
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

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

    // Calculate additional items cost
    // Calculate additional items cost
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
      folderId: finalFolderId,
      name: partName,
      date: new Date().toISOString(),
      printerId: selectedPrinterId,
      materialId: selectedMaterialId,
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
          <div className="mb-4">
            {isCreatingFolder ? (
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <Input
                    label="Nome do Novo Projeto"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ex: Armadura Homem de Ferro"
                    autoFocus
                    containerClassName="mb-0"
                  />
                </div>
                <Button variant="ghost" onClick={() => setIsCreatingFolder(false)} className="mb-0">Cancelar</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Projeto / Pasta</label>
                  <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-bold text-blue-600 hover:underline">+ Novo Projeto</button>
                </div>
                <div className="relative">
                  <Select
                    label="" // Label handled above for custom layout
                    options={[{ value: '', label: 'Selecione um projeto...' }, ...folders.map(f => ({ value: f.id, label: f.name }))]}
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="mb-0"
                  />
                </div>
              </div>
            )}
          </div>

          <Input label="Nome da Peça / Impressão" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Ex: Capacete - Parte Superior" />
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

        <Card title="Valores de Negócio">
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

        {/* Additional Items Section */}
        <Card title="Outros Materiais / Insumos" className="relative group">
          <div className="absolute top-6 right-6">
            <button
              onClick={handleAddAdditionalItem}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          {additionalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
              <Package size={24} className="mb-2 opacity-50" />
              <p className="text-xs font-medium">Nenhum item adicional. Adicione parafusos, eletrônicos, embalagens, etc.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {additionalItems.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? "Nome do Item" : ""}
                      value={item.name}
                      placeholder="Ex: Parafuso M3"
                      onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                      className="mb-0"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label={index === 0 ? "Preço Unit." : ""}
                      type="number"
                      min="0"
                      value={item.price}
                      placeholder="0.00"
                      onChange={(e) => updateAdditionalItem(item.id, 'price', e.target.value)}
                      className="mb-0"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      label={index === 0 ? "Qtd" : ""}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateAdditionalItem(item.id, 'quantity', e.target.value)}
                      className="mb-0"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalItem(item.id)}
                    className="mb-4 p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mr-3 pt-1">Total Adicionais</p>
                <p className="font-mono font-bold text-gray-900">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="sticky top-6 space-y-6">
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
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div> Insumos (3D)</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.materialCost.toFixed(2)}</span></div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></div> Operacional Máquina</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.machineTotalCost.toFixed(2)}</span></div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div> Mão de Obra</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.laborCost.toFixed(2)}</span></div>
              {result.additionalCost > 0 && <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors group"><span className="flex items-center gap-3 text-xs font-bold text-gray-600 tracking-tight"><div className="w-2 h-2 rounded-full bg-violet-500 group-hover:scale-125 transition-transform"></div> Outros Materiais</span><span className="font-mono font-bold text-gray-900 text-sm">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</span></div>}
            </div>
          </Card>

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
    </div>
  );
};
