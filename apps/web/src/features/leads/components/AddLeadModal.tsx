import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ENQUIRY_TYPES, LEAD_SOURCES, type CreateLead } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  checkDuplicateLead,
  useCreateLead,
  useTeamMembers,
  type DuplicateCheckResult,
} from '../hooks/use-leads';
import { LeadStatusBadge } from './LeadStatusBadge';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectLead?: (leadId: string) => void;
}

export function AddLeadModal({ isOpen, onClose, onInspectLead }: AddLeadModalProps) {
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateCheckResult['matches'] | null>(
    null,
  );
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const { data: team } = useTeamMembers();
  const createLeadMutation = useCreateLead();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CreateLead & { initial_note?: string }>({
    defaultValues: {
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      area: '',
      pincode: '',
      enquiry_type: 'residential',
      lead_source: 'Meta Ads',
      initial_note: '',
    },
  });

  if (!isOpen) return null;

  // On Phone Blur: perform quick duplicate check
  const handlePhoneBlur = async () => {
    const phone = getValues('phone');
    if (phone && phone.replace(/\D/g, '').length >= 10) {
      try {
        setIsCheckingDuplicate(true);
        const result = await checkDuplicateLead({ phone });
        if (result.hasDuplicate) {
          setDuplicateMatches(result.matches);
        }
      } catch (err) {
        // Non-blocking background check
      } finally {
        setIsCheckingDuplicate(false);
      }
    }
  };

  const sanitizePayload = (input: any) => ({
    ...input,
    assigned_field_agent_id: input.assigned_field_agent_id || null,
    inbound_sales_id: input.inbound_sales_id || null,
    email: input.email?.trim() || null,
    pincode: input.pincode?.trim() || null,
    area: input.area?.trim() || null,
    address: input.address?.trim() || null,
    initial_note: input.initial_note?.trim() || null,
  });

  const handleFormSubmit = async (data: CreateLead & { initial_note?: string }) => {
    try {
      const payload = sanitizePayload(data);
      await createLeadMutation.mutateAsync(payload);
      toast({
        title: 'Lead Created Successfully',
        description: `${data.customer_name} has been registered to your pipeline.`,
        variant: 'default',
      });
      reset();
      setDuplicateMatches(null);
      onClose();
    } catch (err: any) {
      // If 409 Conflict duplicate error returned by API
      if (err.response?.status === 409 && err.response?.data?.error?.details?.matches) {
        setDuplicateMatches(err.response.data.error.details.matches);
        toast({
          title: 'Duplicate Lead Detected',
          description:
            'A customer with this phone number or email already exists. Review matches below.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to create lead',
          description: err.response?.data?.error?.message || err.message || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  // User chooses "Create Anyway" override
  const handleForceCreate = async () => {
    const currentValues = getValues();
    try {
      const payload = {
        ...sanitizePayload(currentValues),
        allow_duplicate: true,
      };
      await createLeadMutation.mutateAsync(payload);
      toast({
        title: 'Lead Created with Override',
        description: `${currentValues.customer_name} was saved (duplicate allowed).`,
      });
      reset();
      setDuplicateMatches(null);
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to create lead',
        description: err.response?.data?.error?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Add New Solar Lead</h2>
              <p className="text-xs text-muted-foreground">
                Enter prospective customer information to initiate outreach.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDuplicateMatches(null);
              onClose();
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Duplicate Warning Inspection Banner */}
        {duplicateMatches && duplicateMatches.length > 0 && (
          <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">
                  Possible Duplicate Lead Detected ({duplicateMatches.length} match
                  {duplicateMatches.length > 1 ? 'es' : ''})
                </h4>
                <p className="text-xs text-muted-foreground">
                  The system does not silently merge records. You can inspect existing records
                  before continuing, or force create if this is a distinct enquiry.
                </p>

                {/* Matches Table */}
                <div className="divide-y divide-border rounded-lg border border-border bg-background overflow-hidden text-xs">
                  {duplicateMatches.map((match) => (
                    <div
                      key={match.id}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {match.customer_name}
                          <LeadStatusBadge status={match.status} />
                        </div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">
                          Phone: {match.phone} {match.email ? `• Email: ${match.email}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onInspectLead && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              onInspectLead(match.id);
                              onClose();
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Inspect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDuplicateMatches(null)}
                  >
                    Edit Phone / Details
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={createLeadMutation.isPending}
                    onClick={handleForceCreate}
                  >
                    {createLeadMutation.isPending && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    Create Anyway (Allow Duplicate)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Customer Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="lead-customer-name"
                placeholder="e.g. Rajesh Sharma"
                className="mt-1"
                {...register('customer_name', {
                  required: 'Customer name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                {isCheckingDuplicate && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> checking…
                  </span>
                )}
              </div>
              <Input
                id="lead-phone"
                placeholder="e.g. 9876543210"
                className="mt-1"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^(?:\+91|91)?[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian mobile number',
                  },
                })}
                onBlur={handlePhoneBlur}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                id="lead-email"
                type="email"
                placeholder="e.g. rajesh@example.com"
                className="mt-1"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Pincode */}
            <div>
              <label className="text-xs font-semibold text-foreground">Pincode (6 digits)</label>
              <Input
                id="lead-pincode"
                placeholder="e.g. 411038"
                className="mt-1"
                maxLength={6}
                {...register('pincode', {
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Enter a valid 6-digit Indian postal code',
                  },
                })}
              />
              {errors.pincode && (
                <p className="mt-1 text-xs text-destructive">{errors.pincode.message}</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label className="text-xs font-semibold text-foreground">Area / Locality</label>
              <Input
                id="lead-area"
                placeholder="e.g. Kothrud, Baner"
                className="mt-1"
                {...register('area')}
              />
            </div>

            {/* Enquiry Type */}
            <div>
              <label className="text-xs font-semibold text-foreground">Enquiry Type</label>
              <select
                id="lead-enquiry-type"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('enquiry_type')}
              >
                {ENQUIRY_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-popover text-popover-foreground">
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Source */}
            <div>
              <label className="text-xs font-semibold text-foreground">Lead Source</label>
              <select
                id="lead-source"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('lead_source')}
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src} className="bg-popover text-popover-foreground">
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign Inbound Sales */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Assign Inbound Salesperson
              </label>
              <select
                id="lead-sales-assign"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('inbound_sales_id')}
              >
                <option value="">-- Unassigned --</option>
                {team?.inboundSales.map((s) => (
                  <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                    {s.full_name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Assign Field Agent */}
            <div>
              <label className="text-xs font-semibold text-foreground">Assign Field Agent</label>
              <select
                id="lead-agent-assign"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('assigned_field_agent_id')}
              >
                <option value="">-- Unassigned --</option>
                {team?.fieldAgents.map((a) => (
                  <option key={a.id} value={a.id} className="bg-popover text-popover-foreground">
                    {a.full_name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="text-xs font-semibold text-foreground">Full Address</label>
            <Input
              id="lead-address"
              placeholder="e.g. Flat 402, Sunshine Apartments, MG Road"
              className="mt-1"
              {...register('address')}
            />
          </div>

          {/* Initial Note */}
          <div>
            <label className="text-xs font-semibold text-foreground">
              Initial Note (Customer context, rooftop notes, electricity bill)
            </label>
            <textarea
              id="lead-initial-note"
              rows={3}
              placeholder="e.g. Customer has 3-phase connection, monthly bill ~₹4,500. Interested in 5kW grid-tied rooftop system."
              className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('initial_note')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              id="lead-submit-btn"
              disabled={createLeadMutation.isPending}
              className="gap-1.5"
            >
              {createLeadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Register Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
