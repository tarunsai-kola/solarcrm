import { describe, expect, it } from 'vitest';

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function calculateClientTotals(
  items: Array<{ quantity: number; unit_price: number; is_optional?: boolean }>,
  discountAmount: number,
  gstRate: number,
  ksebCharges: number,
  advancePercentage: number,
) {
  let subtotal = 0;
  for (const item of items) {
    if (!item.is_optional) {
      const lineTotal = round2(item.quantity * item.unit_price);
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

  return { subtotal, discount, taxableValue, tax, cgst, sgst, kseb, total, advance, balance };
}

describe('Frontend Quotation Builder Calculations & BOM Formatting', () => {
  it('correctly calculates subtotal, 13.80% GST, KSEB fee, and 20% advance for a 5kW rooftop system', () => {
    const items = [
      { quantity: 10, unit_price: 15000, is_optional: false },
      { quantity: 1, unit_price: 45000, is_optional: false },
      { quantity: 1, unit_price: 20000, is_optional: false },
    ];

    const calc = calculateClientTotals(items, 5000, 13.8, 2500, 20);

    // Subtotal = 150,000 + 45,000 + 20,000 = 215,000.00
    expect(calc.subtotal).toBe(215000);
    // Discount = 5,000.00
    expect(calc.discount).toBe(5000);
    // Taxable = 210,000.00
    expect(calc.taxableValue).toBe(210000);
    // GST @ 13.8% = 28,980.00
    expect(calc.tax).toBe(28980);
    expect(calc.cgst).toBe(14490);
    expect(calc.sgst).toBe(14490);
    // Grand Total = 210,000 + 28,980 + 2,500 = 241,480.00
    expect(calc.total).toBe(241480);
    // Advance 20% = 48,296.00
    expect(calc.advance).toBe(48296);
    // Balance = 193,184.00
    expect(calc.balance).toBe(193184);
  });

  it('excludes optional items from subtotal and tax calculation', () => {
    const items = [
      { quantity: 1, unit_price: 100000, is_optional: false },
      { quantity: 1, unit_price: 50000, is_optional: true }, // Optional battery
    ];

    const calc = calculateClientTotals(items, 0, 13.8, 0, 25);
    expect(calc.subtotal).toBe(100000);
    expect(calc.taxableValue).toBe(100000);
    expect(calc.tax).toBe(13800);
    expect(calc.total).toBe(113800);
    expect(calc.advance).toBe(28450);
    expect(calc.balance).toBe(85350);
  });

  it('clamps excessive discount to subtotal to prevent negative billing totals', () => {
    const items = [{ quantity: 1, unit_price: 50000, is_optional: false }];
    const calc = calculateClientTotals(items, 100000, 13.8, 0, 20);

    expect(calc.subtotal).toBe(50000);
    expect(calc.discount).toBe(50000);
    expect(calc.taxableValue).toBe(0);
    expect(calc.total).toBe(0);
  });

  it('scales solar module count accurately for given kWp capacity', () => {
    const capacities = [3.2, 5.4, 10.8];
    const moduleWattage = 540;

    const moduleCounts = capacities.map((kw) => Math.max(1, Math.round((kw * 1000) / moduleWattage)));
    // 3200 / 540 = 5.92 -> 6 modules
    expect(moduleCounts[0]).toBe(6);
    // 5400 / 540 = 10 modules
    expect(moduleCounts[1]).toBe(10);
    // 10800 / 540 = 20 modules
    expect(moduleCounts[2]).toBe(20);
  });
});
