import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Compass,
  FileCheck2,
  Flame,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function KolaHeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Kola Software Introduces Next-Gen Solar VCRM</span>
            <span className="hidden sm:inline text-amber-500">•</span>
            <span className="hidden sm:inline text-slate-300 font-normal">Virtual Rooftop & Sales Intelligence</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Close Solar Deals Faster with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
              Kola Solar VCRM
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The intelligent Virtual Solar CRM platform engineered for solar installers, EPC developers, and clean-energy sales teams. Automate lead capture, conduct 3D rooftop shading surveys, generate DISCOM-compliant solar proposals in 60 seconds, and track field technicians in real-time.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo-form">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25">
                <Sun className="w-5 h-5 mr-2" />
                Request Free Live Demo
              </Button>
            </a>

            <a href="#roi-calculator">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white">
                Calculate Solar ROI <ArrowRight className="w-4 h-4 ml-2 text-amber-400" />
              </Button>
            </a>

            <Link to="/admin/landing-inquiries">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-6 bg-slate-800/80 text-amber-300 hover:bg-slate-800 border border-amber-500/30">
                <ShieldCheck className="w-4 h-4 mr-2 text-amber-400" />
                Admin Leads Inbox
              </Button>
            </Link>
          </div>

          {/* Quick Value Points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Zero Setup Fee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Full DISCOM Subsidy Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Live Salesperson Assignment</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Dashboard Showcase */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-amber-500/30 via-slate-800/40 to-slate-900/80 border border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              {/* Kola Solar Hero Graphic Render */}
              <div className="relative h-[280px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden">
                <img
                  src="/images/kola-solar-hero.jpg"
                  alt="Kola Software Solar VCRM Platform Telemetry"
                  className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Overlaid Floating Telemetry Badges */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-amber-500/40 backdrop-blur-md shadow-xl text-left max-w-[200px] sm:max-w-[240px]">
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <Sun className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Kola Solar VCRM</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-white">1.48 GW</p>
                  <p className="text-[11px] text-slate-300">Live Active Solar Projects Managed</p>
                </div>

                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-emerald-500/40 backdrop-blur-md shadow-xl text-left hidden sm:block max-w-[220px]">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sales Velocity</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">3.4x Faster</p>
                  <p className="text-[11px] text-slate-300">Inquiry to Proposal Dispatch</p>
                </div>

                {/* Bottom Live Activity Strip */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">
                      Real-Time Web Inquiries Auto-Routing Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <span>⚡ 5 Sales Specialists Available for Assignment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-y border-slate-800/80 py-8">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white">45,000+</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">Solar Rooftops Surveyed</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">₹320+ Cr</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">Solar Proposals Quoted</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">99.4%</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">DISCOM Tariff Accuracy</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white">&lt; 60 Sec</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">Proposal Generation Time</div>
          </div>
        </div>
      </div>
    </section>
  );
}
