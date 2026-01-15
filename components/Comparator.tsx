import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Loader2, Zap, Wrench, TrendingDown, AlertCircle, Trophy, Scale, Package } from 'lucide-react';
import { Printer, GlobalSettings, Material } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../utils/cn';

export const Comparator: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ electricityCost: 0, currencySymbol: '$' });
  const [loading, setLoading] = useState(true);

  const [printerAId, setPrinterAId] = useState('');
  const [printerBId, setPrinterBId] = useState('');
  const [materialAId, setMaterialAId] = useState('');
  const [materialBId, setMaterialBId] = useState('');

  // Scenario - both default to 10 hours
  const [hoursA, setHoursA] = useState('10');
  const [hoursB, setHoursB] = useState('10');

  // Model weight defaults
  const [weightA, setWeightA] = useState('100');
  const [weightB, setWeightB] = useState('100');

  useEffect(() => {
    const fetchData = async () => {
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
        if (p.length >= 1) setPrinterAId(p[0].id);
        if (p.length >= 2) setPrinterBId(p[1].id);
        else if (p.length === 1) setPrinterBId(p[0].id);

        if (m.length >= 1) {
          setMaterialAId(m[0].id);
          setMaterialBId(m[0].id);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateCosts = (printerId: string, materialId: string, hoursStr: string, weightStr: string) => {
    const hours = parseFloat(hoursStr.replace(',', '.'));
    const h = isNaN(hours) ? 0 : hours;

    const weight = parseFloat(weightStr.replace(',', '.'));
    const w = isNaN(weight) ? 0 : weight;

    const p = printers.find(x => x.id === printerId);
    const m = materials.find(x => x.id === materialId);

    if (!p) return { total: 0, depreciation: 0, energy: 0, maintenance: 0, material: 0 };

    // Machine costs
    const depreciation = (p.acquisitionCost / p.lifespanHours) * h;
    const energy = (p.powerConsumption / 1000) * settings.electricityCost * h;
    const maintenance = p.maintenanceCostPerHour * h;

    // Material cost
    let materialCost = 0;
    if (m && m.spoolWeight > 0) {
      materialCost = (m.spoolPrice / m.spoolWeight) * w;
    }

    const total = depreciation + energy + maintenance + materialCost;

    return { total, depreciation, energy, maintenance, material: materialCost };
  };

  const costA = useMemo(() => calculateCosts(printerAId, materialAId, hoursA, weightA), [printerAId, materialAId, hoursA, weightA, printers, materials, settings]);
  const costB = useMemo(() => calculateCosts(printerBId, materialBId, hoursB, weightB), [printerBId, materialBId, hoursB, weightB, printers, materials, settings]);

  const comparisonData = [
    { name: 'Depreciação', 'Cenário A': costA.depreciation, 'Cenário B': costB.depreciation },
    { name: 'Energia', 'Cenário A': costA.energy, 'Cenário B': costB.energy },
    { name: 'Manutenção', 'Cenário A': costA.maintenance, 'Cenário B': costB.maintenance },
    { name: 'Material', 'Cenário A': costA.material, 'Cenário B': costB.material },
  ];

  const diff = Math.abs(costA.total - costB.total);
  const winner = costA.total < costB.total ? 'A' : (costB.total < costA.total ? 'B' : 'Tie');

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
          <Scale size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Comparador de Custos</h2>
          <p className="text-gray-500 dark:text-gray-400">Simule e compare a rentabilidade de diferentes cenários.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Machine A */}
        <Card variant="glass" className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-blue-300 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 dark:text-gray-100">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600 font-black text-base shadow-sm dark:bg-blue-500/20 dark:text-blue-400">A</span>
              Cenário A
            </h3>
            {winner === 'A' && <Trophy size={24} className="text-yellow-400 drop-shadow-sm animate-pulse" />}
          </div>

          <div className="space-y-5 bg-white/50 p-4 rounded-xl border border-white/40 dark:bg-white/5 dark:border-white/5">
            <Select
              label="Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerAId}
              onChange={(val) => setPrinterAId(val as string)}
            />
            <Input
              label="Tempo de Operação (Horas)"
              type="number"
              min="0"
              value={hoursA}
              onChange={(e) => setHoursA(e.target.value)}
            />
            <div className="border-t border-dashed border-gray-300 my-2 dark:border-gray-700"></div>
            <Select
              label="Material"
              options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
              value={materialAId}
              onChange={(val) => setMaterialAId(val as string)}
            />
            <Input
              label="Peso do Modelo (g)"
              type="number"
              min="0"
              value={weightA}
              onChange={(e) => setWeightA(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-3">
            <CostRow label="Depreciação" value={costA.depreciation} icon={TrendingDown} color="text-slate-500 dark:text-slate-400" symbol={settings.currencySymbol} barColor="bg-slate-200 dark:bg-slate-700" percentage={costA.total > 0 ? (costA.depreciation / costA.total) * 100 : 0} />
            <CostRow label="Energia" value={costA.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} barColor="bg-amber-200 dark:bg-amber-500/30" percentage={costA.total > 0 ? (costA.energy / costA.total) * 100 : 0} />
            <CostRow label="Manutenção" value={costA.maintenance} icon={Wrench} color="text-blue-500" symbol={settings.currencySymbol} barColor="bg-blue-200 dark:bg-blue-500/30" percentage={costA.total > 0 ? (costA.maintenance / costA.total) * 100 : 0} />
            <CostRow label="Material" value={costA.material} icon={Package} color="text-emerald-500" symbol={settings.currencySymbol} barColor="bg-emerald-200 dark:bg-emerald-500/30" percentage={costA.total > 0 ? (costA.material / costA.total) * 100 : 0} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100/50 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">Custo Total Estimado</p>
            <p className="text-4xl font-black text-gray-800 tracking-tighter group-hover:text-blue-600 transition-colors dark:text-gray-100 dark:group-hover:text-blue-400">
              {settings.currencySymbol} {costA.total.toFixed(2)}
            </p>
          </div>
        </Card>

        {/* Machine B */}
        <Card variant="glass" className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-purple-300 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 dark:text-gray-100">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 text-purple-600 font-black text-base shadow-sm dark:bg-purple-500/20 dark:text-purple-400">B</span>
              Cenário B
            </h3>
            {winner === 'B' && <Trophy size={24} className="text-yellow-400 drop-shadow-sm animate-pulse" />}
          </div>

          <div className="space-y-5 bg-white/50 p-4 rounded-xl border border-white/40 dark:bg-white/5 dark:border-white/5">
            <Select
              label="Impressora"
              options={printers.map(p => ({ value: p.id, label: p.name }))}
              value={printerBId}
              onChange={(val) => setPrinterBId(val as string)}
            />
            <Input
              label="Tempo de Operação (Horas)"
              type="number"
              min="0"
              value={hoursB}
              onChange={(e) => setHoursB(e.target.value)}
            />
            <div className="border-t border-dashed border-gray-300 my-2 dark:border-gray-700"></div>
            <Select
              label="Material"
              options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
              value={materialBId}
              onChange={(val) => setMaterialBId(val as string)}
            />
            <Input
              label="Peso do Modelo (g)"
              type="number"
              min="0"
              value={weightB}
              onChange={(e) => setWeightB(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-3">
            <CostRow label="Depreciação" value={costB.depreciation} icon={TrendingDown} color="text-slate-500 dark:text-slate-400" symbol={settings.currencySymbol} barColor="bg-slate-200 dark:bg-slate-700" percentage={costB.total > 0 ? (costB.depreciation / costB.total) * 100 : 0} />
            <CostRow label="Energia" value={costB.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} barColor="bg-amber-200 dark:bg-amber-500/30" percentage={costB.total > 0 ? (costB.energy / costB.total) * 100 : 0} />
            <CostRow label="Manutenção" value={costB.maintenance} icon={Wrench} color="text-blue-500" symbol={settings.currencySymbol} barColor="bg-blue-200 dark:bg-blue-500/30" percentage={costB.total > 0 ? (costB.maintenance / costB.total) * 100 : 0} />
            <CostRow label="Material" value={costB.material} icon={Package} color="text-emerald-500" symbol={settings.currencySymbol} barColor="bg-emerald-200 dark:bg-emerald-500/30" percentage={costB.total > 0 ? (costB.material / costB.total) * 100 : 0} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100/50 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">Custo Total Estimado</p>
            <p className="text-4xl font-black text-gray-800 tracking-tighter group-hover:text-purple-600 transition-colors dark:text-gray-100 dark:group-hover:text-purple-400">
              {settings.currencySymbol} {costB.total.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Verdict */}
      <div className={cn(
        "rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm border transition-colors duration-500 dark:border-white/10",
        winner === 'Tie' ? 'bg-gray-50 border-gray-200 dark:bg-white/5' :
          winner === 'A' ? 'bg-gradient-to-r from-blue-50/80 to-white border-blue-100 dark:from-blue-900/10 dark:to-dark-surface dark:border-blue-500/20' :
            'bg-gradient-to-r from-purple-50/80 to-white border-purple-100 dark:from-purple-900/10 dark:to-dark-surface dark:border-purple-500/20'
      )}>
        <div className={cn(
          "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-inner",
          winner === 'Tie' ? 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400' :
            winner === 'A' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
        )}>
          {winner === 'Tie' ? <AlertCircle size={32} /> : <Trophy size={32} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-gray-100">Veredito da Análise</h3>
          {diff < 0.05 ? (
            <p className="text-gray-600 dark:text-gray-400">Os custos operacionais são praticamente <strong className="text-gray-800 dark:text-white">equivalentes</strong> para ambos os cenários.</p>
          ) : (
            <p className="text-gray-600 text-lg leading-relaxed dark:text-gray-400">
              O Cenário <strong className={cn("px-2 py-0.5 rounded-md mx-1", winner === 'A' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300')}>{winner}</strong>
              é a opção mais econômica, gerando uma economia de <strong className="text-emerald-600 text-xl whitespace-nowrap dark:text-emerald-400">{settings.currencySymbol} {diff.toFixed(2)}</strong> em relação ao outro cenário.
            </p>
          )}
        </div>
        <div className="hidden md:block w-px h-16 bg-gray-200 dark:bg-white/10"></div>
        <div className="text-center md:text-right">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 dark:text-gray-500">Diferença Percentual</div>
          <div className="text-2xl font-black text-gray-800 dark:text-gray-100">
            {costA.total > 0 && costB.total > 0
              ? `${(Math.abs((costA.total - costB.total) / Math.max(costA.total, costB.total)) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card title="Detalhamento Comparativo" variant="glass" className="p-6">
        <div className="h-96 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={12}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" strokeOpacity={0.1} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                stroke="#e5e7eb"
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="transparent"
                tickFormatter={(value) => `${settings.currencySymbol}${value}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(21, 25, 33, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                  padding: '16px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number, name: string) => [
                  <span className={cn("font-bold", name === 'Cenário A' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400')}>{settings.currencySymbol} {value.toFixed(2)}</span>,
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{name}</span>
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '30px' }}
                iconType="circle"
                formatter={(value) => <span className="text-gray-600 font-bold ml-1 dark:text-gray-400">{value}</span>}
              />
              <Bar dataKey="Cenário A" name="Cenário A" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Cenário B" name="Cenário B" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const CostRow = ({ label, value, icon: Icon, color, symbol, barColor, percentage }: { label: string, value: number, icon: any, color: string, symbol: string, barColor: string, percentage: number }) => (
  <div className="relative group hover:bg-white/50 p-2 rounded-lg transition-colors dark:hover:bg-white/5">
    <div className="flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-lg", barColor.replace('bg-', 'bg-opacity-20 ' + color.replace('text-', 'bg-')))}>
          <Icon size={14} className={color} />
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-800 font-mono tracking-tight dark:text-gray-200">{symbol} {value.toFixed(2)}</span>
    </div>
    {/* Mini progress bar at the bottom */}
    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-100 rounded-full overflow-hidden mt-2 opacity-50 dark:bg-white/10">
      <div className={cn("h-full rounded-full", color.replace('text-', 'bg-'))} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);
