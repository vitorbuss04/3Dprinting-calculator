import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ViewState } from '../types';
import { Session } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

interface AppLayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    onViewChange: (view: ViewState, params?: any) => void;
    session: Session;
    onLogout: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    currentView,
    onViewChange,
    session,
    onLogout
}) => {
    const { t } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-canvas text-body flex overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            <Sidebar
                currentView={currentView}
                onViewChange={onViewChange}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={onLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header
                    currentView={currentView}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    session={session}
                    onProfileClick={() => onViewChange('profile')}
                    onViewChange={onViewChange}
                />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </div>

                {/* System Status Line at Footer */}
                <div className="hidden lg:flex h-6 border-t border-hairline bg-surface-soft px-6 items-center justify-between text-[10px] font-sans font-medium text-muted z-10">
                    <div className="flex items-center gap-4">
                        <span>{t('secured_data')}</span>
                        <span>{t('sync_active')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-green/70">{t('server_online')}</span>
                        <span className="text-primary/70">{t('system_stable')}</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

