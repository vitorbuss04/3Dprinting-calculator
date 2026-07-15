import React, { useState, useEffect, useRef } from 'react';
import { Project, Printer, Material, GlobalSettings, ProjectFolder, ProjectStatus, Payment } from '../types';
import { StorageService } from '../services/storage';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Loader2, PackageOpen, Tag, Layers, Clock, FolderOpen, FolderInput, Info, ChevronDown, Trash, ShieldAlert, Plus, Calendar, FileText, History as HistoryIcon, DollarSign, ArrowLeft } from 'lucide-react';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { Select } from './ui/Select';
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
  const [viewingFolderId, setViewingFolderId] = useState<string | null>(null);
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

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (detailsProject?.id === updated.id) {
      setDetailsProject(updated);
    }
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
        if (viewingFolderId === folderId) {
          setViewingFolderId(null);
        }
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

  const handleUpdateFolder = async (folderId: string, updatedFields: Partial<ProjectFolder>) => {
    try {
      await StorageService.updateFolder(folderId, updatedFields);
      setFolders(prev => {
        const folder = Reflect.get(prev, folderId);
        if (folder) {
          const updatedFolder = { ...folder, ...updatedFields };
          const newFolders = { ...prev };
          Reflect.set(newFolders, folderId, updatedFolder);
          return newFolders;
        }
        return prev;
      });
    } catch {
      toast.error(t('saving_changes_error'));
      throw new Error("Erro ao atualizar pasta");
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

  if (viewingFolderId === null) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedFolderIds.map((folderId) => {
            const isUncategorized = folderId === 'uncategorized';
            const folderObj = isUncategorized ? null : Reflect.get(folders, folderId);
            const folderName = isUncategorized 
              ? t('uncategorized_folder_name') 
              : (folderObj?.name || t('unknown_folder_name'));
            const folderProjects = (Reflect.get(groupedProjects, folderId) || []) as Project[];

            if (folderProjects.length === 0 && isUncategorized) return null;

            const folderTotalCost = folderProjects.reduce((sum, p) => sum + (Number(p.result?.finalPrice) || 0), 0);
            const folderTotalProfit = folderProjects.reduce((sum, p) => sum + (Number(p.result?.profit) || 0), 0);
            const folderTotalProdCost = folderProjects.reduce((sum, p) => sum + (Number(p.result?.totalProductionCost) || 0), 0);
            const folderTotalTime = folderProjects.reduce((sum, p) => sum + ((Number(p.printTimeHours) || 0) + (Number(p.printTimeMinutes) || 0) / 60), 0);

            return (
              <Card 
                key={folderId}
                onClick={() => setViewingFolderId(folderId)}
                className="p-6 cursor-pointer border border-hairline hover:border-primary/40 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 border rounded-xl transition-colors group-hover:border-primary/20 group-hover:bg-primary-soft text-muted group-hover:text-primary bg-surface-soft", !isUncategorized && "text-primary border-primary/10 bg-primary-soft/50")}>
                        {isUncategorized ? <PackageOpen size={20} /> : <FolderOpen size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-sans font-semibold text-sm text-ink group-hover:text-primary transition-colors truncate max-w-[160px]">{folderName}</h3>
                        <span className="text-[10px] font-sans text-muted bg-surface-soft px-2 py-0.5 rounded-full border border-hairline mt-1 inline-block">
                          {folderProjects.length} {t('records_count_suffix')}
                        </span>
                      </div>
                    </div>
                    {!isUncategorized && folderObj && (
                      <StatusBadge status={folderObj.status || 'aguardando'} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 border-t border-hairline pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_value')}</span>
                      <span className="text-xs font-sans font-semibold text-ink">{currency} {folderTotalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_profit')}</span>
                      <span className="text-xs font-sans font-semibold text-green">{currency} {folderTotalProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_cost')}</span>
                      <span className="text-xs font-sans font-semibold text-red">{currency} {folderTotalProdCost.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-sans font-medium text-muted uppercase tracking-wider">{t('total_time')}</span>
                      <span className="text-xs font-sans font-semibold text-ink">
                        {Math.floor(folderTotalTime)}h {Math.round((folderTotalTime % 1) * 60)}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <span className="text-[11px] font-sans font-semibold text-primary group-hover:underline flex items-center gap-1">
                    {t('open_folder') || 'Abrir Pasta'} →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Visualização Focada
  const folderId = viewingFolderId;
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Botão de Voltar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setViewingFolderId(null)}
          className="flex items-center gap-2 text-xs font-sans font-semibold text-primary hover:text-primary-hover bg-primary-soft/50 border border-primary/10 hover:border-primary/20 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft size={14} />
          {t('back_to_folders') || 'Voltar para as pastas'}
        </button>
      </div>

      <div className="space-y-6">
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
                    <Select
                      value={folderObj?.status || 'aguardando'}
                      onChange={(val) => handleFolderStatusChange(folderId, val as ProjectStatus)}
                      options={[
                        { value: 'aguardando', label: `⏳ ${t('status_waiting')}` },
                        { value: 'em_producao', label: `⚙️ ${t('status_production')}` },
                        { value: 'concluido', label: `✅ ${t('status_completed')}` },
                        { value: 'cancelado', label: `✖ ${t('status_cancelled')}` }
                      ]}
                    />
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

        {/* Folder Settings and Payment Control */}
        {!isUncategorized && folderObj && (
          <FolderSettingsPanel
            folder={folderObj}
            folderTotalCost={folderTotalCost}
            currency={currency}
            onUpdateFolder={handleUpdateFolder}
          />
        )}

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

      <ProjectDetailsModal
        project={detailsProject}
        isOpen={!!detailsProject}
        onClose={() => setDetailsProject(null)}
        folderStatus={detailsProject ? (Reflect.get(folders, detailsProject.folderId) as ProjectFolder)?.status : undefined}
        onUpdateProject={handleUpdateProject}
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



const ProjectCard = ({ 
  project, 
  currency, 
  printers, 
  materials, 
  deletingId, 
  setDetailsProject, 
  setDeletingId, 
  handleDeleteProject,
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
  movingProjectId: string | null;
  setMovingProjectId: (id: string | null) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  folders: Record<string, ProjectFolder>;
  handleMoveProject: (projectId: string, targetFolderId: string | null) => void;
}) => {
  const { t } = useTranslation();

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
              <span>{(Number(project.result?.finalPrice) || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <HistoryDetail icon={<Tag size={12} />} label={t('printer_label')} value={(Reflect.get(printers, project.printerId) as string) || 'N/A'} />
          <HistoryDetail icon={<PackageOpen size={12} />} label={t('material_label')} value={(Reflect.get(materials, project.materialId) as string) || 'N/A'} />
          <div className="grid grid-cols-2 gap-2">
            <HistoryDetail icon={<Clock size={12} />} label={t('time_label')} value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} />
            <HistoryDetail icon={<Layers size={12} />} label={t('weight_label')} value={`${project.modelWeight}g`} />
          </div>
          <HistoryDetail 
            icon={<Clock size={12} />} 
            label={t('production_cost')} 
            value={`${currency} ${(Number(project.result?.totalProductionCost) || 0).toFixed(2)}`} 
            color="text-muted" 
          />
          <HistoryDetail 
            icon={<Clock size={12} />} 
            label={t('profit_label')} 
            value={`${currency} ${(Number(project.result?.profit) || 0).toFixed(2)}`} 
            color="text-green" 
          />
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-1 bg-canvas border border-hairline rounded-full p-1 shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
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
            <Select
              value={selectedFolderId || ''}
              onChange={(val) => setSelectedFolderId(val as string || null)}
              options={[
                { value: '', label: t('uncategorized_folder_name') },
                ...Object.values(folders).map(folder => ({ value: folder.id, label: folder.name }))
              ]}
            />
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

interface FolderSettingsPanelProps {
  folder: ProjectFolder;
  folderTotalCost: number;
  currency: string;
  onUpdateFolder: (id: string, updatedFields: Partial<ProjectFolder>) => Promise<void>;
}

const FolderSettingsPanel: React.FC<FolderSettingsPanelProps> = ({
  folder,
  folderTotalCost,
  currency,
  onUpdateFolder
}) => {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(folder.name || '');
  const [localDiscount, setLocalDiscount] = useState((folder.discount || 0).toString());
  const [localShippingCost, setLocalShippingCost] = useState((folder.shippingCost || 0).toString());
  const [localPayments, setLocalPayments] = useState<Payment[]>(folder.payments || []);
  const [localNotes, setLocalNotes] = useState(folder.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => { setLocalName(folder.name || ''); }, [folder.name]);
  useEffect(() => { setLocalDiscount((folder.discount || 0).toString()); }, [folder.discount]);
  useEffect(() => { setLocalShippingCost((folder.shippingCost || 0).toString()); }, [folder.shippingCost]);
  useEffect(() => { setLocalPayments(folder.payments || []); }, [folder.payments]);
  useEffect(() => { setLocalNotes(folder.notes || ''); }, [folder.notes]);

  const netFolderCost = folderTotalCost + (Number(folder.shippingCost) || 0) - (Number(folder.discount) || 0);
  const totalPaid = localPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingAmount = Math.max(0, netFolderCost - totalPaid);

  const handleSaveFolderSettings = async (field: keyof ProjectFolder, value: any) => {
    try {
      await onUpdateFolder(folder.id, { [field]: value });
      toast.success(t('toast_project_saved') || 'Salvo');
    } catch {
      toast.error(t('saving_changes_error'));
    }
  };

  const randomId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  };

  const handleSavePayments = async (newPayments: Payment[]) => {
    try {
      await onUpdateFolder(folder.id, { payments: newPayments });
    } catch {
      toast.error(t('saving_changes_error'));
    }
  };

  const handleAddPayment = () => {
    const newPayment: Payment = {
      id: randomId(),
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: ''
    };
    const updated = [...localPayments, newPayment];
    setLocalPayments(updated);
    handleSavePayments(updated);
    toast.success(t('payment_added'));
  };

  const handleDeletePayment = (paymentId: string) => {
    const updated = localPayments.filter(p => p.id !== paymentId);
    setLocalPayments(updated);
    handleSavePayments(updated);
    toast.success(t('payment_deleted'));
  };

  const handleUpdatePayment = (paymentId: string, field: keyof Payment, value: any) => {
    const updated = localPayments.map(p => {
      if (p.id === paymentId) {
        return { 
          ...p, 
          [field]: field === 'amount' ? (parseFloat(value) || 0) : value 
        };
      }
      return p;
    });
    setLocalPayments(updated);
  };

  const handleSaveNotes = async () => {
    if (localNotes === folder.notes) return;
    setIsSavingNotes(true);
    try {
      await onUpdateFolder(folder.id, { notes: localNotes });
      toast.success(t('notes_saved'));
    } catch {
      toast.error(t('saving_changes_error'));
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-surface-soft p-6 border border-hairline rounded-2xl animate-in fade-in duration-300">
      
      {/* Configurações da Pasta */}
      <div className="space-y-4">
        <h3 className="font-sans font-semibold text-sm text-ink flex items-center gap-2">
          <FolderOpen size={16} className="text-primary" />
          {t('folder_settings') || 'Config. da Pasta'}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
             <label className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('folder_name')}</label>
             <input 
               type="text"
               value={localName}
               onChange={e => setLocalName(e.target.value)}
               onBlur={() => handleSaveFolderSettings('name', localName)}
               className="w-full bg-canvas border border-hairline text-xs font-sans text-ink px-3 py-2 rounded-xl focus:outline-none focus:border-primary"
             />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('discount_label')}</label>
             <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">{currency}</span>
                 <input 
                   type="number"
                   value={localDiscount}
                   onChange={e => setLocalDiscount(e.target.value)}
                   onBlur={() => handleSaveFolderSettings('discount', parseFloat(localDiscount) || 0)}
                   className="w-full bg-canvas border border-hairline text-xs font-sans text-ink pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-primary"
                   step="any"
                 />
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('shipping_cost_label')}</label>
             <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">{currency}</span>
                 <input 
                   type="number"
                   value={localShippingCost}
                   onChange={e => setLocalShippingCost(e.target.value)}
                   onBlur={() => handleSaveFolderSettings('shippingCost', parseFloat(localShippingCost) || 0)}
                   className="w-full bg-canvas border border-hairline text-xs font-sans text-ink pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-primary"
                   step="any"
                 />
             </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="space-y-4">
        <h3 className="font-sans font-semibold text-sm text-ink flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          {t('financial_summary') || 'Resumo Financeiro'}
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2.5 border border-hairline bg-canvas rounded-xl">
            <span className="text-[11px] font-sans text-muted">{t('projects_total') || 'Total Projetos'}</span>
            <span className="text-xs font-sans font-semibold text-ink">{currency} {folderTotalCost.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-2.5 border border-hairline bg-canvas rounded-xl">
            <span className="text-[11px] font-sans text-muted">{t('discount_label')}</span>
            <span className="text-xs font-sans font-semibold text-red">-{currency} {(Number(folder.discount) || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-2.5 border border-hairline bg-canvas rounded-xl">
            <span className="text-[11px] font-sans text-muted">{t('shipping_cost_label')}</span>
            <span className="text-xs font-sans font-semibold text-ink">+{currency} {(Number(folder.shippingCost) || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-3 border-t border-hairline bg-primary-soft/30 rounded-xl mt-2">
            <span className="text-xs font-sans font-semibold text-ink">{t('final_folder_total') || 'Total da Pasta'}</span>
            <span className="text-sm font-sans font-bold text-primary">{currency} {netFolderCost.toFixed(2)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex flex-col p-2.5 border border-hairline bg-canvas rounded-xl text-center justify-center">
              <span className="text-[10px] font-sans text-muted mb-0.5">{t('total_paid')}</span>
              <span className="text-xs font-sans font-bold text-green">{currency} {totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex flex-col p-2.5 border border-hairline bg-canvas rounded-xl text-center justify-center">
              <span className="text-[10px] font-sans text-muted mb-0.5">{t('amount_remaining')}</span>
              <span className={cn("text-xs font-sans font-bold", remainingAmount > 0.01 ? "text-red" : "text-green")}>
                {currency} {remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico e Notas */}
      <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
        <div className="space-y-3 flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-semibold text-sm text-ink flex items-center gap-2">
              <HistoryIcon size={16} className="text-primary" />
              Histórico de Pagamentos
            </h3>
            <button 
              className="text-xs font-medium text-primary hover:text-primary-hover h-8 flex items-center gap-1.5 px-3 py-1 rounded-xl border border-hairline bg-canvas hover:bg-surface-soft transition-colors"
              onClick={handleAddPayment}
            >
              <Plus size={14} />
              {t('add_payment')}
            </button>
          </div>

          {localPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-hairline bg-canvas rounded-xl text-muted text-center h-[140px]">
              <DollarSign size={24} className="opacity-30 mb-1" />
              <p className="text-xs font-sans italic">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 border border-hairline bg-canvas p-2 rounded-xl">
              {localPayments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 border border-hairline rounded-lg bg-surface-soft hover:bg-canvas transition-colors">
                  <div className="w-full sm:w-[130px] flex items-center gap-1.5 shrink-0">
                    <Calendar size={12} className="text-muted shrink-0" />
                    <input 
                      type="date" 
                      value={payment.date}
                      onChange={(e) => handleUpdatePayment(payment.id, 'date', e.target.value)}
                      onBlur={() => handleSavePayments(localPayments)}
                      className="bg-transparent border-none p-0 text-xs font-sans text-ink w-full focus:outline-none focus:ring-0 focus:border-none cursor-pointer"
                    />
                  </div>

                  <div className="w-full sm:flex-1">
                    <input 
                      type="text" 
                      value={payment.description}
                      placeholder={t('payment_description')}
                      onChange={(e) => handleUpdatePayment(payment.id, 'description', e.target.value)}
                      onBlur={() => handleSavePayments(localPayments)}
                      className="bg-transparent border-none p-0 text-xs font-sans text-ink w-full focus:outline-none focus:ring-0 focus:border-none placeholder:text-muted/60"
                    />
                  </div>

                  <div className="w-[100px] flex items-center justify-end shrink-0 border-l border-hairline px-2">
                    <span className="text-xs font-sans text-muted mr-1">{currency}</span>
                    <input 
                      type="number" 
                      value={payment.amount === 0 ? '' : payment.amount}
                      placeholder="0.00"
                      onChange={(e) => handleUpdatePayment(payment.id, 'amount', e.target.value)}
                      onBlur={() => handleSavePayments(localPayments)}
                      className="bg-transparent border-none p-0 text-right text-xs font-sans font-semibold text-ink w-full focus:outline-none focus:ring-0 focus:border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      step="any"
                    />
                  </div>

                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-muted hover:text-red p-1 rounded transition-colors shrink-0"
                    title={t('delete')}
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-hairline pt-3">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="font-sans font-semibold text-xs text-ink flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              {t('general_notes')}
            </h3>
            {isSavingNotes && (
              <span className="text-[10px] font-sans text-primary flex items-center gap-1">
                <Loader2 className="animate-spin" size={10} />
                {t('saving_notes')}
              </span>
            )}
          </div>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder={t('notes_placeholder')}
            rows={2}
            className="w-full bg-canvas border border-hairline text-xs font-sans text-ink p-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted/60 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
};