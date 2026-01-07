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
  name: string; // Marca/Cor
  spoolPrice: number; // R$
  spoolWeight: number; // gramas
  currentStock?: number; // gramas
}

export interface GlobalSettings {
  electricityCost: number; // R$/kWh
  currencySymbol: string;
}

export interface CalculationResult {
  depreciationCost: number;
  energyCost: number;
  materialCost: number;
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
  printTimeHours: number;
  printTimeMinutes: number;
  modelWeight: number; // gramas
  failureRate: number; // porcentagem (0-100)
  laborTimeHours: number;
  laborTimeMinutes: number;
  laborHourlyRate: number;
  markup: number; // porcentagem (0-100+)
  result: CalculationResult;
}

export type ViewState = 'dashboard' | 'assets' | 'calculator' | 'history' | 'comparator';