import React from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, ArrowRightLeft, LogOut, ChevronLeft } from 'lucide-react';
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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calculator', label: 'Calculadora', icon: CalcIcon },
        { id: 'assets', label: 'Meus Ativos', icon: Printer },
        { id: 'comparator', label: 'Comparador', icon: ArrowRightLeft },
        { id: 'history', label: 'Histórico', icon: HistoryIcon },
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed md:static inset-y-0 left-0 z-30 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl md:shadow-none transform transition-all duration-300 ease-in-out flex flex-col dark:bg-dark-surface/80 dark:border-white/10",
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                isCollapsed ? 'md:w-20' : 'w-72'
            )}>
                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-500 hover:text-blue-600 shadow-sm z-50 hover:scale-110 transition-all dark:bg-dark-surface dark:border-white/10 dark:text-gray-400"
                >
                    <ChevronLeft size={14} className={cn("transition-transform", isCollapsed && "rotate-180")} />
                </button>

                <div className={cn(
                    "h-20 flex items-center border-b border-gray-100/50 transition-all duration-300 dark:border-white/5",
                    isCollapsed ? "px-0 justify-center" : "px-8"
                )}>
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                        <span className="font-bold text-lg">3D</span>
                    </div>

                    <span className={cn(
                        "font-bold text-2xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 dark:from-white dark:to-gray-400",
                        isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100"
                    )}>
                        PrintCalc
                    </span>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
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
                                    "w-full flex items-center py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden whitespace-nowrap",
                                    isCollapsed ? "justify-center px-0" : "gap-4 px-4",
                                    isActive
                                        ? "text-white shadow-lg shadow-blue-500/25"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-blue-400"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                )}
                                <Icon
                                    size={20}
                                    className={cn(
                                        "relative z-10 transition-transform duration-300 flex-shrink-0",
                                        isActive ? "drop-shadow-sm" : "",
                                        !isActive && "group-hover:scale-110"
                                    )}
                                />
                                <span className={cn(
                                    "relative z-10 font-medium text-sm tracking-wide transition-all duration-300",
                                    isActive ? "font-semibold" : "",
                                    isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100/50 space-y-4 dark:border-white/5">
                    {/* Tip Card */}
                    {!isCollapsed && (
                        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 animate-in fade-in duration-300 dark:bg-none dark:bg-white/5 dark:border-white/5">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-blue-500/10 rounded-full blur-xl" />
                            <p className="relative z-10 text-xs text-blue-800 font-medium leading-relaxed dark:text-gray-300">
                                💡 Mantenha seus preços de insumos atualizados para maior precisão.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onLogout}
                        className={cn(
                            "w-full flex items-center py-3 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group whitespace-nowrap dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400",
                            isCollapsed ? "justify-center px-0" : "gap-3 px-4"
                        )}
                        title={isCollapsed ? "Sair da Conta" : undefined}
                    >
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-colors shrink-0 dark:bg-white/5 dark:group-hover:bg-red-500/20">
                            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>

                        <span className={cn(
                            "font-semibold text-sm transition-all duration-300",
                            isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                        )}>
                            Sair da Conta
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};
