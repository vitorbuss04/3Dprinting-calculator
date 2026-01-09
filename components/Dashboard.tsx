import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings } from '../types';
import { Card, neuShadowIn } from './UIComponents';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, DollarSign, Box, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    name: p.name.length > 8 ? p.name.substring(0, 8) + '..' : p.name,
    cost: p.result.totalProductionCost,
    profit: p.result.profit
  })).reverse();

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="h-full flex flex-col gap-[6vh] overflow-visible">
      {/* Estatísticas Rápidas - Padding aumentado para as sombras respirarem */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[5vw] shrink-0 overflow-visible p-4">
        {[
          { icon: TrendingUp, label: 'Receita Total', val: totalRevenue, color: 'text-blue-600' },
          { icon: DollarSign, label: 'Lucro Total', val: totalProfit, color: 'text-emerald-600' },
          { icon: Box, label: 'Orçamentos', val: totalPrints, color: 'text-indigo-600', noCurrency: true }
        ].map((item, idx) => (
          <div key={idx} className={`flex items-center gap-6 p-6 rounded-[2vw] shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff] group hover:scale-[1.04] transition-all bg-[#f0f0f0] border border-white/40`}>
             <div className={`p-5 ${neuShadowIn} rounded-2xl ${item.color} border border-white/20 shrink-0`}>
               <item.icon size={28} />
             </div>
             <div className="min-w-0">
               <p className="text-gray-400 text-[0.65rem] font-black uppercase tracking-[0.3em] mb-1 truncate">{item.label}</p>
               <p className="text-[clamp(1.2rem,1.8vw,2.2rem)] font-black text-gray-800 tracking-tighter truncate leading-tight">
                 {!item.noCurrency && settings.currencySymbol}
                 {item.val.toLocaleString(undefined, { minimumFractionDigits: item.noCurrency ? 0 : 2, maximumFractionDigits: 2 })}
               </p>
             </div>
          </div>
        ))}
      </div>

      {/* Gráficos e Listas */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-[6vw] overflow-visible pb-8">
        <Card title="Desempenho Financeiro" className="h-full overflow-visible">
          {projects.length > 0 ? (
            <div className="absolute inset-0 pt-6 overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#d1d1d1" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 11, fontWeight: 900, fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{fontSize: 11, fontWeight: 900, fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '24px', boxShadow: '20px 20px 40px #d1d1d1', fontSize: '12px', fontWeight: '900', padding: '16px' }}
                    formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`]}
                  />
                  <Legend verticalAlign="bottom" height={45} iconSize={12} wrapperStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', bottom: -5 }} />
                  <Line type="monotone" dataKey="cost" name="Gasto" stroke="#ef4444" strokeWidth={5} dot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p className="font-black text-[0.75rem] uppercase tracking-[0.5em]">Sem registros</p>
            </div>
          )}
        </Card>

        <Card title="Recentes" className="h-full flex flex-col overflow-visible">
           {projects.length === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-400">
               <p className="font-black text-[0.75rem] uppercase tracking-[0.5em]">Histórico Vazio</p>
             </div>
           ) : (
             <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-6 px-2 py-3 overflow-x-visible">
               {projects.slice(0, 10).map(p => (
                 <div key={p.id} className={`flex justify-between items-center p-6 rounded-[24px] ${neuShadowIn} group transition-all hover:scale-[1.03] bg-transparent border border-white/30`}>
                    <div className="flex items-center gap-6 min-w-0">
                      <div className={`w-14 h-14 rounded-[20px] bg-transparent shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-blue-600 border border-white/50 shrink-0`}>
                        <Box size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-800 text-sm uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                        <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600 text-lg tracking-tighter shrink-0 ml-6">{settings.currencySymbol}{p.result.finalPrice.toFixed(2)}</p>
                 </div>
               ))}
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};
