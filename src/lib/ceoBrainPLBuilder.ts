/**
 * CEO BRAIN - AMAZON P&L BUILDER MENSUAL
 * 
 * Construye automáticamente una P&L mensual desde un fichero de transacciones de Amazon
 * siguiendo la estructura de la tabla ARCOS USA (Bluco format)
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ============= INTERFACES =============

export interface PLRow {
  concept: string;
  level: number; // 0 = header, 1 = main category, 2 = subcategory, 3 = detail
  isHeader: boolean;
  totalYear: number;
  months: Record<number, number>; // 1-12
  percentOfIncome?: number;
  highlight?: 'positive' | 'negative' | 'neutral' | 'warning';
}

export interface MonthlyPLTable {
  rows: PLRow[];
  year: number;
  currency: string;
  dateRange: { min: Date | null; max: Date | null };
  totalIncome: number;
  totalExpenses: number;
  ebitda: number;
  netProfit: number;
  mistake: number;
  missingData: string[];
  executiveSummary: ExecutiveSummary;
}

export interface ExecutiveSummary {
  bestIncomeMonth: { month: number; value: number };
  worstIncomeMonth: { month: number; value: number };
  highestFeesMonth: { month: number; value: number };
  ebitdaTrend: 'up' | 'down' | 'stable';
  largestMistakeMonth: { month: number; value: number };
  avgRefundRate: number;
  avgFeeRate: number;
  recommendations: string[];
}

// Estructura para agregación mensual detallada
interface MonthlyAggregation {
  // Ingresos
  productSales: number;
  productSalesTax: number;
  shippingCredits: number;
  shippingCreditsTax: number;
  giftwrapCredits: number;
  giftwrapCreditsTax: number;
  promotionalRebates: number;
  promotionalRebatesTax: number;
  regulatoryFee: number;
  regulatoryFeeTax: number;
  marketplaceWithheldTax: number;
  
  // FBA/FBM ventas
  fbaProductSales: number;
  fbmProductSales: number;
  fbaRefunds: number;
  fbmRefunds: number;
  
  // Reembolsos de inventario
  reimbLostWarehouse: number;
  reimbCustomerReturn: number;
  reimbDamagedWarehouse: number;
  reimbCustomerService: number;
  reimbLostInbound: number;
  reimbGeneralAdjustment: number;
  
  // Otros ingresos Amazon
  fbaInventoryFee: number;
  liquidations: number;
  fbaCustomerReturnFee: number;
  orderRetrocharge: number;
  
  // Gastos
  sellingFees: number;
  fbaFees: number;
  otherTransactionFees: number;
  subscriptionFee: number;
  advertisingCost: number;
  storageFeeFBA: number;
  longTermStorage: number;
  removalReturn: number;
  removalDisposal: number;
  inboundPlacement: number;
  awdStorage: number;
  awdProcessing: number;
  awdTransportation: number;
  vineFee: number;
  partnerCarrierShipment: number;
  returnPostageBilling: number;
  discounts: number;
  prepLabeling: number;
  
  // Totales
  total: number;
  transactionCount: number;
  orderCount: number;
}

// ============= COLUMN MAPPINGS =============

const COLUMN_MAP: Record<string, string[]> = {
  // Fecha
  date: [
    'date/time', 'fecha y hora', 'fecha', 'datetime', 'date', 
    'posted-date', 'settlement-start-date', 'transaction-date'
  ],
  
  // Identificadores
  settlementId: ['settlement id', 'identificador de pago', 'settlement-id', 'payment-id'],
  type: ['type', 'tipo', 'transaction-type', 'transaction type'],
  orderId: ['order id', 'número de pedido', 'order-id', 'orderid'],
  sku: ['sku', 'merchant-sku', 'seller-sku'],
  description: ['description', 'descripción', 'amount-description'],
  fulfillment: ['fulfillment', 'gestión logística', 'fulfillment-channel'],
  
  // Ingresos
  productSales: ['product sales', 'ventas de productos'],
  productSalesTax: ['product sales tax', 'impuesto de ventas de productos'],
  shippingCredits: ['shipping credits', 'abonos de envío'],
  shippingCreditsTax: ['shipping credits tax', 'impuestos por abonos de envío'],
  giftwrapCredits: ['giftwrap credits', 'abonos de envoltorio para regalo'],
  giftwrapCreditsTax: ['giftwrap credits tax', 'impuestos por envoltorio para regalo'],
  promotionalRebates: ['promotional rebates', 'devoluciones promocionales'],
  promotionalRebatesTax: ['promotional rebates tax', 'impuestos de descuentos por promociones'],
  regulatoryFee: ['regulatory fee', 'regulatory fee'],
  regulatoryFeeTax: ['tax on regulatory fee', 'tax on regulatory fee'],
  marketplaceWithheldTax: ['marketplace withheld tax', 'impuesto retenido en el sitio web'],
  
  // Gastos Amazon
  sellingFees: ['selling fees', 'tarifas de venta'],
  fbaFees: ['fba fees', 'tarifas de logística de amazon'],
  otherTransactionFees: ['other transaction fees', 'tarifas de otras transacciones'],
  other: ['other', 'otro'],
  
  // Total
  total: ['total', 'importe total']
};

// Patrones para clasificar por descripción
const DESCRIPTION_PATTERNS: Record<string, string[]> = {
  // Reembolsos de inventario
  reimbLostWarehouse: ['fba inventory reimbursement - lost:warehouse', 'lost:warehouse'],
  reimbCustomerReturn: ['fba inventory reimbursement - customer return', 'customer return'],
  reimbDamagedWarehouse: ['fba inventory reimbursement - damaged:warehouse', 'damaged:warehouse'],
  reimbCustomerService: ['fba inventory reimbursement - customer service issue', 'customer service'],
  reimbLostInbound: ['fba inventory reimbursement - lost:inbound', 'lost:inbound'],
  reimbGeneralAdjustment: ['fba inventory reimbursement - general adjustment', 'general adjustment'],
  
  // Gastos específicos
  subscription: ['subscription'],
  advertising: ['cost of advertising', 'advertising'],
  storageFBA: ['fba inventory storage fee', 'fba storage fee', 'storage fee'],
  longTermStorage: ['fba long-term storage fee', 'long-term storage'],
  removalReturn: ['fba removal order: return fee', 'removal order: return'],
  removalDisposal: ['fba removal order: disposal fee', 'removal order: disposal'],
  inboundPlacement: ['fba inbound placement service fee', 'inbound placement'],
  awdStorage: ['awd storage fee'],
  awdProcessing: ['awd processing fee'],
  awdTransportation: ['awd transportation fee'],
  vineFee: ['vine enrollment fee'],
  partnerCarrier: ['fba amazon-partnered carrier shipment fee', 'partnered carrier'],
  returnPostage: ['returnpostagebilling', 'return postage'],
  discounts: ['discounts'],
  prepLabeling: ['fba prep fee: labeling', 'prep fee'],
  
  // Otros ingresos
  liquidation: ['liquidation'],
  retrocharge: ['retrocharge', 'order_retrocharge'],
  fbaCustomerReturnFee: ['fba customer return fee']
};

// ============= HELPER FUNCTIONS =============

const createEmptyMonthlyAggregation = (): MonthlyAggregation => ({
  productSales: 0,
  productSalesTax: 0,
  shippingCredits: 0,
  shippingCreditsTax: 0,
  giftwrapCredits: 0,
  giftwrapCreditsTax: 0,
  promotionalRebates: 0,
  promotionalRebatesTax: 0,
  regulatoryFee: 0,
  regulatoryFeeTax: 0,
  marketplaceWithheldTax: 0,
  fbaProductSales: 0,
  fbmProductSales: 0,
  fbaRefunds: 0,
  fbmRefunds: 0,
  reimbLostWarehouse: 0,
  reimbCustomerReturn: 0,
  reimbDamagedWarehouse: 0,
  reimbCustomerService: 0,
  reimbLostInbound: 0,
  reimbGeneralAdjustment: 0,
  fbaInventoryFee: 0,
  liquidations: 0,
  fbaCustomerReturnFee: 0,
  orderRetrocharge: 0,
  sellingFees: 0,
  fbaFees: 0,
  otherTransactionFees: 0,
  subscriptionFee: 0,
  advertisingCost: 0,
  storageFeeFBA: 0,
  longTermStorage: 0,
  removalReturn: 0,
  removalDisposal: 0,
  inboundPlacement: 0,
  awdStorage: 0,
  awdProcessing: 0,
  awdTransportation: 0,
  vineFee: 0,
  partnerCarrierShipment: 0,
  returnPostageBilling: 0,
  discounts: 0,
  prepLabeling: 0,
  total: 0,
  transactionCount: 0,
  orderCount: 0
});

// Detectar si es fila de cabecera
const isHeaderRow = (row: string[]): boolean => {
  const normalized = row.map(h => (h || '').toLowerCase().trim());
  const headerIndicators = [
    'date/time', 'fecha y hora', 'settlement id', 'identificador de pago',
    'type', 'tipo', 'order id', 'número de pedido', 'sku', 'description',
    'descripción', 'product sales', 'ventas de productos', 'selling fees',
    'tarifas de venta', 'fba fees', 'tarifas de logística', 'total'
  ];
  
  let matches = 0;
  for (const indicator of headerIndicators) {
    if (normalized.some(h => h.includes(indicator) || h === indicator)) {
      matches++;
    }
  }
  return matches >= 3;
};

// Encontrar columna estándar
const findColumn = (header: string, columnMap: Map<string, number>): number | null => {
  const normalized = header.toLowerCase().trim();
  
  for (const [standard, patterns] of Object.entries(COLUMN_MAP)) {
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.includes(pattern)) {
        return columnMap.get(standard) ?? null;
      }
    }
  }
  return null;
};

// Parsear valor numérico (soporta formato europeo)
const parseNumeric = (value: unknown): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  let str = String(value).trim();
  str = str.replace(/[€$£¥₹]/g, '');
  
  // Detectar formato europeo (1.234,56)
  const hasCommaDecimal = /\d,\d{1,2}$/.test(str);
  const hasDotThousand = /\d\.\d{3}/.test(str);
  
  if (hasCommaDecimal || hasDotThousand) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  
  str = str.replace(/\s/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Parsear fecha
const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const str = String(value).trim();
  
  // Formato español: "2 oct 2025 15:04:50 UTC"
  const spanishMonths: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  
  const spanishMatch = str.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/i);
  if (spanishMatch) {
    const [, day, month, year] = spanishMatch;
    const monthNum = spanishMonths[month.toLowerCase()];
    if (monthNum !== undefined) {
      return new Date(parseInt(year), monthNum, parseInt(day));
    }
  }
  
  // Parseo estándar
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  return null;
};

// Detectar FBA/FBM
const detectFulfillment = (value: string): 'FBA' | 'FBM' | 'Unknown' => {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('amazon') || normalized.includes('fba') || normalized === 'afn') {
    return 'FBA';
  }
  if (normalized.includes('vendedor') || normalized.includes('merchant') || normalized.includes('fbm') || normalized === 'mfn') {
    return 'FBM';
  }
  return 'Unknown';
};

// Detectar tipo de transacción
const detectTransactionType = (type: string, productSales: number): 'Order' | 'Refund' | 'Fee' | 'Other' => {
  const normalized = type.toLowerCase().trim();
  if (normalized.includes('reembolso') || normalized.includes('refund')) return 'Refund';
  if (normalized.includes('pedido') || normalized.includes('order')) return 'Order';
  if (normalized.includes('tarifa') || normalized.includes('fee')) return 'Fee';
  if (productSales < 0) return 'Refund';
  return 'Other';
};

// Clasificar por descripción
const classifyByDescription = (description: string): string | null => {
  const normalized = description.toLowerCase().trim();
  
  for (const [category, patterns] of Object.entries(DESCRIPTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return category;
      }
    }
  }
  return null;
};

// ============= MAIN PROCESSING =============

interface ProcessingResult {
  monthlyData: Map<number, MonthlyAggregation>;
  year: number;
  currency: string;
  dateRange: { min: Date | null; max: Date | null };
  missingColumns: string[];
  totalRows: number;
  validRows: number;
}

const processTransactions = (
  data: unknown[][],
  headers: string[]
): ProcessingResult => {
  // Crear mapa de columnas
  const columnMap = new Map<string, number>();
  
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    for (const [standard, patterns] of Object.entries(COLUMN_MAP)) {
      for (const pattern of patterns) {
        if (normalized === pattern || normalized.includes(pattern)) {
          if (!columnMap.has(standard)) {
            columnMap.set(standard, index);
          }
        }
      }
    }
  });
  
  // Detectar columnas faltantes
  const requiredColumns = ['date', 'type', 'productSales', 'total'];
  const missingColumns = requiredColumns.filter(col => !columnMap.has(col));
  
  console.log('[CEO Brain] Column map:', Object.fromEntries(columnMap));
  console.log('[CEO Brain] Missing columns:', missingColumns);
  
  // Inicializar agregaciones mensuales (1-12)
  const monthlyData = new Map<number, MonthlyAggregation>();
  for (let m = 1; m <= 12; m++) {
    monthlyData.set(m, createEmptyMonthlyAggregation());
  }
  
  let year = new Date().getFullYear();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let currency = 'USD';
  let totalRows = 0;
  let validRows = 0;
  
  // Helpers para obtener valores
  const getValue = (row: unknown[], col: string): unknown => {
    const idx = columnMap.get(col);
    return idx !== undefined ? row[idx] : undefined;
  };
  
  const getNumeric = (row: unknown[], col: string): number => {
    return parseNumeric(getValue(row, col));
  };
  
  const getString = (row: unknown[], col: string): string => {
    const val = getValue(row, col);
    return val ? String(val).trim() : '';
  };
  
  // Procesar cada fila
  for (const row of data) {
    totalRows++;
    
    // Validar fila
    const dateVal = getValue(row, 'date');
    const typeVal = getString(row, 'type');
    
    if (!dateVal || !typeVal) continue;
    
    const date = parseDate(dateVal);
    if (!date) continue;
    
    validRows++;
    
    // Actualizar rango de fechas
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
    year = date.getFullYear();
    
    // Obtener mes (1-12)
    const month = date.getMonth() + 1;
    const monthAgg = monthlyData.get(month)!;
    
    // Obtener valores de la fila
    const productSales = getNumeric(row, 'productSales');
    const productSalesTax = getNumeric(row, 'productSalesTax');
    const shippingCredits = getNumeric(row, 'shippingCredits');
    const shippingCreditsTax = getNumeric(row, 'shippingCreditsTax');
    const giftwrapCredits = getNumeric(row, 'giftwrapCredits');
    const giftwrapCreditsTax = getNumeric(row, 'giftwrapCreditsTax');
    const promotionalRebates = Math.abs(getNumeric(row, 'promotionalRebates'));
    const promotionalRebatesTax = getNumeric(row, 'promotionalRebatesTax');
    const regulatoryFee = getNumeric(row, 'regulatoryFee');
    const regulatoryFeeTax = getNumeric(row, 'regulatoryFeeTax');
    const marketplaceWithheldTax = getNumeric(row, 'marketplaceWithheldTax');
    const sellingFees = Math.abs(getNumeric(row, 'sellingFees'));
    const fbaFees = Math.abs(getNumeric(row, 'fbaFees'));
    const otherTransactionFees = Math.abs(getNumeric(row, 'otherTransactionFees'));
    const otherFees = Math.abs(getNumeric(row, 'other'));
    const total = getNumeric(row, 'total');
    
    const fulfillment = detectFulfillment(getString(row, 'fulfillment'));
    const transactionType = detectTransactionType(typeVal, productSales);
    const description = getString(row, 'description');
    const descCategory = classifyByDescription(description);
    
    // Clasificar ventas por FBA/FBM
    if (transactionType === 'Order' && productSales > 0) {
      if (fulfillment === 'FBA') {
        monthAgg.fbaProductSales += productSales;
      } else {
        monthAgg.fbmProductSales += productSales;
      }
      monthAgg.orderCount++;
    }
    
    // Clasificar reembolsos por FBA/FBM
    if (transactionType === 'Refund' || productSales < 0) {
      const refundAmount = Math.abs(productSales);
      if (fulfillment === 'FBA') {
        monthAgg.fbaRefunds += refundAmount;
      } else {
        monthAgg.fbmRefunds += refundAmount;
      }
    }
    
    // Acumular ingresos básicos
    if (productSales > 0) {
      monthAgg.productSales += productSales;
      monthAgg.productSalesTax += productSalesTax;
    }
    monthAgg.shippingCredits += shippingCredits;
    monthAgg.shippingCreditsTax += shippingCreditsTax;
    monthAgg.giftwrapCredits += giftwrapCredits;
    monthAgg.giftwrapCreditsTax += giftwrapCreditsTax;
    monthAgg.promotionalRebates += promotionalRebates;
    monthAgg.promotionalRebatesTax += promotionalRebatesTax;
    monthAgg.regulatoryFee += regulatoryFee;
    monthAgg.regulatoryFeeTax += regulatoryFeeTax;
    monthAgg.marketplaceWithheldTax += marketplaceWithheldTax;
    
    // Gastos básicos
    monthAgg.sellingFees += sellingFees;
    monthAgg.fbaFees += fbaFees;
    monthAgg.otherTransactionFees += otherTransactionFees + otherFees;
    
    // Clasificar por descripción
    if (descCategory) {
      switch (descCategory) {
        case 'reimbLostWarehouse': monthAgg.reimbLostWarehouse += Math.abs(total); break;
        case 'reimbCustomerReturn': monthAgg.reimbCustomerReturn += Math.abs(total); break;
        case 'reimbDamagedWarehouse': monthAgg.reimbDamagedWarehouse += Math.abs(total); break;
        case 'reimbCustomerService': monthAgg.reimbCustomerService += Math.abs(total); break;
        case 'reimbLostInbound': monthAgg.reimbLostInbound += Math.abs(total); break;
        case 'reimbGeneralAdjustment': monthAgg.reimbGeneralAdjustment += Math.abs(total); break;
        case 'subscription': monthAgg.subscriptionFee += Math.abs(total); break;
        case 'advertising': monthAgg.advertisingCost += Math.abs(total); break;
        case 'storageFBA': monthAgg.storageFeeFBA += Math.abs(total); break;
        case 'longTermStorage': monthAgg.longTermStorage += Math.abs(total); break;
        case 'removalReturn': monthAgg.removalReturn += Math.abs(total); break;
        case 'removalDisposal': monthAgg.removalDisposal += Math.abs(total); break;
        case 'inboundPlacement': monthAgg.inboundPlacement += Math.abs(total); break;
        case 'awdStorage': monthAgg.awdStorage += Math.abs(total); break;
        case 'awdProcessing': monthAgg.awdProcessing += Math.abs(total); break;
        case 'awdTransportation': monthAgg.awdTransportation += Math.abs(total); break;
        case 'vineFee': monthAgg.vineFee += Math.abs(total); break;
        case 'partnerCarrier': monthAgg.partnerCarrierShipment += Math.abs(total); break;
        case 'returnPostage': monthAgg.returnPostageBilling += Math.abs(total); break;
        case 'discounts': monthAgg.discounts += Math.abs(total); break;
        case 'prepLabeling': monthAgg.prepLabeling += Math.abs(total); break;
        case 'liquidation': monthAgg.liquidations += Math.abs(total); break;
        case 'retrocharge': monthAgg.orderRetrocharge += total; break;
        case 'fbaCustomerReturnFee': monthAgg.fbaCustomerReturnFee += Math.abs(total); break;
      }
    }
    
    monthAgg.total += total;
    monthAgg.transactionCount++;
  }
  
  return {
    monthlyData,
    year,
    currency,
    dateRange: { min: minDate, max: maxDate },
    missingColumns,
    totalRows,
    validRows
  };
};

// ============= BUILD P&L TABLE =============

const buildPLTable = (result: ProcessingResult): MonthlyPLTable => {
  const { monthlyData, year, currency, dateRange, missingColumns } = result;
  const rows: PLRow[] = [];
  
  // Helper para crear fila
  const addRow = (
    concept: string,
    level: number,
    getMonthValue: (m: MonthlyAggregation) => number,
    options: { isHeader?: boolean; highlight?: 'positive' | 'negative' | 'neutral' | 'warning' } = {}
  ) => {
    const months: Record<number, number> = {};
    let totalYear = 0;
    
    for (let m = 1; m <= 12; m++) {
      const agg = monthlyData.get(m)!;
      const value = getMonthValue(agg);
      months[m] = value;
      totalYear += value;
    }
    
    rows.push({
      concept,
      level,
      isHeader: options.isHeader || false,
      totalYear,
      months,
      highlight: options.highlight
    });
    
    return totalYear;
  };
  
  // ===== TOTAL INCOME =====
  addRow('TOTAL INCOME', 0, () => 0, { isHeader: true });
  
  // Calcular totales para % y EBITDA
  let totalIncome = 0;
  let totalExpenses = 0;
  
  // EXCLUDING TAXES (Total sin impuestos)
  const excludingTaxes = addRow('EXCLUDING TAXES', 1, (m) =>
    m.productSales - m.productSalesTax + 
    m.shippingCredits - m.shippingCreditsTax + 
    m.giftwrapCredits - m.giftwrapCreditsTax
  );
  
  // TOTAL SALES REVENUE
  addRow('TOTAL SALES REVENUE', 1, () => 0, { isHeader: true });
  
  // FBM Sales Section
  addRow('FBM Sales', 2, () => 0, { isHeader: true });
  addRow('Total revenue', 3, (m) => m.fbmProductSales);
  addRow('B.Taxable Income', 3, (m) => m.fbmProductSales * 0.9); // Estimado
  addRow('Tax Income', 3, (m) => m.fbmProductSales * 0.1);
  addRow('Refunds', 3, (m) => -m.fbmRefunds, { highlight: 'negative' });
  addRow('B.Taxable Refunds', 3, (m) => -m.fbmRefunds * 0.9);
  addRow('Refund Tax', 3, (m) => -m.fbmRefunds * 0.1);
  
  // % Total Revenue
  const totalFbmSales = Array.from(monthlyData.values()).reduce((s, m) => s + m.fbmProductSales, 0);
  const totalProductSales = Array.from(monthlyData.values()).reduce((s, m) => s + m.productSales, 0);
  const fbmPercent = totalProductSales > 0 ? (totalFbmSales / totalProductSales) * 100 : 0;
  addRow('% Total Revenue', 3, (m) => {
    const monthTotal = m.fbaProductSales + m.fbmProductSales;
    return monthTotal > 0 ? (m.fbmProductSales / monthTotal) * 100 : 0;
  });
  
  // FBA Sales Section
  addRow('FBA Sales', 2, () => 0, { isHeader: true });
  addRow('Total revenue', 3, (m) => m.fbaProductSales);
  addRow('B.Taxable Income', 3, (m) => m.fbaProductSales * 0.9);
  addRow('Tax Income', 3, (m) => m.fbaProductSales * 0.1);
  addRow('Refunds', 3, (m) => -m.fbaRefunds, { highlight: 'negative' });
  addRow('B.Taxable Refunds', 3, (m) => -m.fbaRefunds * 0.9);
  addRow('REFUND Tax', 3, (m) => -m.fbaRefunds * 0.1);
  
  // % of refunds on sales
  addRow('% of refunds on sales', 3, (m) => {
    return m.fbaProductSales > 0 ? (m.fbaRefunds / m.fbaProductSales) * 100 : 0;
  });
  
  // OTHER INCOME FROM SALES
  addRow('OTHER INCOME FROM SALES', 1, () => 0, { isHeader: true });
  addRow('shipping credits', 3, (m) => m.shippingCredits);
  addRow('shipping credits tax', 3, (m) => m.shippingCreditsTax);
  addRow('gift wrap credits', 3, (m) => m.giftwrapCredits);
  addRow('giftwrap credits tax', 3, (m) => m.giftwrapCreditsTax);
  addRow('Regulatory Fee', 3, (m) => m.regulatoryFee);
  addRow('Tax On Regulatory Fee', 3, (m) => m.regulatoryFeeTax);
  addRow('marketplace withheld tax', 3, (m) => m.marketplaceWithheldTax);
  addRow('promotional rebates', 3, (m) => -m.promotionalRebates, { highlight: 'negative' });
  
  // FBA Inventory Reimbursements
  addRow('FBA Inventory Reimbursement - Lost:Warehouse', 3, (m) => m.reimbLostWarehouse, { highlight: 'positive' });
  addRow('FBA Inventory Reimbursement - Customer Return', 3, (m) => m.reimbCustomerReturn, { highlight: 'positive' });
  addRow('FBA Inventory Reimbursement - Damaged:Warehouse', 3, (m) => m.reimbDamagedWarehouse, { highlight: 'positive' });
  addRow('FBA Inventory Reimbursement - Customer Service Issue', 3, (m) => m.reimbCustomerService, { highlight: 'positive' });
  addRow('FBA Inventory Reimbursement - Lost:Inbound', 3, (m) => m.reimbLostInbound, { highlight: 'positive' });
  addRow('promotional rebates tax', 3, (m) => m.promotionalRebatesTax);
  
  // OTHER AMAZON INCOME
  addRow('OTHER AMAZON INCOME', 1, () => 0, { isHeader: true });
  addRow('Several', 3, (m) => 0); // Placeholder
  addRow('FBA Inventory Fee', 3, (m) => m.fbaInventoryFee);
  addRow('Liquidations', 3, (m) => m.liquidations);
  addRow('FBA Customer Return Fee', 3, (m) => m.fbaCustomerReturnFee);
  addRow('Order_Retrocharge', 3, (m) => m.orderRetrocharge);
  
  // Calcular TOTAL INCOME
  totalIncome = Array.from(monthlyData.values()).reduce((s, m) => 
    s + m.productSales + m.shippingCredits + m.giftwrapCredits + 
    m.reimbLostWarehouse + m.reimbCustomerReturn + m.reimbDamagedWarehouse + 
    m.reimbCustomerService + m.reimbLostInbound + m.liquidations
  , 0);
  
  // ===== TOTAL EXPENSES =====
  addRow('', 0, () => 0, { isHeader: true }); // Spacer
  addRow('TOTAL EXPENSES', 0, () => 0, { isHeader: true });
  
  // TOTAL EXPENSES PER SALE
  addRow('TOTAL EXPENSES PER SALE', 1, () => 0, { isHeader: true });
  
  // Sales Commissions
  addRow('Sales Commissions (15.45%)', 2, () => 0, { isHeader: true });
  addRow('FBM Sales Commission', 3, (m) => m.fbmProductSales * 0.1545);
  addRow('FBA Sales Commission', 3, (m) => m.fbaProductSales * 0.1545);
  addRow('Refund Commissions', 3, (m) => (m.fbaRefunds + m.fbmRefunds) * 0.1545 * -0.5, { highlight: 'positive' });
  addRow('% of Income', 3, (m) => {
    const income = m.fbaProductSales + m.fbmProductSales;
    const commission = (m.fbmProductSales + m.fbaProductSales) * 0.1545;
    return income > 0 ? (commission / income) * 100 : 0;
  });
  
  // FBA Commissions
  addRow('FBA Commissions', 2, () => 0, { isHeader: true });
  addRow('FBA Shipping Commission', 3, (m) => m.fbaFees, { highlight: 'negative' });
  addRow('FBA Shipping Commission Credits', 3, (m) => 0);
  
  // Other expenses
  addRow('Other expenses', 2, () => 0, { isHeader: true });
  addRow('Total amount other expenses', 3, (m) => 
    m.subscriptionFee + m.advertisingCost + m.storageFeeFBA + m.longTermStorage + 
    m.inboundPlacement + m.removalReturn + m.removalDisposal + m.partnerCarrierShipment + 
    m.returnPostageBilling + m.vineFee + m.awdStorage + m.awdProcessing + 
    m.awdTransportation + m.prepLabeling + m.discounts + m.reimbGeneralAdjustment + 
    m.otherTransactionFees
  , { highlight: 'negative' });
  addRow('Subscription', 3, (m) => m.subscriptionFee);
  addRow('Cost of Advertising', 3, (m) => m.advertisingCost);
  addRow('FBA Amazon-Partnered Carrier Shipment Fee', 3, (m) => m.partnerCarrierShipment);
  addRow('FBA Inventory Storage Fee', 3, (m) => m.storageFeeFBA);
  addRow('FBA Inventory Reimbursement - General Adjustment', 3, (m) => m.reimbGeneralAdjustment);
  addRow('ReturnPostageBilling', 3, (m) => m.returnPostageBilling);
  addRow('Discounts', 3, (m) => m.discounts);
  addRow('FBA Inbound Placement Service Fee', 3, (m) => m.inboundPlacement);
  addRow('Vine Enrollment Fee', 3, (m) => m.vineFee);
  addRow('AWD Processing Fee', 3, (m) => m.awdProcessing);
  addRow('AWD Transportation Fee', 3, (m) => m.awdTransportation);
  addRow('AWD Storage Fee', 3, (m) => m.awdStorage);
  addRow('Adjustment', 3, (m) => 0);
  addRow('FBA storage fee', 3, (m) => m.storageFeeFBA);
  addRow('FBA Long-Term Storage Fee', 3, (m) => m.longTermStorage);
  addRow('FBA Prep Fee: Labeling', 3, (m) => m.prepLabeling);
  addRow('FBA Removal Order: Return Fee', 3, (m) => m.removalReturn);
  addRow('Others', 3, (m) => m.otherTransactionFees);
  addRow('FBA Removal Order: Disposal Fee', 3, (m) => m.removalDisposal);
  
  // EXTERNAL EXPENSES (no disponible sin datos externos)
  addRow('EXTERNAL EXPENSES', 1, () => 0, { isHeader: true });
  addRow('Bluco Cost', 3, (m) => 0); // Solo si el usuario lo proporciona
  addRow('FBM shipping cost', 3, (m) => 0);
  addRow('FBM Returns Cost', 3, (m) => 0);
  addRow('Shipping cost to FBA from Spain to the USA', 3, (m) => 0);
  addRow('Cost of Sales', 3, (m) => 0);
  addRow('Personnel Expense', 3, (m) => 0);
  addRow('Product Cost', 3, (m) => 0);
  addRow('Bluco Commission % on Sales', 3, (m) => 0);
  addRow('Other Expenses', 3, (m) => 0);
  addRow('Operations Expenses', 3, (m) => 0);
  
  // Calcular TOTAL EXPENSES
  totalExpenses = Array.from(monthlyData.values()).reduce((s, m) =>
    s + m.sellingFees + m.fbaFees + m.otherTransactionFees + 
    m.subscriptionFee + m.advertisingCost + m.storageFeeFBA + m.longTermStorage +
    m.inboundPlacement + m.removalReturn + m.removalDisposal + m.partnerCarrierShipment +
    m.returnPostageBilling + m.vineFee + m.awdStorage + m.awdProcessing +
    m.awdTransportation + m.prepLabeling + m.discounts + m.reimbGeneralAdjustment
  , 0);
  
  // ===== EBITDA =====
  const ebitda = totalIncome - totalExpenses;
  addRow('', 0, () => 0, { isHeader: true }); // Spacer
  
  addRow('EBITDA (IT-GT)', 1, (m) => {
    const income = m.productSales + m.shippingCredits + m.giftwrapCredits + 
                   m.reimbLostWarehouse + m.reimbCustomerReturn + m.reimbDamagedWarehouse + 
                   m.reimbCustomerService + m.reimbLostInbound;
    const expenses = m.sellingFees + m.fbaFees + m.otherTransactionFees + 
                     m.subscriptionFee + m.advertisingCost + m.storageFeeFBA + m.longTermStorage +
                     m.inboundPlacement + m.removalReturn + m.removalDisposal + 
                     m.partnerCarrierShipment + m.returnPostageBilling + m.vineFee + 
                     m.awdStorage + m.awdProcessing + m.awdTransportation + 
                     m.prepLabeling + m.discounts;
    const refunds = m.fbaRefunds + m.fbmRefunds;
    return income - expenses - refunds - m.promotionalRebates;
  }, { highlight: 'positive' });
  
  addRow('% of Income', 3, (m) => {
    const income = m.fbaProductSales + m.fbmProductSales;
    const ebitdaM = (m.productSales + m.shippingCredits + m.giftwrapCredits) -
                    (m.sellingFees + m.fbaFees + m.otherTransactionFees) -
                    (m.fbaRefunds + m.fbmRefunds) - m.promotionalRebates;
    return income > 0 ? (ebitdaM / income) * 100 : 0;
  });
  
  // ===== Taxes and Net Profit =====
  addRow('', 0, () => 0, { isHeader: true });
  addRow('Taxes', 2, (m) => m.marketplaceWithheldTax, { highlight: 'negative' });
  
  const netProfit = ebitda - Array.from(monthlyData.values()).reduce((s, m) => s + m.marketplaceWithheldTax, 0);
  addRow('Net profit', 1, (m) => {
    const ebitdaM = (m.productSales + m.shippingCredits + m.giftwrapCredits) -
                    (m.sellingFees + m.fbaFees + m.otherTransactionFees) -
                    (m.fbaRefunds + m.fbmRefunds) - m.promotionalRebates;
    return ebitdaM - m.marketplaceWithheldTax;
  }, { highlight: netProfit > 0 ? 'positive' : 'negative' });
  
  addRow('% of Income', 3, (m) => {
    const income = m.fbaProductSales + m.fbmProductSales;
    const np = (m.productSales + m.shippingCredits + m.giftwrapCredits) -
               (m.sellingFees + m.fbaFees + m.otherTransactionFees) -
               (m.fbaRefunds + m.fbmRefunds) - m.promotionalRebates - m.marketplaceWithheldTax;
    return income > 0 ? (np / income) * 100 : 0;
  });
  
  // ===== Transfers & Debt =====
  addRow('', 0, () => 0, { isHeader: true });
  addRow('marketplace withheld tax', 2, (m) => m.marketplaceWithheldTax);
  addRow('Transfer', 2, (m) => 0); // Necesita datos adicionales
  addRow('Debt', 2, (m) => 0); // Necesita datos adicionales
  
  // ===== MISTAKE (Discrepancy) =====
  addRow('', 0, () => 0, { isHeader: true });
  addRow('TOTAL CALCULATED AMOUNT', 1, (m) => {
    const income = m.productSales + m.shippingCredits + m.giftwrapCredits + 
                   m.reimbLostWarehouse + m.reimbCustomerReturn + m.reimbDamagedWarehouse +
                   m.reimbCustomerService + m.reimbLostInbound;
    const expenses = m.sellingFees + m.fbaFees + m.otherTransactionFees + 
                     m.subscriptionFee + m.advertisingCost + m.storageFeeFBA + 
                     m.longTermStorage + m.inboundPlacement + m.removalReturn + 
                     m.removalDisposal + m.partnerCarrierShipment + m.returnPostageBilling;
    const refunds = m.fbaRefunds + m.fbmRefunds;
    return income - expenses - refunds - m.promotionalRebates - m.marketplaceWithheldTax;
  });
  
  addRow('ACTUAL TOTAL AMOUNT', 1, (m) => m.total);
  
  const totalCalculated = Array.from(monthlyData.values()).reduce((s, m) => {
    const income = m.productSales + m.shippingCredits + m.giftwrapCredits;
    const expenses = m.sellingFees + m.fbaFees + m.otherTransactionFees;
    const refunds = m.fbaRefunds + m.fbmRefunds;
    return s + income - expenses - refunds - m.promotionalRebates;
  }, 0);
  
  const actualTotal = Array.from(monthlyData.values()).reduce((s, m) => s + m.total, 0);
  const mistake = actualTotal - totalCalculated;
  
  addRow('MISTAKE', 1, (m) => {
    const income = m.productSales + m.shippingCredits + m.giftwrapCredits;
    const expenses = m.sellingFees + m.fbaFees + m.otherTransactionFees;
    const refunds = m.fbaRefunds + m.fbmRefunds;
    const calculated = income - expenses - refunds - m.promotionalRebates;
    return m.total - calculated;
  }, { highlight: Math.abs(mistake) > 100 ? 'warning' : 'neutral' });
  
  // ===== Executive Summary =====
  const monthlyIncomes: { month: number; value: number }[] = [];
  const monthlyFees: { month: number; value: number }[] = [];
  const monthlyEbitdas: { month: number; value: number }[] = [];
  const monthlyMistakes: { month: number; value: number }[] = [];
  
  for (let m = 1; m <= 12; m++) {
    const agg = monthlyData.get(m)!;
    const income = agg.productSales + agg.shippingCredits + agg.giftwrapCredits;
    const fees = agg.sellingFees + agg.fbaFees + agg.otherTransactionFees;
    const refunds = agg.fbaRefunds + agg.fbmRefunds;
    const ebitdaM = income - fees - refunds - agg.promotionalRebates;
    const mistakeM = agg.total - (income - fees - refunds - agg.promotionalRebates);
    
    if (income > 0 || fees > 0) {
      monthlyIncomes.push({ month: m, value: income });
      monthlyFees.push({ month: m, value: fees });
      monthlyEbitdas.push({ month: m, value: ebitdaM });
      monthlyMistakes.push({ month: m, value: Math.abs(mistakeM) });
    }
  }
  
  const sortedIncomes = [...monthlyIncomes].sort((a, b) => b.value - a.value);
  const sortedFees = [...monthlyFees].sort((a, b) => b.value - a.value);
  const sortedMistakes = [...monthlyMistakes].sort((a, b) => b.value - a.value);
  
  // Determinar tendencia EBITDA
  let ebitdaTrend: 'up' | 'down' | 'stable' = 'stable';
  if (monthlyEbitdas.length >= 3) {
    const last3 = monthlyEbitdas.slice(-3);
    if (last3[2]?.value > last3[0]?.value * 1.1) ebitdaTrend = 'up';
    else if (last3[2]?.value < last3[0]?.value * 0.9) ebitdaTrend = 'down';
  }
  
  // Calcular promedios
  const avgRefundRate = totalIncome > 0 ? 
    (Array.from(monthlyData.values()).reduce((s, m) => s + m.fbaRefunds + m.fbmRefunds, 0) / totalIncome) * 100 : 0;
  const avgFeeRate = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  
  // Generar recomendaciones
  const recommendations: string[] = [];
  if (avgRefundRate > 5) {
    recommendations.push(`⚠️ Tasa de devoluciones alta (${avgRefundRate.toFixed(1)}%). Revisar calidad de producto o descripciones.`);
  }
  if (avgFeeRate > 35) {
    recommendations.push(`⚠️ Gastos Amazon altos (${avgFeeRate.toFixed(1)}% de ingresos). Optimizar fulfillment o negociar tarifas.`);
  }
  if (Math.abs(mistake) > 1000) {
    recommendations.push(`⚠️ Discrepancia significativa detectada (${mistake.toFixed(2)}€). Verificar transacciones faltantes.`);
  }
  if (ebitdaTrend === 'down') {
    recommendations.push('📉 Tendencia EBITDA descendente en últimos meses. Analizar causas.');
  }
  if (missingColumns.length > 0) {
    recommendations.push(`ℹ️ Datos externos no disponibles: ${missingColumns.join(', ')}. Solo se puede completar con tabla adicional.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('✅ P&L dentro de parámetros normales.');
  }
  
  const executiveSummary: ExecutiveSummary = {
    bestIncomeMonth: sortedIncomes[0] || { month: 0, value: 0 },
    worstIncomeMonth: sortedIncomes[sortedIncomes.length - 1] || { month: 0, value: 0 },
    highestFeesMonth: sortedFees[0] || { month: 0, value: 0 },
    ebitdaTrend,
    largestMistakeMonth: sortedMistakes[0] || { month: 0, value: 0 },
    avgRefundRate,
    avgFeeRate,
    recommendations
  };
  
  // Datos faltantes
  const missingData = [
    'Bluco Cost', 'Product Cost', 'Personnel Expense', 'FBM shipping cost',
    'Shipping cost to FBA', 'Operations Expenses'
  ].filter(() => true); // Siempre están vacíos sin datos externos
  
  return {
    rows,
    year,
    currency,
    dateRange,
    totalIncome,
    totalExpenses,
    ebitda,
    netProfit,
    mistake,
    missingData,
    executiveSummary
  };
};

// ============= MAIN EXPORT FUNCTIONS =============

export const processCEOBrainPL = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<MonthlyPLTable> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    return processCEOBrainCSV(file, onProgress);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processCEOBrainExcel(file, onProgress);
  } else {
    throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
  }
};

const processCEOBrainCSV = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<MonthlyPLTable> => {
  return new Promise((resolve, reject) => {
    const allRows: unknown[][] = [];
    let headers: string[] = [];
    let headerFound = false;
    let rowIndex = 0;
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      chunk: (results) => {
        const rows = results.data as string[][];
        
        for (const row of rows) {
          rowIndex++;
          
          // Buscar cabecera real
          if (!headerFound) {
            if (isHeaderRow(row)) {
              headers = row;
              headerFound = true;
              console.log('[CEO Brain] Cabecera encontrada en fila', rowIndex);
            }
            continue;
          }
          
          allRows.push(row);
        }
        
        if (onProgress && file.size > 0) {
          onProgress(Math.min(80, (rowIndex / (file.size / 100)) * 100));
        }
      },
      complete: () => {
        console.log('[CEO Brain] Procesando', allRows.length, 'filas con', headers.length, 'columnas');
        
        const result = processTransactions(allRows, headers);
        const plTable = buildPLTable(result);
        
        console.log('[CEO Brain] P&L construida:', {
          año: plTable.year,
          filas: plTable.rows.length,
          ingresos: plTable.totalIncome,
          gastos: plTable.totalExpenses,
          ebitda: plTable.ebitda
        });
        
        if (onProgress) onProgress(100);
        resolve(plTable);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const processCEOBrainExcel = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<MonthlyPLTable> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Buscar hoja con Transaction Report
        let targetSheet = workbook.SheetNames[0];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sampleData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
          
          // Buscar cabecera en esta hoja
          for (const row of sampleData.slice(0, 20)) {
            if (isHeaderRow((row as string[]).map(String))) {
              targetSheet = sheetName;
              break;
            }
          }
        }
        
        const worksheet = workbook.Sheets[targetSheet];
        const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (onProgress) onProgress(30);
        
        // Encontrar cabecera
        let headers: string[] = [];
        let dataStartIndex = 0;
        
        for (let i = 0; i < Math.min(50, allData.length); i++) {
          const row = allData[i] as string[];
          if (isHeaderRow(row.map(String))) {
            headers = row.map(String);
            dataStartIndex = i + 1;
            console.log('[CEO Brain] Cabecera encontrada en fila', i + 1);
            break;
          }
        }
        
        if (headers.length === 0) {
          throw new Error('No se encontró cabecera válida en el archivo');
        }
        
        const dataRows = allData.slice(dataStartIndex);
        
        if (onProgress) onProgress(50);
        
        const result = processTransactions(dataRows, headers);
        const plTable = buildPLTable(result);
        
        console.log('[CEO Brain] P&L construida:', {
          año: plTable.year,
          filas: plTable.rows.length,
          ingresos: plTable.totalIncome,
          gastos: plTable.totalExpenses,
          ebitda: plTable.ebitda
        });
        
        if (onProgress) onProgress(100);
        resolve(plTable);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Nombres de meses para display
export const MONTH_NAMES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MONTH_NAMES_FULL = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
