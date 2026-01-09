import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, Menu, ArrowRightLeft, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { Dashboard } from './Dashboard';
import { AssetsManager } from './AssetsManager';
import { Calculator } from './Calculator';
import { Comparator } from './Comparator';
import { History } from './History';
import { Auth } from './Auth';
import { supabase } from '../services/supabaseClient';
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

  const neuMain = "bg-[#f0f0f0]";
  const neuShadowOut = "shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff]";
  const neuShadowIn = "shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]";

  if (loadingSession) {
    return <div className={`min-h-screen ${neuMain} flex items-center justify-center text-gray-500 font-black uppercase tracking-widest text-xs`}>Inicializando Sistema...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className={`min-h-screen ${neuMain} text-gray-700 flex overflow-hidden font-sans`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/5 z-20 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 ${neuMain} p-6 transform transition-transform duration-500 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`h-20 ${neuShadowOut} rounded-3xl flex items-center px-6 mb-10`}>
          <div className="bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center mr-4 font-black text-white shadow-lg shadow-blue-500/20">3D</div>
          <span className="font-black text-xl tracking-tighter text-gray-700 uppercase">PrintCalc</span>
        </div>

        <nav className="space-y-4 flex-1">
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
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? `text-blue-600 ${neuShadowIn}` 
                    : `text-gray-400 hover:text-gray-600`
                }`}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : ''} />
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-10 space-y-6">
          <div className={`${neuShadowIn} rounded-2xl p-5 text-[10px] font-black text-gray-400 leading-relaxed uppercase tracking-tighter`}>
              Dica: Mantenha seus preços de insumos atualizados para maior precisão.
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-red-500 transition-all duration-300 ${neuShadowOut} active:scale-95`}
          >
             <LogOut size={18} />
             <span className="font-black text-xs uppercase tracking-widest">Encerrar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 flex items-center px-8 md:px-12 justify-between z-10">
           <div className="flex items-center gap-6">
              <button 
                className={`md:hidden p-4 rounded-2xl ${neuShadowOut} active:scale-90 transition-all`}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={22} className="text-gray-500" />
              </button>
              <h1 className="text-xl font-black text-gray-700 tracking-tighter uppercase">
                {navItems.find(i => i.id === currentView)?.label}
              </h1>
           </div>
           
           <div className={`flex items-center gap-5 p-2 px-6 rounded-3xl ${neuShadowOut}`}>
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-gray-700 tracking-tight uppercase">{session.user.email?.split('@')[0]}</p>
               <p className="text-[8px] font-bold text-gray-400 tracking-widest uppercase opacity-60">Operador</p>
             </div>
             <div className={`w-10 h-10 rounded-2xl ${neuShadowIn} flex items-center justify-center text-blue-600 font-black text-sm`}>
               {session.user.email?.charAt(0).toUpperCase()}
             </div>
           </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 md:p-12">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
