import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  ListFilter,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Sliders,
  Tag,
  Trash2,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCrmConfig,
  useResetCrmConfig,
  useUpdateCrmConfig,
} from '@/features/reports/hooks/use-analytics';
import type {
  AssignmentRules,
  CrmConfig,
  EnquiryTypeConfigItem,
  LeadSourceConfigItem,
  LeadStatusConfigItem,
  ReminderPreferences,
} from '@solar-crm/shared';

export function CrmControlsTab() {
  const { data: config, isLoading, refetch } = useCrmConfig();
  const updateMutation = useUpdateCrmConfig();
  const resetMutation = useResetCrmConfig();

  const [activeSubSection, setActiveSubSection] = useState<
    'pipeline' | 'sources' | 'assignment' | 'reminders'
  >('pipeline');

  const [statuses, setStatuses] = useState<LeadStatusConfigItem[]>([]);
  const [enquiryTypes, setEnquiryTypes] = useState<EnquiryTypeConfigItem[]>([]);
  const [sources, setSources] = useState<LeadSourceConfigItem[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRules>({
    mode: 'pincode_match',
    auto_assign: true,
    fallback_to_round_robin: true,
    max_workload_cap: 15,
    reassign_uncontacted_after_hours: 24,
  });
  const [reminders, setReminders] = useState<ReminderPreferences>({
    lead_times_minutes: [15, 60, 1440],
    daily_digest_time: '09:00',
    enable_email: true,
    enable_in_app: true,
    enable_whatsapp: true,
    overdue_escalation_hours: 24,
  });

  const [newEnquiryLabel, setNewEnquiryLabel] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setStatuses(config.lead_statuses || []);
      setEnquiryTypes(config.enquiry_types || []);
      setSources(config.lead_sources || []);
      if (config.assignment_rules) setAssignmentRules(config.assignment_rules);
      if (config.reminder_preferences) setReminders(config.reminder_preferences);
    }
  }, [config]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      lead_statuses: statuses,
      enquiry_types: enquiryTypes,
      lead_sources: sources,
      assignment_rules: assignmentRules,
      reminder_preferences: reminders,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = async () => {
    if (confirm('Reset all CRM statuses, rules, and preferences to recommended defaults?')) {
      await resetMutation.mutateAsync();
      refetch();
    }
  };

  // Status handlers
  const toggleStatusActive = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)),
    );
  };

  const updateStatusLabel = (id: string, label: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  // Enquiry type handlers
  const addEnquiryType = () => {
    if (!newEnquiryLabel.trim()) return;
    const id = newEnquiryLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setEnquiryTypes((prev) => [
      ...prev,
      {
        id,
        label: newEnquiryLabel.trim(),
        is_active: true,
        sort_order: prev.length + 1,
      },
    ]);
    setNewEnquiryLabel('');
  };

  const toggleEnquiryActive = (id: string) => {
    setEnquiryTypes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_active: !e.is_active } : e)),
    );
  };

  // Source handlers
  const addSource = () => {
    if (!newSourceName.trim()) return;
    setSources((prev) => [
      ...prev,
      {
        id: newSourceName.trim(),
        name: newSourceName.trim(),
        is_active: true,
        is_campaign: false,
      },
    ]);
    setNewSourceName('');
  };

  const toggleSourceActive = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)),
    );
  };

  const toggleSourceCampaign = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_campaign: !s.is_campaign } : s)),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        <RefreshCw className="h-5 w-5 animate-spin mr-2 text-primary" />
        Loading CRM configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Sub Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={activeSubSection === 'pipeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubSection('pipeline')}
            className="gap-2 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Lead Statuses & Enquiry Types
          </Button>
          <Button
            variant={activeSubSection === 'sources' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubSection('sources')}
            className="gap-2 text-xs"
          >
            <Tag className="h-3.5 w-3.5" />
            Sources & Campaigns
          </Button>
          <Button
            variant={activeSubSection === 'assignment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubSection('assignment')}
            className="gap-2 text-xs"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Assignment Rules
          </Button>
          <Button
            variant={activeSubSection === 'reminders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubSection('reminders')}
            className="gap-2 text-xs"
          >
            <Bell className="h-3.5 w-3.5" />
            Reminder Preferences
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Defaults
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2 text-xs bg-primary text-primary-foreground shadow-sm"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saveSuccess ? 'Changes Saved' : 'Save CRM Controls'}
          </Button>
        </div>
      </div>

      {/* ── Section 1: Lead Statuses & Enquiry Types ── */}
      {activeSubSection === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statuses */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Lead Pipeline Statuses
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure active stages and custom labels for lead progression.
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {statuses.filter((s) => s.is_active).length} Active
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 divide-y divide-border/60">
              {statuses.map((st) => (
                <div
                  key={st.id}
                  className="pt-2 pb-1 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="font-mono text-[10px] text-muted-foreground w-6">
                      #{st.sort_order}
                    </span>
                    <Input
                      value={st.label}
                      onChange={(e) => updateStatusLabel(st.id, e.target.value)}
                      className="h-8 text-xs font-medium max-w-[200px]"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      ({st.id})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={st.is_active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleStatusActive(st.id)}
                      className={`h-7 px-2.5 text-[11px] ${
                        st.is_active
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {st.is_active ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enquiry Types */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-primary" />
                Customer Enquiry Types
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Categories classifying incoming rooftop and solar project inquiries.
              </p>
            </div>

            {/* Add Enquiry Type */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. Microgrid / Storage..."
                value={newEnquiryLabel}
                onChange={(e) => setNewEnquiryLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEnquiryType()}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEnquiryType}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {enquiryTypes.map((et) => (
                <div
                  key={et.id}
                  className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{et.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">id: {et.id}</p>
                  </div>
                  <Button
                    type="button"
                    variant={et.is_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleEnquiryActive(et.id)}
                    className={`h-6 px-2 text-[10px] ${
                      et.is_active
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {et.is_active ? 'Active' : 'Inactive'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Sources & Campaigns ── */}
      {activeSubSection === 'sources' && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Lead Sources & Campaign Tracking
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable tracking channels and mark paid advertising campaigns for ROI analytics.
              </p>
            </div>
            {/* Add Source Input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="New Lead Source..."
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                className="h-8 text-xs w-48"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSource}
                className="h-8 text-xs gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Source
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{src.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      src.is_campaign
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {src.is_campaign ? 'Campaign Channel' : 'Organic / Direct'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSourceCampaign(src.id)}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Toggle Campaign Tag
                  </Button>
                  <Button
                    type="button"
                    variant={src.is_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSourceActive(src.id)}
                    className={`h-6 px-2 text-[10px] ${
                      src.is_active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                    }`}
                  >
                    {src.is_active ? 'Active' : 'Disabled'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 3: Automated Assignment Rules ── */}
      {activeSubSection === 'assignment' && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Lead Assignment & Field Agent Routing Logic
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Governs automated distribution of customer inquiries to field engineers and sales executives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Mode selection */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <label className="font-semibold text-foreground block">
                Primary Assignment Strategy
              </label>
              <select
                value={assignmentRules.mode}
                onChange={(e) =>
                  setAssignmentRules((prev) => ({
                    ...prev,
                    mode: e.target.value as any,
                  }))
                }
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground"
              >
                <option value="pincode_match">
                  Pincode Match Priority (Match Agent Service Areas)
                </option>
                <option value="round_robin">Round-Robin Equal Distribution</option>
                <option value="manual">Manual Admin Triage Only</option>
              </select>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pincode matching evaluates agents configured with the customer's 6-digit postal code, ranking candidates by active workload and pending site visits.
              </p>
            </div>

            {/* Workload Cap */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <label className="font-semibold text-foreground block">
                Maximum Active Workload Cap Per Agent
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={assignmentRules.max_workload_cap}
                  onChange={(e) =>
                    setAssignmentRules((prev) => ({
                      ...prev,
                      max_workload_cap: parseInt(e.target.value) || 15,
                    }))
                  }
                  className="w-24 h-9 text-xs"
                />
                <span className="text-muted-foreground">Active leads max</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Prevents field agent burnout. If an agent reaches this cap, newly assigned site visits are routed to the next eligible agent covering the territory.
              </p>
            </div>

            {/* Auto assign toggle */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Automatic Lead Assignment</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Automatically assign qualified field agent on lead creation
                </p>
              </div>
              <input
                type="checkbox"
                checked={assignmentRules.auto_assign}
                onChange={(e) =>
                  setAssignmentRules((prev) => ({
                    ...prev,
                    auto_assign: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>

            {/* Fallback to round robin */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Fallback to Round-Robin</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Route to available team members if no agent covers lead pincode
                </p>
              </div>
              <input
                type="checkbox"
                checked={assignmentRules.fallback_to_round_robin}
                onChange={(e) =>
                  setAssignmentRules((prev) => ({
                    ...prev,
                    fallback_to_round_robin: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: Reminder Preferences ── */}
      {activeSubSection === 'reminders' && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Follow-up & SLA Reminder Preferences
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set automated notifications for scheduled appointments, callback deadlines, and overdue task escalations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Lead times */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <label className="font-semibold text-foreground block">
                Notification Lead Times (Minutes)
              </label>
              <div className="flex items-center gap-2">
                {[15, 60, 1440].map((mins) => {
                  const label =
                    mins === 15 ? '15 Min' : mins === 60 ? '1 Hour' : '24 Hours (1 Day)';
                  const isChecked = reminders.lead_times_minutes.includes(mins);
                  return (
                    <Button
                      key={mins}
                      type="button"
                      variant={isChecked ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setReminders((prev) => ({
                          ...prev,
                          lead_times_minutes: isChecked
                            ? prev.lead_times_minutes.filter((m) => m !== mins)
                            : [...prev.lead_times_minutes, mins],
                        }));
                      }}
                      className="h-8 text-xs"
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Alerts are triggered before a scheduled follow-up or site visit feasibility inspection.
              </p>
            </div>

            {/* Daily Digest Time */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <label className="font-semibold text-foreground block">
                Daily Morning Summary Digest Time
              </label>
              <Input
                type="time"
                value={reminders.daily_digest_time}
                onChange={(e) =>
                  setReminders((prev) => ({
                    ...prev,
                    daily_digest_time: e.target.value,
                  }))
                }
                className="w-36 h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Sends an operational daily digest of pending visits and calls due today.
              </p>
            </div>

            {/* Overdue Escalation Hours */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <label className="font-semibold text-foreground block">
                Manager Escalation for Overdue Tasks
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={reminders.overdue_escalation_hours}
                  onChange={(e) =>
                    setReminders((prev) => ({
                      ...prev,
                      overdue_escalation_hours: parseInt(e.target.value) || 24,
                    }))
                  }
                  className="w-24 h-9 text-xs"
                />
                <span className="text-muted-foreground">Hours after missed deadline</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tasks remaining unfinished past this threshold trigger supervisor escalation alerts.
              </p>
            </div>

            {/* Channels */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <label className="font-semibold text-foreground block">
                Authorized Notification Channels
              </label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders.enable_in_app}
                    onChange={(e) =>
                      setReminders((prev) => ({ ...prev, enable_in_app: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-primary"
                  />
                  <span>In-App Notifications (Notification Center)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders.enable_email}
                    onChange={(e) =>
                      setReminders((prev) => ({ ...prev, enable_email: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-primary"
                  />
                  <span>Email Reminders (Direct to Agent Inbox)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders.enable_whatsapp}
                    onChange={(e) =>
                      setReminders((prev) => ({ ...prev, enable_whatsapp: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-primary"
                  />
                  <span>WhatsApp Message Reminders (Twilio / Business API)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
