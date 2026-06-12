import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Project, ProjectStatus } from '../types';
import { X, Printer, PackageOpen, Clock, Scaling, Activity, Hammer, Zap, Calculator, Layers, Tag, Calendar, PiggyBank, Briefcase, FileCode, CircleDot } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface ProjectDetailsModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    printerName?: string;
    materialName?: string;
    folderStatus?: ProjectStatus;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, isOpen, onClose, printerName, materialName, folderStatus }) => {
    const { t } = useTranslation();
    const [currencySymbol, setCurrencySymbol] = useState('$');

    useEffect(() => {
        if (isOpen) {
            StorageService.getSettings().then(settings => {
                if (settings) {
                    setCurrencySymbol(settings.currencySymbol);
                }
            });
        }
    }, [isOpen]);

    if (!isOpen || !project) return null;

    const CostRow = ({ label, value, iconData, isTotal = false, isSub = false }: { label: string, value: string | number, iconData?: { icon: any, color: string }, isTotal?: boolean, isSub?: boolean }) => {
        const Icon = iconData?.icon;
        return (
            <div className={cn(
                "flex items-center justify-between py-2.5 border-b border-hairline transition-colors hover:bg-surface-soft px-3 rounded-lg",
                isTotal && "border-t border-hairline border-b-0 pt-4 mt-3 bg-primary-soft/30",
                isSub && "pl-8 text-[11px]"
            )}>
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon size={14} className={cn("shrink-0", iconData?.color || "text-muted")} />
                    )}
                    <span className={cn("font-sans text-xs", isTotal ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
                </div>
                <span className={cn("font-sans font-semibold", isTotal ? 'text-primary text-base' : 'text-ink text-xs')}>
                    {typeof value === 'number' ? `${currencySymbol} ${value.toFixed(2)}` : value}
                </span>
            </div>
        );
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-canvas w-full max-w-3xl flex flex-col overflow-hidden border border-hairline rounded-2xl shadow-xl animate-in zoom-in-95 duration-300 relative">
                
                {/* Header */}
                <div className="border-b border-hairline p-6 flex justify-between items-start bg-surface-soft">
                    <div className="space-y-3 flex-1 min-w-0 pr-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-canvas border border-hairline rounded-full text-muted">
                                <Calendar size={12} className="text-primary" />
                                <span className="text-[10px] font-sans font-medium">{new Date(project.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-canvas border border-hairline rounded-full text-muted">
                                <Clock size={12} className="text-green" />
                                <span className="text-[10px] font-sans font-medium">{new Date(project.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-canvas border border-hairline rounded-full text-muted">
                                <FileCode size={12} />
                                <span className="text-[10px] font-sans font-medium">ID: {project.id.substring(0, 8)}</span>
                            </div>
                            {(() => {
                              const STATUS_CFG: Record<string, { label: string; cls: string }> = {
                                aguardando:  { label: t('status_waiting'),  cls: 'border-yellow/20 text-yellow bg-yellow/5' },
                                em_producao: { label: t('status_production'), cls: 'border-primary/20 text-primary bg-primary-soft' },
                                concluido:   { label: t('status_completed'),   cls: 'border-green/20 text-green bg-green/5' },
                                cancelado:   { label: t('status_cancelled'),   cls: 'border-red/20 text-red bg-red/5' },
                              };
                              const s = folderStatus || 'aguardando';
                              const cfg = STATUS_CFG[s] || STATUS_CFG['aguardando'];
                              return (
                                <div className={cn('flex items-center gap-1.5 px-2.5 py-0.5 border text-[10px] font-sans font-medium rounded-full uppercase tracking-wider shadow-sm', cfg.cls)}>
                                  <CircleDot size={10} />
                                  {cfg.label}
                                </div>
                              );
                            })()}
                        </div>
                        <h2 className="text-lg font-sans font-semibold text-ink leading-tight truncate">{project.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center border border-hairline bg-canvas rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-all duration-150 shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-canvas">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border border-hairline p-4 rounded-2xl bg-surface-soft">
                        <StatCard icon={Printer} label={t('printer_label')} value={printerName || project.printerId.substring(0, 8)} color="primary" />
                        <StatCard icon={PackageOpen} label={t('material_label')} value={materialName || project.materialId.substring(0, 8)} color="green" />
                        <StatCard icon={Clock} label={t('print_time_label')} value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} color="primary" />
                        <StatCard icon={Scaling} label={t('model_weight_label')} value={`${project.modelWeight}g`} color="green" />
                    </div>

                    {/* Content Columns */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Financials Column */}
                        <div className="flex-1 bg-canvas border border-hairline rounded-2xl p-6 relative overflow-hidden">
                            <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('cost_analysis_label')}
                            </h3>
                            <div className="space-y-0.5">
                                <CostRow label={t('energy_cost_label')} value={project.result.energyCost} iconData={{ icon: Zap, color: 'text-yellow' }} />
                                <CostRow label={t('material_label')} value={project.result.materialCost} iconData={{ icon: PackageOpen, color: 'text-primary' }} />
                                <CostRow label={t('depreciation_label')} value={project.result.depreciationCost} iconData={{ icon: Activity, color: 'text-muted' }} />
                                <CostRow label={t('maintenance_label')} value={project.result.maintenanceCost} iconData={{ icon: Hammer, color: 'text-muted' }} />
                                <CostRow label={t('labor_label')} value={project.result.laborCost} iconData={{ icon: Briefcase, color: 'text-muted' }} />
                                {project.result.additionalCost > 0 && (
                                    <CostRow label={t('additional_items')} value={project.result.additionalCost} iconData={{ icon: Layers, color: 'text-muted' }} />
                                )}

                                <div className="mt-4 border-t border-hairline pt-2" />
                                <CostRow label={t('production_cost')} value={project.result.totalProductionCost} iconData={{ icon: Calculator, color: 'text-muted' }} />

                                <CostRow label={t('final_price_label')} value={project.result.finalPrice} iconData={{ icon: Tag, color: 'text-primary' }} isTotal />
                                
                                <div className="flex justify-between items-center p-3 mt-4 bg-green/5 border border-green/20 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <PiggyBank size={16} className="text-green" />
                                        <span className="text-xs font-sans font-medium text-green uppercase tracking-wider">{t('projected_net_profit')}</span>
                                    </div>
                                    <span className="font-sans font-semibold text-green text-lg">{currencySymbol} {project.result.profit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Parameters Column */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-canvas border border-hairline rounded-2xl p-6">
                                <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green" /> {t('part_parameters_label')}
                                </h3>
                                <div className="space-y-1">
                                    <ParameterRow label={t('failure_rate_label')} value={`${project.failureRate}%`} />
                                    <ParameterRow label={t('profit_margin_label')} value={`${project.markup}%`} />
                                    <ParameterRow label={t('labor_time_label')} value={`${project.laborTimeHours}h ${project.laborTimeMinutes}m`} />
                                    <ParameterRow label={t('labor_rate_label')} value={`${currencySymbol} ${project.laborHourlyRate.toFixed(2)}/h`} />
                                </div>
                            </div>

                            {/* Additional items */}
                            {project.additionalItems && project.additionalItems.length > 0 && (
                                <div className="bg-canvas border border-hairline rounded-2xl p-6">
                                    <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted" /> {t('extra_components_label')}
                                    </h3>
                                    <div className="space-y-3">
                                        {project.additionalItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between border-b border-hairline pb-2.5 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <span className="font-sans font-medium text-ink text-xs block truncate max-w-[140px]">{item.name}</span>
                                                    <span className="text-[10px] font-sans text-muted uppercase tracking-wider">{t('qty_label')}{item.quantity}</span>
                                                </div>
                                                <span className="font-sans font-semibold text-ink text-xs">{currencySymbol} {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-hairline p-6 flex justify-between items-center bg-surface-soft">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                             <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('system_stable')}</span>
                        </div>
                        <span className="text-[10px] font-sans text-muted uppercase tracking-wider hidden sm:block">{t('read_only_record')}</span>
                    </div>
                    <Button onClick={onClose} variant="ghost" className="px-6 h-10 text-xs font-sans font-medium">
                        {t('close_details_label')}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'primary' | 'green' }) => {
    return (
        <div className="p-4 flex flex-col items-center justify-center text-center rounded-xl bg-canvas border border-hairline">
            <Icon size={16} className={cn("mb-2", color === 'primary' ? 'text-primary' : 'text-green')} />
            <div className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xs font-sans font-semibold text-ink truncate w-full px-1 uppercase" title={String(value)}>
                {value}
            </div>
        </div>
    );
};

const ParameterRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-hairline last:border-0">
        <span className="text-xs font-sans text-muted">{label}</span>
        <span className="font-sans font-semibold text-ink text-xs">{value}</span>
    </div>
);
