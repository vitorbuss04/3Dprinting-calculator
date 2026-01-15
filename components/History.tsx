import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings, ProjectFolder } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Check, X, Loader2, AlertTriangle, PackageOpen, Tag, Calendar, Scaling, PiggyBank, Briefcase, Layers, Clock, FolderOpen, Info, Search, Filter } from 'lucide-react';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

export const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [printers, setPrinters] = useState<Record<string, string>>({});
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [folders, setFolders] = useState<Record<string, ProjectFolder>>({});
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const hasFetched = useRef(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, printersData, materialsData, settingsData, foldersData] = await Promise.all([
        StorageService.getProjects(),
        StorageService.getPrinters(),
        StorageService.getMaterials(),
        StorageService.getSettings(),
        StorageService.getFolders(),
      ]);

      setProjects(projectsData);
      setPrinters(Object.fromEntries(printersData.map(p => [p.id, p.name])));
      setMaterials(Object.fromEntries(materialsData.map(m => [m.id, `${m.name} (${m.type})`])));
      setFolders(Object.fromEntries(foldersData.map(f => [f.id, f])));
      setSettings(settingsData);
    } catch (e) {
      toast.error('Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  const handleDeleteProject = async (id: string) => {
    setDeletingId(null);
    toast.promise(StorageService.deleteProject(id), {
      loading: 'Excluindo...',
      success: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        return 'Projeto excluído!';
      },
      error: 'Erro ao excluir.'
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    setDeletingFolderId(null);
    toast.promise(StorageService.deleteFolder(folderId), {
      loading: 'Excluindo pasta...',
      success: () => {
        const newFolders = { ...folders };
        delete newFolders[folderId];
        setFolders(newFolders);
        setProjects(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
        return 'Pasta excluída! Projetos movidos para "Sem Pasta".';
      },
      error: 'Erro ao excluir.'
    });
  };

  const currency = settings?.currencySymbol || 'R$';

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  const groupedProjects = projects.reduce((groups, project) => {
    const folderId = project.folderId || 'uncategorized';
    if (!groups[folderId]) groups[folderId] = [];
    groups[folderId].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  const allFolderIds = new Set<string>(['uncategorized']);
  Object.keys(folders).forEach(id => allFolderIds.add(id));
  Object.keys(groupedProjects).forEach(id => allFolderIds.add(id));

  const sortedFolderIds = Array.from(allFolderIds).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    const folderA = folders[a];
    const folderB = folders[b];
    if (folderA && folderB) return new Date(folderB.createdAt).getTime() - new Date(folderA.createdAt).getTime();
    return 0;
  });

  if (projects.length === 0 && Object.keys(folders).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-gray-500">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 dark:bg-dark-surface">
          <FolderOpen size={32} className="opacity-50" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Nenhum Projeto</h2>
        <p className="max-w-md">Seu histórico está vazio. Crie seu primeiro projeto na Calculadora.</p>
      </div>
    );
  }

  const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 text-xs p-2.5 bg-gray-50/50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-white/5 dark:hover:bg-white/10">
      <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      <span className="text-gray-500 font-medium tracking-tight whitespace-nowrap dark:text-gray-400">{label}:</span>
      <span className="font-bold text-gray-800 ml-auto truncate max-w-[120px] dark:text-gray-200" title={String(value)}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {sortedFolderIds.map((folderId) => {
        const isUncategorized = folderId === 'uncategorized';
        const folderName = isUncategorized ? 'Outros / Sem Pasta' : (folders[folderId]?.name || 'Pasta Desconhecida');
        const folderProjects = groupedProjects[folderId] || [];

        const folderTotalCost = folderProjects.reduce((sum, p) => sum + p.result.finalPrice, 0);
        const folderTotalProfit = folderProjects.reduce((sum, p) => sum + p.result.profit, 0);
        const folderTotalTime = folderProjects.reduce((sum, p) => sum + (p.printTimeHours + p.printTimeMinutes / 60), 0);

        if (folderProjects.length === 0 && isUncategorized) return null; // Don't show empty uncategorized

        return (
          <div key={folderId} className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-gray-200/60 pb-4 gap-6 dark:border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {isUncategorized ? (
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 dark:bg-white/10 dark:text-gray-400"><PackageOpen size={20} /></div>
                  ) : (
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"><FolderOpen size={20} /></div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight dark:text-gray-100">{folderName}</h2>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center gap-2 dark:bg-white/10 dark:text-gray-400">
                    <Layers size={12} />
                    {folderProjects.length} {folderProjects.length === 1 ? 'projeto' : 'projetos'}
                  </span>
                  {!isUncategorized && (
                    <button
                      onClick={() => setDeletingFolderId(folderId)}
                      className="text-xs font-bold text-red-400 hover:text-red-500 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Excluir Pasta
                    </button>
                  )}
                </div>

                {/* DELETE FOLDER DIALOG */}
                {deletingFolderId === folderId && (
                  <div className="mt-4 p-4 bg-red-50/50 border border-red-100 rounded-xl animate-in slide-in-from-top-2 max-w-md dark:bg-red-900/20 dark:border-red-500/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold text-red-900 text-sm dark:text-red-400">Tem certeza?</p>
                        <p className="text-xs text-red-700 mt-1 mb-3 dark:text-red-300">Os projetos serão movidos para "Sem Pasta".</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 text-xs bg-white hover:bg-red-100 dark:bg-white/5 dark:hover:bg-red-500/20 dark:text-gray-300" onClick={() => setDeletingFolderId(null)}>Cancelar</Button>
                          <Button size="sm" variant="primary" className="h-8 text-xs bg-red-500 hover:bg-red-600 shadow-none border-none dark:bg-red-600 dark:hover:bg-red-700" onClick={() => handleDeleteFolder(folderId)}>Excluir Pasta</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {folderProjects.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm dark:bg-dark-surface dark:border-white/10">
                  <div className="px-4 border-l-2 border-blue-500 pl-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tempo Total</span>
                    <span className="font-bold text-gray-800 text-lg flex items-center gap-1 dark:text-gray-200">
                      <Clock size={14} className="text-blue-500" />
                      {Math.floor(folderTotalTime)}h {Math.round((folderTotalTime % 1) * 60)}m
                    </span>
                  </div>
                  <div className="px-4 border-l-2 border-emerald-500 pl-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Lucro Total</span>
                    <span className="font-bold text-emerald-600 text-lg dark:text-emerald-400">{currency} {folderTotalProfit.toFixed(2)}</span>
                  </div>
                  <div className="px-4 border-l-2 border-indigo-500 pl-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor Total</span>
                    <span className="font-black text-indigo-900 text-xl dark:text-indigo-300">{currency} {folderTotalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {folderProjects.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-300 dark:border-white/10 dark:text-gray-600">
                <FolderOpen size={40} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Pasta vazia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {folderProjects.map((project) => (
                  <Card
                    key={project.id}
                    variant="glass"
                    className={cn(
                      "flex flex-col relative transition-all duration-300 group hover:border-blue-300/50 hover:shadow-lg hover:-translate-y-1",
                      deletingId === project.id && "ring-2 ring-red-500 ring-offset-2"
                    )}
                  >
                    <div className={cn("transition-all duration-300", deletingId === project.id && "opacity-20 blur-sm pointer-events-none")}>
                      <div className="flex justify-between items-start mb-5">
                        <div className="pr-10">
                          <h3 className="font-bold text-lg text-gray-800 leading-snug line-clamp-2 dark:text-gray-100" title={project.name}>{project.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(project.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-5 group-hover:shadow-inner transition-shadow dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-500/20">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Preço Final</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tighter dark:text-blue-400">{currency} {project.result.finalPrice.toFixed(2)}</p>
                      </div>

                      <div className="space-y-2.5">
                        <DetailItem icon={<Tag size={14} />} label="Impressora" value={printers[project.printerId] || 'N/A'} />
                        <DetailItem icon={<PackageOpen size={14} />} label="Material" value={materials[project.materialId] || 'N/A'} />
                        <div className="grid grid-cols-2 gap-2.5">
                          <DetailItem icon={<Clock size={14} />} label="Tempo" value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} />
                          <DetailItem icon={<Scaling size={14} />} label="Peso" value={`${project.modelWeight}g`} />
                        </div>
                        <DetailItem icon={<PiggyBank size={14} />} label="Lucro Líq." value={`${currency} ${project.result.profit.toFixed(2)}`} />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => setDetailsProject(project)}
                        className="p-2 bg-white text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-colors dark:bg-dark-surface dark:border-white/10 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        title="Ver Detalhes"
                      >
                        <Info size={18} />
                      </button>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="p-2 bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg shadow-sm border border-gray-100 transition-colors dark:bg-dark-surface dark:border-white/10 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Delete Confirmation Overlay */}
                    {deletingId === project.id && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 dark:bg-black/80 rounded-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-3 dark:bg-red-900/30 dark:text-red-400">
                          <Trash2 size={24} />
                        </div>
                        <p className="font-bold text-gray-800 mb-4 dark:text-gray-200">Excluir permanentemente?</p>
                        <div className="flex gap-3 w-full">
                          <Button size="sm" variant="ghost" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-300" onClick={() => setDeletingId(null)}>Cancelar</Button>
                          <Button size="sm" variant="primary" className="flex-1 bg-red-500 hover:bg-red-600 border-none shadow-none" onClick={() => handleDeleteProject(project.id)}>Excluir</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <ProjectDetailsModal
        project={detailsProject}
        isOpen={!!detailsProject}
        onClose={() => setDetailsProject(null)}
        printerName={detailsProject ? printers[detailsProject.printerId] : undefined}
        materialName={detailsProject ? materials[detailsProject.materialId] : undefined}
      />
    </div>
  );
};