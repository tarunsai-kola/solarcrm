/**
 * PM Surya Ghar (Muft Bijli Yojana) & Clean Energy Solar Loan Calculator
 * Authority: Ministry of New and Renewable Energy (MNRE), Govt of India
 */

export interface SubsidyFinancingConfig {
  enableSubsidy: boolean;
  isResidential: boolean;
  stateSubsidyAmount: number;
  customSubsidyAmount?: number;
  enableLoan: boolean;
  loanDownPaymentPercent: number;
  loanInterestRatePercent: number; // e.g. 7.0% p.a.
  loanTenorYears: number; // e.g. 3, 5, 7, 10
  electricityTariffPerUnit: number; // e.g. ₹8.00 / kWh
  unitsPerKwPerMonth: number; // e.g. 120 units / kW / month
}

export const DEFAULT_SUBSIDY_FINANCING_CONFIG: SubsidyFinancingConfig = {
  enableSubsidy: true,
  isResidential: true,
  stateSubsidyAmount: 0,
  enableLoan: true,
  loanDownPaymentPercent: 15,
  loanInterestRatePercent: 7.0, // Clean energy subsidized loan rate (SBI Surya Ghar / Canara / Tata Capital)
  loanTenorYears: 5,
  electricityTariffPerUnit: 8.0,
  unitsPerKwPerMonth: 120, // 4 units/day * 30 days
};

export interface SubsidyFinancingResult {
  // Subsidy calculations
  centralSubsidy: number; // PM Surya Ghar
  stateSubsidy: number;
  totalSubsidy: number;
  grossAmount: number;
  netCustomerPayable: number;

  // Energy & bill savings
  monthlyUnitsGenerated: number;
  monthlyElectricitySavings: number;
  annualElectricitySavings: number;
  lifetime25YrSavings: number;

  // Loan & EMI calculations
  loanPrincipal: number;
  downPaymentAmount: number;
  monthlyEmi: number;
  totalLoanRepayment: number;
  totalInterestPaid: number;

  // Cashflow & Payback
  monthlyNetCashflow: number; // Savings minus EMI
  simplePaybackYears: number; // Net investment / annual savings
  roi25YrPercent: number;
}

/**
 * Computes official PM Surya Ghar: Muft Bijli Yojana central subsidy
 * - 1 kW: ₹30,000
 * - 2 kW: ₹60,000 (₹30,000 per kW)
 * - 3 kW and above: ₹78,000 maximum central cap for residential systems
 * - Non-residential: ₹0 direct subsidy (eligible for 40% Accelerated Depreciation)
 */
export function calculateSuryaGharSubsidy(capacityKw: number, isResidential: boolean = true): number {
  if (!isResidential || capacityKw <= 0) return 0;

  if (capacityKw < 1.5) {
    return 30000;
  } else if (capacityKw < 2.5) {
    return 60000;
  } else {
    // 3 kW or greater
    return 78000;
  }
}

/**
 * Standard Monthly EMI Calculation using reducing balance formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateMonthlyEmi(
  principal: number,
  annualInterestRatePercent: number,
  tenorYears: number,
): number {
  if (principal <= 0 || tenorYears <= 0) return 0;
  if (annualInterestRatePercent <= 0) return Math.round(principal / (tenorYears * 12));

  const monthlyRate = annualInterestRatePercent / (12 * 100);
  const totalMonths = tenorYears * 12;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return Math.round(emi);
}

/**
 * Master calculation of solar subsidy and clean energy loan financing
 */
export function calculateSubsidyAndFinancing(
  grossTotalAmount: number,
  systemCapacityKw: number,
  config: Partial<SubsidyFinancingConfig> = {},
): SubsidyFinancingResult {
  const cfg: SubsidyFinancingConfig = { ...DEFAULT_SUBSIDY_FINANCING_CONFIG, ...config };

  // 1. Central Subsidy
  let centralSubsidy = 0;
  if (cfg.enableSubsidy) {
    centralSubsidy =
      typeof cfg.customSubsidyAmount === 'number' && cfg.customSubsidyAmount >= 0
        ? cfg.customSubsidyAmount
        : calculateSuryaGharSubsidy(systemCapacityKw, cfg.isResidential);
  }

  // 2. State Subsidy
  const stateSubsidy = cfg.enableSubsidy ? Math.max(0, cfg.stateSubsidyAmount || 0) : 0;
  const totalSubsidy = Math.min(grossTotalAmount, centralSubsidy + stateSubsidy);

  // 3. Net Customer Investment
  const netCustomerPayable = Math.max(0, Math.round(grossTotalAmount - totalSubsidy));

  // 4. Energy Generation & Electricity Bill Savings
  const monthlyUnitsGenerated = Math.round(systemCapacityKw * cfg.unitsPerKwPerMonth);
  const monthlyElectricitySavings = Math.round(monthlyUnitsGenerated * cfg.electricityTariffPerUnit);
  const annualElectricitySavings = monthlyElectricitySavings * 12;
  const lifetime25YrSavings = Math.round(annualElectricitySavings * 25 - netCustomerPayable);

  // 5. Loan & EMI calculations
  let downPaymentAmount = 0;
  let loanPrincipal = 0;
  let monthlyEmi = 0;
  let totalLoanRepayment = 0;
  let totalInterestPaid = 0;

  if (cfg.enableLoan && netCustomerPayable > 0) {
    const downPct = Math.min(100, Math.max(0, cfg.loanDownPaymentPercent)) / 100;
    downPaymentAmount = Math.round(netCustomerPayable * downPct);
    loanPrincipal = netCustomerPayable - downPaymentAmount;

    monthlyEmi = calculateMonthlyEmi(
      loanPrincipal,
      cfg.loanInterestRatePercent,
      cfg.loanTenorYears,
    );

    totalLoanRepayment = monthlyEmi * cfg.loanTenorYears * 12;
    totalInterestPaid = Math.max(0, totalLoanRepayment - loanPrincipal);
  }

  // 6. Cash Flow & Payback
  const monthlyNetCashflow = cfg.enableLoan ? monthlyElectricitySavings - monthlyEmi : monthlyElectricitySavings;
  const simplePaybackYears =
    annualElectricitySavings > 0
      ? Math.round((netCustomerPayable / annualElectricitySavings) * 10) / 10
      : 0;

  const roi25YrPercent =
    netCustomerPayable > 0
      ? Math.round(((annualElectricitySavings * 25) / netCustomerPayable) * 100)
      : 0;

  return {
    centralSubsidy,
    stateSubsidy,
    totalSubsidy,
    grossAmount: grossTotalAmount,
    netCustomerPayable,
    monthlyUnitsGenerated,
    monthlyElectricitySavings,
    annualElectricitySavings,
    lifetime25YrSavings,
    loanPrincipal,
    downPaymentAmount,
    monthlyEmi,
    totalLoanRepayment,
    totalInterestPaid,
    monthlyNetCashflow,
    simplePaybackYears,
    roi25YrPercent,
  };
}

/**
 * Format helpers for currency in Indian Rupees
 */
export function formatCurrencyInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
