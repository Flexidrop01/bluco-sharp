import { AnalysisResult, ReportType } from '@/types/analysis';

export const generateMockAnalysis = (fileName: string, reportType: ReportType): AnalysisResult => {
  const isSeller = reportType === 'seller';
  
  return {
    reportType,
    fileName,
    analyzedAt: new Date(),
    
    executiveSummary: isSeller 
      ? `**ANÁLISIS DIRECTO SIN FILTROS:**

Esta cuenta está sangrando dinero. Fee structure al 34.2% sobre ventas netas — INACEPTABLE. El marketplace de Italia está destruyendo tu margen con un 42% de fees. 

Tienes 3 SKUs zombies que están consumiendo storage fees sin generar ventas relevantes. El refund rate del 8.7% en Alemania es una ALERTA ROJA que indica problemas de calidad de producto o listing engañoso.

**Lo bueno:** Francia y España mantienen ratios saludables. Top SKU genera el 23% de las ventas con fees controlados.

**Lo crítico:** HAY QUE CORTAR Italia YA. Revisar pricing en DE inmediatamente. Eliminar variaciones muertas antes del próximo ciclo de storage.

Estimación de pérdida mensual por ineficiencias: €4,200-€5,800.`
      : `**ANÁLISIS DIRECTO SIN FILTROS:**

Vendor te está sangrando por todos lados. Las deducciones representan un 18.4% de tu facturación bruta — MUY POR ENCIMA del benchmark del 12%.

Shortages del 4.2% indican problemas graves de logística o Amazon te está aplicando penalizaciones injustificadas. Co-op fees descontrolados al 8% cuando deberían estar en 5-6%.

**Lo bueno:** ASP se mantiene estable. PO fill rate del 94% es aceptable.

**Lo crítico:** HAY QUE RECLAMAR los shortages inmediatamente. Renegociar términos de co-op. Auditar cada chargeback.

Estimación de dinero perdido en deducciones injustificadas: €12,400-€18,600 anuales.`,

    metrics: {
      grossSales: {
        label: 'Ventas Brutas',
        value: isSeller ? '€127,845.32' : '€892,456.00',
        change: 12.4,
        status: 'success',
        description: 'Total facturado antes de fees y devoluciones'
      },
      netSales: {
        label: 'Ventas Netas',
        value: isSeller ? '€84,112.67' : '€728,453.12',
        change: 8.2,
        status: 'neutral',
        description: 'Ventas después de devoluciones'
      },
      totalFees: {
        label: isSeller ? 'Fees Totales' : 'Deducciones Totales',
        value: isSeller ? '€28,762.45' : '€164,002.88',
        change: -15.3,
        status: 'warning',
        description: isSeller ? 'Referral + FBA + Storage + Otros' : 'Shortages + Chargebacks + Co-op'
      },
      feePercent: {
        label: '% Fees/Neto',
        value: isSeller ? '34.2%' : '22.5%',
        status: 'critical',
        description: isSeller ? 'CRÍTICO: Objetivo < 30%' : 'CRÍTICO: Objetivo < 15%'
      },
      refunds: {
        label: 'Devoluciones',
        value: isSeller ? '€12,432.65' : '€45,234.00',
        change: -22.1,
        status: 'warning'
      },
      refundRate: {
        label: 'Tasa Devolución',
        value: isSeller ? '9.7%' : '5.1%',
        status: isSeller ? 'critical' : 'warning',
        description: isSeller ? 'ALARMA: > 8% requiere acción' : 'Por encima del benchmark'
      },
      profitEstimate: {
        label: 'Profit Estimado',
        value: '€??.???',
        status: 'neutral',
        description: 'Requiere COGS para cálculo exacto'
      }
    },

    skuPerformance: [
      {
        sku: 'BLC-PRO-001',
        name: 'Producto Premium Alpha',
        sales: 34567.89,
        fees: 9823.45,
        feePercent: 28.4,
        refunds: 1234.56,
        refundRate: 3.6,
        status: 'success'
      },
      {
        sku: 'BLC-STD-042',
        name: 'Producto Standard Beta',
        sales: 23456.78,
        fees: 8234.12,
        feePercent: 35.1,
        refunds: 2345.67,
        refundRate: 10.0,
        status: 'critical'
      },
      {
        sku: 'BLC-ECO-015',
        name: 'Producto Económico Gamma',
        sales: 18234.56,
        fees: 6012.34,
        feePercent: 33.0,
        refunds: 1456.78,
        refundRate: 8.0,
        status: 'warning'
      },
      {
        sku: 'BLC-VAR-007',
        name: 'Variación Delta (ZOMBIE)',
        sales: 234.56,
        fees: 156.78,
        feePercent: 66.8,
        refunds: 89.12,
        refundRate: 38.0,
        status: 'critical'
      },
      {
        sku: 'BLC-NEW-099',
        name: 'Producto Nuevo Epsilon',
        sales: 12345.67,
        fees: 3456.78,
        feePercent: 28.0,
        refunds: 567.89,
        refundRate: 4.6,
        status: 'success'
      }
    ],

    marketplaceBreakdown: [
      {
        marketplace: 'Amazon.es',
        sales: 45678.90,
        fees: 12345.67,
        feePercent: 27.0,
        orders: 892,
        status: 'success'
      },
      {
        marketplace: 'Amazon.de',
        sales: 38234.56,
        fees: 13456.78,
        feePercent: 35.2,
        orders: 645,
        status: 'warning'
      },
      {
        marketplace: 'Amazon.fr',
        sales: 28456.78,
        fees: 7890.12,
        feePercent: 27.7,
        orders: 534,
        status: 'success'
      },
      {
        marketplace: 'Amazon.it',
        sales: 15475.08,
        fees: 6502.88,
        feePercent: 42.0,
        orders: 287,
        status: 'critical'
      }
    ],

    strategicAnalysis: {
      risks: [
        'Dependencia excesiva del marketplace español (35.7% de ventas)',
        'Fee structure insostenible en Italia — erosiona todo el margen',
        'Refund rate en Alemania indica problema sistémico de producto/listing',
        'SKUs zombie consumiendo recursos sin retorno',
        'Exposición a cambios de política de fees sin margen de maniobra'
      ],
      opportunities: [
        'Francia muestra potencial de crecimiento con métricas saludables',
        'Top SKU tiene margen para aumentar precio 8-12%',
        'Optimización de packaging podría reducir fees FBA 15-20%',
        'Consolidación de variaciones podría mejorar conversión',
        'UK no explotado — market entry con productos validados'
      ],
      dependencies: [
        'Amazon como único canal de venta (riesgo concentración)',
        'Dependencia de FBA para logística en todos los mercados',
        'Sin diversificación de proveedores identificada'
      ],
      recommendations: [
        'INMEDIATO: Evaluar cierre de operaciones en Italia',
        'CORTO PLAZO: Auditar y eliminar SKUs con fee% > 40%',
        'MEDIO PLAZO: Desarrollar canal propio o B2B para reducir dependencia',
        'LARGO PLAZO: Estrategia multi-marketplace fuera de Amazon'
      ]
    },

    operationalAnalysis: {
      feeStructure: 'Referral fees en línea con categoría. FBA fees elevados por dimensiones/peso no optimizados. Storage fees disparados en Q4 por exceso de inventario. Recomendación: auditar weight tiers de todos los ASINs.',
      refundStructure: 'Patrón concentrado en variaciones específicas y marketplace DE. Causas probables: discrepancia de expectativas en listing, problemas de sizing, o calidad inconsistente entre lotes.',
      skuIssues: [
        'BLC-VAR-007: Fee% del 66.8% + refund rate 38% — MATAR INMEDIATAMENTE',
        'BLC-STD-042: Refund rate 10% requiere investigación de causa raíz',
        '3 variaciones sin ventas en 90 días consumiendo storage'
      ],
      pricingIssues: [
        'BLC-PRO-001 con margen para incremento de precio',
        'BLC-ECO-015 en guerra de precios — evaluar diferenciación',
        'Promociones en IT destruyendo margen sin incremento de volumen'
      ],
      logisticsIssues: [
        'Weight tier incorrecto en 2 ASINs principales',
        'Packaging sobredimensionado aumentando fees innecesariamente',
        'Inventario excesivo en almacenes IT sin rotación'
      ],
      inventoryIssues: [
        'IPI score bajo riesgo de límites de capacidad',
        'Aged inventory acumulando storage fees',
        'Forecast desalineado con demanda real en mercados secundarios'
      ]
    },

    actionPlan: [
      {
        priority: 'critical',
        action: 'Eliminar SKU BLC-VAR-007 y variaciones zombie',
        impact: 'Ahorro inmediato €200-400/mes en fees',
        timeframe: '24-48 horas'
      },
      {
        priority: 'critical',
        action: 'Evaluar cierre de operaciones Amazon.it',
        impact: 'Eliminar sangrado de margen del 42%',
        timeframe: '1 semana'
      },
      {
        priority: 'high',
        action: 'Auditar listings DE para reducir refund rate',
        impact: 'Reducción potencial 50% en devoluciones',
        timeframe: '1-2 semanas'
      },
      {
        priority: 'high',
        action: 'Optimizar packaging para reducir weight tier',
        impact: 'Ahorro 15-20% en FBA fees',
        timeframe: '2-4 semanas'
      },
      {
        priority: 'medium',
        action: 'Incrementar precio BLC-PRO-001 un 10%',
        impact: 'Incremento margen €3,400/mes',
        timeframe: '1 semana'
      },
      {
        priority: 'medium',
        action: 'Liquidar aged inventory antes de siguiente fee cycle',
        impact: 'Evitar €800-1,200 en storage fees',
        timeframe: '2 semanas'
      },
      {
        priority: 'low',
        action: 'Preparar market entry UK con top performers',
        impact: 'Nuevo mercado con métricas validadas',
        timeframe: '1-2 meses'
      }
    ],

    missingData: [
      {
        field: 'COGS (Coste de Producto)',
        reason: 'No incluido en el fichero de transacciones',
        impact: 'Imposible calcular profit real y ROI por SKU'
      },
      {
        field: 'Informe de Advertising',
        reason: 'Datos de PPC/Ads no presentes',
        impact: 'No se puede evaluar TACOS ni eficiencia publicitaria'
      },
      {
        field: 'Informe de Tráfico y Conversión',
        reason: 'Métricas de sesiones/conversión no disponibles',
        impact: 'No se puede diagnosticar problemas de listing'
      },
      {
        field: 'Datos de Inventario en Tiempo Real',
        reason: 'Solo transacciones, no stock actual',
        impact: 'No se puede optimizar reposición ni IPI'
      },
      {
        field: 'Historial de Precios y Buy Box',
        reason: 'No incluido en el fichero',
        impact: 'No se puede analizar competitividad de pricing'
      }
    ]
  };
};
