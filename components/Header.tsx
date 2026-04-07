import React from 'react';
import { Menu, Bell, Check, Sun, Moon, Activity, Wifi, ShieldCheck, Database } from 'lucide-react';
import { ViewState } from '../types';
import { Session } from '@supabase/supabase-js';
import { cn } from '../utils/cn';
import { useNotifications } from './NotificationContext';
import { useTheme } from './ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
    currentView: ViewState;
    onMenuClick: () => void;
    session: Session;
    onProfileClick: () => void;
    onViewChange?: (view: ViewState, params?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
    currentView,
    onMenuClick,
    session,
    onProfileClick,
    onViewChange
}) => {
    const titles: Record<string, string> = {
        dashboard: 'PAINEL GERAL',
        calculator: 'CALCULADORA',
        assets: 'IMPRESSORAS E MATERIAIS',
        comparator: 'COMPARAR CUSTOS',
        history: 'HISTÓRICO',
        profile: 'MEU PERFIL'
    };

    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-slate-950 border-b border-slate-900 sticky top-0 z-50 px-6 flex items-center justify-between">
            {/* Left Section: Command / View Title */}
            <div className="flex items-center gap-6">
                <button
                    className="md:hidden w-8 h-8 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-primary transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu size={18} />
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1 group">
                        <div className="w-1.5 h-1.5 bg-primary animate-[pulse_2s_infinite]" />
                        <div className="w-1.5 h-1.5 border border-primary/30" />
                    </div>
                    <div>
                        <h1 className="text-sm font-technical font-black text-white uppercase tracking-[0.25em] leading-none">
                            {titles[currentView] || 'SISTEMA'}
                        </h1>
                        <p className="text-[9px] font-technical text-slate-600 uppercase tracking-widest mt-1.5 hidden sm:flex items-center gap-2">
                             SESSÃO ATIVA // <span className="text-slate-400">{format(new Date(), "yyyy-MM-dd HH:mm")}</span> // SISTEMA ESTÁVEL
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Section: System Actions */}
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-6 px-6 border-r border-slate-900 h-8 self-center">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-technical font-black text-slate-600 uppercase tracking-widest">REDE</span>
                        <span className="text-[9px] font-technical font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Wifi size={10} /> CONECTADO
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-technical font-black text-slate-600 uppercase tracking-widest">SEGURANÇA</span>
                        <span className="text-[9px] font-technical font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck size={10} /> PROTEGIDO
                        </span>
                    </div>
                </div>

                {/* Theme Toggle (Mechanical Look) */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 border border-slate-900 bg-slate-950 text-slate-600 hover:text-white hover:border-slate-800 transition-all flex items-center justify-center relative group"
                    title="Alternar tema claro/escuro"
                >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    <div className="absolute top-0 right-0 w-1 h-1 bg-slate-800 group-hover:bg-primary" />
                </button>

                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="w-10 h-10 border border-slate-900 bg-slate-950 text-slate-600 hover:text-primary hover:border-slate-800 transition-all flex items-center justify-center relative group outline-none">
                            <Bell size={14} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-primary animate-pulse"></span>
                            )}
                            <div className="absolute top-0 right-0 w-1 h-1 bg-slate-800 group-hover:bg-primary" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4 bg-slate-950 border-slate-800 rounded-none shadow-2xl" align="end">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
                            <div>
                                <h4 className="text-[10px] font-technical font-black text-white uppercase tracking-[0.2em]">NOTIFICAÇÕES</h4>
                                <p className="text-[9px] font-technical text-slate-600 uppercase tracking-wider">{unreadCount} não lida(s)</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[9px] font-technical font-black text-primary hover:text-orange-400 uppercase tracking-widest border border-primary/20 px-2 py-1"
                                >
                                    MARCAR TUDO COMO LIDO
                                </button>
                            )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-950">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-slate-700">
                                    <div className="w-8 h-8 border border-slate-900 mx-auto flex items-center justify-center mb-4">
                                        <Database size={14} />
                                    </div>
                                    <p className="text-[9px] font-technical uppercase tracking-widest">NENHUMA NOTIFICAÇÃO</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-900">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => {
                                                if (notification.link && onViewChange) {
                                                    if (!notification.read) markAsRead(notification.id);
                                                    onViewChange(notification.link as ViewState, 'materials');
                                                }
                                            }}
                                            className={cn(
                                                "p-4 hover:bg-slate-900/50 transition-colors flex gap-4 group relative cursor-pointer",
                                                !notification.read ? "bg-primary/5" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1 h-1 mt-1.5 shrink-0",
                                                notification.type === 'warning' ? "bg-amber-500" : "bg-primary",
                                                notification.read ? "opacity-20" : ""
                                            )} />

                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h5 className={cn("text-[10px] font-technical font-black uppercase tracking-widest", notification.read ? "text-slate-600" : "text-white")}>
                                                        {notification.title}
                                                    </h5>
                                                    <span className="text-[9px] font-technical text-slate-700 font-bold">
                                                        {format(new Date(notification.date), "HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-technical text-slate-500 leading-normal uppercase">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="absolute top-4 right-4 p-1 text-slate-700 hover:text-primary opacity-0 group-hover:opacity-100 transition-all border border-slate-800"
                                                >
                                                    <Check size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Profile Section (Utilitarian) */}
                <button
                    className="flex items-center gap-3 pl-4 border-l border-slate-900 group h-10 ml-2"
                    onClick={onProfileClick}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-technical font-black text-white group-hover:text-primary transition-colors uppercase tracking-[0.1em] truncate max-w-[120px]">
                            {session.user.email?.split('@')[0]}
                        </p>
                        <p className="text-[8px] font-technical font-black text-slate-700 uppercase tracking-[0.2em] mt-0.5">CONTA ATIVA</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-400 font-technical font-black text-xs group-hover:border-primary group-hover:text-primary transition-all relative overflow-hidden">
                        {session.user.email?.charAt(0).toUpperCase()}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-800" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-800" />
                    </div>
                </button>
            </div>
        </header>
    );
};
