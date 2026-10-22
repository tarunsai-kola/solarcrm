import {
  Banknote,
  Building,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Info,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import {
  type SubsidyFinancingConfig,
  type SubsidyFinancingResult,
  formatCurrencyInr,
} from '../utils/solar-subsidy-calc';

interface SubsidyFinancingCardProps {
  result: SubsidyFinancingResult;
  config: SubsidyFinancingConfig;
  onChangeConfig?: (updates: Partial<SubsidyFinancingConfig>) => void;
  isReadOnly?: boolean;
}

export function SubsidyFinancingCard({
  result,
  config,
  onChangeConfig,
  isReadOnly = false,
}: SubsidyFinancingCardProps) {
  const isEligible = config.enableSubsidy && config.isResidential;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-950 p-5 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Government Subsidy & Clean Energy Loan Feasibility
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PM Surya Ghar Certified
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Official Ministry of New & Renewable Energy (MNRE) incentive calculations and clean energy financing.
            </p>
          </div>
        </div>

        {!isReadOnly && onChangeConfig && (
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={config.isResidential}
                onChange={(e) => onChangeConfig({ isResidential: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Residential Rooftop</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={config.enableLoan}
                onChange={(e) => onChangeConfig({ enableLoan: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Include Loan Model</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Grid: Subsidy vs Net Cost vs Energy Savings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1: Government Subsidy Breakdown */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Central Government Subsidy
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              {formatCurrencyInr(result.centralSubsidy)}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {isEligible
              ? result.centralSubsidy >= 78000
                ? 'Qualifies for maximum ₹78,000 national PM Surya Ghar subsidy.'
                : `Qualifies for ${formatCurrencyInr(result.centralSubsidy)} central subsidy.`
              : 'Commercial / Industrial systems: Eligible for 40% Accelerated Depreciation.'}
          </p>

          {/* State Subsidy input / display */}
          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-300">
            <span>State / DISCOM Subsidy:</span>
            {!isReadOnly && onChangeConfig ? (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={config.stateSubsidyAmount || 0}
                  onChange={(e) => onChangeConfig({ stateSubsidyAmount: Math.max(0, Number(e.target.value)) })}
                  className="w-20 rounded bg-slate-950 border border-slate-700 px-1.5 py-0.5 text-right font-mono text-xs text-white"
                />
              </div>
            ) : (
              <span className="font-mono">{formatCurrencyInr(result.stateSubsidy)}</span>
            )}
          </div>

          <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-400 border-t border-emerald-500/30">
            <span>Total Direct Subsidy:</span>
            <span className="font-mono text-sm">{formatCurrencyInr(result.totalSubsidy)}</span>
          </div>
        </div>

        {/* Box 2: Net Effective Customer Payable */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-1">
              Effective Net Investment
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {formatCurrencyInr(result.netCustomerPayable)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              After deducting {formatCurrencyInr(result.totalSubsidy)} Government Subsidy from Gross Total of {formatCurrencyInr(result.grossAmount)}.
            </p>
          </div>

          <div className="pt-3 border-t border-amber-500/20 text-xs flex items-center justify-between text-amber-300 font-semibold">
            <span>Estimated Simple Payback:</span>
            <span className="font-bold font-mono">{result.simplePaybackYears} Years</span>
          </div>
        </div>

        {/* Box 3: Solar Generation & Monthly Electricity Savings */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Monthly Solar Generation
            </span>
            <span className="font-mono text-blue-300 font-bold">
              ~{result.monthlyUnitsGenerated} Units (kWh)
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Bill Savings:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                +{formatCurrencyInr(result.monthlyElectricitySavings)}/mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Bill Savings:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {formatCurrencyInr(result.annualElectricitySavings)}/yr
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-blue-500/20 text-blue-300 font-bold">
              <span>25-Year Net Savings:</span>
              <span className="font-mono">{formatCurrencyInr(result.lifetime25YrSavings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Energy Loan & EMI Model Section (if enabled) */}
      {config.enableLoan && (
        <div className="rounded-xl border border-border bg-slate-950/60 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Clean Energy Low-Interest Solar Loan Financing (SBI / Tata Capital / Nationalized Banks)
              </span>
            </div>

            {!isReadOnly && onChangeConfig && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Interest:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="18"
                    value={config.loanInterestRatePercent}
                    onChange={(e) => onChangeConfig({ loanInterestRatePercent: Number(e.target.value) })}
                    className="w-14 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-right font-mono text-xs text-white"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Tenor:</span>
                  <select
                    value={config.loanTenorYears}
                    onChange={(e) => onChangeConfig({ loanTenorYears: Number(e.target.value) })}
                    className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-xs text-white"
                  >
                    <option value={3}>3 Years</option>
                    <option value={5}>5 Years</option>
                    <option value={7}>7 Years</option>
                    <option value={10}>10 Years</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-border">
              <span className="text-[10px] text-muted-foreground block">Down Payment ({config.loanDownPaymentPercent}%):</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {formatCurrencyInr(result.downPaymentAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-border">
              <span className="text-[10px] text-muted-foreground block">Loan Principal:</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {formatCurrencyInr(result.loanPrincipal)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-semibold block">Monthly Solar Loan EMI:</span>
              <span className="font-mono font-extrabold text-amber-300 text-sm">
                {formatCurrencyInr(result.monthlyEmi)} / mo
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 font-semibold block">Net Cash Flow (Bill Savings - EMI):</span>
              <span className="font-mono font-extrabold text-emerald-300 text-sm flex items-center gap-1">
                {result.monthlyNetCashflow >= 0 ? '+' : ''}
                {formatCurrencyInr(result.monthlyNetCashflow)} / mo
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            💡 <strong>Zero Cost Solar Principle:</strong> Your monthly solar generation savings of{' '}
            <span className="text-emerald-400 font-semibold">{formatCurrencyInr(result.monthlyElectricitySavings)}</span>{' '}
            exceeds the loan EMI of{' '}
            <span className="text-amber-300 font-semibold">{formatCurrencyInr(result.monthlyEmi)}</span>, giving you a{' '}
            <span className="text-emerald-300 font-bold">positive monthly cashflow of +{formatCurrencyInr(result.monthlyNetCashflow)}</span> from month one!
          </p>
        </div>
      )}
    </div>
  );
}
