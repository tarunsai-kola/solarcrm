import { describe, expect, it } from 'vitest';
import { calculateQuotationTotals, round2 } from '../src/services/quotation-calc.js';

describe('Authoritative Quotation Calculation Engine', () => {
  it('correctly rounds decimal numbers using Number.EPSILON to avoid floating-point drift', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(1.004)).toBe(1);
    expect(round2(19.999)).toBe(20);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('calculates standard residential 5 kW rooftop quotation accurately', () => {
    const input = {
      items: [
        {
          component_name: 'Solar PV Modules — Tier-1 Mono PERC/TOPCon Half-Cut',
          component_type: 'solar_panel',
          quantity: 10,
          unit: 'Nos',
          unit_price: 12000,
          sort_order: 1,
        },
        {
          component_name: 'Solar Inverter — Grid-Tied/Hybrid Inverter',
          component_type: 'inverter',
          quantity: 1,
          unit: 'Set',
          unit_price: 45000,
          sort_order: 2,
        },
        {
          component_name: 'Module Mounting Structure — HDG',
          component_type: 'structure',
          quantity: 1,
          unit: 'Set',
          unit_price: 15000,
          sort_order: 3,
        },
        {
          component_name: 'Installation & Commissioning',
          component_type: 'installation',
          quantity: 1,
          unit: 'Job',
          unit_price: 20000,
          sort_order: 4,
        },
      ],
      discount_amount: 10000,
      gst_rate: 13.8,
      kseb_charges: 2500,
      advance_percentage: 20,
    };

    const result = calculateQuotationTotals(input);

    // Subtotal = (10 * 12000) + 45000 + 15000 + 20000 = 120000 + 45000 + 15000 + 20000 = 200,000.00
    expect(result.subtotal).toBe(200000);
    expect(result.discount_amount).toBe(10000);

    // Taxable Value = 200,000 - 10,000 = 190,000.00
    expect(result.taxable_value).toBe(190000);

    // GST @ 13.80% = 190,000 * 0.138 = 26,220.00
    expect(result.tax_amount).toBe(26220);
    // CGST = 13,110.00, SGST = 13,110.00
    expect(result.cgst_amount).toBe(13110);
    expect(result.sgst_amount).toBe(13110);
    expect(result.igst_amount).toBe(26220);

    // KSEB charges = 2500.00
    expect(result.kseb_charges).toBe(2500);

    // Grand Total = 190,000 + 26,220 + 2,500 = 218,720.00
    expect(result.total_amount).toBe(218720);

    // Advance 20% = 218,720 * 0.20 = 43,744.00
    expect(result.advance_amount).toBe(43744);
    // Balance 80% = 218,720 - 43,744 = 174,976.00
    expect(result.balance_amount).toBe(174976);
    expect(result.advance_amount + result.balance_amount).toBe(result.total_amount);
  });

  it('excludes optional items from quotation subtotal and tax calculation', () => {
    const input = {
      items: [
        {
          component_name: 'Core Panel Array',
          component_type: 'solar_panel',
          quantity: 1,
          unit: 'Set',
          unit_price: 100000,
          is_optional: false,
        },
        {
          component_name: 'Optional Battery Backup System',
          component_type: 'battery',
          quantity: 1,
          unit: 'Set',
          unit_price: 80000,
          is_optional: true,
        },
      ],
      discount_amount: 0,
      gst_rate: 12,
      kseb_charges: 0,
      advance_percentage: 25,
    };

    const result = calculateQuotationTotals(input);
    expect(result.subtotal).toBe(100000);
    expect(result.taxable_value).toBe(100000);
    expect(result.tax_amount).toBe(12000);
    expect(result.total_amount).toBe(112000);
    expect(result.advance_amount).toBe(28000);
    expect(result.balance_amount).toBe(84000);
    // Both items are returned, with their flags preserved
    expect(result.items.length).toBe(2);
    expect(result.items[1]?.is_optional).toBe(true);
  });

  it('clamps discount amount so it cannot exceed subtotal and cause negative taxable value', () => {
    const input = {
      items: [
        {
          component_name: 'Small Solar Pump Kit',
          component_type: 'other',
          quantity: 1,
          unit: 'Set',
          unit_price: 50000,
        },
      ],
      discount_amount: 999999, // Intentional excessive client discount
      gst_rate: 13.8,
    };

    const result = calculateQuotationTotals(input);
    expect(result.subtotal).toBe(50000);
    expect(result.discount_amount).toBe(50000); // Clamped to subtotal
    expect(result.taxable_value).toBe(0);
    expect(result.tax_amount).toBe(0);
    expect(result.total_amount).toBe(0);
  });

  it('handles fractional quantities such as cabling meters without rounding error', () => {
    const input = {
      items: [
        {
          component_name: 'DC Solar Cable 4 sq.mm',
          component_type: 'bos',
          quantity: 37.5, // 37.5 meters
          unit: 'Mtr',
          unit_price: 65,
        },
      ],
      discount_amount: 0,
      gst_rate: 18,
    };

    const result = calculateQuotationTotals(input);
    // 37.5 * 65 = 2437.50
    expect(result.subtotal).toBe(2437.5);
    expect(result.items[0]?.total_price).toBe(2437.5);
    // GST @ 18% = 2437.5 * 0.18 = 438.75
    expect(result.tax_amount).toBe(438.75);
    expect(result.total_amount).toBe(2876.25);
  });
});
