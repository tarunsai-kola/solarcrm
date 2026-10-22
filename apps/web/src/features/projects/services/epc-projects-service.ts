export type ProjectStage =
  | 'site_survey'
  | 'discom_sanction'
  | 'material_dispatch'
  | 'installation'
  | 'net_meter_testing'
  | 'commissioning'
  | 'subsidy_disbursement';

export type MilestoneStatus = 'completed' | 'in_progress' | 'pending' | 'delayed';

export interface ProjectMilestone {
  id: string;
  stage: ProjectStage;
  name: string;
  category: 'engineering' | 'liaison' | 'procurement' | 'construction' | 'inspection' | 'subsidy';
  description: string;
  status: MilestoneStatus;
  targetDate: string;
  completedAt?: string | undefined;
  completedBy?: string | undefined;
  referenceNumber?: string | undefined; // e.g. DISCOM Sanction Order #, Net Meter S/N, DBT Application #
  attachmentName?: string | undefined;
  notes?: string | undefined;
}

export interface SolarEpcProject {
  id: string;
  projectCode: string;
  quotationId?: string | undefined;
  quotationNumber: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | undefined;
  siteAddress: string;
  city: string;
  pincode: string;
  systemCapacityKw: number;
  systemType: string;
  phase: string;
  contractAmount: number;
  subsidyAmount: number;
  discomName: string;
  consumerNumber: string;
  currentStage: ProjectStage;
  healthStatus: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  assignedEngineer: string;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string | undefined;
  milestones: ProjectMilestone[];
  notes?: string | undefined;
}

const STORAGE_KEY = 'kola_solar_epc_projects_v1';

export const DEFAULT_EPC_PROJECTS: SolarEpcProject[] = [
  {
    id: 'prj-001',
    projectCode: 'KOLA-EPC-2026-081',
    quotationNumber: 'KOLA-2026-0042',
    leadId: 'lead-sample-1',
    customerName: 'Harish Sundaram',
    customerPhone: '+91 98401 23456',
    customerEmail: 'harish@apexgreenenergy.in',
    siteAddress: 'Plot 42, Electronic City Phase 1',
    city: 'Bengaluru',
    pincode: '560100',
    systemCapacityKw: 5.0,
    systemType: 'On-Grid',
    phase: '3-Phase',
    contractAmount: 241480,
    subsidyAmount: 78000,
    discomName: 'BESCOM',
    consumerNumber: 'BESCOM-1488921-BLR',
    currentStage: 'installation',
    healthStatus: 'on_track',
    assignedEngineer: 'Rajesh Nair (Senior EPC Lead)',
    startDate: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
    targetCompletionDate: new Date(Date.now() + 18 * 86400 * 1000).toISOString(),
    milestones: [
      {
        id: 'ms-1',
        stage: 'site_survey',
        name: 'Rooftop Survey & Structural Feasibility Study',
        category: 'engineering',
        description: 'Complete 3D shadow analysis, roof load assessment, and Single Line Diagram (SLD).',
        status: 'completed',
        targetDate: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
        completedBy: 'Rajesh Nair',
        referenceNumber: 'SLD-2026-042',
        attachmentName: 'Harish_Sundaram_SLD_Rooftop_Study.pdf',
        notes: 'RCC roof slope suitable. Zero shadow loss between 9 AM and 4 PM.',
      },
      {
        id: 'ms-2',
        stage: 'discom_sanction',
        name: 'DISCOM Net-Metering Application & Sanction Letter',
        category: 'liaison',
        description: 'Submit interconnection application on BESCOM portal and obtain transformer feasibility approval.',
        status: 'completed',
        targetDate: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        completedBy: 'Priya Sharma (Liaison Officer)',
        referenceNumber: 'BESCOM/NET/2026/08941',
        attachmentName: 'BESCOM_Sanction_Letter_5kW.pdf',
        notes: 'Sanction letter issued for 5kWp grid injection at 415V 3-phase.',
      },
      {
        id: 'ms-3',
        stage: 'material_dispatch',
        name: 'Tier-1 Equipment Procurement & Site Delivery',
        category: 'procurement',
        description: 'Dispatch 10x 550Wp Mono PERC modules, 5kW 3-Phase Inverter, and elevated HDG mounting structure.',
        status: 'completed',
        targetDate: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        completedBy: 'Arun Logistics Team',
        referenceNumber: 'LR-KOLA-BLR-892',
        attachmentName: 'Delivery_Challan_Harish_5kW.pdf',
        notes: 'All 10 modules received at site in pristine condition. Zero transit damage.',
      },
      {
        id: 'ms-4',
        stage: 'installation',
        name: 'Mechanical Mounting & Electrical Wiring',
        category: 'construction',
        description: 'Assemble elevated HDG structure, clamp panels, install AC/DC distribution boxes & chemical earthing pits.',
        status: 'in_progress',
        targetDate: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
        referenceNumber: 'JOB-EPC-081',
        notes: 'Mounting structure installed. Panel clamping in progress today. Earthing pits measured at 3.2 Ohms (well below 5 Ohms requirement).',
      },
      {
        id: 'ms-5',
        stage: 'net_meter_testing',
        name: 'DISCOM Joint Inspection & Bi-directional Meter Install',
        category: 'inspection',
        description: 'Coordinate joint inspection with BESCOM AE/AEE and install bi-directional solar energy net meter.',
        status: 'pending',
        targetDate: new Date(Date.now() + 9 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-6',
        stage: 'commissioning',
        name: 'Plant Grid Synchronization & Official Commissioning',
        category: 'engineering',
        description: 'Energize plant, verify Wi-Fi inverter generation app, issue Project Completion Report (PCR).',
        status: 'pending',
        targetDate: new Date(Date.now() + 12 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-7',
        stage: 'subsidy_disbursement',
        name: 'PM Surya Ghar National Portal Subsidy Disbursement',
        category: 'subsidy',
        description: 'Upload PCR & joint inspection report on pmsuryaghar.gov.in for ₹78,000 DBT release to customer account.',
        status: 'pending',
        targetDate: new Date(Date.now() + 20 * 86400 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'prj-002',
    projectCode: 'KOLA-EPC-2026-082',
    quotationNumber: 'KOLA-2026-0043',
    leadId: 'lead-sample-2',
    customerName: 'Dr. Ananya Rao',
    customerPhone: '+91 97412 88901',
    customerEmail: 'ananya.rao@healthfirst.org',
    siteAddress: 'Villa 18, Palm Meadows, Whitefield',
    city: 'Bengaluru',
    pincode: '560066',
    systemCapacityKw: 3.0,
    systemType: 'On-Grid',
    phase: '1-Phase',
    contractAmount: 163596,
    subsidyAmount: 78000,
    discomName: 'BESCOM',
    consumerNumber: 'BESCOM-9923101-WHT',
    currentStage: 'discom_sanction',
    healthStatus: 'on_track',
    assignedEngineer: 'Vikram Joshi (Field Project Engineer)',
    startDate: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    targetCompletionDate: new Date(Date.now() + 25 * 86400 * 1000).toISOString(),
    milestones: [
      {
        id: 'ms-201',
        stage: 'site_survey',
        name: 'Rooftop Survey & Structural Feasibility Study',
        category: 'engineering',
        description: 'Complete 3D shadow analysis, roof load assessment, and Single Line Diagram (SLD).',
        status: 'completed',
        targetDate: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        completedBy: 'Vikram Joshi',
        referenceNumber: 'SLD-2026-043',
        attachmentName: 'Ananya_Rao_Roof_Analysis.pdf',
        notes: 'Villa flat terrace with 450 sq ft clear shadow-free area.',
      },
      {
        id: 'ms-202',
        stage: 'discom_sanction',
        name: 'DISCOM Net-Metering Application & Sanction Letter',
        category: 'liaison',
        description: 'Submit interconnection application on BESCOM portal and obtain transformer feasibility approval.',
        status: 'in_progress',
        targetDate: new Date(Date.now() + 4 * 86400 * 1000).toISOString(),
        referenceNumber: 'BESCOM/APP/2026/09120',
        notes: 'Application registered on BESCOM Rooftop portal. Awaiting Assistant Executive Engineer signature.',
      },
      {
        id: 'ms-203',
        stage: 'material_dispatch',
        name: 'Tier-1 Equipment Procurement & Site Delivery',
        category: 'procurement',
        description: 'Dispatch 6x 550Wp Mono PERC modules, 3.3kW Single Phase Inverter, and MMS.',
        status: 'pending',
        targetDate: new Date(Date.now() + 8 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-204',
        stage: 'installation',
        name: 'Mechanical Mounting & Electrical Wiring',
        category: 'construction',
        description: 'Assemble elevated MMS structure, clamp panels, install distribution boxes & earthing.',
        status: 'pending',
        targetDate: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-205',
        stage: 'net_meter_testing',
        name: 'DISCOM Joint Inspection & Bi-directional Meter Install',
        category: 'inspection',
        description: 'Coordinate joint inspection with BESCOM and install bi-directional net meter.',
        status: 'pending',
        targetDate: new Date(Date.now() + 19 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-206',
        stage: 'commissioning',
        name: 'Plant Grid Synchronization & Official Commissioning',
        category: 'engineering',
        description: 'Energize plant, verify generation app, issue Project Completion Report.',
        status: 'pending',
        targetDate: new Date(Date.now() + 21 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-207',
        stage: 'subsidy_disbursement',
        name: 'PM Surya Ghar National Portal Subsidy Disbursement',
        category: 'subsidy',
        description: 'Upload PCR on pmsuryaghar.gov.in for ₹78,000 DBT release.',
        status: 'pending',
        targetDate: new Date(Date.now() + 28 * 86400 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'prj-003',
    projectCode: 'KOLA-EPC-2026-077',
    quotationNumber: 'KOLA-2026-0038',
    leadId: 'lead-sample-3',
    customerName: 'Sunita Deshmukh',
    customerPhone: '+91 98205 67890',
    customerEmail: 'sunita.deshmukh@gmail.com',
    siteAddress: 'Bungalow 7, Shivaji Nagar',
    city: 'Pune',
    pincode: '411005',
    systemCapacityKw: 3.0,
    systemType: 'On-Grid',
    phase: '1-Phase',
    contractAmount: 155130,
    subsidyAmount: 78000,
    discomName: 'MSEDCL',
    consumerNumber: 'MSEDCL-8874102',
    currentStage: 'subsidy_disbursement',
    healthStatus: 'completed',
    assignedEngineer: 'Ketan Kulkarni',
    startDate: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
    targetCompletionDate: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    actualCompletionDate: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
    milestones: [
      {
        id: 'ms-301',
        stage: 'site_survey',
        name: 'Rooftop Survey & Structural Feasibility Study',
        category: 'engineering',
        description: 'Survey completed and shadow report verified.',
        status: 'completed',
        targetDate: new Date(Date.now() - 32 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 32 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-302',
        stage: 'discom_sanction',
        name: 'DISCOM Net-Metering Application & Sanction Letter',
        category: 'liaison',
        description: 'Sanction letter received from MSEDCL Pune division.',
        status: 'completed',
        targetDate: new Date(Date.now() - 25 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 24 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-303',
        stage: 'material_dispatch',
        name: 'Tier-1 Equipment Procurement & Site Delivery',
        category: 'procurement',
        description: 'All panels and inverter delivered to bungalow site.',
        status: 'completed',
        targetDate: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 17 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-304',
        stage: 'installation',
        name: 'Mechanical Mounting & Electrical Wiring',
        category: 'construction',
        description: 'Mounting completed, panels clamped, chemical earthing installed.',
        status: 'completed',
        targetDate: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 11 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-305',
        stage: 'net_meter_testing',
        name: 'DISCOM Joint Inspection & Bi-directional Meter Install',
        category: 'inspection',
        description: 'MSEDCL joint inspection completed and Secure bi-directional meter installed.',
        status: 'completed',
        targetDate: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
        referenceNumber: 'MTR-MSEDCL-99014',
      },
      {
        id: 'ms-306',
        stage: 'commissioning',
        name: 'Plant Grid Synchronization & Official Commissioning',
        category: 'engineering',
        description: 'Plant energized and generating 14 units/day. App registered.',
        status: 'completed',
        targetDate: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
      },
      {
        id: 'ms-307',
        stage: 'subsidy_disbursement',
        name: 'PM Surya Ghar National Portal Subsidy Disbursement',
        category: 'subsidy',
        description: 'Subsidy claim verified by DISCOM and DBT payment released to customer Aadhaar bank account.',
        status: 'completed',
        targetDate: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        referenceNumber: 'DBT-PMSG-2026-98124',
        notes: '₹78,000 subsidy successfully credited into Sunita Deshmukh Bank of India A/C.',
      },
    ],
  },
];

export function getStoredProjects(): SolarEpcProject[] {
  if (typeof window === 'undefined') return DEFAULT_EPC_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EPC_PROJECTS));
      return DEFAULT_EPC_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EPC_PROJECTS;
  } catch {
    return DEFAULT_EPC_PROJECTS;
  }
}

export function saveStoredProjects(projects: SolarEpcProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Failed to save projects', err);
  }
}

export function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  updates: {
    status: MilestoneStatus;
    referenceNumber?: string | undefined;
    notes?: string | undefined;
    attachmentName?: string | undefined;
  },
): SolarEpcProject | null {
  const list = getStoredProjects();
  const projectIndex = list.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) return null;

  const project = list[projectIndex]!;
  const updatedMilestones = project.milestones.map((ms) => {
    if (ms.id !== milestoneId) return ms;
    return {
      ...ms,
      status: updates.status,
      completedAt: updates.status === 'completed' ? new Date().toISOString() : ms.completedAt,
      referenceNumber: updates.referenceNumber !== undefined ? updates.referenceNumber : ms.referenceNumber,
      notes: updates.notes !== undefined ? updates.notes : ms.notes,
      attachmentName: updates.attachmentName !== undefined ? updates.attachmentName : ms.attachmentName,
    };
  });

  // Calculate current stage based on milestones
  let currentStage = project.currentStage;
  const inProgressMs = updatedMilestones.find((ms) => ms.status === 'in_progress');
  if (inProgressMs) {
    currentStage = inProgressMs.stage;
  } else {
    const firstPending = updatedMilestones.find((ms) => ms.status === 'pending');
    if (firstPending) {
      currentStage = firstPending.stage;
    } else if (updatedMilestones.every((ms) => ms.status === 'completed')) {
      currentStage = 'subsidy_disbursement';
    }
  }

  const allCompleted = updatedMilestones.every((ms) => ms.status === 'completed');

  const updatedProject: SolarEpcProject = {
    ...project,
    currentStage,
    healthStatus: allCompleted ? 'completed' : project.healthStatus,
    actualCompletionDate: allCompleted ? new Date().toISOString() : project.actualCompletionDate,
    milestones: updatedMilestones,
  };

  list[projectIndex] = updatedProject;
  saveStoredProjects(list);
  return updatedProject;
}

export function createEpcProjectFromAcceptedQuotation(quote: any): SolarEpcProject {
  const list = getStoredProjects();
  const existing = list.find((p) => p.quotationId === quote.id || p.quotationNumber === quote.quotation_number);
  if (existing) return existing;

  const now = new Date();
  const projectCode = `KOLA-EPC-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const newProject: SolarEpcProject = {
    id: `prj-${Date.now()}`,
    projectCode,
    quotationId: quote.id,
    quotationNumber: quote.quotation_number || 'KOLA-2026-NEW',
    leadId: quote.lead?.id || 'lead-auto',
    customerName: quote.lead?.customer_name || 'Solar Customer',
    customerPhone: quote.lead?.phone || '+91 98000 00000',
    customerEmail: quote.lead?.email,
    siteAddress: quote.lead?.address || 'Site Rooftop Location',
    city: quote.lead?.city || 'Bengaluru',
    pincode: quote.lead?.pincode || '560100',
    systemCapacityKw: quote.system_capacity_kw || 5,
    systemType: quote.system_type || 'On-Grid',
    phase: quote.phase || '1-Phase',
    contractAmount: quote.total_amount || 200000,
    subsidyAmount: (quote.system_capacity_kw || 5) >= 3 ? 78000 : (quote.system_capacity_kw || 5) * 30000,
    discomName: 'BESCOM / State DISCOM',
    consumerNumber: `DISCOM-${Math.floor(1000000 + Math.random() * 9000000)}`,
    currentStage: 'site_survey',
    healthStatus: 'on_track',
    assignedEngineer: 'Senior Project Engineer (EPC Lead)',
    startDate: now.toISOString(),
    targetCompletionDate: new Date(now.getTime() + 30 * 86400 * 1000).toISOString(),
    milestones: [
      {
        id: `ms-${Date.now()}-1`,
        stage: 'site_survey',
        name: 'Rooftop Survey & Structural Feasibility Study',
        category: 'engineering',
        description: 'Complete 3D shadow analysis, roof load assessment, and Single Line Diagram (SLD).',
        status: 'in_progress',
        targetDate: new Date(now.getTime() + 3 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-2`,
        stage: 'discom_sanction',
        name: 'DISCOM Net-Metering Application & Sanction Letter',
        category: 'liaison',
        description: 'Submit interconnection application on DISCOM portal and obtain feasibility approval.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 8 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-3`,
        stage: 'material_dispatch',
        name: 'Tier-1 Equipment Procurement & Site Delivery',
        category: 'procurement',
        description: 'Dispatch modules, inverter, structure, and BOS cables to site.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 15 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-4`,
        stage: 'installation',
        name: 'Mechanical Mounting & Electrical Wiring',
        category: 'construction',
        description: 'Assemble structure, clamp panels, install AC/DC distribution boxes & earthing.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 20 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-5`,
        stage: 'net_meter_testing',
        name: 'DISCOM Joint Inspection & Bi-directional Meter Install',
        category: 'inspection',
        description: 'Coordinate joint inspection with DISCOM and install bi-directional solar energy meter.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 24 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-6`,
        stage: 'commissioning',
        name: 'Plant Grid Synchronization & Official Commissioning',
        category: 'engineering',
        description: 'Energize plant, verify Wi-Fi inverter generation app, issue Project Completion Report.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 26 * 86400 * 1000).toISOString(),
      },
      {
        id: `ms-${Date.now()}-7`,
        stage: 'subsidy_disbursement',
        name: 'PM Surya Ghar National Portal Subsidy Disbursement',
        category: 'subsidy',
        description: 'Upload PCR on pmsuryaghar.gov.in for direct benefit transfer release.',
        status: 'pending',
        targetDate: new Date(now.getTime() + 30 * 86400 * 1000).toISOString(),
      },
    ],
  };

  list.unshift(newProject);
  saveStoredProjects(list);
  return newProject;
}

export function generateMilestoneWhatsAppMessage(project: SolarEpcProject, milestone: ProjectMilestone): string {
  const text = `☀️ *KOLA SOLAR — Project Milestone Update*\n\nHello *${project.customerName}*,\n\nWe are pleased to inform you that the following milestone for your *${project.systemCapacityKw} kWp Solar Rooftop System* has been updated:\n\n📌 *Milestone:* ${milestone.name}\n✅ *Status:* ${milestone.status.toUpperCase()}\n${milestone.referenceNumber ? `📄 *Reference / Order #:* ${milestone.referenceNumber}\n` : ''}${milestone.notes ? `📝 *Notes:* ${milestone.notes}\n` : ''}\nDISCOM: *${project.discomName}* (Consumer: ${project.consumerNumber})\n\nOur EPC team is actively proceeding with the next phase to get your system commissioned and eligible for the *₹${project.subsidyAmount.toLocaleString('en-IN')} PM Surya Ghar Subsidy*!\n\nBest regards,\n*Kola Solar EPC Operations Team*`;
  return encodeURIComponent(text);
}
