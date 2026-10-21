import { Sun } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* ── Left panel (branding) ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-solar-700 via-solar-600 to-solar-400">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Solar CRM</span>
        </div>

        {/* Quote */}
        <div className="relative space-y-2">
          <p className="text-2xl font-semibold text-white leading-snug">
            "Powering solar businesses<br />with smarter relationships."
          </p>
          <p className="text-sm text-white/70">Manage leads, quotations and customers in one place.</p>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-8">
          {[
            { label: 'Active Leads', value: '—' },
            { label: 'Conversions', value: '—' },
            { label: 'Revenue', value: '—' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Sun className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold">Solar CRM</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
