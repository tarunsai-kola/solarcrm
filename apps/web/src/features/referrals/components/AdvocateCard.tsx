import React, { useState } from 'react';
import {
  Award,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  Zap,
  IndianRupee,
  Phone,
  Gift,
} from 'lucide-react';
import { CustomerAdvocate } from '../services/referrals-service';
import { Button } from '@/components/ui/button';

interface AdvocateCardProps {
  advocate: CustomerAdvocate;
}

export function AdvocateCard({ advocate }: AdvocateCardProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `http://localhost:5173/?ref=${advocate.referral_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `☀️ Hello! I recently switched to rooftop solar with Kola Solar and got my PM Surya Ghar subsidy applied!\n\n` +
      `Check your rooftop savings and get ₹5,000 cash discount on your installation using my VIP referral code: *${advocate.referral_code}*\n\n` +
      `Explore your solar rooftop potential here: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Solar Champion':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold';
      case 'Gold':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold';
      case 'Silver':
        return 'bg-slate-300/20 text-slate-300 border border-slate-400/30 font-medium';
      case 'Bronze':
      default:
        return 'bg-orange-700/20 text-orange-400 border border-orange-500/30';
    }
  };

  return (
    <div className="bg-gradient-to-br from-card via-card to-muted/40 border border-border rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
      {/* Top Advocate Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{advocate.customer_name}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTierColor(advocate.tier)}`}>
                {advocate.tier}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>{advocate.installed_system_kw} kW System Installed</span>
              <span>•</span>
              <span>{advocate.city}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-muted-foreground block">Rewards Earned</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{advocate.total_rewards_earned_inr.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Referral Code & Share Link Box */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground text-[11px]">VIP Referral Code:</span>
          <span className="font-mono font-bold text-primary tracking-wider px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            {advocate.referral_code}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 text-xs h-7"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500 mr-1" />
                <span>Copied Link!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                <span>Copy Invite Link</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleShareWhatsApp}
            className="flex-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Share2 className="h-3 w-3 mr-1" />
            <span>WhatsApp Invite</span>
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-card border border-border">
          <span className="text-[10px] text-muted-foreground block">Total Referrals</span>
          <strong className="text-foreground font-mono">{advocate.total_referrals_count} Leads</strong>
        </div>
        <div className="p-2 rounded-lg bg-card border border-border">
          <span className="text-[10px] text-muted-foreground block">Commissioned Installs</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
            {advocate.successful_conversions_count} Converted
          </strong>
        </div>
      </div>
    </div>
  );
}
