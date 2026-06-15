import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Settings, AlertCircle, RefreshCw, Info, X } from 'lucide-react';
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

  // Material Modals State
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [activeMaterialForDetails, setActiveMaterialForDetails] = useState<Material | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState<Material | null>(null);
  const [addMaterialForm, setAddMaterialForm] = useState({
    name: '',
    type: MaterialType.PLA,
    color: '#4285f4',
    spoolPrice: 120,
    spoolWeight: 1000,
    currentStock: 1000,
    manufacturer: '',
    diameter: 1.75,
    printTemp: '',
    bedTemp: ''
  });

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
      const newMaterial: Material = { id: crypto.randomUUID(), type: MaterialType.PLA, name: t('generic_pla_default_name'), color: '#4285f4', spoolPrice: 120, spoolWeight: 1000, currentStock: 1000, manufacturer: '', printTemp: undefined, bedTemp: undefined, diameter: 1.75 };
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleAssetUpdate = (id: string | null, type: 'printer' | 'material' | 'settings', field: string, value: string | number) => {
    const isNumeric = ['acquisitionCost', 'lifespanHours', 'powerConsumption', 'maintenanceCostPerHour', 'spoolPrice', 'spoolWeight', 'currentStock', 'electricityCost', 'printTemp', 'bedTemp', 'diameter'].includes(field as string);
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

  const handleInfoClick = (material: Material) => {
    setActiveMaterialForDetails(material);
    setEditMaterialForm({ ...material });
  };

  const handleEditFormChange = (field: string, value: any) => {
    if (!editMaterialForm) return;
    const isNumeric = ['spoolPrice', 'spoolWeight', 'currentStock', 'printTemp', 'bedTemp', 'diameter'].includes(field);
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    setEditMaterialForm(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value
      };
      if (field === 'spoolWeight' && !isNaN(numericValue) && numericValue > 0) {
        updated.currentStock = numericValue;
      }
      return updated;
    });
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMaterialForm.name.trim() || addMaterialForm.spoolPrice <= 0 || addMaterialForm.spoolWeight <= 0 || addMaterialForm.currentStock < 0) {
      toast.error(t('invalid_material_values'));
      return;
    }
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      type: addMaterialForm.type,
      name: addMaterialForm.name.trim(),
      color: addMaterialForm.color,
      spoolPrice: Number(addMaterialForm.spoolPrice),
      spoolWeight: Number(addMaterialForm.spoolWeight),
      currentStock: Number(addMaterialForm.currentStock),
      manufacturer: addMaterialForm.manufacturer.trim() || undefined,
      diameter: addMaterialForm.diameter ? Number(addMaterialForm.diameter) : undefined,
      printTemp: addMaterialForm.printTemp ? Number(addMaterialForm.printTemp) : undefined,
      bedTemp: addMaterialForm.bedTemp ? Number(addMaterialForm.bedTemp) : undefined
    };
    setMaterials(prev => [...prev, newMaterial]);
    setIsAddMaterialModalOpen(false);
    setAddMaterialForm({
      name: '',
      type: MaterialType.PLA,
      color: '#4285f4',
      spoolPrice: 120,
      spoolWeight: 1000,
      currentStock: 1000,
      manufacturer: '',
      diameter: 1.75,
      printTemp: '',
      bedTemp: ''
    });
  };

  const handleEditMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaterialForm) return;
    if (!editMaterialForm.name.trim() || editMaterialForm.spoolPrice <= 0 || editMaterialForm.spoolWeight <= 0 || editMaterialForm.currentStock < 0) {
      toast.error(t('invalid_material_values'));
      return;
    }
    setMaterials(prev => prev.map(m => m.id === editMaterialForm.id ? editMaterialForm : m));
    setActiveMaterialForDetails(null);
    setEditMaterialForm(null);
  };

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
      <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_dots')}</span>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 transition-all duration-150 font-sans font-medium text-sm rounded-xl",
        activeTab === id
          ? "text-primary bg-canvas border border-hairline shadow-sm"
          : "text-muted hover:text-ink hover:bg-canvas/50"
      )}
    >
      <Icon size={16} className={activeTab === id ? "text-primary" : "text-muted"} /> {label}
    </button>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-center md:justify-start border-b border-hairline bg-surface-soft p-2 rounded-2xl gap-2">
        <TabButton id="printers" label={t('printers_tab')} icon={PrinterIcon} />
        <TabButton id="materials" label={t('materials_tab')} icon={Package} />
        <TabButton id="settings" label={t('settings_tab')} icon={Settings} />
      </div>

      {deletingAsset && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <Card variant="default" className="max-w-sm w-full p-8 border border-hairline bg-canvas rounded-2xl shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full border border-red/20 text-red mx-auto mb-6">
              <Trash2 size={24} />
            </div>
            <h3 className="font-sans font-semibold text-ink text-lg text-center">{t('confirm_deletion')}</h3>
            <p className="text-center text-muted text-xs font-sans mt-2 mb-6">{t('delete_permanent_warning')}</p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setDeletingAsset(null)} className="flex-1 font-sans text-xs">{t('cancel')}</Button>
              <Button className="flex-1 bg-red hover:bg-red/90 text-white font-sans text-xs border-none" onClick={confirmDelete}>{t('confirm')}</Button>
            </div>
          </Card>
        </div>
      )}

      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <Card variant="default" className="max-w-md w-full border border-hairline bg-canvas rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="border-b border-hairline p-5 flex justify-between items-center bg-surface-soft">
              <h3 className="font-sans font-semibold text-ink text-base uppercase tracking-wider">{t('add_material_title', { defaultValue: 'CADASTRAR MATERIAL' })}</h3>
              <button onClick={() => setIsAddMaterialModalOpen(false)} className="w-8 h-8 flex items-center justify-center border border-hairline bg-canvas rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-all duration-150">
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterialSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              <div className="flex items-center gap-4 p-4 bg-surface-soft border border-hairline rounded-xl">
                <div className="space-y-1.5 flex-grow">
                  <label className="block text-xs font-sans font-semibold text-ink">{t('color', { defaultValue: 'COR DO FILAMENTO' })}</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 border border-hairline rounded-full overflow-hidden shrink-0 shadow-sm">
                      <input
                        type="color"
                        value={addMaterialForm.color}
                        onChange={(e) => setAddMaterialForm(prev => ({ ...prev, color: e.target.value }))}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted uppercase">{addMaterialForm.color}</span>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <Input 
                    label={t('name_label', { defaultValue: 'Nome da Cor / Descrição' })} 
                    value={addMaterialForm.name} 
                    onChange={(e) => setAddMaterialForm(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="ex: PLA Vermelho Candy"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label={t('type_label')} 
                  value={addMaterialForm.type} 
                  onChange={(val) => setAddMaterialForm(prev => ({ ...prev, type: val as MaterialType }))} 
                  options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} 
                />
                <Input 
                  label={t('manufacturer_label')} 
                  value={addMaterialForm.manufacturer} 
                  onChange={(e) => setAddMaterialForm(prev => ({ ...prev, manufacturer: e.target.value }))} 
                  placeholder="ex: 3D Fila"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label={t('spool_price_label')} 
                  type="number" 
                  value={addMaterialForm.spoolPrice} 
                  onChange={(e) => setAddMaterialForm(prev => ({ ...prev, spoolPrice: parseFloat(e.target.value) || 0 }))} 
                  icon={<span className="text-xs text-muted font-sans">{settings.currencySymbol}</span>} 
                  required
                />
                <Input 
                  label={t('spool_weight_label')} 
                  type="number" 
                  value={addMaterialForm.spoolWeight} 
                  onChange={(e) => setAddMaterialForm(prev => {
                    const weight = parseFloat(e.target.value) || 0;
                    return { ...prev, spoolWeight: weight, currentStock: weight };
                  })} 
                  required
                />
              </div>

              <div className="border-t border-hairline pt-4 space-y-3">
                <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block">
                  {t('technical_specs_section')}
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <Input 
                    label={t('diameter_label')} 
                    type="number" 
                    step="0.01"
                    value={addMaterialForm.diameter} 
                    onChange={(e) => setAddMaterialForm(prev => ({ ...prev, diameter: parseFloat(e.target.value) || 0 }))} 
                  />
                  <Input 
                    label={t('print_temp_label')} 
                    type="number" 
                    value={addMaterialForm.printTemp} 
                    onChange={(e) => setAddMaterialForm(prev => ({ ...prev, printTemp: e.target.value }))} 
                    placeholder="200"
                  />
                  <Input 
                    label={t('bed_temp_label')} 
                    type="number" 
                    value={addMaterialForm.bedTemp} 
                    onChange={(e) => setAddMaterialForm(prev => ({ ...prev, bedTemp: e.target.value }))} 
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsAddMaterialModalOpen(false)} className="text-xs font-sans">
                  {t('cancel')}
                </Button>
                <Button type="submit" variant="primary" className="text-xs font-sans">
                  {t('add_action')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {activeMaterialForDetails && editMaterialForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <Card variant="default" className="max-w-md w-full border border-hairline bg-canvas rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="border-b border-hairline p-5 flex justify-between items-center bg-surface-soft">
              <h3 className="font-sans font-semibold text-ink text-base uppercase tracking-wider">{t('material_details_title', { defaultValue: 'DETALHES DO FILAMENTO' })}</h3>
              <button onClick={() => { setActiveMaterialForDetails(null); setEditMaterialForm(null); }} className="w-8 h-8 flex items-center justify-center border border-hairline bg-canvas rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-all duration-150">
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={handleEditMaterialSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              <div className="flex items-center gap-4 p-4 bg-surface-soft border border-hairline rounded-xl">
                <div className="space-y-1.5 flex-grow">
                  <label className="block text-xs font-sans font-semibold text-ink">{t('color', { defaultValue: 'COR DO FILAMENTO' })}</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 border border-hairline rounded-full overflow-hidden shrink-0 shadow-sm">
                      <input
                        type="color"
                        value={editMaterialForm.color || '#000000'}
                        onChange={(e) => handleEditFormChange('color', e.target.value)}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted uppercase">{editMaterialForm.color}</span>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <Input 
                    label={t('name_label', { defaultValue: 'Nome da Cor / Descrição' })} 
                    value={editMaterialForm.name} 
                    onChange={(e) => handleEditFormChange('name', e.target.value)} 
                    placeholder="Nome"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label={t('type_label')} 
                  value={editMaterialForm.type} 
                  onChange={(val) => handleEditFormChange('type', val as MaterialType)} 
                  options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} 
                />
                <Input 
                  label={t('manufacturer_label')} 
                  value={editMaterialForm.manufacturer || ''} 
                  onChange={(e) => handleEditFormChange('manufacturer', e.target.value)} 
                  placeholder="ex: 3D Fila"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label={t('spool_price_label')} 
                  type="number" 
                  value={editMaterialForm.spoolPrice} 
                  onChange={(e) => handleEditFormChange('spoolPrice', e.target.value)} 
                  icon={<span className="text-xs text-muted font-sans">{settings.currencySymbol}</span>} 
                  required
                />
                <Input 
                  label={t('spool_weight_label')} 
                  type="number" 
                  value={editMaterialForm.spoolWeight} 
                  onChange={(e) => handleEditFormChange('spoolWeight', e.target.value)} 
                  required
                />
              </div>

              <div className="border-t border-hairline pt-4 space-y-3">
                <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block">
                  {t('technical_specs_section')}
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <Input 
                    label={t('diameter_label')} 
                    type="number" 
                    step="0.01"
                    value={editMaterialForm.diameter || ''} 
                    onChange={(e) => handleEditFormChange('diameter', e.target.value)} 
                  />
                  <Input 
                    label={t('print_temp_label')} 
                    type="number" 
                    value={editMaterialForm.printTemp || ''} 
                    onChange={(e) => handleEditFormChange('printTemp', e.target.value)} 
                    placeholder="200"
                  />
                  <Input 
                    label={t('bed_temp_label')} 
                    type="number" 
                    value={editMaterialForm.bedTemp || ''} 
                    onChange={(e) => handleEditFormChange('bedTemp', e.target.value)} 
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => { setActiveMaterialForDetails(null); setEditMaterialForm(null); }} className="text-xs font-sans">
                  {t('cancel')}
                </Button>
                <Button type="submit" variant="primary" className="text-xs font-sans">
                  {t('save_changes')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}



      <div>
        {activeTab === 'printers' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 border-b border-hairline pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-sans font-semibold text-ink truncate">{t('registered_printers')}</h2>
                <p className="text-xs font-sans text-muted mt-1 truncate">{t('manage_printers_depreciation')}</p>
              </div>
              <Button onClick={() => addAsset('printer')} variant="secondary" className="text-xs py-1 px-3 h-9">
                <Plus size={14} className="mr-1" /> {t('add_action')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {printers.map(printer => (
                <Card key={printer.id} variant="default" className="p-6 border border-hairline">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-hairline">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input 
                          label="" 
                          value={printer.name} 
                          onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'name', e.target.value)} 
                          onKeyDown={handleKeyDown} 
                          className="font-sans font-semibold text-sm text-ink bg-transparent border-none p-0 focus:ring-0" 
                      />
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(printer.id, 'printer')} 
                      className="shrink-0 w-8 h-8 rounded-full text-muted hover:text-red hover:bg-surface-soft flex items-center justify-center transition-colors"
                      title={t('delete_printer_tooltip')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t('acquisition_cost_label')} type="number" value={printer.acquisitionCost} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'acquisitionCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-xs text-muted font-sans">{settings.currencySymbol}</span>} />
                    <Input label={t('lifespan_hours_label')} type="number" value={printer.lifespanHours} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'lifespanHours', e.target.value)} onKeyDown={handleKeyDown} />
                    <Input label={t('power_consumption_label')} type="number" value={printer.powerConsumption} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'powerConsumption', e.target.value)} onKeyDown={handleKeyDown} />
                    <Input label={`${t('maintenance_cost_label')} (${settings.currencySymbol}/h)`} type="number" value={printer.maintenanceCostPerHour} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'maintenanceCostPerHour', e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-hairline flex justify-between items-center">
                    <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('depreciation_rate')}</span>
                    <span className="font-sans font-semibold text-primary text-xs">{settings.currencySymbol}{(Number(printer.acquisitionCost) / Number(printer.lifespanHours) || 0).toFixed(2)}/h</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 border-b border-hairline pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-sans font-semibold text-ink truncate">{t('registered_materials')}</h2>
                <p className="text-xs font-sans text-muted mt-1 truncate">{t('manage_materials_stock')}</p>
              </div>
              <Button onClick={() => setIsAddMaterialModalOpen(true)} variant="secondary" className="text-xs py-1 px-3 h-9">
                <Plus size={14} className="mr-1" /> {t('add_action')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map(material => {
                const stockPercentage = (Number(material.currentStock) && Number(material.spoolWeight)) ? (Number(material.currentStock) / Number(material.spoolWeight)) * 100 : 0;
                return (
                  <Card key={material.id} variant="default" className="p-6 border border-hairline flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-hairline">
                        <div 
                          className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 shrink-0 shadow-sm"
                          style={{ backgroundColor: material.color || '#4285f4' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-sm text-ink truncate">{material.name}</span>
                            <span className="px-2 py-0.5 bg-surface-strong border border-hairline rounded text-[10px] font-sans font-semibold text-muted">
                              {material.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleInfoClick(material)} 
                            className="w-8 h-8 rounded-full text-muted hover:text-primary hover:bg-surface-soft flex items-center justify-center transition-colors"
                            title={t('view_details_tooltip', { defaultValue: 'Detalhes' })}
                          >
                            <Info size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(material.id, 'material')} 
                            className="shrink-0 w-8 h-8 rounded-full text-muted hover:text-red hover:bg-surface-soft flex items-center justify-center transition-colors"
                            title={t('delete_material_tooltip')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Stock section */}
                      <div className="bg-surface-soft p-4 border border-hairline rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('stock_level_label')}</span>
                            {stockPercentage < 20 && (
                              <span className="text-[8px] bg-red/10 border border-red/20 text-red font-sans font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                {t('low_stock_badge')}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-sans font-semibold text-ink">{t('remaining_g', { count: Number(material.currentStock) })}</span>
                        </div>
                        <div className="w-full bg-surface-strong h-1.5 rounded-full mb-4 overflow-hidden">
                          <div 
                              className={cn("h-full rounded-full transition-all duration-500", stockPercentage < 20 ? "bg-red" : "bg-primary")} 
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }} 
                          />
                        </div>
                        
                        {/* Quick adjust buttons */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const current = Number(material.currentStock) || 0;
                              const newVal = Math.max(0, current - 100);
                              handleAssetUpdate(material.id, 'material', 'currentStock', newVal);
                            }}
                            className="px-2 py-1 bg-canvas hover:bg-surface-strong border border-hairline rounded-lg text-[10px] font-sans font-medium text-muted hover:text-ink transition-colors"
                          >
                            -100g
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = Number(material.currentStock) || 0;
                              const newVal = Math.max(0, current - 50);
                              handleAssetUpdate(material.id, 'material', 'currentStock', newVal);
                            }}
                            className="px-2 py-1 bg-canvas hover:bg-surface-strong border border-hairline rounded-lg text-[10px] font-sans font-medium text-muted hover:text-ink transition-colors"
                          >
                            -50g
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = Number(material.currentStock) || 0;
                              const newVal = current + 100;
                              handleAssetUpdate(material.id, 'material', 'currentStock', newVal);
                            }}
                            className="px-2 py-1 bg-canvas hover:bg-surface-strong border border-hairline rounded-lg text-[10px] font-sans font-medium text-muted hover:text-ink transition-colors"
                          >
                            +100g
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const spoolW = Number(material.spoolWeight) || 1000;
                              handleAssetUpdate(material.id, 'material', 'currentStock', spoolW);
                            }}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-[10px] font-sans font-semibold text-primary transition-colors ml-auto"
                          >
                            {t('full_spool_btn')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex justify-center animate-in fade-in">
            <Card variant="default" className="max-w-md w-full p-8 border border-hairline">
              <div className="flex items-center gap-3 mb-6 border-b border-hairline pb-4">
                <Settings className="text-primary" size={16} />
                <span className="font-sans font-semibold text-ink text-sm">{t('general_settings')}</span>
              </div>
              <div className="p-4 bg-primary-soft/30 border border-primary/20 rounded-xl mb-6 text-muted text-xs leading-relaxed flex gap-3">
                <Info className="text-primary shrink-0" size={14} />
                <p>{t('general_settings_desc')}</p>
              </div>
              <div className="space-y-4">
                <Input label={t('electricity_cost_label')} type="number" step="0.01" value={settings.electricityCost} onChange={(e) => handleAssetUpdate(null, 'settings', 'electricityCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-xs text-muted font-sans">{settings.currencySymbol}</span>} />
                <Input label={t('currency_symbol_label')} value={settings.currencySymbol} onChange={(e) => handleAssetUpdate(null, 'settings', 'currencySymbol', e.target.value)} onKeyDown={handleKeyDown} placeholder="R$, $, €" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {isDirty && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 animate-in slide-in-from-bottom-10 duration-300 px-4">
          <div className="bg-canvas border border-hairline rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3 pl-2">
              <RefreshCw className="text-primary animate-spin" style={{ animationDuration: '3s' }} size={18} />
              <div>
                <h4 className="font-sans font-semibold text-sm text-ink">{t('pending_changes')}</h4>
                <p className="text-xs font-sans text-muted mt-0.5">{t('sync_needed_desc')}</p>
              </div>
            </div>
            <Button onClick={saveChanges} disabled={isSaving} variant="primary" className="py-2 px-4 text-xs font-sans font-medium rounded-full shadow-sm">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save size={14} className="mr-2" />}
              {isSaving ? t('syncing') : t('save_changes')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};