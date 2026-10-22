import {
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  Layers,
  MapPin,
  MessageSquare,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

const BENEFITS = [
  {
    icon: Flame,
    tag: 'Lead Intelligence',
    title: 'Smart Lead Capture & AI Qualification',
    description:
      'Consolidate leads from Facebook Ads, Google Ads, website inquiry forms, and WhatsApp into one unified pipeline. Automatically detect duplicates and tag lead temperatures (Hot, Warm, Cold).',
    bullets: ['Instant auto-ingestion from web forms', 'Zero-leakage lead deduplication', 'Automated sales territory routing'],
    gradient: 'from-amber-500/20 to-orange-500/5',
    iconColor: 'text-amber-400',
  },
  {
    icon: Compass,
    tag: 'Virtual Survey Hub',
    title: '3D Rooftop & Satellite Shading Survey',
    description:
      'Perform virtual solar site assessments in minutes. Calculate roof pitch, azimuth, obstacle shading, and available shadow-free area using satellite imagery and field drone captures.',
    bullets: ['Satellite roof perimeter tracing', 'Hourly sun-path shadow simulation', 'Automatic system capacity calculator (kW)'],
    gradient: 'from-orange-500/20 to-yellow-500/5',
    iconColor: 'text-orange-400',
  },
  {
    icon: FileText,
    tag: 'Proposal Automation',
    title: '1-Click DISCOM & Subsidy Proposal Builder',
    description:
      'Generate stunning branded customer proposals in under 60 seconds. Pre-loaded with central MNRE / PM Surya Ghar subsidies, state DISCOM solar tariffs, and 25-year ROI payback graphs.',
    bullets: ['Instant PDF proposal generation', 'EMI & solar loan financing models', 'Bill-of-materials (BOM) breakdown'],
    gradient: 'from-yellow-500/20 to-amber-500/5',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Smartphone,
    tag: 'Field Operations',
    title: 'Mobile Field Agent Dispatch & Geofencing',
    description:
      'Empower field surveyors and installation teams with a mobile-optimized portal. GPS-verified site check-ins, offline roof inspection checklists, and instant photo uploads directly to the lead timeline.',
    bullets: ['Live technician pincode dispatch', 'Geo-tagged audit verification', 'Direct WhatsApp appointment alerts'],
    gradient: 'from-emerald-500/20 to-teal-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    icon: MessageSquare,
    tag: 'Sales Automation',
    title: 'Omnichannel WhatsApp & SMS Automation',
    description:
      'Never let a solar prospect go cold. Trigger automated WhatsApp messages with proposal PDFs, follow-up reminders, and site visit schedules with two-way conversation history.',
    bullets: ['WhatsApp API template automation', 'Automated SLA & follow-up alarms', 'Client self-service quote approval'],
    gradient: 'from-teal-500/20 to-cyan-500/5',
    iconColor: 'text-teal-400',
  },
  {
    icon: BarChart3,
    tag: 'Executive Intelligence',
    title: 'Executive Solar BI & Net-Metering Tracking',
    description:
      'Get complete visibility into customer acquisition costs (CAC), sales rep conversion benchmarks, installer inventory stages, and DISCOM net-metering approval milestones.',
    bullets: ['Branch & rep performance leaderboards', 'Discom net-metering stage tracker', 'Cash flow & commission forecasting'],
    gradient: 'from-blue-500/20 to-indigo-500/5',
    iconColor: 'text-blue-400',
  },
];

export function KolaBenefitsSection() {
  return (
    <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Engineered Exclusively for Solar Companies</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Comprehensive Benefits of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              Kola Software Solar VCRM
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Unlike generic CRMs that require months of custom development, Kola Software comes pre-configured with end-to-end solar workflows from initial inquiry to grid interconnection.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-b ${item.gradient} bg-slate-900/90 border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800 ${item.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">{item.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  {item.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Solar Workflow Timeline Strip */}
        <div className="mt-16 p-8 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h4 className="text-lg font-bold text-white">The Unified Kola Solar VCRM Lifecycle</h4>
            <p className="text-xs text-slate-400 mt-1">From first web form click to successful commissioning and client referral</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">01</span>
              <p className="text-sm font-semibold text-white mt-2">Lead Ingestion</p>
              <p className="text-[11px] text-slate-400 mt-1">Web form, Meta ads, WhatsApp integration</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">02</span>
              <p className="text-sm font-semibold text-white mt-2">Auto Sales Assign</p>
              <p className="text-[11px] text-slate-400 mt-1">Routed to regional specialist with 1-click dispatch</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">03</span>
              <p className="text-sm font-semibold text-white mt-2">Virtual Site Audit</p>
              <p className="text-[11px] text-slate-400 mt-1">3D satellite survey & roof pitch analysis</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">04</span>
              <p className="text-sm font-semibold text-white mt-2">Instant Proposal</p>
              <p className="text-[11px] text-slate-400 mt-1">DISCOM tariffs & 25-yr financial payback quote</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">05</span>
              <p className="text-sm font-semibold text-white mt-2">Install & Net-Meter</p>
              <p className="text-[11px] text-slate-400 mt-1">Commissioning, serial scans & milestone billing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
