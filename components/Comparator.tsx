import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Printer, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Select, Input } from './UIComponents';

export const Comparator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });

  const [printerAId, setPrinterAId] = useState('');
  const [printerBId, setPrinterBId] = useState('');

  // Scenario
  const [hoursA, setHoursA] = useState(10);
  const [hoursB, setHoursB] = useState(4); // Default assumption: B is faster

  useEffect(() => {
    const p = StorageService.getPrinters();
    setPrinters(p);
    setSettings(StorageService.getSettings());
    if (p.length >= 1) setPrinterAId(p[0].id);
    if (p.length >= 2) setPrinterBId(p[1].id);
    else if (p.length === 1) setPrinterBId(p[0].id);
  }, []);

  const calculateCost = (printerId: string, hours: number) => {
    const p = printers.find(x => x.id === printerId);
    if (!p) return 0;
    const depr = (p.acquisitionCost / p.lifespanHours) * hours;
    const energy = (p.powerConsumption / 1000) * settings.electricityCost * hours;
    const maint = p.maintenanceCostPerHour * hours;
    return depr + energy + maint;
  };

  const costA = calculateCost(printerAId, hoursA);
  const costB = calculateCost(printerBId, hoursB);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600 rounded-lg">
          <ArrowRightLeft size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Machine Comparator</h2>
          <p className="text-slate-400">Is it cheaper to print slow on a cheap machine, or fast on an expensive one?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Machine A */}
        <Card title="Scenario A" className="border-l-4 border-l-blue-500">
           <Select
              label="Select Printer"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerAId}
              onChange={(e) => setPrinterAId(e.target.value)}
           />
           <Input
              label="Estimated Print Time (Hours)"
              type="number"
              value={hoursA}
              onChange={(e) => setHoursA(Number(e.target.value))}
           />
           <div className="mt-8 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">Operational Cost</p>
              <p className="text-3xl font-bold text-blue-400">{settings.currencySymbol} {costA.toFixed(2)}</p>
           </div>
        </Card>

        {/* Machine B */}
        <Card title="Scenario B" className="border-l-4 border-l-purple-500">
           <Select
              label="Select Printer"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerBId}
              onChange={(e) => setPrinterBId(e.target.value)}
           />
           <Input
              label="Estimated Print Time (Hours)"
              type="number"
              value={hoursB}
              onChange={(e) => setHoursB(Number(e.target.value))}
           />
           <div className="mt-8 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">Operational Cost</p>
              <p className="text-3xl font-bold text-purple-400">{settings.currencySymbol} {costB.toFixed(2)}</p>
           </div>
        </Card>
      </div>

      {/* Verdict */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
         <h3 className="text-slate-400 mb-2 uppercase tracking-wide text-sm font-bold">Verdict</h3>
         {Math.abs(costA - costB) < 0.05 ? (
           <p className="text-xl text-white">Costs are effectively the same.</p>
         ) : (
           <div>
             <p className="text-2xl text-white">
               Scenario <span className={costA < costB ? "text-blue-400 font-bold" : "text-purple-400 font-bold"}>
                 {costA < costB ? "A" : "B"}
               </span> is cheaper by <span className="text-emerald-400 font-bold">{settings.currencySymbol} {Math.abs(costA - costB).toFixed(2)}</span>
             </p>
           </div>
         )}
      </div>
    </div>
  );
};