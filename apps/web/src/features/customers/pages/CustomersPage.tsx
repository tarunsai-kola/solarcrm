import { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  UserSquare2,
  Users,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useLeads, type LeadWithRelations } from '@/features/leads/hooks/use-leads';
import { LeadDetailDrawer } from '@/features/leads/components/LeadDetailDrawer';
import { AddLeadModal } from '@/features/leads/components/AddLeadModal';
import { ScheduleMeetingModal } from '@/features/integrations/components/ScheduleMeetingModal';

export function CustomersPage() {
  const [tabFilter, setTabFilter] = useState<'won' | 'all' | 'residential' | 'commercial'>('won');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [meetingModalCustomer, setMeetingModalCustomer] = useState<LeadWithRelations | null>(null);

  // Fetch leads (pageSize 100 for comprehensive directory view)
  const { data: leadsData, isLoading, isError, refetch } = useLeads({
    pageSize: 100,
  });

  const allLeads = leadsData?.items ?? [];

  // KPI Calculations
  const stats = useMemo(() => {
    const wonClients = allLeads.filter((l) => l.status === 'won');
    const totalLoad = wonClients.reduce((acc, l) => {
      const size = l.quotations?.[0]?.system_size_kw ?? (l.enquiry_type === 'commercial' ? 10 : 3.5);
      return acc + Number(size);
    }, 0);
    // Standard solar generation calculation: ~1,400 units/kW/year at ₹8/unit tariff
    const estimatedYearlySavings = totalLoad * 1400 * 8;

    return {
      totalCustomers: allLeads.length,
      wonClients: wonClients.length,
      totalLoadKw: Math.round(totalLoad * 10) / 10,
      estimatedYearlySavings: Math.round(estimatedYearlySavings),
    };
  }, [allLeads]);

  // Filtered customers based on search and tab
  const filteredCustomers = useMemo(() => {
    return allLeads.filter((c) => {
      // Tab filter
      if (tabFilter === 'won' && c.status !== 'won') return false;
      if (tabFilter === 'residential' && c.enquiry_type !== 'residential') return false;
      if (tabFilter === 'commercial' && c.enquiry_type !== 'commercial' && c.enquiry_type !== 'industrial') return false;

      // Search term
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const matchesName = c.customer_name?.toLowerCase().includes(s);
        const matchesPhone = c.phone?.toLowerCase().includes(s);
        const matchesEmail = c.email?.toLowerCase().includes(s);
        const matchesAddress = c.address?.toLowerCase().includes(s);
        const matchesPincode = c.pincode?.toLowerCase().includes(s);
        const matchesArea = c.area?.toLowerCase().includes(s);
        return matchesName || matchesPhone || matchesEmail || matchesAddress || matchesPincode || matchesArea;
      }

      return true;
    });
  }, [allLeads, tabFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <UserSquare2 className="h-6 w-6 text-primary" />
            Customer Directory & Installations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage verified rooftop solar clients, sanctioned loads, installation contracts, and customer engagements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Customer / Lead
          </Button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Converted Clients</p>
              <p className="text-xl font-bold text-foreground">{stats.wonClients}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Solar Load</p>
              <p className="text-xl font-bold text-foreground">{stats.totalLoadKw} kW</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Annual Savings</p>
              <p className="text-xl font-bold text-foreground">
                ₹{stats.estimatedYearlySavings.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Accounts</p>
              <p className="text-xl font-bold text-foreground">{stats.totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Toolbar: Tabs & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-muted-foreground px-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> View:
          </span>
          {[
            { id: 'won', label: '🏆 Won & Installed', count: stats.wonClients },
            { id: 'all', label: 'All Customer Accounts', count: stats.totalCustomers },
            { id: 'residential', label: 'Residential Rooftops' },
            { id: 'commercial', label: 'Commercial & Industrial' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                tabFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 text-inherit">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, pincode…"
            className="pl-8 text-xs h-8 rounded-lg"
          />
        </div>
      </div>

      {/* ── Customers Table / Directory ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Customer & Contact</th>
                <th className="px-4 py-3">Installation Location</th>
                <th className="px-4 py-3">Solar Sizing / Category</th>
                <th className="px-4 py-3">Stage / Status</th>
                <th className="px-4 py-3">Assigned Representatives</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && <TableSkeleton rows={5} cols={6} />}

              {isError && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-destructive">
                    Failed to load customer records. Please check database connection.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground space-y-2">
                    <UserSquare2 className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">No customers found</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {tabFilter === 'won'
                        ? 'No converted customers with "Won" status yet. Move pipeline leads to "Won" to record customer installations.'
                        : 'No customer accounts match your current filter criteria.'}
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filteredCustomers.map((cust) => {
                  const isWon = cust.status === 'won';
                  const mapUrl = cust.address || cust.area || cust.pincode
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${cust.address || ''} ${cust.area || ''} ${cust.pincode || ''}`,
                      )}`
                    : null;

                  const cleanPhone = cust.phone?.replace(/[\s\-\(\)\+]/g, '') ?? '';
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(cust.customer_name)},%20Sunbeam%20Solar%20team%20here%20regarding%20your%20installation.` : null;

                  const systemSize = cust.quotations?.[0]?.system_size_kw ?? (cust.enquiry_type === 'commercial' ? 10 : 3.5);

                  return (
                    <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {cust.customer_name ? cust.customer_name.slice(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedLeadId(cust.id)}
                              className="font-bold text-foreground hover:text-primary transition-colors text-left"
                            >
                              {cust.customer_name}
                            </button>
                            <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                              {cust.phone && (
                                <a href={`tel:${cust.phone}`} className="hover:underline flex items-center gap-0.5">
                                  <Phone className="h-2.5 w-2.5" />
                                  {cust.phone}
                                </a>
                              )}
                              {cust.email && <span className="truncate max-w-[140px]">• {cust.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Map */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="truncate text-foreground font-medium">
                            {cust.address || cust.area || 'Location Pending'}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <MapPin className="h-3 w-3 shrink-0 text-primary" />
                            <span>
                              {cust.area || 'Territory'}, {cust.pincode || 'Pincode'}
                            </span>
                            {mapUrl && (
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline text-[10px] inline-flex items-center gap-0.5"
                                title="Open in Google Maps"
                              >
                                Maps <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Solar Sizing & Tariff */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-500" />
                            {systemSize} kW Proposed System
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Category: <span className="capitalize font-medium text-foreground">{cust.enquiry_type || 'Residential'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Stage / Status */}
                      <td className="px-4 py-3">
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Installed & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border capitalize">
                            {cust.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Assigned Representatives */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-[11px]">
                          {cust.assigned_field_agent ? (
                            <div className="text-foreground font-medium flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Field: {cust.assigned_field_agent.full_name}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Field: Unassigned</div>
                          )}
                          {cust.inbound_sales ? (
                            <div className="text-muted-foreground">
                              Sales: {cust.inbound_sales.full_name}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                              title="Message via WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => setMeetingModalCustomer(cust)}
                            title="Schedule consultation or maintenance meeting"
                          >
                            <Calendar className="h-3 w-3" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
                            onClick={() => setSelectedLeadId(cust.id)}
                          >
                            View Dossier
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-out Lead / Customer Detail Drawer ── */}
      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          isOpen={Boolean(selectedLeadId)}
          onClose={() => setSelectedLeadId(null)}
        />
      )}

      {/* ── Schedule Meeting / Appointment Modal ── */}
      {meetingModalCustomer && (
        <ScheduleMeetingModal
          isOpen={Boolean(meetingModalCustomer)}
          onClose={() => setMeetingModalCustomer(null)}
          leadId={meetingModalCustomer.id}
          customerName={meetingModalCustomer.customer_name}
          customerEmail={meetingModalCustomer.email || undefined}
          customerAddress={meetingModalCustomer.address || meetingModalCustomer.area || undefined}
        />
      )}

      {/* ── Add Customer / Lead Modal ── */}
      {isAddModalOpen && (
        <AddLeadModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onInspectLead={(id) => {
            setIsAddModalOpen(false);
            setSelectedLeadId(id);
          }}
        />
      )}
    </div>
  );
}
