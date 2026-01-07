import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings } from '../types';
import { Card } from './UIComponents';
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

  // Prepare Chart Data (Last 5 projects)
  const chartData = projects.slice(0, 5).map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    cost: p.result.totalProductionCost,
    profit: p.result.profit
  })).reverse();

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5 bg-white group hover:-translate-y-1 transition-transform">
           <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
             <TrendingUp size={24} className="drop-shadow-md" />
           </div>
           <div className="flex-1">
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Receita Total</p>
             <p className="text-2xl font-black text-gray-800 tracking-tighter">
               {settings.currencySymbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </p>
           </div>
        </Card>
        <Card className="flex items-center gap-5 bg-white group hover:-translate-y-1 transition-transform">
           <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-xl shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
             <DollarSign size={24} className="drop-shadow-md" />
           </div>
           <div className="flex-1">
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Lucro Total</p>
             <p className="text-2xl font-black text-gray-800 tracking-tighter">
               {settings.currencySymbol}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </p>
           </div>
        </Card>
        <Card className="flex items-center gap-5 bg-white group hover:-translate-y-1 transition-transform">
           <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-xl shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
             <Box size={24} className="drop-shadow-md" />
           </div>
           <div className="flex-1">
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Orçamentos</p>
             <p className="text-2xl font-black text-gray-800 tracking-tighter">{totalPrints}</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Desempenho Recente" className="h-96 flex flex-col">
          {projects.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 10, fontWeight: 700}} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{fontSize: 10, fontWeight: 700}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', color: '#111827', borderRadius: '16px', boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.15)', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{stroke: '#cbd5e1', strokeWidth: 1}}
                    formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    name="Gasto" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 3, shadow: '0 10px 15px rgba(239, 68, 68, 0.4)' }}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Lucro" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 3, shadow: '0 10px 15px rgba(16, 185, 129, 0.4)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="font-medium">Sem dados ainda.</p>
            </div>
          )}
        </Card>

        <Card title="Últimos Orçamentos" className="h-96 overflow-y-auto custom-scrollbar">
           {projects.length === 0 ? (
             <p className="text-gray-400 text-center mt-10 font-medium">Nenhum histórico encontrado.</p>
           ) : (
             <div className="space-y-4">
               {projects.slice(0, 6).map(p => (
                 <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all cursor-default group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:shadow-md transition-shadow">
                        <Box size={18} className="drop-shadow-sm" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600 text-sm">{settings.currencySymbol}{p.result.finalPrice.toFixed(2)}</p>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};