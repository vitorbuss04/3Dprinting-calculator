import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings, ViewState } from '../types';
import { Card } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, DollarSign, Box, Loader2 } from 'lucide-react';
import { AssetsSummary } from './AssetsSummary';
import { cn } from '../utils/cn';

interface DashboardProps {
  onNavigate: (view: ViewState, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      const [p, s] = await Promise.all([
        StorageService.getProjects(),
        StorageService.getSettings()
      ]);
      setProjects(p);
      setSettings(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalRevenue = projects.reduce((acc, curr) => acc + curr.result.finalPrice, 0);
  const totalProfit = projects.reduce((acc, curr) => acc + curr.result.profit, 0);
  const totalPrints = projects.length;

  const chartData = projects.slice(0, 5).map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    Gasto: p.result.totalProductionCost,
    Lucro: p.result.profit,
    Faturamento: p.result.finalPrice,
  })).reverse();

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, shadowClass, onClick }: any) => (
    <Card
      variant="neumorphic"
      onClick={onClick}
      className={cn(
        "flex items-center gap-5 group hover:-translate-y-1 transition-transform relative overflow-hidden",
        onClick ? "cursor-pointer active:scale-95" : "cursor-default"
      )}
    >
      <div className={cn("p-4 rounded-2xl shadow-inner", bgClass, colorClass)}>
        <Icon size={28} className="drop-shadow-sm" />
      </div>
      <div className="flex-1 relative z-10">
        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1 dark:text-gray-500">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-black text-gray-800 tracking-tighter dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
      <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl", shadowClass)} />
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Receita Total"
          value={`${settings.currencySymbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-500/20"
          shadowClass="bg-blue-500"
        />
        <StatCard
          title="Lucro Total"
          value={`${settings.currencySymbol}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-500/20"
          shadowClass="bg-emerald-500"
        />
        <StatCard
          title="Orçamentos"
          value={totalPrints}
          icon={Box}
          colorClass="text-indigo-600 dark:text-indigo-400"
          bgClass="bg-indigo-50 dark:bg-indigo-500/20"
          shadowClass="bg-indigo-500"
          onClick={() => onNavigate('history')}
        />
      </div>

      <AssetsSummary onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card variant="glass" className="h-[28rem] flex flex-col p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Desempenho Financeiro</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Análise dos últimos 5 projetos</p>
          </div>

          {projects.length > 0 ? (
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(21, 25, 33, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', fontSize: '12px', fontWeight: 'bold', color: '#F9FAFB' }}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => settings.currencySymbol + ' ' + value.toFixed(2)}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}
                  />

                  <Line type="monotone" dataKey="Faturamento" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Gasto" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Box size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Sem dados para exibir</p>
            </div>
          )}
        </Card>

        <Card variant="glass" className="h-[28rem] flex flex-col p-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent pointer-events-none z-10 dark:from-dark-surface dark:to-transparent" />
          <div className="p-6 pb-2 z-20">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Últimos Orçamentos</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Histórico recente de atividades</p>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 px-6 pb-6 pt-2 space-y-3">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="font-medium">Nenhum histórico encontrado.</p>
              </div>
            ) : (
              projects.slice(0, 6).map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-white/50 border border-gray-100/50 rounded-2xl hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default group dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:hover:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform dark:from-blue-500/20 dark:to-indigo-500/20 dark:border-white/10 dark:text-blue-400">
                      <Box size={20} className="drop-shadow-sm" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm dark:text-gray-200">{p.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 dark:text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                      {settings.currencySymbol}{p.result.finalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10 dark:from-dark-surface" />
        </Card>
      </div >
    </div >
  );
};