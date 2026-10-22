import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  Send,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  calculateSubsidyAndFinancing,
  formatCurrencyInr,
} from '../utils/solar-subsidy-calc';
import { getPublicProposalShareUrl } from '../services/public-proposal-service';

interface SendQuotationWhatsAppModalProps {
  quotation: any;
  isOpen: boolean;
  onClose: () => void;
}

export type WhatsAppTemplateType =
  | 'official_proposal'
  | 'cashflow_financing'
  | 'subsidy_urgency'
  | 'advance_payment'
  | 'custom';

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function SendQuotationWhatsAppModal({
  quotation,
  isOpen,
  onClose,
}: SendQuotationWhatsAppModalProps) {
  if (!isOpen || !quotation) return null;

  const customerName = quotation.lead?.customer_name || 'Valued Customer';
  const initialPhone = quotation.lead?.phone || '';
  const [phone, setPhone] = useState(initialPhone);
  const [templateType, setTemplateType] = useState<WhatsAppTemplateType>('official_proposal');
  const [copiedText, setCopiedText] = useState(false);
  const [customText, setCustomText] = useState('');

  const capacityKw = quotation.system_capacity_kw || 5;
  const totalAmount = quotation.total_amount || 200000;
  const advanceAmount = quotation.advance_amount || Math.round(totalAmount * 0.2);

  const subsidy = calculateSubsidyAndFinancing(totalAmount, capacityKw, {
    enableSubsidy: true,
    isResidential: true,
    enableLoan: true,
    loanTenorYears: 5,
    loanInterestRatePercent: 7.0,
  });

  const publicLink = getPublicProposalShareUrl(quotation.id);

  // Generate Message Text
  const getMessageContent = (): string => {
    switch (templateType) {
      case 'official_proposal':
        return `☀️ *KOLA SOLAR — Official Rooftop Solar Proposal*\n\nHello *${customerName}*,\n\nThank you for choosing *Kola Solar*! Here is the official proposal for your rooftop solar system:\n\n📋 *Proposal Ref:* ${quotation.quotation_number}\n⚡ *System Size:* ${capacityKw} kWp Tier-1 On-Grid Rooftop\n💰 *Total EPC Turnkey Cost:* ${formatInr(totalAmount)}\n🏛️ *PM Surya Ghar Subsidy:* -${formatInr(subsidy.centralSubsidy)} (Direct Benefit Transfer)\n✅ *Net Out-of-Pocket Cost:* *${formatInr(subsidy.netCustomerPayable)}*\n💡 *Est. Monthly Bill Savings:* ~${formatCurrencyInr(subsidy.monthlyElectricitySavings)} / month\n\n📄 *Review Specifications & Digitally Sign Online:*\n👉 ${publicLink}\n\nPlease feel free to call or reply if you have any questions!\n\nBest regards,\n*Kola Solar Solutions*`;

      case 'cashflow_financing':
        return `⚡ *Zero-Down Solar Loan: Positive Cashflow from Month 1!*\n\nHello *${customerName}*,\n\nDid you know your *${capacityKw} kWp Solar Rooftop System* will generate more in electricity savings than your monthly loan EMI?\n\n💰 *Total Investment:* ${formatInr(totalAmount)}\n🏛️ *Govt. MNRE Subsidy:* -${formatInr(subsidy.centralSubsidy)}\n🏦 *5-Year Green Loan EMI:* ₹${Math.round(subsidy.monthlyEmi).toLocaleString('en-IN')} / month\n💡 *Monthly Bill Reduction:* +${formatCurrencyInr(subsidy.monthlyElectricitySavings)} / month\n🌟 *Net Monthly Profit:* *+${formatCurrencyInr(subsidy.monthlyNetCashflow)} / month into your pocket!*\n\nLock in your solar system and reduce electricity bills immediately:\n👉 ${publicLink}\n\n*Kola Solar Team*`;

      case 'subsidy_urgency':
        return `⏳ *URGENT: Lock in your PM Surya Ghar ₹${(subsidy.centralSubsidy / 1000).toFixed(0)}k Subsidy Slab*\n\nHello *${customerName}*,\n\nUnder the national *PM Surya Ghar: Muft Bijli Yojana*, your rooftop qualifies for the maximum direct central government subsidy of *${formatInr(subsidy.centralSubsidy)}*.\n\nLocal DISCOM transformer grid allocation is filled on a first-come, first-served basis. We strongly recommend completing your online digital acceptance today so we can secure your feeder sanction:\n\n👉 *Review & Sign Proposal Online:* ${publicLink}\n\nOur liaising engineers will submit your DISCOM application within 24 hours of signature.\n\nWarm regards,\n*Kola Solar EPC Team*`;

      case 'advance_payment':
        return `💳 *KOLA SOLAR — Project Booking & Advance Schedule*\n\nHello *${customerName}*,\n\nTo lock in equipment delivery for your *${capacityKw} kWp Solar Plant* (${quotation.quotation_number}), here are the booking details:\n\n📌 *Advance Booking (20%):* *${formatInr(advanceAmount)}*\n📌 *Balance on Delivery & Commissioning:* ${formatInr(totalAmount - advanceAmount)}\n\n📄 *View Executed Agreement & Bank Account:* \n👉 ${publicLink}\n\n*Official Bank Transfer:*\nBank: HDFC Bank Ltd | A/C Holder: Sunbeam Solar Energy Solutions\nA/C No: 50200088991122 | IFSC: HDFC0001234\n\nThank you for choosing clean renewable energy!`;

      case 'custom':
      default:
        return customText || `Hello ${customerName}, please review your solar proposal: ${publicLink}`;
    }
  };

  const messageText = getMessageContent();

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit customer mobile number.');
      return;
    }
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-card border border-border p-6 shadow-2xl text-foreground space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Dispatch Solar Proposal via WhatsApp
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {quotation.quotation_number} • {customerName} ({capacityKw} kWp)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer Phone Input */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Recipient WhatsApp Mobile Number *
          </label>
          <div className="relative">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98401 23456"
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Template Selector Pills */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Select High-Converting WhatsApp Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'official_proposal', label: '1. Proposal & Subsidy' },
              { id: 'cashflow_financing', label: '2. Positive Cashflow' },
              { id: 'subsidy_urgency', label: '3. Subsidy Urgency' },
              { id: 'advance_payment', label: '4. Booking Deposit' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateType(t.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                  templateType === t.id
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground">
              WhatsApp Message Preview
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {copiedText ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copiedText ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <textarea
            rows={8}
            value={messageText}
            onChange={(e) => {
              setTemplateType('custom');
              setCustomText(e.target.value);
            }}
            className="w-full p-3.5 rounded-xl bg-background border border-border text-xs text-foreground font-sans focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview Customer Public Portal
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Send className="h-3.5 w-3.5" /> Launch WhatsApp Web
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
