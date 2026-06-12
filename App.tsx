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
import { Button } from './components/ui/Button';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { NotificationProvider } from './components/NotificationContext';
import { ThemeProvider } from './components/ThemeContext';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
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
    toast((toastObj) => (
      <div className="flex flex-col items-center gap-4 p-2 text-center">
        <span className="font-sans font-semibold text-sm text-ink">{t('confirm_logout')}</span>
        <div className="flex gap-2.5">
          <Button
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.dismiss(toastObj.id);
            }}
            className="bg-red hover:bg-red/90 text-white border-none text-xs px-4 h-8"
          >
            {t('logout')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.dismiss(toastObj.id)}
            className="text-xs px-4 h-8"
          >
            {t('cancel')}
          </Button>
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
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-primary border-hairline"></div>
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

