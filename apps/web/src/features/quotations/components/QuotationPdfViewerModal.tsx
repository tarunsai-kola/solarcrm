import { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileEdit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import type { Quotation } from '@solar-crm/shared';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  downloadQuotationPdf,
  useCompanyBankAccounts,
  useCompanyOffices,
  useCompanySettings,
  useQuotation,
  useUpdateQuotationStatus,
} from '../hooks/use-quotations';

interface QuotationPdfViewerModalProps {
  quotationId: string;
  isOpen: boolean;
  onClose: () => void;
  onRevise?: (quotation: Quotation) => void;
}

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
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

export function QuotationPdfViewerModal({
  quotationId,
  isOpen,
  onClose,
  onRevise,
}: QuotationPdfViewerModalProps) {
  const { session, role } = useAuth();
  const token = session?.access_token;

  const { data: quote, isLoading } = useQuotation(quotationId);
  const { data: activeSettings } = useCompanySettings();
  const { data: activeOffices } = useCompanyOffices();
  const { data: bankAccounts } = useCompanyBankAccounts();
  const updateStatusMutation = useUpdateQuotationStatus(quotationId);

  const [copiedBank, setCopiedBank] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Use snapshot if present, else fallback
  const snapshot = (quote as any)?.company_snapshot || {};
  const company = snapshot.settings && Object.keys(snapshot.settings).length > 0
    ? snapshot.settings
    : activeSettings || {};

  const offices = (snapshot.offices && snapshot.offices.length > 0
    ? snapshot.offices
    : activeOffices || []
  ).slice(0, 6);

  const bank = snapshot.bank_account || bankAccounts?.find((b) => b.is_primary) || bankAccounts?.[0] || null;

  const handleDownload = async () => {
    if (!quote) return;
    try {
      setIsDownloading(true);
      await downloadQuotationPdf(quote.id, quote.quotation_number, token);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: any) => {
    try {
      await updateStatusMutation.mutateAsync({ status: newStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const copyBankDetails = () => {
    if (!bank) return;
    const text = `A/C Holder: ${bank.account_holder_name}\nBank: ${bank.bank_name}\nA/C No: ${bank.account_number}\nIFSC: ${bank.ifsc_code}\nBranch: ${bank.branch_name || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground font-mono">
                  {quote?.quotation_number || 'Quotation'}
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                  v{quote?.version || 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    quote?.status === 'issued'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : quote?.status === 'sent'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : quote?.status === 'revised'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {quote?.status || 'draft'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Official Commercial Solar Proposal Document (A4 Preview)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons based on status */}
            {quote?.status === 'draft' && role !== 'field_agent' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('issued')}
                className="h-8 gap-1.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <FileCheck className="h-3.5 w-3.5" />
                Issue Quotation
              </Button>
            )}

            {quote?.status === 'issued' && role !== 'field_agent' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('sent')}
                className="h-8 gap-1.5 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Send className="h-3.5 w-3.5" />
                Mark as Sent
              </Button>
            )}

            {onRevise && quote && role !== 'field_agent' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRevise(quote)}
                className="h-8 gap-1.5 text-xs"
              >
                <FileEdit className="h-3.5 w-3.5" />
                Revise (v{(quote.version || 1) + 1})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? 'Generating…' : 'Download PDF'}
            </Button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* A4 Sheet Container */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-6 flex justify-center">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Loading quotation document…
            </div>
          ) : !quote ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Quotation not found.
            </div>
          ) : (
            <div
              id="quotation-print-area"
              className="w-full max-w-[800px] bg-white text-gray-900 shadow-xl border border-gray-200 rounded-lg p-8 space-y-6 text-xs font-sans print:shadow-none print:border-none print:m-0 print:p-0"
            >
              {/* Top Accent Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-primary to-blue-700 -mt-8 -mx-8 mb-6" />

              {/* 1. Header: Branding & Contacts */}
              <div className="flex items-start justify-between border-b border-gray-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-xl shadow-md">
                    ☀️
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-blue-950 font-serif">
                      {company?.company_name || 'SUNBEAM SOLAR'}
                    </h1>
                    <p className="text-[11px] text-gray-600 italic">
                      {company?.tagline || 'Powering a Greener Tomorrow'}
                    </p>
                    {company?.credential_line && (
                      <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                        {company?.credential_line}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                  {company?.phone && <p>Tel: {company.phone}</p>}
                  {company?.email && <p>Email: {company.email}</p>}
                  {company?.website && <p>Web: {company.website}</p>}
                  {company?.gst_number && (
                    <p className="font-semibold text-gray-800">GSTIN: {company.gst_number}</p>
                  )}
                </div>
              </div>

              {/* Title Strip */}
              <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded border border-gray-200">
                <span className="font-bold text-blue-950 text-xs tracking-wider uppercase">
                  Commercial & Technical Rooftop Solar Proposal
                </span>
                <span className="font-bold text-[11px] text-blue-800 font-mono">
                  [ {quote.status.toUpperCase()} ]
                </span>
              </div>

              {/* Customer & Quote Details Box */}
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="border border-gray-300 rounded-lg p-3.5 space-y-1.5 bg-gray-50/50">
                  <p className="font-bold text-[10px] text-blue-900 uppercase tracking-wider border-b border-gray-200 pb-1">
                    Customer & Installation Site
                  </p>
                  <p className="font-bold text-sm text-gray-900">{quote.lead?.customer_name}</p>
                  <p className="text-gray-600">Phone: {quote.lead?.phone}</p>
                  {quote.lead?.email && <p className="text-gray-600">Email: {quote.lead.email}</p>}
                  <p className="text-gray-600">
                    Address:{' '}
                    {[quote.lead?.address, quote.lead?.area, quote.lead?.city, quote.lead?.pincode ? `PIN: ${quote.lead.pincode}` : null]
                      .filter(Boolean)
                      .join(', ') || 'On record'}
                  </p>
                </div>

                {/* Quotation Details */}
                <div className="border border-gray-300 rounded-lg p-3.5 space-y-1.5 bg-gray-50/50">
                  <p className="font-bold text-[10px] text-blue-900 uppercase tracking-wider border-b border-gray-200 pb-1">
                    Quotation Information
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className="text-gray-600">Quotation No:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {quote.quotation_number} (Rev {quote.version})
                    </span>
                    <span className="text-gray-600">Issue Date:</span>
                    <span>{formatDate(quote.created_at)}</span>
                    <span className="text-gray-600">Valid Until:</span>
                    <span className="font-semibold text-gray-800">{formatDate(quote.valid_until)}</span>
                    <span className="text-gray-600">Capacity / Type:</span>
                    <span className="font-bold text-amber-700">
                      {quote.system_capacity_kw} kWp ({quote.phase || '3-Phase'} {quote.system_type || 'On-Grid'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill of Materials (BOM) Table */}
              <div className="space-y-2">
                <p className="font-bold text-xs text-blue-950 uppercase tracking-wider">
                  Bill of Materials & Scope of Supply
                </p>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-blue-950 text-white font-semibold">
                      <tr>
                        <th className="py-2 px-2.5 w-6">#</th>
                        <th className="py-2 px-2.5">Component & Specification</th>
                        <th className="py-2 px-2.5 w-24">Category</th>
                        <th className="py-2 px-2.5 w-16 text-center">Qty</th>
                        <th className="py-2 px-2.5 w-24 text-right">Rate (₹)</th>
                        <th className="py-2 px-2.5 w-24 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(quote.items || []).map((item: any, idx: number) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                        >
                          <td className="py-1.5 px-2.5 text-gray-500">{idx + 1}</td>
                          <td className="py-1.5 px-2.5">
                            <span className="font-bold text-gray-900">{item.component_name}</span>
                            {item.specifications && (
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.specifications}</p>
                            )}
                          </td>
                          <td className="py-1.5 px-2.5 text-gray-600 capitalize">
                            {item.component_type.replace('_', ' ')}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono">
                            {formatInr(item.unit_price).replace('₹', '')}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-gray-900">
                            {formatInr(item.total_price).replace('₹', '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warranties & Financial Breakdown */}
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Warranties Left Box (7 cols) */}
                <div className="col-span-7 border border-gray-300 rounded-lg p-3.5 space-y-2 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 font-bold text-[10px] text-blue-900 uppercase tracking-wider border-b border-gray-200 pb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Warranties & Technical Guarantee
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-700">
                    <p>• Solar PV Modules: {company.performance_warranty_years || 25}-Year Linear Performance Guarantee</p>
                    <p>• Solar Inverter: {company.inverter_warranty_years || 5}-Year Comprehensive Manufacturer Warranty</p>
                    <p>• Installation & Workmanship: {company.product_warranty_years || 10}-Year EPC Warranty</p>
                    {quote.warranty_terms && (
                      <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-200 pt-1">
                        {quote.warranty_terms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Calculation Table Right Box (5 cols) */}
                <div className="col-span-5 border border-gray-300 rounded-lg p-3 space-y-1.5 bg-gray-50/70">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatInr(quote.subtotal)}</span>
                  </div>
                  {quote.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">- {formatInr(quote.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                    <span>Taxable Value:</span>
                    <span className="font-mono">{formatInr(quote.taxable_value)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[10px]">
                    <span>GST ({quote.gst_rate}%):</span>
                    <span className="font-mono">{formatInr(quote.tax_amount)}</span>
                  </div>
                  {quote.kseb_charges > 0 && (
                    <div className="flex justify-between text-gray-600 text-[10px]">
                      <span>KSEB/DISCOM Charges:</span>
                      <span className="font-mono">{formatInr(quote.kseb_charges)}</span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="bg-blue-950 text-white rounded p-2 mt-2 flex justify-between items-baseline font-bold">
                    <span className="text-[11px] uppercase tracking-wider">Grand Total:</span>
                    <span className="text-sm font-mono">{formatInr(quote.total_amount)}</span>
                  </div>

                  {/* Advance Split */}
                  <div className="flex justify-between text-[10px] text-blue-900 font-semibold pt-1">
                    <span>Advance ({quote.advance_percentage}%): {formatInr(quote.advance_amount)}</span>
                    <span>Balance: {formatInr(quote.balance_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details Card (Authorized Quotation Context) */}
              {bank && (
                <div className="border border-emerald-300 bg-emerald-50/60 rounded-lg p-3 flex items-center justify-between">
                  <div className="space-y-0.5 text-[11px] text-emerald-950">
                    <p className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">
                      Official Bank Payment Account
                    </p>
                    <p>
                      <strong>Bank:</strong> {bank.bank_name} | <strong>A/C Holder:</strong> {bank.account_holder_name}
                    </p>
                    <p className="font-mono">
                      <strong>A/C No:</strong> {bank.account_number} | <strong>IFSC:</strong> {bank.ifsc_code}
                      {bank.branch_name ? ` | Branch: ${bank.branch_name}` : ''}
                      {bank.upi_id ? ` | UPI: ${bank.upi_id}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBankDetails}
                    className="h-7 gap-1 text-[10px] bg-white text-emerald-800 border-emerald-300"
                  >
                    {copiedBank ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedBank ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}

              {/* Terms & Authorized Signature */}
              <div className="grid grid-cols-12 gap-4 pt-2">
                <div className="col-span-8 text-[10px] text-gray-500 space-y-1">
                  <p className="font-bold text-gray-700">Terms & Conditions:</p>
                  <p className="whitespace-pre-line leading-relaxed">
                    {company?.terms_and_conditions ||
                      '1. Payment: 20% advance with work order, 80% balance upon material delivery & inspection.\n2. Grid-tied net metering feasibility approval is subject to DISCOM guidelines.\n3. Quotation valid for 30 days from date of issue.'}
                  </p>
                </div>

                <div className="col-span-4 border border-gray-300 rounded-lg p-3 flex flex-col justify-between text-center bg-gray-50/30 min-h-[85px]">
                  <p className="text-[10px] text-gray-600 font-semibold">
                    For {company?.company_name || 'Sunbeam Solar'}
                  </p>
                  <div className="border-t border-gray-400 pt-1 mt-6">
                    <p className="font-bold text-[11px] text-gray-900">
                      {quote.authorized_signature_name || 'Authorized Signatory'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Footer: Configured Office Locations (Min 1, Max 6) */}
              <div className="border-t border-gray-300 pt-3 mt-6 text-[9.5px] text-gray-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {offices.map((office: any, oIndex: number) => (
                    <div key={oIndex} className="space-y-0.5">
                      <p className="font-bold text-blue-900">{office.office_name}</p>
                      <p className="leading-tight text-gray-600">
                        {office.address}, {office.city} - {office.pincode}
                        {office.phone ? ` • Tel: ${office.phone}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-center text-[9px] text-gray-400 pt-3 border-t border-gray-200 mt-2">
                  Solar Quotation Document Generated by {company?.company_name || 'Solar CRM'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
