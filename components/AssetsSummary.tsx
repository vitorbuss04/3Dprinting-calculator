import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Printer, Material } from '../types';
import { Card } from './ui/Card'; // Updated import
import { Printer as PrinterIcon, Droplets } from 'lucide-react';
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
    return null;
  }

  const SummaryCard = ({ title, value, unit, icon: Icon, colorClass, bgClass, shadowClass, onClick }: any) => (
    <Card
      variant="glass"
      onClick={onClick}
      className={cn(
        "flex items-center gap-5 p-5 group hover:-translate-y-1 transition-transform relative overflow-hidden",
        onClick ? "cursor-pointer active:scale-95" : "cursor-default"
      )}
    >
      <div className={cn("p-4 rounded-2xl shadow-inner transition-colors duration-300", bgClass, colorClass)}>
        <Icon size={24} className="drop-shadow-md" />
      </div>
      <div className="flex-1 relative z-10">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1 dark:text-gray-500">{title}</p>
        <p className="text-2xl font-black text-gray-800 tracking-tighter dark:text-gray-100">
          {value} <span className="text-sm font-semibold text-gray-400 ml-1 dark:text-gray-500">{unit}</span>
        </p>
      </div>
      <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-xl", shadowClass)} />
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SummaryCard
        title="Impressoras Ativas"
        value={printers.length}
        unit={printers.length === 1 ? "Unidade" : "Unidades"}
        icon={PrinterIcon}
        colorClass="text-orange-600 group-hover:text-white group-hover:bg-orange-500 dark:text-orange-400 dark:group-hover:text-white dark:group-hover:bg-orange-600"
        bgClass="bg-orange-50 dark:bg-orange-500/20"
        shadowClass="bg-orange-500"
        onClick={() => onNavigate?.('assets', 'printers')}
      />
      <SummaryCard
        title="Estoque de Material"
        value={(totalMaterialStock / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        unit="kg"
        icon={Droplets}
        colorClass="text-cyan-600 group-hover:text-white group-hover:bg-cyan-500 dark:text-cyan-400 dark:group-hover:text-white dark:group-hover:bg-cyan-600"
        bgClass="bg-cyan-50 dark:bg-cyan-500/20"
        shadowClass="bg-cyan-500"
        onClick={() => onNavigate?.('assets', 'materials')}
      />
    </div>
  );
};
