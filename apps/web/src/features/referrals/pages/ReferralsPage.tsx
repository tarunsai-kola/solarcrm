import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Award,
  Sparkles,
  Search,
  Plus,
  Share2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Zap,
  Phone,
  LayoutGrid,
  List,
  Eye,
  User,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  getLocalReferrals,
  getLocalAdvocates,
  updateReferral,
  ReferralLead,
  CustomerAdvocate,
  ReferralStatus,
  RewardStatus,
} from '../services/referrals-service';
import { LogReferralModal } from '../components/LogReferralModal';
import { AdvocateCard } from '../components/AdvocateCard';
import { ReferralDetailDrawer } from '../components/ReferralDetailDrawer';

export function ReferralsPage() {
  const navigate = useNavigate();

  // State
  const [referrals, setReferrals] = useState<ReferralLead[]>(() => getLocalReferrals());
  const [advocates, setAdvocates] = useState<CustomerAdvocate[]>(() => getLocalAdvocates());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_pipeline' | 'commissioned' | 'payout_ready'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [activeReferral, setActiveReferral] = useState<ReferralLead | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const matchesSearch =
        r.referred_prospect_name.toLowerCase().includes(search.toLowerCase()) ||
        r.referrer_customer_name.toLowerCase().includes(search.toLowerCase()) ||
        r.referral_code.toLowerCase().includes(search.toLowerCase()) ||
        r.referred_address.toLowerCase().includes(search.toLowerCase()) ||
        r.referred_city.toLowerCase().includes(search.toLowerCase());

      let matchesFilter = true;
      if (statusFilter === 'in_pipeline') {
        matchesFilter = ['lead_submitted', 'survey_completed', 'proposal_sent', 'contract_signed'].includes(r.status);
      } else if (statusFilter === 'commissioned') {
        matchesFilter = r.status === 'commissioned';
      } else if (statusFilter === 'payout_ready') {
        matchesFilter = r.reward_status === 'approved_for_payout';
      }

      return matchesSearch && matchesFilter;
    });
  }, [referrals, search, statusFilter]);

  // KPI Calculations
  const totalReferrals = referrals.length;
  const commissionedCount = referrals.filter((r) => r.status === 'commissioned').length;
  const totalRewardsPaid = referrals
    .filter((r) => r.reward_status === 'paid_out')
    .reduce((acc, r) => acc + r.reward_amount_inr, 0);
  const pipelineKw = referrals
    .filter((r) => r.status !== 'rejected')
    .reduce((acc, r) => acc + (r.estimated_system_kw || 0), 0)
    .toFixed(1);

  const handleUpdateStatus = (
    referralId: string,
    newStatus: ReferralStatus,
    rewardStatus?: RewardStatus | undefined
  ) => {
    const updates: Partial<ReferralLead> = { status: newStatus };
    if (rewardStatus) updates.reward_status = rewardStatus;

    const updated = updateReferral(referralId, updates);
    if (updated) {
      setReferrals(getLocalReferrals());
      setActiveReferral(updated);
    }
  };

  const handleConvertToQuote = (referral: ReferralLead) => {
    navigate(`/quotations?action=create&kwp=${referral.estimated_system_kw}&leadName=${encodeURIComponent(referral.referred_prospect_name)}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & CTAs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Gift className="h-4 w-4" />
            Customer Advocacy & Referral Engine
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Customer Referral & Loyalty Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turn satisfied rooftop solar customers into your highest-converting sales force with automated ₹5,000 cash payouts and free AMC cleaning rewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowLogModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Log Customer Referral</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Referral Leads</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">{totalReferrals}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Gift className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Commissioned Installs</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {commissionedCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rewards Paid Out</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">
                ₹{totalRewardsPaid.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">In-Pipeline Sizing</p>
              <h3 className="text-2xl font-bold text-primary font-mono mt-0.5">{pipelineKw} kWp</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advocates Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              VIP Solar Customer Advocates & Referral Codes
            </h3>
            <p className="text-xs text-muted-foreground">
              Existing customers actively earning ₹5,000 per rooftop conversion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {advocates.map((adv) => (
            <AdvocateCard key={adv.id} advocate={adv} />
          ))}
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by prospect, advocate, code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({referrals.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_pipeline')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'in_pipeline'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              In Pipeline
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('commissioned')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'commissioned'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Commissioned ({commissionedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('payout_ready')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'payout_ready'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ready for Payout
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Cards vs Table */}
      {filteredReferrals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Gift className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Referrals Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No referral leads match your current search criteria. Log a customer referral to start tracking rewards.
          </p>
          <Button size="sm" onClick={() => setShowLogModal(true)}>
            Log Customer Referral
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReferrals.map((ref) => (
            <Card
              key={ref.id}
              className="border-border shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {ref.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors">
                      {ref.referred_prospect_name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-foreground font-mono block">
                      {ref.estimated_system_kw} kWp
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{ref.reward_amount_inr.toLocaleString()} Reward
                    </span>
                  </div>
                </div>

                {/* Location & Referrer */}
                <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                  <div className="truncate text-foreground font-medium">
                    {ref.referred_address}, {ref.referred_city}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Advocate: <strong className="text-foreground">{ref.referrer_customer_name}</strong></span>
                    <span className="font-mono text-primary font-semibold">{ref.referral_code}</span>
                  </div>
                </div>

                {/* Reward Status Banner */}
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">Incentive Status:</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      ref.reward_status === 'paid_out'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : ref.reward_status === 'approved_for_payout'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ref.reward_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </CardContent>

              {/* Card Footer */}
              <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => setActiveReferral(ref)}
                  className="w-full text-xs h-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View & Manage
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5">Referred Prospect</th>
                  <th className="p-3.5">Advocate / Referrer</th>
                  <th className="p-3.5">Referral Code</th>
                  <th className="p-3.5">Estimated kWp</th>
                  <th className="p-3.5">Pipeline Status</th>
                  <th className="p-3.5">Reward Amount</th>
                  <th className="p-3.5">Payout Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{ref.referred_prospect_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {ref.referred_address}, {ref.referred_city}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{ref.referrer_customer_name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{ref.referrer_phone}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-primary">{ref.referral_code}</td>
                    <td className="p-3.5 font-mono font-bold text-foreground">{ref.estimated_system_kw} kWp</td>
                    <td className="p-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary">
                        {ref.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{ref.reward_amount_inr.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ref.reward_status === 'paid_out'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : ref.reward_status === 'approved_for_payout'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ref.reward_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveReferral(ref)}
                        className="text-xs h-7 px-2"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Referral Modal */}
      {showLogModal && (
        <LogReferralModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSuccess={(newRef) => {
            setReferrals(getLocalReferrals());
            setAdvocates(getLocalAdvocates());
            setShowLogModal(false);
          }}
        />
      )}

      {/* Referral Detail Drawer */}
      {activeReferral && (
        <ReferralDetailDrawer
          referral={activeReferral}
          isOpen={Boolean(activeReferral)}
          onClose={() => setActiveReferral(null)}
          onUpdateStatus={handleUpdateStatus}
          onConvertToQuote={handleConvertToQuote}
        />
      )}
    </div>
  );
}
