import {
  Calendar,
  Clock,
  FileUp,
  Flame,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneIncoming,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  CALL_OUTCOMES,
  CALL_OUTCOME_CONFIG,
  type CallOutcome,
  type CreateCallLog,
  type LeadTemperature,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLogCall, useTeamMembers, type LeadWithRelations } from '../hooks/use-leads';

interface AddCallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithRelations;
}

type CallActivityType = NonNullable<CreateCallLog['activity_type']>;

export function AddCallLogModal({ isOpen, onClose, lead }: AddCallLogModalProps) {
  const { user } = useAuth();
  const { data: team } = useTeamMembers();
  const logCallMutation = useLogCall();

  // Form State
  const [activityType, setActivityType] = useState<CallActivityType>('outgoing_call');
  const [outcome, setOutcome] = useState<CallOutcome>('Connected');
  const [temperature, setTemperature] = useState<LeadTemperature>(
    (lead.temperature as LeadTemperature) || 'warm',
  );
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('5');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Follow-up sub-section
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [followUpOwner, setFollowUpOwner] = useState(lead.inbound_sales_id || user?.id || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please enter detailed conversation notes.',
        variant: 'destructive',
      });
      return;
    }

    if (followUpRequired && !nextFollowUpAt) {
      toast({
        title: 'Follow-up Date Required',
        description: 'Please pick a scheduled date & time for the next follow-up.',
        variant: 'destructive',
      });
      return;
    }

    const durationSeconds = durationMinutes ? parseInt(durationMinutes, 10) * 60 : undefined;

    try {
      await logCallMutation.mutateAsync({
        leadId: lead.id,
        data: {
          activity_type: activityType,
          outcome,
          temperature,
          notes: notes.trim(),
          follow_up_required: followUpRequired,
          next_follow_up_at: followUpRequired && nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
          follow_up_owner: followUpRequired && followUpOwner ? followUpOwner : undefined,
          duration_seconds: durationSeconds && !isNaN(durationSeconds) ? durationSeconds : undefined,
          attachment_url: attachmentUrl.trim() || undefined,
          attachment_name: attachmentName.trim() || undefined,
        },
      });

      toast({
        title: 'Communication Logged',
        description: `Activity successfully logged for ${lead.customer_name}.`,
      });

      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to Log Activity',
        description: err.response?.data?.message || err.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Log Communication / Call</h3>
              <p className="text-xs text-muted-foreground">
                Lead: <span className="font-semibold text-foreground">{lead.customer_name}</span> ({lead.phone})
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Activity Type Selector */}
          <div>
            <label className="font-semibold text-foreground block mb-1.5">
              Activity Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'outgoing_call', label: 'Outgoing Call', icon: PhoneCall },
                { type: 'incoming_call', label: 'Incoming Call', icon: PhoneIncoming },
                { type: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                { type: 'email', label: 'Email', icon: Mail },
                { type: 'site_visit', label: 'Site Visit', icon: MapPin },
                { type: 'meeting', label: 'Meeting', icon: Users },
                { type: 'other', label: 'Other', icon: Clock },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type as CallActivityType)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left font-medium transition-all ${
                    activityType === type
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Call Outcome & Temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Call Outcome <span className="text-destructive">*</span>
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
              >
                {CALL_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Lead Temperature <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                {(['hot', 'warm', 'cold'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemperature(t)}
                    className={`flex-1 rounded-md border py-1.5 text-center font-bold capitalize transition-all ${
                      temperature === t
                        ? t === 'hot'
                          ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                          : t === 'warm'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Duration & Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Duration (minutes) <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Attachment URL <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                type="url"
                placeholder="https://... rooftop photo or doc"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {attachmentUrl && (
            <div>
              <label className="font-semibold text-foreground block mb-1">Attachment Label</label>
              <Input
                type="text"
                placeholder="e.g. Electricity Bill or Rooftop Video"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* 4. Detailed Notes */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Detailed Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record customer questions, power requirement (kW), roof type, subsidy interest, or next actions discussed..."
              className="flex w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          {/* 5. Follow-up Toggle and Sub-form */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">Schedule Next Follow-up?</span>
                <p className="text-[11px] text-muted-foreground">
                  Creates an actionable task on the follow-ups board with reminders.
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFollowUpRequired(false)}
                  className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
                    !followUpRequired
                      ? 'bg-card border border-border shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowUpRequired(true);
                    if (!nextFollowUpAt) {
                      // Default to tomorrow 10:00 AM
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(10, 0, 0, 0);
                      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
                      const localISOTime = new Date(tomorrow.getTime() - tzOffset)
                        .toISOString()
                        .slice(0, 16);
                      setNextFollowUpAt(localISOTime);
                    }
                  }}
                  className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
                    followUpRequired
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {followUpRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Follow-up Date & Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    className="h-8 text-xs"
                    required={followUpRequired}
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Follow-up Owner</label>
                  <select
                    value={followUpOwner}
                    onChange={(e) => setFollowUpOwner(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Same as Current User --</option>
                    {team?.inboundSales?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} (Inbound Sales)
                      </option>
                    ))}
                    {team?.fieldAgents?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name} (Field Agent)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={logCallMutation.isPending}
              className="gap-1.5"
            >
              {logCallMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Call Log
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
