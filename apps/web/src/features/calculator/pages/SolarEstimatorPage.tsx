import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Zap,
  Home,
  IndianRupee,
  ShieldCheck,
  Award,
  TrendingUp,
  Leaf,
  Share2,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Sun,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  calculateSolarSizing,
  DEFAULT_SIZING_INPUTS,
  RoofType,
  SizingInputs,
} from '../utils/rooftop-sizer-calc';
import { RooftopVisualCanvas } from '../components/RooftopVisualCanvas';

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function SolarEstimatorPage() {
  const navigate = useNavigate();

  // State
  const [inputs, setInputs] = useState<SizingInputs>(DEFAULT_SIZING_INPUTS);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Quick preset handlers
  const billPresets = [
    { label: '₹2,500 (2BHK)', value: 2500 },
    { label: '₹4,500 (3BHK)', value: 4500 },
    { label: '₹8,000 (Villa/AC)', value: 8000 },
    { label: '₹16,000 (Commercial)', value: 16000 },
    { label: '₹28,000 (Industrial)', value: 28000 },
  ];

  const areaPresets = [
    { label: '350 sq ft (Compact)', value: 350 },
    { label: '600 sq ft (Standard)', value: 600 },
    { label: '1,200 sq ft (Large)', value: 1200 },
    { label: '2,500 sq ft (Shed/Villa)', value: 2500 },
  ];

  // Calculation results
  const result = useMemo(() => {
    return calculateSolarSizing(inputs);
  }, [inputs]);

  // Copy proposal text
  const handleCopySummary = () => {
    const text = `☀️ *KOLA SOLAR — SIZING & SUBSIDY ESTIMATE* ☀️
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Recommended Capacity:* ${result.recommendedCapacityKw} kWp (${result.recommendedPanelsCount} x ${inputs.moduleWattageWp}W Bifacial Panels)
⚡ *Monthly Generation:* ~${result.monthlyGenerationUnits} Units (kWh)
🏠 *Terrace Area:* ${inputs.rooftopAreaSqFt} sq ft (${inputs.roofType.replace('_', ' ').toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *FINANCIAL & SUBSIDY BREAKDOWN:*
• Gross Turnkey EPC Cost: ${formatInr(result.estimatedSystemCost)}
• PM Surya Ghar Subsidy (DBT): -${formatInr(result.centralSubsidyAmount)}
• *Net Customer Investment:* ${formatInr(result.netInvestmentCost)}
• 5-Year Green Loan EMI: ${formatInr(result.monthlyLoanEmi)}/month
• Monthly Electricity Bill Savings: ${formatInr(result.monthlyBillSavingsInr)}/month
👉 *Net Cash Profit in Your Pocket:* +${formatInr(result.monthlyNetProfit)}/month from Day 1!
• Return on Investment Payback: ~${result.simplePaybackYears} Years
• 25-Year Cumulative Savings: ${formatInr(result.lifetime25YrSavingsInr)}
🌱 *CO2 Offset:* ${result.annualCo2OffsetTonnes} Tonnes/year (≈ ${result.treesEquivalentCount} trees planted)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated via Kola Software Solar CRM`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello! Here is your custom Rooftop Solar Sizing & PM Surya Ghar Subsidy Feasibility:\n\n` +
      `⚡ *Recommended System:* ${result.recommendedCapacityKw} kWp (${result.recommendedPanelsCount} panels)\n` +
      `💰 *PM Surya Ghar DBT Subsidy:* ${formatInr(result.centralSubsidyAmount)}\n` +
      `💵 *Net Cost:* ${formatInr(result.netInvestmentCost)}\n` +
      `📈 *Monthly Net Benefit:* +${formatInr(result.monthlyNetProfit)}/month after loan EMI!\n` +
      `⏱️ *Payback:* ${result.simplePaybackYears} years\n\n` +
      `Let us know if you'd like an official engineered proposal!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCreateQuotation = () => {
    // Navigate to Quotations page with query parameters
    navigate(`/quotations?action=create&kwp=${result.recommendedCapacityKw}&roof=${inputs.roofType}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            Engineering Sizing & Feasibility Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Solar Rooftop & Bill Sizing Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Size optimal solar PV capacity (kWp) from monthly electricity bills vs. shadow-free terrace space, with PM Surya Ghar DBT subsidies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5"
          >
            {copiedSummary ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Copied Summary!</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Copy Summary</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:border-emerald-500"
          >
            <Share2 className="h-4 w-4" />
            <span>Share on WhatsApp</span>
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sizing Sheet</span>
          </Button>

          <Button
            size="sm"
            onClick={handleCreateQuotation}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>Create Quotation</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sizing Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                1. Electricity Consumption
              </CardTitle>
              <CardDescription>
                Determine required kWp based on DISCOM energy consumption.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monthly Bill Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Monthly Electricity Bill (₹)
                  </label>
                  <span className="text-sm font-bold text-primary font-mono">
                    {formatInr(inputs.monthlyElectricityBill)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={inputs.monthlyElectricityBill}
                  onChange={(e) =>
                    setInputs({ ...inputs, monthlyElectricityBill: Number(e.target.value) })
                  }
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {billPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setInputs({ ...inputs, monthlyElectricityBill: p.value })}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        inputs.monthlyElectricityBill === p.value
                          ? 'bg-primary/10 border-primary text-primary font-semibold'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tariff Rate Input */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block">
                    Average DISCOM Tariff (₹/unit)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Estimated ~{result.monthlyUnitsConsumed} kWh units/month
                  </span>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.5"
                    min="4"
                    max="15"
                    value={inputs.averageTariff}
                    onChange={(e) =>
                      setInputs({ ...inputs, averageTariff: Number(e.target.value) || 8.0 })
                    }
                    className="h-8 text-right font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terrace & Rooftop Space Parameters */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4 text-emerald-500" />
                2. Rooftop Space & Physical Feasibility
              </CardTitle>
              <CardDescription>
                Analyze available shadow-free area and mounting structure usability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rooftop Area Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Total Terrace Area (Sq Ft)
                  </label>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {inputs.rooftopAreaSqFt.toLocaleString()} sq ft
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="5000"
                  step="50"
                  value={inputs.rooftopAreaSqFt}
                  onChange={(e) =>
                    setInputs({ ...inputs, rooftopAreaSqFt: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 h-2 bg-muted rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {areaPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setInputs({ ...inputs, rooftopAreaSqFt: p.value })}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        inputs.rooftopAreaSqFt === p.value
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roof Type Selector */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-semibold text-foreground block">
                  Roof Surface Type & Usable Factor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInputs({ ...inputs, roofType: 'flat_rcc' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      inputs.roofType === 'flat_rcc'
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">Flat RCC</div>
                    <div className="text-[10px] text-muted-foreground">70% Usable Space</div>
                    <div className="text-[9px] text-primary mt-1 font-mono">Terrace Mount</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputs({ ...inputs, roofType: 'metal_shed' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      inputs.roofType === 'metal_shed'
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">Metal Shed</div>
                    <div className="text-[10px] text-muted-foreground">85% Usable Space</div>
                    <div className="text-[9px] text-primary mt-1 font-mono">Flush Clamped</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputs({ ...inputs, roofType: 'tiled_sloped' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      inputs.roofType === 'tiled_sloped'
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">Tiled Slope</div>
                    <div className="text-[10px] text-muted-foreground">65% Usable Space</div>
                    <div className="text-[9px] text-primary mt-1 font-mono">Custom Rafter</div>
                  </button>
                </div>
              </div>

              {/* Module Wattage Selector */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-foreground block">
                    PV Module Rating
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Tier-1 Bifacial Dual-Glass PV
                  </span>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setInputs({ ...inputs, moduleWattageWp: 550 })}
                    className={`px-2 py-0.5 rounded font-medium ${
                      inputs.moduleWattageWp === 550
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground'
                    }`}
                  >
                    550 Wp
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs({ ...inputs, moduleWattageWp: 590 })}
                    className={`px-2 py-0.5 rounded font-medium ${
                      inputs.moduleWattageWp === 590
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground'
                    }`}
                  >
                    590 Wp (TopCon)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sizing Results, Comparison & Financials (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Recommended Sizing Verdict Hero Card */}
          <div className="bg-gradient-to-br from-primary/10 via-card to-background border-2 border-primary/30 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Engineered Recommendation
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight font-mono">
                    {result.recommendedCapacityKw} kWp
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    ({result.recommendedPanelsCount} Panels)
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-muted-foreground">Electricity Bill Offset</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {result.billOffsetPercent}%
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                    Net-Zero
                  </span>
                </div>
              </div>
            </div>

            {/* Constraint / Limitation Badge */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                result.limitationType === 'space_limited'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {result.limitationType === 'space_limited' ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              )}
              <div>
                <div className="font-semibold">
                  {result.limitationType === 'space_limited'
                    ? 'Rooftop Constrained Sizing'
                    : result.limitationType === 'consumption_limited'
                    ? 'Consumption-Optimized Sizing'
                    : 'Balanced 1:1 Match'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">{result.limitationMessage}</div>
              </div>
            </div>

            {/* Quick 3-Pillar Sizing Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-2.5 rounded-lg bg-card/80 border border-border">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Demand Needed
                </div>
                <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                  {result.capacityNeededFor100PercentKw} kWp
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  ~{result.monthlyUnitsConsumed} kWh/mo
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-card/80 border border-border">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Max Roof Space
                </div>
                <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                  {result.maxFeasibleCapacityKw} kWp
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Fits {result.maxFeasiblePanelsCount} panels
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-[10px] uppercase font-bold text-primary">
                  Monthly Generation
                </div>
                <div className="text-sm font-bold text-primary font-mono mt-0.5">
                  ~{result.monthlyGenerationUnits} Units
                </div>
                <div className="text-[10px] text-primary/80 mt-0.5">
                  {result.annualGenerationUnits.toLocaleString()} kWh/yr
                </div>
              </div>
            </div>
          </div>

          {/* PM Surya Ghar DBT Subsidy & Cash Flow Card */}
          <Card className="border-border shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    PM Surya Ghar: Muft Bijli Yojana Central Subsidy
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Direct Benefit Transfer (DBT) deposited directly into customer bank account
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-semibold text-emerald-200">DBT Subsidy</span>
                <div className="text-lg font-extrabold text-amber-300 font-mono">
                  {formatInr(result.centralSubsidyAmount)}
                </div>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Cost waterfall */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="text-[11px] text-muted-foreground font-medium">Turnkey EPC Cost</div>
                  <div className="text-base font-bold text-foreground font-mono mt-0.5">
                    {formatInr(result.estimatedSystemCost)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Includes 13.8% GST & BOS</div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    Govt. Subsidy (DBT)
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    - {formatInr(result.centralSubsidyAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                    National Portal DBT
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="text-[11px] text-primary font-semibold">Net Customer Cost</div>
                  <div className="text-base font-extrabold text-primary font-mono mt-0.5">
                    {formatInr(result.netInvestmentCost)}
                  </div>
                  <div className="text-[10px] text-primary/80">Out of Pocket</div>
                </div>
              </div>

              {/* Positive Cash Flow Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-card to-muted/60 border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Positive Monthly Cash Flow (Day 1 Profitability)
                  </span>
                  <span className="text-muted-foreground font-mono">5-Yr Loan @ 7% Concessional</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Monthly Bill Saved</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatInr(result.monthlyBillSavingsInr)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">5-Yr Loan EMI</span>
                    <span className="text-sm font-bold text-rose-500 font-mono">
                      -{formatInr(result.monthlyLoanEmi)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-primary block">Net Cash in Pocket</span>
                    <span className="text-sm font-extrabold text-primary font-mono">
                      +{formatInr(result.monthlyNetProfit)}/mo
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-center text-muted-foreground bg-background/80 py-1.5 px-3 rounded-md border border-border">
                  Customer generates <strong className="text-foreground">+{formatInr(result.monthlyNetProfit)} extra savings</strong> every month while the system pays for itself in <strong className="text-foreground">~{result.simplePaybackYears} years</strong>.
                </div>
              </div>

              {/* 25-Year Cumulative Returns & Eco Impact */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <IndianRupee className="h-3.5 w-3.5 text-primary" />
                    25-Year Net Savings
                  </div>
                  <div className="text-lg font-extrabold text-foreground font-mono mt-1">
                    {formatInr(result.lifetime25YrSavingsInr)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    ~{result.lifetime25YrGenerationUnits.toLocaleString()} kWh lifetime yield
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                    Clean Energy Impact
                  </div>
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    {result.annualCo2OffsetTonnes} T / yr
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Equivalent to planting {result.treesEquivalentCount} mature trees
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Width Visual Rooftop Layout Simulation Canvas */}
      <RooftopVisualCanvas
        rooftopAreaSqFt={inputs.rooftopAreaSqFt}
        usableAreaSqFt={result.usableAreaSqFt}
        roofType={inputs.roofType}
        recommendedPanelsCount={result.recommendedPanelsCount}
        maxFeasiblePanelsCount={result.maxFeasiblePanelsCount}
        moduleWattageWp={inputs.moduleWattageWp}
        recommendedCapacityKw={result.recommendedCapacityKw}
      />

      {/* Bottom CTA Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Ready to convert this sizing into an official quotation?
          </h4>
          <p className="text-xs text-muted-foreground">
            Instantly auto-populate a tailored proposal with {result.recommendedCapacityKw} kWp system specifications and PM Surya Ghar subsidy applied.
          </p>
        </div>

        <Button
          onClick={handleCreateQuotation}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shrink-0"
        >
          <span>Generate Proposal Now</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
