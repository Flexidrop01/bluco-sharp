import { PLMetrics, MonthlyPLData } from './metricsToPL';

interface PLExportOptions {
  total: PLMetrics;
  monthly: MonthlyPLData[];
  currency: string;
  period: string;
  accountName?: string;
}

export const exportPLToPDF = async (options: PLExportOptions) => {
  const { total, monthly, currency, period, accountName = 'Amazon Seller Account' } = options;
  
  // Dynamic import to avoid React conflict
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('P&L REPORT - BLUCO ANALYZER', margin, 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(accountName, margin, 28);
  doc.text(`Period: ${period}`, margin, 35);
  doc.text(`Currency: ${currency}`, pageWidth - margin - 30, 35);
  
  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Executive Summary Box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', margin + 5, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Total Income: ${formatCurrency(total.totalIncome)}`, margin + 5, yPos + 18);
  doc.text(`EBITDA: ${formatCurrency(total.ebitda)} (${formatPercent(total.ebitdaPercent)})`, pageWidth / 2 + 5, yPos + 18);
  doc.text(`Total Expenses: ${formatCurrency(total.totalExpenses)}`, margin + 5, yPos + 28);
  doc.text(`Net Profit: ${formatCurrency(total.netProfit)} (${formatPercent(total.netProfitPercent)})`, pageWidth / 2 + 5, yPos + 28);
  
  yPos += 45;

  // FBA vs FBM Comparison
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FBA vs FBM BREAKDOWN', margin, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'FBA', 'FBM']],
    body: [
      ['Total Revenue', formatCurrency(total.fba.totalRevenue), formatCurrency(total.fbm.totalRevenue)],
      ['Taxable Income', formatCurrency(total.fba.taxableIncome), formatCurrency(total.fbm.taxableIncome)],
      ['Tax Income', formatCurrency(total.fba.taxIncome), formatCurrency(total.fbm.taxIncome)],
      ['Refunds', formatCurrency(-total.fba.refunds), formatCurrency(-total.fbm.refunds)],
      ['Refund Rate / % Total', formatPercent(total.fba.refundRate), formatPercent(total.fbm.percentOfTotal)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Sales Revenue Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES REVENUE', margin, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: [
      ['TOTAL INCOME', formatCurrency(total.totalIncome)],
      ['Excluding Taxes', formatCurrency(total.excludingTaxes)],
      ['FBA Sales', formatCurrency(total.fba.totalRevenue)],
      ['FBM Sales', formatCurrency(total.fbm.totalRevenue)],
      ['Shipping Credits', formatCurrency(total.otherIncome.shippingCredits)],
      ['Gift Wrap Credits', formatCurrency(total.otherIncome.giftWrapCredits)],
      ['Promotional Rebates', formatCurrency(-total.otherIncome.promotionalRebates)],
      ['Reimbursements', formatCurrency(total.otherIncome.reimbursements.total)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Expenses Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPENSES', margin, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: [
      ['TOTAL EXPENSES', formatCurrency(-total.totalExpenses)],
      ['Expenses per Sale', formatCurrency(-total.expensesPerSale)],
      ['Sales Commissions', formatCurrency(-total.salesCommissions.total)],
      ['  - FBA Commission', formatCurrency(-total.salesCommissions.fba)],
      ['  - FBM Commission', formatCurrency(-total.salesCommissions.fbm)],
      ['  - Refund Commission Credit', formatCurrency(total.salesCommissions.refundCommissions)],
      ['FBA Shipping Commission', formatCurrency(-total.fbaCommissions.total)],
      ['Subscription', formatCurrency(-total.otherExpenses.subscription)],
      ['Advertising', formatCurrency(-total.otherExpenses.advertising)],
      ['Storage Fees', formatCurrency(-total.otherExpenses.inventoryStorage)],
      ['Inbound Placement', formatCurrency(-total.otherExpenses.inboundPlacement)],
      ['Other Expenses', formatCurrency(-total.otherExpenses.others)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Reimbursements Detail
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FBA INVENTORY REIMBURSEMENTS', margin, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Type', 'Amount']],
    body: [
      ['Lost: Warehouse', formatCurrency(total.otherIncome.reimbursements.lostWarehouse)],
      ['Customer Return', formatCurrency(total.otherIncome.reimbursements.customerReturn)],
      ['Damaged: Warehouse', formatCurrency(total.otherIncome.reimbursements.damagedWarehouse)],
      ['Customer Service Issue', formatCurrency(total.otherIncome.reimbursements.customerServiceIssue)],
      ['Lost: Inbound', formatCurrency(total.otherIncome.reimbursements.lostInbound)],
      ['TOTAL', formatCurrency(total.otherIncome.reimbursements.total)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // EBITDA & Net Profit Section
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFITABILITY', margin + 5, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`EBITDA: ${formatCurrency(total.ebitda)} (${formatPercent(total.ebitdaPercent)} of income)`, margin + 5, yPos + 17);
  doc.text(`Taxes (Marketplace Withheld): ${formatCurrency(total.taxes)}`, margin + 5, yPos + 24);
  
  doc.setFont('helvetica', 'bold');
  const netProfitColor = total.netProfit >= 0 ? [34, 197, 94] : [239, 68, 68];
  doc.setTextColor(netProfitColor[0], netProfitColor[1], netProfitColor[2]);
  doc.text(`NET PROFIT: ${formatCurrency(total.netProfit)} (${formatPercent(total.netProfitPercent)})`, pageWidth / 2 + 5, yPos + 17);
  doc.setTextColor(0, 0, 0);

  yPos += 40;

  // Monthly Evolution
  if (monthly.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTHLY EVOLUTION', margin, yPos);
    yPos += 5;

    const monthlyTableData = monthly.map(m => [
      m.monthLabel,
      formatCurrency(m.data.totalIncome),
      formatCurrency(m.data.totalExpenses),
      formatCurrency(m.data.ebitda),
      formatPercent(m.data.ebitdaPercent),
      formatCurrency(m.data.netProfit)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Income', 'Expenses', 'EBITDA', 'EBITDA %', 'Net Profit']],
      body: monthlyTableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Discrepancy Alert
  if (Math.abs(total.mistake) > 1) {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'F');
    
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCREPANCY DETECTED', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Difference of ${formatCurrency(total.mistake)} between calculated (${formatCurrency(total.calculatedTotal)}) and actual (${formatCurrency(total.actualTotal)})`, margin + 5, yPos + 15);
    doc.setTextColor(0, 0, 0);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by Bluco Analyzer - Page ${i} of ${pageCount} - ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const fileName = `PL_Report_${accountName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
