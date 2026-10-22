import { Check, Minus, Sparkles, X } from 'lucide-react';

import { Card } from '@/components/ui/card';

const COMPARISONS = [
  {
    feature: '3D Rooftop Shading & Azimuth Survey',
    kola: true,
    generic: false,
    spreadsheets: false,
  },
  {
    feature: 'DISCOM & PM Surya Ghar Subsidy Calculations',
    kola: true,
    generic: false,
    spreadsheets: false,
  },
  {
    feature: '1-Click Branded Solar Engineering Proposals',
    kola: true,
    generic: false,
    spreadsheets: false,
  },
  {
    feature: 'Mobile Field Agent Geofenced Check-In',
    kola: true,
    generic: 'Requires Paid Add-on',
    spreadsheets: false,
  },
  {
    feature: 'Auto Lead Capture with Salesperson Assignment',
    kola: true,
    generic: true,
    spreadsheets: false,
  },
  {
    feature: 'WhatsApp Quotation & Notification Triggering',
    kola: true,
    generic: 'Complex Integration',
    spreadsheets: false,
  },
  {
    feature: 'Role-Based Portals (Admin / Sales / Field)',
    kola: true,
    generic: true,
    spreadsheets: false,
  },
  {
    feature: 'Solar EPC Net-Metering Approval Tracker',
    kola: true,
    generic: false,
    spreadsheets: false,
  },
];

export function KolaComparisonSection() {
  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Competitive Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Solar Businesses Choose <span className="text-amber-400">Kola Solar VCRM</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Compare Kola Software purpose-built solar platform against generic business CRMs and spreadsheets.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-4 px-4 text-sm font-semibold text-slate-300">Capabilities</th>
                <th className="py-4 px-4 text-sm font-bold text-amber-400 bg-amber-500/10 rounded-t-xl text-center border-t-2 border-amber-500">
                  Kola Solar VCRM
                </th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-400 text-center">Generic CRMs (Salesforce/HubSpot)</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-400 text-center">Spreadsheets & Manual Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {COMPARISONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-slate-200 font-medium">{row.feature}</td>

                  {/* Kola Software */}
                  <td className="py-3.5 px-4 text-center bg-amber-500/5 font-semibold text-amber-300">
                    <div className="flex items-center justify-center gap-1.5 text-amber-400">
                      <Check className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                      <span className="text-xs">Native Solar Feature</span>
                    </div>
                  </td>

                  {/* Generic CRM */}
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    {typeof row.generic === 'string' ? (
                      <span className="text-xs text-amber-300/80 italic">{row.generic}</span>
                    ) : row.generic ? (
                      <Check className="w-4 h-4 mx-auto text-slate-400" />
                    ) : (
                      <X className="w-4 h-4 mx-auto text-slate-600" />
                    )}
                  </td>

                  {/* Spreadsheets */}
                  <td className="py-3.5 px-4 text-center text-slate-500">
                    <X className="w-4 h-4 mx-auto text-rose-500/70" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
