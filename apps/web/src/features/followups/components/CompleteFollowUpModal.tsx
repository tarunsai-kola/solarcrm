import { CheckCircle2, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  useCompleteFollowUp,
  type FollowUpWithRelations,
} from '../hooks/use-followups';

interface CompleteFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUpWithRelations | null;
}

export function CompleteFollowUpModal({
  isOpen,
  onClose,
  followUp,
}: CompleteFollowUpModalProps) {
  const completeMutation = useCompleteFollowUp();
  const [completionNotes, setCompletionNotes] = useState('');

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!completionNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please describe the outcome of this follow-up conversation.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await completeMutation.mutateAsync({
        id: followUp.id,
        payload: {
          notes: completionNotes.trim(),
          outcome: 'Completed',
        },
      });

      toast({
        title: 'Follow-up Completed',
        description: `Follow-up for ${followUp.lead?.customer_name || 'lead'} marked completed.`,
      });

      setCompletionNotes('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to Complete',
        description: err.response?.data?.message || err.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Complete Follow-up</h3>
              <p className="text-xs text-muted-foreground">
                Lead: <span className="font-semibold text-foreground">{followUp.lead?.customer_name || 'Customer'}</span>
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

        {/* Existing Follow-up Context */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
          <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
            Scheduled Objective
          </span>
          <p className="text-foreground">{followUp.notes || 'Routine follow-up task'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Outcome & Closing Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Connected with customer. Verified 5kW quotation received. Customer requested physical site inspection for Saturday 11 AM..."
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
              disabled={completeMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {completeMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Mark as Completed
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
