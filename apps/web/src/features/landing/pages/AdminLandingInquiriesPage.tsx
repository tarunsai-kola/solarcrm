import {
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Inbox,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AddManualInquiryModal } from '../components/AddManualInquiryModal';
import { AssignSalespersonModal } from '../components/AssignSalespersonModal';
import { InquiryDetailDrawer } from '../components/InquiryDetailDrawer';
import { useLandingInquiries } from '../hooks/use-landing-inquiries';
import type { InquiryStatus, LandingInquiry } from '../services/landing-leads-service';

const STATUS_CONFIG: Record<InquiryStatus, { label: string; bg: string; text: string; border: string }> = {
  new: { label: 'New / Needs Assignment', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  assigned: { label: 'Assigned to Sales', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  contacted: { label: 'Contacted', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  demo_scheduled: { label: 'Demo Booked', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  converted: { label: 'Converted to Deal', bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
  disqualified: { label: 'Disqualified', bg: 'bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-700' },
};

export function AdminLandingInquiriesPage() {
  const {
    inquiries,
    salespersons,
    stats,
    exportCsv,
    refreshInquiries,
    resetToDemo,
    assignSalesperson,
  } = useLandingInquiries();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [selectedInquiryForAssign, setSelectedInquiryForAssign] = useState<LandingInquiry | null>(null);
  const [selectedInquiryForDetail, setSelectedInquiryForDetail] = useState<LandingInquiry | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Kola Software — Landing Inquiries & Sales Assignment Portal';
  }, []);

  // Filtered list
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = inq.customer_name?.toLowerCase().includes(q);
        const matchEmail = inq.email?.toLowerCase().includes(q);
        const matchPhone = inq.phone?.toLowerCase().includes(q);
        const matchCompany = inq.company_name?.toLowerCase().includes(q);
        const matchAddress = inq.address?.toLowerCase().includes(q);
        const matchCity = inq.city?.toLowerCase().includes(q);
        const matchRep = inq.assigned_salesperson_name?.toLowerCase().includes(q);

        if (!matchName && !matchEmail && !matchPhone && !matchCompany && !matchAddress && !matchCity && !matchRep) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'unassigned') {
        if (inq.assigned_salesperson_id) return false;
      } else if (statusFilter !== 'all') {
        if (inq.status !== statusFilter) return false;
      }

      // Salesperson
      if (salespersonFilter !== 'all') {
        if (inq.assigned_salesperson_id !== salespersonFilter) return false;
      }

      return true;
    });
  }, [inquiries, searchQuery, statusFilter, salespersonFilter]);

  const handleQuickAssign = (inquiryId: string, spId: string) => {
    const sp = salespersons.find((s) => s.id === spId);
    if (sp) {
      assignSalesperson(inquiryId, sp, 'Admin Executive');
      toast({
        title: 'Salesperson Assigned',
        description: `Lead assigned to ${sp.name}.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Sun className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-base font-extrabold text-white">
                KOLA <span className="font-light text-slate-400">SOFTWARE</span>
              </span>
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-200">Landing Leads & Sales Assignment Hub</span>
              <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                ← View Landing Page
              </Button>
            </Link>
            <Link to="/leads">
              <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-200 hover:bg-slate-800">
                Full CRM Pipeline →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Banner / Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Solar Promotional Inquiries
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {inquiries.length} Inquiries Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time responses from the Kola Software Solar VCRM promotional landing page. Review customer address details and assign leads directly to sales representatives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportCsv}
              className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={refreshInquiries}
              className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Manual Inquiry
            </Button>
          </div>
        </div>

        {/* Executive Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 bg-slate-900/80 border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Inquiries</span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{stats.totalCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">From Kola Software website</p>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-amber-500/30 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-xs font-bold">Needs Sales Assignment</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">{stats.unassignedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Pending salesperson dispatch</p>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span className="text-xs font-semibold">Assigned & Active</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-blue-400">{stats.assignedCount + stats.contactedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">With sales representatives</p>
          </Card>

          <Card className="p-4 bg-slate-900/80 border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Demos & Converted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{stats.demoCount + stats.convertedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">High conversion pipeline</p>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by customer name, address, phone, email, company, or salesperson..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 text-xs h-9"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md bg-slate-950 border border-slate-700 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Statuses ({inquiries.length})</option>
              <option value="unassigned">⚠️ Unassigned Leads ({stats.unassignedCount})</option>
              <option value="new">New Inquiries</option>
              <option value="assigned">Assigned to Sales</option>
              <option value="contacted">Contacted</option>
              <option value="demo_scheduled">Demo Scheduled</option>
              <option value="converted">Converted Deals</option>
            </select>

            {/* Salesperson Filter */}
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="h-9 rounded-md bg-slate-950 border border-slate-700 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Salespersons</option>
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.role.split(' ')[0]})
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-700 p-0.5 bg-slate-950">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs ${
                  viewMode === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Card View (Mobile friendly)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs ${
                  viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View (Desktop friendly)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Container */}
        {filteredInquiries.length === 0 ? (
          <Card className="p-12 text-center bg-slate-900/40 border-slate-800 rounded-2xl">
            <Inbox className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Inquiries Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              No solar inquiries matched your search or filter criteria. Try clearing filters or submit a new test inquiry.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSalespersonFilter('all');
                }}
                className="text-xs border-slate-700 text-slate-300"
              >
                Clear Filters
              </Button>
              <Button
                size="sm"
                onClick={resetToDemo}
                className="text-xs bg-amber-500 text-slate-950 font-bold"
              >
                Load Sample Inquiries
              </Button>
            </div>
          </Card>
        ) : viewMode === 'cards' ? (
          /* ── Responsive Card Grid View (Ideal for mobile & tablet) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInquiries.map((inq) => {
              const statusCfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
              const cleanPhone = inq.phone.replace(/[^\d+]/g, '');

              return (
                <Card
                  key={inq.id}
                  className={`p-5 rounded-2xl bg-slate-900/90 border transition-all hover:shadow-xl flex flex-col justify-between ${
                    !inq.assigned_salesperson_id
                      ? 'border-amber-500/50 hover:border-amber-400'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base leading-tight hover:text-amber-400 cursor-pointer"
                              onClick={() => setSelectedInquiryForDetail(inq)}>
                            {inq.customer_name}
                          </h3>
                        </div>
                        <p className="text-xs font-semibold text-amber-400/90 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{inq.company_name || 'Individual Prospect'}</span>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Contact & Physical Address (Crucial requirement from prompt) */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{inq.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[240px] text-slate-400">{inq.email}</span>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-800/80">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-slate-300">
                          <p className="font-medium text-xs text-white line-clamp-2">{inq.address}</p>
                          {(inq.city || inq.state) && (
                            <p className="text-[11px] text-slate-400">{inq.city}, {inq.state}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Salesperson Assignment Box */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          Assigned Salesperson:
                        </span>
                        {!inq.assigned_salesperson_id && (
                          <span className="text-amber-400 font-bold">Action Needed</span>
                        )}
                      </div>

                      {inq.assigned_salesperson_id ? (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                              {inq.assigned_salesperson_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-none">
                                {inq.assigned_salesperson_name}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {inq.assigned_salesperson_role?.split(' ')[0] || 'Sales Rep'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedInquiryForAssign(inq)}
                            className="text-[11px] h-6 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            Reassign
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedInquiryForAssign(inq)}
                          className="w-full text-xs h-8 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                          Assign to Salesperson
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      {new Date(inq.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="WhatsApp Customer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedInquiryForDetail(inq)}
                        className="text-xs h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ── Compact Table View (Ideal for large monitors) ── */
          <Card className="rounded-2xl bg-slate-900/90 border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Customer & Company</th>
                    <th className="py-3 px-4">Contact (Phone / Email)</th>
                    <th className="py-3 px-4">Full Address / Site Location</th>
                    <th className="py-3 px-4">Assigned Salesperson</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInquiries.map((inq) => {
                    const statusCfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                    const cleanPhone = inq.phone.replace(/[^\d+]/g, '');

                    return (
                      <tr key={inq.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Name & Company */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-white text-sm hover:text-amber-400 cursor-pointer"
                             onClick={() => setSelectedInquiryForDetail(inq)}>
                            {inq.customer_name}
                          </p>
                          <p className="text-[11px] text-amber-400/90 truncate max-w-[180px]">
                            {inq.company_name || 'Individual Buyer'}
                          </p>
                        </td>

                        {/* Phone & Email */}
                        <td className="py-3 px-4">
                          <p className="font-mono text-slate-200">{inq.phone}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{inq.email}</p>
                        </td>

                        {/* Physical Address */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-white font-medium truncate" title={inq.address}>
                            {inq.address}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {inq.city ? `${inq.city}, ` : ''}{inq.state || ''}
                          </p>
                        </td>

                        {/* Assigned Salesperson */}
                        <td className="py-3 px-4">
                          {inq.assigned_salesperson_id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                                {inq.assigned_salesperson_name
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{inq.assigned_salesperson_name}</p>
                                <button
                                  onClick={() => setSelectedInquiryForAssign(inq)}
                                  className="text-[10px] text-amber-400 hover:underline"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedInquiryForAssign(inq)}
                              className="text-[11px] h-7 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30"
                            >
                              + Assign Rep
                            </Button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-emerald-400"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedInquiryForDetail(inq)}
                              className="text-xs h-7 px-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700"
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Assignment Modal */}
      {selectedInquiryForAssign && (
        <AssignSalespersonModal
          inquiry={selectedInquiryForAssign}
          isOpen={!!selectedInquiryForAssign}
          onClose={() => setSelectedInquiryForAssign(null)}
          onSuccess={() => {
            refreshInquiries();
            setSelectedInquiryForAssign(null);
          }}
        />
      )}

      {/* Full Detail Drawer */}
      {selectedInquiryForDetail && (
        <InquiryDetailDrawer
          inquiry={selectedInquiryForDetail}
          isOpen={!!selectedInquiryForDetail}
          onClose={() => setSelectedInquiryForDetail(null)}
          onOpenAssignModal={(inq) => {
            setSelectedInquiryForDetail(null);
            setSelectedInquiryForAssign(inq);
          }}
        />
      )}

      {/* Add Manual Modal */}
      <AddManualInquiryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
}
