import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Check, X, Settings, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { cn } from '../utils/cn';
import { useNotifications } from './NotificationContext';

interface AssetsManagerProps {
  initialTab?: 'printers' | 'materials' | 'settings';
}

export const AssetsManager: React.FC<AssetsManagerProps> = ({ initialTab = 'printers' }) => {
  const { t } = useTranslation();
  const { refreshNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0.0, currencySymbol: 'R$' });

  const [originalPrinters, setOriginalPrinters] = useState<Printer[]>([]);
  const [originalMaterials, setOriginalMaterials] = useState<Material[]>([]);
  const [originalSettings, setOriginalSettings] = useState<GlobalSettings>({ electricityCost: 0.0, currencySymbol: 'R$' });

  const [idsToDelete, setIdsToDelete] = useState<{ printers: string[], materials: string[] }>({ printers: [], materials: [] });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<{ id: string; type: 'printer' | 'material' } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      setLoading(true);
      const [p, m, s] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings()
      ]);
      setPrinters(p);
      setOriginalPrinters(p);
      setMaterials(m);
      setOriginalMaterials(m);
      setSettings(s);
      setOriginalSettings(s);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const printersChanged = JSON.stringify(printers) !== JSON.stringify(originalPrinters);
    const materialsChanged = JSON.stringify(materials) !== JSON.stringify(originalMaterials);
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    const deletionsExist = idsToDelete.printers.length > 0 || idsToDelete.materials.length > 0;
    setIsDirty(printersChanged || materialsChanged || settingsChanged || deletionsExist);
  }, [printers, materials, settings, originalPrinters, originalMaterials, originalSettings, idsToDelete]);


  const saveChanges = async () => {
    setIsSaving(true);
    for (const p of printers) {
      if (!p.name.trim() || p.acquisitionCost <= 0 || p.lifespanHours <= 0 || p.powerConsumption <= 0) {
        toast.error(t('invalid_printer_values')); setIsSaving(false); return;
      }
    }
    for (const m of materials) {
      if (!m.name.trim() || m.spoolPrice <= 0 || m.spoolWeight <= 0 || m.currentStock < 0) {
        toast.error(t('invalid_material_values')); setIsSaving(false); return;
      }
    }

    const promises: Promise<any>[] = [];
    idsToDelete.printers.forEach(id => promises.push(StorageService.deletePrinter(id)));
    idsToDelete.materials.forEach(id => promises.push(StorageService.deleteMaterial(id)));

    const originalPrinterMap = new Map(originalPrinters.map(p => [p.id, p]));
    printers.forEach(p => {
      const original = originalPrinterMap.get(p.id);
      if (!original) { promises.push(StorageService.addPrinter(p)); }
      else if (JSON.stringify(p) !== JSON.stringify(original)) { promises.push(StorageService.updatePrinter(p)); }
    });

    const originalMaterialMap = new Map(originalMaterials.map(m => [m.id, m]));
    materials.forEach(m => {
      const original = originalMaterialMap.get(m.id);
      if (!original) { promises.push(StorageService.addMaterial(m)); }
      else if (JSON.stringify(m) !== JSON.stringify(original)) { promises.push(StorageService.updateMaterial(m)); }
    });

    if (JSON.stringify(settings) !== JSON.stringify(originalSettings)) {
      promises.push(StorageService.saveSettings(settings));
    }

    const toastPromise = toast.promise(Promise.all(promises), {
      loading: t('saving_changes_loading'),
      success: t('saving_changes_success'),
      error: t('saving_changes_error')
    });

    try {
      await toastPromise;
      setOriginalPrinters(printers);
      setOriginalMaterials(materials);
      setOriginalSettings(settings);
      setIdsToDelete({ printers: [], materials: [] });
      setIsDirty(false);
      refreshNotifications();
    } catch (e) {
      toast.error(t('sync_data_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const addAsset = (type: 'printer' | 'material') => {
    if (type === 'printer') {
      const newPrinter: Printer = { id: crypto.randomUUID(), name: t('new_printer_default_name'), acquisitionCost: 2000, lifespanHours: 3000, powerConsumption: 300, maintenanceCostPerHour: 2 };
      setPrinters(prev => [...prev, newPrinter]);
    } else {
      const newMaterial: Material = { id: crypto.randomUUID(), type: MaterialType.PLA, name: t('generic_pla_default_name'), color: '#000000', spoolPrice: 120, spoolWeight: 1000, currentStock: 1000 };
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleAssetUpdate = (id: string | null, type: 'printer' | 'material' | 'settings', field: string, value: string | number) => {
    const isNumeric = ['acquisitionCost', 'lifespanHours', 'powerConsumption', 'maintenanceCostPerHour', 'spoolPrice', 'spoolWeight', 'currentStock', 'electricityCost'].includes(field as string);
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (type === 'printer') {
      setPrinters(prev => prev.map(p => p.id === id ? { ...p, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value } : p));
    } else if (type === 'material') {
      setMaterials(prev => prev.map(m => {
        if (m.id === id) {
          const updated = { ...m, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value };
          if (field === 'spoolWeight' && !isNaN(numericValue) && numericValue > 0) updated.currentStock = numericValue;
          return updated;
        }
        return m;
      }));
    } else if (type === 'settings') {
      setSettings(prev => ({ ...prev, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value }));
    }
  };

  const handleDeleteClick = (id: string, type: 'printer' | 'material') => { setDeletingAsset({ id, type }); };

  const confirmDelete = () => {
    if (!deletingAsset) return;
    const { id, type } = deletingAsset;
    if (type === 'printer') {
      setPrinters(prev => prev.filter(p => p.id !== id));
      if (originalPrinters.some(p => p.id === id)) setIdsToDelete(prev => ({ ...prev, printers: [...prev.printers, id] }));
    } else {
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (originalMaterials.some(m => m.id === id)) setIdsToDelete(prev => ({ ...prev, materials: [...prev.materials, id] }));
    }
    setDeletingAsset(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveChanges();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">{t('loading_dots')}</span>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-3 px-6 py-4 transition-all duration-150 border-b-2 font-technical font-bold text-xs uppercase tracking-widest",
        activeTab === id
          ? "border-primary text-white bg-slate-900/50"
          : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
      )}
    >
      <Icon size={14} className={activeTab === id ? "text-primary" : "text-slate-600"} /> {label}
    </button>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-center md:justify-start border-b border-slate-800 bg-slate-950/50 -mx-6 px-6">
        <TabButton id="printers" label={t('printers_tab')} icon={PrinterIcon} />
        <TabButton id="materials" label={t('materials_tab')} icon={Package} />
        <TabButton id="settings" label={t('settings_tab')} icon={Settings} />
      </div>

      {deletingAsset && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <Card variant="industrial" className="max-w-sm w-full p-8 border-red-500/50 bg-slate-950">
            <div className="flex items-center justify-center w-12 h-12 border border-red-500/30 text-red-500 mx-auto mb-6">
              <Trash2 size={24} />
            </div>
            <h3 className="font-technical font-bold text-white text-lg text-center uppercase tracking-widest">{t('confirm_deletion')}</h3>
            <p className="text-center text-slate-500 text-[10px] font-technical uppercase mt-4 mb-8">{t('delete_permanent_warning')}</p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setDeletingAsset(null)} className="flex-1 font-technical text-[10px]">{t('cancel')}</Button>
              <Button variant="primary" onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 font-technical text-[10px]">{t('confirm')}</Button>
            </div>
          </Card>
        </div>
      )}

      <div>
        {activeTab === 'printers' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 border-b border-slate-800 pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-technical font-bold text-white uppercase tracking-[0.2em] truncate">{t('registered_printers')}</h2>
                <p className="text-xs font-technical text-slate-500 uppercase mt-1 truncate">{t('manage_printers_depreciation')}</p>
              </div>
              <Button onClick={() => addAsset('printer')} variant="secondary" size="sm" className="font-technical text-[10px] shrink-0 whitespace-nowrap">
                <Plus size={12} className="mr-1.5" /> {t('add_action')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {printers.map(printer => (
                <Card key={printer.id} variant="industrial" className="group p-6">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                    <div className="w-2 h-2 bg-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input 
                          label="" 
                          value={printer.name} 
                          onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'name', e.target.value)} 
                          onKeyDown={handleKeyDown} 
                          className="font-technical font-bold text-sm tracking-widest text-white uppercase" 
                      />
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(printer.id, 'printer')} 
                      className="shrink-0 p-2 text-slate-600 hover:text-red-500 transition-colors"
                      title={t('delete_printer_tooltip')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t('acquisition_cost_label')} type="number" value={printer.acquisitionCost} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'acquisitionCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px] text-slate-500 font-technical">{settings.currencySymbol}</span>} className="font-technical" />
                    <Input label={t('lifespan_hours_label')} type="number" value={printer.lifespanHours} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'lifespanHours', e.target.value)} onKeyDown={handleKeyDown} className="font-technical" />
                    <Input label={t('power_consumption_label')} type="number" value={printer.powerConsumption} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'powerConsumption', e.target.value)} onKeyDown={handleKeyDown} className="font-technical" />
                    <Input label={`${t('maintenance_cost_label')} (${settings.currencySymbol}/h)`} type="number" value={printer.maintenanceCostPerHour} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'maintenanceCostPerHour', e.target.value)} onKeyDown={handleKeyDown} className="font-technical" />
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] font-technical font-bold text-slate-600 uppercase tracking-widest">{t('depreciation_rate')}</span>
                    <span className="font-technical font-bold text-secondary text-xs">{settings.currencySymbol}{(Number(printer.acquisitionCost) / Number(printer.lifespanHours) || 0).toFixed(2)}/h</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 border-b border-slate-800 pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-technical font-bold text-white uppercase tracking-[0.2em] truncate">{t('registered_materials')}</h2>
                <p className="text-xs font-technical text-slate-500 uppercase mt-1 truncate">{t('manage_materials_stock')}</p>
              </div>
              <Button onClick={() => addAsset('material')} variant="secondary" size="sm" className="font-technical text-[10px] shrink-0 whitespace-nowrap">
                <Plus size={12} className="mr-1.5" /> {t('add_action')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map(material => {
                const stockPercentage = (Number(material.currentStock) && Number(material.spoolWeight)) ? (Number(material.currentStock) / Number(material.spoolWeight)) * 100 : 0;
                return (
                  <Card key={material.id} variant="industrial" className="group p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="relative w-10 h-10 border border-slate-800 overflow-hidden ring-1 ring-white/5 transition-all duration-300">
                          <input
                            type="color"
                            id={`color-${material.id}`}
                            value={material.color || '#000000'}
                            onChange={(e) => handleAssetUpdate(material.id, 'material', 'color', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer outline-none bg-transparent"
                          />
                        </div>
                        <span className="text-[8px] font-technical font-bold text-slate-500 uppercase">{t('color')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input 
                            label="" 
                            value={material.name} 
                            onChange={(e) => handleAssetUpdate(material.id, 'material', 'name', e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            className="font-technical font-bold text-sm tracking-widest text-white uppercase" 
                        />
                      </div>
                      <button 
                        onClick={() => handleDeleteClick(material.id, 'material')} 
                        className="shrink-0 p-2 text-slate-600 hover:text-red-500 transition-colors"
                        title={t('delete_material_tooltip')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Select label={t('type_label')} value={material.type} onChange={(val) => handleAssetUpdate(material.id, 'material', 'type', val)} options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} className="font-technical" />
                      <Input label={t('spool_price_label')} type="number" value={material.spoolPrice} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolPrice', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px] text-slate-500 font-technical">{settings.currencySymbol}</span>} className="font-technical" />
                      <Input label={t('spool_weight_label')} type="number" value={material.spoolWeight} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolWeight', e.target.value)} onKeyDown={handleKeyDown} className="font-technical" />
                      <Input label={t('cost_per_gram_label')} value={(Number(material.spoolPrice) / Number(material.spoolWeight) || 0).toFixed(4)} disabled className="font-technical bg-slate-900 border-none text-slate-400" />
                    </div>

                    <div className="bg-slate-900/50 p-4 border border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-technical font-bold text-slate-500 uppercase tracking-widest">{t('stock_level_label')}</span>
                        <span className="text-[10px] font-technical font-bold text-white">{t('remaining_g', { count: material.currentStock })}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 mb-4 overflow-hidden">
                        <div 
                            className={cn("h-full transition-all duration-500", stockPercentage < 20 ? "bg-red-500" : "bg-primary")} 
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }} 
                        />
                      </div>
                      <Input 
                        label={t('adjust_stock_label')} 
                        type="number" 
                        value={material.currentStock || 0} 
                        onChange={(e) => handleAssetUpdate(material.id, 'material', 'currentStock', e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        className="h-8 text-[10px] font-technical" 
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex justify-center">
            <Card variant="industrial" className="max-w-md w-full p-8 border-primary/20">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4 -mx-8 px-8">
                <Settings className="text-primary" size={16} />
                <span className="font-technical font-extrabold text-[10px] tracking-[0.2em] text-white uppercase">{t('general_settings')}</span>
              </div>
              <div className="p-4 bg-slate-900/50 border border-slate-800 mb-8 text-slate-500 text-[10px] font-technical uppercase leading-relaxed flex gap-3">
                <Info className="text-primary shrink-0" size={14} />
                <p>{t('general_settings_desc')}</p>
              </div>
              <div className="space-y-6">
                <Input label={t('electricity_cost_label')} type="number" step="0.01" value={settings.electricityCost} onChange={(e) => handleAssetUpdate(null, 'settings', 'electricityCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px] text-slate-500 font-technical">{settings.currencySymbol}</span>} className="font-technical" />
                <Input label={t('currency_symbol_label')} value={settings.currencySymbol} onChange={(e) => handleAssetUpdate(null, 'settings', 'currencySymbol', e.target.value)} onKeyDown={handleKeyDown} placeholder="R$, $, €" className="font-technical uppercase" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {isDirty && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-950 border border-primary/50 p-4 flex items-center justify-between shadow-[0_0_30px_rgba(255,92,0,0.1)]">
            <div className="flex items-center gap-4 pl-2">
              <div className="relative">
                <RefreshCw className="text-primary animate-spin" style={{ animationDuration: '3s' }} size={20} />
                <div className="absolute inset-0 bg-primary/20 blur-sm animate-pulse" />
              </div>
              <div>
                <h4 className="font-technical font-extrabold text-[10px] text-white uppercase tracking-widest">{t('pending_changes')}</h4>
                <p className="text-[9px] font-technical text-slate-500 uppercase mt-0.5">{t('sync_needed_desc')}</p>
              </div>
            </div>
            <Button onClick={saveChanges} disabled={isSaving} variant="primary" className="py-2.5 px-6 font-technical text-[11px] !tracking-[0.2em] shadow-none">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save size={14} className="mr-2" />}
              {isSaving ? t('syncing') : t('save_changes')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};