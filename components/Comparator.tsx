import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Loader2, Zap, Wrench, TrendingDown, AlertCircle, Trophy, Package, ChevronDown } from 'lucide-react';
import { Printer, GlobalSettings, Material } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../utils/cn';

export const Comparator: React.FC = () => {
  const { t } = useTranslation();
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
    { name: t('deprec_chart'), [t('scenario_a')]: costA.depreciation, [t('scenario_b')]: costB.depreciation },
    { name: t('energy_chart'), [t('scenario_a')]: costA.energy, [t('scenario_b')]: costB.energy },
    { name: t('maintenance_chart'), [t('scenario_a')]: costA.maintenance, [t('scenario_b')]: costB.maintenance },
    { name: t('material_chart'), [t('scenario_a')]: costA.material, [t('scenario_b')]: costB.material },
  ];

  const diff = Math.abs(costA.total - costB.total);
  const winner = costA.total < costB.total ? 'A' : (costB.total < costA.total ? 'B' : 'Tie');

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_comparator')}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2.5 border border-primary/20 text-primary bg-primary-soft rounded-xl">
          <ArrowRightLeft size={20} />
        </div>
        <div>
          <h2 className="text-lg font-sans font-semibold text-ink">{t('compare_costs')}</h2>
          <p className="text-xs font-sans text-muted mt-1">{t('compare_costs_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Scenario A */}
        <Card variant="default" className="relative p-0 overflow-hidden border border-hairline border-t-4 border-t-primary">
          <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft">
            <h3 className="font-sans font-medium text-ink flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary font-semibold text-sm">A</span>
              {t('scenario_a')}
            </h3>
            {winner === 'A' && <Trophy size={20} className="text-primary animate-pulse" />}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 p-4 border border-hairline bg-surface-soft rounded-2xl">
              <Select
                label={t('printer_label')}
                options={printers.map(p => ({ value: p.id, label: p.name }))}
                value={printerAId}
                onChange={(val) => setPrinterAId(val as string)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('time_hours_label')} type="number" min="0" value={hoursA} onChange={(e) => setHoursA(e.target.value)} />
                <Input label={t('weight_g_label')} type="number" min="0" value={weightA} onChange={(e) => setWeightA(e.target.value)} />
              </div>
              <Select
                label={t('material_label')}
                options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
                value={materialAId}
                onChange={(val) => setMaterialAId(val as string)}
              />
            </div>

            <div className="space-y-1">
              <CostRow label={t('deprec_chart')} value={costA.depreciation} icon={TrendingDown} color="text-muted" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.depreciation / costA.total) * 100 : 0} />
              <CostRow label={t('energy_chart')} value={costA.energy} icon={Zap} color="text-yellow" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.energy / costA.total) * 100 : 0} />
              <CostRow label={t('maintenance_chart')} value={costA.maintenance} icon={Wrench} color="text-primary" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.maintenance / costA.total) * 100 : 0} />
              <CostRow label={t('material_chart')} value={costA.material} icon={Package} color="text-green" symbol={settings.currencySymbol} percentage={costA.total > 0 ? (costA.material / costA.total) * 100 : 0} />
            </div>

            <div className="pt-4 border-t border-hairline">
              <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_cost')}</span>
              <p className="text-2xl font-sans font-semibold text-ink tracking-tight mt-1">
                <span className="text-primary mr-1">{settings.currencySymbol}</span>
                {costA.total.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Scenario B */}
        <Card variant="default" className="relative p-0 overflow-hidden border border-hairline border-t-4 border-t-green">
          <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft">
            <h3 className="font-sans font-medium text-ink flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green/10 text-green font-semibold text-sm">B</span>
              {t('scenario_b')}
            </h3>
            {winner === 'B' && <Trophy size={20} className="text-green animate-pulse" />}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 p-4 border border-hairline bg-surface-soft rounded-2xl">
              <Select
                label={t('printer_label')}
                options={printers.map(p => ({ value: p.id, label: p.name }))}
                value={printerBId}
                onChange={(val) => setPrinterBId(val as string)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('time_hours_label')} type="number" min="0" value={hoursB} onChange={(e) => setHoursB(e.target.value)} />
                <Input label={t('weight_g_label')} type="number" min="0" value={weightB} onChange={(e) => setWeightB(e.target.value)} />
              </div>
              <Select
                label={t('material_label')}
                options={materials.map(m => ({ value: m.id, label: `${m.name} (${m.type})` }))}
                value={materialBId}
                onChange={(val) => setMaterialBId(val as string)}
              />
            </div>

            <div className="space-y-1">
              <CostRow label={t('deprec_chart')} value={costB.depreciation} icon={TrendingDown} color="text-muted" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.depreciation / costB.total) * 100 : 0} />
              <CostRow label={t('energy_chart')} value={costB.energy} icon={Zap} color="text-yellow" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.energy / costB.total) * 100 : 0} />
              <CostRow label={t('maintenance_chart')} value={costB.maintenance} icon={Wrench} color="text-primary" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.maintenance / costB.total) * 100 : 0} />
              <CostRow label={t('material_chart')} value={costB.material} icon={Package} color="text-green" symbol={settings.currencySymbol} percentage={costB.total > 0 ? (costB.material / costB.total) * 100 : 0} />
            </div>

            <div className="pt-4 border-t border-hairline">
              <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_cost')}</span>
              <p className="text-2xl font-sans font-semibold text-ink tracking-tight mt-1">
                <span className="text-green mr-1">{settings.currencySymbol}</span>
                {costB.total.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Verdict Panel */}
      <div className={cn(
        "border border-hairline p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 transition-all duration-300 bg-surface-soft shadow-sm",
        winner === 'Tie' ? 'border-hairline' :
          winner === 'A' ? 'border-primary/20 shadow-sm' :
            'border-green/20 shadow-sm'
      )}>
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center shadow-sm",
          winner === 'Tie' ? 'border-hairline text-muted bg-canvas' :
            winner === 'A' ? 'border-primary/20 text-primary bg-primary-soft' : 'border-green/20 text-green bg-green/10'
        )}>
          {winner === 'Tie' ? <AlertCircle size={24} /> : <Trophy size={24} />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider">{t('comparison_result')}</h3>
          </div>
          {diff < 0.05 ? (
            <p className="text-sm font-sans text-muted leading-relaxed">
              {t('costs_practically_equal_prefix')} <span className="text-ink font-semibold">{t('equal')}</span>. {t('costs_practically_equal_suffix')}
            </p>
          ) : (
            <p className="text-sm font-sans text-muted leading-relaxed max-w-2xl">
              {t('optimal_scenario_prefix')} <span className={cn("px-2.5 py-0.5 rounded-full font-semibold mx-1 border text-xs shadow-sm", winner === 'A' ? 'border-primary/20 text-primary bg-primary-soft' : 'border-green/20 text-green bg-green/10')}>{winner}</span>
              {t('optimal_scenario_body')} <span className="text-green font-semibold">{settings.currencySymbol} {diff.toFixed(2)}</span> {t('optimal_scenario_suffix')}
            </p>
          )}
        </div>
        <div className="hidden md:block w-[1px] h-12 bg-hairline"></div>
        <div className="text-center md:text-right min-w-[140px]">
          <div className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{t('difference_percent')}</div>
          <div className={cn("text-2xl font-sans font-semibold", winner === 'Tie' ? 'text-muted' : winner === 'A' ? 'text-primary' : 'text-green')}>
            {costA.total > 0 && costB.total > 0
              ? `${(Math.abs((costA.total - costB.total) / Math.max(costA.total, costB.total)) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Cross-Analysis Chart */}
      <Card variant="default" className="p-6 border border-hairline">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h3 className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('detailed_comparison_category')}</h3>
        </div>
        <div className="h-96 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={6}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'Outfit, Roboto, sans-serif', fontWeight: 500 }}
                stroke="var(--color-hairline)"
                axisLine={true}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'Outfit, Roboto, sans-serif' }}
                stroke="var(--color-hairline)"
                tickFormatter={(value) => `${settings.currencySymbol}${value}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-hairline)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontFamily: 'Outfit, Roboto, sans-serif'
                }}
                labelStyle={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                }}
                formatter={(value: number, name: string) => [
                  <span className={cn("font-sans text-xs font-semibold", name === t('scenario_a') ? 'text-primary' : 'text-green')}>{settings.currencySymbol}{value.toFixed(2)}</span>,
                  <span className="text-muted font-sans text-[10px] uppercase">{name}</span>
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontFamily: 'Outfit, Roboto, sans-serif', textTransform: 'uppercase' }}
                iconType="rect"
                formatter={(value) => <span className="text-muted font-semibold ml-1">{value}</span>}
              />
              <Bar dataKey={t('scenario_a')} name={t('scenario_a')} fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('scenario_b')} name={t('scenario_b')} fill="var(--color-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const CostRow = ({ label, value, icon: Icon, color, symbol, percentage }: { label: string, value: number, icon: any, color: string, symbol: string, percentage: number }) => (
  <div className="relative group p-2.5 border border-transparent hover:border-hairline rounded-xl transition-all duration-150">
    <div className="flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3">
        <Icon size={14} className={cn("shrink-0", color)} />
        <span className="text-[11px] font-sans font-medium text-muted uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-sans font-semibold text-ink">{symbol}{value.toFixed(2)}</span>
    </div>
    <div className="mt-1.5 w-full h-[3px] bg-surface-strong rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full", color.replace('text-', 'bg-'))} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);
