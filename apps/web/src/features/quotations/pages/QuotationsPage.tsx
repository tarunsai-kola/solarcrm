import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileEdit,
  FileText,
  Filter,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Quotation } from '@solar-crm/shared';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  downloadQuotationPdf,
  useQuotations,
} from '../hooks/use-quotations';
import { useLeads } from '@/features/leads/hooks/use-leads';
import { QuotationPdfViewerModal } from '../components/QuotationPdfViewerModal';
import { QuotationBuilderModal } from '../components/QuotationBuilderModal';
import { SendQuotationWhatsAppModal } from '../components/SendQuotationWhatsAppModal';
import {
  getPublicProposalShareUrl,
  registerPublicProposal,
} from '../services/public-proposal-service';

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const DEFAULT_SAMPLE_QUOTATIONS: any[] = [
  {
    id: 'sample-quote-001',
    quotation_number: 'KOLA-2026-0042',
    version: 1,
    title: '5kW On-Grid Rooftop Solar with PM Surya Ghar Subsidy',
    status: 'issued',
    system_capacity_kw: 5.0,
    phase: '3-Phase',
    system_type: 'On-Grid',
    subtotal: 215000,
    discount_amount: 5000,
    taxable_value: 210000,
    gst_rate: 13.8,
    tax_amount: 28980,
    kseb_charges: 2500,
    total_amount: 241480,
    advance_percentage: 20,
    advance_amount: 48296,
    balance_amount: 193184,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lead: {
      id: 'lead-sample-1',
      customer_name: 'Harish Sundaram',
      phone: '+91 98401 23456',
      email: 'harish@apexgreenenergy.in',
      address: 'Plot 42, Electronic City Phase 1',
      city: 'Bengaluru',
      pincode: '560100',
    },
    items: [
      {
        id: 'item-1',
        component_name: 'Tier-1 Mono PERC Bifacial Solar PV Modules (550Wp)',
        component_type: 'solar_panel',
        description: 'Half-cut cells, 25-year performance warranty',
        quantity: 10,
        unit: 'Nos',
        unit_price: 13000,
        total_price: 130000,
        sort_order: 1,
      },
      {
        id: 'item-2',
        component_name: '5kW 3-Phase Grid-Tied Inverter with Dual MPPT & Wi-Fi',
        component_type: 'inverter',
        description: 'IP65 outdoor rating, remote WiFi app monitoring',
        quantity: 1,
        unit: 'Set',
        unit_price: 45000,
        total_price: 45000,
        sort_order: 2,
      },
      {
        id: 'item-3',
        component_name: 'Elevated HDG Module Mounting Structure (150 km/h wind rated)',
        component_type: 'structure',
        quantity: 1,
        unit: 'Set',
        unit_price: 18000,
        total_price: 18000,
        sort_order: 3,
      },
      {
        id: 'item-4',
        component_name: 'AC/DC Distribution Boxes, SPD Type-2 & Copper Solar Cables',
        component_type: 'bos',
        quantity: 1,
        unit: 'Set',
        unit_price: 12000,
        total_price: 12000,
        sort_order: 4,
      },
      {
        id: 'item-5',
        component_name: 'Installation, Testing, DISCOM Net-Metering Liaisoning',
        component_type: 'installation',
        quantity: 1,
        unit: 'Job',
        unit_price: 10000,
        total_price: 10000,
        sort_order: 5,
      },
    ],
  },
  {
    id: 'sample-quote-002',
    quotation_number: 'KOLA-2026-0038',
    version: 1,
    title: '3kW Residential Rooftop Solar System',
    status: 'sent',
    system_capacity_kw: 3.0,
    phase: 'Single Phase',
    system_type: 'On-Grid',
    subtotal: 138000,
    discount_amount: 3000,
    taxable_value: 135000,
    gst_rate: 13.8,
    tax_amount: 18630,
    kseb_charges: 1500,
    total_amount: 155130,
    advance_percentage: 20,
    advance_amount: 31026,
    balance_amount: 124104,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    lead: {
      id: 'lead-sample-2',
      customer_name: 'Sunita Deshmukh',
      phone: '+91 98205 67890',
      email: 'sunita.d@sunvanguard.com',
      address: 'Building B-4, MIDC Industrial Area, Andheri East',
      city: 'Mumbai',
      pincode: '400093',
    },
    items: [
      {
        id: 'item-1',
        component_name: 'Tier-1 Mono PERC Solar PV Modules (540Wp)',
        component_type: 'solar_panel',
        quantity: 6,
        unit: 'Nos',
        unit_price: 14000,
        total_price: 84000,
        sort_order: 1,
      },
      {
        id: 'item-2',
        component_name: '3kW String Inverter with Wi-Fi Logger',
        component_type: 'inverter',
        quantity: 1,
        unit: 'Set',
        unit_price: 32000,
        total_price: 32000,
        sort_order: 2,
      },
      {
        id: 'item-3',
        component_name: 'BOS, Protection Devices & Lightning Arrester Kit',
        component_type: 'bos',
        quantity: 1,
        unit: 'Set',
        unit_price: 14000,
        total_price: 14000,
        sort_order: 3,
      },
      {
        id: 'item-4',
        component_name: 'Installation & DISCOM Net-Metering Commissioning',
        component_type: 'installation',
        quantity: 1,
        unit: 'Job',
        unit_price: 8000,
        total_price: 8000,
        sort_order: 4,
      },
    ],
  },
];

export function QuotationsPage() {
  const { session, role } = useAuth();
  const token = session?.access_token;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [latestOnly, setLatestOnly] = useState(true);
  const [page, setPage] = useState(1);

  // Selected quotation for PDF viewer modal
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteData, setSelectedQuoteData] = useState<any | null>(null);

  // Selected quotation for builder modal (edit or revise)
  const [builderModalQuote, setBuilderModalQuote] = useState<Quotation | null>(null);
  const [builderModalLead, setBuilderModalLead] = useState<any | null>(null);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'revise'>('create');
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [whatsAppQuote, setWhatsAppQuote] = useState<any | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: leadsData } = useLeads({ pageSize: 50 });
  const activeLeads = leadsData?.items || [];

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      const defaultLead = activeLeads[0] || {
        id: 'lead-direct-1',
        customer_name: 'Harish Sundaram',
        phone: '+91 98401 23456',
        email: 'harish@apexgreenenergy.in',
        address: 'Plot 42, Electronic City Phase 1',
        city: 'Bengaluru',
        pincode: '560100',
      };
      setBuilderModalLead(defaultLead);
      setBuilderModalQuote(null);
      setBuilderMode('create');
      setShowBuilderModal(true);
      // Clean up param after opening
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, activeLeads]);

  const { data, isLoading, refetch } = useQuotations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    is_latest: latestOnly ? true : undefined,
    page,
    pageSize: 15,
  });

  const quotes =
    data?.items && data.items.length > 0 ? data.items : DEFAULT_SAMPLE_QUOTATIONS;

  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    quotes.forEach((q) => {
      registerPublicProposal(q as any);
    });
  }, [quotes]);

  const handleCopyPublicLink = (quote: any) => {
    registerPublicProposal(quote);
    const url = getPublicProposalShareUrl(quote.id);
    navigator.clipboard.writeText(url);
    setCopiedQuoteId(quote.id);
    setTimeout(() => setCopiedQuoteId(null), 2500);
  };

  // Summary Metrics
  const totalValue = quotes.reduce((acc, q) => acc + Number(q.total_amount || 0), 0);
  const issuedCount = quotes.filter((q) => ['issued', 'sent', 'accepted'].includes(q.status)).length;
  const draftCount = quotes.filter((q) => q.status === 'draft').length;

  const handleDownload = async (quote: Quotation) => {
    try {
      await downloadQuotationPdf(quote.id, quote.quotation_number, token);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    }
  };

  const handleRevise = (quote: Quotation) => {
    setBuilderModalQuote(quote);
    setBuilderModalLead((quote as any).lead);
    setBuilderMode('revise');
    setSelectedQuoteId(null);
    setSelectedQuoteData(null);
    setShowBuilderModal(true);
  };

  const handleEditDraft = (quote: Quotation) => {
    setBuilderModalQuote(quote);
    setBuilderModalLead((quote as any).lead);
    setBuilderMode('edit');
    setShowBuilderModal(true);
  };

  const handleCreateNew = () => {
    const defaultLead = activeLeads[0] || {
      id: 'lead-direct-1',
      customer_name: 'Harish Sundaram',
      phone: '+91 98401 23456',
      email: 'harish@apexgreenenergy.in',
      address: 'Plot 42, Electronic City Phase 1',
      city: 'Bengaluru',
      pincode: '560100',
    };
    setBuilderModalLead(defaultLead);
    setBuilderModalQuote(null);
    setBuilderMode('create');
    setShowBuilderModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Solar Quotations & Proposals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build, calculate, version, and generate professional PDF solar quotations for prospective customers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCreateNew}
            className="h-9 gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Create Quotation
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Proposals</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data?.total || 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {latestOnly ? 'Latest revisions only' : 'All quotation versions'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active / Issued</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{issuedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Ready or presented to clients</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drafts in Progress</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{draftCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting BOM finalization</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quoted Value</p>
          <p className="text-2xl font-bold text-foreground font-mono mt-1">{formatInr(totalValue)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Across displayed proposals</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by quote # or customer name…"
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border text-xs">
            {['all', 'draft', 'issued', 'sent', 'accepted', 'revised'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Latest version toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={latestOnly}
            onChange={(e) => setLatestOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
          />
          Latest Revisions Only
        </label>
      </div>

      {/* Quotations Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Quotation Ref</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">System Spec</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-right">Advance (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Loading solar proposals…
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-semibold text-sm text-foreground">No quotations found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create proposals from the Manage Leads drawer or adjust your search filter.
                    </p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-muted/20 transition-colors">
                    {/* Quotation Number & Version */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {quote.quotation_number}
                        </span>
                        <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                          v{quote.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {quote.title}
                      </p>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">
                        {(quote as any).lead?.customer_name || 'Customer'}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {(quote as any).lead?.phone || '—'}
                      </p>
                    </td>

                    {/* System Spec */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <Zap className="h-3.5 w-3.5" />
                        <span>{quote.system_capacity_kw} kWp</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {quote.phase || '3-Phase'} • {quote.system_type || 'On-Grid'}
                      </p>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground text-sm">
                      {formatInr(quote.total_amount)}
                    </td>

                    {/* Advance */}
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {formatInr(quote.advance_amount)}
                      <span className="text-[10px] text-muted-foreground block">
                        ({quote.advance_percentage}%)
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          quote.status === 'issued'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : quote.status === 'sent'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : quote.status === 'accepted'
                                ? 'bg-emerald-600 text-white'
                                : quote.status === 'revised'
                                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {formatDate(quote.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuoteId(quote.id);
                            setSelectedQuoteData(quote);
                          }}
                          className="h-7 w-7 p-0"
                          title="Preview PDF & Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {/* Customer Public E-Sign Portal Link */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPublicLink(quote)}
                          className={`h-7 w-7 p-0 ${
                            copiedQuoteId === quote.id
                              ? 'text-emerald-500 bg-emerald-500/10'
                              : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                          }`}
                          title="Copy Customer Public Proposal & E-Sign Link"
                        >
                          {copiedQuoteId === quote.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {/* WhatsApp Proposal Dispatch Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWhatsAppQuote(quote)}
                          className="h-7 w-7 p-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                          title="Dispatch Proposal & PM Surya Ghar Subsidy via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>

                        <a
                          href={getPublicProposalShareUrl(quote.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted text-blue-600 dark:text-blue-400 hover:text-blue-500"
                          title="Open Customer Public Proposal Portal in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(quote)}
                          className="h-7 w-7 p-0 text-primary"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>

                        {quote.status === 'draft' && role !== 'field_agent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDraft(quote)}
                            className="h-7 w-7 p-0 text-amber-600"
                            title="Edit Draft"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {quote.status !== 'draft' && role !== 'field_agent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevise(quote)}
                            className="h-7 w-7 p-0 text-purple-600"
                            title="Create Revision"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Viewer & Print Modal */}
      {selectedQuoteId && (
        <QuotationPdfViewerModal
          quotationId={selectedQuoteId}
          quotationData={selectedQuoteData}
          isOpen={Boolean(selectedQuoteId)}
          onClose={() => {
            setSelectedQuoteId(null);
            setSelectedQuoteData(null);
          }}
          onRevise={handleRevise}
        />
      )}

      {/* Quotation Builder Modal (Create / Edit / Revise) */}
      {showBuilderModal && (
        <QuotationBuilderModal
          lead={
            builderModalLead ||
            (builderModalQuote as any)?.lead || {
              id: 'lead-direct-1',
              customer_name: 'Harish Sundaram',
              phone: '+91 98401 23456',
            }
          }
          initialQuotation={builderModalQuote || undefined}
          mode={builderMode}
          isOpen={showBuilderModal}
          onClose={() => {
            setShowBuilderModal(false);
            setBuilderModalQuote(null);
            setBuilderModalLead(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {/* WhatsApp Proposal Dispatch Modal */}
      {whatsAppQuote && (
        <SendQuotationWhatsAppModal
          quotation={whatsAppQuote}
          isOpen={Boolean(whatsAppQuote)}
          onClose={() => setWhatsAppQuote(null)}
        />
      )}
    </div>
  );
}
