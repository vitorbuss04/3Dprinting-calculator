import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package, Loader2, Settings2 } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select, neuShadowIn, neuShadowOut, neuMain } from './UIComponents';

export const AssetsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>('printers');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: 'R$' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [p, m, s] = await Promise.all([StorageService.getPrinters(), StorageService.getMaterials(), StorageService.getSettings()]);
    setPrinters(p); setMaterials(m); setSettings(s);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const saveSettings = async () => {
    try { await StorageService.saveSettings(settings); alert('Atualizado!'); } catch (e) { alert('Erro'); }
  };

  const addPrinter = async () => {
    const p: Printer = { id: crypto.randomUUID(), name: 'Nova Máquina', acquisitionCost: 2000, lifespanHours: 3000, powerConsumption: 300, maintenanceCostPerHour: 2 };
    setPrinters([...printers, p]); await StorageService.addPrinter(p);
  };

  const removePrinter = async (id: string) => {
    if (confirm('Remover?')) {
      setPrinters(printers.filter(p => p.id !== id)); await StorageService.deletePrinter(id);
    }
  };

  const updatePrinter = async (id: string, field: keyof Printer, value: any) => {
    const updated = printers.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPrinters(updated); const found = updated.find(p => p.id === id); if(found) await StorageService.updatePrinter(found);
  };

  const addMaterial = async () => {
    const m: Material = { id: crypto.randomUUID(), type: MaterialType.PLA, name: 'Filamento', spoolPrice: 120, spoolWeight: 1000, currentStock: 1000 };
    setMaterials([...materials, m]); await StorageService.addMaterial(m);
  };

  const removeMaterial = async (id: string) => {
    if (confirm('Remover?')) {
      setMaterials(materials.filter(m => m.id !== id)); await StorageService.deleteMaterial(id);
    }
  };

  const updateMaterial = async (id: string, field: keyof Material, value: any) => {
    const updated = materials.map(m => m.id === id ? { ...m, [field]: value } : m);
    setMaterials(updated); const found = updated.find(m => m.id === id); if(found) await StorageService.updateMaterial(found);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="h-full flex flex-col gap-6 min-h-0">
      <div className={`flex gap-4 p-3 rounded-2xl ${neuShadowIn} max-w-lg shrink-0`}>
        {[{ id: 'printers', label: 'Máquinas', icon: PrinterIcon }, { id: 'materials', label: 'Insumos', icon: Package }, { id: 'settings', label: 'Geral', icon: Settings2 }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-black text-[0.6rem] uppercase tracking-widest ${activeTab === tab.id ? `bg-blue-600 text-white shadow-lg` : 'text-gray-400'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'printers' && (
          <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Inventário de Hardware</h2>
              <Button onClick={addPrinter} variant="primary"><Plus size={14} /> Adicionar</Button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {printers.map(printer => (
                <Card key={printer.id} className="relative group border-t-2 border-blue-500">
                  <button onClick={() => removePrinter(printer.id)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  <Input label="Nome" value={printer.name} onChange={(e) => updatePrinter(printer.id, 'name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Preço" type="number" value={printer.acquisitionCost} onChange={(e) => updatePrinter(printer.id, 'acquisitionCost', parseFloat(e.target.value))} />
                    <Input label="Vida H" type="number" value={printer.lifespanHours} onChange={(e) => updatePrinter(printer.id, 'lifespanHours', parseFloat(e.target.value))} />
                  </div>
                  <div className={`mt-2 p-3 rounded-xl ${neuShadowIn} text-center`}><p className="text-[0.6rem] font-black text-blue-600 uppercase tracking-tighter">{settings.currencySymbol} {(printer.acquisitionCost / printer.lifespanHours).toFixed(2)} /h</p></div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Banco de Materiais</h2>
              <Button onClick={addMaterial} variant="secondary"><Plus size={14} /> Novo</Button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {materials.map(material => (
                <Card key={material.id} className="relative group border-t-2 border-emerald-500">
                  <button onClick={() => removeMaterial(material.id)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  <Input label="Nome" value={material.name} onChange={(e) => updateMaterial(material.id, 'name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Preço" type="number" value={material.spoolPrice} onChange={(e) => updateMaterial(material.id, 'spoolPrice', parseFloat(e.target.value))} />
                    <Input label="Massa(g)" type="number" value={material.spoolWeight} onChange={(e) => updateMaterial(material.id, 'spoolWeight', parseFloat(e.target.value))} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full flex items-center justify-center">
            <Card title="Ajustes de Infra" className="max-w-md w-full">
              <div className="space-y-6">
                <Input label="Energia (kWh)" type="number" step="0.01" value={settings.electricityCost} onChange={(e) => setSettings({ ...settings, electricityCost: parseFloat(e.target.value) })} />
                <Input label="Símbolo" value={settings.currencySymbol} onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })} />
                <Button onClick={saveSettings} className="w-full bg-blue-600 text-white py-4"><Save size={18} /> Salvar Tudo</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
