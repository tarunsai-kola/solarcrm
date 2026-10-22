import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  MapPin,
  Calendar,
  Building2,
  Zap,
  Camera,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Eye,
  FileEdit,
  LayoutGrid,
  List,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  getLocalSiteVisits,
  updateSiteVisit,
  SiteVisit,
  SiteVisitStatus,
} from '../services/site-visits-service';
import { SiteSurveyAuditModal } from '../components/SiteSurveyAuditModal';
import { SiteVisitDetailDrawer } from '../components/SiteVisitDetailDrawer';
import { ScheduleSiteVisitModal } from '../components/ScheduleSiteVisitModal';

export function SiteVisitsPage() {
  const navigate = useNavigate();

  // State
  const [visits, setVisits] = useState<SiteVisit[]>(() => getLocalSiteVisits());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SiteVisitStatus>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [activeAuditVisit, setActiveAuditVisit] = useState<SiteVisit | null>(null);
  const [activeDetailVisit, setActiveDetailVisit] = useState<SiteVisit | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchesSearch =
        v.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        v.address.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase()) ||
        v.consumer_number.toLowerCase().includes(search.toLowerCase()) ||
        v.field_agent_name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || v.visit_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visits, search, statusFilter]);

  // KPI Metrics
  const totalCount = visits.length;
  const completedCount = visits.filter((v) => v.visit_status === 'completed').length;
  const scheduledCount = visits.filter((v) => v.visit_status === 'scheduled').length;
  const avgCapacityKw =
    visits.length > 0
      ? (visits.reduce((acc, v) => acc + (v.recommended_system_capacity_kw || 0), 0) / visits.length).toFixed(1)
      : '0.0';

  const handleSaveAudit = (updatedFields: Partial<SiteVisit>) => {
    if (!activeAuditVisit) return;
    const updated = updateSiteVisit(activeAuditVisit.id, updatedFields);
    if (updated) {
      setVisits(getLocalSiteVisits());
      setActiveAuditVisit(null);
    }
  };

  const handleConvertToQuotation = (visit: SiteVisit) => {
    navigate(`/quotations?action=create&kwp=${visit.recommended_system_capacity_kw}&leadId=${visit.lead_id}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & CTAs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="h-4 w-4" />
            Field Operations & Technical Audits
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Rooftop Site Visits & Technical Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conduct GPS-geotagged technical roof inspections, structural shading analyses, DISCOM meter audits, and electrical cable mapping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/calculator')}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Solar Sizer Tool</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Site Audit</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Site Audits</p>
              <h3 className="text-2xl font-bold text-foreground font-mono mt-0.5">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Scheduled / In-Queue</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {scheduledCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed Feasibility</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {completedCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Capacity Sized</p>
              <h3 className="text-2xl font-bold text-primary font-mono mt-0.5">
                {avgCapacityKw} kWp
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, address, city, DISCOM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({visits.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('scheduled')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'scheduled'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredVisits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Site Visits Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No audits match your current search filters. Schedule a new site audit or reset search.
          </p>
          <Button size="sm" onClick={() => setShowScheduleModal(true)}>
            Schedule New Audit
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVisits.map((visit) => (
            <Card
              key={visit.id}
              className="border-border shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-5 space-y-4">
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        visit.visit_status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {visit.visit_status.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors">
                      {visit.customer_name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-primary block">
                      {visit.recommended_system_capacity_kw} kWp
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {visit.recommended_panels_count} Panels
                    </span>
                  </div>
                </div>

                {/* Location & DISCOM info */}
                <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                  <div className="flex items-center gap-1.5 text-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{visit.address}, {visit.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{visit.discom_name} • CA: {visit.consumer_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      {new Date(visit.scheduled_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Technical highlights badges */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/80">
                    <span className="text-muted-foreground block text-[10px]">Shadow-Free Area</span>
                    <strong className="text-foreground font-mono">{visit.shadow_free_area_sqft} sq ft</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/80">
                    <span className="text-muted-foreground block text-[10px]">Roof Type</span>
                    <strong className="text-foreground capitalize">{visit.roof_type.replace('_', ' ')}</strong>
                  </div>
                </div>

                {/* Geotag & Photo Evidence status */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {visit.gps_coordinates ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Geotagged
                      </span>
                    ) : (
                      <span className="text-amber-500">No Geotag</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    <span>{visit.photos.length} Photos</span>
                  </div>

                  <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {visit.field_agent_name.split(' ')[0]}
                  </div>
                </div>
              </CardContent>

              {/* Card Footer Actions */}
              <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDetailVisit(visit)}
                  className="text-xs h-8 flex-1"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Details
                </Button>

                <Button
                  size="sm"
                  onClick={() => setActiveAuditVisit(visit)}
                  className="text-xs h-8 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileEdit className="h-3.5 w-3.5 mr-1" />
                  Conduct Audit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5">Customer & Site</th>
                  <th className="p-3.5">DISCOM & CA No.</th>
                  <th className="p-3.5">Inspection Date</th>
                  <th className="p-3.5">Roof & Area</th>
                  <th className="p-3.5">Sized kWp</th>
                  <th className="p-3.5">Field Surveyor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{visit.customer_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {visit.address}, {visit.city}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{visit.discom_name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{visit.consumer_number}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {new Date(visit.scheduled_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground capitalize">{visit.roof_type.replace('_', ' ')}</div>
                      <div className="text-[11px] text-muted-foreground">{visit.shadow_free_area_sqft} sq ft usable</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-primary">
                      {visit.recommended_system_capacity_kw} kWp
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {visit.field_agent_name}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          visit.visit_status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {visit.visit_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveDetailVisit(visit)}
                        className="text-xs h-7 px-2"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveAuditVisit(visit)}
                        className="text-xs h-7 px-2 bg-primary text-primary-foreground"
                      >
                        Audit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {activeAuditVisit && (
        <SiteSurveyAuditModal
          visit={activeAuditVisit}
          isOpen={Boolean(activeAuditVisit)}
          onClose={() => setActiveAuditVisit(null)}
          onSave={handleSaveAudit}
          onConvertToQuote={handleConvertToQuotation}
        />
      )}

      {/* Detail Drawer */}
      {activeDetailVisit && (
        <SiteVisitDetailDrawer
          visit={activeDetailVisit}
          isOpen={Boolean(activeDetailVisit)}
          onClose={() => setActiveDetailVisit(null)}
          onEdit={(v) => {
            setActiveDetailVisit(null);
            setActiveAuditVisit(v);
          }}
          onConvertToQuote={handleConvertToQuotation}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleSiteVisitModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={(newVisit) => {
            setVisits(getLocalSiteVisits());
            setShowScheduleModal(false);
          }}
        />
      )}
    </div>
  );
}
