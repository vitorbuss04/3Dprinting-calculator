import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Printer, Material } from '../types';
import { Card } from './ui/Card';
import { Printer as PrinterIcon, Droplets, ArrowRight, Database, Package } from 'lucide-react';
import { cn } from '../utils/cn';
import { ViewState } from '../types';

interface AssetsSummaryProps {
  onNavigate?: (view: ViewState, tab?: string) => void;
}

export const AssetsSummary: React.FC<AssetsSummaryProps> = ({ onNavigate }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      const [p, m] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getMaterials()
      ]);
      setPrinters(p);
      setMaterials(m);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalMaterialStock = materials.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);

  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-24">
            <div className="bg-slate-900/20 border border-slate-900 animate-pulse" />
            <div className="bg-slate-900/20 border border-slate-900 animate-pulse" />
        </div>
    );
  }

  const SummaryCard = ({ title, value, unit, icon: Icon, colorClass, onClick, subtext }: any) => (
    <Card
      variant="industrial"
      onClick={onClick}
      className={cn(
        "flex flex-col p-6 group transition-all relative overflow-hidden h-full",
        onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 border border-slate-800 flex items-center justify-center bg-slate-950 transition-colors group-hover:border-current", colorClass)}>
           <Icon size={18} />
        </div>
        <div className="text-right">
           <p className="text-slate-600 text-[9px] font-technical font-black uppercase tracking-[0.2em]">{title}</p>
           <p className="text-xs font-technical text-slate-500 uppercase mt-1 tracking-wider">{subtext}</p>
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <p className="text-2xl font-technical font-extrabold text-white tracking-tighter">
          {value}
        </p>
        <span className="text-[10px] font-technical font-black text-slate-600 uppercase tracking-widest">{unit}</span>
      </div>

      <div className="absolute bottom-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform text-slate-800 group-hover:text-primary">
         <ArrowRight size={14} />
      </div>
      
      {/* Precision corner accent */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-800 group-hover:border-primary transition-colors" />
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SummaryCard
        title="IMPRESSORAS"
        subtext="TOTAL ATIVO"
        value={printers.length.toString().padStart(2, '0')}
        unit="UNIDADES"
        icon={PrinterIcon}
        colorClass="text-secondary"
        onClick={() => onNavigate?.('assets', 'printers')}
      />
      <SummaryCard
        title="MATÉRIA-PRIMA"
        subtext="ESTOQUE GLOBAL"
        value={(totalMaterialStock / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        unit="QUILOGRAMAS"
        icon={Package}
        colorClass="text-primary"
        onClick={() => onNavigate?.('assets', 'materials')}
      />
    </div>
  );
};
