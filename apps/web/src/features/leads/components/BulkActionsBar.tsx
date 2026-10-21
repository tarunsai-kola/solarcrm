import { Check, CheckCircle2, ChevronDown, Loader2, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

import { LEAD_STATUSES, LEAD_STATUS_CONFIG, type LeadStatus } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useBulkAssignLeads, useBulkStatusUpdate, useTeamMembers } from '../hooks/use-leads';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedLeadIds: string[];
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedLeadIds,
  onClearSelection,
}: BulkActionsBarProps) {
  const { data: team } = useTeamMembers();
  const bulkAssignMutation = useBulkAssignLeads();
  const bulkStatusMutation = useBulkStatusUpdate();

  const [activeAction, setActiveAction] = useState<'assign_sales' | 'assign_agent' | 'status' | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('contacted');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedSalesId, setSelectedSalesId] = useState('');

  if (selectedCount === 0) return null;

  const handleBulkStatus = async () => {
    try {
      await bulkStatusMutation.mutateAsync({
        lead_ids: selectedLeadIds,
        status: selectedStatus,
      });
      toast({
        title: 'Bulk Status Updated',
        description: `Successfully updated ${selectedCount} leads to ${LEAD_STATUS_CONFIG[selectedStatus]?.label ?? selectedStatus}.`,
      });
      setActiveAction(null);
      onClearSelection();
    } catch (err: any) {
      toast({
        title: 'Bulk update failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssignAgent = async () => {
    if (!selectedAgentId) return;
    try {
      await bulkAssignMutation.mutateAsync({
        lead_ids: selectedLeadIds,
        assigned_field_agent_id: selectedAgentId,
      });
      toast({
        title: 'Bulk Field Agent Assigned',
        description: `Assigned ${selectedCount} leads to field agent.`,
      });
      setActiveAction(null);
      onClearSelection();
    } catch (err: any) {
      toast({
        title: 'Bulk assignment failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssignSales = async () => {
    if (!selectedSalesId) return;
    try {
      await bulkAssignMutation.mutateAsync({
        lead_ids: selectedLeadIds,
        inbound_sales_id: selectedSalesId,
      });
      toast({
        title: 'Bulk Salesperson Assigned',
        description: `Assigned ${selectedCount} leads to salesperson.`,
      });
      setActiveAction(null);
      onClearSelection();
    } catch (err: any) {
      toast({
        title: 'Bulk assignment failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-200">
      <div className="pointer-events-auto rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md px-5 py-3 shadow-2xl flex flex-wrap items-center gap-3 text-xs max-w-4xl border-t-2 border-t-primary">
        <div className="flex items-center gap-2 border-r border-border pr-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
            {selectedCount}
          </span>
          <span className="font-semibold text-foreground">
            {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Status Update */}
          {activeAction === 'status' ? (
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {LEAD_STATUS_CONFIG[st]?.label ?? st}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={bulkStatusMutation.isPending}
                onClick={handleBulkStatus}
              >
                {bulkStatusMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setActiveAction(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              id="bulk-status-btn"
              className="h-8 text-xs gap-1.5"
              onClick={() => setActiveAction('status')}
            >
              Update Status
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}

          {/* 2. Assign Field Agent */}
          {activeAction === 'assign_agent' ? (
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">Select Field Agent</option>
                {team?.fieldAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={!selectedAgentId || bulkAssignMutation.isPending}
                onClick={handleBulkAssignAgent}
              >
                {bulkAssignMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Assign
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setActiveAction(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              id="bulk-assign-agent-btn"
              className="h-8 text-xs gap-1.5"
              onClick={() => setActiveAction('assign_agent')}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Assign Field Agent
            </Button>
          )}

          {/* 3. Assign Salesperson */}
          {activeAction === 'assign_sales' ? (
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
              <select
                value={selectedSalesId}
                onChange={(e) => setSelectedSalesId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">Select Salesperson</option>
                {team?.inboundSales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={!selectedSalesId || bulkAssignMutation.isPending}
                onClick={handleBulkAssignSales}
              >
                {bulkAssignMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Assign
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setActiveAction(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              id="bulk-assign-sales-btn"
              className="h-8 text-xs gap-1.5"
              onClick={() => setActiveAction('assign_sales')}
            >
              <Users className="h-3.5 w-3.5" />
              Assign Salesperson
            </Button>
          )}
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Deselect all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
