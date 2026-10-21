import {
  AlertCircle,
  AlertTriangle,
  Award,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Info,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { EligibleAgentMatch } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  useAssignFieldAgent,
  useEligibleAgents,
  type LeadWithRelations,
} from '../hooks/use-leads';

interface AssignFieldAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithRelations;
}

const AVAILABILITY_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  available: {
    label: 'Available',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  busy: {
    label: 'Busy',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  on_leave: {
    label: 'On Leave',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    dot: 'bg-red-500',
  },
  offline: {
    label: 'Offline',
    badge: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
};

export function AssignFieldAgentModal({
  isOpen,
  onClose,
  lead,
}: AssignFieldAgentModalProps) {
  const { role } = useAuth();
  const isFieldAgent = role === 'field_agent';

  const { data: eligibilityData, isLoading, error } = useEligibleAgents(lead?.id || '');
  const assignMutation = useAssignFieldAgent();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Default selection to recommended agent or current assigned agent
  useEffect(() => {
    if (eligibilityData?.agents && eligibilityData.agents.length > 0) {
      const recommended = eligibilityData.agents.find((a) => a.recommended);
      const current = eligibilityData.agents.find(
        (a) => a.agent_id === lead.assigned_field_agent_id,
      );
      if (recommended) {
        setSelectedAgentId(recommended.agent_id);
      } else if (current) {
        setSelectedAgentId(current.agent_id);
      } else if (eligibilityData.agents[0]) {
        setSelectedAgentId(eligibilityData.agents[0].agent_id);
      }
    }
  }, [eligibilityData, lead.assigned_field_agent_id]);

  if (!isOpen) return null;

  const agents = eligibilityData?.agents || [];
  const selectedAgent = agents.find((a) => a.agent_id === selectedAgentId);
  const isReassignment = !!lead.assigned_field_agent_id;
  const isOverrideNeeded =
    selectedAgent &&
    (selectedAgent.is_at_capacity ||
      (!selectedAgent.is_pincode_match && !selectedAgent.is_base_pincode_match) ||
      selectedAgent.availability !== 'available');

  const filteredAgents = agents.filter((a) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase().trim();
    return (
      a.full_name.toLowerCase().includes(term) ||
      (a.phone && a.phone.includes(term)) ||
      (a.base_pincode && a.base_pincode.includes(term)) ||
      a.service_pincodes.some((p) => p.includes(term)) ||
      a.service_areas.some((area) => area.toLowerCase().includes(term))
    );
  });

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFieldAgent) {
      toast({
        title: 'Permission Denied',
        description: 'Field agents are not permitted to assign or reassign leads.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAgentId) {
      toast({
        title: 'Agent Required',
        description: 'Please select a field agent to assign.',
        variant: 'destructive',
      });
      return;
    }

    if (isOverrideNeeded && !overrideReason.trim()) {
      toast({
        title: 'Override Reason Required',
        description:
          'The selected agent is at capacity or does not have an exact service pincode match. Please provide an override reason.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assignMutation.mutateAsync({
        leadId: lead.id,
        agentId: selectedAgentId,
        overrideReason: overrideReason.trim() || undefined,
      });

      toast({
        title: isReassignment ? 'Agent Reassigned' : 'Agent Assigned',
        description: `Lead ${lead.customer_name} assigned to ${selectedAgent?.full_name}.`,
      });

      onClose();
    } catch (err: any) {
      toast({
        title: 'Assignment Failed',
        description: err.response?.data?.message || err.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isReassignment ? 'Reassign Field Agent' : 'Assign Field Agent'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Pincode & workload matching engine for Lead:{' '}
                <span className="font-semibold text-foreground">{lead.customer_name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lead Context Bar */}
        <div className="rounded-xl border border-border bg-muted/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              Target Pincode:{' '}
              {lead.pincode ? (
                <span className="rounded bg-primary/15 text-primary px-1.5 py-0.5 font-bold">
                  {lead.pincode}
                </span>
              ) : (
                <span className="italic text-muted-foreground">Not specified</span>
              )}
            </span>

            {lead.area && (
              <span className="text-muted-foreground">
                Area: <strong className="text-foreground">{lead.area}</strong>
              </span>
            )}

            <span className="text-muted-foreground">
              Phone: <strong className="text-foreground">{lead.phone}</strong>
            </span>
          </div>

          <div className="text-right text-[11px]">
            <span className="text-muted-foreground block">Current Assignment:</span>
            <span className="font-semibold text-foreground">
              {lead.assigned_field_agent?.full_name ? (
                <span className="text-cyan-600 dark:text-cyan-400">
                  {lead.assigned_field_agent.full_name}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Unassigned</span>
              )}
            </span>
          </div>
        </div>

        {/* Permission Notice for Field Agents */}
        {isFieldAgent && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold block">View-Only Access</span>
              <span>
                As a Field Agent, you can inspect service pincode recommendations, but only Inbound
                Sales and Admins can assign or reassign leads.
              </span>
            </div>
          </div>
        )}

        {/* Pincode Matching Status Banner */}
        {eligibilityData && !eligibilityData.has_exact_pincode_match && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold block">No Exact Service Pincode Match</span>
              <span>
                {eligibilityData.unassigned_reason ||
                  `No active field agents currently have ${lead.pincode} in their configured service pincodes.`}{' '}
                Alternative agents covering nearby areas are ranked below. Selecting an agent without
                an exact match will require an override reason.
              </span>
            </div>
          </div>
        )}

        {/* Search bar inside modal */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search agents by name, base pincode, or service area..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 text-xs pl-3"
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredAgents.length} agent(s) available
          </span>
        </div>

        {/* Agents List */}
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                Analyzing service pincodes, capacities, and availability...
              </p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2 bg-card/40">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-foreground">No eligible field agents found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active field agents in the organization match your filter. Check user management
                to add or activate field agent accounts.
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.agent_id;
                const fallbackAvail = {
                  label: 'Available',
                  badge:
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  dot: 'bg-emerald-500',
                };
                const availConfig = AVAILABILITY_CONFIG[agent.availability] ?? fallbackAvail;
                const capacityPct = Math.round(
                  (agent.current_active_leads / Math.max(1, agent.max_active_leads)) * 100,
                );

                return (
                  <div
                    key={agent.agent_id}
                    onClick={() => setSelectedAgentId(agent.agent_id)}
                    className={`rounded-xl border p-3.5 transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    {/* Top Row: Name, Phone, Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="assignedAgent"
                          checked={isSelected}
                          onChange={() => setSelectedAgentId(agent.agent_id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        <span className="font-bold text-sm text-foreground">
                          {agent.full_name}
                        </span>
                        {agent.phone && (
                          <span className="text-muted-foreground text-xs">({agent.phone})</span>
                        )}

                        {/* Availability Pill */}
                        <span
                          className={`flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${availConfig.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${availConfig.dot}`} />
                          {availConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Recommended Match Badge */}
                        {agent.recommended && (
                          <span className="flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            <Sparkles className="h-3 w-3" />
                            TOP RECOMMENDATION
                          </span>
                        )}

                        {/* Score Badge */}
                        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-bold text-foreground">
                          Match Score: {agent.score} pts
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Metrics & Pincodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40 text-[11px]">
                      {/* Workload */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Active Workload:</span>
                          <span
                            className={`font-bold ${
                              agent.is_at_capacity
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
                            }`}
                          >
                            {agent.current_active_leads} / {agent.max_active_leads} leads
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              capacityPct >= 100
                                ? 'bg-red-500'
                                : capacityPct >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, capacityPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Pending Visits */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary shrink-0" />
                        <span>Pending Site Visits:</span>
                        <strong className="text-foreground">{agent.pending_site_visits}</strong>
                      </div>

                      {/* Base Pincode */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>Base Pincode:</span>
                        <strong
                          className={
                            agent.is_base_pincode_match
                              ? 'text-primary font-bold'
                              : 'text-foreground'
                          }
                        >
                          {agent.base_pincode || 'None'}
                        </strong>
                      </div>
                    </div>

                    {/* Geographical Coverage Tags */}
                    <div className="space-y-1 text-[11px]">
                      {/* Service Pincodes */}
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <span className="font-semibold text-foreground">Service Pincodes:</span>
                        {agent.service_pincodes.length === 0 ? (
                          <span className="italic">None configured</span>
                        ) : (
                          agent.service_pincodes.map((pin) => {
                            const isMatch = lead.pincode && pin === lead.pincode;
                            return (
                              <span
                                key={pin}
                                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                                  isMatch
                                    ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                                    : 'bg-muted text-muted-foreground border border-border'
                                }`}
                              >
                                {pin}
                                {isMatch && ' ✓'}
                              </span>
                            );
                          })
                        )}
                      </div>

                      {/* Service Areas */}
                      {agent.service_areas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <span className="font-semibold text-foreground">Areas:</span>
                          {agent.service_areas.map((area) => {
                            const isAreaMatch =
                              lead.area && area.toLowerCase() === lead.area.toLowerCase();
                            return (
                              <span
                                key={area}
                                className={`rounded px-1.5 py-0.2 text-[10px] ${
                                  isAreaMatch
                                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold'
                                    : 'bg-muted/50 text-muted-foreground'
                                }`}
                              >
                                {area}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recommendation Reason Callout */}
                    <div
                      className={`rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5 ${
                        agent.recommended
                          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
                          : agent.is_at_capacity
                            ? 'bg-red-500/10 text-red-800 dark:text-red-200 border border-red-500/20'
                            : 'bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      <Info className="h-3 w-3 shrink-0" />
                      <span>
                        <strong>Matching Analysis:</strong> {agent.recommendation_reason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Override Reason Field */}
          {selectedAgent && (
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
              <label className="font-semibold text-foreground block">
                {isOverrideNeeded ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Administrative Override Reason <span className="text-destructive">*</span>
                  </span>
                ) : (
                  'Assignment Note / Override Reason (Optional)'
                )}
              </label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder={
                  isOverrideNeeded
                    ? 'State justification for assigning agent outside service pincode or at maximum workload capacity...'
                    : 'Add any specific assignment instructions, rooftop feasibility focus, or notes...'
                }
                className="flex w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:ring-1 focus:ring-ring"
                required={!!isOverrideNeeded}
              />
              {isOverrideNeeded && (
                <p className="text-[11px] text-muted-foreground">
                  The selected agent is currently at capacity or does not list {lead.pincode} as an
                  active service pincode. This reason will be permanently recorded in the audit history.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={assignMutation.isPending || isFieldAgent || !selectedAgentId}
              className="gap-1.5 bg-primary text-primary-foreground"
            >
              {assignMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <UserCheck className="h-3.5 w-3.5" />
              {isReassignment ? 'Confirm Reassignment' : 'Assign Field Agent'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
