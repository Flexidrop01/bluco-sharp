import { AggregatedMetrics } from './massiveFileProcessor';
import { MultiAnalysisResult, CountryMetrics, ModelMetrics, FeeTypeMetrics, SKUMetrics, DiscrepancyAlert, FileInfo, TransactionTypeMetrics, CityMetrics, RegionMetrics } from '@/types/multiTransaction';
import { EXCHANGE_RATES } from './massiveColumnMappings';

/**
 * Convierte las métricas agregadas a formato MultiAnalysisResult
 * IMPORTANTE: Solo usa datos REALES del archivo
 */
export const convertMetricsToAnalysis = (
  metrics: AggregatedMetrics,
  files: FileInfo[]
): MultiAnalysisResult => {
  
  // Convertir marketplaces - USAR MARKETPLACE (amazon.es)
  const byCountry: CountryMetrics[] = Array.from(metrics.byCountry.values()).map(c => {
    const exchangeRate = EXCHANGE_RATES[c.currency] || 1;
    return {
      country: c.marketplace,
      marketplace: c.marketplace,
      currency: c.currency,
      grossSales: c.grossSales,
      grossSalesUSD: c.grossSalesUSD,
      shippingCredits: 0,
      giftwrapCredits: 0,
      promotionalRebates: 0,
      taxCollected: 0,
      totalRefunds: c.refunds,
      refundCount: 0,
      refundRate: c.refundRate,
      fees: {
        referral: 0, fba: 0, storage: 0, inboundPlacement: 0, advertising: 0,
        regulatory: 0, subscription: 0, removal: 0, liquidation: 0, other: 0,
        total: c.fees
      },
      feePercent: c.feePercent,
      reimbursements: { lost: 0, damaged: 0, customerService: 0, other: 0, total: c.reimbursements },
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

  // Convertir modelos de fulfillment
  const byModel: ModelMetrics[] = Array.from(metrics.byFulfillment.values()).map(f => ({
    model: f.model as 'FBA' | 'FBM' | 'AWD' | 'SWA' | 'Unknown',
    totalSales: f.grossSales,
    totalSalesUSD: f.grossSales,
    totalFees: f.fees,
    feePercent: f.grossSales > 0 ? (f.fees / f.grossSales) * 100 : 0,
    totalRefunds: f.refunds,
    refundRate: f.grossSales > 0 ? (f.refunds / f.grossSales) * 100 : 0,
    countries: Array.from(metrics.marketplaces),
    transactionCount: f.transactionCount
  }));

  // Convertir tipos de fee
  const byFeeType: FeeTypeMetrics[] = Array.from(metrics.byFeeType.entries()).map(([type, amount]) => ({
    feeType: type,
    totalAmount: amount,
    totalAmountUSD: amount,
    percentOfTotal: metrics.totalFees > 0 ? (amount / metrics.totalFees) * 100 : 0,
    byCountry: [],
    trend: 'stable' as const
  }));

  // Convertir tipos de transacción
  const totalTxCount = Array.from(metrics.byTransactionType.values()).reduce((a, b) => a + b, 0);
  const byTransactionType: TransactionTypeMetrics[] = Array.from(metrics.byTransactionType.entries()).map(([type, count]) => ({
    type,
    count,
    totalAmount: metrics.byTransactionTypeDetail.get(type)?.totalAmount || 0,
    percentOfTotal: totalTxCount > 0 ? (count / totalTxCount) * 100 : 0,
    fulfillmentBreakdown: { fba: { count: 0, amount: 0 }, fbm: { count: 0, amount: 0 } }
  }));

  // Convertir ciudades
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

  // Convertir regiones
  const byRegion: RegionMetrics[] = Array.from(metrics.byRegion.values()).map(r => ({
    region: r.region,
    country: r.country,
    totalSales: r.grossSales,
    transactionCount: r.transactionCount,
    cityCount: r.cities.size,
    topCities: Array.from(r.cities).slice(0, 5)
  }));

  // Convertir SKUs
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
    fulfillmentModel: (s.fulfillment || 'Unknown') as 'FBA' | 'FBM' | 'AWD' | 'Unknown',
    profit: s.grossSales - s.fees - s.refunds,
    profitMargin: s.grossSales > 0 ? ((s.grossSales - s.fees - s.refunds) / s.grossSales) * 100 : 0
  });

  const topSKUs = sortedByProfit.slice(0, 5).map(mapSKU);
  const bottomSKUs = sortedByProfit.slice(-3).reverse().map(mapSKU);
  const allSKUs = sortedByProfit.map(mapSKU);

  // Generar alertas
  const alerts: DiscrepancyAlert[] = [];
  
  if (metrics.feePercent > 35) {
    alerts.push({
      type: 'unusual_fee',
      severity: 'critical',
      description: `Fee global del ${metrics.feePercent.toFixed(1)}%`,
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

  const executiveSummary = generateExecutiveSummary(metrics);
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
        fba: { sales: fbaData?.totalSales || 0, fees: fbaData?.totalFees || 0, refunds: fbaData?.totalRefunds || 0, transactions: fbaData?.transactionCount || 0 },
        fbm: { sales: fbmData?.totalSales || 0, fees: fbmData?.totalFees || 0, refunds: fbmData?.totalRefunds || 0, transactions: fbmData?.transactionCount || 0 }
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
    recommendations: []
  };
};

/**
 * Genera resumen ejecutivo con datos reales
 */
const generateExecutiveSummary = (metrics: AggregatedMetrics): string => {
  const marketplaces = Array.from(metrics.marketplaces);
  const dateRangeText = metrics.dateRange.min && metrics.dateRange.max 
    ? `${metrics.dateRange.min.toLocaleDateString('es-ES')} - ${metrics.dateRange.max.toLocaleDateString('es-ES')}`
    : 'No disponible';

  // Desglose por tipo de transacción con categoría
  const txTypeBreakdown = Array.from(metrics.byTransactionTypeDetail.values())
    .sort((a, b) => b.count - a.count)
    .map(t => {
      const categoryLabel = t.category === 'income' ? '📈 INGRESO' : 
                           t.category === 'expense' ? '📉 GASTO' : '🔄 OTRO';
      return `| ${t.type} | ${categoryLabel} | ${t.count.toLocaleString()} | ${t.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |`;
    })
    .join('\n');

  // Desglose por fulfillment
  const fulfillmentBreakdown = Array.from(metrics.byFulfillment.entries())
    .filter(([, data]) => data.grossSales > 0 || data.transactionCount > 0)
    .map(([model, data]) => 
      `| ${model} | ${data.grossSales.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € | ${data.fees.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € | ${data.refunds.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € | ${data.transactionCount.toLocaleString()} |`
    )
    .join('\n');

  // Desglose de fees
  const feeBreakdown = Array.from(metrics.byFeeType.entries())
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, amount]) => `| ${type} | ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |`)
    .join('\n');

  // Diferencia calculada
  const totalIngresos = metrics.grossSales + metrics.promotionalRebates;
  const totalGastos = metrics.totalFees;
  const ebitdaCalculado = totalIngresos - totalGastos + metrics.totalReimbursements;
  const diferenciaPNL = metrics.actualTotal - metrics.otherMovements - ebitdaCalculado;

  return `## ANÁLISIS CEO BRAIN — DATOS REALES DEL ARCHIVO

### PROCESAMIENTO
- **Transacciones válidas:** ${metrics.validTransactions.toLocaleString()}
- **Filas totales:** ${metrics.totalRows.toLocaleString()}
- **Marketplace(s):** ${marketplaces.join(', ') || 'No detectado'}
- **Período:** ${dateRangeText}
- **SKUs únicos:** ${metrics.bySKU.size.toLocaleString()}

---

### INGRESOS (columnas de ingreso del archivo)

| Concepto | Importe |
|----------|---------|
| Ventas de productos | ${metrics.productSales.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Impuesto de ventas de productos | ${metrics.productSalesTax.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Abonos de envío | ${metrics.shippingCredits.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Impuestos por abonos de envío | ${metrics.shippingCreditsTax.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Abonos envoltorio regalo | ${metrics.giftwrapCredits.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Impuesto retenido en el sitio web | ${metrics.taxCollected.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Devoluciones promocionales | ${metrics.promotionalRebates.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| **TOTAL INGRESOS BRUTOS** | **${metrics.grossSales.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €** |

---

### GASTOS (columnas de gasto del archivo)

| Concepto | Importe |
|----------|---------|
| Tarifas de venta | ${Math.abs(metrics.sellingFees).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Tarifas Logística Amazon | ${Math.abs(metrics.fbaFees).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Tarifas otras transacciones | ${Math.abs(metrics.otherTransactionFees).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Otro | ${Math.abs(metrics.otherFees).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| **TOTAL GASTOS** | **${metrics.totalFees.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €** |

---

### DESGLOSE POR TIPO DE FEE

| Tipo | Importe |
|------|---------|
${feeBreakdown || '| Sin datos | - |'}

---

### TABLA DINÁMICA POR TIPO DE TRANSACCIÓN

| Tipo | Categoría | Cantidad | Importe Total |
|------|-----------|----------|---------------|
${txTypeBreakdown || '| Sin datos | - | - | - |'}

---

### POR FULFILLMENT (FBA vs FBM)

| Modelo | Ventas | Fees | Devoluciones | Transacciones |
|--------|--------|------|--------------|---------------|
${fulfillmentBreakdown || '| Sin datos | - | - | - | - |'}

---

### RESULTADO

| Concepto | Importe |
|----------|---------|
| Ingresos brutos | ${metrics.grossSales.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| (+) Devoluciones promocionales | ${metrics.promotionalRebates.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| (-) Devoluciones clientes | ${metrics.totalRefunds.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| (=) Ingresos netos | ${metrics.netSales.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| (-) Gastos Amazon | ${metrics.totalFees.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| (+) Reembolsos Amazon | ${metrics.totalReimbursements.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| **(=) EBITDA** | **${metrics.ebitda.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €** |

${metrics.ebitda >= 0 ? '✅ Resultado positivo' : '🔴 Resultado negativo'}

---

### OTROS MOVIMIENTOS (NO son ingresos ni gastos)

| Concepto | Importe |
|----------|---------|
| Transferencias y otros | ${metrics.otherMovements.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |

---

### VERIFICACIÓN

| Concepto | Importe |
|----------|---------|
| Total según archivo | ${metrics.actualTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| EBITDA calculado | ${metrics.ebitda.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| Otros movimientos | ${metrics.otherMovements.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € |
| **Diferencia** | **${diferenciaPNL.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €** |

${Math.abs(diferenciaPNL) < 1 ? '✅ Cuadra perfectamente' : '⚠️ Hay tipos de transacción sin clasificar'}`;
};
