import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Check, X, Settings } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';

// Debounce function to delay execution
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const AssetsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>('printers');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: 'R$' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<{id: string; type: 'printer' | 'material'} | null>(null);
  const hasFetched = useRef(false); // Ref to prevent double-fetching in Strict Mode

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    const loadData = async () => {
      const loadPromise = Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings()
      ]);
      
      toast.promise(loadPromise, {
          loading: 'Carregando seus ativos...',
          success: ([p, m, s]) => {
              setPrinters(p);
              setMaterials(m);
              setSettings(s);
              return 'Ativos carregados com sucesso!';
          },
          error: (err) => `Erro ao carregar ativos: ${err.message}`,
      }).finally(() => {
        setLoading(false);
      });
    };
    loadData();
  }, []); // Empty dependency array is correct

  const saveSettings = async () => {
    setIsSaving(true);
    const savePromise = StorageService.saveSettings(settings);
    
    toast.promise(savePromise, {
        loading: 'Salvando configurações...',
        success: () => {
            setIsSaving(false);
            return 'Configurações salvas com sucesso!';
        },
        error: (err) => {
            setIsSaving(false);
            return `Erro ao salvar: ${err.message}`;
        }
    });
  };

  const addAsset = async (type: 'printer' | 'material') => {
    if (type === 'printer') {
      const newPrinter: Printer = {
        id: crypto.randomUUID(), name: 'Nova Impressora', acquisitionCost: 2000,
        lifespanHours: 3000, powerConsumption: 300, maintenanceCostPerHour: 2
      };
      const addPromise = StorageService.addPrinter(newPrinter).then(() => {
          setPrinters(prev => [...prev, newPrinter]);
      });
      toast.promise(addPromise, { loading: 'Adicionando...', success: 'Impressora adicionada!', error: 'Erro ao adicionar.' });
    } else {
      const newMaterial: Material = {
        id: crypto.randomUUID(), type: MaterialType.PLA, name: 'PLA Genérico',
        spoolPrice: 120, spoolWeight: 1000, currentStock: 1000
      };
      const addPromise = StorageService.addMaterial(newMaterial).then(() => {
        setMaterials(prev => [...prev, newMaterial]);
      });
      toast.promise(addPromise, { loading: 'Adicionando...', success: 'Material adicionado!', error: 'Erro ao adicionar.' });
    }
  };

  const handleAssetUpdate = (id: string, type: 'printer' | 'material', field: keyof Printer | keyof Material, value: string | number) => {
    let updatePromise;
    if (type === 'printer') {
      const updatedPrinters = printers.map(p => p.id === id ? { ...p, [field]: value } : p);
      setPrinters(updatedPrinters);
      const printerToUpdate = updatedPrinters.find(p => p.id === id);
      if (printerToUpdate) {
        updatePromise = StorageService.updatePrinter(printerToUpdate);
      }
    } else {
      const updatedMaterials = materials.map(m => m.id === id ? { ...m, [field]: value } : m);
      setMaterials(updatedMaterials);
      const materialToUpdate = updatedMaterials.find(m => m.id === id);
      if (materialToUpdate) {
        updatePromise = StorageService.updateMaterial(materialToUpdate);
      }
    }
    if (updatePromise) {
        toast.promise(updatePromise, { loading: 'Salvando...', success: 'Alteração salva!', error: 'Erro ao salvar.'});
    }
  };
  
  const debouncedUpdate = useCallback(debounce(handleAssetUpdate, 1000), [printers, materials]);

  const confirmDelete = async () => {
    if (!deletingAsset) return;

    const { id, type } = deletingAsset;
    setDeletingAsset(null);

    const deletePromise = type === 'printer' ? StorageService.deletePrinter(id) : StorageService.deleteMaterial(id);

    toast.promise(deletePromise, {
      loading: `Excluindo ${type === 'printer' ? 'impressora' : 'material'}...`,
      success: () => {
        if (type === 'printer') {
          setPrinters(prev => prev.filter(p => p.id !== id));
        } else {
          setMaterials(prev => prev.filter(m => m.id !== id));
        }
        return 'Ativo excluído com sucesso!';
      },
      error: (err) => `Erro ao excluir: ${err.message}`,
    });
  };
  
  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  const renderTabs = () => (
    <div className="flex gap-4 border-b border-gray-200 pb-2">
        {[{id: 'printers', label: 'Impressoras', icon: PrinterIcon}, {id: 'materials', label: 'Materiais', icon: Package}, {id: 'settings', label: 'Configurações', icon: Settings}].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors font-medium ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
    </div>
  );

  const renderConfirmationDialog = (asset: {id: string; type: 'printer' | 'material'}) => (
    deletingAsset && deletingAsset.id === asset.id && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-xl z-10">
            <p className="font-bold text-gray-800 mb-4 text-center">Excluir este ativo?</p>
            <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setDeletingAsset(null)}><X size={16} /> Cancelar</Button>
                <Button variant="danger" onClick={confirmDelete}><Check size={16} /> Confirmar</Button>
            </div>
        </div>
    )
  );

  return (
    <div className="space-y-6">
      {renderTabs()}
      <div className="transition-opacity duration-300">
        {activeTab === 'printers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Perfis de Impressora</h2>
              <Button onClick={() => addAsset('printer')}><Plus size={18} /> Add Impressora</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {printers.map(printer => (
                <Card key={printer.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {renderConfirmationDialog({id: printer.id, type: 'printer'})}
                  <div className={`transition-all duration-300 ${deletingAsset?.id === printer.id ? 'blur-sm brightness-90' : ''}`}>
                    <button onClick={() => setDeletingAsset({id: printer.id, type: 'printer'})} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors z-20"><Trash2 size={18} /></button>
                    <div className="mb-4"><Input label="Modelo/Nome" value={printer.name} onChange={(e) => debouncedUpdate(printer.id, 'printer', 'name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Preço" type="number" value={printer.acquisitionCost} onChange={(e) => debouncedUpdate(printer.id, 'printer', 'acquisitionCost', parseFloat(e.target.value))} subLabel={settings.currencySymbol} />
                      <Input label="Vida Útil" type="number" value={printer.lifespanHours} onChange={(e) => debouncedUpdate(printer.id, 'printer', 'lifespanHours', parseFloat(e.target.value))} subLabel="Horas" />
                      <Input label="Potência" type="number" value={printer.powerConsumption} onChange={(e) => debouncedUpdate(printer.id, 'printer', 'powerConsumption', parseFloat(e.target.value))} subLabel="Watts" />
                      <Input label="Manut." type="number" value={printer.maintenanceCostPerHour} onChange={(e) => debouncedUpdate(printer.id, 'printer', 'maintenanceCostPerHour', parseFloat(e.target.value))} subLabel={`${settings.currencySymbol}/h`} />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100"><p className="text-xs text-gray-500">Depreciação: <span className="text-gray-900 font-mono font-medium">{(printer.acquisitionCost / printer.lifespanHours).toFixed(2)}/h</span></p></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900">Filamentos e Resinas</h2><Button onClick={() => addAsset('material')}><Plus size={18} /> Add Material</Button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(material => (
                <Card key={material.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {renderConfirmationDialog({id: material.id, type: 'material'})}
                  <div className={`transition-all duration-300 ${deletingAsset?.id === material.id ? 'blur-sm brightness-90' : ''}`}>
                    <button onClick={() => setDeletingAsset({id: material.id, type: 'material'})} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors z-20"><Trash2 size={18} /></button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2"><Input label="Nome/Marca/Cor" value={material.name} onChange={(e) => debouncedUpdate(material.id, 'material', 'name', e.target.value)} /></div>
                      <div className="col-span-2"><Select label="Tipo" value={material.type} onChange={(e) => handleAssetUpdate(material.id, 'material', 'type', e.target.value)} options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} /></div>
                      <Input label="Preço do Rolo" type="number" value={material.spoolPrice} onChange={(e) => debouncedUpdate(material.id, 'material', 'spoolPrice', parseFloat(e.target.value))} subLabel={settings.currencySymbol} />
                      <Input label="Peso" type="number" value={material.spoolWeight} onChange={(e) => debouncedUpdate(material.id, 'material', 'spoolWeight', parseFloat(e.target.value))} subLabel="g" />
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100"><p className="text-xs text-gray-500">Custo por grama: <span className="text-gray-900 font-mono font-medium">{(material.spoolPrice / material.spoolWeight).toFixed(4)}</span></p></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
            <Card title="Configuração Global" className="max-w-md mx-auto">
                <div className="space-y-4">
                    <Input label="Custo de Energia" subLabel={`(${settings.currencySymbol}) por kWh`} type="number" step="0.01" value={settings.electricityCost} onChange={(e) => setSettings({ ...settings, electricityCost: parseFloat(e.target.value) || 0 })} />
                    <Input label="Símbolo da Moeda" value={settings.currencySymbol} onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })} />
                </div>
                <Button onClick={saveSettings} disabled={isSaving} className="w-full mt-6">
                    {isSaving ? <><Loader2 className="animate-spin mr-2" size={18} /> Salvando...</> : 'Salvar Configurações Globais'}
                </Button>
            </Card>
        )}
      </div>
    </div>
  );
};