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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-blue-500 bg-white">
           <div className="p-3 bg-blue-50 rounded-full text-blue-600"><TrendingUp /></div>
           <div>
             <p className="text-gray-500 text-sm">Receita Total</p>
             <p className="text-2xl font-bold text-gray-900">{settings.currencySymbol}{totalRevenue.toFixed(2)}</p>
           </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500 bg-white">
           <div className="p-3 bg-emerald-50 rounded-full text-emerald-600"><DollarSign /></div>
           <div>
             <p className="text-gray-500 text-sm">Lucro Total</p>
             <p className="text-2xl font-bold text-gray-900">{settings.currencySymbol}{totalProfit.toFixed(2)}</p>
           </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500 bg-white">
           <div className="p-3 bg-indigo-50 rounded-full text-indigo-600"><Box /></div>
           <div>
             <p className="text-gray-500 text-sm">Orçamentos Gerados</p>
             <p className="text-2xl font-bold text-gray-900">{totalPrints}</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Desempenho Recente" className="h-80">
          {projects.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#111827', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{stroke: '#94a3b8', strokeWidth: 1}}
                  formatter={(value: number) => [`${settings.currencySymbol} ${value.toFixed(2)}`]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  name="Gasto" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2 }}
                />

                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Lucro" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>Sem dados ainda.</p>
            </div>
          )}
        </Card>

        <Card title="Últimos Orçamentos" className="h-80 overflow-y-auto">
           {projects.length === 0 ? (
             <p className="text-gray-400 text-center mt-10">Nenhum histórico encontrado.</p>
           ) : (
             <div className="space-y-3">
               {projects.slice(0, 5).map(p => (
                 <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{settings.currencySymbol}{p.result.finalPrice.toFixed(2)}</p>
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