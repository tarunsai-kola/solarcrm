export type InquiryStatus =
  | 'new'
  | 'assigned'
  | 'contacted'
  | 'demo_scheduled'
  | 'converted'
  | 'disqualified';

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string | undefined;
  activeLeadsCount?: number | undefined;
}

export interface InquiryActivityLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string | undefined;
}

export interface LandingInquiry {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string | undefined;
  state?: string | undefined;
  pincode?: string | undefined;
  company_name?: string | undefined;
  business_type?: 'residential' | 'commercial' | 'epc' | 'distributor' | 'installer' | undefined;
  lead_volume?: string | undefined;
  monthly_bill?: string | undefined;
  system_interest?: string | undefined;
  notes?: string | undefined;
  status: InquiryStatus;
  assigned_salesperson_id?: string | null | undefined;
  assigned_salesperson_name?: string | null | undefined;
  assigned_salesperson_email?: string | null | undefined;
  assigned_salesperson_role?: string | null | undefined;
  assigned_at?: string | null | undefined;
  created_at: string;
  updated_at: string;
  source: string;
  synced_to_crm?: boolean | undefined;
  crm_lead_id?: string | null | undefined;
  activity_log: InquiryActivityLog[];
}

export const DEFAULT_SALESPERSONS: Salesperson[] = [
  {
    id: 'sp-1',
    name: 'Priya Patel',
    email: 'priya.patel@kolasoftware.com',
    phone: '+91 98201 14230',
    role: 'Senior Inbound Sales Manager',
    activeLeadsCount: 14,
  },
  {
    id: 'sp-2',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@kolasoftware.com',
    phone: '+91 98110 98741',
    role: 'Solar EPC Account Director',
    activeLeadsCount: 19,
  },
  {
    id: 'sp-3',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@kolasoftware.com',
    phone: '+91 98765 43210',
    role: 'Commercial Rooftop Specialist',
    activeLeadsCount: 11,
  },
  {
    id: 'sp-4',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@kolasoftware.com',
    phone: '+91 99887 76655',
    role: 'Field Technical Surveyor',
    activeLeadsCount: 8,
  },
  {
    id: 'sp-5',
    name: 'Devendra Singh',
    email: 'devendra.singh@kolasoftware.com',
    phone: '+91 91234 56789',
    role: 'Solar Solutions Architect',
    activeLeadsCount: 15,
  },
];

const STORAGE_KEY = 'kola_solar_landing_inquiries_v1';

const INITIAL_DEMO_INQUIRIES: LandingInquiry[] = [
  {
    id: 'inq-101',
    customer_name: 'Harish Sundaram',
    email: 'harish@apexgreenenergy.in',
    phone: '+91 98401 23456',
    address: 'Plot 42, Electronic City Phase 1, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    company_name: 'Apex Green Energy Solutions',
    business_type: 'epc',
    lead_volume: '50-100 leads/month',
    monthly_bill: '₹75,000+',
    system_interest: '50 kW - 100 kW Commercial Rooftops',
    notes: 'Interested in Kola Solar VCRM automated proposal builder and field survey app for our 12 field engineers in South India.',
    status: 'new',
    assigned_salesperson_id: null,
    assigned_salesperson_name: null,
    assigned_salesperson_email: null,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    source: 'Kola Promotional Landing Page',
    synced_to_crm: false,
    activity_log: [
      {
        id: 'act-1',
        action: 'Inquiry Submitted',
        actor: 'Harish Sundaram (Website)',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        details: 'Submitted demo request from Kola Software promo landing page.',
      },
    ],
  },
  {
    id: 'inq-102',
    customer_name: 'Sunita Deshmukh',
    email: 'sunita.d@sunvanguard.com',
    phone: '+91 98205 67890',
    address: 'Building B-4, MIDC Industrial Area, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    company_name: 'SunVanguard Solar Power Ltd',
    business_type: 'commercial',
    lead_volume: '100-250 leads/month',
    monthly_bill: '₹1,50,000+',
    system_interest: '150 kW Industrial Solar with Battery Storage',
    notes: 'Requires DISCOM net-metering subsidy tracker, WhatsApp automatic quote dispatcher, and technician dispatch scheduling.',
    status: 'assigned',
    assigned_salesperson_id: 'sp-1',
    assigned_salesperson_name: 'Priya Patel',
    assigned_salesperson_email: 'priya.patel@kolasoftware.com',
    assigned_salesperson_role: 'Senior Inbound Sales Manager',
    assigned_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    source: 'Kola Promotional Landing Page',
    synced_to_crm: true,
    activity_log: [
      {
        id: 'act-2',
        action: 'Inquiry Submitted',
        actor: 'Sunita Deshmukh (Website)',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        details: 'Submitted high-intent enterprise demo request.',
      },
      {
        id: 'act-3',
        action: 'Assigned to Salesperson',
        actor: 'Admin',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        details: 'Assigned to Priya Patel (Senior Inbound Sales Manager).',
      },
    ],
  },
  {
    id: 'inq-103',
    customer_name: 'Amitabh Sen',
    email: 'amitabh@helioscleantech.org',
    phone: '+91 98114 55432',
    address: 'Sector 44, Near Huda City Centre',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122003',
    company_name: 'Helios CleanTech Developers',
    business_type: 'epc',
    lead_volume: '250+ leads/month',
    monthly_bill: '₹3,00,000+',
    system_interest: 'Utility & High-rise Commercial Solar',
    notes: 'Needs enterprise multi-branch access, role-based CRM portals, and direct ERP/SAP integration.',
    status: 'contacted',
    assigned_salesperson_id: 'sp-2',
    assigned_salesperson_name: 'Rajesh Kumar',
    assigned_salesperson_email: 'rajesh.kumar@kolasoftware.com',
    assigned_salesperson_role: 'Solar EPC Account Director',
    assigned_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    source: 'Kola Promotional Landing Page',
    synced_to_crm: true,
    activity_log: [
      {
        id: 'act-4',
        action: 'Inquiry Submitted',
        actor: 'Amitabh Sen (Website)',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
      {
        id: 'act-5',
        action: 'Assigned to Salesperson',
        actor: 'Admin',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        details: 'Assigned to Rajesh Kumar.',
      },
      {
        id: 'act-6',
        action: 'Discovery Call Completed',
        actor: 'Rajesh Kumar',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        details: 'Completed 30-min discovery call. Demo scheduled for Friday 3 PM.',
      },
    ],
  },
  {
    id: 'inq-104',
    customer_name: 'Kavita Reddy',
    email: 'kavita@deccansolar.co',
    phone: '+91 99490 87654',
    address: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    company_name: 'Deccan Solar Residential',
    business_type: 'residential',
    lead_volume: '30-50 leads/month',
    monthly_bill: '₹25,000',
    system_interest: 'Residential Rooftops (5kW - 15kW)',
    notes: 'Switching away from generic spreadsheets. Want our 4 residential sales agents to generate instant consumer ROI quotes on site.',
    status: 'demo_scheduled',
    assigned_salesperson_id: 'sp-3',
    assigned_salesperson_name: 'Vikram Malhotra',
    assigned_salesperson_email: 'vikram.malhotra@kolasoftware.com',
    assigned_salesperson_role: 'Commercial Rooftop Specialist',
    assigned_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    source: 'Kola Promotional Landing Page',
    synced_to_crm: true,
    activity_log: [
      {
        id: 'act-7',
        action: 'Demo Scheduled',
        actor: 'Vikram Malhotra',
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        details: 'Live software walkthrough scheduled with Deccan Solar leadership.',
      },
    ],
  },
];

export function getLandingInquiries(): LandingInquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_INQUIRIES));
      return INITIAL_DEMO_INQUIRIES;
    }
    const parsed = JSON.parse(raw) as LandingInquiry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_INQUIRIES;
  } catch (err) {
    console.error('Failed to load landing inquiries from storage:', err);
    return INITIAL_DEMO_INQUIRIES;
  }
}

export function saveLandingInquiries(inquiries: LandingInquiry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
    // Trigger custom event for same-tab reactive updates
    window.dispatchEvent(new CustomEvent('kola_inquiries_updated', { detail: inquiries }));
  } catch (err) {
    console.error('Failed to save landing inquiries to storage:', err);
  }
}

export function createLandingInquiry(
  data: Omit<LandingInquiry, 'id' | 'created_at' | 'updated_at' | 'status' | 'activity_log' | 'synced_to_crm'>,
): LandingInquiry {
  const current = getLandingInquiries();
  const now = new Date().toISOString();
  const newId = `inq-${Date.now().toString().slice(-6)}`;

  const newInquiry: LandingInquiry = {
    ...data,
    id: newId,
    status: 'new',
    created_at: now,
    updated_at: now,
    synced_to_crm: false,
    crm_lead_id: null,
    activity_log: [
      {
        id: `act-${Date.now()}`,
        action: 'Inquiry Submitted',
        actor: `${data.customer_name} (Landing Page)`,
        timestamp: now,
        details: `Form submitted with address: ${data.address || 'N/A'}, Phone: ${data.phone}`,
      },
    ],
  };

  const updated = [newInquiry, ...current];
  saveLandingInquiries(updated);
  return newInquiry;
}

export function assignSalespersonToInquiry(
  inquiryId: string,
  salesperson: {
    id: string;
    name: string;
    email: string;
    role?: string;
  },
  actorName = 'Admin',
): LandingInquiry | null {
  const current = getLandingInquiries();
  const now = new Date().toISOString();

  let targetInquiry: LandingInquiry | null = null;
  const updated = current.map((inq) => {
    if (inq.id === inquiryId) {
      const isReassignment = !!inq.assigned_salesperson_id;
      const updatedItem: LandingInquiry = {
        ...inq,
        assigned_salesperson_id: salesperson.id,
        assigned_salesperson_name: salesperson.name,
        assigned_salesperson_email: salesperson.email,
        assigned_salesperson_role: salesperson.role ?? 'Sales Representative',
        assigned_at: now,
        status: inq.status === 'new' ? 'assigned' : inq.status,
        updated_at: now,
        activity_log: [
          {
            id: `act-${Date.now()}`,
            action: isReassignment ? 'Salesperson Reassigned' : 'Assigned to Salesperson',
            actor: actorName,
            timestamp: now,
            details: `Assigned to ${salesperson.name} (${salesperson.role ?? 'Sales Specialist'}).`,
          },
          ...inq.activity_log,
        ],
      };
      targetInquiry = updatedItem;
      return updatedItem;
    }
    return inq;
  });

  if (targetInquiry) {
    saveLandingInquiries(updated);
  }
  return targetInquiry;
}

export function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
  notes?: string,
  actorName = 'Admin',
): LandingInquiry | null {
  const current = getLandingInquiries();
  const now = new Date().toISOString();

  let targetInquiry: LandingInquiry | null = null;
  const updated = current.map((inq) => {
    if (inq.id === inquiryId) {
      const updatedItem: LandingInquiry = {
        ...inq,
        status,
        updated_at: now,
        activity_log: [
          {
            id: `act-${Date.now()}`,
            action: `Status changed to ${status.replace('_', ' ').toUpperCase()}`,
            actor: actorName,
            timestamp: now,
            details: notes ?? undefined,
          },
          ...inq.activity_log,
        ],
      };
      targetInquiry = updatedItem;
      return updatedItem;
    }
    return inq;
  });

  if (targetInquiry) {
    saveLandingInquiries(updated);
  }
  return targetInquiry;
}

export function addInquiryActivityNote(
  inquiryId: string,
  noteText: string,
  actorName = 'Admin',
): LandingInquiry | null {
  const current = getLandingInquiries();
  const now = new Date().toISOString();

  let targetInquiry: LandingInquiry | null = null;
  const updated = current.map((inq) => {
    if (inq.id === inquiryId) {
      const updatedItem: LandingInquiry = {
        ...inq,
        updated_at: now,
        activity_log: [
          {
            id: `act-${Date.now()}`,
            action: 'Internal Note Added',
            actor: actorName,
            timestamp: now,
            details: noteText,
          },
          ...inq.activity_log,
        ],
      };
      targetInquiry = updatedItem;
      return updatedItem;
    }
    return inq;
  });

  if (targetInquiry) {
    saveLandingInquiries(updated);
  }
  return targetInquiry;
}

export function deleteLandingInquiry(inquiryId: string): boolean {
  const current = getLandingInquiries();
  const filtered = current.filter((inq) => inq.id !== inquiryId);
  if (filtered.length !== current.length) {
    saveLandingInquiries(filtered);
    return true;
  }
  return false;
}

export function resetLandingInquiriesDemo(): LandingInquiry[] {
  saveLandingInquiries(INITIAL_DEMO_INQUIRIES);
  return INITIAL_DEMO_INQUIRIES;
}

export function exportInquiriesCsv(inquiries: LandingInquiry[]): void {
  const headers = [
    'Inquiry ID',
    'Customer Name',
    'Company Name',
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'Business Type',
    'Lead Volume',
    'System Interest',
    'Status',
    'Assigned Salesperson',
    'Assigned At',
    'Created At',
  ];

  const rows = inquiries.map((inq) => [
    inq.id,
    `"${(inq.customer_name || '').replace(/"/g, '""')}"`,
    `"${(inq.company_name || '').replace(/"/g, '""')}"`,
    inq.email,
    inq.phone,
    `"${(inq.address || '').replace(/"/g, '""')}"`,
    `"${(inq.city || '').replace(/"/g, '""')}"`,
    `"${(inq.state || '').replace(/"/g, '""')}"`,
    inq.business_type || '',
    inq.lead_volume || '',
    `"${(inq.system_interest || '').replace(/"/g, '""')}"`,
    inq.status,
    `"${(inq.assigned_salesperson_name || 'Unassigned').replace(/"/g, '""')}"`,
    inq.assigned_at || '',
    inq.created_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kola_solar_inquiries_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
