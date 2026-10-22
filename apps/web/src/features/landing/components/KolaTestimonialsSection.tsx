import { Quote, Star } from 'lucide-react';

import { Card } from '@/components/ui/card';

const TESTIMONIALS = [
  {
    name: 'Suresh Nambiar',
    role: 'Managing Director',
    company: 'SuryaVanguard Energy EPC, Bengaluru',
    quote:
      'Kola Software Solar VCRM transformed how we handle rooftop inquiries. Before, proposals took our engineering team 2 days. Now, our sales reps configure DISCOM-approved quotations right on their tablets during the site visit.',
    stats: '280% Faster Deal Turnaround',
    avatar: 'SN',
  },
  {
    name: 'Meera Chawla',
    role: 'VP of Commercial Sales',
    company: 'Apex CleanPower Developers, Mumbai',
    quote:
      'The automated lead routing and salesperson assignment features are remarkable. As soon as a factory or commercial society submits an inquiry with their address, it routes to our regional solar engineer within seconds.',
    stats: 'Zero Lead Leakage',
    avatar: 'MC',
  },
  {
    name: 'Vikramaditya Rao',
    role: 'Founder & Chief Technical Officer',
    company: 'SunGrid Solar Infrastructure, Hyderabad',
    quote:
      'The 3D rooftop shading analysis combined with live WhatsApp proposal dispatch increased our close rate by 42%. Kola Solar VCRM is without question the gold standard for modern solar companies.',
    stats: '+42% Signed Contracts',
    avatar: 'VR',
  },
];

export function KolaTestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex justify-center gap-1 mb-3 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Trusted by Top <span className="text-amber-400">Solar EPCs & Installers</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Hear from energy executives who scaled their solar sales teams with Kola Software Solar VCRM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, idx) => (
            <Card
              key={idx}
              className="p-6 bg-slate-900/80 border-slate-800 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-colors"
            >
              <div>
                <Quote className="w-8 h-8 text-amber-500/30 mb-3" />
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {item.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <p className="text-[11px] text-slate-400">{item.role}</p>
                    <p className="text-[11px] text-amber-400 font-medium">{item.company}</p>
                  </div>
                </div>
                <div className="mt-3 inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                  {item.stats}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
