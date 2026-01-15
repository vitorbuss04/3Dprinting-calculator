import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Check, X, Settings, AlertCircle, RefreshCw } from 'lucide-react';
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
    // Validation logic...
    for (const p of printers) {
      if (!p.name.trim() || p.acquisitionCost <= 0 || p.lifespanHours <= 0 || p.powerConsumption <= 0) {
        toast.error('Valores inválidos em uma impressora. Verifique os campos.'); setIsSaving(false); return;
      }
    }
    for (const m of materials) {
      if (!m.name.trim() || m.spoolPrice <= 0 || m.spoolWeight <= 0 || m.currentStock < 0) {
        toast.error('Valores inválidos em um material. Verifique os campos.'); setIsSaving(false); return;
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
      loading: 'Salvando todas as alterações...',
      success: 'Ativos atualizados com sucesso!',
      error: 'Erro ao salvar.'
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
      toast.error("Erro ao sincronizar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const addAsset = (type: 'printer' | 'material') => {
    if (type === 'printer') {
      const newPrinter: Printer = { id: crypto.randomUUID(), name: 'Nova Impressora', acquisitionCost: 2000, lifespanHours: 3000, powerConsumption: 300, maintenanceCostPerHour: 2 };
      setPrinters(prev => [...prev, newPrinter]);
    } else {
      const newMaterial: Material = { id: crypto.randomUUID(), type: MaterialType.PLA, name: 'PLA Genérico', color: '#000000', spoolPrice: 120, spoolWeight: 1000, currentStock: 1000 };
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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-bold text-sm",
        activeTab === id
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
          : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
      )}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-center md:justify-start gap-4 flex-wrap">
        <TabButton id="printers" label="Impressoras" icon={PrinterIcon} />
        <TabButton id="materials" label="Materiais" icon={Package} />
        <TabButton id="settings" label="Configurações" icon={Settings} />
      </div>

      {deletingAsset && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full bg-white p-6 shadow-2xl scale-100 dark:bg-dark-surface dark:border-white/10">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mx-auto mb-4 dark:bg-red-900/20 dark:text-red-400">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg text-center dark:text-gray-100">Confirmar Exclusão</h3>
            <p className="text-center text-gray-500 text-sm mt-2 mb-6 dark:text-gray-400">Esta ação será finalizada ao salvar.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeletingAsset(null)} className="w-full">Cancelar</Button>
              <Button variant="primary" onClick={confirmDelete} className="w-full bg-red-500 hover:bg-red-600 shadow-red-200">Excluir</Button>
            </div>
          </Card>
        </div>
      )}

      <div>
        {activeTab === 'printers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Perfis de Impressora</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">Gerencie suas máquinas e custos operacionais</p>
              </div>
              <Button onClick={() => addAsset('printer')} leftIcon={<Plus size={18} />}>Add Impressora</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {printers.map(printer => (
                <Card key={printer.id} variant="glass" className="relative group hover:border-blue-300 transition-colors dark:hover:border-blue-500/30">
                  <button onClick={() => handleDeleteClick(printer.id, 'printer')} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-20 dark:text-gray-600 dark:hover:text-red-400"><Trash2 size={18} /></button>
                  <div className="mb-5 pr-8">
                    <Input label="Modelo/Nome" value={printer.name} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'name', e.target.value)} onKeyDown={handleKeyDown} className="font-bold text-lg bg-transparent border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 px-2 -ml-2 dark:hover:bg-white/5 dark:focus:bg-black/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Preço" type="number" value={printer.acquisitionCost} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'acquisitionCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px] text-gray-500 dark:text-gray-400">{settings.currencySymbol}</span>} />
                    <Input label="Vida Útil (h)" type="number" value={printer.lifespanHours} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'lifespanHours', e.target.value)} onKeyDown={handleKeyDown} />
                    <Input label="Potência (W)" type="number" value={printer.powerConsumption} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'powerConsumption', e.target.value)} onKeyDown={handleKeyDown} />
                    <Input label={`Manut. (${settings.currencySymbol}/h)`} type="number" value={printer.maintenanceCostPerHour} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'maintenanceCostPerHour', e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center dark:border-white/10">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">Depreciação</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg dark:bg-blue-500/20 dark:text-blue-400">{(Number(printer.acquisitionCost) / Number(printer.lifespanHours) || 0).toFixed(2)} / h</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Filamentos e Resinas</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">Gerencie estoque e custos de materiais</p>
              </div>
              <Button onClick={() => addAsset('material')} variant="secondary" leftIcon={<Plus size={18} />}>Add Material</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map(material => {
                const stockPercentage = (Number(material.currentStock) && Number(material.spoolWeight)) ? (Number(material.currentStock) / Number(material.spoolWeight)) * 100 : 0;
                return (
                  <Card key={material.id} variant="neumorphic" className="relative hover:shadow-lg transition-all duration-300 group">
                    <button onClick={() => handleDeleteClick(material.id, 'material')} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-20 dark:text-gray-600 dark:hover:text-red-400"><Trash2 size={18} /></button>

                    <div className="flex gap-4 mb-4">
                      <div className="flex flex-col items-center gap-1.5 w-12 shrink-0">
                        <label htmlFor={`color-${material.id}`} className="block text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-800 transition-colors text-center w-full break-words leading-tight dark:text-gray-400 dark:hover:text-gray-300">Cor</label>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/5 group-hover:scale-105 dark:ring-white/10">
                          <input
                            type="color"
                            id={`color-${material.id}`}
                            value={material.color || '#000000'}
                            onChange={(e) => handleAssetUpdate(material.id, 'material', 'color', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex-1 pr-8">
                        <Input label="Nome/Marca" value={material.name} onChange={(e) => handleAssetUpdate(material.id, 'material', 'name', e.target.value)} onKeyDown={handleKeyDown} className="font-bold bg-transparent border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 px-2 -ml-2 dark:hover:bg-white/5 dark:focus:bg-black/20" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Select label="Tipo" value={material.type} onChange={(val) => handleAssetUpdate(material.id, 'material', 'type', val)} options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} />
                      <Input label="Preço Rolo" type="number" value={material.spoolPrice} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolPrice', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px] text-gray-500 dark:text-gray-400">{settings.currencySymbol}</span>} />
                      <Input label="Peso (g)" type="number" value={material.spoolWeight} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolWeight', e.target.value)} onKeyDown={handleKeyDown} />
                      <Input label="Custo/g" value={(Number(material.spoolPrice) / Number(material.spoolWeight) || 0).toFixed(4)} disabled className="bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400" />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 dark:bg-white/5 dark:border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase dark:text-gray-400">Estoque</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-200">{material.currentStock}g</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden dark:bg-white/10">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(stockPercentage, 100)}%` }}></div>
                      </div>
                      <Input label="Ajustar Estoque" type="number" value={material.currentStock || 0} onChange={(e) => handleAssetUpdate(material.id, 'material', 'currentStock', e.target.value)} onKeyDown={handleKeyDown} className="h-8 text-xs bg-white dark:bg-black/20" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex justify-center">
            <Card title="Configuração Global" variant="glass" className="max-w-md w-full">
              <div className="p-4 bg-yellow-50 rounded-xl mb-6 text-yellow-800 text-sm flex gap-3 items-start dark:bg-yellow-900/20 dark:text-yellow-400">
                <Settings className="shrink-0 mt-0.5" size={16} />
                <p>Estas configurações afetam todos os cálculos da aplicação.</p>
              </div>
              <div className="space-y-5">
                <Input label="Custo de Energia (kWh)" type="number" step="0.01" value={settings.electricityCost} onChange={(e) => handleAssetUpdate(null, 'settings', 'electricityCost', e.target.value)} onKeyDown={handleKeyDown} icon={<span className="text-[10px]">{settings.currencySymbol}</span>} />
                <Input label="Símbolo da Moeda" value={settings.currencySymbol} onChange={(e) => handleAssetUpdate(null, 'settings', 'currencySymbol', e.target.value)} onKeyDown={handleKeyDown} placeholder="R$, $, €" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-gray-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-white/10 ring-1 ring-black/5 dark:bg-white/10 dark:backdrop-blur-xl">
            <div className="flex items-center gap-4 pl-2">
              <div className="relative">
                <RefreshCw className="text-blue-400 animate-spin-slow" size={24} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Alterações pendentes</h4>
                <p className="text-xs text-gray-400">Não esqueça de salvar seu progresso.</p>
              </div>
            </div>
            <Button onClick={saveChanges} disabled={isSaving} variant="primary" className="shadow-none bg-blue-600 hover:bg-blue-500 border-none">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
              {isSaving ? 'Salvando...' : 'Salvar Tudo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};