export type ReferralStatus =
  | 'lead_submitted'
  | 'survey_completed'
  | 'proposal_sent'
  | 'contract_signed'
  | 'commissioned'
  | 'rejected';

export type RewardStatus = 'pending_milestone' | 'approved_for_payout' | 'paid_out';
export type RewardType = 'cash_bonus' | 'free_amc_cleaning' | 'bill_credit';

export interface ReferralLead {
  id: string;
  referral_code: string;
  referrer_customer_id: string;
  referrer_customer_name: string;
  referrer_phone: string;
  referred_prospect_name: string;
  referred_phone: string;
  referred_email?: string | undefined;
  referred_address: string;
  referred_city: string;
  estimated_system_kw: number;
  status: ReferralStatus;
  reward_type: RewardType;
  reward_amount_inr: number;
  reward_status: RewardStatus;
  payout_reference?: string | undefined;
  notes?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface CustomerAdvocate {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  installed_system_kw: number;
  referral_code: string;
  total_referrals_count: number;
  successful_conversions_count: number;
  total_rewards_earned_inr: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Solar Champion';
}

const STORAGE_KEY_REFERRALS = 'kola_solar_customer_referrals';
const STORAGE_KEY_ADVOCATES = 'kola_solar_customer_advocates';

const SEED_ADVOCATES: CustomerAdvocate[] = [
  {
    id: 'adv-001',
    customer_name: 'Harish Sundaram',
    phone: '+91 98401 23456',
    city: 'Bengaluru',
    installed_system_kw: 5.0,
    referral_code: 'KOLA-HARISH-5K',
    total_referrals_count: 4,
    successful_conversions_count: 2,
    total_rewards_earned_inr: 10000,
    tier: 'Gold',
  },
  {
    id: 'adv-002',
    customer_name: 'Pooja Hegde',
    phone: '+91 97412 88990',
    city: 'Bengaluru',
    installed_system_kw: 8.0,
    referral_code: 'KOLA-POOJA-8K',
    total_referrals_count: 5,
    successful_conversions_count: 3,
    total_rewards_earned_inr: 15000,
    tier: 'Solar Champion',
  },
  {
    id: 'adv-003',
    customer_name: 'Dr. Ramesh Kulkarni',
    phone: '+91 94480 33445',
    city: 'Bengaluru',
    installed_system_kw: 3.3,
    referral_code: 'KOLA-RAMESH-3K',
    total_referrals_count: 2,
    successful_conversions_count: 1,
    total_rewards_earned_inr: 5000,
    tier: 'Silver',
  },
  {
    id: 'adv-004',
    customer_name: 'Vikram Mehta (Mehta Industries)',
    phone: '+91 98200 11223',
    city: 'Bengaluru',
    installed_system_kw: 20.0,
    referral_code: 'KOLA-MEHTA-20K',
    total_referrals_count: 3,
    successful_conversions_count: 1,
    total_rewards_earned_inr: 10000,
    tier: 'Silver',
  },
];

const SEED_REFERRALS: ReferralLead[] = [
  {
    id: 'ref-001',
    referral_code: 'KOLA-HARISH-5K',
    referrer_customer_id: 'adv-001',
    referrer_customer_name: 'Harish Sundaram',
    referrer_phone: '+91 98401 23456',
    referred_prospect_name: 'Naveen Chandran (Neighbor)',
    referred_phone: '+91 98402 99881',
    referred_email: 'naveen.chandran@gmail.com',
    referred_address: 'Plot 45, 14th Cross, Electronic City Phase 1',
    referred_city: 'Bengaluru',
    estimated_system_kw: 5.0,
    status: 'commissioned',
    reward_type: 'cash_bonus',
    reward_amount_inr: 5000,
    reward_status: 'paid_out',
    payout_reference: 'UPI/20260412/99482910',
    notes: '5kWp rooftop commissioned on 14th April. ₹5,000 cashback credited to Harish bank account.',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ref-002',
    referral_code: 'KOLA-POOJA-8K',
    referrer_customer_id: 'adv-002',
    referrer_customer_name: 'Pooja Hegde',
    referrer_phone: '+91 97412 88990',
    referred_prospect_name: 'Karthik Subbaraj (Brother-in-law)',
    referred_phone: '+91 99001 23490',
    referred_email: 'karthik.subbu@outlook.com',
    referred_address: 'Villa 42, Palm Meadows, Whitefield',
    referred_city: 'Bengaluru',
    estimated_system_kw: 6.0,
    status: 'commissioned',
    reward_type: 'cash_bonus',
    reward_amount_inr: 5000,
    reward_status: 'approved_for_payout',
    notes: 'System net-metered last week. PM Surya Ghar subsidy applied. ₹5,000 incentive approved for NEFT disbursement.',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ref-003',
    referral_code: 'KOLA-POOJA-8K',
    referrer_customer_id: 'adv-002',
    referrer_customer_name: 'Pooja Hegde',
    referrer_phone: '+91 97412 88990',
    referred_prospect_name: 'Sangeetha Rao',
    referred_phone: '+91 98450 11992',
    referred_address: 'Row House 9, Prestige Ozone, Whitefield',
    referred_city: 'Bengaluru',
    estimated_system_kw: 4.5,
    status: 'contract_signed',
    reward_type: 'free_amc_cleaning',
    reward_amount_inr: 5000,
    reward_status: 'pending_milestone',
    notes: 'Contract signed and 20% advance received. Commissioning scheduled next week.',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ref-004',
    referral_code: 'KOLA-HARISH-5K',
    referrer_customer_id: 'adv-001',
    referrer_customer_name: 'Harish Sundaram',
    referrer_phone: '+91 98401 23456',
    referred_prospect_name: 'Deepak Nambiar',
    referred_phone: '+91 98110 55442',
    referred_address: '102, Shriram Summit, Electronic City',
    referred_city: 'Bengaluru',
    estimated_system_kw: 3.3,
    status: 'proposal_sent',
    reward_type: 'cash_bonus',
    reward_amount_inr: 5000,
    reward_status: 'pending_milestone',
    notes: 'Site survey completed. 3.3kW proposal sent with PM Surya Ghar subsidy estimate.',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ref-005',
    referral_code: 'KOLA-RAMESH-3K',
    referrer_customer_id: 'adv-003',
    referrer_customer_name: 'Dr. Ramesh Kulkarni',
    referrer_phone: '+91 94480 33445',
    referred_prospect_name: 'Prof. S. R. Murthy',
    referred_phone: '+91 94490 88221',
    referred_address: '45, 11th Cross, Margosa Road, Malleshwaram',
    referred_city: 'Bengaluru',
    estimated_system_kw: 3.0,
    status: 'lead_submitted',
    reward_type: 'cash_bonus',
    reward_amount_inr: 5000,
    reward_status: 'pending_milestone',
    notes: 'New referral submitted by Dr. Kulkarni. Initial sales consultation pending.',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

export function getLocalAdvocates(): CustomerAdvocate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADVOCATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADVOCATES, JSON.stringify(SEED_ADVOCATES));
      return SEED_ADVOCATES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADVOCATES;
  }
}

export function getLocalReferrals(): ReferralLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(SEED_REFERRALS));
      return SEED_REFERRALS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_REFERRALS;
  }
}

export function saveLocalReferrals(referrals: ReferralLead[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(referrals));
  } catch (err) {
    console.error('Failed to save referrals to localStorage', err);
  }
}

export function saveLocalAdvocates(advocates: CustomerAdvocate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADVOCATES, JSON.stringify(advocates));
  } catch (err) {
    console.error('Failed to save advocates to localStorage', err);
  }
}

export function createReferral(input: {
  referrer_customer_name: string;
  referrer_phone: string;
  referred_prospect_name: string;
  referred_phone: string;
  referred_address: string;
  referred_city: string;
  estimated_system_kw: number;
  reward_type: RewardType;
  notes?: string | undefined;
}): ReferralLead {
  const referrals = getLocalReferrals();
  const advocates = getLocalAdvocates();
  const id = `ref-${Date.now()}`;
  const now = new Date().toISOString();

  // Find or create advocate
  let advocate = advocates.find((a) => a.phone === input.referrer_phone || a.customer_name === input.referrer_customer_name);
  if (!advocate) {
    const code = `KOLA-${input.referrer_customer_name.split(' ')[0]?.toUpperCase() || 'SOLAR'}-${Math.floor(100 + Math.random() * 900)}`;
    advocate = {
      id: `adv-${Date.now()}`,
      customer_name: input.referrer_customer_name,
      phone: input.referrer_phone,
      city: input.referred_city,
      installed_system_kw: input.estimated_system_kw,
      referral_code: code,
      total_referrals_count: 1,
      successful_conversions_count: 0,
      total_rewards_earned_inr: 0,
      tier: 'Bronze',
    };
    saveLocalAdvocates([advocate, ...advocates]);
  } else {
    advocate.total_referrals_count += 1;
    saveLocalAdvocates([...advocates]);
  }

  const rewardAmount = input.estimated_system_kw >= 15 ? 10000 : 5000;

  const newReferral: ReferralLead = {
    id,
    referral_code: advocate.referral_code,
    referrer_customer_id: advocate.id,
    referrer_customer_name: advocate.customer_name,
    referrer_phone: advocate.phone,
    referred_prospect_name: input.referred_prospect_name,
    referred_phone: input.referred_phone,
    referred_address: input.referred_address,
    referred_city: input.referred_city,
    estimated_system_kw: input.estimated_system_kw,
    status: 'lead_submitted',
    reward_type: input.reward_type,
    reward_amount_inr: rewardAmount,
    reward_status: 'pending_milestone',
    notes: input.notes || 'Referred via customer advocate portal.',
    created_at: now,
    updated_at: now,
  };

  const updated = [newReferral, ...referrals];
  saveLocalReferrals(updated);
  return newReferral;
}

export function updateReferral(id: string, updates: Partial<ReferralLead>): ReferralLead | null {
  const referrals = getLocalReferrals();
  const index = referrals.findIndex((r) => r.id === id);
  const existing = referrals[index];
  if (index === -1 || !existing) return null;

  const updatedRef: ReferralLead = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };

  referrals[index] = updatedRef;
  saveLocalReferrals(referrals);
  return updatedRef;
}
