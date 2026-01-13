import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './UIComponents';
import { Trash2, Check, X, Loader2, AlertTriangle, PackageOpen, Tag, Calendar, Scaling, PiggyBank, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<Record<string, string>>({});
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasFetched = useRef(false); // Ref to prevent double-fetching in Strict Mode

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    const fetchData = async () => {
      const fetchPromise = Promise.all([
        StorageService.getProjects(),
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings(),
      ]);

      toast.promise(fetchPromise, {
        loading: 'Carregando histórico e dados...',
        success: ([projectsData, printersData, materialsData, settingsData]) => {
          setProjects(projectsData);
          setPrinters(Object.fromEntries(printersData.map(p => [p.id, p.name])));
          setMaterials(Object.fromEntries(materialsData.map(m => [m.id, `${m.name} (${m.type})`])));
          setSettings(settingsData);
          return 'Dados carregados com sucesso!';
        },
        error: (err) => `Erro ao carregar os dados: ${err.message}`,
      }).finally(() => {
        setIsLoading(false);
      });
    };

    fetchData();
  }, []); // Empty dependency array is correct

  const handleDeleteProject = async (id: string) => {
    setDeletingId(null);
    
    const deletePromise = StorageService.deleteProject(id);

    toast.promise(deletePromise, {
      loading: 'Excluindo projeto...',
      success: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        return 'Projeto excluído com sucesso!';
      },
      error: (err) => `Erro ao excluir: ${err.message}`,
    });
  };

  const currency = settings?.currencySymbol || 'R$';

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2 text-gray-900">Nenhum Projeto Encontrado</h2>
        <p className="text-gray-500">Você ainda não salvou nenhum projeto. Use a Calculadora para criar e salvar um novo orçamento.</p>
      </div>
    );
  }

  const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 text-xs p-2.5 bg-gray-50/70 rounded-lg">
      <div className="text-gray-400">{icon}</div>
      <span className="text-gray-500 font-medium tracking-tight">{label}:</span>
      <span className="font-bold text-gray-800 ml-auto">{value}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="flex flex-col relative transition-all duration-300">
          <div className={`p-4 transition-all duration-300 ${deletingId === project.id ? 'blur-sm brightness-90' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-800 leading-tight pr-10">{project.name}</h3>
            </div>

            {/* Result */}
            <div className="text-center bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Preço Final</p>
              <p className="text-3xl font-black text-blue-700">{currency} {project.result.finalPrice.toFixed(2)}</p>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <DetailItem icon={<Tag size={14} />} label="Impressora" value={printers[project.printerId] || 'Não encontrada'} />
              <DetailItem icon={<PackageOpen size={14} />} label="Material" value={materials[project.materialId] || 'Não encontrado'} />
              <DetailItem icon={<Calendar size={14} />} label="Data" value={new Date(project.date).toLocaleDateString()} />
              <DetailItem icon={<Scaling size={14} />} label="Peso do Modelo" value={`${project.modelWeight}g`} />
              <DetailItem icon={<Briefcase size={14} />} label="Custo Produção" value={`${currency} ${project.result.totalProductionCost.toFixed(2)}`} />
              <DetailItem icon={<PiggyBank size={14} />} label="Lucro Líquido" value={`${currency} ${project.result.profit.toFixed(2)}`} />
            </div>
          </div>
          
          {/* Default state buttons */}
          <div className={`absolute top-4 right-4 transition-opacity duration-300 ${deletingId === project.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={() => setDeletingId(project.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Excluir projeto"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Confirmation state overlay */}
          {deletingId === project.id && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl">
              <p className="font-bold text-gray-800 mb-4">Confirmar exclusão?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X size={16} /> Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteProject(project.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  <Check size={16} /> Confirmar
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};