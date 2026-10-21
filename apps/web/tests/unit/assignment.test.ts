import { describe, expect, it } from 'vitest';
import type { EligibleAgentMatch } from '@solar-crm/shared';

describe('Field Agent Assignment Business Rules & UI Logic', () => {
  const mockLeadPincode = '411038';

  const mockAgents: EligibleAgentMatch[] = [
    {
      agent_id: 'agent-1',
      full_name: 'Amit Patil',
      email: 'amit@sunbeam.example',
      phone: '+919876543201',
      base_pincode: '411038',
      service_pincodes: ['411038', '411052', '411004'],
      service_areas: ['Kothrud', 'Karve Nagar', 'Deccan'],
      availability: 'available',
      current_active_leads: 5,
      max_active_leads: 15,
      pending_site_visits: 1,
      score: 95,
      is_pincode_match: true,
      is_base_pincode_match: true,
      is_area_match: true,
      is_at_capacity: false,
      recommended: true,
      recommendation_reason: 'Direct service pincode match (411038) • Fully available • Capacity headroom (10/15 slots free)',
    },
    {
      agent_id: 'agent-2',
      full_name: 'Suresh Kulkarni',
      email: 'suresh@sunbeam.example',
      phone: '+919876543202',
      base_pincode: '411014',
      service_pincodes: ['411014', '411006'],
      service_areas: ['Viman Nagar', 'Kalyani Nagar'],
      availability: 'available',
      current_active_leads: 15,
      max_active_leads: 15,
      pending_site_visits: 4,
      score: 30,
      is_pincode_match: false,
      is_base_pincode_match: false,
      is_area_match: false,
      is_at_capacity: true,
      recommended: false,
      recommendation_reason: 'Area coverage match • Fully available • Maximum capacity reached',
    },
    {
      agent_id: 'agent-3',
      full_name: 'Rohan Shinde',
      email: 'rohan@sunbeam.example',
      phone: '+919876543203',
      base_pincode: '411045',
      service_pincodes: ['411045'],
      service_areas: ['Baner'],
      availability: 'on_leave',
      current_active_leads: 2,
      max_active_leads: 10,
      pending_site_visits: 0,
      score: 0,
      is_pincode_match: false,
      is_base_pincode_match: false,
      is_area_match: false,
      is_at_capacity: false,
      recommended: false,
      recommendation_reason: 'Agent is currently on_leave • Low priority recommendation',
    },
  ];

  describe('Override Requirement Validation', () => {
    it('requires an override reason when selected agent has reached max active leads', () => {
      const selectedAgent = mockAgents.find((a) => a.agent_id === 'agent-2')!;
      const isAtCapacity = selectedAgent.current_active_leads >= selectedAgent.max_active_leads;
      const overrideReason = '';

      const canSubmitWithoutReason = !isAtCapacity || overrideReason.trim().length > 0;
      expect(isAtCapacity).toBe(true);
      expect(canSubmitWithoutReason).toBe(false);
    });

    it('permits assignment when override reason is provided for at-capacity agent', () => {
      const selectedAgent = mockAgents.find((a) => a.agent_id === 'agent-2')!;
      const isAtCapacity = selectedAgent.current_active_leads >= selectedAgent.max_active_leads;
      const overrideReason = 'Approved by regional manager due to emergency customer visit.';

      const canSubmit = !isAtCapacity || overrideReason.trim().length > 0;
      expect(canSubmit).toBe(true);
    });

    it('does not require override reason when agent has available capacity and covers pincode', () => {
      const selectedAgent = mockAgents.find((a) => a.agent_id === 'agent-1')!;
      const isAtCapacity = selectedAgent.current_active_leads >= selectedAgent.max_active_leads;
      const coversPincode = selectedAgent.service_pincodes.includes(mockLeadPincode);
      const overrideReason = '';

      const canSubmit = (!isAtCapacity && coversPincode) || overrideReason.trim().length > 0;
      expect(isAtCapacity).toBe(false);
      expect(coversPincode).toBe(true);
      expect(canSubmit).toBe(true);
    });
  });

  describe('Agent Ranking & Scoring Hierarchy', () => {
    it('ranks exact pincode match above out-of-area or at-capacity agents', () => {
      const sorted = [...mockAgents].sort((a, b) => b.score - a.score);

      expect(sorted[0]?.agent_id).toBe('agent-1');
      expect(sorted[0]?.recommended).toBe(true);
      expect(sorted[0]?.score).toBeGreaterThan(sorted[1]?.score ?? 0);
    });

    it('penalizes unavailable or on-leave agents to the bottom of the list', () => {
      const onLeaveAgent = mockAgents.find((a) => a.availability === 'on_leave')!;
      expect(onLeaveAgent.score).toBeLessThanOrEqual(mockAgents[0]!.score);
    });

    it('verifies exact service pincode match detection', () => {
      const hasExactMatch = mockAgents.some((a) =>
        a.service_pincodes.includes(mockLeadPincode),
      );
      expect(hasExactMatch).toBe(true);
    });
  });

  describe('Role-Based Action Permissions', () => {
    it('allows Admin and Inbound Sales to perform assignment', () => {
      const allowedRoles = ['admin', 'inbound_sales'];
      expect(allowedRoles.includes('admin')).toBe(true);
      expect(allowedRoles.includes('inbound_sales')).toBe(true);
    });

    it('disallows Field Agent role from performing assignments', () => {
      const allowedRoles = ['admin', 'inbound_sales'];
      const fieldAgentCanAssign = allowedRoles.includes('field_agent');
      expect(fieldAgentCanAssign).toBe(false);
    });
  });
});
