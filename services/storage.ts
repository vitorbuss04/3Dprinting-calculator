import { supabase } from './supabaseClient';
import { Printer, Material, GlobalSettings, Project, ProjectFolder, ProjectStatus, Payment } from '../types';

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
      color: m.color || '', // Default to empty string if not present
      spoolPrice: m.spool_price,
      spoolWeight: m.spool_weight,
      currentStock: m.current_stock,
      manufacturer: m.manufacturer || '',
      printTemp: m.print_temp || undefined,
      bedTemp: m.bed_temp || undefined,
      diameter: m.diameter || undefined
    }));
  },

  addMaterial: async (material: Material) => {
    const userId = await getUserId();
    const payload = {
      id: material.id,
      user_id: userId,
      type: material.type,
      name: material.name,
      color: material.color,
      spool_price: material.spoolPrice,
      spool_weight: material.spoolWeight,
      current_stock: material.currentStock,
      manufacturer: material.manufacturer || null,
      print_temp: material.printTemp !== undefined && (material.printTemp as any) !== '' ? Number(material.printTemp) : null,
      bed_temp: material.bedTemp !== undefined && (material.bedTemp as any) !== '' ? Number(material.bedTemp) : null,
      diameter: material.diameter !== undefined && (material.diameter as any) !== '' ? Number(material.diameter) : null
    };
    const { error } = await supabase.from('materials').insert([payload]);
    if (error) throw error;
  },

  updateMaterial: async (material: Material) => {
    const payload = {
      type: material.type,
      name: material.name,
      color: material.color,
      spool_price: material.spoolPrice,
      spool_weight: material.spoolWeight,
      current_stock: material.currentStock,
      manufacturer: material.manufacturer || null,
      print_temp: material.printTemp !== undefined && (material.printTemp as any) !== '' ? Number(material.printTemp) : null,
      bed_temp: material.bedTemp !== undefined && (material.bedTemp as any) !== '' ? Number(material.bedTemp) : null,
      diameter: material.diameter !== undefined && (material.diameter as any) !== '' ? Number(material.diameter) : null
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
    if (error) throw error;
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
      result: p.result,
      folderId: p.folder_id
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

      result: project.result,
      folder_id: project.folderId
    };
    const { error } = await supabase.from('projects').insert([payload]);
    // A notificação de sucesso agora é tratada pela UI com react-hot-toast
    if (error) throw error;
  },

  updateProject: async (id: string, project: Project) => {
    const payload = {
      name: project.name,
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
      result: project.result,
      folder_id: project.folderId
    };
    const { error } = await supabase.from('projects').update(payload).eq('id', id);
    if (error) throw error;
  },

  updateFolderStatus: async (id: string, status: ProjectStatus): Promise<void> => {
    const { error } = await supabase.from('project_folders').update({ status }).eq('id', id);
    if (error) throw error;
  },

  deleteProject: async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- FOLDERS ---
  getFolders: async (): Promise<ProjectFolder[]> => {
    const { data, error } = await supabase.from('project_folders').select('*').order('created_at', { ascending: false });
    if (error) throw new Error("Não foi possível buscar as pastas.");
    return data.map((f: any) => ({
      id: f.id,
      name: f.name,
      createdAt: f.created_at,
      status: (f.status || 'aguardando') as ProjectStatus,
      discount: f.discount || 0,
      shippingCost: f.shipping_cost || 0,
      payments: f.payments || [],
      notes: f.notes || ''
    }));
  },

  createFolder: async (name: string): Promise<ProjectFolder> => {
    const userId = await getUserId();
    const payload = {
      user_id: userId,
      name: name
    };
    const { data, error } = await supabase.from('project_folders').insert([payload]).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      status: (data.status || 'aguardando') as ProjectStatus,
      payments: data.payments || [],
      notes: data.notes || ''
    };
  },

  updateFolder: async (id: string, folder: Partial<ProjectFolder>): Promise<void> => {
    const payload: any = {};
    if (folder.name !== undefined) payload.name = folder.name;
    if (folder.status !== undefined) payload.status = folder.status;
    if (folder.discount !== undefined) payload.discount = folder.discount;
    if (folder.shippingCost !== undefined) payload.shipping_cost = folder.shippingCost;
    if (folder.payments !== undefined) payload.payments = folder.payments;
    if (folder.notes !== undefined) payload.notes = folder.notes;

    const { error } = await supabase.from('project_folders').update(payload).eq('id', id);
    if (error) throw error;
  },

  deleteFolder: async (id: string) => {
    // Note: Projects will have folder_id set to null due to ON DELETE SET NULL
    const { error } = await supabase.from('project_folders').delete().eq('id', id);
    if (error) throw error;
  }
};