// Universal column mappings for Amazon transaction reports
// Maps various column names to standardized internal names

export const COLUMN_MAPPINGS = {
  // === IDENTIFIERS ===
  orderId: [
    'order-id', 'order id', 'orderid', 'amazon-order-id', 'pedido', 
    'order number', 'ordernumber', 'transaction-id'
  ],
  sku: [
    'sku', 'merchant-sku', 'seller-sku', 'msku', 'seller sku', 'merchant sku'
  ],
  asin: [
    'asin', 'fnsku', 'product-id', 'item-id'
  ],
  marketplace: [
    'marketplace', 'marketplace-name', 'store', 'country', 'sales-channel',
    'marketplace name', 'amazon-marketplace'
  ],
  
  // === DATES ===
  date: [
    'date/time', 'posted-date', 'settlement-start-date', 'transaction-date',
    'date', 'datetime', 'fecha', 'posted date', 'order-date'
  ],
  
  // === TRANSACTION INFO ===
  transactionType: [
    'transaction-type', 'type', 'transaction type', 'order-type', 'event-type'
  ],
  amountType: [
    'amount-type', 'amount type', 'fee-type', 'charge-type'
  ],
  description: [
    'amount-description', 'description', 'item-description', 'fee-description',
    'transaction-description'
  ],
  
  // === CURRENCY ===
  currency: [
    'currency', 'currency-code', 'divisa', 'moneda', 'amount-currency'
  ],
  
  // === REVENUE COLUMNS ===
  productCharges: [
    'product charges', 'product-charges', 'item-price', 'principal', 
    'product sales', 'product-sales', 'sales', 'item price', 'ventas'
  ],
  shippingCredits: [
    'shipping credits', 'shipping-credits', 'postage credits', 'shipping',
    'shipping credit', 'envío'
  ],
  shippingCreditsTax: [
    'shipping credits tax', 'shipping-credits-tax', 'shipping tax'
  ],
  giftwrapCredits: [
    'giftwrap credits', 'giftwrap-credits', 'gift wrap credits', 'gift-wrap'
  ],
  promotionalRebates: [
    'promotional rebates', 'promotional-rebates', 'promo rebates', 
    'promotions', 'descuentos', 'rebates'
  ],
  promotionalRebatesTax: [
    'promotional rebates tax', 'promotional-rebates-tax'
  ],
  taxIncome: [
    'tax income', 'tax-income', 'btaxable income', 'taxable-income',
    'marketplace withheld tax', 'tax collected'
  ],
  
  // === FEE COLUMNS ===
  referralFee: [
    'referral fee', 'referral-fee', 'selling fee', 'commission', 
    'sales commission', 'selling-fee', 'comisión', 'amazon fee'
  ],
  fbaFee: [
    'fba fee', 'fba-fee', 'fba fees', 'fulfillment fee', 'fulfillment-fee',
    'fba fulfillment fee', 'fba per-unit fulfillment fee', 'pick & pack'
  ],
  fbaWeightHandling: [
    'fba weight handling', 'fba-weight-handling', 'weight handling fee',
    'fba weight based fee'
  ],
  storageFee: [
    'storage fee', 'storage-fee', 'fba storage fee', 'monthly storage',
    'almacenamiento', 'inventory storage fee'
  ],
  agedInventorySurcharge: [
    'aged inventory surcharge', 'aged-inventory-surcharge', 'long term storage',
    'ltsf', 'long-term storage fee', 'aged inventory fee'
  ],
  inboundPlacement: [
    'inbound placement service fee', 'inbound-placement', 'placement fee',
    'inbound transportation', 'inbound shipping'
  ],
  removalFee: [
    'removal order', 'removal-order', 'removal fee', 'disposal fee',
    'removal', 'fba removal order'
  ],
  liquidationFee: [
    'liquidation', 'liquidation fee', 'liquidation-fee', 'liquidación'
  ],
  advertisingCost: [
    'advertising', 'advertising cost', 'ads', 'ppc', 'sponsored ads',
    'advertising-fee', 'publicidad', 'cost of advertising'
  ],
  regulatoryFee: [
    'regulatory fee', 'regulatory-fee', 'compliance fee', 'epd fee',
    'environmental fee', 'recycling fee'
  ],
  subscriptionFee: [
    'subscription fee', 'subscription-fee', 'monthly subscription',
    'professional selling fee'
  ],
  closingFee: [
    'closing fee', 'closing-fee', 'variable closing fee', 'vcf'
  ],
  orderHandling: [
    'order handling', 'order-handling', 'order handling fee'
  ],
  fbmShipping: [
    'fbm shipping', 'merchant shipping', 'shipping cost', 'fbm-shipping',
    'seller shipping', 'postage'
  ],
  returnPostage: [
    'return postage', 'return-postage', 'return postage billing',
    'return shipping'
  ],
  vineFee: [
    'vine', 'vine fee', 'vine-fee', 'amazon vine'
  ],
  retrocharge: [
    'retrocharge', 'retro-charge', 'retroactive charge'
  ],
  
  // === AWD SPECIFIC ===
  awdStorage: [
    'awd storage', 'awd-storage', 'awd storage fee', 'warehousing fee'
  ],
  awdTransportation: [
    'awd transportation', 'awd-transportation', 'awd transport fee'
  ],
  awdProcessing: [
    'awd processing', 'awd-processing', 'awd processing fee'
  ],
  
  // === REFUNDS ===
  refunds: [
    'refund', 'refunds', 'return', 'returns', 'devolución', 'reembolso',
    'customer return', 'refund amount'
  ],
  refundCommission: [
    'refund commission', 'refund-commission', 'commission refund',
    'refund fee', 'return commission'
  ],
  
  // === REIMBURSEMENTS ===
  reimbursement: [
    'fba inventory reimbursement', 'reimbursement', 'reimbursements',
    'inventory reimbursement', 'warehouse reimbursement'
  ],
  reimbursementLost: [
    'lost warehouse', 'lost-warehouse', 'lost inbound', 'lost inventory',
    'inventory lost'
  ],
  reimbursementDamaged: [
    'damaged warehouse', 'damaged-warehouse', 'damaged inventory',
    'warehouse damage'
  ],
  reimbursementCustomerService: [
    'customer service issue', 'cs issue', 'customer-service-reimbursement'
  ],
  
  // === TOTALS ===
  amount: [
    'amount', 'total', 'total-amount', 'net-amount', 'importe', 'monto'
  ],
  totalCalculated: [
    'total calculated amount', 'calculated total', 'calculated-amount'
  ],
  totalActual: [
    'actual total amount', 'actual total', 'actual-amount', 'settlement amount'
  ]
};

// Marketplace detection patterns
export const MARKETPLACE_PATTERNS: Record<string, { country: string; currency: string; region: string }> = {
  'amazon.com': { country: 'USA', currency: 'USD', region: 'NA' },
  'amazon.ca': { country: 'Canada', currency: 'CAD', region: 'NA' },
  'amazon.com.mx': { country: 'Mexico', currency: 'MXN', region: 'NA' },
  'amazon.com.br': { country: 'Brazil', currency: 'BRL', region: 'SA' },
  'amazon.co.uk': { country: 'UK', currency: 'GBP', region: 'EU' },
  'amazon.de': { country: 'Germany', currency: 'EUR', region: 'EU' },
  'amazon.fr': { country: 'France', currency: 'EUR', region: 'EU' },
  'amazon.it': { country: 'Italy', currency: 'EUR', region: 'EU' },
  'amazon.es': { country: 'Spain', currency: 'EUR', region: 'EU' },
  'amazon.nl': { country: 'Netherlands', currency: 'EUR', region: 'EU' },
  'amazon.pl': { country: 'Poland', currency: 'PLN', region: 'EU' },
  'amazon.se': { country: 'Sweden', currency: 'SEK', region: 'EU' },
  'amazon.be': { country: 'Belgium', currency: 'EUR', region: 'EU' },
  'amazon.co.jp': { country: 'Japan', currency: 'JPY', region: 'APAC' },
  'amazon.com.au': { country: 'Australia', currency: 'AUD', region: 'APAC' },
  'amazon.sg': { country: 'Singapore', currency: 'SGD', region: 'APAC' },
  'amazon.in': { country: 'India', currency: 'INR', region: 'APAC' },
  'amazon.ae': { country: 'UAE', currency: 'AED', region: 'MENA' },
  'amazon.sa': { country: 'Saudi Arabia', currency: 'SAR', region: 'MENA' },
  'amazon.eg': { country: 'Egypt', currency: 'EGP', region: 'MENA' },
  'amazon.com.tr': { country: 'Turkey', currency: 'TRY', region: 'MENA' },
};

// Report type detection patterns
export const REPORT_TYPE_PATTERNS = {
  pay: ['payment', 'pay report', 'disbursement', 'pago'],
  transaction: ['transaction', 'transacciones', 'movements'],
  settlement: ['settlement', 'liquidación', 'liquidation'],
  refund: ['refund', 'return', 'devolución', 'reembolso'],
  ads: ['advertising', 'sponsored', 'ppc', 'ads', 'publicidad'],
  reimbursement: ['reimbursement', 'reembolso inventario', 'inventory adjustment'],
  awd: ['awd', 'warehousing', 'distribution'],
  logistics: ['logistics', 'shipping', 'carrier', 'envío'],
  storage: ['storage', 'almacenamiento', 'inventory fee'],
};

// Transaction type classification
export const TRANSACTION_CATEGORIES = {
  revenue: ['order', 'shipment', 'sale', 'payment', 'transfer'],
  refund: ['refund', 'return', 'chargeback', 'adjustment'],
  fee: ['fee', 'commission', 'subscription', 'service'],
  reimbursement: ['reimbursement', 'compensation', 'credit'],
  other: ['other', 'miscellaneous', 'adjustment'],
};

// Fulfillment model detection
export const FULFILLMENT_PATTERNS = {
  fba: ['fba', 'fulfillment by amazon', 'afn', 'amazon fulfilled'],
  fbm: ['fbm', 'mfn', 'merchant fulfilled', 'seller fulfilled', 'self-fulfilled'],
  awd: ['awd', 'amazon warehousing', 'distribution center'],
  swa: ['swa', 'seller warehousing', 'seller warehouse'],
};

// Currency symbols and codes
export const CURRENCY_INFO: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  TRY: { symbol: '₺', name: 'Turkish Lira' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound' },
};

// Exchange rates to USD (approximate, would need real-time API in production)
export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.74,
  MXN: 0.058,
  BRL: 0.20,
  JPY: 0.0067,
  AUD: 0.65,
  INR: 0.012,
  AED: 0.27,
  SAR: 0.27,
  PLN: 0.25,
  SEK: 0.095,
  SGD: 0.74,
  TRY: 0.031,
  EGP: 0.032,
};
