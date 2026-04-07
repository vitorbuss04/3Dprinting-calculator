import React from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, ArrowRightLeft, LogOut, ChevronLeft, Terminal, Cpu, Settings } from 'lucide-react';
import { ViewState } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onViewChange,
    isOpen,
    onClose,
    onLogout
}) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navItems = [
        { id: 'dashboard', label: 'PAINEL GERAL', icon: LayoutDashboard },
        { id: 'calculator', label: 'CALCULADORA', icon: CalcIcon },
        { id: 'assets', label: 'IMPRESSORAS E MATERIAIS', icon: Printer },
        { id: 'comparator', label: 'COMPARAR CUSTOS', icon: ArrowRightLeft },
        { id: 'history', label: 'HISTÓRICO', icon: HistoryIcon },
        { id: 'profile', label: 'MEU PERFIL', icon: Settings },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-50 bg-slate-950 border-r border-slate-900 transform transition-all duration-300 ease-in-out flex flex-col",
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                isCollapsed ? 'md:w-16' : 'w-64'
            )}>
                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-slate-950 border border-slate-800 items-center justify-center text-slate-600 hover:text-primary z-50 transition-all active:bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                    <ChevronLeft size={10} className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} />
                </button>

                {/* Brand Unit */}
                <div className={cn(
                    "h-16 flex items-center border-b border-slate-900 transition-all duration-300 bg-slate-900/10",
                    isCollapsed ? "justify-center" : "px-6"
                )}>
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center border-2 border-primary relative group">
                        <span className="font-technical font-black text-xs text-white">3DP</span>
                        <div className="absolute top-0 right-0 w-1 h-1 bg-primary" />
                        <div className="absolute bottom-0 left-0 w-1 h-1 bg-primary" />
                    </div>

                    {!isCollapsed && (
                        <div className="ml-4 overflow-hidden">
                            <span className="block font-technical font-black text-sm tracking-[0.2em] text-white whitespace-nowrap">
                                GESTÃO 3D
                            </span>
                            <span className="block font-technical font-bold text-[8px] tracking-widest text-slate-600 uppercase mt-0.5">PAINEL DE CONTROLE</span>
                        </div>
                    )}
                </div>

                {/* Navigation Hub */}
                <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onViewChange(item.id as ViewState);
                                    onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center py-3 transition-all duration-150 relative group whitespace-nowrap rounded-none",
                                    isCollapsed ? "justify-center" : "gap-3 px-3",
                                    isActive
                                        ? "text-white bg-slate-900/50 border border-slate-800 shadow-[inset_0_0_10px_rgba(255,92,0,0.03)]"
                                        : "text-slate-600 hover:text-slate-300 hover:bg-slate-900/20"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(255,92,0,0.5)]" />
                                )}
                                <Icon
                                    size={16}
                                    className={cn(
                                        "relative z-10 transition-colors shrink-0",
                                        isActive ? "text-primary" : "text-slate-700 group-hover:text-slate-500"
                                    )}
                                />
                                {!isCollapsed && (
                                    <span className={cn(
                                        "relative z-10 font-technical text-[10px] font-black tracking-[0.15em] transition-all",
                                        isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400"
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Utility */}
                <div className="p-4 border-t border-slate-900 space-y-4 bg-slate-900/10">
                    {!isCollapsed && (
                        <div className="p-3 border border-slate-800 bg-slate-950/50 space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[8px] font-technical font-black text-slate-700 uppercase tracking-widest">STATUS DO SISTEMA</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                             </div>
                             <div className="h-1 bg-slate-900 w-full">
                                <div className="h-full bg-primary/20 w-[64%]" />
                             </div>
                             <p className="text-[8px] font-technical text-slate-500 uppercase tracking-wider leading-tight">OPERAÇÕES: 1.429</p>
                        </div>
                    )}

                    <button
                        onClick={onLogout}
                        className={cn(
                            "w-full flex items-center py-2.5 transition-all duration-200 group whitespace-nowrap border border-transparent hover:border-red-900/30 hover:bg-red-950/20",
                            isCollapsed ? "justify-center" : "gap-3 px-3"
                        )}
                        title={isCollapsed ? "Sair da conta" : undefined}
                    >
                        <LogOut size={14} className="text-slate-700 group-hover:text-red-500 shrink-0" />
                        {!isCollapsed && (
                            <span className="font-technical text-[10px] font-black tracking-widest text-slate-700 group-hover:text-red-500 uppercase">
                                SAIR
                            </span>
                        )}
                    </button>
                </div>
                
                {/* Visual Accent */}
                {!isCollapsed && (
                   <div className="h-1 bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-50" />
                )}
            </aside>
        </>
    );
};
