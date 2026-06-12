import React from 'react';
import { Menu, Bell, Check, Sun, Moon, Activity, Wifi, ShieldCheck, Database, Languages } from 'lucide-react';
import { ViewState } from '../types';
import { Session } from '@supabase/supabase-js';
import { cn } from '../utils/cn';
import { useNotifications } from './NotificationContext';
import { useTheme } from './ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

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
    const { t, i18n } = useTranslation();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { theme, toggleTheme } = useTheme();

    const getHeaderTitle = (view: ViewState): string => {
        switch (view) {
            case 'dashboard': return 'title_dashboard';
            case 'calculator': return 'title_calculator';
            case 'assets': return 'title_assets';
            case 'comparator': return 'title_comparator';
            case 'history': return 'title_history';
            case 'profile': return 'title_profile';
            default: return 'system';
        }
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'pt' ? 'en' : 'pt';
        i18n.changeLanguage(nextLang);
    };

    return (
        <header className="h-16 bg-canvas border-b border-hairline sticky top-0 z-50 px-6 flex items-center justify-between">
            {/* Left Section: Command / View Title */}
            <div className="flex items-center gap-6">
                <button
                    className="md:hidden w-8 h-8 flex items-center justify-center border border-hairline rounded-lg text-muted hover:text-primary transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu size={18} />
                </button>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-base font-sans font-medium text-ink tracking-wide leading-none">
                            {t(getHeaderTitle(currentView))}
                        </h1>
                        <p className="text-xs font-sans text-muted mt-1.5 hidden sm:flex items-center gap-2">
                             {t('active_session')} <span className="text-muted-soft">•</span> <span className="text-muted">{format(new Date(), "yyyy-MM-dd HH:mm")}</span> <span className="text-muted-soft">•</span> <span className="text-green font-medium">{t('system_stable')}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Section: System Actions */}
            <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-6 px-6 border-r border-hairline h-8 self-center">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('network')}</span>
                        <span className="text-xs font-sans font-medium text-green flex items-center gap-1.5">
                            <Wifi size={12} /> {t('connected')}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{t('security')}</span>
                        <span className="text-xs font-sans font-medium text-primary flex items-center gap-1.5">
                            <ShieldCheck size={12} /> {t('protected')}
                        </span>
                    </div>
                </div>

                {/* Language Switcher Button */}
                <button
                    onClick={toggleLanguage}
                    className="w-10 h-10 border border-hairline bg-canvas rounded-lg text-muted hover:text-ink hover:border-border-strong transition-all flex flex-col items-center justify-center relative group"
                    title={i18n.language === 'pt' ? 'Mudar para Inglês' : 'Switch to Portuguese'}
                >
                    <Languages size={14} />
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider mt-0.5">
                        {i18n.language === 'pt' ? 'EN' : 'PT'}
                    </span>
                </button>

                {/* Theme Toggle (Mechanical Look) */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 border border-hairline bg-canvas rounded-lg text-muted hover:text-ink hover:border-border-strong transition-all flex items-center justify-center relative group"
                    title={theme === 'dark' ? 'Alternar tema claro/escuro' : 'Toggle light/dark theme'}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="w-10 h-10 border border-hairline bg-canvas rounded-lg text-muted hover:text-primary hover:border-border-strong transition-all flex items-center justify-center relative group outline-none">
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red animate-pulse"></span>
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4 bg-surface-elevated border-hairline rounded-xl shadow-xl" align="end">
                        <div className="p-4 border-b border-hairline bg-surface-soft flex justify-between items-center">
                            <div>
                                <h4 className="text-xs font-sans font-bold text-ink uppercase tracking-wider">{t('notifications')}</h4>
                                <p className="text-xs font-sans text-muted">{t('unread_notifications', { count: unreadCount })}</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-sans font-bold text-primary hover:text-primary-hover uppercase tracking-wider border border-primary/20 rounded-full px-3 py-1"
                                >
                                    {t('mark_all_read')}
                                </button>
                            )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-surface-elevated">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-muted">
                                    <div className="w-8 h-8 border border-hairline rounded-full mx-auto flex items-center justify-center mb-4">
                                        <Database size={14} />
                                    </div>
                                    <p className="text-xs font-sans uppercase tracking-wider">{t('no_notifications')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-hairline">
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
                                                "p-4 hover:bg-surface-soft transition-colors flex gap-4 group relative cursor-pointer",
                                                !notification.read ? "bg-primary-soft/30" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 mt-1.5 rounded-full shrink-0",
                                                notification.type === 'warning' ? "bg-yellow" : "bg-primary",
                                                notification.read ? "opacity-20" : ""
                                            )} />

                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h5 className={cn("text-xs font-sans font-bold uppercase tracking-wider", notification.read ? "text-muted" : "text-ink")}>
                                                        {notification.title}
                                                    </h5>
                                                    <span className="text-[10px] font-sans text-muted">
                                                        {format(new Date(notification.date), "HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-sans text-muted leading-normal">
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

                {/* Profile Section */}
                <button
                    className="flex items-center gap-3 pl-4 border-l border-hairline group h-10 ml-2"
                    onClick={onProfileClick}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-sans font-bold text-ink group-hover:text-primary transition-colors tracking-wide truncate max-w-[120px]">
                            {session.user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] font-sans text-muted mt-0.5">{t('active_account')}</p>
                    </div>
                    <div className="w-10 h-10 bg-surface-soft border border-hairline rounded-full flex items-center justify-center text-muted font-sans font-bold text-sm group-hover:border-primary group-hover:text-primary transition-all relative overflow-hidden">
                        {session.user.email?.charAt(0).toUpperCase()}
                    </div>
                </button>
            </div>
        </header>
    );
};
