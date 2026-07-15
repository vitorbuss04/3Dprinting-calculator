import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings, ViewState } from '../types';
import { Card } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Box, Loader2, Activity, ChevronDown, Clock, Scaling } from 'lucide-react';
import { AssetsSummary } from './AssetsSummary';
import { Select } from './ui/Select';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { ProjectStatus, ProjectFolder } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      const [p, f, s] = await Promise.all([
        StorageService.getProjects(),
        StorageService.getFolders(),
        StorageService.getSettings()
      ]);
      setProjects(p);
      setFolders(f);
      setSettings(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  const concludedFolderIds = folders.filter(f => f.status === 'concluido').map(f => f.id);
  const concludedProjects = projects.filter(p => p.folderId && concludedFolderIds.includes(p.folderId));

  const totalRevenue = concludedProjects.reduce((acc, curr) => acc + (Number(curr.result?.finalPrice) || 0), 0);
  const totalProfit  = concludedProjects.reduce((acc, curr) => acc + (Number(curr.result?.profit) || 0), 0);
  const totalPrints  = concludedFolderIds.length;

  // Operational metrics for concluded projects
  const totalWeight = concludedProjects.reduce((acc, curr) => acc + (Number(curr.modelWeight) || 0), 0);
  const totalPrintMinutesAcc = concludedProjects.reduce((acc, curr) => {
    const hours = Number(curr.printTimeHours) || 0;
    const mins = Number(curr.printTimeMinutes) || 0;
    return acc + (hours * 60) + mins;
  }, 0);

  const totalPrintHours = Math.floor(totalPrintMinutesAcc / 60);
  const totalPrintMinutes = Math.round(totalPrintMinutesAcc % 60);

  const gastoLabel = t('production_cost');
  const lucroLabel = t('net_profit');
  const faturamentoLabel = t('total_value');

  const concludedFolders = folders.filter(f => f.status === 'concluido').slice(0, 5);
  const chartData = concludedFolders.map(f => {
    const folderProjects = projects.filter(p => p.folderId === f.id);
    return {
      name: f.name.length > 8 ? f.name.substring(0, 8) : f.name,
      [gastoLabel]: folderProjects.reduce((acc, p) => acc + (Number(p.result?.totalProductionCost) || 0), 0),
      [lucroLabel]: folderProjects.reduce((acc, p) => acc + (Number(p.result?.profit) || 0), 0),
      [faturamentoLabel]: folderProjects.reduce((acc, p) => acc + (Number(p.result?.finalPrice) || 0), 0),
    };
  }).reverse();

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_data')}</span>
    </div>
  );

  const StatBlock = ({ title, value, icon: Icon, colorClass, data }: any) => (
    <Card variant="default" className="flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-muted text-[10px] font-sans font-medium uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-sans font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <div className={cn("p-2 bg-surface-soft border border-hairline rounded-lg", colorClass)}>
          <Icon size={16} />
        </div>
      </div>
      
      {/* Sparkline integration */}
      <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke="currentColor" 
              fill="currentColor" 
              fillOpacity={0.05} 
              strokeWidth={1.5}
              className={colorClass}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  // Trend data for sparklines — only concluded projects (folders)
  const last5Revenue = chartData.map(d => ({ val: d[faturamentoLabel] }));
  const last5Profit  = chartData.map(d => ({ val: d[lucroLabel] }));
  const last5Prints  = chartData.map((_, i) => ({ val: i + 1 }));

  const last5Weight = concludedFolders.map(f => {
    const folderProjects = projects.filter(p => p.folderId === f.id);
    const w = folderProjects.reduce((acc, p) => acc + (Number(p.modelWeight) || 0), 0);
    return { val: w };
  }).reverse();

  const last5Hours = concludedFolders.map(f => {
    const folderProjects = projects.filter(p => p.folderId === f.id);
    const mins = folderProjects.reduce((acc, p) => acc + (Number(p.printTimeHours) || 0) * 60 + (Number(p.printTimeMinutes) || 0), 0);
    return { val: mins / 60 };
  }).reverse();

  // Custom Tooltip component for stacked BarChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cost = payload.find((p: any) => p.dataKey === gastoLabel)?.value || 0;
      const profit = payload.find((p: any) => p.dataKey === lucroLabel)?.value || 0;
      const total = cost + profit;
      
      return (
        <div className="bg-surface-elevated border border-hairline p-4 rounded-xl shadow-xl text-xs font-sans space-y-2">
          <p className="font-semibold text-ink">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-8 text-red">
              <span>{gastoLabel}:</span>
              <span className="font-medium">{settings.currencySymbol} {cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-8 text-green">
              <span>{lucroLabel}:</span>
              <span className="font-medium">{settings.currencySymbol} {profit.toFixed(2)}</span>
            </div>
            <div className="border-t border-hairline my-1" />
            <div className="flex justify-between gap-8 text-primary font-semibold">
              <span>{faturamentoLabel}:</span>
              <span>{settings.currencySymbol} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Real Summary Bar */}
      {folders.length > 0 && (() => {
        const pending = folders.filter(f => f.status === 'aguardando').length;
        const inProd  = folders.filter(f => f.status === 'em_producao').length;
        const done    = folders.filter(f => f.status === 'concluido').length;
        return (
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-2.5 bg-surface-soft border border-hairline text-xs font-sans text-muted rounded-xl">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow shrink-0" />
              <span>{pending} {t('status_waiting')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>{inProd} {t('status_production')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green shrink-0" />
              <span>{done} {t('status_completed')}</span>
            </span>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatBlock
          title={t('revenue_title')}
          value={`${settings.currencySymbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          colorClass="text-primary"
          data={last5Revenue}
        />
        <StatBlock
          title={t('net_profit')}
          value={`${settings.currencySymbol}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="text-green"
          data={last5Profit}
        />
        <StatBlock
          title={t('total_projects')}
          value={totalPrints.toString().padStart(2, '0')}
          icon={Box}
          colorClass="text-muted"
          data={last5Prints}
        />
        <StatBlock
          title={t('print_time_label')}
          value={`${totalPrintHours}h ${totalPrintMinutes}m`}
          icon={Clock}
          colorClass="text-yellow"
          data={last5Hours}
        />
        <StatBlock
          title={t('model_weight_label')}
          value={totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(2)} kg` : `${totalWeight.toFixed(0)} g`}
          icon={Scaling}
          colorClass="text-primary"
          data={last5Weight}
        />
      </div>

      <AssetsSummary onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <Card variant="default" className="lg:col-span-2 flex flex-col p-6 min-h-[400px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-sm font-sans font-medium text-ink flex items-center gap-2">
                <Activity size={16} className="text-primary" /> {t('financial_chart')}
              </h3>
              <p className="text-xs font-sans text-muted mt-1">{t('production_metrics', { currency: settings.currencySymbol })}</p>
            </div>
            <div className="flex gap-2">
                <div className="px-3 py-1 bg-surface-soft border border-hairline text-xs font-sans text-muted rounded-full">{t('last_5')}</div>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-hairline)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted)"
                    tick={{ fontSize: 10, fontFamily: 'Outfit, Roboto, sans-serif', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--color-muted)"
                    tick={{ fontSize: 10, fontFamily: 'Outfit, Roboto, sans-serif', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-soft)', opacity: 0.4 }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="rect"
                    iconSize={10}
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontFamily: 'Outfit, Roboto, sans-serif', textTransform: 'uppercase', color: 'var(--color-muted)' }}
                  />

                  <Bar dataKey={gastoLabel} stackId="a" fill="var(--color-red)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey={lucroLabel} stackId="a" fill="var(--color-green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 border border-dashed border-hairline text-muted rounded-xl">
              <Box size={24} className="mb-3 opacity-30" />
              <p className="text-xs font-sans uppercase italic">{t('no_projects_yet')}</p>
            </div>
          )}
        </Card>

        {/* Side: Status Panel */}
        <Card variant="default" className="flex flex-col p-0 overflow-hidden border border-hairline">
          <div className="p-6 pb-3 bg-surface-soft border-b border-hairline space-y-3">
            <div>
              <h3 className="text-sm font-sans font-medium text-ink">{t('projects_by_status')}</h3>
              <p className="text-xs font-sans text-muted mt-1">{t('filter_by_production_phase')}</p>
            </div>
            {/* Filter Dropdown */}
            <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as ProjectStatus | 'all')}
                options={[
                  { value: 'all', label: t('all_status_option') },
                  { value: 'aguardando', label: t('status_waiting_option') },
                  { value: 'em_producao', label: t('status_production_option') },
                  { value: 'concluido', label: t('status_completed_option') },
                  { value: 'cancelado', label: t('status_cancelled_option') }
                ]}
            />
          </div>

          {(() => {
            const filteredFolders = (statusFilter === 'all'
              ? folders
              : folders.filter(f => f.status === statusFilter)
            ).slice(0, 4);

            const STATUS_COLORS: Record<string, string> = {
              aguardando:  'text-yellow',
              em_producao: 'text-primary',
              concluido:   'text-green',
              cancelado:   'text-red',
            };
            const STATUS_LABELS: Record<string, string> = {
              aguardando:  t('status_waiting'),
              em_producao: t('status_production'),
              concluido:   t('status_completed'),
              cancelado:   t('status_cancelled'),
            };

            return (
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {filteredFolders.length === 0 ? (
                  <div className="p-8 text-center text-muted">
                    <p className="text-xs font-sans uppercase">{t('no_projects_this_status')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {filteredFolders.map(folder => {
                      const st = folder.status || 'aguardando';
                      const folderProjects = projects.filter(prj => prj.folderId === folder.id);
                      const folderTotal = folderProjects.reduce((sum, prj) => sum + prj.result.finalPrice, 0);
                      
                      return (
                        <div
                          key={folder.id}
                          className="flex justify-between items-center p-4 hover:bg-surface-soft group transition-colors cursor-pointer"
                          onClick={() => onNavigate('history')}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-surface-soft border border-hairline rounded-lg flex items-center justify-center text-muted group-hover:border-primary group-hover:text-primary transition-colors shrink-0">
                              <Box size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-sans font-medium text-ink group-hover:text-primary transition-colors truncate">{folder.name}</p>
                              <p className={cn('text-[10px] font-sans font-semibold uppercase mt-0.5', STATUS_COLORS[st])}>
                                {STATUS_LABELS[st]}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-xs font-sans font-semibold text-primary">
                              +{settings.currencySymbol}{folderTotal.toFixed(2)}
                            </p>
                            <p className="text-[10px] font-sans text-muted mt-0.5">{format(new Date(folder.createdAt), "yyyy-MM-dd")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <button
            className="w-full py-3 bg-surface-soft border-t border-hairline text-xs font-sans font-medium text-primary hover:text-primary-hover hover:bg-surface-strong transition-colors flex items-center justify-center gap-2"
            onClick={() => onNavigate('history')}
          >
            {t('view_full_history')} <TrendingUp size={12} />
          </button>
        </Card>
      </div >
    </div >
  );
};