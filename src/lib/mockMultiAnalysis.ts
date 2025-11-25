import { 
  MultiAnalysisResult, 
  FileInfo, 
  CountryMetrics, 
  ModelMetrics, 
  FeeTypeMetrics,
  SKUMetrics,
  DiscrepancyAlert,
  FulfillmentModel
} from '@/types/multiTransaction';

const generateCountryMetrics = (country: string, marketplace: string, currency: string, salesBase: number): CountryMetrics => {
  const feePercent = 28 + Math.random() * 10;
  const refundRate = 3 + Math.random() * 8;
  const grossSales = salesBase;
  const refunds = grossSales * (refundRate / 100);
  const fees = {
    referral: grossSales * 0.15,
    fba: grossSales * 0.08,
    storage: grossSales * 0.02,
    inboundPlacement: grossSales * 0.01,
    advertising: grossSales * (3 + Math.random() * 5) / 100,
    regulatory: grossSales * 0.005,
    subscription: 39.99,
    removal: grossSales * 0.002,
    liquidation: grossSales * 0.001,
    other: grossSales * 0.01,
    total: 0
  };
  fees.total = Object.values(fees).reduce((a, b) => a + b, 0) - fees.total;
  
  const reimbursements = {
    lost: grossSales * 0.008,
    damaged: grossSales * 0.005,
    customerService: grossSales * 0.002,
    other: grossSales * 0.001,
    total: 0
  };
  reimbursements.total = reimbursements.lost + reimbursements.damaged + reimbursements.customerService + reimbursements.other;
  
  const netSales = grossSales - refunds;
  const totalExpenses = fees.total;
  const ebitda = netSales - totalExpenses + reimbursements.total;
  
  const calculatedTotal = netSales - totalExpenses + reimbursements.total;
  const actualTotal = calculatedTotal * (0.98 + Math.random() * 0.04);
  
  return {
    country,
    marketplace,
    currency,
    grossSales,
    grossSalesUSD: grossSales,
    shippingCredits: grossSales * 0.05,
    giftwrapCredits: grossSales * 0.01,
    promotionalRebates: grossSales * 0.03,
    taxCollected: grossSales * 0.08,
    totalRefunds: refunds,
    refundCount: Math.floor(refunds / 25),
    refundRate,
    fees,
    feePercent: (fees.total / netSales) * 100,
    reimbursements,
    modelBreakdown: {
      fba: { 
        sales: grossSales * 0.7, 
        fees: fees.total * 0.75, 
        refunds: refunds * 0.65 
      },
      fbm: { 
        sales: grossSales * 0.25, 
        fees: fees.total * 0.2, 
        refunds: refunds * 0.3 
      },
      awd: { 
        sales: grossSales * 0.05, 
        fees: fees.total * 0.05, 
        refunds: refunds * 0.05 
      }
    },
    netSales,
    netSalesUSD: netSales,
    totalExpenses,
    ebitda,
    ebitdaMargin: (ebitda / netSales) * 100,
    calculatedTotal,
    actualTotal,
    discrepancy: calculatedTotal - actualTotal,
    hasError: Math.abs(calculatedTotal - actualTotal) > 100
  };
};

export const generateMockMultiAnalysis = (files: FileInfo[]): MultiAnalysisResult => {
  // Generate country metrics
  const countries = [
    { country: 'USA', marketplace: 'amazon.com', currency: 'USD', salesBase: 125000 },
    { country: 'Germany', marketplace: 'amazon.de', currency: 'EUR', salesBase: 45000 },
    { country: 'UK', marketplace: 'amazon.co.uk', currency: 'GBP', salesBase: 38000 },
    { country: 'Spain', marketplace: 'amazon.es', currency: 'EUR', salesBase: 22000 },
    { country: 'France', marketplace: 'amazon.fr', currency: 'EUR', salesBase: 28000 },
    { country: 'Italy', marketplace: 'amazon.it', currency: 'EUR', salesBase: 18000 },
    { country: 'Canada', marketplace: 'amazon.ca', currency: 'CAD', salesBase: 15000 },
    { country: 'Mexico', marketplace: 'amazon.com.mx', currency: 'MXN', salesBase: 8000 },
  ];
  
  const byCountry = countries.map(c => 
    generateCountryMetrics(c.country, c.marketplace, c.currency, c.salesBase)
  );
  
  // Calculate global metrics
  const totalSalesUSD = byCountry.reduce((sum, c) => sum + c.grossSalesUSD, 0);
  const totalFeesUSD = byCountry.reduce((sum, c) => sum + c.fees.total, 0);
  const totalRefundsUSD = byCountry.reduce((sum, c) => sum + c.totalRefunds, 0);
  const totalReimbursementsUSD = byCountry.reduce((sum, c) => sum + c.reimbursements.total, 0);
  const netProfitUSD = totalSalesUSD - totalFeesUSD - totalRefundsUSD + totalReimbursementsUSD;
  
  // Model breakdown
  const byModel: ModelMetrics[] = [
    {
      model: 'FBA' as FulfillmentModel,
      totalSales: totalSalesUSD * 0.7,
      totalSalesUSD: totalSalesUSD * 0.7,
      totalFees: totalFeesUSD * 0.75,
      feePercent: 32.5,
      totalRefunds: totalRefundsUSD * 0.65,
      refundRate: 5.2,
      countries: countries.map(c => c.country),
      transactionCount: 15420
    },
    {
      model: 'FBM' as FulfillmentModel,
      totalSales: totalSalesUSD * 0.25,
      totalSalesUSD: totalSalesUSD * 0.25,
      totalFees: totalFeesUSD * 0.2,
      feePercent: 18.5,
      totalRefunds: totalRefundsUSD * 0.3,
      refundRate: 6.8,
      countries: ['USA', 'UK', 'Germany'],
      transactionCount: 4230
    },
    {
      model: 'AWD' as FulfillmentModel,
      totalSales: totalSalesUSD * 0.05,
      totalSalesUSD: totalSalesUSD * 0.05,
      totalFees: totalFeesUSD * 0.05,
      feePercent: 25.2,
      totalRefunds: totalRefundsUSD * 0.05,
      refundRate: 4.1,
      countries: ['USA'],
      transactionCount: 890
    }
  ];
  
  // Fee type breakdown
  const byFeeType: FeeTypeMetrics[] = [
    {
      feeType: 'Referral Fee',
      totalAmount: totalFeesUSD * 0.45,
      totalAmountUSD: totalFeesUSD * 0.45,
      percentOfTotal: 45,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.referral })),
      trend: 'stable'
    },
    {
      feeType: 'FBA Fulfillment',
      totalAmount: totalFeesUSD * 0.28,
      totalAmountUSD: totalFeesUSD * 0.28,
      percentOfTotal: 28,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.fba })),
      trend: 'up'
    },
    {
      feeType: 'Advertising',
      totalAmount: totalFeesUSD * 0.12,
      totalAmountUSD: totalFeesUSD * 0.12,
      percentOfTotal: 12,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.advertising })),
      trend: 'up'
    },
    {
      feeType: 'Storage',
      totalAmount: totalFeesUSD * 0.06,
      totalAmountUSD: totalFeesUSD * 0.06,
      percentOfTotal: 6,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.storage })),
      trend: 'up'
    },
    {
      feeType: 'Inbound Placement',
      totalAmount: totalFeesUSD * 0.04,
      totalAmountUSD: totalFeesUSD * 0.04,
      percentOfTotal: 4,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.inboundPlacement })),
      trend: 'up'
    },
    {
      feeType: 'Other Fees',
      totalAmount: totalFeesUSD * 0.05,
      totalAmountUSD: totalFeesUSD * 0.05,
      percentOfTotal: 5,
      byCountry: byCountry.map(c => ({ country: c.country, amount: c.fees.other })),
      trend: 'stable'
    }
  ];
  
  // Top/Bottom SKUs
  const skuBase: SKUMetrics[] = [
    { sku: 'SKU-BEST-001', asin: 'B0ABC12345', totalSales: 45000, totalFees: 12500, feePercent: 27.8, totalRefunds: 1800, refundRate: 4.0, countries: ['USA', 'UK', 'DE'], fulfillmentModel: 'FBA', profit: 30700, profitMargin: 68.2 },
    { sku: 'SKU-BEST-002', asin: 'B0DEF67890', totalSales: 38000, totalFees: 11200, feePercent: 29.5, totalRefunds: 1520, refundRate: 4.0, countries: ['USA', 'ES', 'FR'], fulfillmentModel: 'FBA', profit: 25280, profitMargin: 66.5 },
    { sku: 'SKU-BEST-003', asin: 'B0GHI11111', totalSales: 32000, totalFees: 9600, feePercent: 30.0, totalRefunds: 1600, refundRate: 5.0, countries: ['USA', 'CA'], fulfillmentModel: 'FBA', profit: 20800, profitMargin: 65.0 },
    { sku: 'SKU-MID-001', asin: 'B0JKL22222', totalSales: 18000, totalFees: 5940, feePercent: 33.0, totalRefunds: 1260, refundRate: 7.0, countries: ['USA'], fulfillmentModel: 'FBM', profit: 10800, profitMargin: 60.0 },
    { sku: 'SKU-MID-002', asin: 'B0MNO33333', totalSales: 15000, totalFees: 5100, feePercent: 34.0, totalRefunds: 1050, refundRate: 7.0, countries: ['DE', 'FR'], fulfillmentModel: 'FBA', profit: 8850, profitMargin: 59.0 },
  ];
  
  const worstSkus: SKUMetrics[] = [
    { sku: 'SKU-BAD-001', asin: 'B0PQR44444', totalSales: 8000, totalFees: 3600, feePercent: 45.0, totalRefunds: 1600, refundRate: 20.0, countries: ['USA'], fulfillmentModel: 'FBA', profit: 2800, profitMargin: 35.0 },
    { sku: 'SKU-BAD-002', asin: 'B0STU55555', totalSales: 5500, totalFees: 2530, feePercent: 46.0, totalRefunds: 880, refundRate: 16.0, countries: ['UK'], fulfillmentModel: 'FBM', profit: 2090, profitMargin: 38.0 },
    { sku: 'SKU-BAD-003', asin: 'B0VWX66666', totalSales: 4200, totalFees: 1890, feePercent: 45.0, totalRefunds: 546, refundRate: 13.0, countries: ['DE'], fulfillmentModel: 'FBA', profit: 1764, profitMargin: 42.0 },
  ];
  
  // Alerts
  const alerts: DiscrepancyAlert[] = [
    {
      type: 'high_refund',
      severity: 'critical',
      country: 'USA',
      description: 'SKU-BAD-001 tiene un ratio de devoluciones del 20%, muy por encima del umbral aceptable (8%)',
      expectedValue: 8,
      actualValue: 20,
      difference: 12,
      recommendation: 'Revisar inmediatamente calidad del producto, descripción del listing y reviews negativos'
    },
    {
      type: 'unusual_fee',
      severity: 'warning',
      country: 'Germany',
      description: 'Fee % en Alemania (34.2%) está 6 puntos por encima de la media global',
      expectedValue: 28,
      actualValue: 34.2,
      difference: 6.2,
      recommendation: 'Revisar estructura de precios y optimizar dimensiones de packaging para reducir fees FBA'
    },
    {
      type: 'calculation_error',
      severity: 'critical',
      country: 'Spain',
      description: 'Discrepancia de €342.50 entre total calculado y total real en liquidación',
      expectedValue: 18500,
      actualValue: 18157.50,
      difference: 342.50,
      recommendation: 'Abrir caso con Amazon Seller Support para revisar liquidación'
    },
    {
      type: 'negative_balance',
      severity: 'warning',
      country: 'Mexico',
      description: 'Balance negativo detectado en cuenta MX, posibles retenciones fiscales no contabilizadas',
      recommendation: 'Verificar retenciones de IVA y configuración fiscal del marketplace'
    },
    {
      type: 'missing_data',
      severity: 'info',
      description: 'No se detectaron datos de costes de producto (COGS) - EBITDA calculado sin margen bruto real',
      recommendation: 'Subir informe de costes para análisis de rentabilidad preciso'
    }
  ];
  
  const executiveSummary = `## 🌍 ANÁLISIS GLOBAL MULTI-MERCADO — DIAGNÓSTICO CEO

**${files.length} archivos procesados** | **${countries.length} marketplaces** | **$${(totalSalesUSD / 1000).toFixed(0)}K facturación total**

---

### 📊 RADIOGRAFÍA FINANCIERA GLOBAL

| Métrica | Valor | Estado |
|---------|-------|--------|
| Ventas Brutas | $${totalSalesUSD.toLocaleString()} | ✅ |
| Total Fees | $${totalFeesUSD.toLocaleString()} | ⚠️ ${((totalFeesUSD / totalSalesUSD) * 100).toFixed(1)}% |
| Devoluciones | $${totalRefundsUSD.toLocaleString()} | ${totalRefundsUSD / totalSalesUSD > 0.06 ? '🔴' : '✅'} ${((totalRefundsUSD / totalSalesUSD) * 100).toFixed(1)}% |
| Reembolsos Amazon | $${totalReimbursementsUSD.toLocaleString()} | ✅ Recuperado |
| **EBITDA Estimado** | **$${netProfitUSD.toLocaleString()}** | ${netProfitUSD / totalSalesUSD > 0.15 ? '✅' : '⚠️'} **${((netProfitUSD / totalSalesUSD) * 100).toFixed(1)}%** |

---

### 🔴 ALERTAS CRÍTICAS

1. **SKU-BAD-001**: Devoluciones al 20% — HEMORRAGIA de dinero. Hay que actuar YA.
2. **España**: Discrepancia de €342.50 en liquidación — Amazon debe dinero o hay error contable.
3. **Alemania**: Fees descontrolados al 34.2% — Revisar estructura de costes urgentemente.

---

### 🟢 PUNTOS FUERTES

- **USA domina** con el 42% de las ventas y el mejor margen (68.2% en top SKU)
- **Modelo FBA** genera 70% del revenue con fees controlados
- **Reembolsos** recuperados: $${totalReimbursementsUSD.toLocaleString()} (buen trabajo reclamando)

---

### ⚡ ACCIÓN INMEDIATA

1. **MATAR o REFORMULAR** SKU-BAD-001, SKU-BAD-002, SKU-BAD-003
2. **ABRIR CASO** en Amazon ES por discrepancia de liquidación
3. **OPTIMIZAR PACKAGING** en productos vendidos en DE para reducir fees FBA
4. **SUBIR COGS** para análisis de rentabilidad real

**Veredicto**: Negocio rentable pero con fugas evitables. Atacar los 3 SKUs problemáticos puede mejorar el margen global en +2-3 puntos.`;

  return {
    analyzedAt: new Date(),
    fileCount: files.length,
    files,
    global: {
      totalSalesUSD,
      totalFeesUSD,
      totalRefundsUSD,
      totalReimbursementsUSD,
      globalFeePercent: (totalFeesUSD / totalSalesUSD) * 100,
      globalRefundRate: (totalRefundsUSD / totalSalesUSD) * 100,
      netProfitUSD,
      profitMargin: (netProfitUSD / totalSalesUSD) * 100,
      transactionCount: 20540,
      skuCount: 156,
      countriesCount: countries.length
    },
    byCountry,
    byModel,
    byFeeType,
    topSKUs: skuBase,
    bottomSKUs: worstSkus,
    alerts,
    executiveSummary,
    recommendations: [
      { priority: 'critical', action: 'Revisar SKU-BAD-001 - ratio devoluciones 20%', impact: 'Evitar pérdidas de $1,600/mes', country: 'USA' },
      { priority: 'critical', action: 'Abrir caso Amazon ES por discrepancia €342.50', impact: 'Recuperar dinero adeudado' },
      { priority: 'high', action: 'Optimizar packaging productos DE para reducir fees FBA', impact: 'Reducir fees ~$2,000/mes', country: 'Germany' },
      { priority: 'high', action: 'Revisar retenciones fiscales MX', impact: 'Evitar sorpresas fiscales', country: 'Mexico' },
      { priority: 'medium', action: 'Escalar inversión en top 3 SKUs', impact: 'Aumentar revenue +15-20%' },
      { priority: 'medium', action: 'Subir datos de COGS para análisis de margen real', impact: 'Visibilidad completa de rentabilidad' },
      { priority: 'low', action: 'Considerar expansión a JP/AU dado buen performance EU', impact: 'Diversificación geográfica' }
    ]
  };
};
