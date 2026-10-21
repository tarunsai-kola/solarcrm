import {
  AlertCircle,
  Building,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Compass,
  Calculator,
  Download,
  Eye,
  FileCheck,
  FileEdit,
  FileText,
  Flame,
  Globe,
  History,
  Link,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  Snowflake,
  Sun,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import {
  LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
  LEAD_TEMPERATURES,
  type LeadStatus,
  type LeadTemperature,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  useLead,
  useLogLeadActivity,
  useScheduleFollowUp,
  useTeamMembers,
  useUpdateLead,
} from '../hooks/use-leads';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadTemperatureBadge } from './LeadTemperatureBadge';
import { ActivityTimeline } from './ActivityTimeline';
import { AddCallLogModal } from './AddCallLogModal';
import { AssignFieldAgentModal } from './AssignFieldAgentModal';
import { ScheduleMeetingModal } from '@/features/integrations/components/ScheduleMeetingModal';
import { SendEmailModal } from '@/features/integrations/components/SendEmailModal';
import { WhatsAppModal } from '@/features/integrations/components/WhatsAppModal';
import { QuotationBuilderModal } from '@/features/quotations/components/QuotationBuilderModal';
import { QuotationPdfViewerModal } from '@/features/quotations/components/QuotationPdfViewerModal';
import { downloadQuotationPdf } from '@/features/quotations/hooks/use-quotations';

interface LeadDetailDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, isOpen, onClose }: LeadDetailDrawerProps) {
  const { role, session } = useAuth();
  const { data: lead, isLoading, refetch } = useLead(leadId ?? '');
  const { data: team } = useTeamMembers();

  const updateLeadMutation = useUpdateLead();
  const logActivityMutation = useLogLeadActivity();
  const scheduleFollowUpMutation = useScheduleFollowUp();

  // Active detail tab: 'timeline' | 'details' | 'followups' | 'quotations'
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'followups' | 'quotations'>(
    'timeline',
  );

  // Quick action modals
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [showLogNoteModal, setShowLogNoteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showQuotationBuilderModal, setShowQuotationBuilderModal] = useState(false);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'revise'>('create');
  const [activeQuotationForBuilder, setActiveQuotationForBuilder] = useState<any | null>(null);
  const [viewQuotationPdfId, setViewQuotationPdfId] = useState<string | null>(null);

  // Form states
  const [noteType, setNoteType] = useState<'note' | 'whatsapp' | 'email'>('note');
  const [noteText, setNoteText] = useState('');

  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpAssignee, setFollowUpAssignee] = useState('');

  // Reopen Confirmation state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  if (!isOpen || !leadId) return null;

  // Handle Status Change
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    const isReopening =
      ['won', 'lost', 'not_interested', 'disqualified'].includes(lead.status) &&
      ['new', 'contacted', 'qualified', 'follow_up'].includes(newStatus);

    if (isReopening && pendingStatus !== newStatus) {
      setPendingStatus(newStatus);
      return;
    }

    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        updates: { status: newStatus as LeadStatus },
      });
      setPendingStatus(null);
      toast({
        title: 'Status Updated',
        description: `Lead status updated to ${LEAD_STATUS_CONFIG[newStatus as LeadStatus]?.label ?? newStatus}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to update status',
        description: err.message || 'Error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle Temperature Change
  const handleTemperatureChange = async (temp: LeadTemperature) => {
    if (!lead) return;
    try {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        updates: { temperature: temp },
      });
      toast({
        title: 'Temperature Updated',
        description: `Lead temperature changed to ${temp.toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to update temperature',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Handle Assignment Change
  const handleAssigneeChange = async (type: 'sales' | 'agent', userId: string) => {
    if (!lead) return;
    try {
      const updates =
        type === 'sales'
          ? { inbound_sales_id: userId || null }
          : { assigned_field_agent_id: userId || null };
      await updateLeadMutation.mutateAsync({ id: lead.id, updates });
      toast({
        title: 'Assignment Updated',
        description: 'Lead assignment updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to update assignment',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Submit Note / WhatsApp
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !noteText.trim()) return;
    try {
      await logActivityMutation.mutateAsync({
        leadId: lead.id,
        activity: {
          activity_type: noteType,
          outcome: noteType === 'whatsapp' ? 'WhatsApp Sent' : 'Field Note Added',
          notes: noteText.trim(),
        },
      });
      toast({
        title: `${noteType === 'whatsapp' ? 'WhatsApp Message' : 'Note'} Logged`,
        description: 'Saved to lead activity timeline.',
      });
      setNoteText('');
      setShowLogNoteModal(false);
    } catch (err: any) {
      toast({ title: 'Failed to add note', description: err.message, variant: 'destructive' });
    }
  };

  // Submit Follow-up Scheduler
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !followUpDate) return;
    try {
      await scheduleFollowUpMutation.mutateAsync({
        leadId: lead.id,
        followUp: {
          due_at: new Date(followUpDate).toISOString(),
          notes: followUpNote.trim() || undefined,
          assigned_to: followUpAssignee || lead.inbound_sales_id || (lead as any).assigned_to,
        },
      });
      toast({
        title: 'Follow-up Scheduled',
        description: `Follow-up set for ${new Date(followUpDate).toLocaleString('en-IN')}`,
      });
      setFollowUpNote('');
      setFollowUpDate('');
      setShowFollowUpModal(false);
    } catch (err: any) {
      toast({
        title: 'Failed to schedule follow-up',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // WhatsApp Pre-filled URL
  const cleanPhone = lead?.phone?.replace(/\D/g, '') ?? '';
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const waGreeting = encodeURIComponent(
    `Hello ${lead?.customer_name ?? 'Customer'}, thank you for reaching out to Sunbeam Solar Solutions. I am following up on your ${lead?.enquiry_type ?? 'residential'} solar enquiry. Would you be available for a brief consultation?`,
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waGreeting}`;

  // Google Calendar Link
  const calTitle = encodeURIComponent(
    `Solar Consultation: ${lead?.customer_name ?? 'Lead'} (${lead?.phone ?? ''})`,
  );
  const calDetails = encodeURIComponent(
    `Solar CRM Lead Follow-up\nCustomer: ${lead?.customer_name}\nPhone: ${lead?.phone}\nAddress: ${lead?.address ?? ''}, ${lead?.area ?? ''} ${lead?.pincode ?? ''}\nNotes: ${lead?.initial_note ?? 'None'}`,
  );
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&details=${calDetails}&location=${encodeURIComponent(lead?.address ?? '')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-3xl border-l border-border bg-card shadow-2xl flex flex-col">
          {/* Top Bar */}
          <div className="border-b border-border p-6 flex items-center justify-between gap-4 bg-muted/20">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {isLoading ? 'Loading lead details…' : lead?.customer_name}
                </h2>
                {lead && <LeadStatusBadge status={lead.status} />}
                {lead && <LeadTemperatureBadge temperature={lead.temperature} />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span>Enquiry: {lead?.enquiry_type ?? 'residential'}</span>
                <span>•</span>
                <span>Source: {lead?.lead_source ?? 'Other'}</span>
                <span>•</span>
                <span>
                  Created:{' '}
                  {lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              id="lead-drawer-close-btn"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action Bar (WhatsApp, Call, Email, GCal, Maps) */}
          {lead && (
            <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/10 overflow-x-auto text-xs">
              {/* WhatsApp Action */}
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                id="lead-action-whatsapp"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </button>

              {/* Email Action */}
              <button
                type="button"
                onClick={() => setShowSendEmailModal(true)}
                id="lead-action-email"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors shrink-0"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>

              {/* Schedule Meet / Google Calendar */}
              <button
                type="button"
                onClick={() => setShowScheduleMeetingModal(true)}
                id="lead-action-schedule-meet"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors shrink-0"
              >
                <Calendar className="h-3.5 w-3.5" />
                Meet / Calendar
              </button>

              {/* Click to Call */}
              <a
                href={`tel:${lead.phone}`}
                id="lead-action-call"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20 transition-colors shrink-0"
              >
                <Phone className="h-3.5 w-3.5" />
                Call {lead.phone}
              </a>

              {/* Assign Field Agent Button */}
              <Button
                variant="default"
                size="sm"
                id="lead-action-assign-field-agent"
                className="h-8 gap-1.5 text-xs shrink-0 font-semibold"
                onClick={() => setShowAssignAgentModal(true)}
              >
                <Compass className="h-3.5 w-3.5" />
                {lead.assigned_field_agent_id ? 'Reassign Agent' : 'Assign Field Agent'}
              </Button>

              {/* Log Call Button */}
              <Button
                variant="outline"
                size="sm"
                id="lead-action-log-call"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => setShowLogCallModal(true)}
              >
                <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
                Log Call
              </Button>

              {/* Add Note Button */}
              <Button
                variant="outline"
                size="sm"
                id="lead-action-add-note"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => setShowLogNoteModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Note
              </Button>

              {/* Create Quotation Button */}
              <Button
                variant="outline"
                size="sm"
                id="lead-action-create-quotation"
                className="h-8 gap-1.5 text-xs shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-semibold"
                onClick={() => {
                  setActiveQuotationForBuilder(null);
                  setBuilderMode('create');
                  setShowQuotationBuilderModal(true);
                }}
              >
                <Calculator className="h-3.5 w-3.5 text-amber-500" />
                Create Quotation
              </Button>

              {/* Schedule Follow-up */}
              <Button
                variant="outline"
                size="sm"
                id="lead-action-schedule-followup"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => setShowFollowUpModal(true)}
              >
                <CalendarPlus className="h-3.5 w-3.5 text-amber-500" />
                Schedule Follow-up
              </Button>

              {/* Google Calendar Link */}
              <a
                href={gcalUrl}
                target="_blank"
                rel="noreferrer"
                id="lead-action-gcal"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                Google Calendar
              </a>

              {/* Google Maps link */}
              {lead.mapUrl && (
                <a
                  href={lead.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  id="lead-action-map"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  Map View
                </a>
              )}
            </div>
          )}

          {/* Reopen Lead Alert Banner Confirmation */}
          {pendingStatus && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Confirm deal reactivation: Reopen this lead from <strong>{lead?.status}</strong>{' '}
                  to <strong>{pendingStatus}</strong>?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setPendingStatus(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => handleStatusChange(pendingStatus)}
                >
                  Confirm Reopen
                </Button>
              </div>
            </div>
          )}

          {/* Quick Status & Temperature Control Bar */}
          {lead && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-3 border-b border-border bg-card text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Workflow Status
                </label>
                <select
                  id="lead-status-dropdown"
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full flex h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                >
                  {LEAD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {LEAD_STATUS_CONFIG[st]?.label ?? st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Lead Temperature
                </label>
                <div className="flex items-center gap-1.5">
                  {(['hot', 'warm', 'cold', 'unclassified'] as LeadTemperature[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTemperatureChange(t)}
                      className={`flex-1 rounded-md border py-1 px-1.5 text-center font-medium capitalize transition-all ${
                        lead.temperature === t
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-border px-6 text-sm">
            {[
              { id: 'timeline', label: 'Activity Timeline', count: lead?.lead_activities?.length },
              { id: 'details', label: 'Overview & Assignment' },
              { id: 'followups', label: 'Follow-ups', count: lead?.follow_ups?.length },
              {
                id: 'quotations',
                label: 'Site Visits & Quotes',
                count: (lead?.quotations?.length ?? 0) + (lead?.site_visits?.length ?? 0),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading lead profile…
              </div>
            )}

            {/* TAB 1: ACTIVITY TIMELINE */}
            {activeTab === 'timeline' && lead && (
              <ActivityTimeline
                leadId={lead.id}
                activities={lead.lead_activities || []}
                onLogCallClick={() => setShowLogCallModal(true)}
                onScheduleFollowUpClick={() => setShowFollowUpModal(true)}
              />
            )}

            {/* TAB 2: OVERVIEW & ASSIGNMENT */}
            {activeTab === 'details' && lead && (
              <div className="space-y-6 text-sm">
                {/* Contact & Location Card */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Contact & Location Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Customer Name</span>
                      <span className="font-medium text-foreground text-sm">
                        {lead.customer_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Phone Number</span>
                      <span className="font-medium text-foreground text-sm">{lead.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email Address</span>
                      <span className="font-medium text-foreground">
                        {lead.email || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Area / Locality</span>
                      <span className="font-medium text-foreground">
                        {lead.area || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Pincode</span>
                      <span className="font-medium text-foreground">
                        {lead.pincode || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Full Address</span>
                      <span className="font-medium text-foreground">
                        {lead.address || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  {lead.mapUrl && (
                    <div className="pt-2">
                      <a
                        href={lead.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                      >
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        Open Location in Google Maps
                      </a>
                    </div>
                  )}
                </div>

                {/* Team Assignment Card */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Team Lead Assignment
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-muted-foreground block mb-1">
                        Inbound Salesperson
                      </label>
                      <select
                        id="lead-assign-salesperson"
                        value={lead.inbound_sales_id ?? ''}
                        disabled={role === 'field_agent'}
                        onChange={(e) => handleAssigneeChange('sales', e.target.value)}
                        className="w-full flex h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Unassigned --</option>
                        {team?.inboundSales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-muted-foreground block">
                          Assigned Field Agent
                        </label>
                        {role !== 'field_agent' && (
                          <button
                            type="button"
                            onClick={() => setShowAssignAgentModal(true)}
                            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <Compass className="h-3 w-3" />
                            Match Agent
                          </button>
                        )}
                      </div>
                      <select
                        id="lead-assign-field-agent"
                        value={lead.assigned_field_agent_id ?? ''}
                        disabled={role === 'field_agent'}
                        onChange={(e) => handleAssigneeChange('agent', e.target.value)}
                        className="w-full flex h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Unassigned --</option>
                        {team?.fieldAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.full_name} ({a.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Initial Customer Note Card */}
                {lead.initial_note && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Initial Customer Context / Note
                    </h4>
                    <p className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50">
                      {lead.initial_note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FOLLOW-UPS */}
            {activeTab === 'followups' && lead && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Scheduled Follow-ups
                  </h3>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowFollowUpModal(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Schedule Follow-up
                  </Button>
                </div>

                {lead.next_follow_up_at && (
                  <div
                    className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
                      lead.is_overdue
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        : 'border-border bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <div>
                        <span className="font-semibold block">Next Follow-up Due</span>
                        <span>
                          {new Date(lead.next_follow_up_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                    {lead.is_overdue && (
                      <span className="rounded-full bg-rose-500 text-white font-bold px-2 py-0.5 text-[10px]">
                        OVERDUE
                      </span>
                    )}
                  </div>
                )}

                {(!lead.follow_ups || lead.follow_ups.length === 0) && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
                    No follow-ups recorded. Click "Schedule Follow-up" to set a callback reminder.
                  </div>
                )}

                <div className="space-y-2">
                  {lead.follow_ups?.map((fu) => (
                    <div
                      key={fu.id}
                      className="rounded-xl border border-border bg-card p-3 text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>
                            {new Date(fu.due_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                              fu.completion_status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {fu.completion_status}
                          </span>
                        </div>
                        {fu.notes && (
                          <p className="text-muted-foreground text-[11px] mt-1">{fu.notes}</p>
                        )}
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Assigned to: {fu.assignee?.full_name ?? 'Sales Representative'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SITE VISITS & QUOTATIONS */}
            {activeTab === 'quotations' && lead && (
              <div className="space-y-6">
                {/* Site Visits Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-primary" />
                    Rooftop Feasibility & Site Visits
                  </h4>
                  {(!lead.site_visits || lead.site_visits.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-xs">
                      No site visits recorded yet for this lead.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lead.site_visits.map((sv: any) => (
                        <div
                          key={sv.id}
                          className="rounded-xl border border-border bg-card p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              Visit: {new Date(sv.scheduled_at).toLocaleDateString()}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                              {sv.visit_status}
                            </span>
                          </div>
                          {sv.roof_suitability && (
                            <p className="text-muted-foreground">
                              Roof suitability: <strong>{sv.roof_suitability}</strong>
                            </p>
                          )}
                          {sv.site_observations && (
                            <p className="text-muted-foreground">
                              Observations: {sv.site_observations}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quotations Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      Quotations & Commercial Proposals
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveQuotationForBuilder(null);
                        setBuilderMode('create');
                        setShowQuotationBuilderModal(true);
                      }}
                      className="h-7 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Quotation
                    </Button>
                  </div>

                  {(!lead.quotations || lead.quotations.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-xs space-y-2">
                      <Calculator className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="font-semibold text-foreground">No quotations generated yet</p>
                      <p>Create a customized proposal with Tier-1 panels, inverters, and KSEB/DISCOM charges.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveQuotationForBuilder(null);
                          setBuilderMode('create');
                          setShowQuotationBuilderModal(true);
                        }}
                        className="mt-2 text-xs"
                      >
                        Launch Quotation Builder
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {lead.quotations.map((q: any) => (
                        <div
                          key={q.id}
                          className="rounded-xl border border-border bg-card p-4 text-xs space-y-2.5 shadow-sm hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-foreground text-sm">
                                  {q.quotation_number}
                                </span>
                                <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                                  v{q.version}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    q.status === 'issued'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : q.status === 'sent'
                                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                        : q.status === 'accepted'
                                          ? 'bg-emerald-600 text-white'
                                          : q.status === 'revised'
                                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                            : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {q.title || `${q.system_capacity_kw || 5}kW System Proposal`} • {new Date(q.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-foreground text-sm font-mono block">
                                ₹{Number(q.total_amount).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Adv: ₹{Number(q.advance_amount || 0).toLocaleString('en-IN')} ({q.advance_percentage || 20}%)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-500" />
                              {q.system_capacity_kw} kWp {q.phase || '3-Phase'} {q.system_type || 'On-Grid'}
                            </span>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewQuotationPdfId(q.id)}
                                className="h-6 px-2 text-[11px] gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Preview PDF
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await downloadQuotationPdf(q.id, q.quotation_number, session?.access_token);
                                  } catch (err: any) {
                                    alert(err.message || 'Download failed');
                                  }
                                }}
                                className="h-6 px-2 text-[11px] gap-1 text-primary"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>

                              {q.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setActiveQuotationForBuilder(q);
                                    setBuilderMode('edit');
                                    setShowQuotationBuilderModal(true);
                                  }}
                                  className="h-6 px-2 text-[11px] text-amber-600"
                                >
                                  Edit Draft
                                </Button>
                              )}

                              {q.status !== 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setActiveQuotationForBuilder(q);
                                    setBuilderMode('revise');
                                    setShowQuotationBuilderModal(true);
                                  }}
                                  className="h-6 px-2 text-[11px] text-purple-600"
                                >
                                  Revise (v{q.version + 1})
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Modals */}
          {/* 0. Assign Field Agent Modal */}
          {showAssignAgentModal && lead && (
            <AssignFieldAgentModal
              isOpen={showAssignAgentModal}
              onClose={() => setShowAssignAgentModal(false)}
              lead={lead}
            />
          )}

          {/* 1. Log Call Modal */}
          {showLogCallModal && lead && (
            <AddCallLogModal
              isOpen={showLogCallModal}
              onClose={() => setShowLogCallModal(false)}
              lead={lead}
            />
          )}

          {/* 2. Add Note / WhatsApp Log Modal */}
          {showLogNoteModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Add Customer Note / Interaction
                  </h3>
                  <button
                    onClick={() => setShowLogNoteModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleNoteSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-foreground">Interaction Type</label>
                    <div className="mt-1 flex gap-2">
                      {(['note', 'whatsapp', 'email'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNoteType(type)}
                          className={`flex-1 rounded-md border py-1.5 text-center font-medium capitalize transition-all ${
                            noteType === type
                              ? 'border-primary bg-primary/10 text-primary font-bold'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">
                      Details / Notes <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add key conversation takeaways, rooftop photos link, customer preferences..."
                      className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLogNoteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={logActivityMutation.isPending}
                      className="gap-1.5"
                    >
                      {logActivityMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Save Record
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 3. Schedule Follow-up Modal */}
          {showFollowUpModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-amber-500" />
                    Schedule Follow-up Reminder
                  </h3>
                  <button
                    onClick={() => setShowFollowUpModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleFollowUpSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-foreground">
                      Date & Time <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="mt-1 h-8 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Assignee</label>
                    <select
                      value={followUpAssignee}
                      onChange={(e) => setFollowUpAssignee(e.target.value)}
                      className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs"
                    >
                      <option value="">-- Same as Lead Owner --</option>
                      {team?.inboundSales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} (Sales)
                        </option>
                      ))}
                      {team?.fieldAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.full_name} (Field Agent)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground">Notes / Agenda</label>
                    <textarea
                      rows={3}
                      value={followUpNote}
                      onChange={(e) => setFollowUpNote(e.target.value)}
                      placeholder="Callback customer regarding 5kW proposal revision and subsidy disbursement terms..."
                      className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFollowUpModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={scheduleFollowUpMutation.isPending}
                      className="gap-1.5"
                    >
                      {scheduleFollowUpMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Schedule Follow-up
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Field Agent Assignment Modal */}
          {lead && (
            <AssignFieldAgentModal
              isOpen={showAssignAgentModal}
              onClose={() => setShowAssignAgentModal(false)}
              lead={lead}
            />
          )}

          {/* Schedule Calendar & Meet Modal */}
          {lead && (
            <ScheduleMeetingModal
              isOpen={showScheduleMeetingModal}
              onClose={() => setShowScheduleMeetingModal(false)}
              leadId={lead.id}
              customerName={lead.customer_name}
              customerEmail={lead.email || undefined}
              customerAddress={lead.address || lead.area || undefined}
            />
          )}

          {/* Send Email Modal */}
          {lead && (
            <SendEmailModal
              isOpen={showSendEmailModal}
              onClose={() => setShowSendEmailModal(false)}
              leadId={lead.id}
              customerName={lead.customer_name}
              customerEmail={lead.email || undefined}
              leadArea={lead.area || undefined}
            />
          )}

          {/* WhatsApp Modal */}
          {lead && (
            <WhatsAppModal
              isOpen={showWhatsAppModal}
              onClose={() => setShowWhatsAppModal(false)}
              leadId={lead.id}
              customerName={lead.customer_name}
              customerPhone={lead.phone}
              leadArea={lead.area || undefined}
            />
          )}

          {/* Quotation Builder Modal */}
          {lead && (
            <QuotationBuilderModal
              lead={lead}
              initialQuotation={activeQuotationForBuilder}
              mode={builderMode}
              isOpen={showQuotationBuilderModal}
              onClose={() => {
                setShowQuotationBuilderModal(false);
                setActiveQuotationForBuilder(null);
              }}
              onSuccess={() => {
                refetch();
              }}
            />
          )}

          {/* Quotation PDF Previewer Modal */}
          {viewQuotationPdfId && (
            <QuotationPdfViewerModal
              quotationId={viewQuotationPdfId}
              isOpen={Boolean(viewQuotationPdfId)}
              onClose={() => setViewQuotationPdfId(null)}
              onRevise={(quote) => {
                setViewQuotationPdfId(null);
                setActiveQuotationForBuilder(quote);
                setBuilderMode('revise');
                setShowQuotationBuilderModal(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
