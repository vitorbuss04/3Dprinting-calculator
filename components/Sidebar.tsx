import React from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, ArrowRightLeft, LogOut, ChevronLeft, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navItems = [
        { id: 'dashboard', label: t('title_dashboard'), icon: LayoutDashboard },
        { id: 'calculator', label: t('title_calculator'), icon: CalcIcon },
        { id: 'assets', label: t('title_assets'), icon: Printer },
        { id: 'comparator', label: t('title_comparator'), icon: ArrowRightLeft },
        { id: 'history', label: t('title_history'), icon: HistoryIcon },
        { id: 'profile', label: t('title_profile'), icon: Settings },
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
                "fixed md:static inset-y-0 left-0 z-50 bg-canvas border-r border-hairline transform transition-all duration-300 ease-in-out flex flex-col",
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                isCollapsed ? 'md:w-16' : 'w-64'
            )}>
                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-canvas border border-hairline rounded-full items-center justify-center text-muted hover:text-primary z-50 transition-all active:bg-surface-soft shadow-sm"
                >
                    <ChevronLeft size={10} className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} />
                </button>

                {/* Brand Unit */}
                <div className={cn(
                    "h-16 flex items-center border-b border-hairline transition-all duration-300",
                    isCollapsed ? "justify-center" : "px-6"
                )}>
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-primary rounded-lg text-white font-sans font-bold text-xs">
                        3D
                    </div>

                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <span className="block font-sans font-bold text-sm tracking-wide text-ink whitespace-nowrap">
                                {t('gestao_3d', 'Gestão 3D')}
                            </span>
                            <span className="block font-sans text-[10px] text-muted tracking-wider mt-0.5">{t('control_panel')}</span>
                        </div>
                    )}
                </div>

                {/* Navigation Hub */}
                <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto mt-2">
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
                                    "w-full flex items-center py-2.5 transition-all duration-150 relative group whitespace-nowrap rounded-xl",
                                    isCollapsed ? "justify-center" : "gap-3 px-4",
                                    isActive
                                        ? "text-primary bg-primary-soft"
                                        : "text-muted hover:text-ink hover:bg-surface-strong"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon
                                    size={18}
                                    className={cn(
                                        "relative z-10 transition-colors shrink-0",
                                        isActive ? "text-primary" : "text-muted group-hover:text-ink"
                                    )}
                                />
                                {!isCollapsed && (
                                    <span className={cn(
                                        "relative z-10 font-sans text-sm font-medium transition-all",
                                        isActive ? "text-primary" : "text-muted group-hover:text-ink"
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer: Quick Action + Logout */}
                <div className="p-4 border-t border-hairline space-y-3">
                    {!isCollapsed && (
                        <button
                            onClick={() => {
                                onViewChange('calculator');
                                onClose();
                            }}
                            className="w-full p-3 border border-primary/20 bg-primary-soft text-left rounded-xl space-y-1 hover:border-primary/40 transition-colors group"
                        >
                            <span className="text-[10px] font-sans font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <CalcIcon size={10} />
                                {t('new_calculation', 'Novo Cálculo')}
                            </span>
                            <p className="text-[10px] font-sans text-muted leading-tight group-hover:text-body transition-colors">
                                {t('new_calculation_hint', 'Calcule o custo de uma nova peça')}
                            </p>
                        </button>
                    )}

                    <button
                        onClick={onLogout}
                        className={cn(
                            "w-full flex items-center py-2.5 transition-all duration-200 group whitespace-nowrap rounded-xl border border-transparent hover:bg-red/10",
                            isCollapsed ? "justify-center" : "gap-3 px-4"
                        )}
                        title={isCollapsed ? t('logout') : undefined}
                    >
                        <LogOut size={16} className="text-muted group-hover:text-red shrink-0" />
                        {!isCollapsed && (
                            <span className="font-sans text-sm font-medium text-muted group-hover:text-red">
                                {t('logout')}
                            </span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};
