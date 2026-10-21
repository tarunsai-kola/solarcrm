import type { QuotationCalculationResult } from '@solar-crm/shared';

/**
 * Decimal-safe rounding to 2 decimal places using Number.EPSILON
 * to avoid IEEE-754 binary floating point precision errors.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export interface QuotationCalculationInput {
  items: Array<{
    id?: string;
    component_name: string;
    component_type: any;
    description?: string | null;
    specifications?: string | null;
    quantity: number;
    unit: string;
    unit_price: number;
    sort_order?: number;
    is_optional?: boolean;
    tax_rate?: number;
  }>;
  discount_amount?: number;
  gst_rate?: number;
  kseb_charges?: number;
  advance_percentage?: number;
}

/**
 * Server-side authoritative calculation engine for solar quotations.
 * Prevents client-side manipulation of financial totals, taxes, discounts, or balance splits.
 */
export function calculateQuotationTotals(input: QuotationCalculationInput): QuotationCalculationResult {
  const gstRate = typeof input.gst_rate === 'number' && !isNaN(input.gst_rate) ? Math.max(0, input.gst_rate) : 13.8;
  const ksebCharges = typeof input.kseb_charges === 'number' && !isNaN(input.kseb_charges) ? Math.max(0, round2(input.kseb_charges)) : 0;
  const advancePercentage = typeof input.advance_percentage === 'number' && !isNaN(input.advance_percentage)
    ? Math.min(100, Math.max(0, input.advance_percentage))
    : 20;

  // Process items safely
  let subtotal = 0;
  const processedItems = (input.items || []).map((item, index) => {
    const qty = Math.max(0, item.quantity || 0);
    const unitPrice = Math.max(0, item.unit_price || 0);
    const totalPrice = round2(qty * unitPrice);
    const isOptional = Boolean(item.is_optional);

    if (!isOptional) {
      subtotal = round2(subtotal + totalPrice);
    }

    return {
      id: item.id,
      component_name: (item.component_name || '').trim(),
      component_type: item.component_type || 'other',
      description: item.description || null,
      specifications: item.specifications || null,
      quantity: qty,
      unit: (item.unit || 'nos').trim(),
      unit_price: round2(unitPrice),
      total_price: totalPrice,
      sort_order: typeof item.sort_order === 'number' ? item.sort_order : index,
      is_optional: isOptional,
      tax_rate: typeof item.tax_rate === 'number' ? round2(item.tax_rate) : 0,
    };
  });

  // Calculate discount - strictly capped at subtotal
  const rawDiscount = typeof input.discount_amount === 'number' && !isNaN(input.discount_amount) ? Math.max(0, input.discount_amount) : 0;
  const discountAmount = Math.min(subtotal, round2(rawDiscount));

  // Taxable Value
  const taxableValue = round2(subtotal - discountAmount);

  // Composite GST (Indian solar composite model, e.g. 13.80% or custom)
  // Split into equal CGST and SGST without 1-paise rounding discrepancies
  const taxAmount = round2((taxableValue * gstRate) / 100);
  const cgstAmount = round2(taxAmount / 2);
  const sgstAmount = round2(taxAmount - cgstAmount);
  const igstAmount = taxAmount;

  // Grand Total = Taxable Value + Tax Amount + KSEB/DISCOM Statutory Charges
  const totalAmount = round2(taxableValue + taxAmount + ksebCharges);

  // Advance and Balance splits
  const advanceAmount = round2((totalAmount * advancePercentage) / 100);
  const balanceAmount = round2(totalAmount - advanceAmount);

  return {
    subtotal,
    discount_amount: discountAmount,
    taxable_value: taxableValue,
    gst_rate: gstRate,
    tax_amount: taxAmount,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    kseb_charges: ksebCharges,
    total_amount: totalAmount,
    advance_percentage: advancePercentage,
    advance_amount: advanceAmount,
    balance_amount: balanceAmount,
    items: processedItems,
  };
}
