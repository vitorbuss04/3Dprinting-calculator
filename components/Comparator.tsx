import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { Printer, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Select, Input } from './UIComponents';

export const Comparator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);

  const [printerAId, setPrinterAId] = useState('');
  const [printerBId, setPrinterBId] = useState('');

  // Scenario
  const [hoursA, setHoursA] = useState(10);
  const [hoursB, setHoursB] = useState(4); // Default assumption: B is faster

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [p, s] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getSettings()
      ]);
      setPrinters(p);
      setSettings(s);
      if (p.length >= 1) setPrinterAId(p[0].id);
      if (p.length >= 2) setPrinterBId(p[1].id);
      else if (p.length === 1) setPrinterBId(p[0].id);
      setLoading(false);
    };
    fetchData();
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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <ArrowRightLeft size={24} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparador de Máquinas</h2>
          <p className="text-gray-500">É mais barato imprimir lento numa máquina barata ou rápido numa máquina cara?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Machine A */}
        <Card title="Cenário A" className="border-l-4 border-l-blue-500 bg-white">
           <Select
              label="Selecionar Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerAId}
              onChange={(e) => setPrinterAId(e.target.value)}
           />
           <Input
              label="Tempo de Impressão Estimado (Horas)"
              type="number"
              value={hoursA}
              onChange={(e) => setHoursA(Number(e.target.value))}
           />
           <div className="mt-8 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm">Custo Operacional</p>
              <p className="text-3xl font-bold text-blue-600">{settings.currencySymbol} {costA.toFixed(2)}</p>
           </div>
        </Card>

        {/* Machine B */}
        <Card title="Cenário B" className="border-l-4 border-l-purple-500 bg-white">
           <Select
              label="Selecionar Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerBId}
              onChange={(e) => setPrinterBId(e.target.value)}
           />
           <Input
              label="Tempo de Impressão Estimado (Horas)"
              type="number"
              value={hoursB}
              onChange={(e) => setHoursB(Number(e.target.value))}
           />
           <div className="mt-8 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm">Custo Operacional</p>
              <p className="text-3xl font-bold text-purple-600">{settings.currencySymbol} {costB.toFixed(2)}</p>
           </div>
        </Card>
      </div>

      {/* Verdict */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
         <h3 className="text-gray-500 mb-2 uppercase tracking-wide text-sm font-bold">Veredito</h3>
         {Math.abs(costA - costB) < 0.05 ? (
           <p className="text-xl text-gray-900">Os custos são praticamente iguais.</p>
         ) : (
           <div>
             <p className="text-2xl text-gray-900">
               O Cenário <span className={costA < costB ? "text-blue-600 font-bold" : "text-purple-600 font-bold"}>
                 {costA < costB ? "A" : "B"}
               </span> é mais barato por <span className="text-emerald-600 font-bold">{settings.currencySymbol} {Math.abs(costA - costB).toFixed(2)}</span>
             </p>
           </div>
         )}
      </div>
    </div>
  );
};