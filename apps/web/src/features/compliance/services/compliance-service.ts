export type ComplianceCategory =
  | 'kyc_discom'
  | 'engineering_bom'
  | 'commissioning_jir'
  | 'subsidy_dbt';

export type DocumentVerificationStatus =
  | 'pending_upload'
  | 'under_review'
  | 'verified_approved'
  | 'rejected';

export interface ComplianceDocument {
  id: string;
  project_id: string;
  customer_name: string;
  discom_name: string;
  consumer_number: string;
  category: ComplianceCategory;
  title: string;
  code: string;
  file_url?: string | undefined;
  file_type: 'pdf' | 'image' | 'cad';
  file_size_kb: number;
  status: DocumentVerificationStatus;
  verified_by?: string | undefined;
  verified_at?: string | undefined;
  rejection_reason?: string | undefined;
  is_mandatory_for_dbt: boolean;
  notes?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface CustomerComplianceDossier {
  customer_name: string;
  project_id: string;
  discom_name: string;
  consumer_number: string;
  system_capacity_kw: number;
  total_docs_count: number;
  verified_docs_count: number;
  dbt_readiness_percent: number;
  subsidy_claim_amount_inr: number;
}

const STORAGE_KEY = 'kola_solar_compliance_documents';

const SEED_COMPLIANCE_DOCS: ComplianceDocument[] = [
  // Harish Sundaram (5kWp - High Readiness)
  {
    id: 'doc-001',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM (Bangalore Electricity)',
    consumer_number: 'BES-10492819',
    category: 'kyc_discom',
    title: 'Customer Aadhaar Card & Identity Proof',
    code: 'DOC-KYC-01',
    file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    file_type: 'image',
    file_size_kb: 420,
    status: 'verified_approved',
    verified_by: 'Kola Compliance Lead',
    verified_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-002',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'kyc_discom',
    title: 'Latest BESCOM Paid Electricity Bill (CA Verified)',
    code: 'DOC-DISCOM-02',
    file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 850,
    status: 'verified_approved',
    verified_by: 'Kola Compliance Lead',
    verified_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-003',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'engineering_bom',
    title: 'ALMM & BIS Enlistment Certificate (Waaree 550Wp DCR)',
    code: 'DOC-ALMM-03',
    file_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 1240,
    status: 'verified_approved',
    verified_by: 'MNRE Certified Auditor',
    verified_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-004',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'engineering_bom',
    title: 'Inverter Type Test & Anti-Islanding Certificate (Sungrow)',
    code: 'DOC-INV-04',
    file_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 1100,
    status: 'verified_approved',
    verified_by: 'MNRE Certified Auditor',
    verified_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-005',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'commissioning_jir',
    title: 'BESCOM Bi-directional Net-Meter Joint Inspection Report (JIR)',
    code: 'DOC-JIR-05',
    file_url: 'https://images.unsplash.com/photo-1558441719-8b489c6ef2d1?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 1540,
    status: 'verified_approved',
    verified_by: 'BESCOM Executive Engineer',
    verified_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-006',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'subsidy_dbt',
    title: 'Geo-tagged Rooftop Solar Array Photo with Customer & Inverter',
    code: 'DOC-DBT-PHOTO-06',
    file_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
    file_type: 'image',
    file_size_kb: 2400,
    status: 'verified_approved',
    verified_by: 'National Solar Portal Verifier',
    verified_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-007',
    project_id: 'proj-001',
    customer_name: 'Harish Sundaram',
    discom_name: 'BESCOM',
    consumer_number: 'BES-10492819',
    category: 'subsidy_dbt',
    title: 'Customer Bank Cancelled Cheque (For ₹78,000 DBT)',
    code: 'DOC-BANK-07',
    file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    file_type: 'image',
    file_size_kb: 510,
    status: 'verified_approved',
    verified_by: 'Kola Finance Desk',
    verified_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },

  // Pooja Hegde (8kWp - Under Review)
  {
    id: 'doc-101',
    project_id: 'proj-002',
    customer_name: 'Pooja Hegde',
    discom_name: 'BESCOM',
    consumer_number: 'BES-88419201',
    category: 'kyc_discom',
    title: 'Customer PAN Card & Property Tax Receipt',
    code: 'DOC-KYC-01',
    file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    file_type: 'image',
    file_size_kb: 390,
    status: 'verified_approved',
    verified_by: 'Kola Compliance Lead',
    verified_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-102',
    project_id: 'proj-002',
    customer_name: 'Pooja Hegde',
    discom_name: 'BESCOM',
    consumer_number: 'BES-88419201',
    category: 'engineering_bom',
    title: 'Structural Wind-Load Stability & STAD PRO Certificate (150 km/h)',
    code: 'DOC-STAD-02',
    file_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 1800,
    status: 'under_review',
    notes: 'Structural engineer signature verified; waiting for Chartered Engineer seal.',
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-103',
    project_id: 'proj-002',
    customer_name: 'Pooja Hegde',
    discom_name: 'BESCOM',
    consumer_number: 'BES-88419201',
    category: 'commissioning_jir',
    title: 'Earth Resistance Test Report (< 2 Ohms Certificate)',
    code: 'DOC-EARTH-03',
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 720,
    status: 'under_review',
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'doc-104',
    project_id: 'proj-002',
    customer_name: 'Pooja Hegde',
    discom_name: 'BESCOM',
    consumer_number: 'BES-88419201',
    category: 'subsidy_dbt',
    title: 'National Portal PM Surya Ghar Registration Slip',
    code: 'DOC-NAT-PORTAL-04',
    file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    file_type: 'pdf',
    file_size_kb: 640,
    status: 'verified_approved',
    verified_by: 'Kola Subsidy Desk',
    verified_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },

  // Vikram Mehta (20kWp Commercial - Needs Re-upload)
  {
    id: 'doc-201',
    project_id: 'proj-003',
    customer_name: 'Vikram Mehta (Mehta Industries)',
    discom_name: 'BESCOM (HT/LT Commercial)',
    consumer_number: 'BES-99210492',
    category: 'engineering_bom',
    title: 'Single Line Electrical Diagram (SLD) Approved by CEIG / Electrical Inspector',
    code: 'DOC-CEIG-SLD-01',
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    file_type: 'cad',
    file_size_kb: 3400,
    status: 'rejected',
    rejection_reason: 'Chief Electrical Inspector (CEIG) stamp missing on sheet 2 of 4-Pole breaker details.',
    is_mandatory_for_dbt: true,
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

export function getLocalComplianceDocs(): ComplianceDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPLIANCE_DOCS));
      return SEED_COMPLIANCE_DOCS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_COMPLIANCE_DOCS;
  }
}

export function saveLocalComplianceDocs(docs: ComplianceDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save compliance docs to localStorage', err);
  }
}

export function getCustomerDossiers(): CustomerComplianceDossier[] {
  const docs = getLocalComplianceDocs();
  const customerMap = new Map<string, ComplianceDocument[]>();

  docs.forEach((d) => {
    const key = d.customer_name;
    if (!customerMap.has(key)) customerMap.set(key, []);
    customerMap.get(key)!.push(d);
  });

  const dossiers: CustomerComplianceDossier[] = [];

  customerMap.forEach((customerDocs, customerName) => {
    const first = customerDocs[0];
    if (!first) return;

    const total = customerDocs.length;
    const verified = customerDocs.filter((d) => d.status === 'verified_approved').length;
    const readiness = Math.round((verified / total) * 100);

    dossiers.push({
      customer_name: customerName,
      project_id: first.project_id,
      discom_name: first.discom_name,
      consumer_number: first.consumer_number,
      system_capacity_kw: customerName.includes('Harish') ? 5.0 : customerName.includes('Pooja') ? 8.0 : 20.0,
      total_docs_count: total,
      verified_docs_count: verified,
      dbt_readiness_percent: readiness,
      subsidy_claim_amount_inr: 78000,
    });
  });

  return dossiers;
}

export function uploadComplianceDoc(input: {
  customer_name: string;
  project_id: string;
  discom_name: string;
  consumer_number: string;
  category: ComplianceCategory;
  title: string;
  code: string;
  file_type?: 'pdf' | 'image' | 'cad' | undefined;
  file_url?: string | undefined;
  notes?: string | undefined;
}): ComplianceDocument {
  const docs = getLocalComplianceDocs();
  const id = `doc-${Date.now()}`;
  const now = new Date().toISOString();

  const newDoc: ComplianceDocument = {
    id,
    project_id: input.project_id || 'proj-general',
    customer_name: input.customer_name,
    discom_name: input.discom_name,
    consumer_number: input.consumer_number,
    category: input.category,
    title: input.title,
    code: input.code,
    file_type: input.file_type || 'pdf',
    file_url: input.file_url || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    file_size_kb: Math.floor(400 + Math.random() * 1200),
    status: 'under_review',
    is_mandatory_for_dbt: true,
    notes: input.notes || 'Uploaded via compliance vault.',
    created_at: now,
    updated_at: now,
  };

  const updated = [newDoc, ...docs];
  saveLocalComplianceDocs(updated);
  return newDoc;
}

export function updateComplianceDoc(id: string, updates: Partial<ComplianceDocument>): ComplianceDocument | null {
  const docs = getLocalComplianceDocs();
  const index = docs.findIndex((d) => d.id === id);
  const existing = docs[index];
  if (index === -1 || !existing) return null;

  const updatedDoc: ComplianceDocument = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'verified_approved' && !updatedDoc.verified_at) {
    updatedDoc.verified_at = new Date().toISOString();
    updatedDoc.verified_by = updatedDoc.verified_by || 'Kola Compliance Officer';
    updatedDoc.rejection_reason = undefined;
  }

  docs[index] = updatedDoc;
  saveLocalComplianceDocs(docs);
  return updatedDoc;
}
