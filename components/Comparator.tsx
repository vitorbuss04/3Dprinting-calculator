import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Loader2, Zap, Wrench, TrendingDown, AlertCircle, Trophy, Scale, Package, ChevronRight } from 'lucide-react';
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

  const [hoursA, setHoursA] = useState('10');
  const [hoursB, setHoursB] = useState('10');
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

    const depreciation = (p.acquisitionCost / p.lifespanHours) * h;
    const energy = (p.powerConsumption / 1000) * settings.electricityCost * h;
    const maintenance = p.maintenanceCostPerHour * h;
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
    { name: 'DEPREC.', 'CENÁRIO A': costA.depreciation, 'CENÁRIO B': costB.depreciation },
    { name: 'ENERGIA', 'CENÁRIO A': costA.energy, 'CENÁRIO B': costB.energy },
    { name: 'MANUT.', 'CENÁRIO A': costA.maintenance, 'CENÁRIO B': costB.maintenance },
    { name: 'MATERIAL', 'CENÁRIO A': costA.material, 'CENÁRIO B': costB.material },
  ];

  const diff = Math.abs(costA.total - costB.total);
  const winner = costA.total < costB.total ? 'A' : (costB.total < costA.total ? 'B' : 'Tie');

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">CARREGANDO COMPARADOR...</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 border border-primary text-primary bg-primary/10">
          <ArrowRightLeft size={24} />
        </div>
        <div>
          <h2 className="text-xl font-technical font-extrabold text-white uppercase tracking-[0.2em]">COMPARAR CUSTOS</h2>
          <p className="text-[10px] font-technical text-slate-500 uppercase mt-1">Compare o custo operacional entre dois cenários diferentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Scenario A */}
        <Card variant="industrial" className="relative p-0 overflow-hidden border-t-2 border-t-primary">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
            <h3 className="font-technical font-bold text-white flex items-center gap-3 uppercase tracking-widest">
              <span className="flex items-center justify-center w-8 h-8 border border-primary/50 text-primary font-black text-xs shadow-[0_0_10px_rgba(255,92,0,0.2)]">A</span>
              CENÁRIO A
            </h3>
            {winner === 'A' && <Trophy size={20} className="text-primary animate-pulse" />}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 p-4 border border-slate-800 bg-slate-950/50">
              <Select
                label="MÁQUINA"
                options={printers.map(p => ({ value: p.id, label: p.name }))}
                value={printerAId}
                onChange={(val) => setPrinterAId(val as string)}
                className="font-technical uppercase text-[10px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="TEMPO (h)" type="number" min="0" value={hoursA} onChange={(e) => setHoursA(e.target.value)} className="font-technical" />
                <Input label="PESO (g)" type="number" min="0" value={weightA} onChange={(e) => setWeightA(e.target.value)} className="font-technical" />
              </div>
              <Select
                label="MATERIAL"
                options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
                value={materialAId}
                onChange={(val) => setMaterialAId(val as string)}
                className="font-technical uppercase text-[10px]"
              />
            </div>

            <div className="space-y-2">
              <CostRow label="DEPRECIAÇÃO" value={costA.depreciation} icon={TrendingDown} color="text-slate-500" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.depreciation / costA.total) * 100 : 0} />
              <CostRow label="ENERGIA" value={costA.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.energy / costA.total) * 100 : 0} />
              <CostRow label="MANUTENÇÃO" value={costA.maintenance} icon={Wrench} color="text-blue-500" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.maintenance / costA.total) * 100 : 0} />
              <CostRow label="MATERIAL" value={costA.material} icon={Package} color="text-emerald-500" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.material / costA.total) * 100 : 0} />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <span className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">CUSTO TOTAL</span>
              <p className="text-3xl font-technical font-black text-white tracking-tighter mt-1">
                <span className="text-primary mr-1 text-xl">{settings.currencySymbol}</span>
                {costA.total.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Scenario B */}
        <Card variant="industrial" className="relative p-0 overflow-hidden border-t-2 border-t-secondary">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
            <h3 className="font-technical font-bold text-white flex items-center gap-3 uppercase tracking-widest">
              <span className="flex items-center justify-center w-8 h-8 border border-secondary/50 text-secondary font-black text-xs shadow-[0_0_10px_rgba(0,224,255,0.2)]">B</span>
              CENÁRIO B
            </h3>
            {winner === 'B' && <Trophy size={20} className="text-secondary animate-pulse" />}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 p-4 border border-slate-800 bg-slate-950/50">
              <Select
                label="MÁQUINA"
                options={printers.map(p => ({ value: p.id, label: p.name }))}
                value={printerBId}
                onChange={(val) => setPrinterBId(val as string)}
                className="font-technical uppercase text-[10px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="TEMPO (h)" type="number" min="0" value={hoursB} onChange={(e) => setHoursB(e.target.value)} className="font-technical" />
                <Input label="PESO (g)" type="number" min="0" value={weightB} onChange={(e) => setWeightB(e.target.value)} className="font-technical" />
              </div>
              <Select
                label="FEEDSTOCK"
                options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
                value={materialBId}
                onChange={(val) => setMaterialBId(val as string)}
                className="font-technical uppercase text-[10px]"
              />
            </div>

            <div className="space-y-2">
              <CostRow label="DEPRECIAÇÃO" value={costB.depreciation} icon={TrendingDown} color="text-slate-500" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.depreciation / costB.total) * 100 : 0} />
              <CostRow label="ENERGIA" value={costB.energy} icon={Zap} color="text-amber-500" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.energy / costB.total) * 100 : 0} />
              <CostRow label="MANUTENÇÃO" value={costB.maintenance} icon={Wrench} color="text-blue-500" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.maintenance / costB.total) * 100 : 0} />
              <CostRow label="MATERIAL" value={costB.material} icon={Package} color="text-emerald-500" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.material / costB.total) * 100 : 0} />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <span className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">CUSTO TOTAL</span>
              <p className="text-3xl font-technical font-black text-white tracking-tighter mt-1">
                <span className="text-secondary mr-1 text-xl">{settings.currencySymbol}</span>
                {costB.total.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Verdict Panel */}
      <div className={cn(
        "border p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 bg-slate-950",
        winner === 'Tie' ? 'border-slate-800' :
          winner === 'A' ? 'border-primary/50 shadow-[0_0_30px_rgba(255,92,0,0.05)]' :
            'border-secondary/50 shadow-[0_0_30px_rgba(0,224,255,0.05)]'
      )}>
        <div className={cn(
          "flex-shrink-0 w-16 h-16 border flex items-center justify-center",
          winner === 'Tie' ? 'border-slate-800 text-slate-600' :
            winner === 'A' ? 'border-primary/30 text-primary bg-primary/5' : 'border-secondary/30 text-secondary bg-secondary/5'
        )}>
          {winner === 'Tie' ? <AlertCircle size={32} /> : <Trophy size={32} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="w-2 h-2 bg-primary animate-pulse" />
            <h3 className="text-xs font-technical font-black text-white uppercase tracking-[0.3em]">RESULTADO DA COMPARAÇÃO</h3>
          </div>
          {diff < 0.05 ? (
            <p className="text-sm font-technical text-slate-400 uppercase leading-relaxed">Os custos dos dois cenários são praticamente <span className="text-white font-bold">iguais</span>. Ambos são equivalentes.</p>
          ) : (
            <p className="text-sm font-technical text-slate-400 uppercase leading-relaxed max-w-2xl">
              Cenário <span className={cn("px-2 py-0.5 font-bold mx-1 border", winner === 'A' ? 'border-primary/30 text-primary' : 'border-secondary/30 text-secondary')}>{winner}</span>
              é identificado como caminho ótimo, com eficiência delta de <span className="text-emerald-500 font-black">{settings.currencySymbol} {diff.toFixed(2)}</span> por ciclo.
            </p>
          )}
        </div>
        <div className="hidden md:block w-px h-16 bg-slate-800"></div>
        <div className="text-center md:text-right min-w-[140px]">
          <div className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest mb-1">DIFERENÇA %</div>
          <div className={cn("text-2xl font-technical font-black", winner === 'Tie' ? 'text-slate-400' : winner === 'A' ? 'text-primary' : 'text-secondary')}>
            {costA.total > 0 && costB.total > 0
              ? `${(Math.abs((costA.total - costB.total) / Math.max(costA.total, costB.total)) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Cross-Analysis Chart */}
      <Card variant="industrial" className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 bg-primary" />
          <h3 className="text-[10px] font-technical font-black text-slate-400 uppercase tracking-[0.3em]">COMPARAÇÃO DETALHADA POR CATEGORIA</h3>
        </div>
        <div className="h-96 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={4}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: 600 }}
                stroke="#1e293b"
                axisLine={true}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                stroke="#1e293b"
                tickFormatter={(value) => `${settings.currencySymbol}${value}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  padding: '12px',
                  borderRadius: '0px'
                }}
                labelStyle={{
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#94a3b8',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                }}
                formatter={(value: number, name: string) => [
                  <span className={cn("font-technical text-[11px] font-bold", name === 'CENÁRIO A' ? 'text-primary' : 'text-secondary')}>{settings.currencySymbol}{value.toFixed(2)}</span>,
                  <span className="text-slate-500 font-technical text-[9px] uppercase">{name}</span>
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase' }}
                iconType="rect"
                formatter={(value) => <span className="text-slate-500 font-bold ml-1">{value}</span>}
              />
              <Bar dataKey="CENÁRIO A" name="CENÁRIO A" fill="#FF5C00" radius={0} />
              <Bar dataKey="CENÁRIO B" name="CENÁRIO B" fill="#00E0FF" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const CostRow = ({ label, value, icon: Icon, color, symbol, percentage }: { label: string, value: number, icon: any, color: string, symbol: string, percentage: number }) => (
  <div className="relative group p-2 border border-transparent hover:border-slate-800 transition-all duration-150">
    <div className="flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3">
        <Icon size={12} className={cn("shrink-0", color)} />
        <span className="text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[11px] font-technical font-black text-white">{symbol}{value.toFixed(2)}</span>
    </div>
    <div className="mt-1.5 w-full h-[1px] bg-slate-900 overflow-hidden">
      <div className={cn("h-full", color.replace('text-', 'bg-'))} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);
