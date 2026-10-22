import {
  ArrowRight,
  Inbox,
  LogIn,
  Menu,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';

export function KolaHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { stats } = useLandingInquiries();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sun className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                KOLA <span className="font-light text-slate-400">SOFTWARE</span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Solar VCRM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Virtual Solar CRM & Automation</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-semibold text-slate-300">
          <a href="#benefits" className="hover:text-amber-400 transition-colors">
            Benefits
          </a>
          <a href="#roi-calculator" className="hover:text-amber-400 transition-colors">
            ROI Calculator
          </a>
          <a href="#comparison" className="hover:text-amber-400 transition-colors">
            Why Kola VCRM
          </a>
          <a href="#demo-form" className="hover:text-amber-400 transition-colors">
            Request Demo
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Admin Inquiries Quick Link */}
          <Link to="/admin/landing-inquiries">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white"
            >
              <Inbox className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>Admin Inquiries</span>
              {stats.unassignedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {stats.unassignedCount} new
                </span>
              )}
            </Button>
          </Link>

          {/* CRM Login */}
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Sign In
            </Button>
          </Link>

          {/* Primary CTA */}
          <a href="#demo-form">
            <Button
              size="sm"
              className="text-xs h-9 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
            >
              Book Demo
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <a
            href="#benefits"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 font-medium"
          >
            Benefits & Features
          </a>
          <a
            href="#roi-calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 font-medium"
          >
            ROI Calculator
          </a>
          <a
            href="#comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 font-medium"
          >
            Why Kola VCRM
          </a>
          <a
            href="#demo-form"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-amber-400 font-bold"
          >
            Request Demo
          </a>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link to="/admin/landing-inquiries" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full text-xs border-amber-500/30 text-amber-300 justify-start">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Inquiries Hub ({stats.totalCount} total)
              </Button>
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-xs text-slate-300 justify-start">
                <LogIn className="w-4 h-4 mr-2" />
                CRM Employee Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
