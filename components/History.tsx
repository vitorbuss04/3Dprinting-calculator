import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings, ProjectFolder, ProjectStatus } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Check, X, Loader2, AlertTriangle, PackageOpen, Tag, Calendar, Scaling, PiggyBank, Briefcase, Layers, Clock, FolderOpen, Info, Search, Filter, ShieldAlert } from 'lucide-react';
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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
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
      toast.error('Não foi possível sincronizar os dados.');
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
      loading: 'Excluindo registro...',
      success: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        return 'Registro removido com sucesso';
      },
      error: 'Erro ao excluir registro'
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
        return 'Pasta removida, projetos movidos';
      },
      error: 'Erro ao excluir pasta'
    });
  };

  const handleFolderStatusChange = async (folderId: string, newStatus: ProjectStatus) => {
    if (folderId === 'uncategorized') return;
    setUpdatingStatusId(folderId);
    try {
      await StorageService.updateFolderStatus(folderId, newStatus);
      setFolders(prev => ({
        ...prev,
        [folderId]: { ...prev[folderId]! , status: newStatus }
      }));
      toast.success('Status do projeto atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const currency = settings?.currencySymbol || '$';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-technical text-[10px] text-slate-500 uppercase tracking-widest">CARREGANDO HISTÓRICO...</span>
    </div>
  );

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
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 border border-slate-800 flex items-center justify-center mb-6">
          <FolderOpen size={24} className="text-slate-600" />
        </div>
        <h2 className="text-sm font-technical font-black text-slate-400 uppercase tracking-[0.2em] mb-2">SEM PROJETOS</h2>
        <p className="text-[10px] font-technical text-slate-600 uppercase max-w-xs">Nenhum dado operacional encontrado. Inicie um cálculo para gerar histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-500 pb-20">
      {sortedFolderIds.map((folderId) => {
        const isUncategorized = folderId === 'uncategorized';
        const folderName = isUncategorized ? 'PROJETOS SEM PASTA' : (folders[folderId]?.name || 'PASTA DESCONHECIDA');
        const folderProjects = groupedProjects[folderId] || [];

        const folderTotalCost = folderProjects.reduce((sum, p) => sum + p.result.finalPrice, 0);
        const folderTotalProfit = folderProjects.reduce((sum, p) => sum + p.result.profit, 0);
        const folderTotalTime = folderProjects.reduce((sum, p) => sum + (p.printTimeHours + p.printTimeMinutes / 60), 0);

        if (folderProjects.length === 0 && isUncategorized) return null;

        return (
          <div key={folderId} className="space-y-6">
            {/* Mission Manifest Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-800 pb-6 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 border", isUncategorized ? "border-slate-700 text-slate-500" : "border-primary/50 text-primary bg-primary/5")}>
                    {isUncategorized ? <PackageOpen size={18} /> : <FolderOpen size={18} />}
                  </div>
                  <h2 className="text-lg font-technical font-black text-white tracking-[0.1em] uppercase">{folderName}</h2>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-[10px] font-technical font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 border border-slate-800">
                    <Layers size={10} />
                    {folderProjects.length} REGISTROS
                  </span>
                  {!isUncategorized && (
                    <div className="flex items-center gap-4">
                      <div className="w-48">
                        <select
                          value={folders[folderId]?.status || 'aguardando'}
                          onChange={(e) => handleFolderStatusChange(folderId, e.target.value as ProjectStatus)}
                          disabled={updatingStatusId === folderId}
                          className="w-full bg-slate-900 border border-slate-800 text-[10px] font-technical text-slate-200 uppercase px-3 py-1 appearance-none focus:outline-none focus:border-slate-600 rounded-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="aguardando">⏳ AGUARDANDO</option>
                          <option value="em_producao">⚙️ EM PRODUÇÃO</option>
                          <option value="concluido">✅ CONCLUÍDO</option>
                          <option value="cancelado">✖ CANCELADO</option>
                        </select>
                      </div>
                      <StatusBadge status={folders[folderId]?.status || 'aguardando'} />
                      <button
                        onClick={() => setDeletingFolderId(folderId)}
                        className="text-[10px] font-technical font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={10} /> EXCLUIR PASTA
                      </button>
                    </div>
                  )}
                </div>

                {/* PURGE OVERLAY */}
                {deletingFolderId === folderId && (
                  <div className="p-4 border border-red-500/30 bg-red-500/5 mt-4 max-w-md animate-in slide-in-from-left-4">
                    <div className="flex items-start gap-4">
                      <ShieldAlert className="text-red-500 shrink-0" size={16} />
                      <div>
                        <p className="font-technical text-[10px] font-black text-red-500 uppercase tracking-widest">CONFIRMAR EXCLUSÃO</p>
                        <p className="text-[10px] font-technical text-slate-400 uppercase mt-1 mb-3">A pasta será excluída. Registros contidos serão movidos para projetos sem pasta.</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 text-[9px] border-slate-700 hover:bg-slate-800 font-technical uppercase" onClick={() => setDeletingFolderId(null)}>CANCELAR</Button>
                          <Button size="sm" variant="primary" className="h-7 text-[9px] bg-red-600 hover:bg-red-700 font-technical uppercase border-none" onClick={() => handleDeleteFolder(folderId)}>EXECUTAR</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {folderProjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950 p-4 border border-slate-800">
                  <div className="px-4 border-l border-primary/30">
                    <span className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest block mb-1">TEMPO TOTAL</span>
                    <span className="font-technical font-black text-white text-base flex items-center gap-1.5">
                      <Clock size={12} className="text-primary" />
                      {Math.floor(folderTotalTime)}h {Math.round((folderTotalTime % 1) * 60)}m
                    </span>
                  </div>
                  <div className="px-4 border-l border-emerald-500/30">
                    <span className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest block mb-1">LUCRO TOTAL</span>
                    <span className="font-technical font-black text-emerald-500 text-base">{currency} {folderTotalProfit.toFixed(2)}</span>
                  </div>
                  <div className="px-4 border-l border-indigo-500/30 col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-4 sm:pt-0">
                    <span className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest block mb-1">VALOR TOTAL</span>
                    <span className="font-technical font-black text-white text-xl">{currency} {folderTotalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {folderProjects.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 flex flex-col items-center justify-center">
                <FolderOpen size={24} className="text-slate-800 mb-2" />
                <p className="text-[10px] font-technical text-slate-700 uppercase tracking-widest">Pasta sem projetos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {folderProjects.map((project) => (
                  <Card
                    key={project.id}
                    variant="industrial"
                    className={cn(
                      "flex flex-col relative p-0 group transition-all duration-300",
                      deletingId === project.id && "border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                    )}
                  >
                    <div className={cn("transition-all duration-300 p-6", deletingId === project.id && "opacity-20 blur-sm pointer-events-none")}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                          <h3 className="font-technical font-black text-sm text-white uppercase tracking-wider line-clamp-1">{project.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary/40" />
                            <p className="text-[9px] font-technical text-slate-500 uppercase tracking-widest">DATA: {new Date(project.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 opacity-5">
                            <div className="absolute top-0 right-0 border-t-8 border-r-8 border-t-white border-r-transparent rotate-180" />
                        </div>
                        <p className="text-[9px] font-technical font-black text-slate-500 uppercase tracking-[0.2em] mb-1">VALOR DA PEÇA</p>
                        <p className="text-3xl font-technical font-black text-white tracking-tighter">
                            <span className="text-primary mr-1 bg-primary/10 px-1">{currency}</span>
                            {project.result.finalPrice.toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <HistoryDetail icon={<Tag size={12} />} label="IMPRESSORA" value={printers[project.printerId] || 'N/A'} />
                        <HistoryDetail icon={<PackageOpen size={12} />} label="MATERIAL" value={materials[project.materialId] || 'N/A'} />
                        <div className="grid grid-cols-2 gap-2">
                          <HistoryDetail icon={<Clock size={12} />} label="TEMPO" value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} />
                          <HistoryDetail icon={<Scaling size={12} />} label="PESO" value={`${project.modelWeight}g`} />
                        </div>
                        <HistoryDetail icon={<PiggyBank size={12} />} label="LUCRO" value={`${currency} ${project.result.profit.toFixed(2)}`} color="text-emerald-500" />
                      </div>
                    </div>

                    {/* Action Palette */}
                    <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => setDetailsProject(project)}
                        className="w-8 h-8 border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-primary/50 transition-colors flex items-center justify-center"
                        title="Ver detalhes"
                      >
                        <Info size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="w-8 h-8 border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-500 hover:border-red-900/50 transition-colors flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Purge Confirmation */}
                    {deletingId === project.id && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-slate-950/90">
                        <ShieldAlert className="text-red-500 mb-4" size={32} />
                        <h4 className="font-technical font-black text-xs text-white uppercase tracking-[0.2em] mb-4">EXCLUIR ESTE PROJETO?</h4>
                        <div className="flex gap-2 w-full max-w-[200px]">
                          <Button size="sm" variant="ghost" className="flex-1 h-8 text-[10px] font-technical uppercase border-slate-700 hover:bg-slate-800" onClick={() => setDeletingId(null)}>CANCELAR</Button>
                          <Button size="sm" variant="primary" className="flex-1 h-8 text-[10px] font-technical uppercase bg-red-600 hover:bg-red-700 border-none" onClick={() => handleDeleteProject(project.id)}>CONFIRMAR</Button>
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
        folderStatus={detailsProject ? folders[detailsProject.folderId]?.status : undefined}
      />
    </div>
  );
};

const HistoryDetail = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) => (
  <div className="flex items-center justify-between p-2 border border-slate-900 bg-slate-900/30">
    <div className="flex items-center gap-2">
      <div className="text-slate-600">{icon}</div>
      <span className="text-[9px] font-technical font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className={cn("text-[10px] font-technical font-black text-slate-200 truncate max-w-[140px]", color)}>{value}</span>
  </div>
);

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  aguardando:   { label: 'AGUARDANDO',   color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
  em_producao:  { label: 'EM PRODUÇÃO',  color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' },
  concluido:    { label: 'CONCLUÍDO',    color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
  cancelado:    { label: 'CANCELADO',    color: 'border-red-500/50 text-red-400 bg-red-500/10' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['aguardando'];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 border text-[8px] font-technical font-black uppercase tracking-widest shrink-0', cfg.color)}>
      {cfg.label}
    </span>
  );
};