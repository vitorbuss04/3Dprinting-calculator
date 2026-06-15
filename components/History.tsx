import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings, ProjectFolder, ProjectStatus } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Loader2, PackageOpen, Tag, Layers, Clock, FolderOpen, FolderInput, Info, ChevronDown, Trash, ShieldAlert } from 'lucide-react';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useTranslation } from 'react-i18next';

export const History: React.FC = () => {
  const { t } = useTranslation();
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
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
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
      toast.error(t('sync_data_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  const handleUpdateProject = async (id: string, newResult: any) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    const updated = { ...proj, result: newResult };
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
    StorageService.updateProject(id, updated).catch(() => {
      // Rollback optimistic update on failure
      setProjects(prev => prev.map(p => p.id === id ? proj : p));
      toast.error(t('update_project_error'));
    });
  };

  const handleDeleteProject = async (id: string) => {
    setDeletingId(null);
    toast.promise(StorageService.deleteProject(id), {
      loading: t('deleting_record_loading'),
      success: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        return t('deleting_record_success');
      },
      error: t('deleting_record_error')
    });
  };

  const handleMoveProject = async (projectId: string, targetFolderId: string | null) => {
    setMovingProjectId(null);
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updated = { ...proj, folderId: targetFolderId };

    toast.promise(StorageService.updateProject(projectId, updated), {
      loading: t('moving_project_loading'),
      success: () => {
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        return t('moving_project_success');
      },
      error: t('moving_project_error')
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    setDeletingFolderId(null);
    toast.promise(StorageService.deleteFolder(folderId), {
      loading: t('deleting_folder_loading'),
      success: () => {
        const newFolders = { ...folders };
        Reflect.deleteProperty(newFolders, folderId);
        setFolders(newFolders);
        setProjects(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
        return t('deleting_folder_success');
      },
      error: t('deleting_folder_error')
    });
  };

  const handleFolderStatusChange = async (folderId: string, newStatus: ProjectStatus) => {
    if (folderId === 'uncategorized') return;
    setUpdatingStatusId(folderId);
    try {
      await StorageService.updateFolderStatus(folderId, newStatus);
      setFolders(prev => {
        const folder = Reflect.get(prev, folderId);
        if (folder) {
          const updatedFolder = { ...folder, status: newStatus };
          const newFolders = { ...prev };
          Reflect.set(newFolders, folderId, updatedFolder);
          return newFolders;
        }
        return prev;
      });
      toast.success(t('status_update_success'));
    } catch {
      toast.error(t('status_update_error'));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const currency = settings?.currencySymbol || '$';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span className="font-sans text-xs text-muted uppercase tracking-wider">{t('loading_history')}</span>
    </div>
  );

  const groupedProjects = projects.reduce((groups, project) => {
    const folderId = project.folderId || 'uncategorized';
    const group = (Reflect.get(groups, folderId) || []) as Project[];
    group.push(project);
    Reflect.set(groups, folderId, group);
    return groups;
  }, {} as Record<string, Project[]>);

  const allFolderIds = new Set<string>(['uncategorized']);
  Object.keys(folders).forEach(id => allFolderIds.add(id));
  Object.keys(groupedProjects).forEach(id => allFolderIds.add(id));

  const sortedFolderIds = Array.from(allFolderIds).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    const folderA = Reflect.get(folders, a);
    const folderB = Reflect.get(folders, b);
    if (folderA && folderB) return new Date(folderB.createdAt).getTime() - new Date(folderA.createdAt).getTime();
    return 0;
  });

  if (projects.length === 0 && Object.keys(folders).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 border border-hairline rounded-full flex items-center justify-center mb-6 text-muted">
          <FolderOpen size={24} />
        </div>
        <h2 className="text-sm font-sans font-semibold text-ink mb-2">{t('no_projects')}</h2>
        <p className="text-xs font-sans text-muted max-w-xs">{t('no_operational_data_desc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {sortedFolderIds.map((folderId) => {
        const isUncategorized = folderId === 'uncategorized';
        const folderObj = isUncategorized ? null : Reflect.get(folders, folderId);
        const folderName = isUncategorized 
          ? t('uncategorized_folder_name') 
          : (folderObj?.name || t('unknown_folder_name'));
        const folderProjects = (Reflect.get(groupedProjects, folderId) || []) as Project[];

        const folderTotalCost = folderProjects.reduce((sum, p) => sum + (Number(p.result?.finalPrice) || 0), 0);
        const folderTotalProfit = folderProjects.reduce((sum, p) => sum + (Number(p.result?.profit) || 0), 0);
        const folderTotalProdCost = folderProjects.reduce((sum, p) => sum + (Number(p.result?.totalProductionCost) || 0), 0);
        const folderTotalTime = folderProjects.reduce((sum, p) => sum + ((Number(p.printTimeHours) || 0) + (Number(p.printTimeMinutes) || 0) / 60), 0);

        if (folderProjects.length === 0 && isUncategorized) return null;

        return (
          <div key={folderId} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-hairline pb-4 gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 border rounded-xl", isUncategorized ? "border-hairline text-muted bg-surface-soft" : "border-primary/20 text-primary bg-primary-soft")}>
                    {isUncategorized ? <PackageOpen size={18} /> : <FolderOpen size={18} />}
                  </div>
                  <h2 className="text-base font-sans font-semibold text-ink">{folderName}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-sans text-muted bg-surface-soft px-3 py-1 rounded-full border border-hairline">
                    <Layers size={12} />
                    {folderProjects.length} {t('records_count_suffix')}
                  </span>
                  {!isUncategorized && (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-40 relative">
                        <select
                          value={folderObj?.status || 'aguardando'}
                          onChange={(e) => handleFolderStatusChange(folderId, e.target.value as ProjectStatus)}
                          disabled={updatingStatusId === folderId}
                          className="w-full bg-canvas border border-hairline text-xs font-sans text-ink px-3 py-1.5 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          <option value="aguardando">⏳ {t('status_waiting')}</option>
                          <option value="em_producao">⚙️ {t('status_production')}</option>
                          <option value="concluido">✅ {t('status_completed')}</option>
                          <option value="cancelado">✖ {t('status_cancelled')}</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
                      </div>
                      <StatusBadge status={folderObj?.status || 'aguardando'} />
                      <button
                        onClick={() => setDeletingFolderId(folderId)}
                        className="text-xs font-sans font-medium text-red hover:text-red/80 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> {t('delete_folder')}
                      </button>
                    </div>
                  )}
                </div>

                {/* DELETE CONFIRM OVERLAY */}
                {deletingFolderId === folderId && (
                  <div className="p-4 border border-red/20 bg-red/5 rounded-2xl mt-4 max-w-md animate-in slide-in-from-left-4">
                    <div className="flex items-start gap-4">
                      <ShieldAlert className="text-red shrink-0" size={18} />
                      <div>
                        <p className="font-sans text-sm font-semibold text-red">{t('confirm_deletion')}</p>
                        <p className="text-xs font-sans text-muted mt-1 mb-3">{t('folder_delete_warning')}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setDeletingFolderId(null)}>{t('cancel')}</Button>
                          <Button size="sm" className="h-8 text-xs bg-red hover:bg-red/90 text-white" onClick={() => handleDeleteFolder(folderId)}>{t('execute')}</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {folderProjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-soft p-4 border border-hairline rounded-2xl">
                  <div className="px-4 border-l-2 border-primary">
                    <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block mb-0.5">{t('total_time')}</span>
                    <span className="font-sans font-semibold text-ink text-sm flex items-center gap-1">
                      <Clock size={12} className="text-primary" />
                      {Math.floor(folderTotalTime)}h {Math.round((folderTotalTime % 1) * 60)}m
                    </span>
                  </div>
                  <div className="px-4 border-l-2 border-red">
                    <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block mb-0.5">{t('total_cost')}</span>
                    <span className="font-sans font-semibold text-red text-sm">{currency} {folderTotalProdCost.toFixed(2)}</span>
                  </div>
                  <div className="px-4 border-l-2 border-green">
                    <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block mb-0.5">{t('total_profit')}</span>
                    <span className="font-sans font-semibold text-green text-sm">{currency} {folderTotalProfit.toFixed(2)}</span>
                  </div>
                  <div className="px-4 border-l-2 border-primary-hover">
                    <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider block mb-0.5">{t('total_value')}</span>
                    <span className="font-sans font-semibold text-ink text-sm">{currency} {folderTotalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {folderProjects.length === 0 ? (
              <div className="p-8 border border-dashed border-hairline rounded-2xl flex flex-col items-center justify-center text-muted">
                <FolderOpen size={24} className="mb-2 opacity-50" />
                <p className="text-xs font-sans italic">{t('folder_without_projects')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {folderProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currency={currency}
                    printers={printers}
                    materials={materials}
                    deletingId={deletingId}
                    setDetailsProject={setDetailsProject}
                    setDeletingId={setDeletingId}
                    handleDeleteProject={handleDeleteProject}
                    onUpdateProject={handleUpdateProject}
                    movingProjectId={movingProjectId}
                    setMovingProjectId={setMovingProjectId}
                    selectedFolderId={selectedFolderId}
                    setSelectedFolderId={setSelectedFolderId}
                    folders={folders}
                    handleMoveProject={handleMoveProject}
                  />
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
        printerName={detailsProject ? (Reflect.get(printers, detailsProject.printerId) as string) : undefined}
        materialName={detailsProject ? (Reflect.get(materials, detailsProject.materialId) as string) : undefined}
        folderStatus={detailsProject ? (Reflect.get(folders, detailsProject.folderId) as ProjectFolder)?.status : undefined}
      />
    </div>
  );
};

const HistoryDetail = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) => (
  <div className="flex items-center justify-between p-2.5 border border-hairline bg-surface-soft rounded-lg">
    <div className="flex items-center gap-2">
      <div className="text-muted">{icon}</div>
      <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{label}</span>
    </div>
    <span className={cn("text-xs font-sans font-medium text-ink truncate max-w-[140px]", color)}>{value}</span>
  </div>
);

const getStatusConfig = (status: string, t: any) => {
  switch (status) {
    case 'em_producao':
      return { label: t('status_production'), color: 'border-primary/20 text-primary bg-primary-soft' };
    case 'concluido':
      return { label: t('status_completed'), color: 'border-green/20 text-green bg-green/5' };
    case 'cancelado':
      return { label: t('status_cancelled'), color: 'border-red/20 text-red bg-red/5' };
    default:
      return { label: t('status_waiting'), color: 'border-yellow/20 text-yellow bg-yellow/5' };
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const cfg = getStatusConfig(status, t);
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 border text-[10px] font-sans font-medium rounded-full uppercase tracking-wider shrink-0 shadow-sm', cfg.color)}>
      {cfg.label}
    </span>
  );
};

const EditableHistoryDetail = ({ icon, label, value, color, currency, onChange }: { icon: React.ReactNode; label: string; value: string; color?: string; currency: string; onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between p-2.5 border border-hairline bg-surface-soft rounded-lg">
    <div className="flex items-center gap-2">
      <div className="text-muted">{icon}</div>
      <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex items-center justify-end">
      <span className={cn("text-xs font-sans font-medium mr-1", color)}>{currency}</span>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className={cn("bg-transparent border-b border-dashed border-hairline hover:border-muted p-0 text-right focus:outline-none focus:border-primary text-xs font-sans font-semibold w-20 transition-colors", color)}
        step="any"
      />
    </div>
  </div>
);

const ProjectCard = ({ 
  project, 
  currency, 
  printers, 
  materials, 
  deletingId, 
  setDetailsProject, 
  setDeletingId, 
  handleDeleteProject,
  onUpdateProject,
  movingProjectId,
  setMovingProjectId,
  selectedFolderId,
  setSelectedFolderId,
  folders,
  handleMoveProject
}: {
  project: Project;
  currency: string;
  printers: Record<string, string>;
  materials: Record<string, string>;
  deletingId: string | null;
  setDetailsProject: (p: Project) => void;
  setDeletingId: (id: string | null) => void;
  handleDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, newResult: any) => void;
  movingProjectId: string | null;
  setMovingProjectId: (id: string | null) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  folders: Record<string, ProjectFolder>;
  handleMoveProject: (projectId: string, targetFolderId: string | null) => void;
}) => {
  const { t } = useTranslation();
  const [localFinalPrice, setLocalFinalPrice] = useState((Number(project.result?.finalPrice) || 0).toFixed(2));
  const [localProfit, setLocalProfit] = useState((Number(project.result?.profit) || 0).toFixed(2));
  const [localCost, setLocalCost] = useState((Number(project.result?.totalProductionCost) || 0).toFixed(2));

  useEffect(() => {
    if (Math.abs(parseFloat(localFinalPrice || "0") - (Number(project.result?.finalPrice) || 0)) > 0.01) {
      setLocalFinalPrice((Number(project.result?.finalPrice) || 0).toFixed(2));
    }
    if (Math.abs(parseFloat(localProfit || "0") - (Number(project.result?.profit) || 0)) > 0.01) {
      setLocalProfit((Number(project.result?.profit) || 0).toFixed(2));
    }
    if (Math.abs(parseFloat(localCost || "0") - (Number(project.result?.totalProductionCost) || 0)) > 0.01) {
      setLocalCost((Number(project.result?.totalProductionCost) || 0).toFixed(2));
    }
  }, [project.result?.finalPrice, project.result?.profit, project.result?.totalProductionCost]);

  const updateValues = (field: 'finalPrice' | 'profit' | 'totalProductionCost', val: string) => {
    const numVal = parseFloat(val);
    const safeNumVal = isNaN(numVal) ? 0 : numVal;
    
    let newFinalPrice = project.result.finalPrice;
    let newProfit = project.result.profit;
    let newCost = project.result.totalProductionCost;

    if (field === 'finalPrice') {
      setLocalFinalPrice(val);
      newFinalPrice = safeNumVal;
      newProfit = safeNumVal - newCost;
      setLocalProfit(newProfit.toFixed(2));
    } else if (field === 'profit') {
      setLocalProfit(val);
      newProfit = safeNumVal;
      newFinalPrice = newCost + safeNumVal;
      setLocalFinalPrice(newFinalPrice.toFixed(2));
    } else if (field === 'totalProductionCost') {
      setLocalCost(val);
      newCost = safeNumVal;
      newProfit = newFinalPrice - safeNumVal;
      setLocalProfit(newProfit.toFixed(2));
    }

    onUpdateProject(project.id, {
      ...project.result,
      finalPrice: newFinalPrice,
      profit: newProfit,
      totalProductionCost: newCost
    });
  };

  return (
    <Card
      variant="default"
      className={cn(
        "flex flex-col relative p-6 group transition-all duration-300 border border-hairline",
        deletingId === project.id && "border-red shadow-md",
        movingProjectId === project.id && "border-primary shadow-md"
      )}
    >
      <div className={cn("transition-all duration-300", (deletingId === project.id || movingProjectId === project.id) && "opacity-10 blur-sm pointer-events-none")}>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1 min-w-0 pr-12">
            <h3 className="font-sans font-semibold text-sm text-ink truncate">{project.name}</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
              <p className="text-[10px] font-sans text-muted">{t('date_label')}{new Date(project.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-soft border border-hairline rounded-xl p-4 mb-4 relative overflow-hidden">
          <p className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{t('part_value')}</p>
          <div className="text-2xl font-sans font-semibold text-ink tracking-tight flex items-center">
              <span className="text-primary mr-1">{currency}</span>
              <input
                type="number"
                value={localFinalPrice}
                onChange={(e) => updateValues('finalPrice', e.target.value)}
                className="bg-transparent border-b border-dashed border-hairline hover:border-muted focus:border-primary text-ink focus:outline-none w-32 transition-colors px-1"
                step="any"
              />
          </div>
        </div>

        <div className="space-y-2">
          <HistoryDetail icon={<Tag size={12} />} label={t('printer_label')} value={(Reflect.get(printers, project.printerId) as string) || 'N/A'} />
          <HistoryDetail icon={<PackageOpen size={12} />} label={t('material_label')} value={(Reflect.get(materials, project.materialId) as string) || 'N/A'} />
          <div className="grid grid-cols-2 gap-2">
            <HistoryDetail icon={<Clock size={12} />} label={t('time_label')} value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} />
            <HistoryDetail icon={<Layers size={12} />} label={t('weight_label')} value={`${project.modelWeight}g`} />
          </div>
          <EditableHistoryDetail 
            icon={<Clock size={12} />} 
            label={t('production_cost')} 
            value={localCost} 
            color="text-muted" 
            currency={currency}
            onChange={(v) => updateValues('totalProductionCost', v)}
          />
          <EditableHistoryDetail 
            icon={<Clock size={12} />} 
            label={t('profit_label')} 
            value={localProfit} 
            color="text-green" 
            currency={currency}
            onChange={(v) => updateValues('profit', v)}
          />
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-1 bg-canvas border border-hairline rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => {
            setMovingProjectId(project.id);
            setSelectedFolderId(project.folderId || '');
          }}
          className="w-7 h-7 rounded-full text-muted hover:text-primary hover:bg-surface-soft transition-colors flex items-center justify-center"
          title={t('move_to_project')}
        >
          <FolderInput size={14} />
        </button>
        <button
          onClick={() => setDetailsProject(project)}
          className="w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors flex items-center justify-center"
          title="Ver detalhes"
        >
          <Info size={14} />
        </button>
        <button
          onClick={() => setDeletingId(project.id)}
          className="w-7 h-7 rounded-full text-muted hover:text-red hover:bg-surface-soft transition-colors flex items-center justify-center"
          title="Excluir"
        >
          <Trash size={14} />
        </button>
      </div>

      {deletingId === project.id && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-canvas/95 rounded-2xl border border-hairline">
          <ShieldAlert className="text-red mb-3" size={28} />
          <h4 className="font-sans font-semibold text-xs text-ink mb-4">{t('delete_this_project_q')}</h4>
          <div className="flex gap-2 w-full max-w-[200px]">
            <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs font-sans" onClick={() => setDeletingId(null)}>{t('cancel')}</Button>
            <Button size="sm" className="flex-1 h-8 text-xs font-sans bg-red hover:bg-red/90 text-white border-none" onClick={() => handleDeleteProject(project.id)}>{t('confirm')}</Button>
          </div>
        </div>
      )}

      {movingProjectId === project.id && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-canvas/95 border border-primary/20 rounded-2xl">
          <FolderOpen className="text-primary mb-3" size={28} />
          <h4 className="font-sans font-semibold text-xs text-ink mb-3">{t('move_to_project')}</h4>
          <div className="w-full max-w-[200px] space-y-3">
            <div className="relative">
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full bg-canvas border border-hairline text-xs font-sans text-ink px-3 py-2 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl cursor-pointer"
              >
                <option value="">{t('uncategorized_folder_name')}</option>
                {Object.values(folders).map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs font-sans" onClick={() => setMovingProjectId(null)}>{t('cancel')}</Button>
              <Button size="sm" className="flex-1 h-8 text-xs font-sans bg-primary hover:bg-primary-hover text-white border-none" onClick={() => handleMoveProject(project.id, selectedFolderId)}>{t('confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};