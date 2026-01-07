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
        <div className="text-center text-gray-500 py-20 bg-white rounded-xl border border-gray-200">
          Nenhum projeto salvo ainda. Vá para a Calculadora para criar um.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <div className="text-sm text-gray-500 flex gap-4 mt-1">
                  <span>{new Date(project.date).toLocaleDateString()}</span>
                  <span>|</span>
                  <span>{project.printTimeHours}h {project.printTimeMinutes}m</span>
                  <span>|</span>
                  <span>{project.modelWeight}g</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-xs text-gray-500">Custo</p>
                   <p className="text-gray-900 font-mono font-medium">{settings.currencySymbol}{project.result.totalProductionCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-500">Preço</p>
                   <p className="text-xl text-emerald-600 font-bold font-mono">{settings.currencySymbol}{project.result.finalPrice.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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