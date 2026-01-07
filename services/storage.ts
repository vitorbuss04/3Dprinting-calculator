import { Printer, Material, GlobalSettings, Project } from '../types';

const KEYS = {
  PRINTERS: '3dcalc_printers',
  MATERIALS: '3dcalc_materials',
  SETTINGS: '3dcalc_settings',
  PROJECTS: '3dcalc_projects'
};

const DEFAULT_SETTINGS: GlobalSettings = {
  electricityCost: 0.85, // Example default R$/kWh
  currencySymbol: 'R$'
};

export const StorageService = {
  getPrinters: (): Printer[] => {
    const data = localStorage.getItem(KEYS.PRINTERS);
    return data ? JSON.parse(data) : [];
  },
  savePrinters: (printers: Printer[]) => {
    localStorage.setItem(KEYS.PRINTERS, JSON.stringify(printers));
  },

  getMaterials: (): Material[] => {
    const data = localStorage.getItem(KEYS.MATERIALS);
    return data ? JSON.parse(data) : [];
  },
  saveMaterials: (materials: Material[]) => {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(materials));
  },

  getSettings: (): GlobalSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: GlobalSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getProjects: (): Project[] => {
    const data = localStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  saveProjects: (projects: Project[]) => {
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  }
};