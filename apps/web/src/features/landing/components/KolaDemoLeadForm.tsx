import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileCheck2,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';
import type { LandingInquiry } from '../services/landing-leads-service';

interface FormState {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  company_name: string;
  business_type: 'residential' | 'commercial' | 'epc' | 'distributor' | 'installer';
  lead_volume: string;
  system_interest: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  customer_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  company_name: '',
  business_type: 'epc',
  lead_volume: '50-150 leads/month',
  system_interest: 'Commercial Rooftop & Residential EPC',
  notes: '',
};

export function KolaDemoLeadForm() {
  const { submitInquiry } = useLandingInquiries();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<LandingInquiry | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Full name is required';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid business email is required';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      errs.phone = '10-digit phone number is required';
    }
    if (!form.address.trim()) errs.address = 'Street address or location is required';
    if (!form.company_name.trim()) errs.company_name = 'Company or organisation name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const created = submitInquiry({
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city || 'Standard District',
        state: form.state || 'National',
        company_name: form.company_name,
        business_type: form.business_type,
        lead_volume: form.lead_volume,
        system_interest: form.system_interest,
        notes: form.notes,
        source: 'Kola Promotional Landing Page',
      });

      setIsSubmitting(false);
      setSubmittedInquiry(created);
      setForm(INITIAL_FORM);
    }, 600);
  };

  return (
    <section id="demo-form" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/70 border-t border-border/40">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kola Software Special Promotion</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Request Your VIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">Solar VCRM Demo</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            See how Kola Software can automate your solar leads, 3D rooftop shading calculations, DISCOM proposals, and field sales dispatch.
          </p>
        </div>

        {/* Success Modal / Card State */}
        {submittedInquiry ? (
          <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/40 shadow-2xl shadow-amber-500/10 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Demo Request Received Successfully!
            </h3>
            <p className="text-slate-300 max-w-lg mx-auto mb-6 text-sm sm:text-base">
              Thank you, <span className="font-semibold text-white">{submittedInquiry.customer_name}</span>. Your inquiry for{' '}
              <span className="font-semibold text-amber-400">{submittedInquiry.company_name}</span> has been securely logged into the Kola Software system.
            </p>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 max-w-md mx-auto text-left space-y-2 mb-8 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-700/60 pb-2">
                <span className="text-slate-400">Inquiry Reference ID:</span>
                <span className="font-mono text-amber-300 font-semibold">{submittedInquiry.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 py-2">
                <span className="text-slate-400">Captured Address:</span>
                <span className="text-white text-right max-w-[200px] truncate">{submittedInquiry.address}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 py-2">
                <span className="text-slate-400">Phone Contact:</span>
                <span className="text-white">{submittedInquiry.phone}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Status in Portal:</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Awaiting Sales Assignment
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/admin/landing-inquiries">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-6 py-2.5">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  View in Admin Portal & Assign Salesperson
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setSubmittedInquiry(null)}
                className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Submit Another Inquiry
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Value Highlights & Trust */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6 bg-slate-900/80 border-slate-800 rounded-2xl backdrop-blur-md">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-400" />
                  What Kola Software Delivers:
                </h3>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-white block">Automated 1-Click Solar Proposals</strong>
                      DISCOM subsidy calculations, 25-year financial ROI, and instant PDF generation.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-white block">Virtual 3D Rooftop Survey Engine</strong>
                      Map azimuth, tilt, shading loss, and panel layout without expensive ladder climbs.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-white block">Dedicated Sales Rep Assignment</strong>
                      Every demo request routes directly to our top regional solar specialists.
                    </div>
                  </li>
                </ul>

                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>🔒 256-bit Enterprise Data Encryption</span>
                  <span>⚡ 15-Minute Response SLA</span>
                </div>
              </Card>

              {/* Direct Admin Access Helper Pill */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-300">Admin Testing Portal</p>
                  <p className="text-[11px] text-slate-400">Want to inspect how inquiries appear for the executive admin?</p>
                </div>
                <Link to="/admin/landing-inquiries">
                  <Button size="sm" variant="secondary" className="text-xs shrink-0 font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30">
                    Open Admin View <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: The Lead Form */}
            <div className="lg:col-span-7">
              <Card className="p-6 sm:p-8 bg-slate-900/90 border-slate-800 rounded-2xl shadow-xl shadow-black/40 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full Name <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="e.g. Rajesh Sharma"
                          value={form.customer_name}
                          onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                          className={`pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 ${
                            errors.customer_name ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                        />
                      </div>
                      {errors.customer_name && <p className="text-[11px] text-destructive mt-1">{errors.customer_name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Phone Number <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="e.g. +91 98765 43210"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className={`pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 ${
                            errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                        />
                      </div>
                      {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Email & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Business Email <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="rajesh@solarpower.in"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={`pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 ${
                            errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Company / Organization Name <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="SunTech Solar EPC Ltd."
                          value={form.company_name}
                          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className={`pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 ${
                            errors.company_name ? 'border-destructive focus-visible:ring-destructive' : ''
                          }`}
                        />
                      </div>
                      {errors.company_name && <p className="text-[11px] text-destructive mt-1">{errors.company_name}</p>}
                    </div>
                  </div>

                  {/* Physical Address / City / State (Explicit User Requirement) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Physical Address / Site Location <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Street, Industrial Area, Building No., or Landmark"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className={`pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 ${
                          errors.address ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                    </div>
                    {errors.address && <p className="text-[11px] text-destructive mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">City / Region</label>
                      <Input
                        placeholder="e.g. Mumbai / Bangalore / Delhi"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">State / Province</label>
                      <Input
                        placeholder="e.g. Maharashtra / Karnataka"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Business Type & Lead Volume */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Solar Business Category</label>
                      <select
                        value={form.business_type}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            business_type: e.target.value as FormState['business_type'],
                          })
                        }
                        className="w-full h-9 rounded-md bg-slate-950/70 border border-slate-700 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="epc">Commercial & Industrial EPC</option>
                        <option value="residential">Residential Solar Installer</option>
                        <option value="commercial">Rooftop Solar Developer</option>
                        <option value="installer">Field Contractor / Survey Agency</option>
                        <option value="distributor">Inverter & Panel Distributor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Inquiries / Leads</label>
                      <select
                        value={form.lead_volume}
                        onChange={(e) => setForm({ ...form, lead_volume: e.target.value })}
                        className="w-full h-9 rounded-md bg-slate-950/70 border border-slate-700 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="10-50 leads/month">10 - 50 leads / month</option>
                        <option value="50-150 leads/month">50 - 150 leads / month</option>
                        <option value="150-500 leads/month">150 - 500 leads / month</option>
                        <option value="500+ leads/month">500+ enterprise leads / month</option>
                      </select>
                    </div>
                  </div>

                  {/* Requirements / Notes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Specific Requirements or Target Systems (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. We need to assign leads to 8 field technicians, create fast 3D quotes, and sync with WhatsApp..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 text-xs text-white p-3 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all mt-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                        Transmitting to Kola Software Dispatch...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Request & Unlock Live Solar VCRM Demo
                      </span>
                    )}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
