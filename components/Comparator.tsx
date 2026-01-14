import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Loader2, Zap, Wrench, TrendingDown, AlertCircle, CheckCircle2, Trophy } from 'lucide-react';
import { Printer, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card, Select, Input } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Comparator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);

  const [printerAId, setPrinterAId] = useState('');
  const [printerBId, setPrinterBId] = useState('');

  // Scenario
  const [hoursA, setHoursA] = useState('10');
  const [hoursB, setHoursB] = useState('10'); // Both sides default to 10 now

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

  const calculateMachineCosts = (printerId: string, hoursStr: string) => {
    const hours = parseFloat(hoursStr.replace(',', '.')); // Handle commas if user types them
    const h = isNaN(hours) ? 0 : hours;
    const p = printers.find(x => x.id === printerId);
    if (!p) return { total: 0, depreciation: 0, energy: 0, maintenance: 0 };

    // Simple straight-line depreciation per hour based on lifespan
    const depreciation = (p.acquisitionCost / p.lifespanHours) * h;
    // Energy in kWh * cost per kWh
    const energy = (p.powerConsumption / 1000) * settings.electricityCost * h;
    // Maintenance cost
    const maintenance = p.maintenanceCostPerHour * h;

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

  const diff = Math.abs(costA.total - costB.total);
  const winner = costA.total < costB.total ? 'A' : (costB.total < costA.total ? 'B' : 'Tie');

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-8">
      <Card className="flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <ArrowRightLeft size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Comparador de Custos</h2>
          <p className="text-blue-100 font-medium text-sm mt-0.5">Simule e compare a rentabilidade de diferentes cenários.</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Machine A */}
        {/* Machine A */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-blue-200 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">A</span>
              Cenário A
            </h3>
            {winner === 'A' && <Trophy size={20} className="text-yellow-500 animate-pulse" />}
          </div>

          <div className="space-y-4">
            <Select
              label="Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerAId}
              onChange={(e) => setPrinterAId(e.target.value)}
            />
            <Input
              label="Tempo (Horas)"
              type="number"
              min="0"
              value={hoursA}
              onChange={(e) => setHoursA(e.target.value)}
            />
          </div>

          <div className="mt-8 space-y-3">
            <CostRow label="Depreciação" value={costA.depreciation} icon={TrendingDown} color="text-slate-500" symbol={settings.currencySymbol} />
            <CostRow label="Energia" value={costA.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} />
            <CostRow label="Manutenção" value={costA.maintenance} icon={Wrench} color="text-slate-500" symbol={settings.currencySymbol} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Custo Total</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-blue-600 transition-colors">
              {settings.currencySymbol} {costA.total.toFixed(2)}
            </p>
          </div>
        </Card>

        {/* Machine B */}
        {/* Machine B */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-purple-200 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-sm">B</span>
              Cenário B
            </h3>
            {winner === 'B' && <Trophy size={20} className="text-yellow-500 animate-pulse" />}
          </div>

          <div className="space-y-4">
            <Select
              label="Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerBId}
              onChange={(e) => setPrinterBId(e.target.value)}
            />
            <Input
              label="Tempo (Horas)"
              type="number"
              min="0"
              value={hoursB}
              onChange={(e) => setHoursB(e.target.value)}
            />
          </div>

          <div className="mt-8 space-y-3">
            <CostRow label="Depreciação" value={costB.depreciation} icon={TrendingDown} color="text-slate-500" symbol={settings.currencySymbol} />
            <CostRow label="Energia" value={costB.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} />
            <CostRow label="Manutenção" value={costB.maintenance} icon={Wrench} color="text-slate-500" symbol={settings.currencySymbol} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Custo Total</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-purple-600 transition-colors">
              {settings.currencySymbol} {costB.total.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Verdict */}
      <div className={`mt-8 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border ${winner === 'Tie' ? 'bg-gray-50 border-gray-200' :
        winner === 'A' ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100' :
          'bg-gradient-to-r from-purple-50 to-white border-purple-100'
        }`}>
        <div className={`flex-shrink-0 p-4 rounded-full ${winner === 'Tie' ? 'bg-gray-200' :
          winner === 'A' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
          }`}>
          {winner === 'Tie' ? <AlertCircle size={32} /> : <Trophy size={32} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Veredito da Análise</h3>
          {diff < 0.05 ? (
            <p className="text-gray-600">Os custos operacionais são praticamente equivalentes para ambos os cenários.</p>
          ) : (
            <p className="text-gray-600 text-lg">
              O Cenário <strong className={winner === 'A' ? 'text-blue-600' : 'text-purple-600'}>{winner}</strong> é a opção mais econômica,
              poupando <strong className="text-emerald-600">{settings.currencySymbol} {diff.toFixed(2)}</strong> em relação ao outro cenário.
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card title="Detalhamento dos Custos">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                stroke="#e5e7eb"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="transparent"
                tickFormatter={(value) => `${settings.currencySymbol}${value}`}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                formatter={(value: number) => [
                  <span className="font-bold text-gray-700">{settings.currencySymbol} {value.toFixed(2)}</span>,
                  ''
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar dataKey="Cenário A" name="Cenário A" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
              <Bar dataKey="Cenário B" name="Cenário B" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const CostRow = ({ label, value, icon: Icon, color, symbol }: { label: string, value: number, icon: any, color: string, symbol: string }) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-3">
      <Icon size={16} className={color} />
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-mono text-gray-900 font-medium">{symbol} {value.toFixed(2)}</span>
  </div>
);
