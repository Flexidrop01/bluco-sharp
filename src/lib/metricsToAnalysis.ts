import { AggregatedMetrics } from './massiveFileProcessor';
import { MultiAnalysisResult, CountryMetrics, ModelMetrics, FeeTypeMetrics, SKUMetrics, DiscrepancyAlert, FileInfo, TransactionTypeMetrics, CityMetrics, RegionMetrics } from '@/types/multiTransaction';
import { EXCHANGE_RATES } from './massiveColumnMappings';

/**
 * Convierte las métricas agregadas a formato MultiAnalysisResult
 * IMPORTANTE: Solo usa datos REALES del archivo, no inventa nada
 */
export const convertMetricsToAnalysis = (
  metrics: AggregatedMetrics,
  files: FileInfo[]
): MultiAnalysisResult => {
  
  // Convertir marketplaces - USAR MARKETPLACE NO PAÍS
  const byCountry: CountryMetrics[] = Array.from(metrics.byCountry.values()).map(c => {
    const exchangeRate = EXCHANGE_RATES[c.currency] || 1;
    return {
      country: c.marketplace, // Usar marketplace como identificador principal
      marketplace: c.marketplace,
      currency: c.currency,
      grossSales: c.grossSales,
      grossSalesUSD: c.grossSalesUSD,
      shippingCredits: 0, // Solo se rellena si el archivo tiene este dato
      giftwrapCredits: 0,
      promotionalRebates: 0,
      taxCollected: 0,
      totalRefunds: c.refunds,
      refundCount: 0, // No inventar
      refundRate: c.refundRate,
      fees: {
        // Usar datos reales, no porcentajes inventados
        referral: 0, // No podemos separar sin datos detallados
        fba: 0,
        storage: 0,
        inboundPlacement: 0,
        advertising: 0,
        regulatory: 0,
        subscription: 0,
        removal: 0,
        liquidation: 0,
        other: 0,
        total: c.fees // Solo el total es real
      },
      feePercent: c.feePercent,
      reimbursements: {
        lost: 0,
        damaged: 0,
        customerService: 0,
        other: 0,
        total: c.reimbursements
      },
      modelBreakdown: {
        fba: { sales: 0, fees: 0, refunds: 0 },
        fbm: { sales: 0, fees: 0, refunds: 0 },
        awd: { sales: 0, fees: 0, refunds: 0 }
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

  // Convertir modelos de fulfillment - DATOS REALES
  const byModel: ModelMetrics[] = Array.from(metrics.byFulfillment.values()).map(f => ({
    model: f.model as 'FBA' | 'FBM' | 'AWD' | 'SWA' | 'Unknown',
    totalSales: f.grossSales,
    totalSalesUSD: f.grossSales,
    totalFees: f.fees,
    feePercent: f.grossSales > 0 ? (f.fees / f.grossSales) * 100 : 0,
    totalRefunds: f.refunds,
    refundRate: f.grossSales > 0 ? (f.refunds / f.grossSales) * 100 : 0,
    countries: Array.from(metrics.marketplaces), // Usar marketplaces
    transactionCount: f.transactionCount
  }));

  // Convertir tipos de fee - DATOS REALES
  const byFeeType: FeeTypeMetrics[] = Array.from(metrics.byFeeType.entries()).map(([type, amount]) => ({
    feeType: type,
    totalAmount: amount,
    totalAmountUSD: amount,
    percentOfTotal: metrics.totalFees > 0 ? (amount / metrics.totalFees) * 100 : 0,
    byCountry: [], // Solo si tenemos datos reales por país
    trend: 'stable' as const
  }));

  // Convertir tipos de transacción - DATOS REALES
  const totalTransactions = Array.from(metrics.byTransactionType.values()).reduce((a, b) => a + b, 0);
  const byTransactionType: TransactionTypeMetrics[] = Array.from(metrics.byTransactionType.entries()).map(([type, count]) => ({
    type,
    count,
    totalAmount: 0,
    percentOfTotal: totalTransactions > 0 ? (count / totalTransactions) * 100 : 0,
    fulfillmentBreakdown: {
      fba: { count: 0, amount: 0 },
      fbm: { count: 0, amount: 0 }
    }
  }));

  // Convertir ciudades - DATOS REALES
  const byCity: CityMetrics[] = Array.from(metrics.byCity.values()).map(c => ({
    city: c.city,
    region: c.region,
    country: c.country,
    postalCode: c.postalCode,
    totalSales: c.grossSales,
    transactionCount: c.transactionCount,
    topSKUs: Array.from(c.topSKUs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sku, sales]) => ({ sku, sales, description: metrics.bySKU.get(sku)?.description }))
  }));

  // Convertir regiones - DATOS REALES
  const byRegion: RegionMetrics[] = Array.from(metrics.byRegion.values()).map(r => ({
    region: r.region,
    country: r.country,
    totalSales: r.grossSales,
    transactionCount: r.transactionCount,
    cityCount: r.cities.size,
    topCities: Array.from(r.cities).slice(0, 5)
  }));

  // Convertir SKUs - DATOS REALES
  const skuArray = Array.from(metrics.bySKU.values());
  const sortedByProfit = [...skuArray].sort((a, b) => 
    (b.grossSales - b.fees - b.refunds) - (a.grossSales - a.fees - a.refunds)
  );
  
  const mapSKU = (s: typeof skuArray[0]): SKUMetrics => ({
    sku: s.sku,
    asin: s.asin,
    description: s.description,
    totalSales: s.grossSales,
    totalFees: s.fees,
    feePercent: s.feePercent,
    totalRefunds: s.refunds,
    refundRate: s.refundRate,
    quantity: s.quantity,
    countries: Array.from(s.countries),
    cities: Array.from(s.cities),
    fulfillmentModel: 'Unknown' as const, // No inventar
    profit: s.grossSales - s.fees - s.refunds,
    profitMargin: s.grossSales > 0 ? ((s.grossSales - s.fees - s.refunds) / s.grossSales) * 100 : 0
  });

  const topSKUs: SKUMetrics[] = sortedByProfit.slice(0, 5).map(mapSKU);
  const bottomSKUs: SKUMetrics[] = sortedByProfit.slice(-3).reverse().map(mapSKU);
  const allSKUs: SKUMetrics[] = sortedByProfit.map(mapSKU);

  // Generar alertas basadas en datos REALES
  const alerts: DiscrepancyAlert[] = [];
  
  if (metrics.discrepancies.length > 0) {
    const totalDiscrepancy = metrics.discrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0);
    alerts.push({
      type: 'calculation_error',
      severity: totalDiscrepancy > 1000 ? 'critical' : 'warning',
      description: `${metrics.discrepancies.length} discrepancias detectadas. Diferencia total: ${totalDiscrepancy.toFixed(2)}`,
      expectedValue: metrics.calculatedTotal,
      actualValue: metrics.actualTotal,
      difference: metrics.calculatedTotal - metrics.actualTotal,
      recommendation: 'Revisar transacciones marcadas con MISTAKE'
    });
  }

  if (metrics.feePercent > 35) {
    alerts.push({
      type: 'unusual_fee',
      severity: 'critical',
      description: `Fee global del ${metrics.feePercent.toFixed(1)}% por encima del umbral`,
      expectedValue: 30,
      actualValue: metrics.feePercent,
      recommendation: 'Revisar estructura de precios'
    });
  }

  if (metrics.refundRate > 8) {
    alerts.push({
      type: 'high_refund',
      severity: 'critical',
      description: `Ratio de devoluciones del ${metrics.refundRate.toFixed(1)}%`,
      expectedValue: 6,
      actualValue: metrics.refundRate,
      recommendation: 'Revisar calidad de productos'
    });
  }

  // Resumen ejecutivo con DATOS REALES
  const executiveSummary = generateExecutiveSummary(metrics, alerts);

  // FBA vs FBM - DATOS REALES
  const fbaData = byModel.find(m => m.model === 'FBA');
  const fbmData = byModel.find(m => m.model === 'FBM');

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
      countriesCount: metrics.marketplaces.size,
      fbaVsFbm: {
        fba: { 
          sales: fbaData?.totalSales || 0, 
          fees: fbaData?.totalFees || 0, 
          refunds: fbaData?.totalRefunds || 0, 
          transactions: fbaData?.transactionCount || 0 
        },
        fbm: { 
          sales: fbmData?.totalSales || 0, 
          fees: fbmData?.totalFees || 0, 
          refunds: fbmData?.totalRefunds || 0, 
          transactions: fbmData?.transactionCount || 0 
        }
      }
    },
    byCountry,
    byModel,
    byFeeType,
    byTransactionType,
    byCity,
    byRegion,
    topSKUs,
    bottomSKUs,
    allSKUs,
    alerts,
    executiveSummary,
    recommendations: generateRecommendations(metrics, alerts)
  };
};

/**
 * Genera resumen ejecutivo con SOLO datos reales del archivo
 */
const generateExecutiveSummary = (
  metrics: AggregatedMetrics,
  alerts: DiscrepancyAlert[]
): string => {
  const marketplaces = Array.from(metrics.marketplaces);
  const dateRangeText = metrics.dateRange.min && metrics.dateRange.max 
    ? `${metrics.dateRange.min.toLocaleDateString('es-ES')} - ${metrics.dateRange.max.toLocaleDateString('es-ES')}`
    : 'No disponible';

  // Desglose de fees REAL (solo lo que tenemos en byFeeType)
  const feeBreakdown = Array.from(metrics.byFeeType.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, amount]) => {
      const percent = metrics.totalFees > 0 ? (amount / metrics.totalFees * 100).toFixed(1) : '0';
      return `| ${type} | ${amount.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | ${percent}% |`;
    })
    .join('\n');

  // Desglose por modelo de fulfillment REAL
  const fulfillmentBreakdown = Array.from(metrics.byFulfillment.entries())
    .map(([model, data]) => {
      return `| ${model} | ${data.grossSales.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | ${data.fees.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | ${data.transactionCount.toLocaleString()} |`;
    })
    .join('\n');

  // Alertas críticas
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return `## ANÁLISIS CEO BRAIN — DATOS REALES DEL ARCHIVO

### 📊 RESUMEN DE PROCESAMIENTO

| Campo | Valor |
|-------|-------|
| **Transacciones válidas** | ${metrics.validTransactions.toLocaleString()} |
| **Filas totales** | ${metrics.totalRows.toLocaleString()} |
| **Filas ignoradas** | ${metrics.skippedRows.toLocaleString()} |
| **Marketplaces** | ${marketplaces.join(', ') || 'No detectado'} |
| **Período** | ${dateRangeText} |
| **SKUs únicos** | ${metrics.bySKU.size.toLocaleString()} |

---

### 💰 MÉTRICAS FINANCIERAS

| Concepto | Valor | Observación |
|----------|-------|-------------|
| **Ventas Brutas** | ${metrics.grossSales.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | Total product sales |
| **Ventas Netas** | ${metrics.netSales.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | Tras descuentos y devoluciones |
| **Total Fees** | ${metrics.totalFees.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | ${metrics.feePercent.toFixed(1)}% de ventas |
| **Devoluciones** | ${metrics.totalRefunds.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | ${metrics.refundRate.toFixed(1)}% tasa |
| **Reembolsos Inventario** | ${metrics.totalReimbursements.toLocaleString('es-ES', { maximumFractionDigits: 2 })} | Recuperado de Amazon |
| **EBITDA** | **${metrics.ebitda.toLocaleString('es-ES', { maximumFractionDigits: 2 })}** | ${metrics.ebitda >= 0 ? '✅' : '🔴'} |

---

### 📦 DESGLOSE POR FULFILLMENT

| Modelo | Ventas | Fees | Transacciones |
|--------|--------|------|---------------|
${fulfillmentBreakdown || '| Sin datos | - | - | - |'}

---

### 💸 DESGLOSE DE FEES

| Tipo | Importe | % del Total |
|------|---------|-------------|
${feeBreakdown || '| Sin desglose | - | - |'}

---

### ⚠️ ALERTAS (${criticalAlerts.length} críticas)

${alerts.length > 0 
  ? alerts.map(a => `- **${a.severity.toUpperCase()}**: ${a.description}`).join('\n')
  : '✅ Sin alertas críticas'
}`;
};

/**
 * Genera recomendaciones basadas en datos REALES
 */
const generateRecommendations = (
  metrics: AggregatedMetrics,
  alerts: DiscrepancyAlert[]
): MultiAnalysisResult['recommendations'] => {
  const recommendations: MultiAnalysisResult['recommendations'] = [];

  if (metrics.feePercent > 32) {
    recommendations.push({
      priority: 'high',
      action: `Revisar estructura de fees - actualmente ${metrics.feePercent.toFixed(1)}%`,
      impact: `Fees totales: ${metrics.totalFees.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
    });
  }

  if (metrics.refundRate > 6) {
    recommendations.push({
      priority: 'critical',
      action: `Investigar devoluciones - tasa actual ${metrics.refundRate.toFixed(1)}%`,
      impact: `Total devoluciones: ${metrics.totalRefunds.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
    });
  }

  if (metrics.discrepancies.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: `Revisar ${metrics.discrepancies.length} discrepancias en liquidaciones`,
      impact: `Diferencia: ${Math.abs(metrics.calculatedTotal - metrics.actualTotal).toFixed(2)}`
    });
  }

  if (metrics.totalReimbursements > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Seguimiento de reembolsos de inventario',
      impact: `${metrics.totalReimbursements.toLocaleString('es-ES', { maximumFractionDigits: 2 })} recuperados`
    });
  }

  return recommendations;
};
