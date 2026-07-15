import { Printer, Material, GlobalSettings, AdditionalItem, CalculationResult } from '../types';

export interface CalculationInputs {
  printer: Printer;
  material: Material;
  settings: GlobalSettings;
  printHours: number | string;
  printMinutes: number | string;
  weight: number | string;
  failureRate: number | string;
  laborHours: number | string;
  laborMinutes: number | string;
  laborRate: number | string;
  markup: number;
  additionalItems: AdditionalItem[];
}

const parseNumber = (val: any): number => {
  if (typeof val === 'string') {
    return parseFloat(val.replace(',', '.')) || 0;
  }
  return Number(val) || 0;
};

export function calculateProjectCost(inputs: CalculationInputs): CalculationResult {
  const { printer, material, settings, additionalItems } = inputs;

  const numPrintHours = parseNumber(inputs.printHours);
  const numPrintMinutes = parseNumber(inputs.printMinutes);
  const numWeight = parseNumber(inputs.weight);
  const numFailureRate = parseNumber(inputs.failureRate);
  const numLaborHours = parseNumber(inputs.laborHours);
  const numLaborMinutes = parseNumber(inputs.laborMinutes);
  const numLaborRate = parseNumber(inputs.laborRate);

  const totalPrintTimeHours = numPrintHours + (numPrintMinutes / 60);
  const totalLaborTimeHours = numLaborHours + (numLaborMinutes / 60);

  const printerAcquisitionCost = Number(printer.acquisitionCost) || 0;
  const printerLifespanHours = Number(printer.lifespanHours) || 0;
  const printerPowerConsumption = Number(printer.powerConsumption) || 0;
  const printerMaintenanceCostPerHour = Number(printer.maintenanceCostPerHour) || 0;

  const materialSpoolPrice = Number(material.spoolPrice) || 0;
  const materialSpoolWeight = Number(material.spoolWeight) || 0;

  const depreciationPerHour = printerLifespanHours > 0 ? (printerAcquisitionCost / printerLifespanHours) : 0;
  const depreciationCost = depreciationPerHour * totalPrintTimeHours;

  const energyCost = (printerPowerConsumption / 1000) * settings.electricityCost * totalPrintTimeHours;

  const costPerGram = materialSpoolWeight > 0 ? (materialSpoolPrice / materialSpoolWeight) : 0;
  const materialCostBase = numWeight * costPerGram;
  const materialCost = materialCostBase * (1 + (numFailureRate / 100));

  const maintenanceCost = printerMaintenanceCostPerHour * totalPrintTimeHours;
  const laborCost = totalLaborTimeHours * numLaborRate;

  const additionalCost = additionalItems.reduce((acc, item) => {
    const p = parseNumber(item.price);
    const q = parseNumber(item.quantity);
    return acc + (p * q);
  }, 0);

  const machineTotalCost = depreciationCost + maintenanceCost + energyCost;
  const totalProductionCost = machineTotalCost + materialCost + laborCost + additionalCost;

  const finalPrice = totalProductionCost * (1 + (inputs.markup / 100));
  const profit = finalPrice - totalProductionCost;

  return { 
    depreciationCost, 
    energyCost, 
    materialCost, 
    additionalCost, 
    maintenanceCost, 
    laborCost, 
    machineTotalCost, 
    totalProductionCost, 
    finalPrice, 
    profit 
  };
}
