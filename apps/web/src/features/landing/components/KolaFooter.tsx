import { ArrowUp, Mail, MapPin, Phone, ShieldCheck, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export function KolaFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Brand Information */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black">
              <Sun className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold text-white">
              KOLA <span className="font-light text-slate-400">SOFTWARE</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              SOLAR VCRM
            </span>
          </div>

          <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
            Kola Software is the premier provider of enterprise Virtual Solar CRM (VCRM) solutions. We help clean energy developers, EPC contractors, and rooftop solar businesses accelerate surveys, automate proposals, and scale revenue.
          </p>

          <div className="space-y-1.5 pt-2 text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Kola Software HQ • Tech Park Hub • Nationwide Operations</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+91 1800-KOLA-SOLAR (Enterprise Toll-Free)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>contact@kolasoftware.com</span>
            </div>
          </div>
        </div>

        {/* Product Capabilities */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">Solar VCRM Platform</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="#benefits" className="hover:text-amber-400 transition-colors">Virtual Lead Capture</a></li>
            <li><a href="#benefits" className="hover:text-amber-400 transition-colors">3D Rooftop Shading Survey</a></li>
            <li><a href="#benefits" className="hover:text-amber-400 transition-colors">1-Click DISCOM Quotations</a></li>
            <li><a href="#benefits" className="hover:text-amber-400 transition-colors">Field Technician GPS Dispatch</a></li>
            <li><a href="#benefits" className="hover:text-amber-400 transition-colors">Net-Metering Milestone Tracker</a></li>
          </ul>
        </div>

        {/* Portals & Internal Access */}
        <div className="md:col-span-4 space-y-2">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">Internal & Admin Portals</h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <Link to="/admin/landing-inquiries" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Inquiries & Sales Assignment Hub
              </Link>
            </li>
            <li>
              <Link to="/admin-login" className="hover:text-white transition-colors">
                Executive Admin Portal
              </Link>
            </li>
            <li>
              <Link to="/inbound-sales-login" className="hover:text-white transition-colors">
                Inbound Sales Team Login
              </Link>
            </li>
            <li>
              <Link to="/field-agent-login" className="hover:text-white transition-colors">
                Field Technical Agent Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-500">
          © {new Date().getFullYear()} Kola Software Technologies Inc. All rights reserved. Built for Next-Gen Solar Companies.
        </p>

        <button
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
        >
          <span>Back to Top</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
}
