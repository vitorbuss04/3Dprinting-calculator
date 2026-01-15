import React from 'react';
import { Menu, Bell, Check, Info, AlertTriangle, X, Moon, Sun } from 'lucide-react';
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
        dashboard: 'Visão Geral',
        calculator: 'Calculadora de Impressão',
        assets: 'Gerenciamento de Ativos',
        comparator: 'Comparador de Materiais',
        history: 'Histórico de Projetos',
        profile: 'Meu Perfil'
    };

    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-white/20 sticky top-0 z-10 px-8 flex items-center justify-between transition-all duration-300 dark:bg-dark-surface/50 dark:border-white/10">
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 rounded-xl hover:bg-white/50 text-gray-500 hover:text-gray-900 transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {titles[currentView] || 'Dashboard'}
                    </h1>
                    <p className="text-xs text-gray-400 font-medium hidden sm:block">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-white/50 text-gray-400 hover:text-blue-500 transition-colors dark:hover:bg-white/10 dark:text-gray-500 dark:hover:text-yellow-400"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative p-2 rounded-full hover:bg-white/50 text-gray-400 hover:text-blue-500 transition-colors outline-none dark:hover:bg-white/10">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 sm:w-96 p-0 mr-4 dark:bg-dark-surface dark:border-white/10" align="end">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl dark:bg-white/5 dark:border-white/5">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Notificações</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Você tem {unreadCount} novas mensagens</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors dark:text-blue-400 dark:hover:bg-blue-500/20"
                                >
                                    Marcar lidas
                                </button>
                            )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                    <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                    <p className="text-sm">Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-white/5">
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
                                                "p-4 hover:bg-gray-50 transition-colors flex gap-3 group relative cursor-pointer dark:hover:bg-white/5",
                                                !notification.read ? "bg-blue-50/30 dark:bg-blue-500/10" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full mt-2 shrink-0",
                                                notification.type === 'warning' ? "bg-amber-400" : "bg-blue-400",
                                                notification.read ? "opacity-0" : ""
                                            )} />

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h5 className={cn("text-sm font-semibold", notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100")}>
                                                        {notification.title}
                                                    </h5>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                        {format(new Date(notification.date), "dd MMM", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed mb-2 dark:text-gray-400">
                                                    {notification.message}
                                                </p>
                                                {notification.link && onViewChange && (
                                                    <span className="text-[10px] font-bold text-blue-500 group-hover:text-blue-600 flex items-center gap-1">
                                                        Ver detalhes
                                                    </span>
                                                )}
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="absolute top-2 right-2 p-1 text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Marcar como lida"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <div
                    className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer group dark:border-white/10"
                    onClick={onProfileClick}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors dark:text-gray-200 dark:group-hover:text-blue-400">
                            {session.user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide dark:text-gray-500">PRO PLAN</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-white/50 shadow-inner flex items-center justify-center text-gray-600 font-bold text-sm transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20 dark:from-white/10 dark:to-white/5 dark:border-white/10 dark:text-gray-300">
                        {session.user.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};
