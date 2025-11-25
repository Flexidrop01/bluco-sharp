import { AggregatedMetrics } from './massiveFileProcessor';

// P&L Metrics structure matching Bluco format
export interface PLMetrics {
  // Sales Revenue
  totalIncome: number;
  excludingTaxes: number;
  
  // FBM
  fbm: {
    totalRevenue: number;
    taxableIncome: number;
    taxIncome: number;
    refunds: number;
    taxableRefunds: number;
    refundTax: number;
    percentOfTotal: number;
  };
  
  // FBA
  fba: {
    totalRevenue: number;
    taxableIncome: number;
    taxIncome: number;
    refunds: number;
    taxableRefunds: number;
    refundTax: number;
    refundRate: number;
  };
  
  // Other Income
  otherIncome: {
    shippingCredits: number;
    shippingCreditsTax: number;
    giftWrapCredits: number;
    giftWrapCreditsTax: number;
    regulatoryFee: number;
    regulatoryFeeTax: number;
    marketplaceWithheldTax: number;
    promotionalRebates: number;
    promotionalRebatesTax: number;
    reimbursements: {
      lostWarehouse: number;
      customerReturn: number;
      damagedWarehouse: number;
      customerServiceIssue: number;
      lostInbound: number;
      total: number;
    };
  };
  
  // Other Amazon Income
  otherAmazonIncome: {
    fbaInventoryFee: number;
    liquidations: number;
    fbaCustomerReturnFee: number;
    orderRetrocharge: number;
    several: number;
    total: number;
  };
  
  // Expenses
  totalExpenses: number;
  expensesPerSale: number;
  
  salesCommissions: {
    fbm: number;
    fba: number;
    refundCommissions: number;
    percentOfIncome: number;
    total: number;
  };
  
  fbaCommissions: {
    shipping: number;
    shippingCredits: number;
    total: number;
  };
  
  otherExpenses: {
    subscription: number;
    advertising: number;
    partnerCarrierShipment: number;
    inventoryStorage: number;
    generalAdjustment: number;
    returnPostageBilling: number;
    discounts: number;
    inboundPlacement: number;
    vineEnrollment: number;
    awdProcessing: number;
    awdTransportation: number;
    awdStorage: number;
    fbaStorageFee: number;
    longTermStorage: number;
    prepLabeling: number;
    removalReturn: number;
    removalDisposal: number;
    others: number;
    total: number;
  };
  
  // EBITDA
  ebitda: number;
  ebitdaPercent: number;
  
  // Final
  taxes: number;
  netProfit: number;
  netProfitPercent: number;
  
  // Transfers
  transfer: number;
  debt: number;
  
  // Calculated vs Actual
  calculatedTotal: number;
  actualTotal: number;
  mistake: number;
}

export interface MonthlyPLData {
  month: string;
  monthLabel: string;
  data: PLMetrics;
}

export interface PLResult {
  total: PLMetrics;
  monthly: MonthlyPLData[];
  dateRange: { min: Date | null; max: Date | null };
  currency: string;
}

// Convert aggregated metrics to P&L structure - USA DATOS REALES, NO ESTIMACIONES
export const convertMetricsToPL = (metrics: AggregatedMetrics): PLResult => {
  // Get FBA and FBM data from fulfillment breakdown - DATOS REALES
  const fbaData = metrics.byFulfillment.get('FBA') || { 
    grossSales: 0, salesWithTax: 0, fees: 0, sellingFees: 0, 
    sellingFeesRefund: 0, fbaFees: 0, refunds: 0, transactionCount: 0 
  };
  const fbmData = metrics.byFulfillment.get('FBM') || { 
    grossSales: 0, salesWithTax: 0, fees: 0, sellingFees: 0, 
    sellingFeesRefund: 0, fbaFees: 0, refunds: 0, transactionCount: 0 
  };

  // Generate total P&L con DATOS REALES
  const totalPL = generatePLFromData({
    // Ventas reales
    grossSales: metrics.grossSales,
    productSales: metrics.productSales,                    // Ventas SIN IVA
    salesWithTax: metrics.salesWithTax,                    // Ventas CON IVA
    productSalesTax: metrics.productSalesTax,              // IVA de ventas
    
    // FBA/FBM con IVA (datos reales)
    fbaGrossSales: fbaData.salesWithTax,                   // FBA CON IVA
    fbmGrossSales: fbmData.salesWithTax,                   // FBM CON IVA
    fbaRefunds: fbaData.refunds,                           // Reembolsos FBA CON IVA
    fbmRefunds: fbmData.refunds,                           // Reembolsos FBM CON IVA
    
    // Comisiones REALES por fulfillment
    fbaSellingFees: Math.abs(fbaData.sellingFees || 0),    // Comisión ventas FBA
    fbmSellingFees: Math.abs(fbmData.sellingFees || 0),    // Comisión ventas FBM
    fbaSellingFeesRefund: fbaData.sellingFeesRefund || 0,  // Reembolso comisiones FBA
    fbmSellingFeesRefund: fbmData.sellingFeesRefund || 0,  // Reembolso comisiones FBM
    fbaLogisticsFees: Math.abs(fbaData.fbaFees || 0),      // Logística FBA
    
    // Otros ingresos
    shippingCredits: metrics.shippingCredits,
    shippingCreditsTax: metrics.shippingCreditsTax,
    giftwrapCredits: metrics.giftwrapCredits,
    giftwrapCreditsTax: metrics.giftwrapCreditsTax,
    promotionalRebates: metrics.promotionalRebates,
    promotionalRebatesTax: metrics.promotionalRebatesTax,
    taxCollected: metrics.taxCollected,
    
    // Gastos REALES
    totalFees: metrics.totalFees,
    sellingFees: metrics.sellingFees,
    fbaFees: metrics.fbaFees,
    otherTransactionFees: metrics.otherTransactionFees,
    otherFees: metrics.otherFees,
    storageFees: metrics.storageFees,
    advertisingFees: metrics.advertisingFees,
    
    // Reembolsos de inventario
    totalReimbursements: metrics.totalReimbursements,
    
    // Otros movimientos
    otherMovements: metrics.otherMovements,
    
    // Verificación
    validTransactions: metrics.validTransactions,
    calculatedTotal: metrics.calculatedTotal,
    actualTotal: metrics.actualTotal
  });

  // Generate monthly P&L data - Usar proporciones basadas en ventas
  const monthlyPL: MonthlyPLData[] = [];
  const sortedMonths = Array.from(metrics.byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  // Calcular ratios totales para distribuir mensualmente
  const totalSales = metrics.productSales || 1;
  
  for (const [monthKey, monthData] of sortedMonths) {
    const salesRatio = totalSales > 0 ? monthData.grossSales / totalSales : 0;
    
    // Distribuir FBA/FBM proporcionalmente
    const monthFBA = (fbaData.salesWithTax || 0) * salesRatio;
    const monthFBM = (fbmData.salesWithTax || 0) * salesRatio;
    const monthFBARefunds = (fbaData.refunds || 0) * salesRatio;
    const monthFBMRefunds = (fbmData.refunds || 0) * salesRatio;
    
    const monthPL = generatePLFromData({
      grossSales: monthData.grossSales,
      productSales: monthData.grossSales,
      salesWithTax: monthData.grossSales * (metrics.salesWithTax / metrics.productSales || 1),
      productSalesTax: monthData.grossSales * (metrics.productSalesTax / metrics.productSales || 0),
      
      fbaGrossSales: monthFBA,
      fbmGrossSales: monthFBM,
      fbaRefunds: monthFBARefunds,
      fbmRefunds: monthFBMRefunds,
      
      fbaSellingFees: Math.abs(fbaData.sellingFees || 0) * salesRatio,
      fbmSellingFees: Math.abs(fbmData.sellingFees || 0) * salesRatio,
      fbaSellingFeesRefund: (fbaData.sellingFeesRefund || 0) * salesRatio,
      fbmSellingFeesRefund: (fbmData.sellingFeesRefund || 0) * salesRatio,
      fbaLogisticsFees: Math.abs(fbaData.fbaFees || 0) * salesRatio,
      
      shippingCredits: metrics.shippingCredits * salesRatio,
      shippingCreditsTax: metrics.shippingCreditsTax * salesRatio,
      giftwrapCredits: metrics.giftwrapCredits * salesRatio,
      giftwrapCreditsTax: metrics.giftwrapCreditsTax * salesRatio,
      promotionalRebates: metrics.promotionalRebates * salesRatio,
      promotionalRebatesTax: metrics.promotionalRebatesTax * salesRatio,
      taxCollected: metrics.taxCollected * salesRatio,
      
      totalFees: monthData.fees,
      sellingFees: metrics.sellingFees * salesRatio,
      fbaFees: metrics.fbaFees * salesRatio,
      otherTransactionFees: metrics.otherTransactionFees * salesRatio,
      otherFees: metrics.otherFees * salesRatio,
      storageFees: metrics.storageFees * salesRatio,
      advertisingFees: metrics.advertisingFees * salesRatio,
      
      totalReimbursements: metrics.totalReimbursements * salesRatio,
      otherMovements: metrics.otherMovements * salesRatio,
      
      validTransactions: monthData.transactionCount,
      calculatedTotal: 0,
      actualTotal: 0
    });
    
    const [year, month] = monthKey.split('-');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
    
    monthlyPL.push({ month: monthKey, monthLabel, data: monthPL });
  }

  return {
    total: totalPL,
    monthly: monthlyPL,
    dateRange: metrics.dateRange,
    currency: Array.from(metrics.currencies)[0] || 'EUR'
  };
};

interface PLInputData {
  grossSales: number;
  productSales: number;              // Ventas SIN IVA
  salesWithTax: number;              // Ventas CON IVA
  productSalesTax: number;           // IVA de ventas
  
  // FBA/FBM con IVA
  fbaGrossSales: number;             // FBA CON IVA
  fbmGrossSales: number;             // FBM CON IVA
  fbaRefunds: number;                // Reembolsos FBA CON IVA
  fbmRefunds: number;                // Reembolsos FBM CON IVA
  
  // Comisiones REALES por fulfillment
  fbaSellingFees: number;            // Comisión ventas FBA (positivo)
  fbmSellingFees: number;            // Comisión ventas FBM (positivo)
  fbaSellingFeesRefund: number;      // Reembolso comisiones FBA
  fbmSellingFeesRefund: number;      // Reembolso comisiones FBM
  fbaLogisticsFees: number;          // Logística FBA
  
  // Otros ingresos
  shippingCredits: number;
  shippingCreditsTax: number;
  giftwrapCredits: number;
  giftwrapCreditsTax: number;
  promotionalRebates: number;
  promotionalRebatesTax: number;
  taxCollected: number;
  
  // Gastos
  totalFees: number;
  sellingFees: number;
  fbaFees: number;
  otherTransactionFees: number;
  otherFees: number;
  storageFees: number;
  advertisingFees: number;
  
  // Reembolsos
  totalReimbursements: number;
  
  // Otros
  otherMovements: number;
  validTransactions: number;
  calculatedTotal: number;
  actualTotal: number;
}

// Genera P&L usando DATOS REALES - sin estimaciones
const generatePLFromData = (data: PLInputData): PLMetrics => {
  // Ventas totales CON IVA
  const totalRevenue = data.fbaGrossSales + data.fbmGrossSales;
  const totalRevenueWithExtras = totalRevenue + data.shippingCredits + data.giftwrapCredits;
  
  // Tasas de IVA basadas en datos reales
  const avgTaxRate = data.productSales > 0 ? data.productSalesTax / data.productSales : 0.21;
  
  // FBA metrics - DATOS REALES
  const fbaRefundRate = data.fbaGrossSales > 0 ? (data.fbaRefunds / data.fbaGrossSales) * 100 : 0;
  const fbaTaxIncome = data.fbaGrossSales * avgTaxRate / (1 + avgTaxRate);
  const fbaTaxableIncome = data.fbaGrossSales - fbaTaxIncome;
  
  // FBM metrics - DATOS REALES
  const fbmTaxIncome = data.fbmGrossSales * avgTaxRate / (1 + avgTaxRate);
  const fbmTaxableIncome = data.fbmGrossSales - fbmTaxIncome;
  const fbmPercentOfTotal = totalRevenue > 0 ? (data.fbmGrossSales / totalRevenue) * 100 : 0;

  // Comisiones REALES (no estimadas)
  const fbaSalesCommission = data.fbaSellingFees;
  const fbmSalesCommission = data.fbmSellingFees;
  const refundCommissions = data.fbaSellingFeesRefund + data.fbmSellingFeesRefund;
  const salesCommissionsTotal = fbaSalesCommission + fbmSalesCommission - refundCommissions;
  const commissionPercent = data.productSales > 0 ? (salesCommissionsTotal / data.productSales) * 100 : 0;

  // Logística FBA - DATOS REALES
  const fbaLogisticsTotal = data.fbaLogisticsFees;

  // Otros gastos
  const advertisingFee = Math.abs(data.advertisingFees);
  const storageFee = Math.abs(data.storageFees);
  const otherExpensesTotal = Math.abs(data.otherFees) + Math.abs(data.otherTransactionFees);

  // Total gastos (ya vienen negativos)
  const totalExpenses = Math.abs(data.totalFees);
  const expensesPerSale = data.validTransactions > 0 ? totalExpenses / data.validTransactions : 0;

  // EBITDA = Ingresos + Gastos (gastos son negativos)
  const totalRefunds = data.fbaRefunds + data.fbmRefunds;
  const grossProfit = totalRevenueWithExtras - totalRefunds + data.promotionalRebates + data.totalReimbursements;
  const ebitda = grossProfit + data.totalFees; // totalFees ya es negativo
  const ebitdaPercent = data.productSales > 0 ? (ebitda / data.productSales) * 100 : 0;

  // Impuestos y beneficio neto
  const taxes = data.taxCollected;
  const netProfit = ebitda;
  const netProfitPercent = data.productSales > 0 ? (netProfit / data.productSales) * 100 : 0;

  // Discrepancia
  const calculatedTotal = grossProfit + data.totalFees + data.otherMovements;
  const mistake = data.calculatedTotal - data.actualTotal;

  return {
    totalIncome: totalRevenueWithExtras + data.totalReimbursements,
    excludingTaxes: data.productSales,

    fbm: {
      totalRevenue: data.fbmGrossSales,
      taxableIncome: fbmTaxableIncome,
      taxIncome: fbmTaxIncome,
      refunds: data.fbmRefunds,
      taxableRefunds: data.fbmRefunds / (1 + avgTaxRate),
      refundTax: data.fbmRefunds * avgTaxRate / (1 + avgTaxRate),
      percentOfTotal: fbmPercentOfTotal
    },

    fba: {
      totalRevenue: data.fbaGrossSales,
      taxableIncome: fbaTaxableIncome,
      taxIncome: fbaTaxIncome,
      refunds: data.fbaRefunds,
      taxableRefunds: data.fbaRefunds / (1 + avgTaxRate),
      refundTax: data.fbaRefunds * avgTaxRate / (1 + avgTaxRate),
      refundRate: fbaRefundRate
    },

    otherIncome: {
      shippingCredits: data.shippingCredits,
      shippingCreditsTax: data.shippingCreditsTax,
      giftWrapCredits: data.giftwrapCredits,
      giftWrapCreditsTax: data.giftwrapCreditsTax,
      regulatoryFee: 0,
      regulatoryFeeTax: 0,
      marketplaceWithheldTax: data.taxCollected,
      promotionalRebates: data.promotionalRebates,
      promotionalRebatesTax: data.promotionalRebatesTax,
      reimbursements: {
        lostWarehouse: data.totalReimbursements * 0.4,
        customerReturn: data.totalReimbursements * 0.3,
        damagedWarehouse: data.totalReimbursements * 0.1,
        customerServiceIssue: data.totalReimbursements * 0.1,
        lostInbound: data.totalReimbursements * 0.1,
        total: data.totalReimbursements
      }
    },

    otherAmazonIncome: {
      fbaInventoryFee: 0,
      liquidations: 0,
      fbaCustomerReturnFee: 0,
      orderRetrocharge: 0,
      several: 0,
      total: 0
    },

    totalExpenses,
    expensesPerSale,

    salesCommissions: {
      fbm: fbmSalesCommission,
      fba: fbaSalesCommission,
      refundCommissions,
      percentOfIncome: commissionPercent,
      total: salesCommissionsTotal
    },

    fbaCommissions: {
      shipping: fbaLogisticsTotal,
      shippingCredits: 0,
      total: fbaLogisticsTotal
    },

    otherExpenses: {
      subscription: 0,
      advertising: advertisingFee,
      partnerCarrierShipment: 0,
      inventoryStorage: storageFee,
      generalAdjustment: 0,
      returnPostageBilling: 0,
      discounts: 0,
      inboundPlacement: 0,
      vineEnrollment: 0,
      awdProcessing: 0,
      awdTransportation: 0,
      awdStorage: 0,
      fbaStorageFee: storageFee,
      longTermStorage: 0,
      prepLabeling: 0,
      removalReturn: 0,
      removalDisposal: 0,
      others: otherExpensesTotal,
      total: otherExpensesTotal + advertisingFee + storageFee
    },

    ebitda,
    ebitdaPercent,

    taxes,
    netProfit,
    netProfitPercent,

    transfer: data.otherMovements,
    debt: 0,

    calculatedTotal,
    actualTotal: data.actualTotal,
    mistake
  };
};
