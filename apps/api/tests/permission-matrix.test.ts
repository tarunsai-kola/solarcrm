import { describe, expect, it } from 'vitest';
import type { AppRole } from '@solar-crm/shared';

/**
 * Model of the Security Policy Engine that mirrors PostgreSQL RLS & Triggers
 */
interface UserContext {
  userId: string;
  organizationId: string;
  role: AppRole;
  isActive: boolean;
}

interface LeadRecord {
  id: string;
  organizationId: string;
  customerName: string;
  assignedFieldAgentId: string | null;
  inboundSalesId: string | null;
  createdBy: string;
  status: string;
}

interface SiteVisitRecord {
  id: string;
  organizationId: string;
  leadId: string;
  fieldAgentId: string;
  visitStatus: string;
}

interface AuditLogRecord {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
}

/**
 * Policy Evaluator representing the database RLS policies defined in migrations
 */
class RlsPolicyEvaluator {
  // ─── Profiles & Role Escalation Trigger ──────────────────────────────────
  static canUpdateProfileRole(
    actor: UserContext,
    targetUserId: string,
    targetOrgId: string,
    oldRole: AppRole,
    newRole: AppRole,
  ): { permitted: boolean; reason?: string } {
    if (!actor.isActive) return { permitted: false, reason: 'Account inactive' };
    if (actor.organizationId !== targetOrgId) {
      return { permitted: false, reason: 'Cross-organization modification denied' };
    }
    if (oldRole !== newRole) {
      if (actor.role !== 'admin') {
        return { permitted: false, reason: 'Unauthorized: Only administrators can modify user roles.' };
      }
      if (actor.userId === targetUserId && newRole !== 'admin') {
        return { permitted: false, reason: 'Unauthorized: Administrators cannot change their own role.' };
      }
    }
    return { permitted: true };
  }

  // ─── Leads Table RLS ─────────────────────────────────────────────────────
  static canSelectLead(user: UserContext, lead: LeadRecord): boolean {
    if (!user.isActive) return false;
    // Multi-tenant boundary
    if (user.organizationId !== lead.organizationId) return false;

    // Admin: can read all leads in organization
    if (user.role === 'admin') return true;

    // Inbound Sales: can read all leads in organization
    if (user.role === 'inbound_sales') return true;

    // Field Agent: can ONLY read leads assigned to them
    if (user.role === 'field_agent') {
      return lead.assignedFieldAgentId === user.userId;
    }

    return false;
  }

  static canInsertLead(user: UserContext, targetOrgId: string): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== targetOrgId) return false;
    // Only Admin and Inbound Sales can insert leads
    return user.role === 'admin' || user.role === 'inbound_sales';
  }

  static canUpdateLead(user: UserContext, lead: LeadRecord): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== lead.organizationId) return false;

    if (user.role === 'admin') return true;
    if (user.role === 'inbound_sales') return true;
    if (user.role === 'field_agent') {
      return lead.assignedFieldAgentId === user.userId;
    }
    return false;
  }

  static canDeleteLead(user: UserContext, lead: LeadRecord): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== lead.organizationId) return false;
    // Strictly Admin only
    return user.role === 'admin';
  }

  // ─── Site Visits RLS ─────────────────────────────────────────────────────
  static canSelectSiteVisit(user: UserContext, visit: SiteVisitRecord): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== visit.organizationId) return false;

    if (user.role === 'admin' || user.role === 'inbound_sales') return true;
    if (user.role === 'field_agent') {
      return visit.fieldAgentId === user.userId;
    }
    return false;
  }

  static canUpdateSiteVisit(user: UserContext, visit: SiteVisitRecord): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== visit.organizationId) return false;

    if (user.role === 'admin' || user.role === 'inbound_sales') return true;
    if (user.role === 'field_agent') {
      return visit.fieldAgentId === user.userId;
    }
    return false;
  }

  // ─── Company Financials & Settings RLS ───────────────────────────────────
  static canManageCompanySettings(user: UserContext, targetOrgId: string): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== targetOrgId) return false;
    return user.role === 'admin';
  }

  // ─── Audit Logs RLS & Immutability Trigger ────────────────────────────────
  static canSelectAuditLogs(user: UserContext, targetOrgId: string): boolean {
    if (!user.isActive) return false;
    if (user.organizationId !== targetOrgId) return false;
    return user.role === 'admin';
  }

  static canModifyAuditLog(_user: UserContext, _log: AuditLogRecord): boolean {
    // Audit logs are strictly immutable: RLS and Trigger always deny UPDATE and DELETE
    return false;
  }
}

describe('Permission Matrix & Security Boundary Verification', () => {
  // Test Tenants
  const ORG_A = '00000000-0000-0000-0000-000000000001';
  const ORG_B = '00000000-0000-0000-0000-000000000002';

  // Test Users
  const adminOrgA: UserContext = {
    userId: '11111111-1111-1111-1111-111111111111',
    organizationId: ORG_A,
    role: 'admin',
    isActive: true,
  };

  const salesOrgA: UserContext = {
    userId: '22222222-2222-2222-2222-222222222222',
    organizationId: ORG_A,
    role: 'inbound_sales',
    isActive: true,
  };

  const agent1OrgA: UserContext = {
    userId: '33333333-3333-3333-3333-333333333333',
    organizationId: ORG_A,
    role: 'field_agent',
    isActive: true,
  };

  const agent2OrgA: UserContext = {
    userId: '44444444-4444-4444-4444-444444444444',
    organizationId: ORG_A,
    role: 'field_agent',
    isActive: true,
  };

  const adminOrgB: UserContext = {
    userId: '55555555-5555-5555-5555-555555555555',
    organizationId: ORG_B,
    role: 'admin',
    isActive: true,
  };

  // Test Leads
  const leadAssignedToAgent1: LeadRecord = {
    id: 'lead-1',
    organizationId: ORG_A,
    customerName: 'Anil Gupta',
    assignedFieldAgentId: agent1OrgA.userId,
    inboundSalesId: salesOrgA.userId,
    createdBy: salesOrgA.userId,
    status: 'site_visit_scheduled',
  };

  const leadAssignedToAgent2: LeadRecord = {
    id: 'lead-2',
    organizationId: ORG_A,
    customerName: 'Sunil Deshmukh',
    assignedFieldAgentId: agent2OrgA.userId,
    inboundSalesId: salesOrgA.userId,
    createdBy: salesOrgA.userId,
    status: 'qualified',
  };

  const leadUnassignedOrgA: LeadRecord = {
    id: 'lead-3',
    organizationId: ORG_A,
    customerName: 'Kavita Iyer',
    assignedFieldAgentId: null,
    inboundSalesId: null,
    createdBy: salesOrgA.userId,
    status: 'new',
  };

  const leadOrgB: LeadRecord = {
    id: 'lead-4',
    organizationId: ORG_B,
    customerName: 'Ramesh Patel',
    assignedFieldAgentId: null,
    inboundSalesId: null,
    createdBy: adminOrgB.userId,
    status: 'new',
  };

  describe('1. Role Escalation Prevention', () => {
    it('denies a non-admin user changing their role to admin', () => {
      const result = RlsPolicyEvaluator.canUpdateProfileRole(
        salesOrgA,
        salesOrgA.userId,
        ORG_A,
        'inbound_sales',
        'admin',
      );
      expect(result.permitted).toBe(false);
      expect(result.reason).toContain('Only administrators can modify user roles');
    });

    it('denies a field agent changing their role to inbound_sales or admin', () => {
      const result = RlsPolicyEvaluator.canUpdateProfileRole(
        agent1OrgA,
        agent1OrgA.userId,
        ORG_A,
        'field_agent',
        'admin',
      );
      expect(result.permitted).toBe(false);
      expect(result.reason).toContain('Only administrators can modify user roles');
    });

    it('denies an administrator demoting themselves to prevent accidental lockout', () => {
      const result = RlsPolicyEvaluator.canUpdateProfileRole(
        adminOrgA,
        adminOrgA.userId,
        ORG_A,
        'admin',
        'field_agent',
      );
      expect(result.permitted).toBe(false);
      expect(result.reason).toContain('Administrators cannot change their own role');
    });

    it('allows an administrator to change another user role within their organization', () => {
      const result = RlsPolicyEvaluator.canUpdateProfileRole(
        adminOrgA,
        agent1OrgA.userId,
        ORG_A,
        'field_agent',
        'inbound_sales',
      );
      expect(result.permitted).toBe(true);
    });

    it('denies an administrator changing user roles in a different organization', () => {
      const result = RlsPolicyEvaluator.canUpdateProfileRole(
        adminOrgA,
        adminOrgB.userId,
        ORG_B,
        'admin',
        'field_agent',
      );
      expect(result.permitted).toBe(false);
    });
  });

  describe('2. Multi-Tenant Cross-Organization Isolation', () => {
    it('denies Org A admin accessing leads in Org B', () => {
      expect(RlsPolicyEvaluator.canSelectLead(adminOrgA, leadOrgB)).toBe(false);
      expect(RlsPolicyEvaluator.canUpdateLead(adminOrgA, leadOrgB)).toBe(false);
      expect(RlsPolicyEvaluator.canDeleteLead(adminOrgA, leadOrgB)).toBe(false);
    });

    it('denies Org A sales rep inserting a lead into Org B', () => {
      expect(RlsPolicyEvaluator.canInsertLead(salesOrgA, ORG_B)).toBe(false);
    });

    it('denies Org A admin accessing audit logs of Org B', () => {
      expect(RlsPolicyEvaluator.canSelectAuditLogs(adminOrgA, ORG_B)).toBe(false);
    });
  });

  describe('3. Field Agent Data Partitioning (Permitted vs Denied)', () => {
    it('permits Field Agent 1 to read and update leads explicitly assigned to them', () => {
      expect(RlsPolicyEvaluator.canSelectLead(agent1OrgA, leadAssignedToAgent1)).toBe(true);
      expect(RlsPolicyEvaluator.canUpdateLead(agent1OrgA, leadAssignedToAgent1)).toBe(true);
    });

    it('denies Field Agent 1 from reading leads assigned to Field Agent 2', () => {
      expect(RlsPolicyEvaluator.canSelectLead(agent1OrgA, leadAssignedToAgent2)).toBe(false);
      expect(RlsPolicyEvaluator.canUpdateLead(agent1OrgA, leadAssignedToAgent2)).toBe(false);
    });

    it('denies Field Agent 1 from reading unassigned leads in the organization', () => {
      expect(RlsPolicyEvaluator.canSelectLead(agent1OrgA, leadUnassignedOrgA)).toBe(false);
    });

    it('denies Field Agents from inserting or deleting leads', () => {
      expect(RlsPolicyEvaluator.canInsertLead(agent1OrgA, ORG_A)).toBe(false);
      expect(RlsPolicyEvaluator.canDeleteLead(agent1OrgA, leadAssignedToAgent1)).toBe(false);
    });

    it('permits Field Agent to view only their own site visits', () => {
      const visitAgent1: SiteVisitRecord = {
        id: 'visit-1',
        organizationId: ORG_A,
        leadId: leadAssignedToAgent1.id,
        fieldAgentId: agent1OrgA.userId,
        visitStatus: 'scheduled',
      };

      const visitAgent2: SiteVisitRecord = {
        id: 'visit-2',
        organizationId: ORG_A,
        leadId: leadAssignedToAgent2.id,
        fieldAgentId: agent2OrgA.userId,
        visitStatus: 'scheduled',
      };

      expect(RlsPolicyEvaluator.canSelectSiteVisit(agent1OrgA, visitAgent1)).toBe(true);
      expect(RlsPolicyEvaluator.canUpdateSiteVisit(agent1OrgA, visitAgent1)).toBe(true);

      // Access to other agent's visit is strictly denied
      expect(RlsPolicyEvaluator.canSelectSiteVisit(agent1OrgA, visitAgent2)).toBe(false);
      expect(RlsPolicyEvaluator.canUpdateSiteVisit(agent1OrgA, visitAgent2)).toBe(false);
    });
  });

  describe('4. Inbound Sales Permissions (Permitted vs Denied)', () => {
    it('permits Inbound Sales to view and manage all leads within their organization', () => {
      expect(RlsPolicyEvaluator.canSelectLead(salesOrgA, leadAssignedToAgent1)).toBe(true);
      expect(RlsPolicyEvaluator.canSelectLead(salesOrgA, leadAssignedToAgent2)).toBe(true);
      expect(RlsPolicyEvaluator.canSelectLead(salesOrgA, leadUnassignedOrgA)).toBe(true);
      expect(RlsPolicyEvaluator.canInsertLead(salesOrgA, ORG_A)).toBe(true);
      expect(RlsPolicyEvaluator.canUpdateLead(salesOrgA, leadUnassignedOrgA)).toBe(true);
    });

    it('denies Inbound Sales from deleting leads (reserved for Admin)', () => {
      expect(RlsPolicyEvaluator.canDeleteLead(salesOrgA, leadUnassignedOrgA)).toBe(false);
    });

    it('denies Inbound Sales from accessing audit logs', () => {
      expect(RlsPolicyEvaluator.canSelectAuditLogs(salesOrgA, ORG_A)).toBe(false);
    });

    it('denies Inbound Sales from modifying company settings or bank accounts', () => {
      expect(RlsPolicyEvaluator.canManageCompanySettings(salesOrgA, ORG_A)).toBe(false);
    });
  });

  describe('5. Audit Log Immutability & Admin Audit Access', () => {
    const dummyLog: AuditLogRecord = {
      id: 'log-1',
      organizationId: ORG_A,
      actorId: adminOrgA.userId,
      action: 'create',
    };

    it('permits Admin to view audit logs in their own organization', () => {
      expect(RlsPolicyEvaluator.canSelectAuditLogs(adminOrgA, ORG_A)).toBe(true);
    });

    it('denies Field Agents and Sales Reps from viewing audit logs', () => {
      expect(RlsPolicyEvaluator.canSelectAuditLogs(agent1OrgA, ORG_A)).toBe(false);
      expect(RlsPolicyEvaluator.canSelectAuditLogs(salesOrgA, ORG_A)).toBe(false);
    });

    it('denies all roles including Admin from modifying or deleting audit logs', () => {
      expect(RlsPolicyEvaluator.canModifyAuditLog(adminOrgA, dummyLog)).toBe(false);
      expect(RlsPolicyEvaluator.canModifyAuditLog(salesOrgA, dummyLog)).toBe(false);
      expect(RlsPolicyEvaluator.canModifyAuditLog(agent1OrgA, dummyLog)).toBe(false);
    });
  });
});
