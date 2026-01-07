import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, Menu, ArrowRightLeft, LogOut } from 'lucide-react';
import { ViewState } from './types';
import { Dashboard } from './components/Dashboard';
import { AssetsManager } from './components/AssetsManager';
import { Calculator } from './components/Calculator';
import { Comparator } from './components/Comparator';
import { History } from './components/History';
import { Auth } from './components/Auth';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Calculadora', icon: CalcIcon },
    { id: 'assets', label: 'Meus Ativos', icon: Printer },
    { id: 'comparator', label: 'Comparador', icon: ArrowRightLeft },
    { id: 'history', label: 'Histórico', icon: HistoryIcon },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'assets': return <AssetsManager />;
      case 'calculator': return <Calculator />;
      case 'comparator': return <Comparator />;
      case 'history': return <History />;
      default: return <Dashboard />;
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-900">Carregando...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center mr-3 font-bold text-white shadow-lg shadow-blue-500/40 transform hover:scale-105 transition-transform">3D</div>
          <span className="font-bold text-xl tracking-tight text-gray-800">PrintCalc</span>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as ViewState);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-400/40 scale-[1.02]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]' : 'drop-shadow-sm'} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 border border-gray-100 shadow-inner">
              <p>Dica: Mantenha seus preços de insumos atualizados para maior precisão.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
             <LogOut size={18} className="drop-shadow-sm" />
             <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-gray-200 flex items-center px-6 md:px-8 justify-between z-10">
           <div className="flex items-center gap-4">
              <button 
                className="md:hidden text-gray-500 hover:text-gray-900"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-bold text-gray-800 capitalize">
                {navItems.find(i => i.id === currentView)?.label}
              </h1>
           </div>
           <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-medium text-gray-900">{session.user.email?.split('@')[0]}</p>
               <p className="text-[10px] text-gray-400">{session.user.email}</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 font-bold text-xs transform hover:scale-110 transition-transform">
               {session.user.email?.charAt(0).toUpperCase()}
             </div>
           </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;