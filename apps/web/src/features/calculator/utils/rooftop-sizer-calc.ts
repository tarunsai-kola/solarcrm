export type RoofType = 'flat_rcc' | 'metal_shed' | 'tiled_sloped';

export interface SizingInputs {
  monthlyElectricityBill: number; // in INR
  averageTariff: number; // in INR / kWh (default 8.0)
  rooftopAreaSqFt: number; // total terrace area
  roofType: RoofType;
  moduleWattageWp: number; // default 550 Wp
}

export interface SizingResult {
  // Consumption analysis
  monthlyUnitsConsumed: number;
  annualUnitsConsumed: number;
  capacityNeededFor100PercentKw: number;

  // Rooftop space analysis
  usableAreaSqFt: number;
  usableAreaPercent: number;
  maxFeasibleCapacityKw: number;
  maxFeasiblePanelsCount: number;

  // Final Recommendation
  recommendedCapacityKw: number;
  recommendedPanelsCount: number;
  billOffsetPercent: number;
  limitationType: 'balanced' | 'space_limited' | 'consumption_limited';
  limitationMessage: string;

  // Energy generation
  monthlyGenerationUnits: number;
  annualGenerationUnits: number;
  lifetime25YrGenerationUnits: number;

  // Financials
  estimatedSystemCost: number;
  centralSubsidyAmount: number;
  netInvestmentCost: number;
  monthlyBillSavingsInr: number;
  annualBillSavingsInr: number;
  lifetime25YrSavingsInr: number;
  simplePaybackYears: number;

  // Financing
  monthlyLoanEmi: number; // 5-year clean energy loan at 7% p.a.
  monthlyNetProfit: number; // Monthly bill savings minus EMI

  // Environmental
  annualCo2OffsetTonnes: number;
  treesEquivalentCount: number;
}

export const DEFAULT_SIZING_INPUTS: SizingInputs = {
  monthlyElectricityBill: 4500,
  averageTariff: 8.0,
  rooftopAreaSqFt: 600,
  roofType: 'flat_rcc',
  moduleWattageWp: 550,
};

export function calculateSolarSizing(inputs: SizingInputs): SizingResult {
  const {
    monthlyElectricityBill,
    averageTariff,
    rooftopAreaSqFt,
    roofType,
    moduleWattageWp,
  } = inputs;

  // 1. Consumption based
  const monthlyUnitsConsumed = Math.max(1, Math.round(monthlyElectricityBill / (averageTariff || 8.0)));
  const annualUnitsConsumed = monthlyUnitsConsumed * 12;

  // Standard rule: 1 kWp produces ~120 units per month in India
  const capacityNeededFor100PercentKw = Math.round((monthlyUnitsConsumed / 120) * 10) / 10;

  // 2. Rooftop space based
  let usableAreaPercent = 0.7; // default flat RCC
  if (roofType === 'metal_shed') usableAreaPercent = 0.85;
  if (roofType === 'tiled_sloped') usableAreaPercent = 0.65;

  const usableAreaSqFt = Math.round(rooftopAreaSqFt * usableAreaPercent);

  // Each 550W module is ~2.28m x 1.13m = ~27.7 sq ft + inter-row tilt shadow clearance = ~32 sq ft per module
  const sqFtPerModule = 32;
  const maxFeasiblePanelsCount = Math.max(1, Math.floor(usableAreaSqFt / sqFtPerModule));
  const maxFeasibleCapacityKw = Math.round(((maxFeasiblePanelsCount * moduleWattageWp) / 1000) * 10) / 10;

  // 3. Recommended Capacity
  let recommendedCapacityKw = Math.min(capacityNeededFor100PercentKw, maxFeasibleCapacityKw);
  // Round to nearest 0.5 kW
  recommendedCapacityKw = Math.max(1, Math.round(recommendedCapacityKw * 2) / 2);

  const recommendedPanelsCount = Math.ceil((recommendedCapacityKw * 1000) / moduleWattageWp);
  const billOffsetPercent = Math.min(100, Math.round((recommendedCapacityKw / capacityNeededFor100PercentKw) * 100));

  let limitationType: 'balanced' | 'space_limited' | 'consumption_limited' = 'balanced';
  let limitationMessage = 'Ideal Match: Your available shadow-free rooftop space comfortably accommodates 100% of your electricity consumption.';

  if (maxFeasibleCapacityKw < capacityNeededFor100PercentKw) {
    limitationType = 'space_limited';
    limitationMessage = `Rooftop Constrained: Your available shadow-free terrace space accommodates up to ${maxFeasibleCapacityKw} kWp, covering ${billOffsetPercent}% of your electricity bill.`;
  } else if (maxFeasibleCapacityKw > capacityNeededFor100PercentKw + 2) {
    limitationType = 'consumption_limited';
    limitationMessage = `High Roof Potential: You have ample roof space to install up to ${maxFeasibleCapacityKw} kWp. Sized at ${recommendedCapacityKw} kWp to match 100% of your current bill.`;
  }

  // 4. Energy generation
  const monthlyGenerationUnits = Math.round(recommendedCapacityKw * 120);
  const annualGenerationUnits = monthlyGenerationUnits * 12;
  const lifetime25YrGenerationUnits = annualGenerationUnits * 25 * 0.92; // 0.8% degradation/year

  // 5. Financials
  // Realistic Indian Tier-1 EPC Turnkey pricing: ~₹48,000 - ₹50,000 / kWp
  const estimatedSystemCost = Math.round(recommendedCapacityKw * 48500 * 1.138); // including GST

  // PM Surya Ghar national subsidy tiers
  let centralSubsidyAmount = 0;
  if (recommendedCapacityKw >= 3) {
    centralSubsidyAmount = 78000;
  } else if (recommendedCapacityKw >= 2) {
    centralSubsidyAmount = 60000;
  } else if (recommendedCapacityKw >= 1) {
    centralSubsidyAmount = 30000;
  }

  const netInvestmentCost = Math.max(0, estimatedSystemCost - centralSubsidyAmount);

  const monthlyBillSavingsInr = Math.round(monthlyGenerationUnits * averageTariff);
  const annualBillSavingsInr = monthlyBillSavingsInr * 12;
  const lifetime25YrSavingsInr = Math.round(annualBillSavingsInr * 25 * 0.95);
  const simplePaybackYears = netInvestmentCost > 0 ? Math.round((netInvestmentCost / annualBillSavingsInr) * 10) / 10 : 0;

  // 6. Clean Energy Loan EMI (7% p.a., 5 years, 85% financing)
  const principal = netInvestmentCost * 0.85;
  const monthlyRate = 7.0 / 12 / 100;
  const nMonths = 60;
  const emiFactor = (monthlyRate * Math.pow(1 + monthlyRate, nMonths)) / (Math.pow(1 + monthlyRate, nMonths) - 1);
  const monthlyLoanEmi = Math.round(principal * emiFactor);
  const monthlyNetProfit = monthlyBillSavingsInr - monthlyLoanEmi;

  // 7. Environmental Impact (0.82 kg CO2 / kWh grid factor in India)
  const annualCo2OffsetTonnes = Math.round(((annualGenerationUnits * 0.82) / 1000) * 10) / 10;
  const treesEquivalentCount = Math.round(annualCo2OffsetTonnes * 45);

  return {
    monthlyUnitsConsumed,
    annualUnitsConsumed,
    capacityNeededFor100PercentKw,
    usableAreaSqFt,
    usableAreaPercent: Math.round(usableAreaPercent * 100),
    maxFeasibleCapacityKw,
    maxFeasiblePanelsCount,
    recommendedCapacityKw,
    recommendedPanelsCount,
    billOffsetPercent,
    limitationType,
    limitationMessage,
    monthlyGenerationUnits,
    annualGenerationUnits,
    lifetime25YrGenerationUnits: Math.round(lifetime25YrGenerationUnits),
    estimatedSystemCost,
    centralSubsidyAmount,
    netInvestmentCost,
    monthlyBillSavingsInr,
    annualBillSavingsInr,
    lifetime25YrSavingsInr,
    simplePaybackYears,
    monthlyLoanEmi,
    monthlyNetProfit,
    annualCo2OffsetTonnes,
    treesEquivalentCount,
  };
}
