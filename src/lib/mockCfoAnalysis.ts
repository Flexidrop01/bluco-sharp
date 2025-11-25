import { 
  CFOAnalysisResult, 
  CFOExecutiveSummary, 
  CountryVATSummary, 
  FiscalError, 
  FBAMovement, 
  RegularizationItem, 
  ActionItem,
  VATTransaction 
} from '@/types/cfo';
import { EU_COUNTRIES, COUNTRY_NAMES } from './cfoParser';

export function generateMockCFOAnalysis(fileName: string, transactions: VATTransaction[]): CFOAnalysisResult {
  const now = new Date();
  
  // Aggregate by country
  const countryData = new Map<string, {
    sales: number;
    vatCollected: number;
    vatDue: number;
    domestic: number;
    b2b: number;
    b2c: number;
    exports: number;
    count: number;
    inconsistencies: number;
  }>();
  
  let totalSales = 0;
  let totalVatCollected = 0;
  let totalVatDue = 0;
  let rateErrors = 0;
  let reverseChargeErrors = 0;
  let exportsMissingProof = 0;
  let exportsTotal = 0;
  let b2bTotal = 0;
  let b2cTotal = 0;
  let invalidVatNumbers = 0;
  
  const vatByRate = new Map<number, { amount: number; count: number }>();
  const fbaMovements: FBAMovement[] = [];
  const errors: FiscalError[] = [];
  const uniqueSkus = new Set<string>();
  const dates: string[] = [];
  
  for (const tx of transactions) {
    uniqueSkus.add(tx.sellerSku);
    if (tx.taxCalculationDate) dates.push(tx.taxCalculationDate);
    
    const country = tx.arrivalCountry || tx.taxableJurisdiction || 'XX';
    const data = countryData.get(country) || {
      sales: 0, vatCollected: 0, vatDue: 0, domestic: 0, b2b: 0, b2c: 0, exports: 0, count: 0, inconsistencies: 0
    };
    
    data.sales += tx.priceExclVat;
    data.vatCollected += tx.vatAmount;
    data.count++;
    totalSales += tx.priceExclVat;
    totalVatCollected += tx.vatAmount;
    
    // Calculate expected VAT
    const expectedVat = tx.priceExclVat * (tx.vatRate / 100);
    const vatDiff = Math.abs(tx.vatAmount - expectedVat);
    
    if (vatDiff > 0.01 && tx.vatRate > 0) {
      data.inconsistencies++;
      if (vatDiff > 1) rateErrors++;
    }
    
    data.vatDue += expectedVat;
    totalVatDue += expectedVat;
    
    // VAT by rate
    const rateData = vatByRate.get(tx.vatRate) || { amount: 0, count: 0 };
    rateData.amount += tx.vatAmount;
    rateData.count++;
    vatByRate.set(tx.vatRate, rateData);
    
    // Classification
    switch (tx.fiscalClassification) {
      case 'domestic_supply':
        data.domestic += tx.priceExclVat;
        break;
      case 'intra_eu_supply_b2b':
        data.b2b += tx.priceExclVat;
        b2bTotal += tx.priceExclVat;
        if (!tx.buyerVatNumber) invalidVatNumbers++;
        break;
      case 'intra_eu_supply_b2c':
        data.b2c += tx.priceExclVat;
        b2cTotal += tx.priceExclVat;
        break;
      case 'export_outside_eu':
        data.exports += tx.priceExclVat;
        exportsTotal += tx.priceExclVat;
        if (!tx.vatInvoiceNumber) exportsMissingProof++;
        break;
      case 'movement_of_goods':
      case 'cross_border_fba':
        if (tx.departureCountry !== tx.arrivalCountry) {
          fbaMovements.push({
            id: `fba-${fbaMovements.length}`,
            departureCountry: tx.departureCountry,
            arrivalCountry: tx.arrivalCountry,
            date: tx.taxCalculationDate,
            quantity: 1,
            valueExclVat: tx.priceExclVat,
            vatDue: tx.priceExclVat * 0.21, // Estimated
            intrastatRequired: tx.priceExclVat > 200,
            declared: Math.random() > 0.3
          });
        }
        break;
    }
    
    // Reverse charge check
    if (tx.fiscalClassification === 'intra_eu_supply_b2b' && tx.vatAmount > 0) {
      reverseChargeErrors++;
    }
    
    countryData.set(country, data);
  }
  
  // Generate country summaries
  const countryObligations: CountryVATSummary[] = Array.from(countryData.entries())
    .filter(([code]) => EU_COUNTRIES.includes(code))
    .map(([code, data]) => ({
      country: COUNTRY_NAMES[code] || code,
      countryCode: code,
      totalSales: data.sales,
      totalVatCollected: data.vatCollected,
      totalVatDue: data.vatDue,
      vatInconsistencies: data.inconsistencies,
      domesticSales: data.domestic,
      intraEuB2B: data.b2b,
      intraEuB2C: data.b2c,
      exports: data.exports,
      ossApplicable: data.b2c > 10000,
      registrationRequired: data.sales > 35000 || data.b2c > 10000,
      declarationRequired: data.sales > 0,
      transactionCount: data.count
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
  
  // Generate errors
  if (rateErrors > 0) {
    errors.push({
      id: 'err-rate',
      severity: 'high',
      category: 'VAT Rate',
      description: `${rateErrors} transacciones con tipo de IVA incorrecto o mal calculado`,
      affectedTransactions: rateErrors,
      country: 'Multiple',
      vatImpact: rateErrors * 15,
      recommendation: 'Revisar configuración de tax codes en Seller Central'
    });
  }
  
  if (reverseChargeErrors > 0) {
    errors.push({
      id: 'err-rc',
      severity: 'critical',
      category: 'Reverse Charge',
      description: `${reverseChargeErrors} ventas B2B intracomunitarias con IVA cobrado (debería ser Reverse Charge)`,
      affectedTransactions: reverseChargeErrors,
      country: 'Multiple',
      vatImpact: reverseChargeErrors * 50,
      recommendation: 'Corregir facturas y solicitar reembolso de IVA al cliente'
    });
  }
  
  if (invalidVatNumbers > 0) {
    errors.push({
      id: 'err-vat',
      severity: 'high',
      category: 'VAT Number',
      description: `${invalidVatNumbers} ventas B2B sin número de IVA del comprador`,
      affectedTransactions: invalidVatNumbers,
      country: 'Multiple',
      vatImpact: invalidVatNumbers * 30,
      recommendation: 'Verificar VAT numbers en VIES antes de aplicar exención'
    });
  }
  
  if (exportsMissingProof > 0) {
    errors.push({
      id: 'err-export',
      severity: 'medium',
      category: 'Exportaciones',
      description: `${exportsMissingProof} exportaciones sin prueba de exportación documentada`,
      affectedTransactions: exportsMissingProof,
      country: 'Multiple',
      vatImpact: exportsMissingProof * 20,
      recommendation: 'Solicitar documentación de aduana a Amazon'
    });
  }
  
  const undeclaredMovements = fbaMovements.filter(m => !m.declared).length;
  if (undeclaredMovements > 0) {
    errors.push({
      id: 'err-fba',
      severity: 'critical',
      category: 'FBA Movements',
      description: `${undeclaredMovements} movimientos FBA sin declarar (posible obligación Intrastat)`,
      affectedTransactions: undeclaredMovements,
      country: 'Multiple',
      vatImpact: undeclaredMovements * 100,
      recommendation: 'Regularizar movimientos y presentar declaraciones Intrastat'
    });
  }
  
  // Generate regularizations
  const regularizations: RegularizationItem[] = [];
  
  countryObligations.filter(c => c.registrationRequired && !c.domesticSales).forEach(c => {
    regularizations.push({
      id: `reg-${c.countryCode}`,
      type: 'registration',
      country: c.country,
      description: `Registro de IVA requerido en ${c.country} por ventas B2C > umbral OSS`,
      amount: 0,
      urgency: 'high_48_72h',
      deadline: null
    });
  });
  
  if (reverseChargeErrors > 0) {
    regularizations.push({
      id: 'reg-rc',
      type: 'invoice_rectification',
      country: 'Multiple',
      description: 'Rectificar facturas B2B con IVA incorrectamente cobrado',
      amount: reverseChargeErrors * 50,
      urgency: 'urgent_24h',
      deadline: null
    });
  }
  
  // Generate action plan
  const actionPlan: ActionItem[] = [
    ...errors.filter(e => e.severity === 'critical').map((e, i) => ({
      id: `action-critical-${i}`,
      urgency: 'urgent_24h' as const,
      title: e.category,
      description: e.recommendation,
      country: e.country,
      estimatedImpact: e.vatImpact,
      completed: false
    })),
    ...errors.filter(e => e.severity === 'high').map((e, i) => ({
      id: `action-high-${i}`,
      urgency: 'high_48_72h' as const,
      title: e.category,
      description: e.recommendation,
      country: e.country,
      estimatedImpact: e.vatImpact,
      completed: false
    })),
    ...regularizations.map((r, i) => ({
      id: `action-reg-${i}`,
      urgency: r.urgency,
      title: r.type.replace(/_/g, ' '),
      description: r.description,
      country: r.country,
      estimatedImpact: r.amount,
      completed: false
    }))
  ];
  
  // Executive summary
  const vatDiscrepancy = Math.abs(totalVatCollected - totalVatDue);
  const criticalIssues = errors.filter(e => e.severity === 'critical').length;
  const highIssues = errors.filter(e => e.severity === 'high').length;
  
  const executiveSummary: CFOExecutiveSummary = {
    overallStatus: criticalIssues > 0 ? 'critical' : (highIssues > 0 ? 'warning' : 'good'),
    totalTransactions: transactions.length,
    totalSalesExclVat: totalSales,
    totalVatCollected,
    totalVatDue,
    vatDiscrepancy,
    countriesWithObligations: countryObligations.filter(c => c.declarationRequired).length,
    criticalIssues,
    highPriorityIssues: highIssues,
    mainRisks: errors.slice(0, 3).map(e => e.description),
    urgentCorrections: actionPlan.filter(a => a.urgency === 'urgent_24h').map(a => a.description)
  };
  
  // Date range
  const sortedDates = dates.filter(d => d).sort();
  
  return {
    fileName,
    reportType: 'AIVA / VAT Listings Report',
    processedAt: now.toISOString(),
    period: sortedDates.length > 0 
      ? `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
      : 'No determinado',
    
    executiveSummary,
    countryObligations,
    
    vatAnalysis: {
      totalVatCollected,
      totalVatDue,
      vatInconsistent: countryObligations.reduce((sum, c) => sum + c.vatInconsistencies, 0),
      rateErrors,
      reverseChargeErrors,
      byRate: Array.from(vatByRate.entries()).map(([rate, data]) => ({
        rate,
        amount: data.amount,
        count: data.count
      })).sort((a, b) => b.amount - a.amount)
    },
    
    exports: {
      totalExportsOutsideEu: exportsTotal,
      withProofOfExport: Math.round((exportsTotal / 100) * 0.7),
      missingProof: exportsMissingProof,
      misclassified: Math.round(rateErrors * 0.1)
    },
    
    intraEu: {
      b2bTotal,
      b2cTotal,
      invalidVatNumbers,
      missingVatNumbers: invalidVatNumbers,
      classificationErrors: Math.round((b2bTotal + b2cTotal) / 10000)
    },
    
    fbaMovements,
    errors,
    regularizations,
    actionPlan,
    
    rawMetrics: {
      totalRows: transactions.length,
      validTransactions: transactions.length,
      skippedRows: 0,
      uniqueCountries: countryObligations.map(c => c.countryCode),
      uniqueSkus: uniqueSkus.size,
      dateRange: {
        from: sortedDates[0] || '',
        to: sortedDates[sortedDates.length - 1] || ''
      }
    }
  };
}
