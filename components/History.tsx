import React, { useEffect, useState } from 'react';
import { Project, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Trash2, Loader2 } from 'lucide-react';

export const History: React.FC = () => {
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

  const deleteProject = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir este orçamento?')) {
      const old = [...projects];
      setProjects(projects.filter(p => p.id !== id));
      try {
        await StorageService.deleteProject(id);
      } catch (e) {
        setProjects(old);
        alert('Erro ao excluir projeto');
      }
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Histórico de Orçamentos</h2>
      {projects.length === 0 ? (
        <div className="text-center text-gray-500 py-24 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
          <p className="text-lg font-medium">Nenhum projeto salvo ainda.</p>
          <p className="text-sm opacity-70 mt-1">Crie seu primeiro orçamento na aba calculadora.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-200/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex flex-wrap gap-4 mt-2">
                  <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{new Date(project.date).toLocaleDateString()}</span>
                  <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{project.printTimeHours}h {project.printTimeMinutes}m de impressão</span>
                  <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{project.modelWeight}g de material</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter mb-0.5">Custo</p>
                   <p className="text-gray-600 font-mono font-bold text-sm">{settings.currencySymbol}{project.result.totalProductionCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter mb-0.5">Preço Final</p>
                   <p className="text-2xl text-emerald-600 font-black font-mono tracking-tighter leading-none">{settings.currencySymbol}{project.result.finalPrice.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};