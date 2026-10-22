import { useEffect } from 'react';

import { KolaBenefitsSection } from '../components/KolaBenefitsSection';
import { KolaComparisonSection } from '../components/KolaComparisonSection';
import { KolaDemoLeadForm } from '../components/KolaDemoLeadForm';
import { KolaFooter } from '../components/KolaFooter';
import { KolaHeader } from '../components/KolaHeader';
import { KolaHeroSection } from '../components/KolaHeroSection';
import { KolaInteractiveCalculator } from '../components/KolaInteractiveCalculator';
import { KolaTestimonialsSection } from '../components/KolaTestimonialsSection';

export function KolaLandingPage() {
  useEffect(() => {
    document.title = 'Kola Software — Next-Gen Solar VCRM Platform | Virtual Solar CRM';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Fixed Sticky Header */}
      <KolaHeader />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 1. Hero Section with Solar VCRM Visuals & Highlights */}
        <KolaHeroSection />

        {/* 2. Comprehensive Benefits & Features of Kola Solar VCRM */}
        <KolaBenefitsSection />

        {/* 3. Interactive Solar ROI & Savings Calculator */}
        <KolaInteractiveCalculator />

        {/* 4. Competitive Matrix (Kola VCRM vs Generic CRMs) */}
        <KolaComparisonSection />

        {/* 5. Customer Testimonials & EPC Proof */}
        <KolaTestimonialsSection />

        {/* 6. Promotional Lead Capture Form (Name, Email, Phone, Address, Company, etc.) */}
        <KolaDemoLeadForm />
      </main>

      {/* Footer */}
      <KolaFooter />
    </div>
  );
}
