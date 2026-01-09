import React, { useEffect, useState } from 'react';
import { Project, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Trash2, Loader2, Calendar, Clock, Weight } from 'lucide-react';
import { neuShadowIn, neuShadowOut } from './UIComponents';

export const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ currencySymbol: '$', electricityCost: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [p, s] = await Promise.all([StorageService.getProjects(), StorageService.getSettings()]);
      setProjects(p);
      setSettings(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  const deleteProject = async (id: string) => {
    if(confirm('Excluir este registro permanentemente?')) {
      try {
        await StorageService.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
      } catch (e) { alert('Erro ao excluir'); }
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="h-full flex flex-col min-h-0">
      {projects.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center ${neuShadowIn} rounded-[3vw] text-gray-400`}>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.4em]">Histórico Imaculado</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
          {projects.map((project) => (
            <div key={project.id} className={`${neuShadowOut} p-6 rounded-[2vw] flex flex-col md:flex-row justify-between items-center gap-6 group transition-all hover:scale-[1.005]`}>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{project.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                  {[
                    { icon: Calendar, label: new Date(project.date).toLocaleDateString() },
                    { icon: Clock, label: `${project.printTimeHours}h ${project.printTimeMinutes}m` },
                    { icon: Weight, label: `${project.modelWeight}g` }
                  ].map((chip, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${neuShadowIn} text-[0.55rem] font-black text-gray-400 uppercase tracking-widest`}>
                      <chip.icon size={10} className="text-blue-500" />
                      {chip.label}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                   <p className="text-[0.5rem] font-black uppercase text-gray-400 tracking-widest mb-0.5">Sugestão Venda</p>
                   <p className="text-xl text-emerald-600 font-black tracking-tighter leading-none">{settings.currencySymbol}{project.result.finalPrice.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className={`p-3.5 rounded-xl ${neuShadowOut} text-gray-300 hover:text-red-500 active:shadow-inner transition-all group-hover:text-gray-400`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
