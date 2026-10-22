import React, { useState } from 'react';
import { X, Gift, User, Phone, MapPin, Zap, IndianRupee, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createReferral,
  getLocalAdvocates,
  ReferralLead,
  RewardType,
} from '../services/referrals-service';

interface LogReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReferral: ReferralLead) => void;
}

export function LogReferralModal({
  isOpen,
  onClose,
  onSuccess,
}: LogReferralModalProps) {
  if (!isOpen) return null;

  const advocates = getLocalAdvocates();

  const [selectedAdvocateId, setSelectedAdvocateId] = useState<string>(advocates[0]?.id || 'custom');
  const [referrerName, setReferrerName] = useState(advocates[0]?.customer_name || 'Harish Sundaram');
  const [referrerPhone, setReferrerPhone] = useState(advocates[0]?.phone || '+91 98401 23456');

  const [prospectName, setProspectName] = useState('');
  const [prospectPhone, setProspectPhone] = useState('');
  const [prospectAddress, setProspectAddress] = useState('');
  const [prospectCity, setProspectCity] = useState('Bengaluru');
  const [estimatedKw, setEstimatedKw] = useState('5.0');
  const [rewardType, setRewardType] = useState<RewardType>('cash_bonus');
  const [notes, setNotes] = useState('');

  const handleAdvocateChange = (advId: string) => {
    setSelectedAdvocateId(advId);
    const found = advocates.find((a) => a.id === advId);
    if (found) {
      setReferrerName(found.customer_name);
      setReferrerPhone(found.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerName || !prospectName || !prospectPhone || !prospectAddress) {
      alert('Please fill in Referrer details, Prospect Name, Phone, and Address.');
      return;
    }

    const newRef = createReferral({
      referrer_customer_name: referrerName,
      referrer_phone: referrerPhone,
      referred_prospect_name: prospectName,
      referred_phone: prospectPhone,
      referred_address: prospectAddress,
      referred_city: prospectCity,
      estimated_system_kw: Number(estimatedKw) || 5.0,
      reward_type: rewardType,
      notes: notes || 'Logged via sales referral portal.',
    });

    onSuccess(newRef);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Log Customer Solar Referral</h3>
              <p className="text-xs text-muted-foreground">Record word-of-mouth lead & track ₹5,000 advocate payout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Advocate Selection */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
            <label className="text-xs font-semibold text-foreground block">
              Referring Customer Advocate
            </label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => handleAdvocateChange(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
            >
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.customer_name} ({adv.referral_code}) — {adv.tier} Tier
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Referred Prospect Details
            </span>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prospect Full Name *</label>
              <Input
                required
                placeholder="e.g. Sunil Narang (Neighbor)"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phone Number *</label>
                <Input
                  required
                  placeholder="+91 98400 12345"
                  value={prospectPhone}
                  onChange={(e) => setProspectPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Est. Capacity (kWp)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={estimatedKw}
                  onChange={(e) => setEstimatedKw(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Site Address & Location *</label>
              <Input
                required
                placeholder="House/Villa No, Street, Neighborhood"
                value={prospectAddress}
                onChange={(e) => setProspectAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Reward Preference */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground block">
              Advocate Incentive Milestone Reward
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRewardType('cash_bonus')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  rewardType === 'cash_bonus'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="text-xs font-bold text-foreground flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                  <span>₹5,000 Cash Bonus</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Direct UPI/NEFT on install</div>
              </button>

              <button
                type="button"
                onClick={() => setRewardType('free_amc_cleaning')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  rewardType === 'free_amc_cleaning'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="text-xs font-bold text-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>1-Yr AMC Cleaning</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">4 deep washes included</div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Relationship / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Next-door neighbor saw the rooftop installation and asked for quotation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Submit Referral
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
