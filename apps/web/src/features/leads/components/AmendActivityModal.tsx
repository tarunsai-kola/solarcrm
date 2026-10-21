import { AlertCircle, History, Loader2, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';

import type { LeadActivity, Profile } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAmendActivity } from '../hooks/use-leads';

interface AmendActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  activity:
    | (LeadActivity & {
        author?: Pick<Profile, 'id' | 'full_name' | 'role'> | null;
      })
    | null;
}

export function AmendActivityModal({
  isOpen,
  onClose,
  leadId,
  activity,
}: AmendActivityModalProps) {
  const amendMutation = useAmendActivity();

  const [amendmentReason, setAmendmentReason] = useState('');
  const [correctedNotes, setCorrectedNotes] = useState('');

  if (!isOpen || !activity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amendmentReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a clear justification for this record amendment.',
        variant: 'destructive',
      });
      return;
    }

    if (!correctedNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please enter the corrected information or amendment notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await amendMutation.mutateAsync({
        leadId,
        activityId: activity.id,
        data: {
          amendment_reason: amendmentReason.trim(),
          notes: correctedNotes.trim(),
        },
      });

      toast({
        title: 'Amendment Recorded',
        description: 'Auditable correction has been appended to the activity history.',
      });

      setAmendmentReason('');
      setCorrectedNotes('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to Amend',
        description: err.response?.data?.message || err.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Record Auditable Amendment</h3>
              <p className="text-xs text-muted-foreground">
                Append a verified correction to historical log
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

        {/* Auditable Notice */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold block">Append-Only Audit Policy</span>
            <span>
              To maintain regulatory compliance and trust between sales & field teams, original records
              are never deleted or silently overwritten. This amendment will be permanently logged and
              linked to the original entry.
            </span>
          </div>
        </div>

        {/* Original Entry Snippet */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1 text-xs">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
            Original Activity Reference
          </span>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span className="font-medium text-foreground">
              {activity.author?.full_name || 'System'} ({activity.activity_type.replace(/_/g, ' ')})
            </span>
            <span>
              {new Date(activity.occurred_at || activity.created_at).toLocaleString('en-IN', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <p className="text-muted-foreground italic line-clamp-2 mt-1">"{activity.notes}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Reason for Amendment <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="e.g. Typo in rooftop shade percentage / Clarified customer financing preference"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Corrected Notes / Clarification <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={correctedNotes}
              onChange={(e) => setCorrectedNotes(e.target.value)}
              placeholder="State the accurate conversation details, updated figures, or correct customer statement..."
              className="flex w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={amendMutation.isPending}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {amendMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Amendment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
