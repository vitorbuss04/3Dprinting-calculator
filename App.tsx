import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ViewState } from './types';
import { Dashboard } from './components/Dashboard';
import { AssetsManager } from './components/AssetsManager';
import { Calculator } from './components/Calculator';
import { Comparator } from './components/Comparator';
import { History } from './components/History';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { AppLayout } from './components/AppLayout';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { NotificationProvider } from './components/NotificationContext';
import { ThemeProvider } from './components/ThemeContext';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [assetsInitialTab, setAssetsInitialTab] = useState<'printers' | 'materials' | 'settings'>('printers');
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

  const handleNavigate = (view: ViewState, params?: any) => {
    if (view === 'assets' && params) {
      setAssetsInitialTab(params);
    }
    setCurrentView(view);
  };

  const handleLogout = () => {
    toast((t) => (
      <div className="flex flex-col items-center gap-4 p-2">
        <span className="font-bold text-gray-800">Deseja realmente sair?</span>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'assets': return <AssetsManager initialTab={assetsInitialTab} />;
      case 'calculator': return <Calculator />;
      case 'comparator': return <Comparator />;
      case 'history': return <History />;
      case 'profile': return <Profile />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Toaster />
        <Auth />
      </>
    );
  }

  return (
    <NotificationProvider>
      <ThemeProvider>
        <Toaster />
        <AppLayout
          currentView={currentView}
          onViewChange={handleNavigate}
          session={session}
          onLogout={handleLogout}
        >
          {renderContent()}
        </AppLayout>
      </ThemeProvider>
    </NotificationProvider>
  );
};

export default App;
