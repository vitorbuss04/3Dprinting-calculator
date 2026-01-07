import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Printer as PrinterIcon, Package } from 'lucide-react';
import { Printer, Material, MaterialType, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Input, Button, Select } from './UIComponents';

export const AssetsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printers' | 'materials' | 'settings'>('printers');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: 'R$' });

  // Load data
  useEffect(() => {
    setPrinters(StorageService.getPrinters());
    setMaterials(StorageService.getMaterials());
    setSettings(StorageService.getSettings());
  }, []);

  // Save Handlers
  const savePrinters = (newPrinters: Printer[]) => {
    setPrinters(newPrinters);
    StorageService.savePrinters(newPrinters);
  };

  const saveMaterials = (newMaterials: Material[]) => {
    setMaterials(newMaterials);
    StorageService.saveMaterials(newMaterials);
  };

  const saveSettings = () => {
    StorageService.saveSettings(settings);
    alert('Settings saved!');
  };

  // --- Actions ---

  const addPrinter = () => {
    const newPrinter: Printer = {
      id: crypto.randomUUID(),
      name: 'New Printer',
      acquisitionCost: 2000,
      lifespanHours: 3000,
      powerConsumption: 300,
      maintenanceCostPerHour: 2
    };
    savePrinters([...printers, newPrinter]);
  };

  const removePrinter = (id: string) => {
    if (confirm('Delete this printer?')) {
      savePrinters(printers.filter(p => p.id !== id));
    }
  };

  const updatePrinter = (id: string, field: keyof Printer, value: string | number) => {
    const updated = printers.map(p => p.id === id ? { ...p, [field]: value } : p);
    savePrinters(updated);
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      type: MaterialType.PLA,
      name: 'Generic PLA',
      spoolPrice: 120,
      spoolWeight: 1000,
      currentStock: 1000
    };
    saveMaterials([...materials, newMaterial]);
  };

  const removeMaterial = (id: string) => {
    if (confirm('Delete this material?')) {
      saveMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (id: string, field: keyof Material, value: string | number) => {
    const updated = materials.map(m => m.id === id ? { ...m, [field]: value } : m);
    saveMaterials(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('printers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'printers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <PrinterIcon size={18} /> Printers
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'materials' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Package size={18} /> Materials
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Save size={18} /> Settings
        </button>
      </div>

      {activeTab === 'printers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Printer Profiles</h2>
            <Button onClick={addPrinter}><Plus size={18} /> Add Printer</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map(printer => (
              <Card key={printer.id} className="relative group">
                <button
                  onClick={() => removePrinter(printer.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-4">
                  <Input
                    label="Model Name"
                    value={printer.name}
                    onChange={(e) => updatePrinter(printer.id, 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price"
                    type="number"
                    value={printer.acquisitionCost}
                    onChange={(e) => updatePrinter(printer.id, 'acquisitionCost', parseFloat(e.target.value))}
                    subLabel={settings.currencySymbol}
                  />
                  <Input
                    label="Lifespan"
                    type="number"
                    value={printer.lifespanHours}
                    onChange={(e) => updatePrinter(printer.id, 'lifespanHours', parseFloat(e.target.value))}
                    subLabel="Hours"
                  />
                  <Input
                    label="Power"
                    type="number"
                    value={printer.powerConsumption}
                    onChange={(e) => updatePrinter(printer.id, 'powerConsumption', parseFloat(e.target.value))}
                    subLabel="Watts"
                  />
                  <Input
                    label="Maint."
                    type="number"
                    value={printer.maintenanceCostPerHour}
                    onChange={(e) => updatePrinter(printer.id, 'maintenanceCostPerHour', parseFloat(e.target.value))}
                    subLabel={`${settings.currencySymbol}/h`}
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    Depreciation: <span className="text-slate-200 font-mono">{(printer.acquisitionCost / printer.lifespanHours).toFixed(2)}/h</span>
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
            <h2 className="text-xl font-bold text-white">Filament & Resin</h2>
            <Button onClick={addMaterial}><Plus size={18} /> Add Material</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(material => (
              <Card key={material.id} className="relative">
                <button
                  onClick={() => removeMaterial(material.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-2 gap-3 mb-3">
                   <div className="col-span-2">
                     <Input
                        label="Name/Brand/Color"
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                      />
                   </div>
                   <div className="col-span-2">
                    <Select
                      label="Type"
                      value={material.type}
                      onChange={(e) => updateMaterial(material.id, 'type', e.target.value)}
                      options={Object.values(MaterialType).map(t => ({ value: t, label: t }))}
                    />
                   </div>
                  <Input
                    label="Spool Price"
                    type="number"
                    value={material.spoolPrice}
                    onChange={(e) => updateMaterial(material.id, 'spoolPrice', parseFloat(e.target.value))}
                    subLabel={settings.currencySymbol}
                  />
                  <Input
                    label="Weight"
                    type="number"
                    value={material.spoolWeight}
                    onChange={(e) => updateMaterial(material.id, 'spoolWeight', parseFloat(e.target.value))}
                    subLabel="g"
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    Cost per gram: <span className="text-slate-200 font-mono">{(material.spoolPrice / material.spoolWeight).toFixed(4)}</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card title="Global Configuration" className="max-w-md">
          <Input
            label="Electricity Cost"
            subLabel="per kWh"
            type="number"
            step="0.01"
            value={settings.electricityCost}
            onChange={(e) => setSettings({ ...settings, electricityCost: parseFloat(e.target.value) })}
          />
          <Input
            label="Currency Symbol"
            value={settings.currencySymbol}
            onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
          />
          <Button onClick={saveSettings} className="w-full mt-4">Save Global Settings</Button>
        </Card>
      )}
    </div>
  );
};