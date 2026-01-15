import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { X, Printer, PackageOpen, Clock, Scaling, Activity, Hammer, Zap, Coins, Calculator, Layers, Tag, Calendar, PiggyBank, Briefcase } from 'lucide-react';
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
    const [currencySymbol, setCurrencySymbol] = useState('R$');

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
                "flex items-center justify-between py-2.5 transition-colors hover:bg-gray-50/50 rounded-lg px-2 -mx-2 dark:hover:bg-white/5",
                isTotal && "border-t-2 border-dashed border-gray-200 pt-4 mt-2 dark:border-white/10",
                isSub && "pl-8 text-sm"
            )}>
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn("p-1.5 rounded-md bg-opacity-10", iconData?.color.replace('text-', 'bg-'))}>
                            <Icon size={16} className={iconData?.color} />
                        </div>
                    )}
                    <span className={cn(isTotal ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 font-medium dark:text-gray-400')}>{label}</span>
                </div>
                <span className={cn(isTotal ? 'font-black text-blue-600 text-lg dark:text-blue-400' : 'font-semibold text-gray-700 font-mono tracking-tight dark:text-gray-300')}>
                    {typeof value === 'number' ? `${currencySymbol} ${value.toFixed(2)}` : value}
                </span>
            </div>
        );
    };

    if (!isOpen || !project) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 dark:bg-dark-surface/95 dark:border-white/10">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 flex justify-between items-start transition-all dark:bg-dark-surface/80 dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2 text-gray-400 mb-2 dark:text-gray-500">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full dark:bg-white/10 dark:text-gray-300">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(project.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full dark:bg-white/10 dark:text-gray-300">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(project.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight dark:text-white">{project.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 rounded-full transition-all duration-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Printer} label="Impressora" value={printerName || project.printerId} color="blue" subValue={!printerName} />
                        <StatCard icon={PackageOpen} label="Material" value={materialName || project.materialId} color="purple" subValue={!materialName} />
                        <StatCard icon={Clock} label="Tempo Total" value={`${Math.floor(project.printTimeHours)}h ${Math.round(project.printTimeMinutes)}m`} color="emerald" />
                        <StatCard icon={Scaling} label="Peso" value={`${project.modelWeight} g`} color="amber" />
                    </div>

                    {/* Content Columns */}
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Financials Column */}
                        <div className="flex-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50 dark:bg-white/5 dark:border-white/5 dark:shadow-none">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 dark:text-gray-500">
                                <Coins size={14} className="text-blue-500" /> Detalhamento Financeiro
                            </h3>
                            <div className="space-y-1">
                                <CostRow label="Energia" value={project.result.energyCost} iconData={{ icon: Zap, color: 'text-amber-500' }} />
                                <CostRow label="Material" value={project.result.materialCost} iconData={{ icon: PackageOpen, color: 'text-purple-500' }} />
                                <CostRow label="Depreciação" value={project.result.depreciationCost} iconData={{ icon: Activity, color: 'text-gray-500 dark:text-gray-400' }} />
                                <CostRow label="Manutenção" value={project.result.maintenanceCost} iconData={{ icon: Hammer, color: 'text-blue-500' }} />
                                <CostRow label="Mão de Obra" value={project.result.laborCost} iconData={{ icon: Briefcase, color: 'text-indigo-500' }} />
                                {project.result.additionalCost > 0 && (
                                    <CostRow label="Adicionais" value={project.result.additionalCost} iconData={{ icon: Layers, color: 'text-emerald-500' }} />
                                )}

                                <CostRow label="Preço Final" value={project.result.finalPrice} iconData={{ icon: Tag, color: 'text-blue-600 dark:text-blue-400' }} isTotal />
                                <div className="flex justify-between items-center py-2 px-2 mt-2 bg-emerald-50 rounded-lg border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                                    <div className="flex items-center gap-2">
                                        <PiggyBank size={16} className="text-emerald-500" />
                                        <span className="text-emerald-700 font-bold text-sm dark:text-emerald-400">Lucro Estimado</span>
                                    </div>
                                    <span className="font-bold text-emerald-700 text-lg dark:text-emerald-400">{currencySymbol} {project.result.profit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Parameters Column */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 dark:bg-white/5 dark:border-white/5">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4 dark:text-gray-500">
                                    <Activity size={14} className="text-gray-500 dark:text-gray-400" /> Parâmetros Utilizados
                                </h3>
                                <div className="space-y-3">
                                    <ParameterRow label="Taxa de Falha" value={`${project.failureRate}%`} />
                                    <ParameterRow label="Markup (Margem)" value={`${project.markup}%`} />
                                    <ParameterRow label="Tempo de Trabalho" value={`${project.laborTimeHours}h ${project.laborTimeMinutes}m`} />
                                    <ParameterRow label="Taxa Horária" value={`${currencySymbol} ${project.laborHourlyRate.toFixed(2)}/h`} />
                                </div>
                            </div>

                            {/* Additional Items */}
                            {project.additionalItems && project.additionalItems.length > 0 && (
                                <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 dark:bg-white/5 dark:border-white/5">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4 dark:text-gray-500">
                                        <Layers size={14} className="text-gray-500 dark:text-gray-400" /> Itens Adicionais
                                    </h3>
                                    <div className="space-y-3">
                                        {project.additionalItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200/50 last:border-0 last:pb-0 dark:border-white/10">
                                                <div>
                                                    <span className="font-bold text-gray-700 block dark:text-gray-300">{item.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold dark:text-gray-500">Qtd: {item.quantity}</span>
                                                </div>
                                                <span className="font-bold text-gray-600 dark:text-gray-400">{currencySymbol} {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-100 p-6 flex justify-end backdrop-blur-xl bg-white/80 dark:bg-dark-surface/80 dark:border-white/10">
                    <Button onClick={onClose} variant="secondary" className="px-8 shadow-none bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                        Fechar Detalhes
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const StatCard = ({ icon: Icon, label, value, color, subValue }: { icon: any, label: string, value: string, color: string, subValue?: boolean }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    };

    return (
        <div className={cn("p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-300", colorClasses[color])}>
            <Icon size={24} className="mb-2 opacity-80" />
            <div className="text-[10px] font-black uppercase opacity-60 mb-1">{label}</div>
            <div className="text-sm font-bold truncate w-full px-2 dark:text-white" title={String(value)}>
                {subValue ? (
                    <span className="font-mono text-xs bg-white/50 px-1.5 py-0.5 rounded border border-black/5 dark:bg-black/20 dark:border-white/10">{value.substring(0, 8)}...</span>
                ) : value}
            </div>
        </div>
    );
};

const ParameterRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white transition-colors dark:hover:bg-white/5">
        <span className="text-gray-500 font-medium dark:text-gray-400">{label}</span>
        <span className="font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm dark:bg-white/5 dark:text-gray-200 dark:border-white/10">{value}</span>
    </div>
);
