import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus } from '../types';
import { X, Printer, PackageOpen, Clock, Scaling, Activity, Hammer, Zap, Coins, Calculator, Layers, Tag, Calendar, PiggyBank, Briefcase, FileCode, CircleDot } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface ProjectDetailsModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    printerName?: string;
    materialName?: string;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, isOpen, onClose, printerName, materialName }) => {
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
                "flex items-center justify-between py-2 border-b border-slate-900 transition-colors hover:bg-slate-900/40 px-2",
                isTotal && "border-t-2 border-b-0 border-primary/30 pt-4 mt-2 bg-primary/5",
                isSub && "pl-8 text-[10px]"
            )}>
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon size={12} className={cn("shrink-0", iconData?.color || "text-slate-500")} />
                    )}
                    <span className={cn("font-technical uppercase tracking-widest text-[10px]", isTotal ? 'font-black text-white' : 'text-slate-500 font-bold')}>{label}</span>
                </div>
                <span className={cn("font-technical font-black", isTotal ? 'text-primary text-base' : 'text-white text-[11px]')}>
                    {typeof value === 'number' ? `${currencySymbol} ${value.toFixed(2)}` : value}
                </span>
            </div>
        );
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-950 w-full max-w-3xl flex flex-col overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />

                {/* Header */}
                <div className="border-b border-slate-800 p-6 flex justify-between items-start bg-slate-900/30">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800">
                                <Calendar size={10} className="text-primary" />
                                <span className="text-[9px] font-technical font-black text-slate-400 uppercase tracking-widest">{new Date(project.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800">
                                <Clock size={10} className="text-secondary" />
                                <span className="text-[9px] font-technical font-black text-slate-400 uppercase tracking-widest">{new Date(project.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800">
                                <FileCode size={10} className="text-slate-500" />
                                <span className="text-[9px] font-technical font-black text-slate-600 uppercase tracking-widest">ID: {project.id.substring(0, 8)}</span>
                            </div>
                            {(() => {
                              const STATUS_CFG: Record<string, { label: string; cls: string }> = {
                                aguardando:  { label: 'AGUARDANDO',  cls: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
                                em_producao: { label: 'EM PRODUÇÃO', cls: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' },
                                concluido:   { label: 'CONCLUÍDO',   cls: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
                                cancelado:   { label: 'CANCELADO',   cls: 'border-red-500/50 text-red-400 bg-red-500/10' },
                              };
                              const s = project.status || 'aguardando';
                              const cfg = STATUS_CFG[s] || STATUS_CFG['aguardando'];
                              return (
                                <div className={cn('flex items-center gap-1.5 px-2 py-1 border text-[9px] font-technical font-black uppercase tracking-widest', cfg.cls)}>
                                  <CircleDot size={9} />
                                  {cfg.label}
                                </div>
                              );
                            })()}
                        </div>
                        <h2 className="text-xl font-technical font-extrabold text-white leading-tight tracking-[0.15em] uppercase">{project.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center border border-slate-700 bg-slate-900 text-slate-500 hover:text-white hover:border-primary/50 transition-all duration-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-950/50">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-800 overflow-hidden">
                        <StatCard icon={Printer} label="IMPRESSORA" value={printerName || project.printerId.substring(0, 8)} color="primary" />
                        <StatCard icon={PackageOpen} label="MATERIAL" value={materialName || project.materialId.substring(0, 8)} color="secondary" />
                        <StatCard icon={Clock} label="TEMPO DE IMPRESSÃO" value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} color="primary" />
                        <StatCard icon={Scaling} label="PESO DO MODELO" value={`${project.modelWeight}g`} color="secondary" />
                    </div>

                    {/* Content Columns */}
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Financials Column */}
                        <div className="flex-1 bg-slate-950 border border-slate-800 p-6 relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            
                            <h3 className="text-[10px] font-technical font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-1.5 bg-primary" /> ANÁLISE DE CUSTOS
                            </h3>
                            <div className="space-y-0.5">
                                <CostRow label="CUSTO DE ENERGIA" value={project.result.energyCost} iconData={{ icon: Zap, color: 'text-amber-500' }} />
                                <CostRow label="MATERIAL" value={project.result.materialCost} iconData={{ icon: PackageOpen, color: 'text-purple-500' }} />
                                <CostRow label="DEPRECIAÇÃO" value={project.result.depreciationCost} iconData={{ icon: Activity, color: 'text-slate-500' }} />
                                <CostRow label="MANUTENÇÃO" value={project.result.maintenanceCost} iconData={{ icon: Hammer, color: 'text-blue-500' }} />
                                <CostRow label="MÃO DE OBRA" value={project.result.laborCost} iconData={{ icon: Briefcase, color: 'text-indigo-500' }} />
                                {project.result.additionalCost > 0 && (
                                    <CostRow label="ITENS ADICIONAIS" value={project.result.additionalCost} iconData={{ icon: Layers, color: 'text-emerald-500' }} />
                                )}

                                <CostRow label="PREÇO FINAL" value={project.result.finalPrice} iconData={{ icon: Tag, color: 'text-primary' }} isTotal />
                                
                                <div className="flex justify-between items-center p-3 mt-4 bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="flex items-center gap-2">
                                        <PiggyBank size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-technical font-black text-emerald-500 uppercase tracking-widest">LUCRO LÍQUIDO PROJETADO</span>
                                    </div>
                                    <span className="font-technical font-black text-emerald-500 text-lg">{currencySymbol} {project.result.profit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Parameters Column */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-slate-950 border border-slate-800 p-6">
                                <h3 className="text-[10px] font-technical font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 bg-secondary" /> PARÂMETROS DA PEÇA
                                </h3>
                                <div className="space-y-1">
                                    <ParameterRow label="TAXA DE FALHA" value={`${project.failureRate}%`} />
                                    <ParameterRow label="MARGEM DE LUCRO" value={`${project.markup}%`} />
                                    <ParameterRow label="TEMPO DE TRABALHO" value={`${project.laborTimeHours}h ${project.laborTimeMinutes}m`} />
                                    <ParameterRow label="VALOR HORA" value={`${currencySymbol} ${project.laborHourlyRate.toFixed(2)}/h`} />
                                </div>
                            </div>

                            {/* Additional items */}
                            {project.additionalItems && project.additionalItems.length > 0 && (
                                <div className="bg-slate-950 border border-slate-800 p-6">
                                    <h3 className="text-[10px] font-technical font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-1.5 bg-slate-500" /> COMPONENTES EXTRAS
                                    </h3>
                                    <div className="space-y-4">
                                        {project.additionalItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <span className="font-technical font-black text-white text-[10px] block uppercase truncate max-w-[140px]">{item.name}</span>
                                                    <span className="text-[9px] font-technical font-bold text-slate-600 uppercase tracking-widest">QTD: {item.quantity}</span>
                                                </div>
                                                <span className="font-technical font-black text-slate-300 text-[11px]">{currencySymbol} {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-800 p-6 flex justify-between items-center bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-technical font-bold text-slate-500 uppercase tracking-widest font-mono">SISTEMA ESTÁVEL</span>
                        </div>
                        <span className="text-[9px] font-technical text-slate-700 uppercase tracking-[0.3em] hidden sm:block">FCD-X99 // REGISTRO SOMENTE LEITURA</span>
                    </div>
                    <Button onClick={onClose} variant="ghost" className="px-8 h-10 border-slate-700 hover:bg-slate-800 text-slate-300 font-technical uppercase text-xs tracking-widest">
                        FECHAR DETALHES DO PROJETO
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'primary' | 'secondary' }) => {
    return (
        <div className="p-4 border-r last:border-r-0 border-slate-800 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-900/40">
            <Icon size={16} className={cn("mb-3", color === 'primary' ? 'text-primary' : 'text-secondary')} />
            <div className="text-[8px] font-technical font-black text-slate-600 uppercase tracking-[0.3em] mb-2">{label}</div>
            <div className="text-[11px] font-technical font-black text-white truncate w-full px-1 uppercase" title={String(value)}>
                {value}
            </div>
        </div>
    );
};

const ParameterRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center p-2 border border-transparent hover:border-slate-800 transition-all">
        <span className="text-[10px] font-technical font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="font-technical font-black text-white text-[11px]">{value}</span>
    </div>
);
