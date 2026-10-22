import { Calculator, CheckCircle, DollarSign, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { useState } from 'react';

import { Card } from '@/components/ui/card';

export function KolaInteractiveCalculator() {
  const [leadsPerMonth, setLeadsPerMonth] = useState<number>(80);
  const [avgSystemKw, setAvgSystemKw] = useState<number>(15);
  const [teamSize, setTeamSize] = useState<number>(6);

  // Calculations:
  // Typical solar conversion without VCRM: 12%
  // With Kola Solar VCRM automation: 28% (+16% lift)
  const additionalDeals = Math.round(leadsPerMonth * 0.16);
  // Hours saved per proposal: 2.5 hours per proposal
  const hoursSavedPerMonth = Math.round(leadsPerMonth * 2.2);
  // Additional revenue generated (estimated ₹1,20,000 per 10kW margin)
  const estimatedRevenueBoostInLakhs = Math.round(((additionalDeals * avgSystemKw * 14000) / 100000) * 10) / 10;

  return (
    <section id="roi-calculator" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/60 border-t border-border/40 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Business Impact Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Calculate Your ROI with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Kola Solar VCRM</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            See how automating solar surveys, proposal generation, and field agent dispatch impacts your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Sliders Input Panel */}
          <Card className="lg:col-span-6 p-6 sm:p-8 bg-slate-950/80 border-slate-800 rounded-2xl shadow-xl">
            <div className="space-y-6">
              {/* Slider 1: Monthly Leads */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Monthly Solar Inquiries / Leads
                  </label>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {leadsPerMonth} leads
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={leadsPerMonth}
                  onChange={(e) => setLeadsPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>20 leads</span>
                  <span>250 leads</span>
                  <span>500+ leads</span>
                </div>
              </div>

              {/* Slider 2: Average System Size */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Average System Capacity (kW)
                  </label>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {avgSystemKw} kW
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="100"
                  step="1"
                  value={avgSystemKw}
                  onChange={(e) => setAvgSystemKw(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>3 kW (Res)</span>
                  <span>50 kW (Commercial)</span>
                  <span>100 kW (Industrial)</span>
                </div>
              </div>

              {/* Slider 3: Sales Reps & Field Technicians */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Sales Representatives & Field Agents
                  </label>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {teamSize} members
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>1 user</span>
                  <span>15 users</span>
                  <span>30+ users</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Visual Output */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border-amber-500/30 rounded-2xl relative overflow-hidden sm:col-span-2">
              <div className="absolute right-4 top-4 text-amber-400/20">
                <Sparkles className="w-16 h-16" />
              </div>
              <p className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">
                Estimated Monthly Revenue Growth
              </p>
              <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-1">
                <span>₹{estimatedRevenueBoostInLakhs.toLocaleString()} Lakhs+</span>
                <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Based on closing ~{additionalDeals} additional deals each month through instantaneous solar quotation turnaround and zero lost leads.
              </p>
            </Card>

            <Card className="p-5 bg-slate-950/80 border-slate-800 rounded-xl">
              <p className="text-xs font-semibold text-slate-400 mb-1">Team Hours Saved</p>
              <div className="text-2xl font-bold text-emerald-400">{hoursSavedPerMonth} hrs/mo</div>
              <p className="text-[11px] text-slate-400 mt-1">Eliminates manual CAD drafting and quote rework.</p>
            </Card>

            <Card className="p-5 bg-slate-950/80 border-slate-800 rounded-xl">
              <p className="text-xs font-semibold text-slate-400 mb-1">Lead Conversion Lift</p>
              <div className="text-2xl font-bold text-amber-400">+133% Velocity</div>
              <p className="text-[11px] text-slate-400 mt-1">From initial site survey to signed installation contract.</p>
            </Card>

            <div className="sm:col-span-2 text-center pt-2">
              <a href="#demo-form" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                <span>Claim your personalized ROI assessment in the demo below</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
