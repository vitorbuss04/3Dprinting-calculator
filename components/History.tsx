import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './UIComponents';
import { Trash2, Check, X, Loader2, AlertTriangle, PackageOpen, Tag, Calendar, Scaling, PiggyBank, Briefcase, Layers, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<Record<string, string>>({});
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [folders, setFolders] = useState<Record<string, ProjectFolder>>({});
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
        StorageService.getFolders(),
      ]);

      toast.promise(fetchPromise, {
        loading: 'Carregando histórico e dados...',
        success: ([projectsData, printersData, materialsData, settingsData, foldersData]) => {
          setProjects(projectsData);
          setPrinters(Object.fromEntries(printersData.map(p => [p.id, p.name])));
          setMaterials(Object.fromEntries(materialsData.map(m => [m.id, `${m.name} (${m.type})`])));
          setFolders(Object.fromEntries(foldersData.map(f => [f.id, f])));
          setSettings(settingsData);
          return 'Dados carregados com sucesso!';
        },
        error: 'Não foi possível carregar os dados.',
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
      error: 'Erro ao excluir o projeto.',
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


  // Group projects by folder
  const groupedProjects = projects.reduce((groups, project) => {
    const folderId = project.folderId || 'uncategorized';
    if (!groups[folderId]) {
      groups[folderId] = [];
    }
    groups[folderId].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort folders: Uncategorized last, then by recent activity
  const sortedFolderIds = Object.keys(groupedProjects).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    // Sort by most recent project date in the folder
    const dateA = Math.max(...groupedProjects[a].map(p => new Date(p.date).getTime()));
    const dateB = Math.max(...groupedProjects[b].map(p => new Date(p.date).getTime()));
    return dateB - dateA;
  });

  return (
    <div className="space-y-12">
      {sortedFolderIds.map((folderId) => {
        const folderName = folderId === 'uncategorized' ? 'Outros / Sem Pasta' : (folders[folderId]?.name || 'Pasta Desconhecida');
        const folderProjects = groupedProjects[folderId];

        // Calculate Totals per Folder
        const folderTotalCost = folderProjects.reduce((sum, p) => sum + p.result.finalPrice, 0);
        const folderTotalProfit = folderProjects.reduce((sum, p) => sum + p.result.profit, 0);
        const folderTotalTime = folderProjects.reduce((sum, p) => sum + (p.printTimeHours + p.printTimeMinutes / 60), 0);

        return (
          <div key={folderId} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-gray-100 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                  {folderId !== 'uncategorized' ? <Tag className="text-blue-500" /> : <PackageOpen className="text-gray-400" />}
                  {folderName}
                </h2>
                <p className="text-gray-500 text-sm font-medium mt-1">{folderProjects.length} {folderProjects.length === 1 ? 'impressão' : 'impressões'} neste projeto</p>
              </div>

              <div className="flex gap-4 md:gap-8 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tempo Total</span>
                  <span className="font-bold text-gray-700">{Math.floor(folderTotalTime)}h {Math.round((folderTotalTime % 1) * 60)}m</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lucro Total</span>
                  <span className="font-bold text-emerald-600">{currency} {folderTotalProfit.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valor Total</span>
                  <span className="text-2xl font-black text-blue-600 tracking-tighter">{currency} {folderTotalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {folderProjects.map((project) => (
                <Card key={project.id} className="flex flex-col relative transition-all duration-300 hover:shadow-lg border-l-4 border-l-transparent hover:border-l-blue-500">
                  <div className={`p-4 transition-all duration-300 ${deletingId === project.id ? 'blur-sm brightness-90' : ''}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight pr-8 line-clamp-2" title={project.name}>{project.name}</h3>
                    </div>

                    {/* Result */}
                    <div className="text-center bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Preço da Peça</p>
                      <p className="text-2xl font-black text-blue-700">{currency} {project.result.finalPrice.toFixed(2)}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <DetailItem icon={<Tag size={14} />} label="Impressora" value={printers[project.printerId] || 'Não encontrada'} />
                      <DetailItem icon={<PackageOpen size={14} />} label="Material" value={materials[project.materialId] || 'Não encontrado'} />
                      <DetailItem icon={<Calendar size={14} />} label="Data" value={new Date(project.date).toLocaleDateString()} />
                      <DetailItem icon={<Clock size={14} />} label="Tempo" value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} />
                      <DetailItem icon={<Scaling size={14} />} label="Peso" value={`${project.modelWeight}g`} />

                      {project.result.additionalCost > 0 && (
                        <DetailItem icon={<Layers size={14} />} label="Outros" value={`${currency} ${project.result.additionalCost.toFixed(2)}`} />
                      )}
                      <DetailItem icon={<PiggyBank size={14} />} label="Lucro" value={`${currency} ${project.result.profit.toFixed(2)}`} />
                    </div>
                  </div>

                  {/* Default state buttons */}
                  <div className={`absolute top-4 right-4 transition-opacity duration-300 ${deletingId === project.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <button
                      onClick={() => setDeletingId(project.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir peça"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Confirmation state overlay */}
                  {deletingId === project.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/90 backdrop-blur-sm rounded-2xl z-10 text-center">
                      <p className="font-bold text-gray-800 mb-4 text-sm">Excluir "{project.name}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                          <X size={14} /> Cancelar
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                          <Check size={14} /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

};