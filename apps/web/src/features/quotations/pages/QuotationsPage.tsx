import { useState } from 'react';
import {
  Calculator,
  Download,
  Eye,
  FileCheck,
  FileEdit,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
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
import { QuotationPdfViewerModal } from '../components/QuotationPdfViewerModal';
import { QuotationBuilderModal } from '../components/QuotationBuilderModal';

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

export function QuotationsPage() {
  const { session, role } = useAuth();
  const token = session?.access_token;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [latestOnly, setLatestOnly] = useState(true);
  const [page, setPage] = useState(1);

  // Selected quotation for PDF viewer modal
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Selected quotation for builder modal (edit or revise)
  const [builderModalQuote, setBuilderModalQuote] = useState<Quotation | null>(null);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'revise'>('create');
  const [showBuilderModal, setShowBuilderModal] = useState(false);

  const { data, isLoading, refetch } = useQuotations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    is_latest: latestOnly ? true : undefined,
    page,
    pageSize: 15,
  });

  const quotes = data?.items || [];

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
    setBuilderMode('revise');
    setSelectedQuoteId(null); // close PDF viewer if open
    setShowBuilderModal(true);
  };

  const handleEditDraft = (quote: Quotation) => {
    setBuilderModalQuote(quote);
    setBuilderMode('edit');
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
                          onClick={() => setSelectedQuoteId(quote.id)}
                          className="h-7 w-7 p-0"
                          title="Preview PDF & Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

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
          isOpen={Boolean(selectedQuoteId)}
          onClose={() => setSelectedQuoteId(null)}
          onRevise={handleRevise}
        />
      )}

      {/* Quotation Builder Modal (Edit / Revise) */}
      {showBuilderModal && builderModalQuote && (
        <QuotationBuilderModal
          lead={(builderModalQuote as any).lead || { id: builderModalQuote.lead_id, customer_name: 'Customer', phone: '' }}
          initialQuotation={builderModalQuote}
          mode={builderMode}
          isOpen={showBuilderModal}
          onClose={() => {
            setShowBuilderModal(false);
            setBuilderModalQuote(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
