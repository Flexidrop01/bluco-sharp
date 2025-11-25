// Extended universal column mappings for massive file processing
// Handles any Amazon report format from any marketplace - SPANISH & MULTI-LANGUAGE SUPPORT

/**
 * CLASIFICACIÓN OFICIAL DE COLUMNAS AMAZON - BASADO EN DATOS REALES
 * 
 * INGRESOS (valores positivos = suman):
 * - ventas de productos
 * - impuesto de ventas de productos  
 * - abonos de envío
 * - impuestos por abonos de envío
 * - abonos de envoltorio para regalo
 * - impuestos por abonos de envoltorio para regalo
 * - devoluciones promocionales (NEGATIVO = descuento)
 * - impuestos de descuentos por promociones
 * - impuesto retenido en el sitio web
 * 
 * GASTOS (valores negativos = restan):
 * - tarifas de venta
 * - tarifas de Logística de Amazon
 * - tarifas de otras transacciones
 * - otro
 */

// Columnas que son INGRESOS (revenue)
export const INCOME_COLUMNS = [
  'ventas de productos',
  'product sales',
  'impuesto de ventas de productos',
  'product sales tax',
  'abonos de envío',
  'shipping credits',
  'impuestos por abonos de envío',
  'shipping credits tax',
  'abonos de envoltorio para regalo',
  'giftwrap credits',
  'impuestos por abonos de envoltorio para regalo',
  'giftwrap credits tax',
  'impuesto retenido en el sitio web',
  'marketplace withheld tax'
];

// Columnas que son GASTOS (expenses) - valores negativos
export const EXPENSE_COLUMNS = [
  'tarifas de venta',
  'selling fees',
  'tarifas de logística de amazon',
  'fba fees',
  'tarifas de otras transacciones',
  'other transaction fees',
  'otro',
  'other'
];

// Columnas que son DESCUENTOS (restan de ingresos)
export const DISCOUNT_COLUMNS = [
  'devoluciones promocionales',
  'promotional rebates',
  'impuestos de descuentos por promociones',
  'promotional rebates tax'
];

export const UNIVERSAL_COLUMN_MAP: Record<string, string[]> = {
  // === IDENTIFIERS ===
  date: [
    'fecha y hora', 'fecha', 'date/time', 'datetime', 'date', 'posted-date', 
    'settlement-start-date', 'transaction-date', 'datum', 'data', 'order-date', 
    'posted date', 'fecha de la transacción'
  ],
  orderId: [
    'número de pedido', 'numero de pedido', 'pedido', 'order id', 'order-id', 
    'orderid', 'amazon-order-id', 'order number', 'ordernumber', 'transaction-id', 
    'bestellnummer', 'id de pedido', 'nº pedido'
  ],
  sku: [
    'sku', 'merchant-sku', 'seller-sku', 'msku', 'seller sku', 'merchant sku',
    'product-sku', 'item-sku', 'código sku', 'codigo sku', 'referencia'
  ],
  asin: [
    'asin', 'fnsku', 'product-id', 'item-id', 'product id'
  ],
  marketplace: [
    'web de amazon', 'marketplace', 'marketplace-name', 'store', 'sales-channel',
    'marketplace name', 'amazon-marketplace', 'site', 'sitio web', 'tienda'
  ],
  type: [
    'tipo', 'type', 'transaction-type', 'transaction type', 'order-type', 
    'event-type', 'operation-type', 'tipo de transacción'
  ],
  fulfillment: [
    'gestión logística', 'gestion logistica', 'fulfillment', 'fulfillment-channel', 
    'fulfillment channel', 'ship-service-level', 'fulfillment-id', 'fba/fbm', 
    'channel', 'logística', 'logistica', 'método de envío'
  ],
  description: [
    'descripción', 'descripcion', 'description', 'amount-description', 
    'transaction-description', 'item-description', 'fee-description', 'beschreibung'
  ],
  quantity: [
    'cantidad', 'quantity', 'qty', 'units', 'unidades'
  ],
  currency: [
    'currency', 'currency-code', 'divisa', 'moneda', 'amount-currency', 'währung'
  ],
  paymentId: [
    'identificador de pago', 'payment id', 'payment-id', 'settlement-id', 
    'payout-id', 'id de pago'
  ],
  
  // === GEOGRAPHIC / DEMOGRAPHIC DATA ===
  city: [
    'ciudad de procedencia del pedido', 'ciudad', 'city', 'order city', 
    'ship-city', 'buyer city', 'customer city', 'ciudad del pedido'
  ],
  region: [
    'comunidad autónoma de procedencia del pedido', 'comunidad autonoma', 
    'comunidad autónoma', 'región', 'region', 'state', 'province', 
    'ship-state', 'buyer state', 'provincia', 'estado'
  ],
  postalCode: [
    'código postal de procedencia del pedido', 'codigo postal', 'código postal',
    'postal code', 'zip', 'zip code', 'ship-postal-code', 'postcode'
  ],
  
  // === REVENUE (INGRESOS) ===
  productSales: [
    'ventas de productos', 'product sales', 'product-sales', 'item-price', 
    'principal', 'sales', 'product charges', 'product-charges', 'ventas', 
    'umsatz', 'ventes', 'venta de producto'
  ],
  productSalesTax: [
    'impuesto de ventas de productos', 'impuesto ventas productos',
    'product sales tax', 'product-sales-tax', 'item-tax', 'sales tax',
    'product charges tax', 'tax on product', 'iva productos'
  ],
  shippingCredits: [
    'abonos de envío', 'abonos de envio', 'créditos de envío', 
    'shipping credits', 'shipping-credits', 'postage credits', 'shipping',
    'shipping credit', 'envío', 'versand', 'shipping income'
  ],
  shippingCreditsTax: [
    'impuestos por abonos de envío', 'impuestos abonos envío',
    'shipping credits tax', 'shipping-credits-tax', 'shipping tax',
    'tax on shipping', 'iva envío'
  ],
  giftwrapCredits: [
    'abonos de envoltorio para regalo', 'envoltorio regalo',
    'giftwrap credits', 'giftwrap-credits', 'gift wrap credits', 'gift-wrap',
    'gift wrap', 'giftwrap income'
  ],
  giftwrapCreditsTax: [
    'impuestos por envoltorio para regalo', 'impuestos envoltorio',
    'giftwrap credits tax', 'giftwrap-credits-tax', 'gift wrap tax'
  ],
  promotionalRebates: [
    'devoluciones promocionales', 'descuentos promocionales',
    'promotional rebates', 'promotional-rebates', 'promo rebates', 
    'promotions', 'descuentos', 'rabatte', 'rebates', 'discount'
  ],
  promotionalRebatesTax: [
    'impuestos de descuentos por promociones', 'impuestos descuentos promociones',
    'promotional rebates tax', 'promotional-rebates-tax', 'promo tax',
    'impuestos por descuentos por promociones'
  ],
  marketplaceWithheldTax: [
    'impuesto retenido en el sitio web', 'impuesto retenido',
    'marketplace withheld tax', 'marketplace-withheld-tax', 'withheld tax',
    'tax withheld', 'marketplace tax', 'vat collected', 'iva retenido'
  ],
  taxCollectionModel: [
    'formulario de recaudación de impuestos', 'modelo de recaudación',
    'tax collection model', 'tax-collection-model', 'tax model'
  ],
  
  // === FEES (GASTOS) ===
  sellingFees: [
    'tarifas de venta', 'comisiones de venta', 'tarifas por venta',
    'selling fees', 'selling-fees', 'referral fee', 'referral-fee',
    'commission', 'sales commission', 'comisión', 'verkaufsgebühr'
  ],
  fbaFees: [
    'tarifas de logística de amazon', 'tarifas logística amazon',
    'tarifas de logistica de amazon', 'tarifas fba',
    'fba fees', 'fba-fees', 'fba fee', 'fulfillment fee', 'fulfillment-fee',
    'fba fulfillment fee', 'fba per-unit fulfillment fee', 'pick & pack',
    'versand durch amazon'
  ],
  otherTransactionFees: [
    'tarifas de otras transacciones', 'otras tarifas',
    'other transaction fees', 'other-transaction-fees', 'other fees',
    'other-fees', 'miscellaneous fees', 'additional fees'
  ],
  other: [
    'otro', 'otros', 'other', 'sonstige', 'autre', 'misc'
  ],
  fbaInboundPlacementFee: [
    'fba inbound placement fee', 'inbound placement service fee', 
    'inbound-placement', 'placement fee', 'inbound transportation',
    'inbound shipping', 'prep fee', 'tarifa de colocación'
  ],
  regulatoryFee: [
    'regulatory fee', 'regulatory-fee', 'compliance fee', 'epd fee',
    'environmental fee', 'recycling fee', 'weee fee', 'tasa regulatoria'
  ],
  storageFee: [
    'tarifa por almacenamiento', 'almacenamiento',
    'storage fee', 'storage-fee', 'fba storage fee', 'monthly storage',
    'inventory storage fee', 'lagergebühr'
  ],
  subscriptionFee: [
    'suscripción', 'tarifa de suscripción',
    'subscription fee', 'subscription-fee', 'monthly subscription',
    'professional selling fee', 'seller subscription'
  ],
  closingFee: [
    'closing fee', 'closing-fee', 'variable closing fee', 'vcf',
    'tarifa de cierre'
  ],
  removalFee: [
    'removal order', 'removal-order', 'removal fee', 'disposal fee',
    'removal', 'fba removal order', 'liquidation fee', 'tarifa de retirada'
  ],
  advertisingFee: [
    'advertising', 'advertising cost', 'ads', 'ppc', 'sponsored ads',
    'advertising-fee', 'publicidad', 'cost of advertising', 'werbung'
  ],
  
  // === REIMBURSEMENTS ===
  reimbursementTotal: [
    'reembolso', 'reembolsos', 'fba inventory reimbursement', 'reimbursement', 
    'reimbursements', 'inventory reimbursement', 'warehouse reimbursement', 'erstattung'
  ],
  reimbursementLost: [
    'lost warehouse', 'lost-warehouse', 'lost inbound', 'lost inventory',
    'inventory lost', 'fba inventory reimbursement – lost', 'inventario perdido'
  ],
  reimbursementDamaged: [
    'damaged warehouse', 'damaged-warehouse', 'damaged inventory',
    'warehouse damage', 'fba inventory reimbursement – damaged', 'inventario dañado'
  ],
  reimbursementCustomerReturn: [
    'customer return', 'customer-return', 'return reimbursement',
    'fba inventory reimbursement – customer return', 'devolución cliente'
  ],
  
  // === REFUNDS ===
  refund: [
    'reembolso', 'refund', 'refunds', 'return', 'returns', 'devolución', 
    'customer return', 'refund amount', 'rückerstattung'
  ],
  
  // === TOTALS ===
  total: [
    'total', 'amount', 'total-amount', 'net-amount', 'importe', 'monto',
    'gesamt', 'summe', 'importe total'
  ]
};

// Row types to identify transaction type from Spanish data
export const TRANSACTION_TYPES: Record<string, string> = {
  'pedido': 'Order',
  'order': 'Order',
  'reembolso': 'Refund',
  'refund': 'Refund',
  'transferir': 'Transfer',
  'transfer': 'Transfer',
  'tarifa de prestación de servicio': 'ServiceFee',
  'service fee': 'ServiceFee',
  'servicios de envío': 'ShippingService',
  'shipping service': 'ShippingService',
  'tarifas de inventario de logística de amazon': 'FBAStorageFee',
  'fba inventory fee': 'FBAStorageFee',
  'ajuste': 'Adjustment',
  'adjustment': 'Adjustment',
  'liquidation': 'Liquidation',
  'retirada': 'Removal',
  'removal': 'Removal'
};

// Rows to skip (not real transactions)
export const SKIP_ROW_PATTERNS = [
  'total income', 'total expenses', 
  'fba sales', 'fbm sales', 'awd sales',
  'net profit', 'ebitda', 'gross profit', 'gross margin',
  'bluco cost', 'bluco fee', 
  'other income', 'other expenses',
  'mistake', 'error', 'discrepancy',
  'subtotal', 'grand total',
  'summary', 'resumen',
  '---', '===', '***',
  'incluye transacciones', 'todos los importes',
  'definiciones:', 'recaudación de impuestos',
  'tarifas por venta:', 'tarifas de otras transacciones:',
  'otro:'
];

// Marketplace to country mapping - EXACT DOMAIN MATCHING
export const MARKETPLACE_COUNTRY_MAP: Record<string, {
  country: string;
  countryCode: string;
  currency: string;
  region: string;
  taxRate: number;
}> = {
  'amazon.com': { country: 'USA', countryCode: 'US', currency: 'USD', region: 'NA', taxRate: 0 },
  'amazon.ca': { country: 'Canada', countryCode: 'CA', currency: 'CAD', region: 'NA', taxRate: 0.05 },
  'amazon.com.mx': { country: 'Mexico', countryCode: 'MX', currency: 'MXN', region: 'NA', taxRate: 0.16 },
  'amazon.com.br': { country: 'Brazil', countryCode: 'BR', currency: 'BRL', region: 'SA', taxRate: 0.17 },
  'amazon.co.uk': { country: 'UK', countryCode: 'GB', currency: 'GBP', region: 'EU', taxRate: 0.20 },
  'amazon.de': { country: 'Germany', countryCode: 'DE', currency: 'EUR', region: 'EU', taxRate: 0.19 },
  'amazon.fr': { country: 'France', countryCode: 'FR', currency: 'EUR', region: 'EU', taxRate: 0.20 },
  'amazon.it': { country: 'Italy', countryCode: 'IT', currency: 'EUR', region: 'EU', taxRate: 0.22 },
  'amazon.es': { country: 'Spain', countryCode: 'ES', currency: 'EUR', region: 'EU', taxRate: 0.21 },
  'amazon.nl': { country: 'Netherlands', countryCode: 'NL', currency: 'EUR', region: 'EU', taxRate: 0.21 },
  'amazon.pl': { country: 'Poland', countryCode: 'PL', currency: 'PLN', region: 'EU', taxRate: 0.23 },
  'amazon.se': { country: 'Sweden', countryCode: 'SE', currency: 'SEK', region: 'EU', taxRate: 0.25 },
  'amazon.be': { country: 'Belgium', countryCode: 'BE', currency: 'EUR', region: 'EU', taxRate: 0.21 },
  'amazon.at': { country: 'Austria', countryCode: 'AT', currency: 'EUR', region: 'EU', taxRate: 0.20 },
  'amazon.co.jp': { country: 'Japan', countryCode: 'JP', currency: 'JPY', region: 'APAC', taxRate: 0.10 },
  'amazon.com.au': { country: 'Australia', countryCode: 'AU', currency: 'AUD', region: 'APAC', taxRate: 0.10 },
  'amazon.sg': { country: 'Singapore', countryCode: 'SG', currency: 'SGD', region: 'APAC', taxRate: 0.08 },
  'amazon.in': { country: 'India', countryCode: 'IN', currency: 'INR', region: 'APAC', taxRate: 0.18 },
  'amazon.ae': { country: 'UAE', countryCode: 'AE', currency: 'AED', region: 'MENA', taxRate: 0.05 },
  'amazon.sa': { country: 'Saudi Arabia', countryCode: 'SA', currency: 'SAR', region: 'MENA', taxRate: 0.15 },
  'amazon.eg': { country: 'Egypt', countryCode: 'EG', currency: 'EGP', region: 'MENA', taxRate: 0.14 },
  'amazon.com.tr': { country: 'Turkey', countryCode: 'TR', currency: 'TRY', region: 'MENA', taxRate: 0.18 },
};

// Exchange rates to USD
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, CAD: 0.74, MXN: 0.058, BRL: 0.20,
  JPY: 0.0067, AUD: 0.65, INR: 0.012, AED: 0.27, SAR: 0.27,
  PLN: 0.25, SEK: 0.095, SGD: 0.74, TRY: 0.031, EGP: 0.032
};

// Detect if a row should be skipped (info rows, totals, etc.)
export const shouldSkipRow = (row: Record<string, unknown>): boolean => {
  const values = Object.values(row).map(v => String(v || '').toLowerCase().trim());
  const combined = values.join(' ');
  
  // Skip if row matches skip patterns
  for (const pattern of SKIP_ROW_PATTERNS) {
    if (combined.includes(pattern)) return true;
  }
  
  // Skip if all values are empty or "Unnamed"
  const hasValidData = values.some(v => 
    v && v !== '' && !v.startsWith('unnamed') && v !== 'nan' && v !== 'null'
  );
  if (!hasValidData) return true;
  
  return false;
};

// Detect real header row - supports Spanish headers
export const isHeaderRow = (row: string[]): boolean => {
  const normalized = row.map(h => h.toLowerCase().trim());
  const headerIndicators = [
    // Spanish
    'fecha y hora', 'número de pedido', 'numero de pedido', 'sku', 
    'web de amazon', 'ventas de productos', 'tarifas de venta', 
    'total', 'tipo', 'gestión logística', 'ciudad',
    // English
    'date/time', 'date', 'datetime', 'order id', 'order-id',
    'product sales', 'selling fees', 'fba fees', 'type', 
    'marketplace', 'amount'
  ];
  
  let matches = 0;
  for (const indicator of headerIndicators) {
    if (normalized.some(h => h.includes(indicator) || h === indicator)) {
      matches++;
    }
  }
  
  return matches >= 3; // At least 3 header indicators
};

// Find the standardized column name - PRIORIZA COINCIDENCIAS EXACTAS Y PATRONES MÁS LARGOS
export const findStandardColumn = (header: string): string | null => {
  const normalized = header.toLowerCase().trim();
  
  // FASE 1: Buscar coincidencias EXACTAS primero
  for (const [standard, patterns] of Object.entries(UNIVERSAL_COLUMN_MAP)) {
    for (const pattern of patterns) {
      if (normalized === pattern) {
        return standard;
      }
    }
  }
  
  // FASE 2: Buscar coincidencias parciales, pero priorizando patrones más largos (más específicos)
  // Ordenar entradas por la longitud del patrón más largo (descendente)
  const sortedEntries = Object.entries(UNIVERSAL_COLUMN_MAP)
    .map(([standard, patterns]) => ({
      standard,
      patterns,
      maxLength: Math.max(...patterns.map(p => p.length))
    }))
    .sort((a, b) => b.maxLength - a.maxLength);
  
  for (const { standard, patterns } of sortedEntries) {
    for (const pattern of patterns.sort((a, b) => b.length - a.length)) {
      // Solo coincidencias donde el header contiene el patrón
      if (normalized.includes(pattern)) {
        return standard;
      }
    }
  }
  
  return null;
};

// Detect marketplace from "web de Amazon" or similar column
export const detectMarketplace = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  // Direct domain matching (most reliable)
  for (const domain of Object.keys(MARKETPLACE_COUNTRY_MAP)) {
    if (normalized === domain || normalized.includes(domain)) {
      return domain;
    }
  }
  
  // Check by country name or code
  for (const [domain, info] of Object.entries(MARKETPLACE_COUNTRY_MAP)) {
    if (normalized.includes(info.country.toLowerCase()) ||
        normalized.includes(info.countryCode.toLowerCase())) {
      return domain;
    }
  }
  
  // Default to amazon.com only if really unknown
  return 'amazon.com';
};

// Parse numeric value from any format - HANDLES EUROPEAN COMMA DECIMALS
export const parseNumericValue = (value: unknown): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  let str = String(value).trim();
  
  // Remove currency symbols
  str = str.replace(/[€$£¥₹]/g, '');
  
  // Handle European format: 1.234,56 -> 1234.56
  // Check if comma is used as decimal (European format)
  const hasCommaDecimal = /\d,\d{1,2}$/.test(str); // ends with ,XX or ,X
  const hasDotThousand = /\d\.\d{3}/.test(str);    // has .XXX pattern
  
  if (hasCommaDecimal || hasDotThousand) {
    // European format: remove dots (thousands), replace comma with dot (decimal)
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // US format or simple: remove commas (thousands)
    str = str.replace(/,/g, '');
  }
  
  // Remove any remaining spaces
  str = str.replace(/\s/g, '');
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Parse date from various formats including Spanish
export const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const str = String(value).trim();
  
  // Handle Spanish date format: "2 oct 2025 15:04:50 UTC"
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
  
  // Try standard date parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  // Try DD/MM/YYYY format
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    const attempts = [
      new Date(c, b - 1, a),  // DD/MM/YYYY
      new Date(c, a - 1, b),  // MM/DD/YYYY
      new Date(a, b - 1, c),  // YYYY/MM/DD
    ];
    for (const attempt of attempts) {
      if (!isNaN(attempt.getTime())) return attempt;
    }
  }
  
  return null;
};

// Classify transaction type from Spanish or English value
export const classifyTransactionType = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  for (const [pattern, type] of Object.entries(TRANSACTION_TYPES)) {
    if (normalized.includes(pattern)) {
      return type;
    }
  }
  
  return 'Other';
};
