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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-technical selection:bg-primary selection:text-white">
            <Sidebar
                currentView={currentView}
                onViewChange={onViewChange}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={onLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Technical background elements */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
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
                <div className="hidden lg:flex h-6 border-t border-slate-900 bg-slate-950 px-6 items-center justify-between text-[8px] font-technical font-black text-slate-700 uppercase tracking-[0.3em] z-10">
                    <div className="flex items-center gap-4">
                        <span className="text-slate-500">DADOS PROTEGIDOS</span>
                        <span className="text-slate-500">SINCRONIZAÇÃO: ATIVA</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-emerald-900/50">SERVIDOR ONLINE</span>
                        <span className="animate-pulse text-primary/30">SISTEMA ESTÁVEL</span>
                    </div>
                </div>
            </main>
        </div>
    );
};
