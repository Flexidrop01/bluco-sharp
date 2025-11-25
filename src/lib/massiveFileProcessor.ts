import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  MARKETPLACE_COUNTRY_MAP,
  EXCHANGE_RATES,
  shouldSkipRow,
  isHeaderRow,
  findStandardColumn,
  parseNumericValue,
  parseDateValue
} from './massiveColumnMappings';

/**
 * CLASIFICACIÓN DE TIPOS DE TRANSACCIÓN:
 * 
 * INGRESOS (tipos que generan revenue):
 * - Pedido
 * - Reembolso (negativo, resta de ingresos)
 * 
 * GASTOS (tipos que generan fees/costes):
 * - Tarifa de prestación de servicio (publicidad, suscripción, etc.)
 * - Servicios de envío (franqueo por devolución)
 * - Tarifas de inventario de Logística de Amazon
 * 
 * OTROS MOVIMIENTOS (NO son ingresos ni gastos):
 * - Transferir (transferencia al banco)
 * - Impuesto retenido
 */

// Transaction categories - based on "tipo" column
// IMPORTANT: Only "Transferir" type goes to Other Movements
// Everything else contributes to either Income or Expenses based on column values
export const OTHER_MOVEMENT_TYPES = ['transferir', 'transfer'];

// Aggregated metrics structure
export interface AggregatedMetrics {
  // Global totals
  totalRows: number;
  validTransactions: number;
  skippedRows: number;
  
  // Revenue - EXACT COLUMNS FROM AMAZON
  grossSales: number;
  grossSalesUSD: number;
  productSales: number;              // ventas de productos
  productSalesTax: number;           // impuesto de ventas de productos
  shippingCredits: number;           // abonos de envío
  shippingCreditsTax: number;        // impuestos por abonos de envío
  giftwrapCredits: number;           // abonos de envoltorio para regalo
  giftwrapCreditsTax: number;        // impuestos por abonos de envoltorio para regalo
  promotionalRebates: number;        // devoluciones promocionales
  promotionalRebatesTax: number;     // impuestos de descuentos por promociones
  taxCollected: number;              // impuesto retenido en el sitio web
  
  // Fees - EXACT COLUMNS FROM AMAZON (already negative)
  totalFees: number;
  sellingFees: number;               // tarifas de venta
  fbaFees: number;                   // tarifas de Logística de Amazon
  otherTransactionFees: number;      // tarifas de otras transacciones
  otherFees: number;                 // otro
  storageFees: number;
  inboundFees: number;
  regulatoryFees: number;
  advertisingFees: number;
  
  // Refunds & Reimbursements
  totalRefunds: number;
  refundCount: number;
  totalReimbursements: number;
  reimbursementLost: number;
  reimbursementDamaged: number;
  reimbursementOther: number;
  
  // Other movements (NOT income or expense)
  otherMovements: number;            // Transferencias al banco, etc.
  
  // Calculated
  netSales: number;
  netSalesUSD: number;
  ebitda: number;
  feePercent: number;
  refundRate: number;
  
  // Breakdowns
  byCountry: Map<string, CountryAggregates>;
  byMonth: Map<string, MonthAggregates>;
  bySKU: Map<string, SKUAggregates>;
  byFeeType: Map<string, number>;
  byFulfillment: Map<string, FulfillmentAggregates>;
  byCity: Map<string, CityAggregates>;
  byRegion: Map<string, RegionAggregates>;
  byTransactionType: Map<string, number>;
  byTransactionTypeDetail: Map<string, TransactionTypeDetail>;
  
  // Errors
  calculatedTotal: number;
  actualTotal: number;
  discrepancies: DiscrepancyRecord[];
  
  // Metadata
  currencies: Set<string>;
  marketplaces: Set<string>;
  dateRange: { min: Date | null; max: Date | null };
  detectedColumns: Map<string, string>;
  uniqueSKUs: Set<string>;
}

export interface CountryAggregates {
  country: string;
  marketplace: string;
  currency: string;
  grossSales: number;
  grossSalesUSD: number;
  fees: number;
  feePercent: number;
  refunds: number;
  refundRate: number;
  reimbursements: number;
  netSales: number;
  ebitda: number;
  transactionCount: number;
  topCities: Map<string, number>;
}

export interface MonthAggregates {
  month: string;
  grossSales: number;
  fees: number;
  refunds: number;
  netSales: number;
  transactionCount: number;
}

export interface SKUAggregates {
  sku: string;
  description: string;
  asin?: string;
  grossSales: number;
  fees: number;
  feePercent: number;
  refunds: number;
  refundRate: number;
  quantity: number;
  transactionCount: number;
  countries: Set<string>;
  cities: Set<string>;
  fulfillment: string;
}

export interface FulfillmentAggregates {
  model: string;
  grossSales: number;
  fees: number;
  refunds: number;
  transactionCount: number;
}

export interface TransactionTypeDetail {
  type: string;
  category: 'income' | 'expense' | 'other';
  count: number;
  totalAmount: number;
  descriptions: Map<string, { count: number; amount: number }>;
}

export interface CityAggregates {
  city: string;
  region: string;
  postalCode: string;
  country: string;
  grossSales: number;
  transactionCount: number;
  topSKUs: Map<string, number>;
}

export interface RegionAggregates {
  region: string;
  country: string;
  grossSales: number;
  transactionCount: number;
  cities: Set<string>;
}

export interface DiscrepancyRecord {
  row: number;
  calculated: number;
  actual: number;
  difference: number;
  description: string;
}

// Initialize empty metrics
const createEmptyMetrics = (): AggregatedMetrics => ({
  totalRows: 0,
  validTransactions: 0,
  skippedRows: 0,
  grossSales: 0,
  grossSalesUSD: 0,
  productSales: 0,
  productSalesTax: 0,
  shippingCredits: 0,
  shippingCreditsTax: 0,
  giftwrapCredits: 0,
  giftwrapCreditsTax: 0,
  promotionalRebates: 0,
  promotionalRebatesTax: 0,
  taxCollected: 0,
  totalFees: 0,
  sellingFees: 0,
  fbaFees: 0,
  otherTransactionFees: 0,
  otherFees: 0,
  storageFees: 0,
  inboundFees: 0,
  regulatoryFees: 0,
  advertisingFees: 0,
  totalRefunds: 0,
  refundCount: 0,
  totalReimbursements: 0,
  reimbursementLost: 0,
  reimbursementDamaged: 0,
  reimbursementOther: 0,
  otherMovements: 0,
  netSales: 0,
  netSalesUSD: 0,
  ebitda: 0,
  feePercent: 0,
  refundRate: 0,
  byCountry: new Map(),
  byMonth: new Map(),
  bySKU: new Map(),
  byFeeType: new Map(),
  byFulfillment: new Map(),
  byCity: new Map(),
  byRegion: new Map(),
  byTransactionType: new Map(),
  byTransactionTypeDetail: new Map(),
  calculatedTotal: 0,
  actualTotal: 0,
  discrepancies: [],
  currencies: new Set(),
  marketplaces: new Set(),
  dateRange: { min: null, max: null },
  detectedColumns: new Map(),
  uniqueSKUs: new Set()
});

// Detect fulfillment model from Spanish values: "Vendedor" = FBM, "Amazon" = FBA
const detectFulfillmentModel = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'amazon' || normalized === 'amazon.es') return 'FBA';
  if (normalized === 'vendedor') return 'FBM';
  if (normalized.includes('amazon') || normalized.includes('fba') || normalized.includes('logística')) return 'FBA';
  if (normalized.includes('vendedor') || normalized.includes('merchant') || normalized.includes('fbm')) return 'FBM';
  
  return 'Unknown';
};

// Detect marketplace from "web de Amazon" column
const detectMarketplaceExact = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  for (const domain of Object.keys(MARKETPLACE_COUNTRY_MAP)) {
    if (normalized === domain || normalized.includes(domain)) return domain;
  }
  if (normalized.startsWith('amazon.')) return normalized;
  return normalized || 'unknown';
};

// Classify transaction type - simple: only "Transferir" is other movement
const classifyTransactionCategory = (type: string): 'income' | 'expense' | 'other' => {
  const normalized = type.toLowerCase().trim();
  
  // OTHER MOVEMENTS - NOT income or expense (bank transfers)
  if (OTHER_MOVEMENT_TYPES.some(t => normalized.includes(t))) return 'other';
  
  // Everything else is either income or expense based on column values
  // We'll determine this by the values in the row, not by type
  return 'income'; // Default, actual classification happens by column values
};

// Process a single row and update metrics
const processRow = (
  row: Record<string, unknown>,
  columnMap: Map<string, string>,
  metrics: AggregatedMetrics,
  rowIndex: number
): void => {
  metrics.totalRows++;
  
  if (shouldSkipRow(row)) {
    metrics.skippedRows++;
    return;
  }
  
  metrics.validTransactions++;
  
  const getValue = (standardKey: string): unknown => {
    const originalCol = columnMap.get(standardKey);
    return originalCol ? row[originalCol] : undefined;
  };
  
  const getNumeric = (standardKey: string): number => parseNumericValue(getValue(standardKey));
  const getString = (standardKey: string): string => {
    const val = getValue(standardKey);
    return val ? String(val).trim() : '';
  };
  
  // === EXTRACT VALUES ===
  const marketplaceRaw = getString('marketplace');
  const marketplace = detectMarketplaceExact(marketplaceRaw);
  const marketplaceInfo = MARKETPLACE_COUNTRY_MAP[marketplace] || { currency: 'EUR', country: marketplace };
  const currency = marketplaceInfo.currency;
  const exchangeRate = EXCHANGE_RATES[currency] || 1;
  
  const fulfillmentRaw = getString('fulfillment');
  const fulfillmentModel = detectFulfillmentModel(fulfillmentRaw);
  const transactionType = getString('type') || 'Unknown';
  const transactionCategory = classifyTransactionCategory(transactionType);
  const description = getString('description');
  const date = parseDateValue(getValue('date'));
  const sku = getString('sku');
  const quantity = Math.max(0, getNumeric('quantity'));
  const city = getString('city');
  const region = getString('region');
  const postalCode = getString('postalCode');
  
  // === INCOME COLUMNS ===
  const productSales = getNumeric('productSales');
  const productSalesTax = getNumeric('productSalesTax');
  const shippingCredits = getNumeric('shippingCredits');
  const shippingCreditsTax = getNumeric('shippingCreditsTax');
  const giftwrapCredits = getNumeric('giftwrapCredits');
  const giftwrapCreditsTax = getNumeric('giftwrapCreditsTax');
  const promotionalRebates = getNumeric('promotionalRebates');
  const promotionalRebatesTax = getNumeric('promotionalRebatesTax');
  const marketplaceWithheldTax = getNumeric('marketplaceWithheldTax');
  
  // === EXPENSE COLUMNS ===
  const sellingFees = getNumeric('sellingFees');
  const fbaFees = getNumeric('fbaFees');
  const otherTransactionFees = getNumeric('otherTransactionFees');
  const otherFees = getNumeric('other');
  
  const rowTotal = getNumeric('total');
  
  // === CLASSIFY AND ACCUMULATE ===
  const isRefund = transactionType.toLowerCase().includes('reembolso') || 
                   transactionType.toLowerCase().includes('refund');
  const isOtherMovement = transactionCategory === 'other';
  
  // Calculate row income (columns 13-21 in Excel = productSales to taxCollected)
  const rowIncome = productSales + productSalesTax + shippingCredits + shippingCreditsTax +
                    giftwrapCredits + giftwrapCreditsTax + promotionalRebates + 
                    promotionalRebatesTax + marketplaceWithheldTax;
  
  // Calculate row expenses (columns 22-25 in Excel = fees)
  const rowExpenses = sellingFees + fbaFees + otherTransactionFees + otherFees;
  
  // Only count income/expenses if NOT other movement (transfers, etc.)
  if (!isOtherMovement) {
    // Income columns - sum ALL values (positive and negative) from columns 13-21
    metrics.productSales += productSales;
    metrics.productSalesTax += productSalesTax;
    metrics.shippingCredits += shippingCredits;
    metrics.shippingCreditsTax += shippingCreditsTax;
    metrics.giftwrapCredits += giftwrapCredits;
    metrics.giftwrapCreditsTax += giftwrapCreditsTax;
    metrics.taxCollected += marketplaceWithheldTax;
    metrics.promotionalRebates += promotionalRebates;
    metrics.promotionalRebatesTax += promotionalRebatesTax;
    
    // Expense columns - keep as-is (already negative in file) from columns 22-25
    metrics.sellingFees += sellingFees;
    metrics.fbaFees += fbaFees;
    metrics.otherTransactionFees += otherTransactionFees;
    metrics.otherFees += otherFees;
    
    // Track refunds separately for analysis
    if (isRefund) {
      metrics.refundCount++;
      metrics.totalRefunds += Math.abs(productSales + productSalesTax);
    }
  } else {
    // Track other movements separately (transfers, etc.) - use the "total" column
    metrics.otherMovements += rowTotal;
  }
  
  // Always track actual total from file (column "total")
  metrics.actualTotal += rowTotal;
  
  // === UPDATE METADATA ===
  metrics.currencies.add(currency);
  if (marketplace && marketplace !== 'unknown') metrics.marketplaces.add(marketplace);
  if (sku) metrics.uniqueSKUs.add(sku);
  
  if (date) {
    if (!metrics.dateRange.min || date < metrics.dateRange.min) metrics.dateRange.min = date;
    if (!metrics.dateRange.max || date > metrics.dateRange.max) metrics.dateRange.max = date;
  }
  
  // === TRANSACTION TYPE BREAKDOWN ===
  metrics.byTransactionType.set(transactionType, (metrics.byTransactionType.get(transactionType) || 0) + 1);
  
  if (!metrics.byTransactionTypeDetail.has(transactionType)) {
    metrics.byTransactionTypeDetail.set(transactionType, {
      type: transactionType,
      category: transactionCategory,
      count: 0,
      totalAmount: 0,
      descriptions: new Map()
    });
  }
  const txDetail = metrics.byTransactionTypeDetail.get(transactionType)!;
  txDetail.count++;
  txDetail.totalAmount += rowTotal;
  if (description) {
    const descKey = description.substring(0, 60);
    if (!txDetail.descriptions.has(descKey)) {
      txDetail.descriptions.set(descKey, { count: 0, amount: 0 });
    }
    const descData = txDetail.descriptions.get(descKey)!;
    descData.count++;
    descData.amount += rowTotal;
  }
  
  // === MARKETPLACE BREAKDOWN ===
  if (marketplace && marketplace !== 'unknown' && !isOtherMovement) {
    if (!metrics.byCountry.has(marketplace)) {
      metrics.byCountry.set(marketplace, {
        country: marketplaceInfo.country || marketplace,
        marketplace,
        currency,
        grossSales: 0, grossSalesUSD: 0, fees: 0, feePercent: 0,
        refunds: 0, refundRate: 0, reimbursements: 0, netSales: 0,
        ebitda: 0, transactionCount: 0, topCities: new Map()
      });
    }
    const marketplaceData = metrics.byCountry.get(marketplace)!;
    if (!isRefund && productSales > 0) {
      marketplaceData.grossSales += productSales;
      marketplaceData.grossSalesUSD += productSales * exchangeRate;
    }
    marketplaceData.fees += (sellingFees + fbaFees + otherTransactionFees + otherFees);
    if (isRefund) marketplaceData.refunds += Math.abs(productSales);
    marketplaceData.transactionCount++;
    if (city) marketplaceData.topCities.set(city, (marketplaceData.topCities.get(city) || 0) + Math.max(0, productSales));
  }
  
  // === MONTH BREAKDOWN ===
  if (date && !isOtherMovement) {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!metrics.byMonth.has(monthKey)) {
      metrics.byMonth.set(monthKey, { month: monthKey, grossSales: 0, fees: 0, refunds: 0, netSales: 0, transactionCount: 0 });
    }
    const monthData = metrics.byMonth.get(monthKey)!;
    if (!isRefund && productSales > 0) monthData.grossSales += productSales;
    monthData.fees += (sellingFees + fbaFees + otherTransactionFees + otherFees);
    if (isRefund) monthData.refunds += Math.abs(productSales);
    monthData.transactionCount++;
  }
  
  // === SKU BREAKDOWN ===
  if (sku && !isOtherMovement) {
    if (!metrics.bySKU.has(sku)) {
      metrics.bySKU.set(sku, {
        sku, description: description || sku, asin: getString('asin') || '',
        grossSales: 0, fees: 0, feePercent: 0, refunds: 0, refundRate: 0,
        quantity: 0, transactionCount: 0, countries: new Set(), cities: new Set(),
        fulfillment: fulfillmentModel
      });
    }
    const skuData = metrics.bySKU.get(sku)!;
    if (!isRefund && productSales > 0) {
      skuData.grossSales += productSales;
      skuData.quantity += quantity;
    }
    skuData.fees += (sellingFees + fbaFees + otherTransactionFees + otherFees);
    if (isRefund) skuData.refunds += Math.abs(productSales);
    skuData.transactionCount++;
    if (marketplace) skuData.countries.add(marketplace);
    if (city) skuData.cities.add(city);
    if (description && description.length > skuData.description.length) skuData.description = description;
    if (fulfillmentModel !== 'Unknown') skuData.fulfillment = fulfillmentModel;
  }
  
  // === FULFILLMENT BREAKDOWN ===
  if (fulfillmentModel && fulfillmentModel !== 'Unknown' && !isOtherMovement) {
    if (!metrics.byFulfillment.has(fulfillmentModel)) {
      metrics.byFulfillment.set(fulfillmentModel, { model: fulfillmentModel, grossSales: 0, fees: 0, refunds: 0, transactionCount: 0 });
    }
    const fulfillmentData = metrics.byFulfillment.get(fulfillmentModel)!;
    if (!isRefund && productSales > 0) fulfillmentData.grossSales += productSales;
    fulfillmentData.fees += (sellingFees + fbaFees + otherTransactionFees + otherFees);
    if (isRefund) fulfillmentData.refunds += Math.abs(productSales);
    fulfillmentData.transactionCount++;
  }
  
  // === CITY BREAKDOWN ===
  if (city && !isOtherMovement) {
    const cityKey = `${city}|${region}|${marketplace}`;
    if (!metrics.byCity.has(cityKey)) {
      metrics.byCity.set(cityKey, { city, region: region || '', postalCode: postalCode || '', country: marketplace, grossSales: 0, transactionCount: 0, topSKUs: new Map() });
    }
    const cityData = metrics.byCity.get(cityKey)!;
    if (!isRefund && productSales > 0) cityData.grossSales += productSales;
    cityData.transactionCount++;
    if (sku) cityData.topSKUs.set(sku, (cityData.topSKUs.get(sku) || 0) + Math.max(0, productSales));
  }
  
  // === REGION BREAKDOWN ===
  if (region && !isOtherMovement) {
    const regionKey = `${region}|${marketplace}`;
    if (!metrics.byRegion.has(regionKey)) {
      metrics.byRegion.set(regionKey, { region, country: marketplace, grossSales: 0, transactionCount: 0, cities: new Set() });
    }
    const regionData = metrics.byRegion.get(regionKey)!;
    if (!isRefund && productSales > 0) regionData.grossSales += productSales;
    regionData.transactionCount++;
    if (city) regionData.cities.add(city);
  }
  
  // === FEE TYPE BREAKDOWN ===
  if (sellingFees < 0) metrics.byFeeType.set('Tarifas de venta', (metrics.byFeeType.get('Tarifas de venta') || 0) + Math.abs(sellingFees));
  if (fbaFees < 0) metrics.byFeeType.set('Logística de Amazon', (metrics.byFeeType.get('Logística de Amazon') || 0) + Math.abs(fbaFees));
  if (otherTransactionFees < 0) metrics.byFeeType.set('Otras transacciones', (metrics.byFeeType.get('Otras transacciones') || 0) + Math.abs(otherTransactionFees));
  if (otherFees < 0) metrics.byFeeType.set('Otro', (metrics.byFeeType.get('Otro') || 0) + Math.abs(otherFees));
};

// Finalize metrics after all rows processed
const finalizeMetrics = (metrics: AggregatedMetrics): void => {
  // INGRESOS TOTALES: suma de TODAS las columnas de ingresos
  // (productSales + productSalesTax + shippingCredits + shippingCreditsTax + 
  //  giftwrapCredits + giftwrapCreditsTax + promotionalRebates + promotionalRebatesTax + taxCollected)
  metrics.grossSales = metrics.productSales + metrics.productSalesTax + 
                       metrics.shippingCredits + metrics.shippingCreditsTax +
                       metrics.giftwrapCredits + metrics.giftwrapCreditsTax +
                       metrics.promotionalRebates + metrics.promotionalRebatesTax +
                       metrics.taxCollected;
  
  // GASTOS TOTALES: suma directa de las 4 columnas de gastos (ya son negativos)
  // (sellingFees + fbaFees + otherTransactionFees + otherFees)
  metrics.totalFees = metrics.sellingFees + metrics.fbaFees + 
                      metrics.otherTransactionFees + metrics.otherFees;
  
  // Net sales = Ingresos sin los tax/rebates (solo ventas de producto)
  metrics.netSales = metrics.productSales;
  
  // EBITDA = Ingresos + Gastos (gastos ya son negativos) + Reembolsos
  // EXCLUYE otros movimientos (transferencias)
  metrics.ebitda = metrics.grossSales + metrics.totalFees + metrics.totalReimbursements;
  
  // Calculated total for comparison (should match actualTotal - otherMovements)
  metrics.calculatedTotal = metrics.grossSales + metrics.totalFees;
  
  // Calculate USD values
  const avgExchangeRate = EXCHANGE_RATES['EUR'] || 1;
  metrics.grossSalesUSD = metrics.grossSales * avgExchangeRate;
  metrics.netSalesUSD = metrics.netSales * avgExchangeRate;
  
  // Calculate percentages
  metrics.feePercent = metrics.grossSales > 0 ? (Math.abs(metrics.totalFees) / metrics.grossSales) * 100 : 0;
  metrics.refundRate = metrics.grossSales > 0 ? (metrics.totalRefunds / metrics.grossSales) * 100 : 0;
  
  // Finalize marketplace metrics
  for (const [, data] of metrics.byCountry) {
    data.netSales = data.grossSales - data.refunds;
    data.fees = Math.abs(data.fees);
    data.ebitda = data.netSales - data.fees + data.reimbursements;
    data.feePercent = data.netSales > 0 ? (data.fees / data.netSales) * 100 : 0;
    data.refundRate = data.grossSales > 0 ? (data.refunds / data.grossSales) * 100 : 0;
  }
  
  // Finalize month metrics
  for (const [, data] of metrics.byMonth) {
    data.fees = Math.abs(data.fees);
    data.netSales = data.grossSales - data.refunds - data.fees;
  }
  
  // Finalize SKU metrics
  for (const [, data] of metrics.bySKU) {
    data.fees = Math.abs(data.fees);
    data.feePercent = data.grossSales > 0 ? (data.fees / data.grossSales) * 100 : 0;
    data.refundRate = data.grossSales > 0 ? (data.refunds / data.grossSales) * 100 : 0;
  }
  
  // Finalize fulfillment metrics
  for (const [, data] of metrics.byFulfillment) {
    data.fees = Math.abs(data.fees);
  }
  
  console.log('[CEO Brain] Final metrics:', {
    grossSales: metrics.grossSales.toFixed(2),
    totalFees: metrics.totalFees.toFixed(2),
    ebitda: metrics.ebitda.toFixed(2),
    otherMovements: metrics.otherMovements.toFixed(2),
    actualTotal: metrics.actualTotal.toFixed(2),
    marketplaces: Array.from(metrics.marketplaces),
    transactionTypes: Array.from(metrics.byTransactionType.keys())
  });
};

// Build column map from headers
const buildColumnMap = (headers: string[]): Map<string, string> => {
  const columnMap = new Map<string, string>();
  for (const header of headers) {
    const standardKey = findStandardColumn(header);
    if (standardKey && !columnMap.has(standardKey)) {
      columnMap.set(standardKey, header);
    }
  }
  console.log('[CEO Brain] Detected columns:', Object.fromEntries(columnMap));
  return columnMap;
};

// Process CSV
export const processMassiveCSV = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  return new Promise((resolve, reject) => {
    const metrics = createEmptyMetrics();
    let headers: string[] = [];
    let columnMap: Map<string, string> = new Map();
    let headerFound = false;
    let rowIndex = 0;
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      chunk: (results) => {
        const rows = results.data as string[][];
        for (const row of rows) {
          rowIndex++;
          if (!headerFound) {
            if (isHeaderRow(row)) {
              headers = row;
              columnMap = buildColumnMap(headers);
              metrics.detectedColumns = columnMap;
              headerFound = true;
            }
            continue;
          }
          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, i) => { rowObj[h] = row[i]; });
          processRow(rowObj, columnMap, metrics, rowIndex);
        }
        if (onProgress && file.size > 0) {
          onProgress(Math.min(100, (rowIndex / (file.size / 100)) * 100));
        }
      },
      complete: () => {
        finalizeMetrics(metrics);
        resolve(metrics);
      },
      error: (error) => reject(error)
    });
  });
};

// Process Excel
export const processMassiveExcel = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        const metrics = createEmptyMetrics();
        let headers: string[] = [];
        let columnMap: Map<string, string> = new Map();
        let headerFound = false;
        const totalRows = allData.length;
        
        for (let i = 0; i < totalRows; i++) {
          const row = allData[i] as string[];
          if (!headerFound) {
            if (isHeaderRow(row.map(String))) {
              headers = row.map(String);
              columnMap = buildColumnMap(headers);
              metrics.detectedColumns = columnMap;
              headerFound = true;
            }
            continue;
          }
          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, idx) => { rowObj[h] = row[idx]; });
          processRow(rowObj, columnMap, metrics, i);
          if (onProgress && i % 1000 === 0) onProgress((i / totalRows) * 100);
        }
        
        finalizeMetrics(metrics);
        resolve(metrics);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

// Main function
export const processMassiveFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    return processMassiveCSV(file, onProgress);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processMassiveExcel(file, onProgress);
  } else {
    throw new Error('Unsupported file format. Use CSV or Excel.');
  }
};
