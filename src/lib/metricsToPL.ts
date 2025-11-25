import { AggregatedMetrics } from './massiveFileProcessor';
import { PLMetrics } from '@/components/multi/PLDashboard';

// Convert aggregated metrics to P&L structure matching the Bluco format
export const convertMetricsToPL = (metrics: AggregatedMetrics): PLMetrics => {
  // Get FBA and FBM data from fulfillment breakdown
  const fbaData = metrics.byFulfillment.get('FBA') || { grossSales: 0, fees: 0, refunds: 0, transactionCount: 0 };
  const fbmData = metrics.byFulfillment.get('FBM') || { grossSales: 0, fees: 0, refunds: 0, transactionCount: 0 };

  const totalRevenue = fbaData.grossSales + fbmData.grossSales;
  const totalTax = metrics.taxCollected;
  
  // Calculate tax income (estimated at average tax rate)
  const avgTaxRate = totalRevenue > 0 ? totalTax / totalRevenue : 0;
  
  // FBA metrics
  const fbaTaxIncome = fbaData.grossSales * avgTaxRate;
  const fbaTaxableIncome = fbaData.grossSales - fbaTaxIncome;
  const fbaRefundRate = fbaData.grossSales > 0 ? (fbaData.refunds / fbaData.grossSales) * 100 : 0;
  
  // FBM metrics
  const fbmTaxIncome = fbmData.grossSales * avgTaxRate;
  const fbmTaxableIncome = fbmData.grossSales - fbmTaxIncome;
  const fbmPercentOfTotal = totalRevenue > 0 ? (fbmData.grossSales / totalRevenue) * 100 : 0;

  // Sales commissions (typically ~15% referral)
  const fbaSalesCommission = fbaData.fees * 0.45; // Referral portion of FBA fees
  const fbmSalesCommission = fbmData.fees * 0.85; // Most FBM fees are referral
  const refundCommissions = (fbaData.refunds + fbmData.refunds) * 0.15 * 0.5; // Partial refund of commission
  const salesCommissionsTotal = fbaSalesCommission + fbmSalesCommission - refundCommissions;
  const commissionPercent = totalRevenue > 0 ? (salesCommissionsTotal / totalRevenue) * 100 : 0;

  // FBA commissions (shipping/fulfillment)
  const fbaShippingCommission = fbaData.fees * 0.55; // Fulfillment portion
  const fbaShippingCredits = 0; // Usually credits come back

  // Other expenses breakdown
  const subscriptionFee = 39.99; // Pro seller subscription
  const advertisingFee = metrics.advertisingFees;
  const storageFee = metrics.storageFees;
  const inboundFee = metrics.inboundFees;
  const otherExpensesTotal = metrics.otherFees + storageFee + inboundFee + metrics.regulatoryFees;

  // Total expenses
  const totalExpenses = metrics.totalFees;
  const expensesPerSale = metrics.validTransactions > 0 ? totalExpenses / metrics.validTransactions : 0;

  // EBITDA calculation
  const grossProfit = totalRevenue - metrics.totalRefunds + metrics.totalReimbursements;
  const ebitda = grossProfit - totalExpenses;
  const ebitdaPercent = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

  // Taxes and net profit
  const taxes = metrics.taxCollected;
  const netProfit = ebitda - taxes;
  const netProfitPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Discrepancy check
  const calculatedTotal = grossProfit - totalExpenses - taxes;
  const actualTotal = metrics.actualTotal;
  const mistake = metrics.calculatedTotal - metrics.actualTotal;

  return {
    totalIncome: totalRevenue + metrics.shippingCredits + metrics.giftwrapCredits + metrics.totalReimbursements,
    excludingTaxes: totalRevenue - totalTax + metrics.totalReimbursements,

    fbm: {
      totalRevenue: fbmData.grossSales,
      taxableIncome: fbmTaxableIncome,
      taxIncome: fbmTaxIncome,
      refunds: fbmData.refunds,
      taxableRefunds: fbmData.refunds * (1 - avgTaxRate),
      refundTax: fbmData.refunds * avgTaxRate,
      percentOfTotal: fbmPercentOfTotal
    },

    fba: {
      totalRevenue: fbaData.grossSales,
      taxableIncome: fbaTaxableIncome,
      taxIncome: fbaTaxIncome,
      refunds: fbaData.refunds,
      taxableRefunds: fbaData.refunds * (1 - avgTaxRate),
      refundTax: fbaData.refunds * avgTaxRate,
      refundRate: fbaRefundRate
    },

    otherIncome: {
      shippingCredits: metrics.shippingCredits,
      shippingCreditsTax: metrics.shippingCredits * avgTaxRate,
      giftWrapCredits: metrics.giftwrapCredits,
      giftWrapCreditsTax: metrics.giftwrapCredits * avgTaxRate,
      regulatoryFee: metrics.regulatoryFees,
      regulatoryFeeTax: 0,
      marketplaceWithheldTax: metrics.taxCollected,
      promotionalRebates: metrics.promotionalRebates,
      promotionalRebatesTax: 0,
      reimbursements: {
        lostWarehouse: metrics.reimbursementLost * 0.5,
        customerReturn: metrics.reimbursementOther * 0.5,
        damagedWarehouse: metrics.reimbursementDamaged,
        customerServiceIssue: metrics.reimbursementOther * 0.3,
        lostInbound: metrics.reimbursementLost * 0.5,
        total: metrics.totalReimbursements
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
      others: metrics.otherFees,
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
    actualTotal,
    mistake
  };
};
