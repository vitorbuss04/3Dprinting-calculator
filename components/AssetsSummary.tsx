import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Printer, Material } from '../types';
import { Card } from './ui/Card';
import { Printer as PrinterIcon, ArrowRight, Package } from 'lucide-react';
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
            <div className="bg-surface-soft border border-hairline animate-pulse rounded-2xl" />
            <div className="bg-surface-soft border border-hairline animate-pulse rounded-2xl" />
        </div>
    );
  }

  const SummaryCard = ({ title, value, unit, icon: Icon, colorClass, onClick, subtext }: any) => (
    <Card
      variant="default"
      onClick={onClick}
      className={cn(
        "flex flex-col p-6 group transition-all relative overflow-hidden h-full border border-hairline",
        onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 border border-hairline rounded-lg flex items-center justify-center bg-surface-soft transition-colors group-hover:border-primary", colorClass)}>
           <Icon size={18} />
        </div>
        <div className="text-right">
           <p className="text-muted text-[10px] font-sans font-medium uppercase tracking-wider">{title}</p>
           <p className="text-xs font-sans text-muted mt-1">{subtext}</p>
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <p className="text-2xl font-sans font-semibold text-ink tracking-tight">
          {value}
        </p>
        <span className="text-[10px] font-sans font-medium text-muted uppercase tracking-wider">{unit}</span>
      </div>

      <div className="absolute bottom-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform text-muted group-hover:text-primary">
         <ArrowRight size={14} />
      </div>
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
        colorClass="text-green"
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
