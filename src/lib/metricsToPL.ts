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

// Convert aggregated metrics to P&L structure matching the Bluco format
export const convertMetricsToPL = (metrics: AggregatedMetrics): PLResult => {
  // Get FBA and FBM data from fulfillment breakdown
  const fbaData = metrics.byFulfillment.get('FBA') || { grossSales: 0, fees: 0, refunds: 0, transactionCount: 0 };
  const fbmData = metrics.byFulfillment.get('FBM') || { grossSales: 0, fees: 0, refunds: 0, transactionCount: 0 };

  // Generate total P&L
  const totalPL = generatePLFromData({
    grossSales: metrics.grossSales,
    fbaGrossSales: fbaData.grossSales,
    fbmGrossSales: fbmData.grossSales,
    fbaFees: fbaData.fees,
    fbmFees: fbmData.fees,
    fbaRefunds: fbaData.refunds,
    fbmRefunds: fbmData.refunds,
    taxCollected: metrics.taxCollected,
    shippingCredits: metrics.shippingCredits,
    giftwrapCredits: metrics.giftwrapCredits,
    promotionalRebates: metrics.promotionalRebates,
    regulatoryFees: metrics.regulatoryFees,
    totalReimbursements: metrics.totalReimbursements,
    reimbursementLost: metrics.reimbursementLost,
    reimbursementDamaged: metrics.reimbursementDamaged,
    reimbursementOther: metrics.reimbursementOther,
    totalFees: metrics.totalFees,
    sellingFees: metrics.sellingFees,
    fbaFeesTotal: metrics.fbaFees,
    storageFees: metrics.storageFees,
    inboundFees: metrics.inboundFees,
    advertisingFees: metrics.advertisingFees,
    otherFees: metrics.otherFees,
    validTransactions: metrics.validTransactions,
    calculatedTotal: metrics.calculatedTotal,
    actualTotal: metrics.actualTotal
  });

  // Generate monthly P&L data
  const monthlyPL: MonthlyPLData[] = [];
  const sortedMonths = Array.from(metrics.byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [monthKey, monthData] of sortedMonths) {
    // Calculate FBA/FBM split for this month (estimate based on overall ratio)
    const fbaRatio = metrics.grossSales > 0 ? fbaData.grossSales / metrics.grossSales : 0.7;
    const fbmRatio = 1 - fbaRatio;
    
    const monthFbaGrossSales = monthData.grossSales * fbaRatio;
    const monthFbmGrossSales = monthData.grossSales * fbmRatio;
    const monthFbaFees = monthData.fees * fbaRatio;
    const monthFbmFees = monthData.fees * fbmRatio;
    const monthFbaRefunds = monthData.refunds * 0.65; // FBA typically has ~65% of refunds
    const monthFbmRefunds = monthData.refunds * 0.35;
    
    // Tax estimate
    const avgTaxRate = metrics.grossSales > 0 ? metrics.taxCollected / metrics.grossSales : 0;
    const monthTax = monthData.grossSales * avgTaxRate;
    
    // Other income estimates (proportional)
    const salesRatio = metrics.grossSales > 0 ? monthData.grossSales / metrics.grossSales : 0;
    const monthShippingCredits = metrics.shippingCredits * salesRatio;
    const monthGiftwrapCredits = metrics.giftwrapCredits * salesRatio;
    const monthPromotionalRebates = metrics.promotionalRebates * salesRatio;
    const monthRegulatory = metrics.regulatoryFees * salesRatio;
    const monthReimbursements = metrics.totalReimbursements * salesRatio;
    
    const monthPL = generatePLFromData({
      grossSales: monthData.grossSales,
      fbaGrossSales: monthFbaGrossSales,
      fbmGrossSales: monthFbmGrossSales,
      fbaFees: monthFbaFees,
      fbmFees: monthFbmFees,
      fbaRefunds: monthFbaRefunds,
      fbmRefunds: monthFbmRefunds,
      taxCollected: monthTax,
      shippingCredits: monthShippingCredits,
      giftwrapCredits: monthGiftwrapCredits,
      promotionalRebates: monthPromotionalRebates,
      regulatoryFees: monthRegulatory,
      totalReimbursements: monthReimbursements,
      reimbursementLost: metrics.reimbursementLost * salesRatio,
      reimbursementDamaged: metrics.reimbursementDamaged * salesRatio,
      reimbursementOther: metrics.reimbursementOther * salesRatio,
      totalFees: monthData.fees,
      sellingFees: metrics.sellingFees * salesRatio,
      fbaFeesTotal: metrics.fbaFees * salesRatio,
      storageFees: metrics.storageFees * salesRatio,
      inboundFees: metrics.inboundFees * salesRatio,
      advertisingFees: metrics.advertisingFees * salesRatio,
      otherFees: metrics.otherFees * salesRatio,
      validTransactions: monthData.transactionCount,
      calculatedTotal: monthData.netSales - monthData.fees,
      actualTotal: monthData.netSales - monthData.fees
    });
    
    // Format month label
    const [year, month] = monthKey.split('-');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
    
    monthlyPL.push({
      month: monthKey,
      monthLabel,
      data: monthPL
    });
  }

  return {
    total: totalPL,
    monthly: monthlyPL,
    dateRange: metrics.dateRange,
    currency: Array.from(metrics.currencies)[0] || 'USD'
  };
};

interface PLInputData {
  grossSales: number;
  fbaGrossSales: number;
  fbmGrossSales: number;
  fbaFees: number;
  fbmFees: number;
  fbaRefunds: number;
  fbmRefunds: number;
  taxCollected: number;
  shippingCredits: number;
  giftwrapCredits: number;
  promotionalRebates: number;
  regulatoryFees: number;
  totalReimbursements: number;
  reimbursementLost: number;
  reimbursementDamaged: number;
  reimbursementOther: number;
  totalFees: number;
  sellingFees: number;
  fbaFeesTotal: number;
  storageFees: number;
  inboundFees: number;
  advertisingFees: number;
  otherFees: number;
  validTransactions: number;
  calculatedTotal: number;
  actualTotal: number;
}

const generatePLFromData = (data: PLInputData): PLMetrics => {
  const totalRevenue = data.fbaGrossSales + data.fbmGrossSales;
  const totalTax = data.taxCollected;
  
  // Calculate tax income (estimated at average tax rate)
  const avgTaxRate = totalRevenue > 0 ? totalTax / totalRevenue : 0;
  
  // FBA metrics
  const fbaTaxIncome = data.fbaGrossSales * avgTaxRate;
  const fbaTaxableIncome = data.fbaGrossSales - fbaTaxIncome;
  const fbaRefundRate = data.fbaGrossSales > 0 ? (data.fbaRefunds / data.fbaGrossSales) * 100 : 0;
  
  // FBM metrics
  const fbmTaxIncome = data.fbmGrossSales * avgTaxRate;
  const fbmTaxableIncome = data.fbmGrossSales - fbmTaxIncome;
  const fbmPercentOfTotal = totalRevenue > 0 ? (data.fbmGrossSales / totalRevenue) * 100 : 0;

  // Sales commissions (typically ~15% referral)
  const fbaSalesCommission = data.fbaFees * 0.45; // Referral portion of FBA fees
  const fbmSalesCommission = data.fbmFees * 0.85; // Most FBM fees are referral
  const refundCommissions = (data.fbaRefunds + data.fbmRefunds) * 0.15 * 0.5; // Partial refund of commission
  const salesCommissionsTotal = fbaSalesCommission + fbmSalesCommission - refundCommissions;
  const commissionPercent = totalRevenue > 0 ? (salesCommissionsTotal / totalRevenue) * 100 : 0;

  // FBA commissions (shipping/fulfillment)
  const fbaShippingCommission = data.fbaFees * 0.55; // Fulfillment portion
  const fbaShippingCredits = 0; // Usually credits come back

  // Other expenses breakdown
  const subscriptionFee = 39.99; // Pro seller subscription
  const advertisingFee = data.advertisingFees;
  const storageFee = data.storageFees;
  const inboundFee = data.inboundFees;
  const otherExpensesTotal = data.otherFees + storageFee + inboundFee + data.regulatoryFees;

  // Total expenses
  const totalExpenses = data.totalFees;
  const expensesPerSale = data.validTransactions > 0 ? totalExpenses / data.validTransactions : 0;

  // EBITDA calculation
  const grossProfit = totalRevenue - (data.fbaRefunds + data.fbmRefunds) + data.totalReimbursements;
  const ebitda = grossProfit - totalExpenses;
  const ebitdaPercent = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

  // Taxes and net profit
  const taxes = data.taxCollected;
  const netProfit = ebitda - taxes;
  const netProfitPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Discrepancy check
  const calculatedTotal = grossProfit - totalExpenses - taxes;
  const mistake = data.calculatedTotal - data.actualTotal;

  return {
    totalIncome: totalRevenue + data.shippingCredits + data.giftwrapCredits + data.totalReimbursements,
    excludingTaxes: totalRevenue - totalTax + data.totalReimbursements,

    fbm: {
      totalRevenue: data.fbmGrossSales,
      taxableIncome: fbmTaxableIncome,
      taxIncome: fbmTaxIncome,
      refunds: data.fbmRefunds,
      taxableRefunds: data.fbmRefunds * (1 - avgTaxRate),
      refundTax: data.fbmRefunds * avgTaxRate,
      percentOfTotal: fbmPercentOfTotal
    },

    fba: {
      totalRevenue: data.fbaGrossSales,
      taxableIncome: fbaTaxableIncome,
      taxIncome: fbaTaxIncome,
      refunds: data.fbaRefunds,
      taxableRefunds: data.fbaRefunds * (1 - avgTaxRate),
      refundTax: data.fbaRefunds * avgTaxRate,
      refundRate: fbaRefundRate
    },

    otherIncome: {
      shippingCredits: data.shippingCredits,
      shippingCreditsTax: data.shippingCredits * avgTaxRate,
      giftWrapCredits: data.giftwrapCredits,
      giftWrapCreditsTax: data.giftwrapCredits * avgTaxRate,
      regulatoryFee: data.regulatoryFees,
      regulatoryFeeTax: 0,
      marketplaceWithheldTax: data.taxCollected,
      promotionalRebates: data.promotionalRebates,
      promotionalRebatesTax: 0,
      reimbursements: {
        lostWarehouse: data.reimbursementLost * 0.5,
        customerReturn: data.reimbursementOther * 0.5,
        damagedWarehouse: data.reimbursementDamaged,
        customerServiceIssue: data.reimbursementOther * 0.3,
        lostInbound: data.reimbursementLost * 0.5,
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
      shipping: fbaShippingCommission,
      shippingCredits: fbaShippingCredits,
      total: fbaShippingCommission - fbaShippingCredits
    },

    otherExpenses: {
      subscription: subscriptionFee,
      advertising: advertisingFee,
      partnerCarrierShipment: 0,
      inventoryStorage: storageFee,
      generalAdjustment: 0,
      returnPostageBilling: 0,
      discounts: 0,
      inboundPlacement: inboundFee,
      vineEnrollment: 0,
      awdProcessing: 0,
      awdTransportation: 0,
      awdStorage: 0,
      fbaStorageFee: storageFee,
      longTermStorage: 0,
      prepLabeling: 0,
      removalReturn: 0,
      removalDisposal: 0,
      others: data.otherFees,
      total: otherExpensesTotal
    },

    ebitda,
    ebitdaPercent,

    taxes,
    netProfit,
    netProfitPercent,

    transfer: 0, // Would need to track transfers separately
    debt: 0, // Would need to track debt separately

    calculatedTotal,
    actualTotal: data.actualTotal,
    mistake
  };
};
