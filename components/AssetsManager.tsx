import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2 } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';

export const AssetsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>('printers');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: 'R$' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, m, s] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings()
      ]);
      setPrinters(p);
      setMaterials(m);
      setSettings(s);
    } catch (error) {
      console.error("Failed to load assets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveSettings = async () => {
    try {
      await StorageService.saveSettings(settings);
      alert('Configurações salvas!');
    } catch (e) {
      alert('Erro ao salvar configurações.');
    }
  };

  const addPrinter = async () => {
    const newPrinter: Printer = {
      id: crypto.randomUUID(),
      name: 'Nova Impressora',
      acquisitionCost: 2000,
      lifespanHours: 3000,
      powerConsumption: 300,
      maintenanceCostPerHour: 2
    };
    setPrinters([...printers, newPrinter]);
    await StorageService.addPrinter(newPrinter);
  };

  const removePrinter = async (id: string) => {
    if (confirm('Excluir esta impressora?')) {
      const old = [...printers];
      setPrinters(printers.filter(p => p.id !== id));
      try {
        await StorageService.deletePrinter(id);
      } catch (e) {
        setPrinters(old);
        alert('Erro ao excluir.');
      }
    }
  };

  const updatePrinter = async (id: string, field: keyof Printer, value: string | number) => {
    const updatedPrinters = printers.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPrinters(updatedPrinters);
    const p = updatedPrinters.find(p => p.id === id);
    if(p) await StorageService.updatePrinter(p);
  };

  const addMaterial = async () => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      type: MaterialType.PLA,
      name: 'PLA Genérico',
      spoolPrice: 120,
      spoolWeight: 1000,
      currentStock: 1000
    };
    setMaterials([...materials, newMaterial]);
    await StorageService.addMaterial(newMaterial);
  };

  const removeMaterial = async (id: string) => {
    if (confirm('Excluir este material?')) {
      const old = [...materials];
      setMaterials(materials.filter(m => m.id !== id));
      try {
        await StorageService.deleteMaterial(id);
      } catch (e) {
        setMaterials(old);
        alert('Erro ao excluir.');
      }
    }
  };

  const updateMaterial = async (id: string, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map(m => m.id === id ? { ...m, [field]: value } : m);
    setMaterials(updatedMaterials);
    const m = updatedMaterials.find(m => m.id === id);
    if(m) await StorageService.updateMaterial(m);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('printers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors font-medium ${activeTab === 'printers' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <PrinterIcon size={18} /> Impressoras
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors font-medium ${activeTab === 'materials' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Package size={18} /> Materiais
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Save size={18} /> Configurações
        </button>
      </div>

      {activeTab === 'printers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Perfis de Impressora</h2>
            <Button onClick={addPrinter}><Plus size={18} /> Add Impressora</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map(printer => (
              <Card key={printer.id} className="relative group hover:shadow-md transition-shadow">
                <button
                  onClick={() => removePrinter(printer.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-4">
                  <Input
                    label="Modelo/Nome"
                    value={printer.name}
                    onChange={(e) => updatePrinter(printer.id, 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Preço"
                    type="number"
                    value={printer.acquisitionCost}
                    onChange={(e) => updatePrinter(printer.id, 'acquisitionCost', parseFloat(e.target.value))}
                    subLabel={settings.currencySymbol}
                  />
                  <Input
                    label="Vida Útil"
                    type="number"
                    value={printer.lifespanHours}
                    onChange={(e) => updatePrinter(printer.id, 'lifespanHours', parseFloat(e.target.value))}
                    subLabel="Horas"
                  />
                  <Input
                    label="Potência"
                    type="number"
                    value={printer.powerConsumption}
                    onChange={(e) => updatePrinter(printer.id, 'powerConsumption', parseFloat(e.target.value))}
                    subLabel="Watts"
                  />
                  <Input
                    label="Manut."
                    type="number"
                    value={printer.maintenanceCostPerHour}
                    onChange={(e) => updatePrinter(printer.id, 'maintenanceCostPerHour', parseFloat(e.target.value))}
                    subLabel={`${settings.currencySymbol}/h`}
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Depreciação: <span className="text-gray-900 font-mono font-medium">{(printer.acquisitionCost / printer.lifespanHours).toFixed(2)}/h</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Filamentos e Resinas</h2>
            <Button onClick={addMaterial}><Plus size={18} /> Add Material</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(material => (
              <Card key={material.id} className="relative hover:shadow-md transition-shadow">
                <button
                  onClick={() => removeMaterial(material.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-2 gap-3 mb-3">
                   <div className="col-span-2">
                     <Input
                        label="Nome/Marca/Cor"
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                      />
                   </div>
                   <div className="col-span-2">
                    <Select
                      label="Tipo"
                      value={material.type}
                      onChange={(e) => updateMaterial(material.id, 'type', e.target.value)}
                      options={Object.values(MaterialType).map(t => ({ value: t, label: t }))}
                    />
                   </div>
                  <Input
                    label="Preço do Rolo"
                    type="number"
                    value={material.spoolPrice}
                    onChange={(e) => updateMaterial(material.id, 'spoolPrice', parseFloat(e.target.value))}
                    subLabel={settings.currencySymbol}
                  />
                  <Input
                    label="Peso"
                    type="number"
                    value={material.spoolWeight}
                    onChange={(e) => updateMaterial(material.id, 'spoolWeight', parseFloat(e.target.value))}
                    subLabel="g"
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Custo por grama: <span className="text-gray-900 font-mono font-medium">{(material.spoolPrice / material.spoolWeight).toFixed(4)}</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card title="Configuração Global" className="max-w-md">
          <Input
            label="Custo de Energia"
            subLabel="por kWh"
            type="number"
            step="0.01"
            value={settings.electricityCost}
            onChange={(e) => setSettings({ ...settings, electricityCost: parseFloat(e.target.value) })}
          />
          <Input
            label="Símbolo da Moeda"
            value={settings.currencySymbol}
            onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
          />
          <Button onClick={saveSettings} className="w-full mt-4">Salvar Configurações Globais</Button>
        </Card>
      )}
    </div>
  );
};