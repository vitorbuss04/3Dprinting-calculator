import React, { useState } from 'react';
import { LayoutDashboard, Calculator as CalcIcon, Printer, History as HistoryIcon, Menu, X, ArrowRightLeft } from 'lucide-react';
import { ViewState } from './types';
import { Dashboard } from './components/Dashboard';
import { AssetsManager } from './components/AssetsManager';
import { Calculator } from './components/Calculator';
import { Comparator } from './components/Comparator';
import { History } from './components/History';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center mr-3 font-bold text-white">3D</div>
          <span className="font-bold text-xl tracking-tight">PrintCalc</span>
        </div>

        <nav className="p-4 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
           <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-500 border border-slate-700">
              <p>Dica: Adicione seus ativos primeiro para permitir cálculos precisos.</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 flex items-center px-6 md:px-8 justify-between z-10">
           <div className="flex items-center gap-4">
              <button 
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg md:text-xl font-semibold text-slate-200 capitalize">
                {navItems.find(i => i.id === currentView)?.label}
              </h1>
           </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;