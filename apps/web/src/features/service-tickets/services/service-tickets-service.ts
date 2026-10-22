export type TicketType =
  | 'breakdown'
  | 'amc_preventive'
  | 'panel_cleaning'
  | 'inverter_fault'
  | 'net_metering'
  | 'warranty_claim';

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export type InverterHealthStatus = 'normal' | 'warning' | 'fault' | 'offline';

export interface InverterTelemetry {
  brand: string;
  model: string;
  serial_number: string;
  system_capacity_kw: number;
  status: InverterHealthStatus;
  active_power_kw: number;
  daily_yield_kwh: number;
  total_yield_mwh: number;
  grid_voltage_v: number;
  grid_frequency_hz: number;
  internal_temp_c: number;
  last_telemetry_time: string;
  active_fault_code?: string | undefined;
  active_fault_message?: string | undefined;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  system_capacity_kw: number;
  ticket_type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  amc_active: boolean;
  amc_plan_name?: string | undefined;
  assigned_technician_name?: string | undefined;
  assigned_technician_phone?: string | undefined;
  scheduled_visit_date?: string | undefined;
  resolved_at?: string | undefined;
  resolution_notes?: string | undefined;
  inverter_telemetry: InverterTelemetry;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'kola_solar_service_tickets';

const SEED_SERVICE_TICKETS: ServiceTicket[] = [
  {
    id: 'ticket-001',
    ticket_number: 'SRV-2026-081',
    customer_name: 'Harish Sundaram',
    phone: '+91 98401 23456',
    address: 'Plot 42, Electronic City Phase 1',
    city: 'Bengaluru',
    system_capacity_kw: 5.0,
    ticket_type: 'inverter_fault',
    title: 'Inverter Error Code E024 (Grid Over-Voltage Trip)',
    description:
      'Inverter tripped during peak sunshine at 12:45 PM. Display showing error E024 with red alarm LED. Voltage spikes observed on Phase R exceeding 265V.',
    priority: 'high',
    status: 'assigned',
    amc_active: true,
    amc_plan_name: 'Kola Gold 5-Year Comprehensive AMC',
    assigned_technician_name: 'Kiran Gowda',
    assigned_technician_phone: '+91 98860 11223',
    scheduled_visit_date: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    inverter_telemetry: {
      brand: 'Sungrow',
      model: 'SG5.0RS-ADA (Single Phase)',
      serial_number: 'SGR-2025-994821',
      system_capacity_kw: 5.0,
      status: 'fault',
      active_power_kw: 0.0,
      daily_yield_kwh: 8.4,
      total_yield_mwh: 4.82,
      grid_voltage_v: 268.4,
      grid_frequency_hz: 50.15,
      internal_temp_c: 44.5,
      last_telemetry_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      active_fault_code: 'E024',
      active_fault_message: 'Grid Over-Voltage (Phase R: 268.4V exceeds 260V threshold)',
    },
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ticket-002',
    ticket_number: 'SRV-2026-082',
    customer_name: 'Dr. Ramesh Kulkarni',
    phone: '+91 94480 33445',
    address: '89, 5th Main, Malleshwaram West',
    city: 'Bengaluru',
    system_capacity_kw: 3.3,
    ticket_type: 'amc_preventive',
    title: 'Quarterly Preventive AMC Maintenance & Thermal Hot-spot Inspection',
    description:
      'Scheduled Q1 comprehensive health checkup: String voltage (Voc) verification, MC4 connector tightening, AC/DC DB surge arrester check, and chemical earthing pit moisture recharge.',
    priority: 'medium',
    status: 'in_progress',
    amc_active: true,
    amc_plan_name: 'Kola Platinum Residential AMC',
    assigned_technician_name: 'Praveen Kumar',
    assigned_technician_phone: '+91 97400 33221',
    scheduled_visit_date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    inverter_telemetry: {
      brand: 'Growatt',
      model: 'MIN 3300TL-X',
      serial_number: 'GRW-2024-817290',
      system_capacity_kw: 3.3,
      status: 'normal',
      active_power_kw: 2.78,
      daily_yield_kwh: 14.2,
      total_yield_mwh: 6.95,
      grid_voltage_v: 234.2,
      grid_frequency_hz: 50.02,
      internal_temp_c: 38.0,
      last_telemetry_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'ticket-003',
    ticket_number: 'SRV-2026-083',
    customer_name: 'Vikram Mehta (Mehta Industries)',
    phone: '+91 98200 11223',
    address: 'Shed 4, Peenya Industrial Area Phase 2',
    city: 'Bengaluru',
    system_capacity_kw: 20.0,
    ticket_type: 'panel_cleaning',
    title: 'Industrial Heavy Soiling — Automated Robot De-dusting & Chemical Wash',
    description:
      'Heavy airborne cement and industrial particulate accumulation detected. Performance ratio dropped to 72% over last 3 weeks. Requesting 36-module high-pressure RO de-mineralized wash.',
    priority: 'medium',
    status: 'open',
    amc_active: true,
    amc_plan_name: 'Commercial Solar EPC O&M Tier-1',
    assigned_technician_name: 'Unassigned',
    scheduled_visit_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    inverter_telemetry: {
      brand: 'Sungrow',
      model: 'SG20RT (Three Phase)',
      serial_number: 'SGR-IND-2024-0019',
      system_capacity_kw: 20.0,
      status: 'warning',
      active_power_kw: 13.4,
      daily_yield_kwh: 68.5,
      total_yield_mwh: 42.1,
      grid_voltage_v: 416.8,
      grid_frequency_hz: 50.04,
      internal_temp_c: 46.2,
      last_telemetry_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      active_fault_code: 'W108',
      active_fault_message: 'Performance Ratio Degradation Alert: PR 71.8% (Target >= 82%)',
    },
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ticket-004',
    ticket_number: 'SRV-2026-084',
    customer_name: 'Pooja Hegde',
    phone: '+91 97412 88990',
    address: 'Villa 18, Palm Meadows, Whitefield',
    city: 'Bengaluru',
    system_capacity_kw: 8.0,
    ticket_type: 'breakdown',
    title: 'Zero Generation / Isolation Resistance Fault (ISO Low Error)',
    description:
      'Inverter stopped feeding power into grid after overnight heavy rains. Ground fault detected on DC String 2 (Resistance to Earth < 50k ohm). DC cable pinched under tile suspected.',
    priority: 'critical',
    status: 'in_progress',
    amc_active: true,
    amc_plan_name: 'Kola Gold 5-Year Comprehensive AMC',
    assigned_technician_name: 'Kiran Gowda',
    assigned_technician_phone: '+91 98860 11223',
    scheduled_visit_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    inverter_telemetry: {
      brand: 'Havells',
      model: 'Enviro GT 8.0 kW 3-Phase',
      serial_number: 'HVL-2025-004128',
      system_capacity_kw: 8.0,
      status: 'fault',
      active_power_kw: 0.0,
      daily_yield_kwh: 0.2,
      total_yield_mwh: 11.4,
      grid_voltage_v: 412.0,
      grid_frequency_hz: 49.98,
      internal_temp_c: 32.1,
      last_telemetry_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      active_fault_code: 'F038',
      active_fault_message: 'PV Isolation Low (DC Insulation Resistance: 32 kOhm < 100 kOhm)',
    },
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ticket-005',
    ticket_number: 'SRV-2026-085',
    customer_name: 'Suresh Varma',
    phone: '+91 98450 77889',
    address: '14, Koramangala 4th Block',
    city: 'Bengaluru',
    system_capacity_kw: 6.0,
    ticket_type: 'net_metering',
    title: 'Bi-directional Net Meter Export Sync with BESCOM Bill',
    description:
      'Customer reports net export solar credit of 410 units missing from latest monthly BESCOM bill. Meter reading verification and DISCOM solar wing liaison completed.',
    priority: 'low',
    status: 'resolved',
    amc_active: true,
    amc_plan_name: 'Kola Standard Care AMC',
    assigned_technician_name: 'Praveen Kumar',
    assigned_technician_phone: '+91 97400 33221',
    scheduled_visit_date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolution_notes:
      'Visited BESCOM subdivision office with solar generation log. Discrepancy rectified in billing system. Bill credit of ₹3,280 adjusted in next billing cycle. Customer signed satisfaction docket.',
    inverter_telemetry: {
      brand: 'Sungrow',
      model: 'SG6.0RS',
      serial_number: 'SGR-2024-771120',
      system_capacity_kw: 6.0,
      status: 'normal',
      active_power_kw: 5.12,
      daily_yield_kwh: 28.6,
      total_yield_mwh: 15.3,
      grid_voltage_v: 236.8,
      grid_frequency_hz: 50.01,
      internal_temp_c: 41.8,
      last_telemetry_time: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export function getLocalServiceTickets(): ServiceTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SERVICE_TICKETS));
      return SEED_SERVICE_TICKETS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_SERVICE_TICKETS;
  }
}

export function saveLocalServiceTickets(tickets: ServiceTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error('Failed to save service tickets to localStorage', err);
  }
}

export function createServiceTicket(
  input: Partial<ServiceTicket> & {
    customer_name: string;
    phone: string;
    title: string;
    description: string;
    ticket_type: TicketType;
    priority: TicketPriority;
  }
): ServiceTicket {
  const tickets = getLocalServiceTickets();
  const id = `ticket-${Date.now()}`;
  const now = new Date().toISOString();
  const ticketNumber = `SRV-2026-${String(tickets.length + 86).padStart(3, '0')}`;

  const newTicket: ServiceTicket = {
    id,
    ticket_number: ticketNumber,
    customer_name: input.customer_name,
    phone: input.phone,
    address: input.address || 'Bengaluru Urban',
    city: input.city || 'Bengaluru',
    system_capacity_kw: input.system_capacity_kw || 5.0,
    ticket_type: input.ticket_type,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status || 'open',
    amc_active: input.amc_active ?? true,
    amc_plan_name: input.amc_plan_name || 'Kola Gold 5-Year Comprehensive AMC',
    assigned_technician_name: input.assigned_technician_name || undefined,
    assigned_technician_phone: input.assigned_technician_phone || undefined,
    scheduled_visit_date: input.scheduled_visit_date || undefined,
    inverter_telemetry: input.inverter_telemetry || {
      brand: 'Sungrow',
      model: 'SG5.0RS-ADA',
      serial_number: `SGR-${Math.floor(100000 + Math.random() * 900000)}`,
      system_capacity_kw: input.system_capacity_kw || 5.0,
      status: input.priority === 'critical' ? 'fault' : 'normal',
      active_power_kw: input.priority === 'critical' ? 0.0 : 4.2,
      daily_yield_kwh: input.priority === 'critical' ? 1.2 : 19.5,
      total_yield_mwh: 5.4,
      grid_voltage_v: 235.0,
      grid_frequency_hz: 50.0,
      internal_temp_c: 40.0,
      last_telemetry_time: now,
      active_fault_code: input.priority === 'critical' ? 'F012' : undefined,
      active_fault_message: input.priority === 'critical' ? 'Grid Trip Alert' : undefined,
    },
    created_at: now,
    updated_at: now,
  };

  const updated = [newTicket, ...tickets];
  saveLocalServiceTickets(updated);
  return newTicket;
}

export function updateServiceTicket(id: string, updates: Partial<ServiceTicket>): ServiceTicket | null {
  const tickets = getLocalServiceTickets();
  const index = tickets.findIndex((t) => t.id === id);
  const existing = tickets[index];
  if (index === -1 || !existing) return null;

  const updatedTicket: ServiceTicket = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'resolved' && !updatedTicket.resolved_at) {
    updatedTicket.resolved_at = new Date().toISOString();
  }

  tickets[index] = updatedTicket;
  saveLocalServiceTickets(tickets);
  return updatedTicket;
}
