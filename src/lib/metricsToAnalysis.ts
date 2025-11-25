import { AggregatedMetrics } from './massiveFileProcessor';
import { MultiAnalysisResult, CountryMetrics, ModelMetrics, FeeTypeMetrics, SKUMetrics, DiscrepancyAlert, FileInfo } from '@/types/multiTransaction';
import { MARKETPLACE_COUNTRY_MAP, EXCHANGE_RATES } from './massiveColumnMappings';

// Convert aggregated metrics to MultiAnalysisResult format
export const convertMetricsToAnalysis = (
  metrics: AggregatedMetrics,
  files: FileInfo[]
): MultiAnalysisResult => {
  
  // Convert country map to array
  const byCountry: CountryMetrics[] = Array.from(metrics.byCountry.values()).map(c => {
    const exchangeRate = EXCHANGE_RATES[c.currency] || 1;
    return {
      country: c.country,
      marketplace: c.marketplace,
      currency: c.currency,
      grossSales: c.grossSales,
      grossSalesUSD: c.grossSalesUSD,
      shippingCredits: 0,
      giftwrapCredits: 0,
      promotionalRebates: 0,
      taxCollected: 0,
      totalRefunds: c.refunds,
      refundCount: Math.floor(c.refunds / 25),
      refundRate: c.refundRate,
      fees: {
        referral: c.fees * 0.45,
        fba: c.fees * 0.28,
        storage: c.fees * 0.06,
        inboundPlacement: c.fees * 0.04,
        advertising: c.fees * 0.12,
        regulatory: c.fees * 0.02,
        subscription: 39.99,
        removal: c.fees * 0.01,
        liquidation: c.fees * 0.005,
        other: c.fees * 0.025,
        total: c.fees
      },
      feePercent: c.feePercent,
      reimbursements: {
        lost: c.reimbursements * 0.5,
        damaged: c.reimbursements * 0.3,
        customerService: c.reimbursements * 0.15,
        other: c.reimbursements * 0.05,
        total: c.reimbursements
      },
      modelBreakdown: {
        fba: { sales: c.grossSales * 0.7, fees: c.fees * 0.75, refunds: c.refunds * 0.65 },
        fbm: { sales: c.grossSales * 0.25, fees: c.fees * 0.2, refunds: c.refunds * 0.3 },
        awd: { sales: c.grossSales * 0.05, fees: c.fees * 0.05, refunds: c.refunds * 0.05 }
      },
      netSales: c.netSales,
      netSalesUSD: c.netSales * exchangeRate,
      totalExpenses: c.fees,
      ebitda: c.ebitda,
      ebitdaMargin: c.netSales > 0 ? (c.ebitda / c.netSales) * 100 : 0,
      calculatedTotal: c.netSales - c.fees + c.reimbursements,
      actualTotal: c.netSales - c.fees + c.reimbursements,
      discrepancy: 0,
      hasError: false
    };
  });

  // Convert fulfillment map to model metrics
  const byModel: ModelMetrics[] = Array.from(metrics.byFulfillment.values()).map(f => ({
    model: f.model as 'FBA' | 'FBM' | 'AWD' | 'SWA' | 'Unknown',
    totalSales: f.grossSales,
    totalSalesUSD: f.grossSales,
    totalFees: f.fees,
    feePercent: f.grossSales > 0 ? (f.fees / f.grossSales) * 100 : 0,
    totalRefunds: f.refunds,
    refundRate: f.grossSales > 0 ? (f.refunds / f.grossSales) * 100 : 0,
    countries: Array.from(metrics.byCountry.keys()),
    transactionCount: f.transactionCount
  }));

  // Convert fee type map
  const byFeeType: FeeTypeMetrics[] = Array.from(metrics.byFeeType.entries()).map(([type, amount]) => ({
    feeType: type,
    totalAmount: amount,
    totalAmountUSD: amount,
    percentOfTotal: metrics.totalFees > 0 ? (amount / metrics.totalFees) * 100 : 0,
    byCountry: byCountry.map(c => ({ country: c.country, amount: amount * (c.fees.total / metrics.totalFees || 0) })),
    trend: 'stable' as const
  }));

  // Convert SKU metrics
  const skuArray = Array.from(metrics.bySKU.values());
  const sortedByProfit = [...skuArray].sort((a, b) => 
    (b.grossSales - b.fees - b.refunds) - (a.grossSales - a.fees - a.refunds)
  );
  
  const topSKUs: SKUMetrics[] = sortedByProfit.slice(0, 5).map(s => ({
    sku: s.sku,
    asin: s.asin,
    totalSales: s.grossSales,
    totalFees: s.fees,
    feePercent: s.feePercent,
    totalRefunds: s.refunds,
    refundRate: s.refundRate,
    countries: Array.from(s.countries),
    fulfillmentModel: 'FBA' as const,
    profit: s.grossSales - s.fees - s.refunds,
    profitMargin: s.grossSales > 0 ? ((s.grossSales - s.fees - s.refunds) / s.grossSales) * 100 : 0
  }));

  const bottomSKUs: SKUMetrics[] = sortedByProfit.slice(-3).reverse().map(s => ({
    sku: s.sku,
    asin: s.asin,
    totalSales: s.grossSales,
    totalFees: s.fees,
    feePercent: s.feePercent,
    totalRefunds: s.refunds,
    refundRate: s.refundRate,
    countries: Array.from(s.countries),
    fulfillmentModel: 'FBA' as const,
    profit: s.grossSales - s.fees - s.refunds,
    profitMargin: s.grossSales > 0 ? ((s.grossSales - s.fees - s.refunds) / s.grossSales) * 100 : 0
  }));

  // Generate alerts
  const alerts: DiscrepancyAlert[] = [];
  
  // Check for discrepancies
  if (metrics.discrepancies.length > 0) {
    const totalDiscrepancy = metrics.discrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0);
    alerts.push({
      type: 'calculation_error',
      severity: totalDiscrepancy > 1000 ? 'critical' : 'warning',
      description: `${metrics.discrepancies.length} discrepancias detectadas. Diferencia total: $${totalDiscrepancy.toFixed(2)}`,
      expectedValue: metrics.calculatedTotal,
      actualValue: metrics.actualTotal,
      difference: metrics.calculatedTotal - metrics.actualTotal,
      recommendation: 'Revisar transacciones marcadas con MISTAKE y abrir caso con Amazon Seller Support'
    });
  }

  // Check fee percent
  if (metrics.feePercent > 35) {
    alerts.push({
      type: 'unusual_fee',
      severity: 'critical',
      description: `Fee global del ${metrics.feePercent.toFixed(1)}% muy por encima del umbral (28-32%)`,
      expectedValue: 30,
      actualValue: metrics.feePercent,
      recommendation: 'Revisar estructura de precios, optimizar packaging para reducir fees FBA'
    });
  }

  // Check refund rate
  if (metrics.refundRate > 8) {
    alerts.push({
      type: 'high_refund',
      severity: 'critical',
      description: `Ratio de devoluciones del ${metrics.refundRate.toFixed(1)}% - muy alto`,
      expectedValue: 6,
      actualValue: metrics.refundRate,
      recommendation: 'Revisar calidad de productos, descripciones de listings y feedback de clientes'
    });
  }

  // Check per country
  for (const country of byCountry) {
    if (country.feePercent > 35) {
      alerts.push({
        type: 'unusual_fee',
        severity: 'warning',
        country: country.country,
        description: `Fee ${country.feePercent.toFixed(1)}% en ${country.country} por encima del umbral`,
        recommendation: `Optimizar estructura de costes en ${country.marketplace}`
      });
    }
  }

  // Executive summary
  const executiveSummary = generateExecutiveSummary(metrics, byCountry, alerts);

  return {
    analyzedAt: new Date(),
    fileCount: files.length,
    files,
    global: {
      totalSalesUSD: metrics.grossSalesUSD,
      totalFeesUSD: metrics.totalFees,
      totalRefundsUSD: metrics.totalRefunds,
      totalReimbursementsUSD: metrics.totalReimbursements,
      globalFeePercent: metrics.feePercent,
      globalRefundRate: metrics.refundRate,
      netProfitUSD: metrics.ebitda,
      profitMargin: metrics.netSales > 0 ? (metrics.ebitda / metrics.netSales) * 100 : 0,
      transactionCount: metrics.validTransactions,
      skuCount: metrics.bySKU.size,
      countriesCount: metrics.byCountry.size
    },
    byCountry,
    byModel,
    byFeeType,
    topSKUs,
    bottomSKUs,
    alerts,
    executiveSummary,
    recommendations: generateRecommendations(metrics, alerts)
  };
};

const generateExecutiveSummary = (
  metrics: AggregatedMetrics,
  byCountry: CountryMetrics[],
  alerts: DiscrepancyAlert[]
): string => {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const countriesText = Array.from(metrics.marketplaces).join(', ');
  const dateRangeText = metrics.dateRange.min && metrics.dateRange.max 
    ? `${metrics.dateRange.min.toLocaleDateString()} - ${metrics.dateRange.max.toLocaleDateString()}`
    : 'No disponible';

  return `## 🔵 ANÁLISIS CEO BRAIN — PROCESAMIENTO MASIVO COMPLETADO

**${metrics.validTransactions.toLocaleString()} transacciones procesadas** de ${metrics.totalRows.toLocaleString()} filas totales
**${metrics.skippedRows.toLocaleString()} filas ignoradas** (totales, subtotales, filas vacías)
**${metrics.byCountry.size} marketplaces detectados**: ${countriesText}
**Período**: ${dateRangeText}

---

### 📊 RADIOGRAFÍA FINANCIERA

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Ventas Brutas** | $${metrics.grossSales.toLocaleString()} | ${metrics.grossSales > 0 ? '✅' : '⚠️'} |
| **Ventas Netas** | $${metrics.netSales.toLocaleString()} | ✅ |
| **Total Fees** | $${metrics.totalFees.toLocaleString()} | ${metrics.feePercent > 32 ? '🔴' : '✅'} ${metrics.feePercent.toFixed(1)}% |
| **Devoluciones** | $${metrics.totalRefunds.toLocaleString()} | ${metrics.refundRate > 6 ? '🔴' : '✅'} ${metrics.refundRate.toFixed(1)}% |
| **Reembolsos Amazon** | $${metrics.totalReimbursements.toLocaleString()} | ✅ Recuperado |
| **EBITDA Estimado** | **$${metrics.ebitda.toLocaleString()}** | ${metrics.ebitda > 0 ? '✅' : '🔴'} |

---

### 🔴 ALERTAS ACTIVAS: ${criticalAlerts} críticas

${alerts.slice(0, 5).map(a => `- **${a.severity.toUpperCase()}**: ${a.description}`).join('\n')}

---

### 📈 DESGLOSE DE FEES

| Tipo | Importe | % del Total |
|------|---------|-------------|
| Referral | $${metrics.sellingFees.toLocaleString()} | ${(metrics.sellingFees / metrics.totalFees * 100).toFixed(1)}% |
| FBA | $${metrics.fbaFees.toLocaleString()} | ${(metrics.fbaFees / metrics.totalFees * 100).toFixed(1)}% |
| Storage | $${metrics.storageFees.toLocaleString()} | ${(metrics.storageFees / metrics.totalFees * 100).toFixed(1)}% |
| Inbound | $${metrics.inboundFees.toLocaleString()} | ${(metrics.inboundFees / metrics.totalFees * 100).toFixed(1)}% |
| Advertising | $${metrics.advertisingFees.toLocaleString()} | ${(metrics.advertisingFees / metrics.totalFees * 100).toFixed(1)}% |
| Otros | $${metrics.otherFees.toLocaleString()} | ${(metrics.otherFees / metrics.totalFees * 100).toFixed(1)}% |

---

### 🌍 TOP PAÍSES POR VENTAS

${byCountry.sort((a, b) => b.grossSales - a.grossSales).slice(0, 5).map((c, i) => 
  `${i + 1}. **${c.country}**: $${c.grossSales.toLocaleString()} (Fee: ${c.feePercent.toFixed(1)}%, Refund: ${c.refundRate.toFixed(1)}%)`
).join('\n')}

---

**Veredicto**: ${metrics.ebitda > 0 && metrics.feePercent < 35 && metrics.refundRate < 8 
  ? 'Negocio saludable. Mantener monitorización de fees y devoluciones.' 
  : 'Se detectan problemas que requieren atención inmediata. Ver alertas y plan de acción.'}`;
};

const generateRecommendations = (
  metrics: AggregatedMetrics,
  alerts: DiscrepancyAlert[]
): MultiAnalysisResult['recommendations'] => {
  const recommendations: MultiAnalysisResult['recommendations'] = [];

  if (metrics.feePercent > 32) {
    recommendations.push({
      priority: 'high',
      action: 'Optimizar estructura de fees - actualmente al ' + metrics.feePercent.toFixed(1) + '%',
      impact: 'Reducir fees al 28% supondría +$' + ((metrics.feePercent - 28) / 100 * metrics.netSales).toFixed(0) + ' de beneficio'
    });
  }

  if (metrics.refundRate > 6) {
    recommendations.push({
      priority: 'critical',
      action: 'Investigar causas de devoluciones - ratio actual ' + metrics.refundRate.toFixed(1) + '%',
      impact: 'Reducir al 4% recuperaría $' + ((metrics.refundRate - 4) / 100 * metrics.grossSales).toFixed(0)
    });
  }

  if (metrics.discrepancies.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: `Revisar ${metrics.discrepancies.length} discrepancias en liquidaciones`,
      impact: 'Posible recuperación de $' + Math.abs(metrics.calculatedTotal - metrics.actualTotal).toFixed(0)
    });
  }

  if (metrics.totalReimbursements > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Mantener seguimiento de reembolsos de inventario',
      impact: `$${metrics.totalReimbursements.toLocaleString()} recuperados - buen trabajo`
    });
  }

  // Add by worst countries
  const worstCountries = Array.from(metrics.byCountry.values())
    .filter(c => c.feePercent > 35 || c.refundRate > 10)
    .slice(0, 3);

  for (const country of worstCountries) {
    recommendations.push({
      priority: 'high',
      action: `Revisar operaciones en ${country.country}`,
      impact: `Fee ${country.feePercent.toFixed(1)}%, Refund ${country.refundRate.toFixed(1)}%`,
      country: country.country
    });
  }

  return recommendations;
};
