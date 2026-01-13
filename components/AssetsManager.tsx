import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Check, X, Settings, AlertCircle } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';

export const AssetsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>('printers');
  
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
  const [deletingAsset, setDeletingAsset] = useState<{id: string; type: 'printer' | 'material'} | null>(null);
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

    // Validate all assets before saving
    for (const p of printers) {
        if (!p.name.trim() || p.acquisitionCost <= 0 || p.lifespanHours <= 0 || p.powerConsumption <= 0) {
            toast.error('Valores inválidos em uma impressora. Verifique os campos.');
            setIsSaving(false);
            return;
        }
    }
    for (const m of materials) {
        if (!m.name.trim() || m.spoolPrice <= 0 || m.spoolWeight <= 0 || m.currentStock < 0) {
            toast.error('Valores inválidos em um material. Verifique os campos.');
            setIsSaving(false);
            return;
        }
    }

    const promises: Promise<any>[] = [];
    idsToDelete.printers.forEach(id => promises.push(StorageService.deletePrinter(id)));
    idsToDelete.materials.forEach(id => promises.push(StorageService.deleteMaterial(id)));

    const originalPrinterMap = new Map(originalPrinters.map(p => [p.id, p]));
    printers.forEach(p => {
        const original = originalPrinterMap.get(p.id);
        if (!original) {
            promises.push(StorageService.addPrinter(p));
        } else if (JSON.stringify(p) !== JSON.stringify(original)) {
            promises.push(StorageService.updatePrinter(p));
        }
    });

    const originalMaterialMap = new Map(originalMaterials.map(m => [m.id, m]));
    materials.forEach(m => {
        const original = originalMaterialMap.get(m.id);
        if (!original) {
            promises.push(StorageService.addMaterial(m));
        } else if (JSON.stringify(m) !== JSON.stringify(original)) {
            promises.push(StorageService.updateMaterial(m));
        }
    });
    
    if (JSON.stringify(settings) !== JSON.stringify(originalSettings)) {
        promises.push(StorageService.saveSettings(settings));
    }

    const toastPromise = toast.promise(Promise.all(promises), {
        loading: 'Salvando todas as alterações...',
        success: 'Seus ativos foram atualizados com sucesso!',
        error: 'Ocorreu um erro ao salvar um ou mais itens.'
    });

    try {
        await toastPromise;
        setOriginalPrinters(printers);
        setOriginalMaterials(materials);
        setOriginalSettings(settings);
        setIdsToDelete({ printers: [], materials: [] });
        setIsDirty(false);
    } catch (e) {
        toast.error("Considere recarregar a página para garantir a consistência dos dados.");
    } finally {
        setIsSaving(false);
    }
  };

  const addAsset = (type: 'printer' | 'material') => {
    if (type === 'printer') {
      const newPrinter: Printer = { id: crypto.randomUUID(), name: 'Nova Impressora', acquisitionCost: 2000, lifespanHours: 3000, powerConsumption: 300, maintenanceCostPerHour: 2 };
      setPrinters(prev => [...prev, newPrinter]);
    } else {
      const newMaterial: Material = { id: crypto.randomUUID(), type: MaterialType.PLA, name: 'PLA Genérico', spoolPrice: 120, spoolWeight: 1000, currentStock: 1000 };
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleAssetUpdate = (id: string, type: 'printer' | 'material', field: string, value: string | number) => {
    const isNumeric = ['acquisitionCost', 'lifespanHours', 'powerConsumption', 'maintenanceCostPerHour', 'spoolPrice', 'spoolWeight', 'currentStock', 'electricityCost'].includes(field as string);
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (type === 'printer') {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value } : p));
    } else if (type === 'material') {
        setMaterials(prev => prev.map(m => {
            if (m.id === id) {
                const updated = { ...m, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value };
                if (field === 'spoolWeight' && !isNaN(numericValue) && numericValue > 0) {
                    updated.currentStock = numericValue;
                }
                return updated;
            }
            return m;
        }));
    } else if (type === 'settings') {
        setSettings(prev => ({...prev, [field]: isNumeric ? (isNaN(numericValue) ? '' : numericValue) : value }));
    }
  };

  const handleDeleteClick = (id: string, type: 'printer' | 'material') => {
    setDeletingAsset({id, type});
  };

  const confirmDelete = () => {
    if (!deletingAsset) return;
    const { id, type } = deletingAsset;

    if (type === 'printer') {
        setPrinters(prev => prev.filter(p => p.id !== id));
        if (originalPrinters.some(p => p.id === id)) { // Only add to delete list if it exists in DB
          setIdsToDelete(prev => ({...prev, printers: [...prev.printers, id]}));
        }
    } else {
        setMaterials(prev => prev.filter(m => m.id !== id));
        if (originalMaterials.some(m => m.id === id)) { // Only add to delete list if it exists in DB
          setIdsToDelete(prev => ({...prev, materials: [...prev.materials, id]}));
        }
    }
    setDeletingAsset(null);
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

  const renderConfirmationDialog = () => (
    deletingAsset && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
             <Card className="max-w-sm w-full">
                <h3 className="font-bold text-gray-900 text-lg text-center">Confirmar Exclusão</h3>
                <p className="text-center text-gray-600 text-sm mt-2 mb-6">Tem certeza de que deseja excluir este ativo? A exclusão será efetivada ao salvar as alterações.</p>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => setDeletingAsset(null)} className="w-full"><X size={16} /> Cancelar</Button>
                    <Button variant="danger" onClick={confirmDelete} className="w-full"><Check size={16} /> Sim, Excluir</Button>
                </div>
             </Card>
        </div>
    )
  );

  return (
    <div className="space-y-6 pb-24">
      {renderTabs()}
      {renderConfirmationDialog()}
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
                    <button onClick={() => handleDeleteClick(printer.id, 'printer')} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors z-20"><Trash2 size={18} /></button>
                    <div className="mb-4"><Input label="Modelo/Nome" value={printer.name} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'name', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Preço" type="number" value={printer.acquisitionCost} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'acquisitionCost', e.target.value)} subLabel={settings.currencySymbol} />
                      <Input label="Vida Útil" type="number" value={printer.lifespanHours} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'lifespanHours', e.target.value)} subLabel="Horas" />
                      <Input label="Potência" type="number" value={printer.powerConsumption} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'powerConsumption', e.target.value)} subLabel="Watts" />
                      <Input label="Manut." type="number" value={printer.maintenanceCostPerHour} onChange={(e) => handleAssetUpdate(printer.id, 'printer', 'maintenanceCostPerHour', e.target.value)} subLabel={`${settings.currencySymbol}/h`} />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100"><p className="text-xs text-gray-500">Depreciação: <span className="text-gray-900 font-mono font-medium">{(Number(printer.acquisitionCost) / Number(printer.lifespanHours) || 0).toFixed(2)}/h</span></p></div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-900">Filamentos e Resinas</h2><Button onClick={() => addAsset('material')}><Plus size={18} /> Add Material</Button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(material => {
                const stockPercentage = (Number(material.currentStock) && Number(material.spoolWeight)) ? (Number(material.currentStock) / Number(material.spoolWeight)) * 100 : 0;
                return (
                    <Card key={material.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                        <div className="flex-grow">
                            <button onClick={() => handleDeleteClick(material.id, 'material')} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors z-20"><Trash2 size={18} /></button>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2"><Input label="Nome/Marca/Cor" value={material.name} onChange={(e) => handleAssetUpdate(material.id, 'material', 'name', e.target.value)} /></div>
                                <div className="col-span-2"><Select label="Tipo" value={material.type} onChange={(e) => handleAssetUpdate(material.id, 'material', 'type', e.target.value)} options={Object.values(MaterialType).map(t => ({ value: t, label: t }))} /></div>
                                <Input label="Preço do Rolo" type="number" value={material.spoolPrice} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolPrice', e.target.value)} subLabel={settings.currencySymbol} />
                                <Input label="Peso Total" type="number" value={material.spoolWeight} onChange={(e) => handleAssetUpdate(material.id, 'material', 'spoolWeight', e.target.value)} subLabel="g" />
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100"><p className="text-xs text-gray-500">Custo por grama: <span className="text-gray-900 font-mono font-medium">{(Number(material.spoolPrice) / Number(material.spoolWeight) || 0).toFixed(4)}</span></p></div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <Input label="Estoque Atual" type="number" value={material.currentStock || 0} onChange={(e) => handleAssetUpdate(material.id, 'material', 'currentStock', e.target.value)} subLabel="g" />
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${stockPercentage}%` }}></div>
                            </div>
                             <p className="text-xs text-right text-gray-500 mt-1">{stockPercentage.toFixed(0)}% restante</p>
                        </div>
                    </Card>
                )}
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
            <Card title="Configuração Global" className="max-w-md mx-auto">
                <div className="space-y-4">
                    <Input label="Custo de Energia" subLabel={`(${settings.currencySymbol || 'R$'}) por kWh`} type="number" step="0.01" value={settings.electricityCost} onChange={(e) => handleAssetUpdate(null, 'settings', 'electricityCost', e.target.value)} />
                    <Input label="Símbolo da Moeda" value={settings.currencySymbol} onChange={(e) => handleAssetUpdate(null, 'settings', 'currencySymbol', e.target.value)} />
                </div>
            </Card>
        )}
      </div>

      {isDirty && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl p-4 z-40">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle className="text-blue-500" size={24}/>
                    <div>
                        <h4 className="font-bold text-gray-800">Você tem alterações não salvas.</h4>
                        <p className="text-sm text-gray-500">Salve suas alterações para não perdê-las.</p>
                    </div>
                </div>
                <Button onClick={saveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2"/>} 
                    Salvar Alterações
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};