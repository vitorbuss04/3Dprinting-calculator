import React, { useEffect, useState } from 'react';
import { Project, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Trash2 } from 'lucide-react';

export const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });

  useEffect(() => {
    setProjects(StorageService.getProjects());
    setSettings(StorageService.getSettings());
  }, []);

  const deleteProject = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este orçamento?')) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      StorageService.saveProjects(updated);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Histórico de Orçamentos</h2>
      {projects.length === 0 ? (
        <div className="text-center text-slate-400 py-20 bg-slate-800 rounded-xl border border-slate-700">
          Nenhum projeto salvo ainda. Vá para a Calculadora para criar um.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                <div className="text-sm text-slate-400 flex gap-4 mt-1">
                  <span>{new Date(project.date).toLocaleDateString()}</span>
                  <span>|</span>
                  <span>{project.printTimeHours}h {project.printTimeMinutes}m</span>
                  <span>|</span>
                  <span>{project.modelWeight}g</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-xs text-slate-400">Custo</p>
                   <p className="text-slate-200 font-mono">{settings.currencySymbol}{project.result.totalProductionCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400">Preço</p>
                   <p className="text-xl text-emerald-400 font-bold font-mono">{settings.currencySymbol}{project.result.finalPrice.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-700 rounded-lg transition-colors"
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