import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  FileCheck,
  FileText,
  Info,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { CreateQuotationItemInput, Quotation } from '@solar-crm/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCompanySettings,
  useCreateQuotation,
  useDefaultBOMComponents,
  useReviseQuotation,
  useUpdateQuotation,
  useUpdateQuotationStatus,
} from '../hooks/use-quotations';
import {
  type SubsidyFinancingConfig,
  DEFAULT_SUBSIDY_FINANCING_CONFIG,
  calculateSubsidyAndFinancing,
} from '../utils/solar-subsidy-calc';
import { SubsidyFinancingCard } from './SubsidyFinancingCard';

interface QuotationBuilderModalProps {
  lead: {
    id: string;
    customer_name: string;
    phone: string;
    email?: string | null | undefined;
    address?: string | null | undefined;
    area?: string | null | undefined;
    city?: string | null | undefined;
    pincode?: string | null | undefined;
  };
  initialQuotation?: Quotation | null | undefined;
  mode?: 'create' | 'edit' | 'revise' | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ((quotation: Quotation) => void) | undefined;
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function formatInr(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

export function QuotationBuilderModal({
  lead,
  initialQuotation,
  mode = 'create',
  isOpen,
  onClose,
  onSuccess,
}: QuotationBuilderModalProps) {
  const { data: companySettings } = useCompanySettings();
  const { data: defaultComponents } = useDefaultBOMComponents();

  const createQuoteMutation = useCreateQuotation();
  const updateQuoteMutation = useUpdateQuotation(initialQuotation?.id || '');
  const reviseQuoteMutation = useReviseQuotation(initialQuotation?.id || '');
  const updateStatusMutation = useUpdateQuotationStatus(initialQuotation?.id || '');

  // Form states
  const [title, setTitle] = useState('');
  const [systemCapacityKw, setSystemCapacityKw] = useState<number>(5.0);
  const [phase, setPhase] = useState('3-Phase');
  const [systemType, setSystemType] = useState('On-Grid');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(13.8);
  const [ksebCharges, setKsebCharges] = useState<number>(0);
  const [advancePercentage, setAdvancePercentage] = useState<number>(20);
  const [validUntil, setValidUntil] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [warrantyTerms, setWarrantyTerms] = useState<string>('');
  const [exclusions, setExclusions] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [authorizedSignatureName, setAuthorizedSignatureName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subsidyConfig, setSubsidyConfig] = useState<SubsidyFinancingConfig>(
    DEFAULT_SUBSIDY_FINANCING_CONFIG,
  );

  // Line items state
  const [items, setItems] = useState<CreateQuotationItemInput[]>([]);

  // Initialize or populate form
  useEffect(() => {
    if (!isOpen) return;

    if (initialQuotation) {
      setTitle(initialQuotation.title || `Solar Rooftop ${initialQuotation.system_capacity_kw || 5}kW System`);
      setSystemCapacityKw(initialQuotation.system_capacity_kw || 5.0);
      setPhase(initialQuotation.phase || '3-Phase');
      setSystemType(initialQuotation.system_type || 'On-Grid');
      setDiscountAmount(initialQuotation.discount_amount || 0);
      setGstRate(initialQuotation.gst_rate || 13.8);
      setKsebCharges(initialQuotation.kseb_charges || 0);
      setAdvancePercentage(initialQuotation.advance_percentage || 20);
      setValidUntil(initialQuotation.valid_until ? initialQuotation.valid_until.slice(0, 10) : '');
      setPaymentTerms(initialQuotation.payment_terms || '');
      setWarrantyTerms(initialQuotation.warranty_terms || '');
      setExclusions(initialQuotation.exclusions || '');
      setNotes(initialQuotation.notes || '');
      setAuthorizedSignatureName(initialQuotation.authorized_signature_name || 'Project Director');

      if (Array.isArray(initialQuotation.items) && initialQuotation.items.length > 0) {
        setItems(
          initialQuotation.items.map((it, idx) => ({
            id: it.id,
            component_name: it.component_name,
            component_type: it.component_type as any,
            description: it.description || '',
            specifications: it.specifications || '',
            quantity: Number(it.quantity),
            unit: it.unit || 'Nos',
            unit_price: Number(it.unit_price),
            sort_order: it.sort_order ?? idx,
            is_optional: Boolean(it.is_optional),
            tax_rate: Number(it.tax_rate || 0),
          })),
        );
      }
    } else {
      // Default new quotation
      setTitle(`Solar Rooftop 5.00 kWp On-Grid Proposal`);
      setSystemCapacityKw(5.0);
      setPhase('3-Phase');
      setSystemType('On-Grid');
      setDiscountAmount(0);
      setGstRate(companySettings?.tax_rate || 13.8);
      setKsebCharges(companySettings?.kseb_charges || 2500);
      setAdvancePercentage(20);
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setValidUntil(in30Days);
      setPaymentTerms('20% advance with work order, 80% balance upon material delivery & inspection.');
      setWarrantyTerms(
        `• Solar Modules: ${companySettings?.performance_warranty_years || 25}-Year Performance Warranty\n• Inverter: ${companySettings?.inverter_warranty_years || 5}-Year Warranty\n• Workmanship: ${companySettings?.product_warranty_years || 10}-Year Warranty`,
      );
      setExclusions('Civil roof reinforcement, AC power cabling exceeding 50m, battery storage unless opted.');
      setNotes('Project timeline: 10-14 working days from DISCOM feasibility approval.');
      setAuthorizedSignatureName('Authorized Technical Manager');

      // Seed preloaded components
      loadDefaultComponents(5.0);
    }
  }, [isOpen, initialQuotation, companySettings]);

  // Preload standard components
  const loadDefaultComponents = (capacity: number = 5.0) => {
    if (defaultComponents && defaultComponents.length > 0) {
      const seeded = defaultComponents.map((c, index) => {
        let qty = 1;
        let unitPrice = c.default_unit_price;

        // Auto-scale panel count and cabling based on capacity
        if (c.component_type === 'solar_panel') {
          qty = Math.max(1, Math.round((capacity * 1000) / 540)); // 540W modules
          unitPrice = 14500;
        } else if (c.name.includes('DC Solar Cables')) {
          qty = Math.round(capacity * 8); // 8m per kW
        } else if (c.name.includes('AC Cables')) {
          qty = 25;
        } else if (c.name.includes('Earthing')) {
          qty = 3;
        }

        return {
          component_name: c.name,
          component_type: c.component_type as any,
          description: c.description || '',
          specifications: c.description || '',
          quantity: qty,
          unit: c.default_unit || 'Nos',
          unit_price: unitPrice,
          sort_order: index + 1,
          is_optional: false,
          tax_rate: 0,
        };
      });
      setItems(seeded);
    }
  };

  // Add blank row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        component_name: 'Custom Solar Equipment',
        component_type: 'other',
        description: '',
        specifications: '',
        quantity: 1,
        unit: 'Set',
        unit_price: 5000,
        sort_order: prev.length + 1,
        is_optional: false,
        tax_rate: 0,
      },
    ]);
  };

  // Update item field
  const handleUpdateItem = (index: number, field: keyof CreateQuotationItemInput, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value } as CreateQuotationItemInput;
      return copy;
    });
  };

  // Delete item row
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('Quotation must contain at least 1 line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Real-time calculations (pure & decimal-safe)
  const calc = useMemo(() => {
    let subtotal = 0;
    for (const item of items) {
      if (!item.is_optional) {
        const lineTotal = round2((item.quantity || 0) * (item.unit_price || 0));
        subtotal = round2(subtotal + lineTotal);
      }
    }

    const discount = Math.min(subtotal, Math.max(0, round2(discountAmount || 0)));
    const taxableValue = round2(subtotal - discount);
    const tax = round2((taxableValue * (gstRate || 0)) / 100);
    const cgst = round2(tax / 2);
    const sgst = round2(tax - cgst);
    const kseb = Math.max(0, round2(ksebCharges || 0));
    const total = round2(taxableValue + tax + kseb);

    const advPct = Math.min(100, Math.max(0, advancePercentage || 20));
    const advance = round2((total * advPct) / 100);
    const balance = round2(total - advance);

    return {
      subtotal,
      discount,
      taxableValue,
      tax,
      cgst,
      sgst,
      kseb,
      total,
      advance,
      balance,
    };
  }, [items, discountAmount, gstRate, ksebCharges, advancePercentage]);

  // Real-time PM Surya Ghar Subsidy & Loan EMI Feasibility Result
  const subsidyResult = useMemo(() => {
    return calculateSubsidyAndFinancing(calc.total, Number(systemCapacityKw || 0), subsidyConfig);
  }, [calc.total, systemCapacityKw, subsidyConfig]);

  // Handle Submit (Draft or Issue)
  const handleSubmit = async (targetStatus: 'draft' | 'issued' = 'draft') => {
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Please include at least one Bill of Materials line item.');
      return;
    }

    try {
      // Build subsidy summary note
      let combinedNotes = (notes || '').trim();
      if (subsidyConfig.enableSubsidy || subsidyConfig.enableLoan) {
        const subsidyInfo = [
          '--- [PM SURYA GHAR & SOLAR FINANCING FEASIBILITY] ---',
          `• Central MNRE Subsidy: ₹${subsidyResult.centralSubsidy.toLocaleString('en-IN')}`,
          subsidyResult.stateSubsidy > 0 ? `• State / DISCOM Subsidy: ₹${subsidyResult.stateSubsidy.toLocaleString('en-IN')}` : null,
          `• Net Customer Investment: ₹${subsidyResult.netCustomerPayable.toLocaleString('en-IN')} (Gross: ₹${subsidyResult.grossAmount.toLocaleString('en-IN')})`,
          `• Est. Generation: ~${subsidyResult.monthlyUnitsGenerated} units/mo (Monthly Savings: +₹${subsidyResult.monthlyElectricitySavings.toLocaleString('en-IN')}/mo)`,
          subsidyConfig.enableLoan ? `• Green Loan EMI: ₹${subsidyResult.monthlyEmi.toLocaleString('en-IN')}/mo (${subsidyConfig.loanTenorYears}Y @ ${subsidyConfig.loanInterestRatePercent}% p.a.)` : null,
          subsidyConfig.enableLoan ? `• Net Monthly Cashflow: ${subsidyResult.monthlyNetCashflow >= 0 ? '+' : ''}₹${subsidyResult.monthlyNetCashflow.toLocaleString('en-IN')}/mo` : null,
          `• Simple Payback Period: ${subsidyResult.simplePaybackYears} Years`,
        ]
          .filter(Boolean)
          .join('\n');

        if (!combinedNotes.includes('PM SURYA GHAR & SOLAR FINANCING FEASIBILITY')) {
          combinedNotes = combinedNotes ? `${combinedNotes}\n\n${subsidyInfo}` : subsidyInfo;
        }
      }

      const payload: any = {
        lead_id: lead.id,
        title: title || `Solar Rooftop ${systemCapacityKw}kW System`,
        system_capacity_kw: Number(systemCapacityKw),
        phase,
        system_type: systemType,
        discount_amount: Number(discountAmount || 0),
        gst_rate: Number(gstRate || 13.8),
        kseb_charges: Number(ksebCharges || 0),
        advance_percentage: Number(advancePercentage || 20),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        payment_terms: paymentTerms,
        warranty_terms: warrantyTerms,
        exclusions,
        notes: combinedNotes,
        authorized_signature_name: authorizedSignatureName,
        items: items.map((it, idx) => ({
          component_name: it.component_name,
          component_type: it.component_type,
          description: it.description,
          specifications: it.specifications,
          quantity: Number(it.quantity),
          unit: it.unit,
          unit_price: Number(it.unit_price),
          sort_order: idx + 1,
          is_optional: Boolean(it.is_optional),
        })),
      };

      let resultQuote: Quotation;

      if (mode === 'revise' && initialQuotation) {
        resultQuote = await reviseQuoteMutation.mutateAsync({
          notes,
          changes: payload,
        });
      } else if (mode === 'edit' && initialQuotation) {
        resultQuote = await updateQuoteMutation.mutateAsync(payload);
      } else {
        resultQuote = await createQuoteMutation.mutateAsync(payload);
      }

      // If user chose to directly issue quotation
      if (targetStatus === 'issued' && resultQuote.id) {
        await updateStatusMutation.mutateAsync({ status: 'issued' });
        resultQuote.status = 'issued';
      }

      if (onSuccess) onSuccess(resultQuote);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quotation');
    }
  };

  if (!isOpen) return null;

  const isSaving =
    createQuoteMutation.isPending ||
    updateQuoteMutation.isPending ||
    reviseQuoteMutation.isPending ||
    updateStatusMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-6xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {mode === 'revise'
                    ? `Revise Quotation — ${initialQuotation?.quotation_number} (v${(initialQuotation?.version || 1) + 1})`
                    : mode === 'edit'
                      ? `Edit Draft Quotation — ${initialQuotation?.quotation_number}`
                      : 'Commercial Quotation Builder'}
                </h2>
                {mode === 'revise' && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Creates New Revision
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Customer: <span className="font-semibold text-foreground">{lead.customer_name}</span> ({lead.phone})
                {lead.area ? ` • ${lead.area}, ${lead.city || ''} (PIN: ${lead.pincode || '—'})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-destructive/15 border-b border-destructive/30 px-6 py-3 flex items-center gap-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Row: System Specs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/15 p-4 rounded-xl border border-border">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Proposal Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5kW On-Grid Rooftop Solar Proposal"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Capacity (kWp) *</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1000"
                  value={systemCapacityKw}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSystemCapacityKw(val);
                  }}
                  className="h-9 text-xs pr-10"
                />
                <span className="absolute right-3 top-2 text-[10px] text-muted-foreground font-bold">kW</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Phase & System Type</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="h-9 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="1-Phase">1-Phase</option>
                  <option value="3-Phase">3-Phase</option>
                </select>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="h-9 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="On-Grid">On-Grid</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Off-Grid">Off-Grid</option>
                </select>
              </div>
            </div>
          </div>

          {/* BOM Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Bill of Materials (BOM) & Equipment</h3>
                <span className="text-xs text-muted-foreground">({items.length} items)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadDefaultComponents(systemCapacityKw)}
                  className="h-8 gap-1.5 text-xs border-dashed"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reload 12 Defaults
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Custom Line
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold sticky top-0 z-10 border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Component Name</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Category</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Technical Specifications</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-20">Unit</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                      <th className="py-2.5 px-3 w-10 text-center">Opt</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => {
                      const lineTotal = round2((item.quantity || 0) * (item.unit_price || 0));
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-muted/20 transition-colors ${item.is_optional ? 'opacity-60 bg-muted/10' : ''}`}
                        >
                          <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.component_name}
                              onChange={(e) => handleUpdateItem(idx, 'component_name', e.target.value)}
                              className="h-7 text-xs font-medium"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.component_type}
                              onChange={(e) => handleUpdateItem(idx, 'component_type', e.target.value)}
                              className="h-7 text-xs rounded-md border border-input bg-background px-1.5 w-full"
                            >
                              <option value="solar_panel">Solar Panel</option>
                              <option value="inverter">Inverter</option>
                              <option value="structure">Structure</option>
                              <option value="bos">BOS / Cables</option>
                              <option value="battery">Battery</option>
                              <option value="net_metering">Net Metering</option>
                              <option value="installation">Installation</option>
                              <option value="other">Other</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.specifications || ''}
                              onChange={(e) => handleUpdateItem(idx, 'specifications', e.target.value)}
                              placeholder="e.g. 540Wp Mono PERC TopCon"
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              min="0.1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs text-right font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                            {formatInr(lineTotal)}
                          </td>
                          <td className="py-2 px-3 text-center" title="Mark as optional add-on">
                            <input
                              type="checkbox"
                              checked={Boolean(item.is_optional)}
                              onChange={(e) => handleUpdateItem(idx, 'is_optional', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. Government Subsidy & Clean Energy Loan Feasibility Card */}
          <SubsidyFinancingCard
            result={subsidyResult}
            config={subsidyConfig}
            onChangeConfig={(updates) => setSubsidyConfig((prev) => ({ ...prev, ...updates }))}
          />

          {/* Bottom Grid: Warranties, Terms & Totals Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Warranties, Terms, Notes (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Warranties & Technical Guarantee
                </div>
                <textarea
                  rows={3}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  placeholder="Module warranty, inverter warranty, system workmanship guarantee..."
                  className="w-full text-xs rounded-lg border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Scope Exclusions</label>
                  <textarea
                    rows={2}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder="Civil modifications, grid lines > 50m..."
                    className="w-full text-xs rounded-lg border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Payment Terms & Milestones</label>
                  <textarea
                    rows={2}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Advance %, balance payment stages..."
                    className="w-full text-xs rounded-lg border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Valid Until Date</label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Authorized Signatory Name</label>
                  <Input
                    value={authorizedSignatureName}
                    onChange={(e) => setAuthorizedSignatureName(e.target.value)}
                    placeholder="e.g. Authorized Technical Manager"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Authoritative Financial Totals (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-foreground">Commercial Summary</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  INR Pricing
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal (Equipment Sum)</span>
                  <span className="font-mono font-semibold text-foreground">{formatInr(calc.subtotal)}</span>
                </div>

                {/* Discount Input */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground">Project Discount (₹)</span>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="500"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right font-mono"
                    />
                  </div>
                </div>

                {/* Taxable Value */}
                <div className="flex justify-between items-center font-semibold pt-1 border-t border-border/50 text-foreground">
                  <span>Taxable Value</span>
                  <span className="font-mono">{formatInr(calc.taxableValue)}</span>
                </div>

                {/* GST Rate */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Composite GST</span>
                    <span className="text-[10px] text-muted-foreground">({gstRate}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={gstRate}
                        onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs text-right font-mono"
                      />
                    </div>
                    <span className="font-mono text-muted-foreground text-[11px] w-24 text-right">
                      {formatInr(calc.tax)}
                    </span>
                  </div>
                </div>

                {/* CGST / SGST breakdown */}
                <div className="flex justify-between items-center text-[10px] text-muted-foreground pl-3">
                  <span>• CGST ({round2(gstRate / 2)}%): {formatInr(calc.cgst)}</span>
                  <span>• SGST ({round2(gstRate / 2)}%): {formatInr(calc.sgst)}</span>
                </div>

                {/* KSEB / DISCOM Charges */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground">KSEB/DISCOM Statutory Fee</span>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={ksebCharges}
                      onChange={(e) => setKsebCharges(parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-right font-mono"
                    />
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="rounded-xl bg-gradient-to-r from-primary to-primary/90 p-4 text-primary-foreground shadow-lg mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Grand Total</span>
                    <span className="text-xl font-extrabold tracking-tight font-mono">{formatInr(calc.total)}</span>
                  </div>
                  <p className="text-[10px] opacity-80 mt-1">Inclusive of GST, installation, and liaisoning</p>
                </div>

                {/* Advance & Balance Split */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span>Advance ({advancePercentage}%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={advancePercentage}
                        onChange={(e) => setAdvancePercentage(parseFloat(e.target.value) || 20)}
                        className="w-10 h-5 text-[10px] text-right rounded border border-border px-1"
                      />
                    </div>
                    <p className="font-mono font-bold text-foreground">{formatInr(calc.advance)}</p>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
                    <p className="text-muted-foreground mb-1">Balance ({100 - advancePercentage}%)</p>
                    <p className="font-mono font-bold text-foreground">{formatInr(calc.balance)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('draft')}
              disabled={isSaving}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSubmit('issued')}
              disabled={isSaving}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <FileCheck className="h-4 w-4" />
              {isSaving ? 'Processing…' : 'Issue Official Quotation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
