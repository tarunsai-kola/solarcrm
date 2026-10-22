import React, { useState } from 'react';
import {
  X,
  Gift,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  Share2,
  Printer,
  Sparkles,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReferralLead, ReferralStatus, RewardStatus } from '../services/referrals-service';

interface ReferralDetailDrawerProps {
  referral: ReferralLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (referralId: string, newStatus: ReferralStatus, rewardStatus?: RewardStatus | undefined) => void;
  onConvertToQuote: (referral: ReferralLead) => void;
}

export function ReferralDetailDrawer({
  referral,
  isOpen,
  onClose,
  onUpdateStatus,
  onConvertToQuote,
}: ReferralDetailDrawerProps) {
  if (!isOpen || !referral) return null;

  const [payoutRef, setPayoutRef] = useState(referral.payout_reference || '');

  const stages: ReferralStatus[] = [
    'lead_submitted',
    'survey_completed',
    'proposal_sent',
    'contract_signed',
    'commissioned',
  ];

  const handleShareWhatsAppReferrer = () => {
    const text = encodeURIComponent(
      `🎉 *KOLA SOLAR — REFERRAL REWARD UPDATE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Dear ${referral.referrer_customer_name},\n\n` +
      `Great news! Your referred prospect *${referral.referred_prospect_name}* has moved to the next solar stage:\n` +
      `📌 *Current Status:* *${referral.status.replace(/_/g, ' ').toUpperCase()}*\n` +
      `💰 *Your Incentive:* ₹${referral.reward_amount_inr.toLocaleString()} (${referral.reward_status.replace(/_/g, ' ').toUpperCase()})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for being a champion of clean energy with Kola Software Solar VCRM!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'commissioned':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'contract_signed':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'proposal_sent':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'survey_completed':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'lead_submitted':
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-card border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusColor(referral.status)}`}>
                {referral.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono font-bold text-primary">{referral.referral_code}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">{referral.referred_prospect_name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Referred by:</span>
              <strong className="text-foreground">{referral.referrer_customer_name}</strong>
              <span>({referral.referrer_phone})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Milestone Pipeline Stepper */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Referral Conversion Stages
            </span>
            <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1">
              {stages.map((st, idx) => {
                const currentIdx = stages.indexOf(referral.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = referral.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateStatus(referral.id, st)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-medium transition-all ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span className="capitalize">{st.split('_')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reward Status & Payout Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Advocate Referral Reward</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Awarded to {referral.referrer_customer_name} upon installation
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono text-lg">
                  ₹{referral.reward_amount_inr.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground block capitalize">
                  {referral.reward_type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-card/80 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Payout Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  referral.reward_status === 'paid_out'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : referral.reward_status === 'approved_for_payout'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {referral.reward_status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Payout Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {referral.reward_status === 'pending_milestone' && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(referral.id, referral.status, 'approved_for_payout')}
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  <span>Approve ₹{referral.reward_amount_inr.toLocaleString()} Reward</span>
                </Button>
              )}

              {referral.reward_status === 'approved_for_payout' && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(referral.id, referral.status, 'paid_out')}
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <IndianRupee className="h-3.5 w-3.5 mr-1" />
                  <span>Mark as Paid Out (UPI / Bank Transfer)</span>
                </Button>
              )}

              {referral.reward_status === 'paid_out' && (
                <div className="w-full text-center py-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20">
                  Reward Disbursed: {referral.payout_reference || 'UPI Transfer Completed'}
                </div>
              )}
            </div>
          </div>

          {/* Prospect Contact & System Details */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Site & System Specifications
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Prospect Phone:</span>
                <div className="font-semibold text-foreground font-mono">{referral.referred_phone}</div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-muted-foreground">Estimated Sizing:</span>
                <div className="font-semibold text-foreground font-mono">
                  {referral.estimated_system_kw} kWp Rooftop
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-1 col-span-2">
                <span className="text-muted-foreground">Address & City:</span>
                <div className="font-semibold text-foreground">
                  {referral.referred_address}, {referral.referred_city}
                </div>
              </div>

              {referral.notes && (
                <div className="p-3 rounded-lg border border-border bg-muted/20 col-span-2">
                  <span className="text-muted-foreground block text-[10px]">Advocate Relationship & Notes:</span>
                  <div className="text-foreground mt-0.5">{referral.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareWhatsAppReferrer}
            className="text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 text-xs"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span>Notify Advocate</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose();
              onConvertToQuote(referral);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Solar Quotation</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
