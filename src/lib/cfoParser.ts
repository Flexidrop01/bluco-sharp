import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { VATTransaction, TransactionType, FiscalClassification } from '@/types/cfo';

// Column mappings for VAT/AIVA reports
const CFO_COLUMN_MAP: Record<string, string[]> = {
  // Identifiers
  uniqueAccountId: ['unique_account_identifier', 'account_id', 'seller_id'],
  activityPeriod: ['activity_period', 'period', 'reporting_period'],
  transactionType: ['transaction_type', 'type', 'activity_type'],
  taxCalculationDate: ['tax_calculation_date', 'tax_date', 'date'],
  
  // Product info
  sellerSku: ['seller_sku', 'sku', 'merchant_sku'],
  asin: ['asin', 'amazon_asin', 'product_asin'],
  productTaxCode: ['product_tax_code', 'tax_code', 'ptc'],
  commodityCode: ['commodity_code', 'hs_code', 'cn_code'],
  countryOfManufacture: ['country_of_manufacture', 'origin_country', 'coo'],
  
  // Geographic
  departureCountry: ['departure_country', 'ship_from_country', 'origin'],
  arrivalCountry: ['arrival_country', 'ship_to_country', 'destination', 'destination_country'],
  taxableJurisdiction: ['taxable_jurisdiction', 'tax_jurisdiction', 'jurisdiction'],
  
  // Amounts
  priceExclVat: ['price_of_items_amt_vat_excl', 'price_excl_vat', 'net_amount', 'amount_excl_vat'],
  vatRate: ['price_of_items_vat_rate_percent', 'vat_rate', 'tax_rate', 'vat_rate_percent'],
  vatAmount: ['price_of_items_vat_amt', 'vat_amount', 'tax_amount', 'vat_amt'],
  totalInclVat: ['total_activity_value_amt_vat_incl', 'total_incl_vat', 'gross_amount'],
  
  // Buyer info
  buyerVatNumber: ['buyer_vat_number', 'buyer_vat', 'customer_vat', 'vat_number'],
  
  // Invoice
  vatInvoiceNumber: ['vat_inv_number', 'invoice_number', 'inv_number'],
  exchangeRate: ['vat_inv_exchange_rate', 'exchange_rate', 'fx_rate'],
  
  // Flags
  exportOutsideEu: ['export_outside_eu', 'export_flag', 'non_eu_export'],
  transportationMode: ['transportation_mode', 'transport_mode', 'shipping_mode'],
  supplementaryUnit: ['supplementary_unit', 'supp_unit', 'unit'],
  
  // Currency
  currency: ['currency', 'transaction_currency', 'currency_code'],
};

// EU country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const COUNTRY_NAMES: Record<string, string> = {
  'AT': 'Austria', 'BE': 'Belgium', 'BG': 'Bulgaria', 'HR': 'Croatia',
  'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia',
  'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
  'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LV': 'Latvia',
  'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta', 'NL': 'Netherlands',
  'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden', 'GB': 'United Kingdom',
  'US': 'United States', 'CH': 'Switzerland', 'NO': 'Norway'
};

function findColumn(headers: string[], patterns: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  
  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedPattern) || normalizedPattern.includes(h));
    if (index !== -1) return headers[index];
  }
  return null;
}

function parseNumeric(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).replace(/[€$£,\s]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseTransactionType(value: string): TransactionType {
  const v = (value || '').toUpperCase();
  if (v.includes('SALE') || v.includes('SHIPMENT')) return 'SALE';
  if (v.includes('REFUND') || v.includes('RETURN')) return 'REFUND';
  if (v.includes('FC_TRANSFER') || v.includes('MOVEMENT')) return 'FC_TRANSFER';
  if (v.includes('INBOUND')) return 'INBOUND';
  if (v.includes('COMMINGLING')) return 'COMMINGLING';
  if (v.includes('ADJUSTMENT')) return 'ADJUSTMENT';
  return 'UNKNOWN';
}

function classifyTransaction(
  departureCountry: string,
  arrivalCountry: string,
  buyerVatNumber: string | null,
  exportOutsideEu: boolean,
  transactionType: TransactionType
): FiscalClassification {
  const depInEu = EU_COUNTRIES.includes(departureCountry);
  const arrInEu = EU_COUNTRIES.includes(arrivalCountry);
  
  // Movement of goods (FC transfer)
  if (transactionType === 'FC_TRANSFER' || transactionType === 'MOVEMENT') {
    if (depInEu && arrInEu && departureCountry !== arrivalCountry) {
      return 'movement_of_goods';
    }
    return 'cross_border_fba';
  }
  
  // Export outside EU
  if (exportOutsideEu || (!arrInEu && depInEu)) {
    return 'export_outside_eu';
  }
  
  // Intra-EU
  if (depInEu && arrInEu && departureCountry !== arrivalCountry) {
    // B2B with valid VAT number
    if (buyerVatNumber && buyerVatNumber.length > 5) {
      return 'intra_eu_supply_b2b';
    }
    // B2C (distance sales / OSS)
    return 'intra_eu_supply_b2c';
  }
  
  // Domestic supply
  if (departureCountry === arrivalCountry && depInEu) {
    return 'domestic_supply';
  }
  
  // Acquisition (arriving from another EU country)
  if (depInEu && arrInEu && transactionType === 'INBOUND') {
    return 'intra_eu_acquisition';
  }
  
  return 'unknown';
}

function isHeaderRow(row: Record<string, unknown>): boolean {
  const values = Object.values(row).map(v => String(v || '').toLowerCase());
  const headerIndicators = ['transaction_type', 'vat_rate', 'activity_period', 'asin', 'departure_country'];
  return headerIndicators.filter(ind => values.some(v => v.includes(ind))).length >= 2;
}

function shouldSkipRow(row: Record<string, unknown>): boolean {
  const values = Object.values(row).map(v => String(v || '').toLowerCase());
  const skipPatterns = ['total', 'sum', 'subtotal', 'grand total', 'unnamed'];
  
  // Skip if most values are empty
  const nonEmpty = values.filter(v => v && v.trim() !== '').length;
  if (nonEmpty < 3) return true;
  
  // Skip total/summary rows
  if (skipPatterns.some(p => values.some(v => v.includes(p)))) return true;
  
  return false;
}

export async function parseCFOFile(file: File): Promise<{
  headers: string[];
  data: Record<string, unknown>[];
  transactions: VATTransaction[];
}> {
  const fileName = file.name.toLowerCase();
  
  let rawData: { headers: string[]; data: Record<string, unknown>[] };
  
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    rawData = await parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    rawData = await parseExcel(file);
  } else {
    throw new Error('Formato no soportado. Use CSV o Excel.');
  }
  
  // Find column mappings
  const columnMap: Record<string, string | null> = {};
  for (const [key, patterns] of Object.entries(CFO_COLUMN_MAP)) {
    columnMap[key] = findColumn(rawData.headers, patterns);
  }
  
  // Process transactions
  const transactions: VATTransaction[] = [];
  let headerFound = false;
  
  for (let i = 0; i < rawData.data.length; i++) {
    const row = rawData.data[i];
    
    // Skip until we find the real header
    if (!headerFound && isHeaderRow(row)) {
      headerFound = true;
      continue;
    }
    
    if (shouldSkipRow(row)) continue;
    
    const getValue = (key: string) => {
      const col = columnMap[key];
      return col ? row[col] : undefined;
    };
    
    const departureCountry = String(getValue('departureCountry') || '').toUpperCase().slice(0, 2);
    const arrivalCountry = String(getValue('arrivalCountry') || '').toUpperCase().slice(0, 2);
    const buyerVat = getValue('buyerVatNumber') ? String(getValue('buyerVatNumber')) : null;
    const exportFlag = String(getValue('exportOutsideEu') || '').toLowerCase();
    const isExport = exportFlag === 'true' || exportFlag === 'yes' || exportFlag === '1';
    const txType = parseTransactionType(String(getValue('transactionType') || ''));
    
    const transaction: VATTransaction = {
      id: `tx-${i}`,
      activityPeriod: String(getValue('activityPeriod') || ''),
      transactionType: txType,
      taxCalculationDate: String(getValue('taxCalculationDate') || ''),
      sellerSku: String(getValue('sellerSku') || ''),
      asin: String(getValue('asin') || ''),
      countryOfManufacture: String(getValue('countryOfManufacture') || ''),
      departureCountry,
      arrivalCountry,
      taxableJurisdiction: String(getValue('taxableJurisdiction') || arrivalCountry),
      priceExclVat: parseNumeric(getValue('priceExclVat')),
      vatRate: parseNumeric(getValue('vatRate')),
      vatAmount: parseNumeric(getValue('vatAmount')),
      totalInclVat: parseNumeric(getValue('totalInclVat')),
      buyerVatNumber: buyerVat,
      vatInvoiceNumber: getValue('vatInvoiceNumber') ? String(getValue('vatInvoiceNumber')) : null,
      exchangeRate: parseNumeric(getValue('exchangeRate')) || 1,
      exportOutsideEu: isExport,
      productTaxCode: String(getValue('productTaxCode') || ''),
      transportationMode: String(getValue('transportationMode') || ''),
      commodityCode: String(getValue('commodityCode') || ''),
      supplementaryUnit: String(getValue('supplementaryUnit') || ''),
      fiscalClassification: classifyTransaction(departureCountry, arrivalCountry, buyerVat, isExport, txType),
      currency: String(getValue('currency') || 'EUR'),
    };
    
    // Only add if we have some valid data
    if (transaction.priceExclVat !== 0 || transaction.vatAmount !== 0 || transaction.asin) {
      transactions.push(transaction);
    }
  }
  
  return {
    headers: rawData.headers,
    data: rawData.data,
    transactions
  };
}

async function parseCSV(file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, unknown>[]
        });
      },
      error: reject
    });
  });
}

async function parseExcel(file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Archivo vacío'));
          return;
        }
        
        const headers = (jsonData[0] as string[]).map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, idx) => {
            obj[header] = (row as unknown[])[idx];
          });
          return obj;
        });
        
        resolve({ headers, data: rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsArrayBuffer(file);
  });
}

export { EU_COUNTRIES, COUNTRY_NAMES };
