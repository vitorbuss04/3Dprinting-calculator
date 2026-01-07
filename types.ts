export interface Printer {
  id: string;
  name: string;
  acquisitionCost: number; // R$
  lifespanHours: number; // Life expectancy in hours
  powerConsumption: number; // Watts
  maintenanceCostPerHour: number; // R$/h
}

export enum MaterialType {
  PLA = 'PLA',
  ABS = 'ABS',
  PETG = 'PETG',
  TPU = 'TPU',
  RESIN = 'Resin',
  OTHER = 'Other'
}

export interface Material {
  id: string;
  type: MaterialType;
  name: string; // Brand/Color
  spoolPrice: number; // R$
  spoolWeight: number; // grams
  currentStock?: number; // grams
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
  machineTotalCost: number; // Depreciation + Maintenance + Energy
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
  modelWeight: number; // grams
  failureRate: number; // percentage (0-100)
  laborTimeHours: number;
  laborTimeMinutes: number;
  laborHourlyRate: number;
  markup: number; // percentage (0-100+)
  result: CalculationResult;
}

export type ViewState = 'dashboard' | 'assets' | 'calculator' | 'history' | 'comparator';