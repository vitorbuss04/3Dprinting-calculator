import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ViewState } from '../types';
import { Session } from '@supabase/supabase-js';

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
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-[#F3F5F9] text-gray-900 flex overflow-hidden font-sans selection:bg-blue-500/30 dark:bg-dark-bg dark:text-gray-100">
            <Sidebar
                currentView={currentView}
                onViewChange={onViewChange}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={onLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none dark:from-blue-900/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none dark:bg-blue-500/10" />

                <Header
                    currentView={currentView}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    session={session}
                    onProfileClick={() => onViewChange('profile')}
                    onViewChange={onViewChange}
                />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative scroll-smooth">
                    <div className="max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
