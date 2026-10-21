import PDFDocument from 'pdfkit';

export interface QuotationPdfData {
  quotation: {
    id: string;
    quotation_number: string;
    version: number;
    title: string;
    status: string;
    system_capacity_kw: number;
    phase?: string | null;
    system_type?: string | null;
    subtotal: number;
    discount_amount: number;
    taxable_value: number;
    gst_rate: number;
    tax_amount: number;
    kseb_charges: number;
    total_amount: number;
    advance_percentage: number;
    advance_amount: number;
    balance_amount: number;
    valid_until?: string | null;
    payment_terms?: string | null;
    warranty_terms?: string | null;
    exclusions?: string | null;
    notes?: string | null;
    authorized_signature_name?: string | null;
    created_at: string;
  };
  items: Array<{
    component_name: string;
    component_type: string;
    description?: string | null;
    specifications?: string | null;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    sort_order: number;
    is_optional?: boolean;
  }>;
  lead: {
    customer_name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    area?: string | null;
    pincode?: string | null;
  };
  company: {
    company_name: string;
    legal_name?: string | null;
    tagline?: string | null;
    credential_line?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    product_warranty_years?: number;
    performance_warranty_years?: number;
    inverter_warranty_years?: number;
    battery_warranty_years?: number;
    terms_and_conditions?: string | null;
  };
  offices: Array<{
    office_name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string | null;
  }>;
  bankAccount?: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    branch_name?: string | null;
    upi_id?: string | null;
  } | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount).replace('₹', 'Rs. ');
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates an authoritative, professional A4 Solar Quotation PDF.
 * Returns a Promise<Buffer>.
 */
export async function generateQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Solar Proposal - ${data.quotation.quotation_number} v${data.quotation.version}`,
        Author: data.company.company_name || 'Sunbeam Solar',
        Subject: `Solar PV Rooftop Quotation for ${data.lead.customer_name}`,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width; // 595.28 pt for A4
    const contentWidth = pageWidth - 80; // 515.28 pt
    const leftMargin = 40;

    // ─── Header: Company Branding ──────────────────────────────────────────
    doc.save();
    // Accent top bar
    doc.rect(0, 0, pageWidth, 6).fill('#F59E0B');

    // Solar Brand Icon / Badge
    doc.circle(60, 36, 18).fill('#1E3A8A');
    doc.fillColor('#F59E0B').fontSize(14).text('☀️', 53, 27, { lineBreak: false });

    // Company Name & Tagline
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(18).text(data.company.company_name || 'SUNBEAM SOLAR', 90, 22);
    doc.fillColor('#4B5563').font('Helvetica-Oblique').fontSize(8.5).text(data.company.tagline || 'Powering a Greener Tomorrow', 90, 42);
    if (data.company.credential_line) {
      doc.fillColor('#D97706').font('Helvetica-Bold').fontSize(7.5).text(data.company.credential_line, 90, 53);
    }

    // Company Contacts (Right aligned)
    doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
    let rightY = 22;
    if (data.company.phone) {
      doc.text(`Tel: ${data.company.phone}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 11;
    }
    if (data.company.email) {
      doc.text(`Email: ${data.company.email}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 11;
    }
    if (data.company.website) {
      doc.text(`Web: ${data.company.website}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 11;
    }
    if (data.company.gst_number) {
      doc.text(`GSTIN: ${data.company.gst_number}`, 320, rightY, { width: 235, align: 'right' });
    }

    // Dividing rule
    doc.moveTo(leftMargin, 74).lineTo(leftMargin + contentWidth, 74).lineWidth(1).strokeColor('#E5E7EB').stroke();
    doc.restore();

    // ─── Document Title Banner ────────────────────────────────────────────
    let currentY = 82;
    doc.rect(leftMargin, currentY, contentWidth, 24).fill('#F3F4F6');
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(11).text('COMMERCIAL & TECHNICAL PROPOSAL', leftMargin + 10, currentY + 6);
    
    // Status Badge
    const statusText = (data.quotation.status || 'draft').toUpperCase();
    const statusColor = data.quotation.status === 'issued' ? '#059669' : data.quotation.status === 'sent' ? '#2563EB' : '#D97706';
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8.5).text(`[ ${statusText} ]`, leftMargin + contentWidth - 90, currentY + 7, { width: 80, align: 'right' });
    currentY += 32;

    // ─── Quotation Info & Customer Details (Two Columns) ───────────────────
    const colWidth = (contentWidth - 15) / 2;
    const col1X = leftMargin;
    const col2X = leftMargin + colWidth + 15;

    // Left Column: Customer & Site Details Box
    doc.rect(col1X, currentY, colWidth, 90).lineWidth(0.5).strokeColor('#D1D5DB').stroke();
    doc.rect(col1X, currentY, colWidth, 18).fill('#F8FAFC');
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(8.5).text('CUSTOMER & INSTALLATION SITE', col1X + 8, currentY + 5);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(data.lead.customer_name, col1X + 8, currentY + 24);
    doc.font('Helvetica').fontSize(8).fillColor('#4B5563');
    doc.text(`Phone: ${data.lead.phone}`, col1X + 8, currentY + 38);
    if (data.lead.email) {
      doc.text(`Email: ${data.lead.email}`, col1X + 8, currentY + 49);
    }
    const fullAddress = [data.lead.address, data.lead.area, data.lead.pincode ? `PIN: ${data.lead.pincode}` : null].filter(Boolean).join(', ');
    doc.text(`Site: ${fullAddress || 'Address on file'}`, col1X + 8, currentY + 60, { width: colWidth - 16, height: 26 });

    // Right Column: Quotation Metadata Box
    doc.rect(col2X, currentY, colWidth, 90).lineWidth(0.5).strokeColor('#D1D5DB').stroke();
    doc.rect(col2X, currentY, colWidth, 18).fill('#F8FAFC');
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(8.5).text('QUOTATION DETAILS', col2X + 8, currentY + 5);

    doc.font('Helvetica').fontSize(8).fillColor('#374151');
    doc.text(`Quotation Ref: `, col2X + 8, currentY + 24);
    doc.font('Helvetica-Bold').text(`${data.quotation.quotation_number} (Rev ${data.quotation.version})`, col2X + 80, currentY + 24);

    doc.font('Helvetica').text(`Issue Date: `, col2X + 8, currentY + 36);
    doc.text(`${formatDate(data.quotation.created_at)}`, col2X + 80, currentY + 36);

    doc.text(`Valid Until: `, col2X + 8, currentY + 48);
    doc.text(`${formatDate(data.quotation.valid_until)}`, col2X + 80, currentY + 48);

    doc.text(`System Capacity: `, col2X + 8, currentY + 60);
    doc.font('Helvetica-Bold').fillColor('#D97706').text(`${data.quotation.system_capacity_kw.toFixed(2)} kWp (${data.quotation.phase || '3-Phase'} ${data.quotation.system_type || 'On-Grid'})`, col2X + 80, currentY + 60);

    currentY += 100;

    // ─── Bill of Materials (BOM) Table ─────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1E3A8A').text('BILL OF MATERIALS & SCOPE OF SUPPLY', leftMargin, currentY);
    currentY += 14;

    // Table Header
    const colNameW = 230;
    const colTypeW = 75;
    const colQtyW = 55;
    const colRateW = 75;
    const colTotalW = 80;

    doc.rect(leftMargin, currentY, contentWidth, 18).fill('#1E3A8A');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
    doc.text('#', leftMargin + 6, currentY + 5);
    doc.text('Component / Technical Specification', leftMargin + 20, currentY + 5);
    doc.text('Category', leftMargin + colNameW, currentY + 5);
    doc.text('Qty & Unit', leftMargin + colNameW + colTypeW, currentY + 5, { width: colQtyW, align: 'center' });
    doc.text('Rate (Rs)', leftMargin + colNameW + colTypeW + colQtyW, currentY + 5, { width: colRateW, align: 'right' });
    doc.text('Amount (Rs)', leftMargin + colNameW + colTypeW + colQtyW + colRateW, currentY + 5, { width: colTotalW - 6, align: 'right' });
    currentY += 18;

    // Table Rows
    doc.font('Helvetica').fontSize(7.5);
    (data.items || []).forEach((item, index) => {
      // Check for page overflow
      if (currentY > 700) {
        doc.addPage();
        currentY = 40;
      }

      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      const rowHeight = item.specifications ? 26 : 18;
      doc.rect(leftMargin, currentY, contentWidth, rowHeight).fill(rowBg);

      doc.fillColor('#4B5563').text(`${index + 1}`, leftMargin + 6, currentY + 4);
      doc.fillColor('#111827').font('Helvetica-Bold').text(item.component_name, leftMargin + 20, currentY + 4, { width: colNameW - 24 });
      if (item.specifications) {
        doc.fillColor('#6B7280').font('Helvetica').fontSize(6.5).text(item.specifications, leftMargin + 20, currentY + 13, { width: colNameW - 24, height: 11 });
        doc.fontSize(7.5);
      }

      doc.fillColor('#4B5563').font('Helvetica').text(item.component_type.replace('_', ' '), leftMargin + colNameW, currentY + 4);
      doc.text(`${item.quantity} ${item.unit}`, leftMargin + colNameW + colTypeW, currentY + 4, { width: colQtyW, align: 'center' });
      doc.text(formatCurrency(item.unit_price).replace('Rs. ', ''), leftMargin + colNameW + colTypeW + colQtyW, currentY + 4, { width: colRateW, align: 'right' });
      doc.fillColor('#111827').font('Helvetica-Bold').text(formatCurrency(item.total_price).replace('Rs. ', ''), leftMargin + colNameW + colTypeW + colQtyW + colRateW, currentY + 4, { width: colTotalW - 6, align: 'right' });

      // Bottom light border
      doc.moveTo(leftMargin, currentY + rowHeight).lineTo(leftMargin + contentWidth, currentY + rowHeight).lineWidth(0.25).strokeColor('#E5E7EB').stroke();

      currentY += rowHeight;
    });

    currentY += 8;

    // Check page space for totals block
    if (currentY > 640) {
      doc.addPage();
      currentY = 40;
    }

    // ─── Financial Totals Breakdown & Warranties ───────────────────────────
    const totalsW = 210;
    const totalsX = leftMargin + contentWidth - totalsW;
    const summaryX = leftMargin;
    const summaryW = contentWidth - totalsW - 15;

    // Left Block: Warranties & Scope Commitments
    doc.rect(summaryX, currentY, summaryW, 115).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    doc.rect(summaryX, currentY, summaryW, 18).fill('#F8FAFC');
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(8).text('WARRANTY & PERFORMANCE GUARANTEE', summaryX + 8, currentY + 5);

    let wy = currentY + 24;
    doc.font('Helvetica').fontSize(7.5).fillColor('#374151');
    doc.text(`• Solar PV Modules: ${data.company.performance_warranty_years || 25}-Year Linear Power Output Warranty`, summaryX + 8, wy);
    wy += 11;
    doc.text(`• Solar Inverter: ${data.company.inverter_warranty_years || 5}-Year Comprehensive Manufacturer Warranty`, summaryX + 8, wy);
    wy += 11;
    doc.text(`• System Workmanship & BOS: ${data.company.product_warranty_years || 10}-Year Installation Warranty`, summaryX + 8, wy);
    wy += 11;
    if (data.company.battery_warranty_years && data.quotation.system_type?.toLowerCase().includes('hybrid')) {
      doc.text(`• Battery Bank: ${data.company.battery_warranty_years}-Year Cycle Warranty`, summaryX + 8, wy);
      wy += 11;
    }
    if (data.quotation.warranty_terms) {
      doc.fillColor('#6B7280').text(data.quotation.warranty_terms, summaryX + 8, wy, { width: summaryW - 16, height: 26 });
    }

    // Right Block: Financial Calculation Table
    doc.rect(totalsX, currentY, totalsW, 115).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

    const drawCalcLine = (label: string, value: string, yPos: number, isBold = false, isHighlight = false) => {
      if (isHighlight) {
        doc.rect(totalsX, yPos - 2, totalsW, 16).fill('#1E3A8A');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
      } else {
        doc.fillColor(isBold ? '#111827' : '#4B5563').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
      }
      doc.text(label, totalsX + 8, yPos);
      doc.text(value, totalsX + 8, yPos, { width: totalsW - 16, align: 'right' });
    };

    let ty = currentY + 6;
    drawCalcLine('Subtotal (BOM Sum):', formatCurrency(data.quotation.subtotal), ty);
    ty += 12;
    if (data.quotation.discount_amount > 0) {
      drawCalcLine('Special Project Discount:', `- ${formatCurrency(data.quotation.discount_amount)}`, ty);
      ty += 12;
    }
    drawCalcLine('Taxable Value:', formatCurrency(data.quotation.taxable_value), ty, true);
    ty += 12;
    drawCalcLine(`GST (${data.quotation.gst_rate}%):`, formatCurrency(data.quotation.tax_amount), ty);
    ty += 12;
    if (data.quotation.kseb_charges > 0) {
      drawCalcLine('KSEB/DISCOM Statutory Fee:', formatCurrency(data.quotation.kseb_charges), ty);
      ty += 12;
    }
    // Grand Total Row
    drawCalcLine('GRAND TOTAL:', formatCurrency(data.quotation.total_amount), ty + 3, true, true);
    ty += 22;
    // Payment splits
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(7).text(`Advance (${data.quotation.advance_percentage}%): ${formatCurrency(data.quotation.advance_amount)}`, totalsX + 8, ty);
    doc.text(`Balance (${100 - data.quotation.advance_percentage}%): ${formatCurrency(data.quotation.balance_amount)}`, totalsX + 8, ty + 10);

    currentY += 125;

    // ─── Bank Details & Payment Terms ─────────────────────────────────────
    if (currentY > 660) {
      doc.addPage();
      currentY = 40;
    }

    // Bank Account Card (Authorized Context)
    if (data.bankAccount) {
      doc.rect(leftMargin, currentY, contentWidth, 48).fill('#F0FDF4');
      doc.rect(leftMargin, currentY, contentWidth, 48).lineWidth(0.5).strokeColor('#86EFAC').stroke();

      doc.fillColor('#166534').font('Helvetica-Bold').fontSize(8).text('BANK PAYMENT DETAILS (OFFICIAL ACCOUNT)', leftMargin + 10, currentY + 6);
      doc.font('Helvetica').fontSize(7.5).fillColor('#14532D');
      doc.text(`Bank: ${data.bankAccount.bank_name} | A/C Holder: ${data.bankAccount.account_holder_name}`, leftMargin + 10, currentY + 18);
      doc.font('Helvetica-Bold').text(`A/C No: ${data.bankAccount.account_number} | IFSC: ${data.bankAccount.ifsc_code}`, leftMargin + 10, currentY + 29);
      if (data.bankAccount.branch_name || data.bankAccount.upi_id) {
        doc.font('Helvetica').text(`Branch: ${data.bankAccount.branch_name || 'N/A'}${data.bankAccount.upi_id ? ` | UPI: ${data.bankAccount.upi_id}` : ''}`, leftMargin + 10, currentY + 39);
      }

      currentY += 56;
    }

    // ─── Terms & Signature Block ──────────────────────────────────────────
    if (currentY > 680) {
      doc.addPage();
      currentY = 40;
    }

    const termsW = contentWidth - 170;
    const sigX = leftMargin + termsW + 10;
    const sigW = 160;

    // Terms
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E3A8A').text('TERMS & CONDITIONS:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(6.5).fillColor('#4B5563');
    const terms = data.company.terms_and_conditions || 
      '1. Payment: 20% advance with work order, 80% balance upon material delivery & inspection.\n' +
      '2. Feasibility & Net Metering approval is subject to DISCOM/KSEB statutory guidelines.\n' +
      '3. Rooftop civil structure warranty valid under standard atmospheric load conditions.\n' +
      '4. Quotation remains valid for 30 days from date of issue.';
    doc.text(terms, leftMargin, currentY + 10, { width: termsW, height: 45 });

    // Signature Block
    doc.rect(sigX, currentY, sigW, 58).lineWidth(0.5).strokeColor('#D1D5DB').stroke();
    doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(7).text(`For ${data.company.company_name || 'Sunbeam Solar'}`, sigX + 8, currentY + 6);
    doc.moveTo(sigX + 8, currentY + 40).lineTo(sigX + sigW - 8, currentY + 40).lineWidth(0.5).strokeColor('#9CA3AF').stroke();
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7).text(data.quotation.authorized_signature_name || 'Authorized Signatory', sigX + 8, currentY + 44, { width: sigW - 16, align: 'center' });

    // ─── Multi-page Footers with Configured Office Locations ──────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      // Footer top line
      doc.moveTo(leftMargin, 775).lineTo(leftMargin + contentWidth, 775).lineWidth(0.5).strokeColor('#E5E7EB').stroke();

      // Office details (Render up to 6 offices in 2-3 clean columns)
      const officeCount = Math.min(data.offices.length, 6);
      if (officeCount > 0) {
        const offColW = contentWidth / Math.min(officeCount, 3);
        data.offices.slice(0, 3).forEach((office, oIndex) => {
          const ox = leftMargin + (oIndex * offColW);
          doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(6.5).text(office.office_name, ox, 780, { width: offColW - 10 });
          doc.fillColor('#6B7280').font('Helvetica').fontSize(5.5).text(`${office.address}, ${office.city} - ${office.pincode}${office.phone ? ` | Tel: ${office.phone}` : ''}`, ox, 788, { width: offColW - 10, height: 16 });
        });
      }

      // Page Number
      doc.fillColor('#9CA3AF').font('Helvetica').fontSize(6.5).text(`Page ${i + 1} of ${range.count} • Document Generated by ${data.company.company_name || 'Solar CRM'}`, leftMargin, 810, { width: contentWidth, align: 'center' });
    }

    doc.end();
  });
}
