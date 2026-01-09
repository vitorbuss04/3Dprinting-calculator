
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
import { neuMain, neuShadowOut, neuShadowIn, neuButton } from './components/UIComponents';

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
    return <div className={`h-screen ${neuMain} flex items-center justify-center text-gray-400 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse`}>Sincronizando Sistema...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className={`h-screen w-full ${neuMain} text-gray-700 flex overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-600 overflow-x-hidden`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 md:hidden backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - overflow-visible para garantir que nada corte o efeito neumórfico */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-[20vw] min-w-[280px] ${neuMain} p-[2.5vw] transform transition-all duration-500 ease-in-out flex flex-col shrink-0 overflow-visible
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ backgroundClip: 'unset' }}>
        <div className={`h-[10vh] min-h-[80px] ${neuShadowOut} rounded-[2vw] flex items-center px-8 mb-10 transform hover:scale-[1.02] transition-transform shrink-0`}>
          <div className="bg-blue-600 w-11 h-11 rounded-2xl flex items-center justify-center mr-5 font-black text-white shadow-xl shadow-blue-500/30">3D</div>
          <span className="font-black text-[clamp(1.1rem,1.6vw,1.7rem)] tracking-tighter text-gray-800 uppercase">PrintCalc</span>
        </div>

        {/* Menu de navegação com overflow-visible para não cortar as sombras dos botões ativos */}
        <nav className="space-y-5 flex-1 overflow-visible px-2 py-2">
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
                className={`w-full flex items-center gap-5 px-7 py-5 rounded-[1.5vw] transition-all duration-300 group ${
                  isActive 
                    ? `bg-blue-600 text-white shadow-2xl shadow-blue-500/40 scale-[1.05]` 
                    : `text-gray-400 hover:text-gray-600 ${neuButton}`
                }`}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-lg' : 'opacity-70 group-hover:scale-110 transition-transform'} />
                <span className="font-black text-[clamp(0.65rem,0.85vw,0.8rem)] uppercase tracking-[0.2em]">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-10 space-y-8 shrink-0 overflow-visible px-2">
          <div className={`${neuShadowIn} rounded-[1.2vw] p-5 text-[0.65rem] font-black text-gray-400 leading-relaxed uppercase tracking-tighter border border-white/40`}>
              Dica: Mantenha preços atualizados para precisão.
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-5 px-7 py-5 rounded-[1.5vw] text-gray-400 hover:text-red-500 transition-all duration-300 ${neuShadowOut} active:scale-95 group`}
          >
             <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
             <span className="font-black text-[clamp(0.65rem,0.85vw,0.8rem)] uppercase tracking-[0.25em]">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content - min-w-0 e overflow-x-hidden para garantir ausência de rolagem horizontal */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden overflow-x-hidden">
        {/* Header */}
        <header className="h-[12vh] min-h-[90px] flex items-center px-[5vw] justify-between shrink-0 overflow-visible">
           <div className="flex items-center gap-8 overflow-visible">
              <button 
                className={`md:hidden p-5 rounded-2xl ${neuShadowOut} active:scale-90 transition-all text-gray-500`}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div className="flex flex-col">
                <h1 className="text-[clamp(1.3rem,2.2vw,2.8rem)] font-black text-gray-800 tracking-tighter uppercase leading-none">
                  {navItems.find(i => i.id === currentView)?.label}
                </h1>
                <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">Módulo Operacional</p>
              </div>
           </div>
           
           <div className={`flex items-center gap-5 p-2.5 px-8 rounded-[2.5vw] ${neuShadowOut} transform hover:scale-[1.03] transition-all cursor-default group`}>
             <div className="text-right hidden sm:block">
               <p className="text-[clamp(0.65rem,0.9vw,0.85rem)] font-black text-gray-800 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{session.user.email?.split('@')[0]}</p>
               <p className="text-[0.6rem] font-bold text-gray-400 tracking-[0.1em] uppercase opacity-60">Controlador</p>
             </div>
             <div className={`w-11 h-11 rounded-2xl ${neuShadowIn} flex items-center justify-center text-blue-600 font-black text-base border border-white/50`}>
               {session.user.email?.charAt(0).toUpperCase()}
             </div>
           </div>
        </header>

        {/* Scrollable Area - Aumentado o padding inferior para pb-[20vh] e removido h-full do container interno */}
        <div className="flex-1 min-h-0 px-[5vw] pb-[20vh] overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex flex-col overflow-visible">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
