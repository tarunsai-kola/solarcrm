export type SiteVisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type RoofSuitability = 'highly_suitable' | 'suitable_with_conditions' | 'not_suitable';
export type RoofConstructionType = 'flat_rcc' | 'industrial_metal' | 'tiled_sloped' | 'other';
export type PhaseType = 'single_phase' | 'three_phase';

export interface SiteAuditPhoto {
  id: string;
  category: 'roof_panorama' | 'meter_reading' | 'main_db' | 'earthing_pit' | 'inverter_wall' | 'access_route';
  title: string;
  url: string;
  captured_at: string;
  notes?: string | undefined;
}

export interface SiteVisit {
  id: string;
  lead_id: string;
  customer_name: string;
  phone: string;
  email?: string | undefined;
  address: string;
  city: string;
  pincode: string;
  discom_name: string;
  consumer_number: string;
  sanctioned_load_kw: number;
  connection_phase: PhaseType;
  field_agent_id: string;
  field_agent_name: string;
  field_agent_phone: string;
  scheduled_at: string;
  completed_at?: string | undefined;
  visit_status: SiteVisitStatus;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
    accuracy_m?: number | undefined;
  } | undefined;
  roof_type: RoofConstructionType;
  roof_age_years: number;
  roof_condition_rating: 'excellent' | 'good' | 'needs_reinforcement';
  total_roof_area_sqft: number;
  shadow_free_area_sqft: number;
  parapet_height_ft: number;
  optimal_tilt_angle_deg: number;
  azimuth_degrees: number;
  dc_cable_length_m: number;
  ac_cable_length_m: number;
  earthing_pits_required: number;
  lightning_arrester_feasible: boolean;
  inverter_location: string;
  recommended_system_capacity_kw: number;
  recommended_panels_count: number;
  monthly_consumption_kwh: number;
  electricity_bill_amount: number;
  roof_suitability: RoofSuitability;
  site_observations: string;
  next_action: string;
  photos: SiteAuditPhoto[];
  surveyor_signature?: string | undefined;
  customer_signature?: string | undefined;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'kola_solar_site_visits';

const SEED_SITE_VISITS: SiteVisit[] = [
  {
    id: 'visit-001',
    lead_id: 'lead-sample-1',
    customer_name: 'Harish Sundaram',
    phone: '+91 98401 23456',
    email: 'harish@apexgreenenergy.in',
    address: 'Plot 42, 14th Cross, Electronic City Phase 1',
    city: 'Bengaluru',
    pincode: '560100',
    discom_name: 'BESCOM (Bengaluru Electricity Supply Co.)',
    consumer_number: 'BES-10492819',
    sanctioned_load_kw: 6.0,
    connection_phase: 'three_phase',
    field_agent_id: 'agent-1',
    field_agent_name: 'Rajesh Sharma',
    field_agent_phone: '+91 98765 43210',
    scheduled_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    visit_status: 'completed',
    gps_coordinates: {
      latitude: 12.8452,
      longitude: 77.6602,
      accuracy_m: 4.2,
    },
    roof_type: 'flat_rcc',
    roof_age_years: 5,
    roof_condition_rating: 'excellent',
    total_roof_area_sqft: 1200,
    shadow_free_area_sqft: 850,
    parapet_height_ft: 3.5,
    optimal_tilt_angle_deg: 13,
    azimuth_degrees: 180,
    dc_cable_length_m: 14,
    ac_cable_length_m: 18,
    earthing_pits_required: 3,
    lightning_arrester_feasible: true,
    inverter_location: 'Staircase head-room wall (covered & ventilated)',
    recommended_system_capacity_kw: 5.0,
    recommended_panels_count: 9,
    monthly_consumption_kwh: 580,
    electricity_bill_amount: 4640,
    roof_suitability: 'highly_suitable',
    site_observations:
      'RCC slab in prime structural condition. 0% morning/evening tree shadow. High-quality earthing pit area available in front garden. Sanctioned load 6kW is adequate for 5kWp on-grid net-metering without DISCOM enhancement.',
    next_action: 'Generate formal quotation and initiate DISCOM net-metering application.',
    photos: [
      {
        id: 'p-1',
        category: 'roof_panorama',
        title: 'Terrace South Facing Panorama',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
        captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        notes: 'Clean shadow-free RCC slab ready for elevated aluminum structure',
      },
      {
        id: 'p-2',
        category: 'meter_reading',
        title: 'BESCOM Bi-directional Meter Box',
        url: 'https://images.unsplash.com/photo-1558441719-8b489c6ef2d1?auto=format&fit=crop&w=600&q=80',
        captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        notes: 'Digital electronic 3-phase meter; space available for solar net-meter',
      },
      {
        id: 'p-3',
        category: 'main_db',
        title: 'Main AC Distribution Board',
        url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
        captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        notes: '63A 4-Pole MCB installed; clean conduit route to terrace',
      },
      {
        id: 'p-4',
        category: 'earthing_pit',
        title: 'Chemical Earthing Pit Ground',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        captured_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        notes: 'Soft soil area adjacent to boundary wall; resistance < 2 ohms achievable',
      },
    ],
    surveyor_signature: 'Rajesh Sharma (Lic: SURV-KA-992)',
    customer_signature: 'Harish Sundaram',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'visit-002',
    lead_id: 'lead-sample-2',
    customer_name: 'Pooja Hegde',
    phone: '+91 97412 88990',
    email: 'pooja.h@greentech.org',
    address: 'Villa 18, Palm Meadows, Whitefield',
    city: 'Bengaluru',
    pincode: '560066',
    discom_name: 'BESCOM',
    consumer_number: 'BES-88419201',
    sanctioned_load_kw: 10.0,
    connection_phase: 'three_phase',
    field_agent_id: 'agent-1',
    field_agent_name: 'Rajesh Sharma',
    field_agent_phone: '+91 98765 43210',
    scheduled_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    visit_status: 'scheduled',
    roof_type: 'tiled_sloped',
    roof_age_years: 3,
    roof_condition_rating: 'excellent',
    total_roof_area_sqft: 1800,
    shadow_free_area_sqft: 1100,
    parapet_height_ft: 1.5,
    optimal_tilt_angle_deg: 15,
    azimuth_degrees: 175,
    dc_cable_length_m: 20,
    ac_cable_length_m: 25,
    earthing_pits_required: 3,
    lightning_arrester_feasible: true,
    inverter_location: 'Garage side wall (shaded outdoor IP65)',
    recommended_system_capacity_kw: 8.0,
    recommended_panels_count: 15,
    monthly_consumption_kwh: 920,
    electricity_bill_amount: 8100,
    roof_suitability: 'highly_suitable',
    site_observations: 'Mangalore tile pitch facing South-South-East. Specialized tile rafter clamps required to avoid drilling into tiles.',
    next_action: 'Perform on-site structural audit and capture high-resolution drone/roof photos.',
    photos: [],
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'visit-003',
    lead_id: 'lead-sample-3',
    customer_name: 'Vikram Mehta',
    phone: '+91 98200 11223',
    email: 'vikram@mehtaindustries.com',
    address: 'Shed 4, Peenya Industrial Area Phase 2',
    city: 'Bengaluru',
    pincode: '560058',
    discom_name: 'BESCOM',
    consumer_number: 'BES-99210492',
    sanctioned_load_kw: 25.0,
    connection_phase: 'three_phase',
    field_agent_id: 'agent-2',
    field_agent_name: 'Ananya Deshmukh',
    field_agent_phone: '+91 98111 22334',
    scheduled_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    visit_status: 'completed',
    gps_coordinates: {
      latitude: 13.0285,
      longitude: 77.5195,
      accuracy_m: 3.1,
    },
    roof_type: 'industrial_metal',
    roof_age_years: 7,
    roof_condition_rating: 'good',
    total_roof_area_sqft: 3200,
    shadow_free_area_sqft: 2800,
    parapet_height_ft: 0,
    optimal_tilt_angle_deg: 10,
    azimuth_degrees: 180,
    dc_cable_length_m: 35,
    ac_cable_length_m: 40,
    earthing_pits_required: 4,
    lightning_arrester_feasible: true,
    inverter_location: 'Electrical panel room (Ground floor)',
    recommended_system_capacity_kw: 20.0,
    recommended_panels_count: 36,
    monthly_consumption_kwh: 2600,
    electricity_bill_amount: 22500,
    roof_suitability: 'highly_suitable',
    site_observations: 'Trapezoidal metal roofing sheets in solid condition. Flush-mount mini rails with EPDM gaskets recommended for zero puncture leaks.',
    next_action: 'Proceed to industrial 20kW quote with PM Surya Ghar commercial subsidy guidelines.',
    photos: [
      {
        id: 'p-301',
        category: 'roof_panorama',
        title: 'Peenya Industrial Metal Shed',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
        captured_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      },
    ],
    surveyor_signature: 'Ananya Deshmukh (Lic: SURV-KA-814)',
    customer_signature: 'Vikram Mehta (Director)',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: 'visit-004',
    lead_id: 'lead-sample-4',
    customer_name: 'Dr. Ramesh Kulkarni',
    phone: '+91 94480 33445',
    email: 'kulkarni.clinic@gmail.com',
    address: '89, 5th Main, Malleshwaram West',
    city: 'Bengaluru',
    pincode: '560003',
    discom_name: 'BESCOM',
    consumer_number: 'BES-33910284',
    sanctioned_load_kw: 4.0,
    connection_phase: 'single_phase',
    field_agent_id: 'agent-1',
    field_agent_name: 'Rajesh Sharma',
    field_agent_phone: '+91 98765 43210',
    scheduled_at: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    visit_status: 'scheduled',
    roof_type: 'flat_rcc',
    roof_age_years: 18,
    roof_condition_rating: 'needs_reinforcement',
    total_roof_area_sqft: 750,
    shadow_free_area_sqft: 450,
    parapet_height_ft: 4.0,
    optimal_tilt_angle_deg: 12,
    azimuth_degrees: 180,
    dc_cable_length_m: 12,
    ac_cable_length_m: 15,
    earthing_pits_required: 2,
    lightning_arrester_feasible: true,
    inverter_location: 'Terrace utility alcove',
    recommended_system_capacity_kw: 3.0,
    recommended_panels_count: 6,
    monthly_consumption_kwh: 360,
    electricity_bill_amount: 3100,
    roof_suitability: 'suitable_with_conditions',
    site_observations: 'Adjacent 4-story building casts afternoon shadow on North-West quadrant. Elevated super-structure (6ft clearance) required to elevate above parapet and clear shading.',
    next_action: 'Advise customer on elevated GI structure requirement and single-phase 3kW inverter suitability.',
    photos: [],
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
  },
];

export function getLocalSiteVisits(): SiteVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SITE_VISITS));
      return SEED_SITE_VISITS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_SITE_VISITS;
  }
}

export function saveLocalSiteVisits(visits: SiteVisit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch (err) {
    console.error('Failed to save site visits to localStorage', err);
  }
}

export function createSiteVisit(input: Partial<SiteVisit> & { customer_name: string; phone: string; address: string }): SiteVisit {
  const visits = getLocalSiteVisits();
  const id = `visit-${Date.now()}`;
  const now = new Date().toISOString();

  const newVisit: SiteVisit = {
    id,
    lead_id: input.lead_id || `lead-${Date.now()}`,
    customer_name: input.customer_name,
    phone: input.phone,
    email: input.email || undefined,
    address: input.address,
    city: input.city || 'Bengaluru',
    pincode: input.pincode || '560001',
    discom_name: input.discom_name || 'BESCOM (Bangalore Electricity Supply Co.)',
    consumer_number: input.consumer_number || `CON-${Math.floor(1000000 + Math.random() * 9000000)}`,
    sanctioned_load_kw: input.sanctioned_load_kw || 5.0,
    connection_phase: input.connection_phase || 'three_phase',
    field_agent_id: input.field_agent_id || 'agent-1',
    field_agent_name: input.field_agent_name || 'Rajesh Sharma',
    field_agent_phone: input.field_agent_phone || '+91 98765 43210',
    scheduled_at: input.scheduled_at || now,
    completed_at: input.completed_at || undefined,
    visit_status: input.visit_status || 'scheduled',
    gps_coordinates: input.gps_coordinates || undefined,
    roof_type: input.roof_type || 'flat_rcc',
    roof_age_years: input.roof_age_years || 5,
    roof_condition_rating: input.roof_condition_rating || 'excellent',
    total_roof_area_sqft: input.total_roof_area_sqft || 800,
    shadow_free_area_sqft: input.shadow_free_area_sqft || 600,
    parapet_height_ft: input.parapet_height_ft || 3.0,
    optimal_tilt_angle_deg: input.optimal_tilt_angle_deg || 13,
    azimuth_degrees: input.azimuth_degrees || 180,
    dc_cable_length_m: input.dc_cable_length_m || 15,
    ac_cable_length_m: input.ac_cable_length_m || 20,
    earthing_pits_required: input.earthing_pits_required || 3,
    lightning_arrester_feasible: input.lightning_arrester_feasible ?? true,
    inverter_location: input.inverter_location || 'Staircase head-room wall',
    recommended_system_capacity_kw: input.recommended_system_capacity_kw || 4.5,
    recommended_panels_count: input.recommended_panels_count || 8,
    monthly_consumption_kwh: input.monthly_consumption_kwh || 500,
    electricity_bill_amount: input.electricity_bill_amount || 4000,
    roof_suitability: input.roof_suitability || 'highly_suitable',
    site_observations: input.site_observations || 'Roof in good condition with clear southern exposure.',
    next_action: input.next_action || 'Prepare proposal and bill of materials.',
    photos: input.photos || [],
    surveyor_signature: input.surveyor_signature || undefined,
    customer_signature: input.customer_signature || undefined,
    created_at: now,
    updated_at: now,
  };

  const updated = [newVisit, ...visits];
  saveLocalSiteVisits(updated);
  return newVisit;
}

export function updateSiteVisit(id: string, updates: Partial<SiteVisit>): SiteVisit | null {
  const visits = getLocalSiteVisits();
  const index = visits.findIndex((v) => v.id === id);
  const existing = visits[index];
  if (index === -1 || !existing) return null;

  const updatedVisit: SiteVisit = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: new Date().toISOString(),
  };

  if (updates.visit_status === 'completed' && !updatedVisit.completed_at) {
    updatedVisit.completed_at = new Date().toISOString();
  }

  visits[index] = updatedVisit;
  saveLocalSiteVisits(visits);
  return updatedVisit;
}
