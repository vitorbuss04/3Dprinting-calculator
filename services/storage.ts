import { supabase } from './supabaseClient';
import { Printer, Material, GlobalSettings, Project } from '../types';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  return user.id;
};

// Default settings if DB is empty
const DEFAULT_SETTINGS: GlobalSettings = {
  electricityCost: 0.85,
  currencySymbol: 'R$'
};

export const StorageService = {
  // --- PRINTERS ---
  getPrinters: async (): Promise<Printer[]> => {
    const { data, error } = await supabase.from('printers').select('*');
    if (error) { throw new Error('Não foi possível buscar as impressoras.'); }
    
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      acquisitionCost: p.acquisition_cost,
      lifespanHours: p.lifespan_hours,
      powerConsumption: p.power_consumption,
      maintenanceCostPerHour: p.maintenance_cost_per_hour
    }));
  },

  addPrinter: async (printer: Printer) => {
    const userId = await getUserId();
    const payload = {
      id: printer.id,
      user_id: userId,
      name: printer.name,
      acquisition_cost: printer.acquisitionCost,
      lifespan_hours: printer.lifespanHours,
      power_consumption: printer.powerConsumption,
      maintenance_cost_per_hour: printer.maintenanceCostPerHour
    };
    const { error } = await supabase.from('printers').insert([payload]);
    if (error) throw error;
  },

  updatePrinter: async (printer: Printer) => {
    const payload = {
      name: printer.name,
      acquisition_cost: printer.acquisitionCost,
      lifespan_hours: printer.lifespanHours,
      power_consumption: printer.powerConsumption,
      maintenance_cost_per_hour: printer.maintenanceCostPerHour
    };
    const { error } = await supabase.from('printers').update(payload).eq('id', printer.id);
    if (error) throw error;
  },

  deletePrinter: async (id: string) => {
    const { error } = await supabase.from('printers').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MATERIALS ---
  getMaterials: async (): Promise<Material[]> => {
    const { data, error } = await supabase.from('materials').select('*');
    if (error) { throw new Error("Não foi possível buscar os materiais."); }
    
    return data.map((m: any) => ({
      id: m.id,
      type: m.type,
      name: m.name,
      spoolPrice: m.spool_price,
      spoolWeight: m.spool_weight,
      currentStock: m.current_stock
    }));
  },

  addMaterial: async (material: Material) => {
    const userId = await getUserId();
    const payload = {
      id: material.id,
      user_id: userId,
      type: material.type,
      name: material.name,
      spool_price: material.spoolPrice,
      spool_weight: material.spoolWeight,
      current_stock: material.currentStock
    };
    const { error } = await supabase.from('materials').insert([payload]);
    if (error) throw error;
  },

  updateMaterial: async (material: Material) => {
    const payload = {
      type: material.type,
      name: material.name,
      spool_price: material.spoolPrice,
      spool_weight: material.spoolWeight,
      current_stock: material.currentStock
    };
    const { error } = await supabase.from('materials').update(payload).eq('id', material.id);
    if (error) throw error;
  },

  deleteMaterial: async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<GlobalSettings> => {
    const { data, error } = await supabase.from('global_settings').select('*').maybeSingle();
    if (error) console.warn("Erro ao buscar configurações, usando padrões.", error);
    if (!data) { 
      return DEFAULT_SETTINGS; 
    }
    return {
      electricityCost: data.electricity_cost,
      currencySymbol: data.currency_symbol
    };
  },

  saveSettings: async (settings: GlobalSettings) => {
    const userId = await getUserId();
    const payload = {
      user_id: userId,
      electricity_cost: settings.electricityCost,
      currency_symbol: settings.currencySymbol
    };
    const { error } = await supabase.from('global_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
  },

  // --- PROJECTS ---
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase.from('projects').select('*').order('date', { ascending: false });
    if (error) { throw new Error("Não foi possível buscar os projetos."); }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      date: p.date,
      printerId: p.printer_id,
      materialId: p.material_id,
      printTimeHours: p.print_time_hours,
      printTimeMinutes: p.print_time_minutes,
      modelWeight: p.model_weight,
      failureRate: p.failure_rate,
      laborTimeHours: p.labor_time_hours,
      laborTimeMinutes: p.labor_time_minutes,
      laborHourlyRate: p.labor_hourly_rate,
      markup: p.markup,
      result: p.result
    }));
  },

  addProject: async (project: Project) => {
    const userId = await getUserId();
    const payload = {
      id: project.id,
      user_id: userId,
      name: project.name,
      date: project.date,
      printer_id: project.printerId,
      material_id: project.materialId,
      print_time_hours: project.printTimeHours,
      print_time_minutes: project.printTimeMinutes,
      model_weight: project.modelWeight,
      failure_rate: project.failureRate,
      labor_time_hours: project.laborTimeHours,
      labor_time_minutes: project.laborTimeMinutes,
      labor_hourly_rate: project.laborHourlyRate,
      markup: project.markup,
      result: project.result
    };
    const { error } = await supabase.from('projects').insert([payload]);
    // A notificação de sucesso agora é tratada pela UI com react-hot-toast
    if (error) throw error;
  },

  deleteProject: async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }
};