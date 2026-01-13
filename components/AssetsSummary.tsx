
import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Printer, Material } from '../types';
import { Card } from './UIComponents';
import { Printer as PrinterIcon, Droplets } from 'lucide-react';

export const AssetsSummary: React.FC = () => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-5 bg-white group hover:-translate-y-1 transition-transform">
           <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 shadow-xl shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
             <PrinterIcon size={24} className="drop-shadow-md" />
           </div>
           <div className="flex-1">
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Impressoras</p>
             <p className="text-2xl font-black text-gray-800 tracking-tighter">{printers.length}</p>
           </div>
        </Card>
        <Card className="flex items-center gap-5 bg-white group hover:-translate-y-1 transition-transform">
           <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600 shadow-xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
             <Droplets size={24} className="drop-shadow-md" />
           </div>
           <div className="flex-1">
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Estoque de Material</p>
             <p className="text-2xl font-black text-gray-800 tracking-tighter">
               {(totalMaterialStock / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
             </p>
           </div>
        </Card>
    </div>
  );
};
