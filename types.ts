export interface Printer {
  id: string;
  name: string;
  acquisitionCost: number; // R$
  lifespanHours: number; // Expectativa de vida em horas
  powerConsumption: number; // Watts
  maintenanceCostPerHour: number; // R$/h
}

export enum MaterialType {
  PLA = 'PLA',
  ABS = 'ABS',
  PETG = 'PETG',
  TPU = 'TPU',
  RESIN = 'Resina',
  OTHER = 'Outros'
}

export interface Material {
  id: string;
  type: MaterialType;
  name: string; // Marca/Nome
  color: string; // Cor do filamento
  spoolPrice: number; // R$
  spoolWeight: number; // gramas
  currentStock?: number; // gramas
}

export interface GlobalSettings {
  electricityCost: number; // R$/kWh
  currencySymbol: string;
}

export interface AdditionalItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CalculationResult {
  depreciationCost: number;
  energyCost: number;
  materialCost: number;
  additionalCost: number; // Cost of extra hardware/supplies
  maintenanceCost: number;
  laborCost: number;
  machineTotalCost: number; // Depreciação + Manutenção + Energia
  totalProductionCost: number;
  finalPrice: number;
  profit: number;
}

export interface Project {
  id: string;
  name: string;
  date: string;
  printerId: string;
  materialId: string;
  additionalItems?: AdditionalItem[]; // Optional for backward compatibility
  printTimeHours: number;
  printTimeMinutes: number;
  modelWeight: number; // gramas
  failureRate: number; // porcentagem (0-100)
  laborTimeHours: number;
  laborTimeMinutes: number;
  laborHourlyRate: number;
  markup: number; // porcentagem (0-100+)
  result: CalculationResult;
  folderId?: string | null;
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: string;
}

export type ViewState = 'dashboard' | 'assets' | 'calculator' | 'history' | 'comparator' | 'profile';