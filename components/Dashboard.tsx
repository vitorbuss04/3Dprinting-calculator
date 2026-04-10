import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings, ViewState } from '../types';
import { Card } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Box, Loader2, Activity, Zap, Cpu, ChevronDown } from 'lucide-react';
import { AssetsSummary } from './AssetsSummary';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { ProjectStatus, ProjectFolder } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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

  const totalRevenue = concludedProjects.reduce((acc, curr) => acc + curr.result.finalPrice, 0);
  const totalProfit  = concludedProjects.reduce((acc, curr) => acc + curr.result.profit, 0);
  const totalPrints  = concludedFolderIds.length;

  const concludedFolders = folders.filter(f => f.status === 'concluido').slice(0, 5);
  const chartData = concludedFolders.map(f => {
    const folderProjects = projects.filter(p => p.folderId === f.id);
    return {
      name: f.name.length > 8 ? f.name.substring(0, 8) : f.name,
      Gasto: folderProjects.reduce((acc, p) => acc + p.result.totalProductionCost, 0),
      Lucro: folderProjects.reduce((acc, p) => acc + p.result.profit, 0),
      Faturamento: folderProjects.reduce((acc, p) => acc + p.result.finalPrice, 0),
    };
  }).reverse();

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">CARREGANDO DADOS...</span>
    </div>
  );

  const StatBlock = ({ title, value, icon: Icon, colorClass, data }: any) => (
    <Card variant="industrial" className="flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-slate-500 text-[10px] font-technical font-bold uppercase tracking-widest mb-1">{title}</p>
          <p className={cn("text-2xl font-technical font-bold tracking-tighter", colorClass)}>
            {value}
          </p>
        </div>
        <div className={cn("p-2 bg-slate-950 border border-slate-800", colorClass)}>
          <Icon size={16} />
        </div>
      </div>
      
      {/* Sparkline integration */}
      <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke="currentColor" 
              fill="currentColor" 
              fillOpacity={0.1} 
              strokeWidth={1.5}
              className={colorClass}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  // Trend data for sparklines — only concluded projects (folders)
  const last5Revenue = chartData.map(d => ({ val: d.Faturamento }));
  const last5Profit  = chartData.map(d => ({ val: d.Lucro }));
  const last5Prints  = chartData.map((_, i) => ({ val: i + 1 }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* System Status Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/30 border border-slate-800 text-[9px] font-technical text-slate-500 uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Zap size={10} className="text-primary" /> SISTEMA PRONTO</span>
          <span className="flex items-center gap-1.5"><Cpu size={10} className="text-secondary" /> SINCRONIZADO</span>
        </div>
        <div className="flex items-center gap-2">
            Operando: <span className="text-white">00:42:15</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBlock
          title="RECEITA TOTAL"
          value={`${settings.currencySymbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          colorClass="text-primary"
          data={last5Revenue}
        />
        <StatBlock
          title="LUCRO LÍQUIDO"
          value={`${settings.currencySymbol}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="text-secondary"
          data={last5Profit}
        />
        <StatBlock
          title="TOTAL DE PROJETOS"
          value={totalPrints.toString().padStart(2, '0')}
          icon={Box}
          colorClass="text-white"
          data={last5Prints}
        />
      </div>

      <AssetsSummary onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <Card variant="industrial" className="lg:col-span-2 flex flex-col p-6 min-h-[400px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xs font-technical font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-primary" /> GRÁFICO FINANCEIRO
              </h3>
              <p className="text-[10px] font-technical text-slate-500 uppercase mt-1">Métricas de produção dos últimos projetos // Moeda: {settings.currencySymbol}</p>
            </div>
            <div className="flex gap-2">
                <div className="px-2 py-1 bg-slate-950 border border-slate-800 text-[9px] font-technical text-slate-400 uppercase">ÚLTIMOS 5</div>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0px', fontSize: '10px', fontFamily: 'IBM Plex Mono', color: '#F8FAFC' }}
                    itemStyle={{ padding: '0px', color: '#F8FAFC' }}
                    cursor={{ stroke: '#FF5C00', strokeWidth: 1 }}
                    formatter={(value: number) => settings.currencySymbol + ' ' + value.toFixed(2)}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="rect"
                    iconSize={10}
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', color: '#64748B' }}
                  />

                  <Line type="stepAfter" dataKey="Faturamento" stroke="#FF5C00" strokeWidth={2} dot={{ r: 3, stroke: '#FF5C00', strokeWidth: 2, fill: '#020617' }} activeDot={{ r: 5 }} />
                  <Line type="stepAfter" dataKey="Lucro" stroke="#00E0FF" strokeWidth={2} dot={{ r: 3, stroke: '#00E0FF', strokeWidth: 2, fill: '#020617' }} activeDot={{ r: 5 }} />
                  <Line type="stepAfter" dataKey="Gasto" stroke="#475569" strokeWidth={2} dot={{ r: 3, stroke: '#475569', strokeWidth: 2, fill: '#020617' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 border border-dashed border-slate-800 text-slate-600">
              <Box size={24} className="mb-3 opacity-30" />
              <p className="text-[10px] font-technical uppercase italic">Nenhum projeto ainda</p>
            </div>
          )}
        </Card>

        {/* Side: Status Panel */}
        <Card variant="industrial" className="flex flex-col p-0 overflow-hidden border-l-0 lg:border-l border-slate-800">
          <div className="p-6 pb-3 bg-slate-950/50 border-b border-slate-800 space-y-3">
            <div>
              <h3 className="text-xs font-technical font-bold text-white uppercase tracking-widest">PROJETOS POR STATUS</h3>
              <p className="text-[10px] font-technical text-slate-500 uppercase mt-1">Filtre por fase de produção // Máx. 4</p>
            </div>
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="w-full bg-slate-900 border border-slate-800 text-[10px] font-technical text-slate-200 uppercase px-3 py-2 appearance-none focus:outline-none focus:border-slate-600 rounded-none cursor-pointer"
              >
                <option value="all">🔹 TODOS OS STATUS</option>
                <option value="aguardando">⏳ AGUARDANDO</option>
                <option value="em_producao">⚙️ EM PRODUÇÃO</option>
                <option value="concluido">✅ CONCLUÍDO</option>
                <option value="cancelado">✖ CANCELADO</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>

          {(() => {
            const filteredFolders = (statusFilter === 'all'
              ? folders
              : folders.filter(f => f.status === statusFilter)
            ).slice(0, 4);

            const STATUS_COLORS: Record<string, string> = {
              aguardando:  'text-amber-400',
              em_producao: 'text-cyan-400',
              concluido:   'text-emerald-400',
              cancelado:   'text-red-400',
            };
            const STATUS_LABELS: Record<string, string> = {
              aguardando:  'AGUARDANDO',
              em_producao: 'EM PRODUÇÃO',
              concluido:   'CONCLUÍDO',
              cancelado:   'CANCELADO',
            };

            return (
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {filteredFolders.length === 0 ? (
                  <div className="p-8 text-center text-slate-600">
                    <p className="text-[9px] font-technical uppercase">Nenhum projeto neste status</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {filteredFolders.map(folder => {
                      const st = folder.status || 'aguardando';
                      const folderProjects = projects.filter(prj => prj.folderId === folder.id);
                      const folderTotal = folderProjects.reduce((sum, prj) => sum + prj.result.finalPrice, 0);
                      
                      return (
                        <div
                          key={folder.id}
                          className="flex justify-between items-center p-4 hover:bg-slate-900 group transition-colors cursor-pointer"
                          onClick={() => onNavigate('history')}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:border-primary group-hover:text-primary transition-colors shrink-0">
                              <Box size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-technical font-bold text-slate-200 group-hover:text-white transition-colors uppercase truncate">{folder.name}</p>
                              <p className={cn('text-[8px] font-technical font-black uppercase mt-0.5', STATUS_COLORS[st])}>
                                {STATUS_LABELS[st]}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-[10px] font-technical font-bold text-primary">
                              +{settings.currencySymbol}{folderTotal.toFixed(2)}
                            </p>
                            <p className="text-[8px] font-technical text-slate-600 uppercase mt-0.5">{format(new Date(folder.createdAt), "yy.MM.dd")}</p>
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
            className="w-full p-3 bg-slate-950 border-t border-slate-800 text-[10px] font-technical font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
            onClick={() => onNavigate('history')}
          >
            VER HISTÓRICO COMPLETO <TrendingUp size={12} />
          </button>
        </Card>
      </div >
    </div >
  );
};