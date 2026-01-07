import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Project, GlobalSettings } from '../types';
import { Card } from './UIComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { History, TrendingUp, DollarSign, Box } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });

  useEffect(() => {
    setProjects(StorageService.getProjects());
    setSettings(StorageService.getSettings());
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
           <div className="p-3 bg-blue-500/10 rounded-full text-blue-500"><TrendingUp /></div>
           <div>
             <p className="text-slate-400 text-sm">Total Revenue</p>
             <p className="text-2xl font-bold text-white">{settings.currencySymbol}{totalRevenue.toFixed(2)}</p>
           </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-emerald-500">
           <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500"><DollarSign /></div>
           <div>
             <p className="text-slate-400 text-sm">Total Profit</p>
             <p className="text-2xl font-bold text-white">{settings.currencySymbol}{totalProfit.toFixed(2)}</p>
           </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500">
           <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500"><Box /></div>
           <div>
             <p className="text-slate-400 text-sm">Quotes Generated</p>
             <p className="text-2xl font-bold text-white">{totalPrints}</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Performance" className="h-80">
          {projects.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                  cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="cost" stackId="a" fill="#f59e0b" name="Cost" />
                <Bar dataKey="profit" stackId="a" fill="#10b981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>No data yet. Start calculating!</p>
            </div>
          )}
        </Card>

        <Card title="Latest Quotes" className="h-80 overflow-y-auto">
           {projects.length === 0 ? (
             <p className="text-slate-500 text-center mt-10">No history found.</p>
           ) : (
             <div className="space-y-3">
               {projects.slice(0, 5).map(p => (
                 <div key={p.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors">
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{settings.currencySymbol}{p.result.finalPrice.toFixed(2)}</p>
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