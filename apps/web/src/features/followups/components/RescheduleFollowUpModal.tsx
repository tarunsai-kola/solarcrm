import { Calendar, Clock, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  useRescheduleFollowUp,
  type FollowUpWithRelations,
} from '../hooks/use-followups';

interface RescheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUpWithRelations | null;
}

export function RescheduleFollowUpModal({
  isOpen,
  onClose,
  followUp,
}: RescheduleFollowUpModalProps) {
  const rescheduleMutation = useRescheduleFollowUp();

  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDueDate) {
      toast({
        title: 'New Date Required',
        description: 'Please select a new date and time for the follow-up.',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a justification for rescheduling this follow-up.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        id: followUp.id,
        reschedule: {
          due_at: new Date(newDueDate).toISOString(),
          reason: reason.trim(),
        },
      });

      toast({
        title: 'Follow-up Rescheduled',
        description: `Follow-up for ${followUp.lead?.customer_name || 'lead'} moved to ${new Date(
          newDueDate,
        ).toLocaleString('en-IN')}.`,
      });

      setNewDueDate('');
      setReason('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to Reschedule',
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Reschedule Follow-up</h3>
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

        {/* Current status info */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Currently Due:</span>
            <span className="font-semibold text-foreground">
              {new Date(followUp.due_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          {followUp.rescheduled_count && followUp.rescheduled_count > 0 ? (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Previously rescheduled {followUp.rescheduled_count} time(s).
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              New Date & Time <span className="text-destructive">*</span>
            </label>
            <Input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Reason for Rescheduling <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer in office meeting, requested evening call / Family review pending..."
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
              disabled={rescheduleMutation.isPending}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {rescheduleMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
