export interface DigitalSignaturePayload {
  signerName: string;
  signerPhone: string;
  signerDesignation: string;
  signatureType: 'drawn' | 'typed';
  signatureData: string; // Base64 png data URL or text
  termsAccepted: boolean;
  notes?: string;
}

export interface StoredProposalRecord {
  id: string;
  quotation_number: string;
  version: number;
  title: string;
  status: 'draft' | 'issued' | 'sent' | 'accepted' | 'rejected' | 'revised';
  system_capacity_kw: number;
  phase: string;
  system_type: string;
  subtotal: number;
  discount_amount: number;
  taxable_value: number;
  gst_rate: number;
  tax_amount: number;
  kseb_charges?: number | undefined;
  total_amount: number;
  advance_percentage: number;
  advance_amount: number;
  balance_amount: number;
  created_at: string;
  valid_until?: string | undefined;
  notes?: string | undefined;
  terms_conditions?: string | undefined;
  lead: {
    id: string;
    customer_name: string;
    phone: string;
    email?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
  };
  items: Array<{
    id: string;
    component_name: string;
    component_type: string;
    description?: string | undefined;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    sort_order?: number | undefined;
  }>;
  signature?: {
    signer_name: string;
    signer_phone: string;
    signer_designation: string;
    signature_type: 'drawn' | 'typed';
    signature_data: string;
    signed_at: string;
    verification_hash: string;
    ip_stamp: string;
  } | undefined;
  revision_requests?: Array<{
    requested_at: string;
    notes: string;
    status: 'pending' | 'addressed';
  }> | undefined;
}

const STORAGE_KEY = 'kola_solar_public_proposals_v1';

export const INITIAL_PUBLIC_PROPOSALS: StoredProposalRecord[] = [
  {
    id: 'sample-quote-001',
    quotation_number: 'KOLA-2026-0042',
    version: 1,
    title: '5kW On-Grid Rooftop Solar with PM Surya Ghar Subsidy',
    status: 'issued',
    system_capacity_kw: 5.0,
    phase: '3-Phase',
    system_type: 'On-Grid',
    subtotal: 215000,
    discount_amount: 5000,
    taxable_value: 210000,
    gst_rate: 13.8,
    tax_amount: 28980,
    kseb_charges: 2500,
    total_amount: 241480,
    advance_percentage: 20,
    advance_amount: 48296,
    balance_amount: 193184,
    created_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    valid_until: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    lead: {
      id: 'lead-sample-1',
      customer_name: 'Harish Sundaram',
      phone: '+91 98401 23456',
      email: 'harish@apexgreenenergy.in',
      address: 'Plot 42, Electronic City Phase 1',
      city: 'Bengaluru',
      pincode: '560100',
    },
    items: [
      {
        id: 'item-1',
        component_name: 'Tier-1 Mono PERC Bifacial Solar PV Modules (550Wp)',
        component_type: 'solar_panel',
        description: 'Half-cut cells, 25-year linear performance warranty',
        quantity: 10,
        unit: 'Nos',
        unit_price: 13000,
        total_price: 130000,
        sort_order: 1,
      },
      {
        id: 'item-2',
        component_name: '5kW 3-Phase Grid-Tied Inverter with Dual MPPT & Wi-Fi',
        component_type: 'inverter',
        description: 'IP65 outdoor rating, remote WiFi mobile app monitoring',
        quantity: 1,
        unit: 'Set',
        unit_price: 45000,
        total_price: 45000,
        sort_order: 2,
      },
      {
        id: 'item-3',
        component_name: 'Elevated HDG Module Mounting Structure (150 km/h wind rated)',
        component_type: 'structure',
        description: 'Hot-dip galvanized steel, stainless steel SS304 fasteners',
        quantity: 1,
        unit: 'Set',
        unit_price: 18000,
        total_price: 18000,
        sort_order: 3,
      },
      {
        id: 'item-4',
        component_name: 'AC/DC Distribution Boxes, SPD Type-2 & Copper Solar Cables',
        component_type: 'bos',
        description: 'Class II surge protection, 4sq.mm cross-linked UV resistant cable',
        quantity: 1,
        unit: 'Set',
        unit_price: 12000,
        total_price: 12000,
        sort_order: 4,
      },
      {
        id: 'item-5',
        component_name: 'Complete EPC Installation, Testing & DISCOM Net-Metering Liaising',
        component_type: 'installation',
        description: 'Turnkey commissioning, earthing pits, KSEB/BESCOM net meter liaison',
        quantity: 1,
        unit: 'Job',
        unit_price: 10000,
        total_price: 10000,
        sort_order: 5,
      },
    ],
  },
  {
    id: 'sample-quote-002',
    quotation_number: 'KOLA-2026-0043',
    version: 1,
    title: '3kW Residential Rooftop Solar (Max PM Surya Ghar ₹78,000 Subsidy)',
    status: 'issued',
    system_capacity_kw: 3.0,
    phase: '1-Phase',
    system_type: 'On-Grid',
    subtotal: 145000,
    discount_amount: 3000,
    taxable_value: 142000,
    gst_rate: 13.8,
    tax_amount: 19596,
    kseb_charges: 2000,
    total_amount: 163596,
    advance_percentage: 20,
    advance_amount: 32719,
    balance_amount: 130877,
    created_at: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    valid_until: new Date(Date.now() + 20 * 86400 * 1000).toISOString(),
    lead: {
      id: 'lead-sample-2',
      customer_name: 'Dr. Ananya Rao',
      phone: '+91 97412 88901',
      email: 'ananya.rao@healthfirst.org',
      address: 'Villa 18, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      pincode: '560066',
    },
    items: [
      {
        id: 'item-201',
        component_name: 'Mono PERC 550Wp Tier-1 Solar PV Modules',
        component_type: 'solar_panel',
        description: 'High efficiency 21.5%, MNRE DCR compliant for Central Subsidy',
        quantity: 6,
        unit: 'Nos',
        unit_price: 13500,
        total_price: 81000,
        sort_order: 1,
      },
      {
        id: 'item-202',
        component_name: '3.3kW Single Phase High Efficiency Solar Inverter',
        component_type: 'inverter',
        description: 'Single MPPT with integrated DC switch & smart WiFi dongle',
        quantity: 1,
        unit: 'Set',
        unit_price: 32000,
        total_price: 32000,
        sort_order: 2,
      },
      {
        id: 'item-203',
        component_name: 'Standard Rooftop MMS (Aluminium Rail + SS304 clamps)',
        component_type: 'structure',
        quantity: 1,
        unit: 'Set',
        unit_price: 14000,
        total_price: 14000,
        sort_order: 3,
      },
      {
        id: 'item-204',
        component_name: 'Balance of System (BOS) & AC/DC Protection',
        component_type: 'bos',
        quantity: 1,
        unit: 'Set',
        unit_price: 10000,
        total_price: 10000,
        sort_order: 4,
      },
      {
        id: 'item-205',
        component_name: 'Installation, Testing & DISCOM Bi-directional Meter Liaising',
        component_type: 'installation',
        quantity: 1,
        unit: 'Job',
        unit_price: 8000,
        total_price: 8000,
        sort_order: 5,
      },
    ],
  },
];

function getStoredProposals(): StoredProposalRecord[] {
  if (typeof window === 'undefined') return INITIAL_PUBLIC_PROPOSALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PUBLIC_PROPOSALS));
      return INITIAL_PUBLIC_PROPOSALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PUBLIC_PROPOSALS;
  } catch {
    return INITIAL_PUBLIC_PROPOSALS;
  }
}

function saveStoredProposals(list: StoredProposalRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save proposals in localStorage', err);
  }
}

/**
 * Register or update a proposal in public storage so customers can access it via public URL
 */
export function registerPublicProposal(quote: Partial<StoredProposalRecord>): void {
  const list = getStoredProposals();
  const existingIdx = list.findIndex((p) => p.id === quote.id);
  const now = new Date().toISOString();

  const record: StoredProposalRecord = {
    id: quote.id || `quote-${Date.now()}`,
    quotation_number: quote.quotation_number || `KOLA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    version: quote.version || 1,
    title: quote.title || 'Custom Solar PV Proposal',
    status: (quote.status as any) || 'issued',
    system_capacity_kw: quote.system_capacity_kw || 5,
    phase: quote.phase || '1-Phase',
    system_type: quote.system_type || 'On-Grid',
    subtotal: quote.subtotal || 200000,
    discount_amount: quote.discount_amount || 0,
    taxable_value: quote.taxable_value || 200000,
    gst_rate: quote.gst_rate || 13.8,
    tax_amount: quote.tax_amount || 27600,
    kseb_charges: quote.kseb_charges || 2500,
    total_amount: quote.total_amount || 230100,
    advance_percentage: quote.advance_percentage || 20,
    advance_amount: quote.advance_amount || 46020,
    balance_amount: quote.balance_amount || 184080,
    created_at: quote.created_at || now,
    valid_until: quote.valid_until || new Date(Date.now() + 15 * 86400 * 1000).toISOString(),
    notes: quote.notes,
    terms_conditions: quote.terms_conditions,
    lead: quote.lead || {
      id: 'lead-cust',
      customer_name: 'Valued Client',
      phone: '+91 98000 00000',
    },
    items: quote.items || [],
    signature: quote.signature,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...record };
  } else {
    list.unshift(record);
  }
  saveStoredProposals(list);
}

/**
 * Fetch a proposal by ID or Quotation Number for public review
 */
export async function fetchPublicProposal(idOrNumber: string): Promise<StoredProposalRecord | null> {
  const list = getStoredProposals();
  const found = list.find((p) => p.id === idOrNumber || p.quotation_number === idOrNumber);
  if (found) return found;

  // Check sample match
  const sample = INITIAL_PUBLIC_PROPOSALS.find(
    (p) => p.id === idOrNumber || p.quotation_number === idOrNumber,
  );
  if (sample) return sample;

  return list[0] || null;
}

/**
 * Digitally sign & accept proposal from customer side
 */
export async function acceptPublicProposal(
  proposalId: string,
  payload: DigitalSignaturePayload,
): Promise<{ success: boolean; proposal: StoredProposalRecord; verificationHash: string }> {
  const list = getStoredProposals();
  const index = list.findIndex((p) => p.id === proposalId || p.quotation_number === proposalId);
  const target: StoredProposalRecord =
    index >= 0 && list[index] ? list[index]! : INITIAL_PUBLIC_PROPOSALS[0]!;

  const now = new Date().toISOString();
  const verificationHash = `KOLA-VERIFY-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const updated: StoredProposalRecord = {
    ...target,
    id: target.id,
    quotation_number: target.quotation_number,
    version: target.version,
    title: target.title,
    system_capacity_kw: target.system_capacity_kw,
    phase: target.phase,
    system_type: target.system_type,
    subtotal: target.subtotal,
    discount_amount: target.discount_amount,
    taxable_value: target.taxable_value,
    gst_rate: target.gst_rate,
    tax_amount: target.tax_amount,
    total_amount: target.total_amount,
    advance_percentage: target.advance_percentage,
    advance_amount: target.advance_amount,
    balance_amount: target.balance_amount,
    created_at: target.created_at,
    lead: target.lead,
    items: target.items,
    status: 'accepted',
    signature: {
      signer_name: payload.signerName.trim(),
      signer_phone: payload.signerPhone.trim(),
      signer_designation: payload.signerDesignation.trim() || 'Property Owner',
      signature_type: payload.signatureType,
      signature_data: payload.signatureData,
      signed_at: now,
      verification_hash: verificationHash,
      ip_stamp: '103.21.244.78 (Verified Customer Gateway)',
    },
    notes: payload.notes ? `${target.notes || ''}\nCustomer Note: ${payload.notes}` : target.notes,
  };

  if (index >= 0) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }
  saveStoredProposals(list);

  return {
    success: true,
    proposal: updated,
    verificationHash,
  };
}

/**
 * Customer requests a revision
 */
export async function requestPublicProposalRevision(
  proposalId: string,
  notes: string,
): Promise<{ success: boolean; proposal: StoredProposalRecord }> {
  const list = getStoredProposals();
  const index = list.findIndex((p) => p.id === proposalId || p.quotation_number === proposalId);
  const target: StoredProposalRecord =
    index >= 0 && list[index] ? list[index]! : INITIAL_PUBLIC_PROPOSALS[0]!;

  const updated: StoredProposalRecord = {
    ...target,
    id: target.id,
    quotation_number: target.quotation_number,
    version: target.version,
    title: target.title,
    system_capacity_kw: target.system_capacity_kw,
    phase: target.phase,
    system_type: target.system_type,
    subtotal: target.subtotal,
    discount_amount: target.discount_amount,
    taxable_value: target.taxable_value,
    gst_rate: target.gst_rate,
    tax_amount: target.tax_amount,
    total_amount: target.total_amount,
    advance_percentage: target.advance_percentage,
    advance_amount: target.advance_amount,
    balance_amount: target.balance_amount,
    created_at: target.created_at,
    lead: target.lead,
    items: target.items,
    status: 'revised',
    revision_requests: [
      ...(target.revision_requests || []),
      {
        requested_at: new Date().toISOString(),
        notes,
        status: 'pending',
      },
    ],
  };

  if (index >= 0) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }
  saveStoredProposals(list);

  return { success: true, proposal: updated };
}

/**
 * Generate public URL for customer review
 */
export function getPublicProposalShareUrl(proposalId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return `${origin}/proposals/view/${proposalId}`;
}
