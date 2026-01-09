import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Loader2, Zap } from 'lucide-react';
import { Printer, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Select, Input, neuShadowIn } from './UIComponents';

export const Comparator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);
  const [printerAId, setPrinterAId] = useState('');
  const [printerBId, setPrinterBId] = useState('');
  const [hoursA, setHoursA] = useState(10);
  const [hoursB, setHoursB] = useState(4); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [p, s] = await Promise.all([StorageService.getPrinters(), StorageService.getSettings()]);
      setPrinters(p); setSettings(s);
      if (p.length >= 1) setPrinterAId(p[0].id);
      if (p.length >= 2) setPrinterBId(p[1].id);
      setLoading(false);
    };
    fetchData();
  }, []);

  const calculateCost = (printerId: string, hours: number) => {
    const p = printers.find(x => x.id === printerId);
    if (!p) return 0;
    return ((p.acquisitionCost / p.lifespanHours) + ((p.powerConsumption / 1000) * settings.electricityCost) + p.maintenanceCostPerHour) * hours;
  };

  const costA = calculateCost(printerAId, hoursA);
  const costB = calculateCost(printerBId, hoursB);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="h-full flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f0f0f0] shadow-lg shrink-0">
        <div className={`p-3 ${neuShadowIn} rounded-xl text-blue-600`}><ArrowRightLeft size={20} /></div>
        <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">ROI Analysis: Lento vs Rápido</p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { id: printerAId, setId: setPrinterAId, hours: hoursA, setH: setHoursA, cost: costA, label: 'Cenário A', color: 'blue' },
          { id: printerBId, setId: setPrinterBId, hours: hoursB, setH: setHoursB, cost: costB, label: 'Cenário B', color: 'purple' }
        ].map((c, i) => (
          <Card key={i} title={c.label} className={`border-t-4 border-${c.color}-500`}>
            <div className="flex flex-col h-full justify-center gap-4">
              <Select label="Equipamento" options={printers.map(p => ({ value: p.id, label: p.name }))} value={c.id} onChange={(e) => c.setId(e.target.value)} />
              <Input label="Estimativa H" type="number" value={c.hours} onChange={(e) => c.setH(Number(e.target.value))} />
              <div className={`mt-4 p-4 rounded-2xl ${neuShadowIn} text-center`}>
                <p className="text-[0.55rem] font-black text-gray-400 uppercase mb-1">Custo Total</p>
                <p className={`text-2xl font-black text-${c.color}-600`}>{settings.currencySymbol} {c.cost.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className={`p-6 rounded-3xl bg-[#f0f0f0] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] text-center shrink-0`}>
         <Zap size={20} className="mx-auto text-emerald-500 mb-2" />
         <p className="text-lg font-black text-gray-700 uppercase tracking-tight">
           Cenário <span className={costA < costB ? "text-blue-600" : "text-purple-600"}>{costA < costB ? "A" : "B"}</span> é o vencedor por <span className="text-emerald-500">{settings.currencySymbol} {Math.abs(costA - costB).toFixed(2)}</span>
         </p>
      </div>
    </div>
  );
};
