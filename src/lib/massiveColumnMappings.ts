// Extended universal column mappings for massive file processing
// Handles any Amazon report format from any marketplace

export const UNIVERSAL_COLUMN_MAP: Record<string, string[]> = {
  // === IDENTIFIERS ===
  date: [
    'date/time', 'datetime', 'date', 'posted-date', 'settlement-start-date',
    'transaction-date', 'fecha', 'datum', 'data', 'order-date', 'posted date'
  ],
  orderId: [
    'order id', 'order-id', 'orderid', 'amazon-order-id', 'pedido', 
    'order number', 'ordernumber', 'transaction-id', 'bestellnummer'
  ],
  sku: [
    'sku', 'merchant-sku', 'seller-sku', 'msku', 'seller sku', 'merchant sku',
    'product-sku', 'item-sku'
  ],
  asin: [
    'asin', 'fnsku', 'product-id', 'item-id', 'product id'
  ],
  marketplace: [
    'marketplace', 'marketplace-name', 'store', 'sales-channel',
    'marketplace name', 'amazon-marketplace', 'site'
  ],
  type: [
    'type', 'transaction-type', 'transaction type', 'order-type', 'event-type',
    'tipo', 'operation-type'
  ],
  fulfillment: [
    'fulfillment', 'fulfillment-channel', 'fulfillment channel', 'ship-service-level',
    'fulfillment-id', 'fba/fbm', 'channel'
  ],
  currency: [
    'currency', 'currency-code', 'divisa', 'moneda', 'amount-currency', 'währung'
  ],
  description: [
    'description', 'amount-description', 'transaction-description', 'item-description',
    'fee-description', 'descripción', 'beschreibung'
  ],
  
  // === REVENUE (INGRESOS) ===
  productSales: [
    'product sales', 'product-sales', 'item-price', 'principal', 'sales',
    'product charges', 'product-charges', 'ventas', 'umsatz', 'ventes'
  ],
  productSalesTax: [
    'product sales tax', 'product-sales-tax', 'item-tax', 'sales tax',
    'product charges tax', 'tax on product'
  ],
  shippingCredits: [
    'shipping credits', 'shipping-credits', 'postage credits', 'shipping',
    'shipping credit', 'envío', 'versand', 'shipping income'
  ],
  shippingCreditsTax: [
    'shipping credits tax', 'shipping-credits-tax', 'shipping tax',
    'tax on shipping'
  ],
  giftwrapCredits: [
    'giftwrap credits', 'giftwrap-credits', 'gift wrap credits', 'gift-wrap',
    'gift wrap', 'giftwrap income'
  ],
  giftwrapCreditsTax: [
    'giftwrap credits tax', 'giftwrap-credits-tax', 'gift wrap tax'
  ],
  promotionalRebates: [
    'promotional rebates', 'promotional-rebates', 'promo rebates', 
    'promotions', 'descuentos', 'rabatte', 'rebates', 'discount'
  ],
  promotionalRebatesTax: [
    'promotional rebates tax', 'promotional-rebates-tax', 'promo tax'
  ],
  marketplaceWithheldTax: [
    'marketplace withheld tax', 'marketplace-withheld-tax', 'withheld tax',
    'tax withheld', 'marketplace tax', 'vat collected'
  ],
  taxCollectionModel: [
    'tax collection model', 'tax-collection-model', 'tax model'
  ],
  
  // === FEES (GASTOS) ===
  sellingFees: [
    'selling fees', 'selling-fees', 'referral fee', 'referral-fee',
    'commission', 'sales commission', 'comisión', 'verkaufsgebühr'
  ],
  fbaFees: [
    'fba fees', 'fba-fees', 'fba fee', 'fulfillment fee', 'fulfillment-fee',
    'fba fulfillment fee', 'fba per-unit fulfillment fee', 'pick & pack',
    'versand durch amazon'
  ],
  otherTransactionFees: [
    'other transaction fees', 'other-transaction-fees', 'other fees',
    'other-fees', 'miscellaneous fees', 'additional fees'
  ],
  other: [
    'other', 'otros', 'sonstige', 'autre', 'misc'
  ],
  fbaInboundPlacementFee: [
    'fba inbound placement fee', 'inbound placement service fee', 
    'inbound-placement', 'placement fee', 'inbound transportation',
    'inbound shipping', 'prep fee'
  ],
  regulatoryFee: [
    'regulatory fee', 'regulatory-fee', 'compliance fee', 'epd fee',
    'environmental fee', 'recycling fee', 'weee fee'
  ],
  storageFee: [
    'storage fee', 'storage-fee', 'fba storage fee', 'monthly storage',
    'almacenamiento', 'inventory storage fee', 'lagergebühr'
  ],
  subscriptionFee: [
    'subscription fee', 'subscription-fee', 'monthly subscription',
    'professional selling fee', 'seller subscription'
  ],
  closingFee: [
    'closing fee', 'closing-fee', 'variable closing fee', 'vcf'
  ],
  removalFee: [
    'removal order', 'removal-order', 'removal fee', 'disposal fee',
    'removal', 'fba removal order', 'liquidation fee'
  ],
  advertisingFee: [
    'advertising', 'advertising cost', 'ads', 'ppc', 'sponsored ads',
    'advertising-fee', 'publicidad', 'cost of advertising', 'werbung'
  ],
  
  // === REIMBURSEMENTS ===
  reimbursementTotal: [
    'fba inventory reimbursement', 'reimbursement', 'reimbursements',
    'inventory reimbursement', 'warehouse reimbursement', 'erstattung'
  ],
  reimbursementLost: [
    'lost warehouse', 'lost-warehouse', 'lost inbound', 'lost inventory',
    'inventory lost', 'fba inventory reimbursement – lost'
  ],
  reimbursementDamaged: [
    'damaged warehouse', 'damaged-warehouse', 'damaged inventory',
    'warehouse damage', 'fba inventory reimbursement – damaged'
  ],
  reimbursementCustomerReturn: [
    'customer return', 'customer-return', 'return reimbursement',
    'fba inventory reimbursement – customer return'
  ],
  
  // === REFUNDS ===
  refund: [
    'refund', 'refunds', 'return', 'returns', 'devolución', 'reembolso',
    'customer return', 'refund amount', 'rückerstattung'
  ],
  
  // === TOTALS ===
  total: [
    'total', 'amount', 'total-amount', 'net-amount', 'importe', 'monto',
    'gesamt', 'summe'
  ]
};

// Rows to skip (not real transactions)
export const SKIP_ROW_PATTERNS = [
  'total income', 'total expenses', 'total', 
  'fba sales', 'fbm sales', 'awd sales',
  'net profit', 'ebitda', 'gross profit', 'gross margin',
  'bluco cost', 'bluco fee', 
  'other income', 'other expenses',
  'mistake', 'error', 'discrepancy',
  'subtotal', 'grand total',
  'summary', 'resumen',
  '---', '===', '***'
];

// Marketplace to country mapping
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

// Detect if a row should be skipped
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

// Detect real header row
export const isHeaderRow = (row: string[]): boolean => {
  const normalized = row.map(h => h.toLowerCase().trim());
  const headerIndicators = [
    'date/time', 'date', 'datetime', 'order id', 'order-id',
    'product sales', 'selling fees', 'fba fees', 'type', 'sku',
    'marketplace', 'total', 'amount'
  ];
  
  let matches = 0;
  for (const indicator of headerIndicators) {
    if (normalized.some(h => h.includes(indicator))) {
      matches++;
    }
  }
  
  return matches >= 3; // At least 3 header indicators
};

// Find the standardized column name
export const findStandardColumn = (header: string): string | null => {
  const normalized = header.toLowerCase().trim();
  
  for (const [standard, patterns] of Object.entries(UNIVERSAL_COLUMN_MAP)) {
    if (patterns.some(p => normalized === p || normalized.includes(p))) {
      return standard;
    }
  }
  
  return null;
};

// Detect marketplace from various data
export const detectMarketplace = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  for (const domain of Object.keys(MARKETPLACE_COUNTRY_MAP)) {
    if (normalized.includes(domain) || 
        normalized.includes(MARKETPLACE_COUNTRY_MAP[domain].country.toLowerCase()) ||
        normalized.includes(MARKETPLACE_COUNTRY_MAP[domain].countryCode.toLowerCase())) {
      return domain;
    }
  }
  
  // Default to amazon.com
  return 'amazon.com';
};

// Parse numeric value from any format
export const parseNumericValue = (value: unknown): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  const str = String(value)
    .replace(/[€$£¥₹]/g, '')  // Remove currency symbols
    .replace(/,/g, '')        // Remove thousand separators
    .replace(/\s/g, '')       // Remove spaces
    .trim();
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Parse date from various formats
export const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const str = String(value).trim();
  const date = new Date(str);
  
  if (isNaN(date.getTime())) {
    // Try DD/MM/YYYY format
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      // Try different formats
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
  }
  
  return date;
};
