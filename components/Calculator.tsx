import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Save, AlertTriangle, Loader2, Plus, Trash2, Package, Activity, Info, BarChart3, Settings2 } from 'lucide-react';
import { Printer, Material, GlobalSettings, Project, CalculationResult, AdditionalItem, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { cn } from '../utils/cn';
import { calculateProjectCost } from '../utils/calculatorEngine';

interface UIAdditionalItem extends Omit<AdditionalItem, 'price' | 'quantity'> {
  price: string | number;
  quantity: string | number;
}

export const Calculator: React.FC = () => {
  const { t } = useTranslation();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasFetched = useRef(false);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);

  // Form State
  const [selectedFolderId, setSelectedFolderId] = useState<string | number>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(true);
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
  const [manualPrice, setManualPrice] = useState<string>('');
  const [isEditingPrice, setIsEditingPrice] = useState(false);

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

      const saved = localStorage.getItem('calculatorState');
      let parsed = null;
      if (saved) {
        try { parsed = JSON.parse(saved); } catch (e) {}
      }

      if (parsed) {
        if (parsed.printHours !== undefined) setPrintHours(parsed.printHours);
        if (parsed.printMinutes !== undefined) setPrintMinutes(parsed.printMinutes);
        if (parsed.weight !== undefined) setWeight(parsed.weight);
        if (parsed.failureRate !== undefined) setFailureRate(parsed.failureRate);
        if (parsed.laborHours !== undefined) setLaborHours(parsed.laborHours);
        if (parsed.laborMinutes !== undefined) setLaborMinutes(parsed.laborMinutes);
        if (parsed.laborRate !== undefined) setLaborRate(parsed.laborRate);
        if (parsed.markup !== undefined) setMarkup(parsed.markup);
        if (parsed.additionalItems) setAdditionalItems(parsed.additionalItems);
        if (parsed.partName !== undefined) setPartName(parsed.partName);
        setSelectedFolderId('');

        if (parsed.selectedPrinterId && p.some(pr => pr.id === parsed.selectedPrinterId)) {
          setSelectedPrinterId(parsed.selectedPrinterId);
        } else if (p.length > 0) setSelectedPrinterId(p[0].id);

        if (parsed.selectedMaterialId && m.some(ma => ma.id === parsed.selectedMaterialId)) {
          setSelectedMaterialId(parsed.selectedMaterialId);
        } else {
          const firstInStockMaterial = m.find(mat => (mat.currentStock || 0) > 0);
          if (firstInStockMaterial) setSelectedMaterialId(firstInStockMaterial.id);
          else if (m.length > 0) setSelectedMaterialId(m[0].id);
        }
      } else {
        setSelectedFolderId('');
        if (p.length > 0) setSelectedPrinterId(p[0].id);

        const firstInStockMaterial = m.find(mat => (mat.currentStock || 0) > 0);
        if (firstInStockMaterial) {
          setSelectedMaterialId(firstInStockMaterial.id);
        } else if (m.length > 0) {
          setSelectedMaterialId(m[0].id);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('calculatorState', JSON.stringify({
        printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup, additionalItems, partName, selectedFolderId, selectedPrinterId, selectedMaterialId
      }));
    }
  }, [printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup, additionalItems, partName, selectedFolderId, selectedPrinterId, selectedMaterialId, loading]);

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

    return calculateProjectCost({
      printer,
      material,
      settings,
      printHours,
      printMinutes,
      weight,
      failureRate,
      laborHours,
      laborMinutes,
      laborRate,
      markup,
      additionalItems: additionalItems as AdditionalItem[],
    });
  }, [printers, materials, settings, selectedPrinterId, selectedMaterialId, printHours, printMinutes, weight, failureRate, laborHours, laborMinutes, laborRate, markup, additionalItems]);

  const saveProject = async () => {
    if (!partName.trim()) {
      toast.error(t('toast_part_name_required'));
      return;
    }

    let finalFolderId = selectedFolderId;

    if (isCreatingFolder) {
      if (!newFolderName.trim()) {
        toast.error(t('toast_folder_name_required'));
        return;
      }
      try {
        const newFolder = await StorageService.createFolder(newFolderName);
        setFolders([newFolder, ...folders]);
        finalFolderId = newFolder.id;
        setIsCreatingFolder(false);
        setNewFolderName('');
      } catch (error) {
        toast.error(t('toast_create_folder_error'));
        return;
      }
    } else if (!finalFolderId) {
      toast.error(t('toast_select_folder_required'));
      return;
    }

    const material = materials.find(m => m.id === selectedMaterialId);
    const materialUsed = parseFloat(weight.toString().replace(',', '.')) || 0;

    if (!material || (material.currentStock || 0) < materialUsed) {
      toast.error(t('toast_insufficient_stock'));
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

      toast.success(t('toast_project_saved'));
    } catch (error: any) {
      console.error(error);
      toast.error(t('toast_save_project_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = [
    { name: t('material_chart'), value: result.materialCost, color: 'var(--color-primary)' },
    { name: t('machine_chart'), value: result.machineTotalCost, color: 'var(--color-muted)' },
    { name: t('labor_chart'), value: result.laborCost, color: 'var(--color-green)' },
    { name: t('additional_chart'), value: result.additionalCost, color: 'var(--color-yellow)' },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_calculator')}</span>
    </div>
  );

  if (printers.length === 0 || materials.length === 0) {
    return (
      <Card variant="default" className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-hairline">
        <div className="w-12 h-12 bg-primary-soft text-primary flex items-center justify-center rounded-2xl mb-4">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-sans font-semibold mb-2 text-ink">{t('equipment_not_configured')}</h2>
        <p className="text-muted max-w-sm mb-6 text-xs font-sans">{t('add_printers_materials_warning')}</p>
        <Button variant="primary">
          {t('configure_printers_materials')}
        </Button>
      </Card>
    );
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name} // ${t('g_rem_suffix', { count: Number((m.currentStock || 0).toFixed(0)) })}`,
    disabled: (m.currentStock || 0) === 0,
    color: m.color || undefined,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* Coluna da Esquerda: Inputs */}
      <div className="lg:col-span-7 space-y-6">
        {/* Module: Project Identification */}
        <Card variant="default" className="relative border border-hairline/75 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-hairline pb-4">
            <Settings2 className="text-primary" size={16} />
            <span className="font-sans font-semibold text-sm text-ink">{t('project_identification')}</span>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-soft p-4 border border-hairline rounded-2xl">
              {isCreatingFolder ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <Input
                      label={t('new_project_folder_label')}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder={t('new_folder_placeholder')}
                    />
                  </div>
                  <Button variant="secondary" onClick={() => setIsCreatingFolder(false)} className="mb-0 text-xs py-2 h-10">{t('cancel')}</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-sans font-medium text-muted">{t('project_folder')}</label>
                    <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-sans font-medium text-primary hover:underline flex items-center gap-1">
                      <Plus size={12} /> {t('create_new_label')}
                    </button>
                  </div>
                  <Select
                    label=""
                    options={[{ value: '', label: t('select_folder_placeholder') }, ...folders.map(f => ({ value: f.id, label: f.name }))]}
                    value={selectedFolderId}
                    onChange={(val) => setSelectedFolderId(val)}
                  />
                </div>
              )}
            </div>

            <Input 
                label={t('part_name_label')} 
                value={partName} 
                onChange={(e) => setPartName(e.target.value)} 
                placeholder={t('part_name_placeholder')} 
            />
          </div>
        </Card>

        {/* Module: Machine Parameters */}
        <Card variant="default" className="border border-hairline/75 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-hairline pb-4">
            <Activity className="text-green" size={16} />
            <span className="font-sans font-semibold text-sm text-ink">{t('machine_config')}</span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label={t('printer_label')} options={printers.map(p => ({ value: p.id, label: p.name }))} value={selectedPrinterId} onChange={(val) => setSelectedPrinterId(val)} />
              <Select label={t('material_label')} options={materialOptions} value={selectedMaterialId} onChange={(val) => setSelectedMaterialId(val)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label={t('hours_label')} type="number" min="0" value={printHours} onChange={(e) => setPrintHours(e.target.value)} className="text-center" />
              <Input label={t('minutes_label')} type="number" min="0" max="59" value={printMinutes} onChange={(e) => setPrintMinutes(e.target.value)} className="text-center" />
              <Input label={t('weight_g_label')} type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} className="text-center" />
              <Input label={t('failure_pct_label')} type="number" min="0" value={failureRate} onChange={(e) => setFailureRate(e.target.value)} className="text-center" />
            </div>
          </div>
        </Card>

        {/* Module: Human & Business Parameters */}
        <Card variant="default" className="border border-hairline/75 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-hairline pb-4">
            <Info className="text-muted" size={16} />
            <span className="font-sans font-semibold text-sm text-ink">{t('labor_and_business')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label={t('labor_hours_label')} type="number" min="0" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
            <Input label={t('labor_minutes_label')} type="number" min="0" max="59" value={laborMinutes} onChange={(e) => setLaborMinutes(e.target.value)} />
            <Input label={t('labor_rate_label')} type="number" min="0" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
          </div>
        </Card>

        {/* Additional Items Section */}
        <Card variant="default" className="border border-hairline/75 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-hairline pb-4">
            <div className="flex items-center gap-3">
              <Package className="text-muted" size={16} />
              <span className="font-sans font-semibold text-sm text-ink">{t('additional_items')}</span>
            </div>
            <Button
              onClick={handleAddAdditionalItem}
              variant="secondary"
              className="py-1 px-3 text-xs h-8"
            >
              <Plus size={12} className="mr-1" /> {t('add_action')}
            </Button>
          </div>

          {additionalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-soft border border-dashed border-hairline text-muted rounded-2xl">
              <span className="text-xs font-sans italic">{t('no_additional_items')}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {additionalItems.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? t('item_name_label') : undefined}
                      value={item.name}
                      placeholder={t('item_name_placeholder')}
                      onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label={index === 0 ? t('price_unit_label') : undefined}
                      type="number"
                      value={item.price}
                      onChange={(e) => updateAdditionalItem(item.id, 'price', e.target.value)}
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      label={index === 0 ? t('qty_label') : undefined}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateAdditionalItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalItem(item.id)}
                    className="p-2.5 text-muted hover:text-red transition-colors border border-transparent rounded-full hover:bg-surface-soft"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex justify-end pt-4 mt-6 border-t border-hairline">
                <div className="bg-surface-soft px-4 py-2 border border-hairline rounded-xl flex items-center gap-6">
                  <span className="text-xs font-sans font-semibold text-muted uppercase tracking-wider">{t('additional_subtotal')}</span>
                  <span className="font-sans font-bold text-ink text-base">{settings.currencySymbol} {result.additionalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Coluna da Direita: Resultados (Cockpit Estático) */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 z-20 flex flex-col gap-4">
        <div className="bg-surface-card/65 backdrop-blur-lg border border-hairline/80 shadow-xl rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4 cockpit-card">
          
          {/* Resultados Comercial / Topo */}
          <div className="flex justify-between items-start pb-4 border-b border-hairline/60">
            <div>
              <h3 className="text-muted font-sans font-medium uppercase tracking-wider text-[10px] mb-1">
                {t('realtime_result')}
              </h3>
              <div className="flex items-center text-3xl font-sans font-extrabold tracking-tight text-ink tabular-nums">
                <span className="mr-1.5 text-primary cockpit-price-currency">{settings.currencySymbol}</span>
                <input 
                  type="text"
                  value={isEditingPrice ? manualPrice : result.finalPrice.toFixed(2)}
                  onFocus={() => {
                    setManualPrice(result.finalPrice.toFixed(2));
                    setIsEditingPrice(true);
                  }}
                  onBlur={() => setIsEditingPrice(false)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9.,]*$/.test(val)) {
                      setManualPrice(val);
                      const numVal = parseFloat(val.replace(',', '.'));
                      if (!isNaN(numVal) && result.totalProductionCost > 0) {
                        const newMarkup = ((numVal / result.totalProductionCost) - 1) * 100;
                        setMarkup(Number(newMarkup.toFixed(2)));
                      }
                    }
                  }}
                  className="bg-transparent border-b border-dashed border-hairline hover:border-muted focus:border-primary outline-none w-32 text-ink transition-colors font-extrabold font-sans cockpit-price"
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block mb-1">
                {t('net_profit')}
              </span>
              <span className={cn(
                "inline-flex items-center px-3 py-1 text-sm font-sans font-bold rounded-full border shadow-sm shrink-0",
                result.profit > 0 
                  ? "border-green/20 text-green bg-green/5" 
                  : "border-red/20 text-red bg-red/5"
              )}>
                {settings.currencySymbol}{result.profit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Slider de Margem Integrado */}
          <div className="p-4 bg-surface-soft/50 border border-hairline/65 rounded-xl cockpit-slider-container">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-sans font-semibold text-muted flex items-center gap-1.5">
                <Info size={12} className="text-primary" />
                {t('profit_margin_label')}
              </span>
              <span className="text-xs font-sans font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-lg">
                {Number(markup).toLocaleString(undefined, { maximumFractionDigits: 1 })}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="500" 
              step="any" 
              value={markup} 
              onChange={(e) => setMarkup(Number(e.target.value))} 
              className="w-full h-1.5 bg-surface-strong rounded-full appearance-none cursor-pointer accent-primary" 
            />
            <div className="flex justify-between text-[9px] font-sans text-muted mt-2 uppercase tracking-wider font-semibold">
              <span>{t('no_margin')}</span>
              <span>{t('average_margin')}</span>
              <span>{t('max_margin')}</span>
            </div>
          </div>

          {/* Resumo de Custo Geral */}
          <div className="p-4 bg-surface-soft/30 border border-hairline/45 rounded-xl flex items-center justify-between cockpit-cost-container">
            <span className="text-xs font-sans font-bold text-muted uppercase tracking-wider">{t('production_cost')}</span>
            <span className="font-sans text-xl font-bold text-ink tabular-nums">{settings.currencySymbol}{result.totalProductionCost.toFixed(2)}</span>
          </div>

          {/* Distribuição de Custos (Grid 2x2) */}
          <div className="space-y-4">
            <span className="text-xs font-sans font-semibold text-muted uppercase tracking-wider block">{t('cost_distribution')}</span>
            <div className="grid grid-cols-2 gap-3">
              {/* Material */}
              <div className="bg-surface-soft/40 border border-hairline/60 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden cockpit-grid-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-sans font-semibold text-muted flex items-center gap-1 cockpit-grid-title">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t('material_chart')}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-primary">
                    {result.totalProductionCost > 0 ? ((result.materialCost / result.totalProductionCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div>
                  <span className="font-sans text-sm font-bold text-ink block cockpit-grid-value">{settings.currencySymbol}{result.materialCost.toFixed(2)}</span>
                  <div className="w-full bg-surface-strong h-1.5 rounded-full overflow-hidden mt-1.5 cockpit-grid-progress">
                    <div 
                      className="h-full rounded-full bg-primary transition-all duration-500" 
                      style={{ width: `${result.totalProductionCost > 0 ? (result.materialCost / result.totalProductionCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Máquina */}
              <div className="bg-surface-soft/40 border border-hairline/60 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden cockpit-grid-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-sans font-semibold text-muted flex items-center gap-1 cockpit-grid-title">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                    {t('machine_chart')}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-muted">
                    {result.totalProductionCost > 0 ? ((result.machineTotalCost / result.totalProductionCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div>
                  <span className="font-sans text-sm font-bold text-ink block cockpit-grid-value">{settings.currencySymbol}{result.machineTotalCost.toFixed(2)}</span>
                  <div className="w-full bg-surface-strong h-1.5 rounded-full overflow-hidden mt-1.5 cockpit-grid-progress">
                    <div 
                      className="h-full rounded-full bg-muted transition-all duration-500" 
                      style={{ width: `${result.totalProductionCost > 0 ? (result.machineTotalCost / result.totalProductionCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mão de Obra */}
              <div className="bg-surface-soft/40 border border-hairline/60 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden cockpit-grid-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-sans font-semibold text-muted flex items-center gap-1 cockpit-grid-title">
                    <span className="w-1.5 h-1.5 rounded-full bg-green" />
                    {t('labor_chart')}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-green">
                    {result.totalProductionCost > 0 ? ((result.laborCost / result.totalProductionCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div>
                  <span className="font-sans text-sm font-bold text-ink block cockpit-grid-value">{settings.currencySymbol}{result.laborCost.toFixed(2)}</span>
                  <div className="w-full bg-surface-strong h-1.5 rounded-full overflow-hidden mt-1.5 cockpit-grid-progress">
                    <div 
                      className="h-full rounded-full bg-green transition-all duration-500" 
                      style={{ width: `${result.totalProductionCost > 0 ? (result.laborCost / result.totalProductionCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Extras */}
              <div className="bg-surface-soft/40 border border-hairline/60 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden cockpit-grid-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-sans font-semibold text-muted flex items-center gap-1 cockpit-grid-title">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
                    {t('additional_chart')}
                  </span>
                  <span className="text-[9px] font-sans font-bold text-yellow">
                    {result.totalProductionCost > 0 ? ((result.additionalCost / result.totalProductionCost) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div>
                  <span className="font-sans text-sm font-bold text-ink block cockpit-grid-value">{settings.currencySymbol}{result.additionalCost.toFixed(2)}</span>
                  <div className="w-full bg-surface-strong h-1.5 rounded-full overflow-hidden mt-1.5 cockpit-grid-progress">
                    <div 
                      className="h-full rounded-full bg-yellow transition-all duration-500" 
                      style={{ width: `${result.totalProductionCost > 0 ? (result.additionalCost / result.totalProductionCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Ação Salvar */}
          <div className="pt-3 border-t border-hairline/60 w-full shrink-0">
            <Button
              onClick={saveProject}
              variant="primary"
              className="w-full py-3 h-12 text-sm font-sans font-semibold transition-all duration-300 shadow-md hover:shadow-lg active:scale-98 cockpit-btn"
              disabled={isSaving || (materials.find(m => m.id === selectedMaterialId)?.currentStock || 0) < (parseFloat(weight) || 0)}
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
              <span>{isSaving ? t('saving') : t('save_project')}</span>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};
