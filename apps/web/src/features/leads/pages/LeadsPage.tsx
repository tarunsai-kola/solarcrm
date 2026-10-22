import {
  AlertTriangle,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Filter,
  Flame,
  Globe,
  History,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ENQUIRY_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_CONFIG,
  LEAD_TEMPERATURES,
  type LeadFilter,
  type LeadStatus,
  type LeadTemperature,
} from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AddLeadModal } from '../components/AddLeadModal';
import { BulkActionsBar } from '../components/BulkActionsBar';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';
import { LeadTable } from '../components/LeadTable';
import { exportLeadsToCsv, useLeads, useTeamMembers } from '../hooks/use-leads';

type QuickFilterType = 'all' | 'fresh' | 'contacted' | 'follow_up_due' | 'overdue' | 'won' | 'lost';

interface SavedFilterPreset {
  id: string;
  name: string;
  filters: Partial<LeadFilter>;
  quickFilter?: QuickFilterType;
}

const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: 'preset-hot',
    name: 'Hot & Urgent',
    filters: { temperature: 'hot' },
    quickFilter: 'all',
  },
  {
    id: 'preset-overdue',
    name: 'Overdue Follow-ups',
    filters: {},
    quickFilter: 'overdue',
  },
  {
    id: 'preset-meta',
    name: 'Meta Ads Fresh',
    filters: { lead_source: 'Meta Ads' },
    quickFilter: 'fresh',
  },
];

export function LeadsPage() {
  const { role, user } = useAuth();
  const { data: team } = useTeamMembers();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tempFilter, setTempFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [enquiryFilter, setEnquiryFilter] = useState<string>('');
  const [pincodeFilter, setPincodeFilter] = useState<string>('');
  const [salesFilter, setSalesFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [createdFrom, setCreatedFrom] = useState<string>('');
  const [createdTo, setCreatedTo] = useState<string>('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected lead IDs for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Saved Filters
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem('solar_crm_saved_lead_filters');
      return stored ? JSON.parse(stored) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);

  // Role permissions
  const canCreate = role === 'admin' || role === 'inbound_sales';
  const canExport = role === 'admin' || role === 'inbound_sales';
  const canBulkAction = role === 'admin' || role === 'inbound_sales';

  // Construct active query filters
  const currentFilters: Partial<LeadFilter> = {
    page,
    pageSize,
    search: search.trim() || undefined,
    quick_filter: quickFilter !== 'all' ? quickFilter : undefined,
    status: statusFilter ? (statusFilter as LeadStatus) : undefined,
    temperature: tempFilter ? (tempFilter as LeadTemperature) : undefined,
    lead_source: sourceFilter ? (sourceFilter as any) : undefined,
    enquiry_type: enquiryFilter ? (enquiryFilter as any) : undefined,
    pincode: pincodeFilter.trim() || undefined,
    inbound_sales_id: salesFilter || undefined,
    assigned_field_agent_id: agentFilter || undefined,
    from: createdFrom ? new Date(createdFrom).toISOString() : undefined,
    to: createdTo ? new Date(createdTo).toISOString() : undefined,
    sort_by: sortBy as any,
    sort_order: sortOrder,
  };

  const { data, isLoading, isError, refetch } = useLeads(currentFilters);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const resetAllFilters = () => {
    setSearch('');
    setQuickFilter('all');
    setStatusFilter('');
    setTempFilter('');
    setSourceFilter('');
    setEnquiryFilter('');
    setPincodeFilter('');
    setSalesFilter('');
    setAgentFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  };

  // Sorting header click
  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (!data?.items) return;
    if (selectedLeadIds.length === data.items.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(data.items.map((i) => i.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Lead drawer click
  const handleSelectLead = (id: string) => {
    setActiveLeadId(id);
    setIsDrawerOpen(true);
  };

  // CSV Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportLeadsToCsv(currentFilters);
      toast({
        title: 'Export Complete',
        description: 'Leads CSV report generated and downloaded.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'Permission denied or error generating export',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Saved presets handling
  const applyPreset = (preset: SavedFilterPreset) => {
    resetAllFilters();
    if (preset.quickFilter) setQuickFilter(preset.quickFilter);
    if (preset.filters.status) setStatusFilter(preset.filters.status);
    if (preset.filters.temperature) setTempFilter(preset.filters.temperature);
    if (preset.filters.lead_source) setSourceFilter(preset.filters.lead_source);
    if (preset.filters.enquiry_type) setEnquiryFilter(preset.filters.enquiry_type);
    if (preset.filters.pincode) setPincodeFilter(preset.filters.pincode);
    if (preset.filters.inbound_sales_id) setSalesFilter(preset.filters.inbound_sales_id);
    if (preset.filters.assigned_field_agent_id)
      setAgentFilter(preset.filters.assigned_field_agent_id);
    setPage(1);
    toast({
      title: 'Filter Applied',
      description: `Loaded preset: "${preset.name}".`,
    });
  };

  const saveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedFilterPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      filters: {
        status: statusFilter ? (statusFilter as any) : undefined,
        temperature: tempFilter ? (tempFilter as any) : undefined,
        lead_source: sourceFilter ? (sourceFilter as any) : undefined,
        enquiry_type: enquiryFilter ? (enquiryFilter as any) : undefined,
        pincode: pincodeFilter || undefined,
        inbound_sales_id: salesFilter || undefined,
        assigned_field_agent_id: agentFilter || undefined,
      },
      quickFilter,
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('solar_crm_saved_lead_filters', JSON.stringify(updated));
    setNewPresetName('');
    setShowSavePresetDialog(false);
    toast({
      title: 'Filter Preset Saved',
      description: `Saved "${newPreset.name}" to your preset views.`,
    });
  };

  const hasActiveFilters = Boolean(
    search ||
      quickFilter !== 'all' ||
      statusFilter ||
      tempFilter ||
      sourceFilter ||
      enquiryFilter ||
      pincodeFilter ||
      salesFilter ||
      agentFilter ||
      createdFrom ||
      createdTo,
  );

  return (
    <div className="space-y-6">
      {/* ─── 1. Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <ClipboardList className="h-6 w-6 text-primary" />
            Manage Leads
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Centralized pipeline management, enquiry tracking, and field agent assignment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Landing Inquiries Hub Button */}
          <Link to="/admin/landing-inquiries">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            >
              <Globe className="h-3.5 w-3.5" />
              Landing Inquiries
            </Button>
          </Link>

          {/* Export CSV Button (Restricted) */}
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              id="leads-export-btn"
              disabled={isExporting}
              onClick={handleExport}
              className="gap-1.5 text-xs h-9"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
          )}

          {/* Add Lead Primary Button */}
          {canCreate && (
            <Button
              id="leads-add-btn"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-xs h-9 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* ─── 2. Quick Filter Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-border">
        {[
          { id: 'all', label: 'All Leads' },
          { id: 'fresh', label: 'Fresh' },
          { id: 'contacted', label: 'Contacted' },
          { id: 'follow_up_due', label: 'Follow-up Due' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'won', label: 'Won' },
          { id: 'lost', label: 'Lost' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`quick-filter-${tab.id}`}
            onClick={() => {
              setQuickFilter(tab.id as QuickFilterType);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
              quickFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 3. Search & Filters Bar ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="leads-search"
              placeholder="Search by customer name, phone, address, pincode…"
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`gap-1.5 text-xs h-9 ${showAdvancedFilters ? 'bg-muted' : ''}`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters {hasActiveFilters && '•'}
          </Button>

          {/* Saved Presets Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              onChange={(e) => {
                const found = savedPresets.find((p) => p.id === e.target.value);
                if (found) applyPreset(found);
              }}
              value=""
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>
                Saved Presets
              </option>
              {savedPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              title="Save current filters"
              className="h-9 px-2 text-xs"
              onClick={() => setShowSavePresetDialog(true)}
            >
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-border animate-in slide-in-from-top-2 text-xs">
            {/* Status */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">All Statuses</option>
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {LEAD_STATUS_CONFIG[st]?.label ?? st}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Temperature
              </label>
              <select
                value={tempFilter}
                onChange={(e) => handleFilterChange(setTempFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs capitalize"
              >
                <option value="">All Temperatures</option>
                {LEAD_TEMPERATURES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">All Sources</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Enquiry Type */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Enquiry Type
              </label>
              <select
                value={enquiryFilter}
                onChange={(e) => handleFilterChange(setEnquiryFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">All Types</option>
                {ENQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Pincode */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Pincode
              </label>
              <Input
                placeholder="e.g. 411038"
                value={pincodeFilter}
                onChange={(e) => handleFilterChange(setPincodeFilter, e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Salesperson */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Salesperson
              </label>
              <select
                value={salesFilter}
                onChange={(e) => handleFilterChange(setSalesFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">All Sales</option>
                {team?.inboundSales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Agent */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                Field Agent
              </label>
              <select
                value={agentFilter}
                onChange={(e) => handleFilterChange(setAgentFilter, e.target.value)}
                className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">All Agents</option>
                {team?.fieldAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Save Preset Dialog ───────────────────────────────────────────── */}
      {showSavePresetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              Save Current Filter View
            </h3>
            <p className="text-muted-foreground">
              Name this preset to quickly reload these filters anytime.
            </p>
            <Input
              placeholder="e.g. Pune Rooftop Hot Leads"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="text-xs"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePresetDialog(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveCurrentPreset}>
                Save Preset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Leads Table ──────────────────────────────────────────────────── */}
      <LeadTable
        leads={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        selectedLeadIds={selectedLeadIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectRow={handleToggleSelectRow}
        onSelectLead={handleSelectLead}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      {/* ─── 6. Pagination Controls ──────────────────────────────────────────── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of{' '}
            {data.total} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <span className="font-medium text-foreground px-1">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ─── 7. Bulk Actions Bar (Role-Gated) ─────────────────────────────────── */}
      {canBulkAction && (
        <BulkActionsBar
          selectedCount={selectedLeadIds.length}
          selectedLeadIds={selectedLeadIds}
          onClearSelection={() => setSelectedLeadIds([])}
        />
      )}

      {/* ─── 8. Modals & Drawers ─────────────────────────────────────────────── */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onInspectLead={(leadId) => {
          setActiveLeadId(leadId);
          setIsDrawerOpen(true);
        }}
      />

      <LeadDetailDrawer
        leadId={activeLeadId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveLeadId(null);
        }}
      />
    </div>
  );
}
