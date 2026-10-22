import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { useParams as useRouterParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  acceptPublicProposal,
  fetchPublicProposal,
  getPublicProposalShareUrl,
  requestPublicProposalRevision,
  type StoredProposalRecord,
} from '../services/public-proposal-service';
import { DigitalSignaturePad } from '../components/DigitalSignaturePad';
import { calculateSubsidyAndFinancing, formatCurrencyInr } from '../utils/solar-subsidy-calc';

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function PublicProposalPortalPage() {
  const params = useRouterParams<{ quoteId?: string }>();
  const quoteId = params.quoteId || 'sample-quote-001';

  const [proposal, setProposal] = useState<StoredProposalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Signature Form State
  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerDesignation, setSignerDesignation] = useState('Property Owner');
  const [signatureData, setSignatureData] = useState<{
    type: 'drawn' | 'typed';
    data: string;
    isValid: boolean;
  }>({
    type: 'drawn',
    data: '',
    isValid: false,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionSubmitted, setRevisionSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchPublicProposal(quoteId);
      if (data) {
        setProposal(data);
        if (data.lead?.customer_name) {
          setSignerName(data.lead.customer_name);
        }
        if (data.lead?.phone) {
          setSignerPhone(data.lead.phone);
        }
        if (data.status === 'accepted' && data.signature) {
          setSignSuccess(true);
          setVerificationCode(data.signature.verification_hash);
        }
      }
      setLoading(false);
    }
    load();
  }, [quoteId]);

  const handleCopyLink = () => {
    const url = getPublicProposalShareUrl(quoteId);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSignProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    if (!signerName.trim()) {
      alert('Please enter your full legal name.');
      return;
    }
    if (!signatureData.isValid || !signatureData.data) {
      alert('Please provide your digital signature using the signature pad.');
      return;
    }
    if (!termsAccepted) {
      alert('Please review and accept the proposal terms and subsidy authorization checkbox.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await acceptPublicProposal(proposal.id, {
        signerName,
        signerPhone,
        signerDesignation,
        signatureType: signatureData.type,
        signatureData: signatureData.data,
        termsAccepted,
        notes: customerNotes,
      });

      if (result.success) {
        setProposal(result.proposal);
        setVerificationCode(result.verificationHash);
        setSignSuccess(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sign proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal || !revisionNotes.trim()) return;

    try {
      const res = await requestPublicProposalRevision(proposal.id, revisionNotes);
      if (res.success) {
        setProposal(res.proposal);
        setRevisionSubmitted(true);
        setTimeout(() => {
          setShowRevisionModal(false);
          setRevisionSubmitted(false);
          setRevisionNotes('');
        }, 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit revision request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Sun className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Loading Solar Proposal...</h2>
        <p className="text-sm text-slate-400 mt-1">Retrieving official engineering proposal and subsidy calculations.</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold">Proposal Not Found</h2>
        <p className="text-sm text-slate-400 mt-1 text-center max-w-md">
          The requested quotation could not be located. Please check the proposal link or contact your Kola Solar advisor.
        </p>
      </div>
    );
  }

  const subsidy = calculateSubsidyAndFinancing(
    proposal.total_amount,
    proposal.system_capacity_kw || 5,
    {
      enableSubsidy: true,
      isResidential: true,
      enableLoan: true,
      loanTenorYears: 5,
      loanInterestRatePercent: 7.0,
    },
  );

  const isAlreadySigned = proposal.status === 'accepted' || signSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 selection:bg-amber-500/30 selection:text-amber-200">
      {/* ── Top Floating Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sun className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">KOLA SOLAR</span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" /> MNRE Verified Partner
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Proposal Ref: <span className="font-mono font-semibold text-slate-200">{proposal.quotation_number}</span> (v{proposal.version})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isAlreadySigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Digitally Accepted & Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Awaiting Customer E-Signature
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 gap-1.5 text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
              title="Copy shareable customer proposal link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? 'Link Copied!' : 'Share Link'}
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-8 gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Signed Success Notification Banner */}
        {isAlreadySigned && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border border-emerald-500/40 p-6 shadow-xl shadow-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Proposal Digitally Signed & Accepted</h3>
                  <span className="bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                    EXECUTED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Signed by <span className="font-semibold text-white">{proposal.signature?.signer_name || signerName}</span> ({proposal.signature?.signer_designation || signerDesignation}) on{' '}
                  <span className="font-mono text-emerald-400">{formatDate(proposal.signature?.signed_at || new Date().toISOString())}</span>.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Audit Verification Token: <span className="text-slate-200 select-all font-semibold">{proposal.signature?.verification_hash || verificationCode}</span>
                </p>
              </div>
            </div>

            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
              className="bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Printer className="h-3.5 w-3.5" /> Print Executed Contract
            </Button>
          </div>
        )}

        {/* ── Hero Presentation Banner ── */}
        <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Sun className="h-3.5 w-3.5" /> High-Efficiency Rooftop Solar Proposal
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {proposal.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-amber-400" />
                  <span>Prepared for: <strong className="text-white">{proposal.lead?.customer_name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>{proposal.lead?.city || 'Project Site'}, PIN: {proposal.lead?.pincode || '560100'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>Valid Until: <strong className="text-white">{formatDate(proposal.valid_until)}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Economics Card */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 shadow-xl w-full lg:w-80 shrink-0 space-y-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-semibold block">
                Turnkey Project Investment
              </span>
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">Total System Cost</span>
                <span className="text-lg font-bold text-slate-200">{formatInr(proposal.total_amount)}</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-3 text-emerald-400">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> PM Surya Ghar Subsidy
                </span>
                <span className="text-base font-extrabold">- {formatInr(subsidy.centralSubsidy)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs font-extrabold text-white block">Net Out-of-Pocket</span>
                  <span className="text-[10px] text-slate-400">Customer effective cost</span>
                </div>
                <span className="text-2xl font-black text-amber-400">{formatInr(subsidy.netCustomerPayable)}</span>
              </div>
            </div>
          </div>

          {/* 4 Quick Stat Pill Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Plant Capacity</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{proposal.system_capacity_kw} kWp</span>
              <span className="text-[10px] text-slate-400">{proposal.phase} • {proposal.system_type}</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Monthly Solar Generation</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">~{subsidy.monthlyUnitsGenerated} kWh / mo</span>
              <span className="text-[10px] text-slate-400">~{subsidy.monthlyUnitsGenerated * 12} units annually</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Monthly Bill Savings</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">+{formatCurrencyInr(subsidy.monthlyElectricitySavings)}/mo</span>
              <span className="text-[10px] text-slate-400">₹{Math.round(subsidy.annualElectricitySavings).toLocaleString('en-IN')}/year savings</span>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Simple Payback</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">{subsidy.simplePaybackYears} Years</span>
              <span className="text-[10px] text-slate-400">25-Yr Net: {formatCurrencyInr(subsidy.lifetime25YrSavings)}</span>
            </div>
          </div>
        </section>

        {/* ── PM Surya Ghar (Muft Bijli Yojana) Subsidy & Green Financing Highlights ── */}
        <section className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  NATIONAL PM SURYA GHAR CERTIFIED
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  LOW-INTEREST GREEN LOAN ELIGIBLE
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" /> Government Central Subsidy & Monthly Cashflow Breakdown
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">DISCOM Interconnection</span>
              <span className="text-xs font-semibold text-emerald-400">100% Net-Metering Liaison Included</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subsidy Box */}
            <div className="rounded-2xl bg-slate-950 p-5 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Central MNRE Subsidy</span>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {formatInr(subsidy.centralSubsidy)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct Benefit Transfer (DBT) directly into customer’s bank account following bi-directional net-metering commissioning.
              </p>
            </div>

            {/* Loan EMI Box */}
            <div className="rounded-2xl bg-slate-950 p-5 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
                <span>5-Year Clean Energy Loan EMI</span>
                <Building2 className="h-4 w-4" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                ₹{Math.round(subsidy.monthlyEmi).toLocaleString('en-IN')}{' '}
                <span className="text-sm font-normal text-slate-400">/ mo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Available through SBI, PNB, and Canara Bank at concessional 7.0% p.a. interest rate for rooftop solar borrowers.
              </p>
            </div>

            {/* Net Cash Flow Box */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 p-5 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider font-mono">
                <span>Net Monthly Cashflow</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                +{formatCurrencyInr(subsidy.monthlyNetCashflow)}{' '}
                <span className="text-sm font-normal text-emerald-300">/ mo</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed font-medium">
                ★ <strong>Instant Profit:</strong> Monthly electricity bill reduction exceeds the solar loan EMI from Day 1!
              </p>
            </div>
          </div>
        </section>

        {/* ── Bill of Materials (BOM) & Equipment Specifications ── */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-400" /> System Equipment & Bill of Materials (BOM)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tier-1 certified high-performance equipment adhering to MNRE and IEC solar standards.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {proposal.items?.length || 0} Engineered Components
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10">#</th>
                  <th className="py-3 px-4">Component & Technical Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Unit Rate</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {proposal.items?.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{item.component_name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">{item.unit}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatInr(item.unit_price)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{formatInr(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing & Commercial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Warranties Schedule */}
            <div className="rounded-2xl bg-slate-950/60 p-5 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Warranties & Comprehensive Guarantees
              </span>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Solar PV Modules:</strong> 25-Year Linear Power Warranty (≥84.8% performance at Year 25).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Grid-Tied Inverter:</strong> 5-Year Comprehensive Manufacturer Replacement Warranty.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Mounting Structure & Cables:</strong> 10-Year Rust & Weatherproof Warranty (HDG rated to 150 km/h wind).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>EPC Workmanship & DISCOM Approval:</strong> 5-Year Free On-site Preventive Maintenance & Generation Audit.</span>
                </li>
              </ul>
            </div>

            {/* Financial Schedule */}
            <div className="rounded-2xl bg-slate-950 p-5 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Project Commercials
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Equipment Subtotal:</span>
                  <span className="font-mono text-slate-200">{formatInr(proposal.subtotal)}</span>
                </div>
                {proposal.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promotional Kola Discount:</span>
                    <span className="font-mono font-semibold">- {formatInr(proposal.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Taxable Turnkey Value:</span>
                  <span className="font-mono text-slate-200">{formatInr(proposal.taxable_value)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({proposal.gst_rate}% Solar Composite):</span>
                  <span className="font-mono text-slate-200">{formatInr(proposal.tax_amount)}</span>
                </div>
                {Boolean(proposal.kseb_charges) && (
                  <div className="flex justify-between text-slate-400">
                    <span>DISCOM Application & Net-Meter Fee:</span>
                    <span className="font-mono text-slate-200">{formatInr(proposal.kseb_charges || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                  <span>Total Turnkey Contract:</span>
                  <span className="font-mono text-base text-amber-400">{formatInr(proposal.total_amount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Advance Booking (20%)</span>
                    <strong className="text-white text-xs font-mono">{formatInr(proposal.advance_amount)}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Balance on Delivery (80%)</span>
                    <strong className="text-white text-xs font-mono">{formatInr(proposal.balance_amount)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Digital E-Signature Section ── */}
        <section
          id="sign-section"
          className={`rounded-3xl border p-6 sm:p-10 shadow-2xl transition-all ${
            isAlreadySigned
              ? 'bg-slate-900/90 border-emerald-500/40'
              : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-500/5'
          }`}
        >
          {isAlreadySigned ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> OFFICIAL DIGITAL ACCEPTANCE CONFIRMED
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">Executed Digital Signature</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Verification Timestamp</span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {new Date(proposal.signature?.signed_at || Date.now()).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Verified Signature Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-slate-950 p-6 border border-emerald-500/30 flex flex-col justify-between space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                    Customer Signature Record:
                  </span>

                  <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    {proposal.signature?.signature_type === 'drawn' ? (
                      <img
                        src={proposal.signature.signature_data}
                        alt="Customer Signature"
                        className="max-h-24 object-contain filter invert dark:invert-0"
                      />
                    ) : (
                      <p
                        className="text-3xl text-blue-400 italic font-serif select-none"
                        style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive, serif" }}
                      >
                        {proposal.signature?.signature_data || proposal.signature?.signer_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs border-t border-slate-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Signatory:</span>
                      <strong className="text-white">{proposal.signature?.signer_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Designation / Role:</span>
                      <span className="text-slate-200">{proposal.signature?.signer_designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile Phone:</span>
                      <span className="text-slate-200">{proposal.signature?.signer_phone}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" /> Digital Audit Trail & Legal Enforceability
                    </span>

                    <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800 text-xs font-mono space-y-1.5">
                      <div className="text-slate-400">
                        HASH: <span className="text-emerald-400 break-all select-all">{proposal.signature?.verification_hash}</span>
                      </div>
                      <div className="text-slate-400">
                        IP GATEWAY: <span className="text-slate-200">{proposal.signature?.ip_stamp}</span>
                      </div>
                      <div className="text-slate-400">
                        STATUS: <span className="text-emerald-400 font-bold">200 OK — BINDING CONTRACT</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="font-semibold text-white">Next Steps for Project Execution:</p>
                      <ul className="space-y-1 text-slate-400 list-disc list-inside text-[11px]">
                        <li>Our EPC Engineering team is notified and will reach out within 24 hours.</li>
                        <li>Site inspection scheduled for rooftop structural load validation.</li>
                        <li>DISCOM Net-Metering application uploaded with certified single line diagram.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => window.print()}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs"
                    >
                      <Download className="h-4 w-4 mr-1.5" /> Download Countersigned Document
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignProposal} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="h-3.5 w-3.5" /> STEP 2: REVIEW & DIGITALLY EXECUTE
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">Customer Digital E-Signature</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Accept this proposal electronically. You can draw your signature with your finger/mouse or type your legal name.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevisionModal(true)}
                  className="bg-slate-950 border-slate-700 hover:bg-slate-800 text-slate-300 text-xs shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1 text-amber-400" /> Request Revision / Change
                </Button>
              </div>

              {/* Signer Identification Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Legal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Harish Sundaram"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerPhone}
                    onChange={(e) => setSignerPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Designation / Legal Capacity *
                  </label>
                  <select
                    value={signerDesignation}
                    onChange={(e) => setSignerDesignation(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Property Owner">Property Owner / Consumer</option>
                    <option value="Authorized Signatory">Authorized Signatory (Corporate / Society)</option>
                    <option value="Co-owner / Spouse">Co-owner / Spouse</option>
                    <option value="Managing Director">Managing Director / Partner</option>
                  </select>
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Digital Signature Pad * (Draw with mouse/stylus or Type your signature)
                </label>
                <DigitalSignaturePad
                  signerName={signerName}
                  onSignatureChange={(sig) => setSignatureData(sig)}
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Special Notes or Scheduling Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g., Please schedule the engineer site inspection on Saturday morning."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Legal Acknowledgment Checkbox */}
              <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I confirm that I am authorized to enter into this proposal. I accept the proposed solar system capacity of{' '}
                    <strong className="text-white">{proposal.system_capacity_kw} kWp</strong>, pricing schedule of{' '}
                    <strong className="text-amber-400">{formatInr(proposal.total_amount)}</strong>, warranties, and authorize Kola Solar to prepare and submit the DISCOM net-metering and PM Surya Ghar subsidy documentation on my behalf.
                  </span>
                </label>
              </div>

              {/* Submission CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span>256-Bit Encrypted E-Sign Submission</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted || !signatureData.isValid}
                  className="w-full sm:w-auto h-12 px-8 text-sm font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-xl shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                      Digitally Signing Proposal...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept & Digitally Sign Proposal
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>

      {/* ── Revision Request Modal ── */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <RotateCcw className="h-5 w-5 text-amber-400" /> Request Proposal Revision
              </h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {revisionSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Revision Request Submitted!</h4>
                <p className="text-xs text-slate-400">
                  Your solar advisor has received your comments and will generate an updated proposal version shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestRevision} className="space-y-4">
                <p className="text-xs text-slate-300">
                  Let us know what changes you would like to make (e.g. adjust capacity, upgrade inverter brand, request battery storage option, or commercial schedule).
                </p>

                <textarea
                  required
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Describe the adjustments you'd like to see in your revised quotation..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevisionModal(false)}
                    className="bg-slate-950 border-slate-700 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    Submit Revision Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
