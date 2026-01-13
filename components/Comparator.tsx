import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { Printer, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Select, Input } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const calculateMachineCosts = (printerId: string, hours: number) => {
    const p = printers.find(x => x.id === printerId);
    if (!p) return { total: 0, depreciation: 0, energy: 0, maintenance: 0 };
    
    const depreciation = (p.acquisitionCost / p.lifespanHours) * hours;
    const energy = (p.powerConsumption / 1000) * settings.electricityCost * hours;
    const maintenance = p.maintenanceCostPerHour * hours;
    const total = depreciation + energy + maintenance;
    
    return { total, depreciation, energy, maintenance };
  };

  const costA = useMemo(() => calculateMachineCosts(printerAId, hoursA), [printerAId, hoursA, printers, settings]);
  const costB = useMemo(() => calculateMachineCosts(printerBId, hoursB), [printerBId, hoursB, printers, settings]);

  const comparisonData = [
    { name: 'Depreciação', 'Cenário A': costA.depreciation, 'Cenário B': costB.depreciation },
    { name: 'Energia', 'Cenário A': costA.energy, 'Cenário B': costB.energy },
    { name: 'Manutenção', 'Cenário A': costA.maintenance, 'Cenário B': costB.maintenance },
  ];

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <ArrowRightLeft size={24} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparador de Custos Operacionais</h2>
          <p className="text-gray-500">Análise detalhada de custos entre duas configurações de impressão.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Machine A */}
        <Card title="Cenário A" className="border-l-4 border-l-blue-500 bg-white shadow-sm">
           <Select
              label="Selecionar Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerAId}
              onChange={(e) => setPrinterAId(e.target.value)}
           />
           <Input
              label="Tempo de Impressão (Horas)"
              type="number"
              min="0"
              value={hoursA}
              onChange={(e) => setHoursA(Number(e.target.value))}
           />
           <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Depreciação:</span> <span className="font-mono">{settings.currencySymbol} {costA.depreciation.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Energia:</span> <span className="font-mono">{settings.currencySymbol} {costA.energy.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Manutenção:</span> <span className="font-mono">{settings.currencySymbol} {costA.maintenance.toFixed(2)}</span></div>
           </div>
           <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-gray-500 text-sm">Custo Operacional Total</p>
              <p className="text-3xl font-bold text-blue-600">{settings.currencySymbol} {costA.total.toFixed(2)}</p>
           </div>
        </Card>

        {/* Machine B */}
        <Card title="Cenário B" className="border-l-4 border-l-purple-500 bg-white shadow-sm">
           <Select
              label="Selecionar Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerBId}
              onChange={(e) => setPrinterBId(e.target.value)}
           />
           <Input
              label="Tempo de Impressão (Horas)"
              type="number"
              min="0"
              value={hoursB}
              onChange={(e) => setHoursB(Number(e.target.value))}
           />
           <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Depreciação:</span> <span className="font-mono">{settings.currencySymbol} {costB.depreciation.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Energia:</span> <span className="font-mono">{settings.currencySymbol} {costB.energy.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Manutenção:</span> <span className="font-mono">{settings.currencySymbol} {costB.maintenance.toFixed(2)}</span></div>
           </div>
           <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-gray-500 text-sm">Custo Operacional Total</p>
              <p className="text-3xl font-bold text-purple-600">{settings.currencySymbol} {costB.total.toFixed(2)}</p>
           </div>
        </Card>
      </div>

      {/* Verdict and Chart */}
      <Card title="Análise Comparativa">
        <div className="text-center mb-8">
            <h3 className="text-gray-500 mb-2 uppercase tracking-wide text-sm font-bold">Veredito</h3>
            {Math.abs(costA.total - costB.total) < 0.05 ? (
              <p className="text-xl text-gray-900">Os custos são praticamente idênticos.</p>
            ) : (
              <p className="text-2xl text-gray-900">
                O Cenário <span className={costA.total < costB.total ? "text-blue-600 font-bold" : "text-purple-600 font-bold"}>
                  {costA.total < costB.total ? "A" : "B"}
                </span> é mais econômico em <span className="text-emerald-600 font-bold">
                  {settings.currencySymbol} {Math.abs(costA.total - costB.total).toFixed(2)}
                </span>
              </p>
            )}
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" tickFormatter={(value) => `${settings.currencySymbol}${value}`} />
              <Tooltip
                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [value.toFixed(2), 'Custo']}
              />
              <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
              <Bar dataKey="Cenário A" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cenário B" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
