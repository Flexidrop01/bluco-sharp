import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowRight, Building2, Truck, Package } from 'lucide-react';

interface CEOPLDashboardProps {
  metrics: AggregatedMetrics;
}

const formatEUR = (amount: number, showSign = false) => {
  const formatted = Math.abs(amount).toLocaleString('es-ES', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  if (showSign && amount < 0) return `-${formatted} €`;
  if (showSign && amount > 0) return `+${formatted} €`;
  return `${formatted} €`;
};

const CEOPLDashboard = ({ metrics }: CEOPLDashboardProps) => {
  // Calcular ventas FBA vs FBM
  const fbaData = metrics.byFulfillment.get('FBA');
  const fbmData = metrics.byFulfillment.get('FBM');
  
  const ventasFBA = fbaData?.grossSales || 0;
  const feesFBA = fbaData?.fees || 0;
  const refundsFBA = fbaData?.refunds || 0;
  
  const ventasFBM = fbmData?.grossSales || 0;
  const feesFBM = fbmData?.fees || 0;
  const refundsFBM = fbmData?.refunds || 0;
  
  // Calcular totales
  const ingresosConIVA = metrics.grossSales;
  const ingresosSinIVA = metrics.productSales; // Solo producto, sin IVA
  
  // Desglose de fees
  const tarifasVenta = Math.abs(metrics.sellingFees);
  const tarifasLogistica = Math.abs(metrics.fbaFees);
  const tarifasOtras = Math.abs(metrics.otherTransactionFees);
  const otros = Math.abs(metrics.otherFees);
  const totalGastos = metrics.totalFees;
  
  // Beneficio bruto
  const beneficioBruto = metrics.netSales - totalGastos + metrics.totalReimbursements;
  const margenBeneficio = ingresosSinIVA > 0 ? (beneficioBruto / ingresosSinIVA) * 100 : 0;
  
  // EBITDA
  const ebitda = metrics.ebitda;
  const margenEBITDA = ingresosSinIVA > 0 ? (ebitda / ingresosSinIVA) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header con KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-500">{formatEUR(ingresosConIVA)}</p>
                <p className="text-xs text-muted-foreground">Con IVA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-500">-{formatEUR(totalGastos)}</p>
                <p className="text-xs text-muted-foreground">{metrics.feePercent.toFixed(1)}% de ingresos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Beneficio Bruto</p>
                <p className="text-2xl font-bold text-blue-500">{formatEUR(beneficioBruto)}</p>
                <p className="text-xs text-muted-foreground">{margenBeneficio.toFixed(1)}% margen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${ebitda >= 0 ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ebitda >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <Percent className={`w-6 h-6 ${ebitda >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EBITDA</p>
                <p className={`text-2xl font-bold ${ebitda >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatEUR(ebitda)}</p>
                <p className="text-xs text-muted-foreground">{margenEBITDA.toFixed(1)}% margen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INGRESOS */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <TrendingUp className="w-5 h-5" />
              INGRESOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium">Ingresos Totales (Sin IVA)</TableCell>
                  <TableCell className="text-right font-bold text-green-500">{formatEUR(ingresosSinIVA)}</TableCell>
                </TableRow>
                <TableRow className="border-b-0">
                  <TableCell className="font-medium">Ingresos Totales (Con IVA)</TableCell>
                  <TableCell className="text-right font-bold text-green-500">{formatEUR(ingresosConIVA)}</TableCell>
                </TableRow>
                <TableRow className="border-b-2 border-border">
                  <TableCell colSpan={2} className="h-2"></TableCell>
                </TableRow>
                
                {/* FBA */}
                <TableRow className="bg-blue-500/5">
                  <TableCell className="pl-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    Ventas FBA (IVA incluido)
                  </TableCell>
                  <TableCell className="text-right">{formatEUR(ventasFBA)}</TableCell>
                </TableRow>
                <TableRow className="bg-blue-500/5">
                  <TableCell className="pl-8 text-muted-foreground">Reembolsos FBA</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(refundsFBA)}</TableCell>
                </TableRow>
                
                {/* FBM */}
                <TableRow className="bg-orange-500/5">
                  <TableCell className="pl-4 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500" />
                    Ventas FBM (IVA incluido)
                  </TableCell>
                  <TableCell className="text-right">{formatEUR(ventasFBM)}</TableCell>
                </TableRow>
                <TableRow className="bg-orange-500/5">
                  <TableCell className="pl-8 text-muted-foreground">Reembolsos FBM</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(refundsFBM)}</TableCell>
                </TableRow>
                
                <TableRow className="border-b-2 border-border">
                  <TableCell colSpan={2} className="h-2"></TableCell>
                </TableRow>
                
                {/* Otros ingresos */}
                <TableRow>
                  <TableCell className="pl-4 text-muted-foreground">Abonos de envío</TableCell>
                  <TableCell className="text-right">{formatEUR(metrics.shippingCredits)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-4 text-muted-foreground">Impuestos por abonos de envío</TableCell>
                  <TableCell className="text-right">{formatEUR(metrics.shippingCreditsTax)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-4 text-muted-foreground">Abonos envoltorio regalo</TableCell>
                  <TableCell className="text-right">{formatEUR(metrics.giftwrapCredits)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-4 text-muted-foreground">Devoluciones promocionales</TableCell>
                  <TableCell className="text-right text-red-500">{formatEUR(metrics.promotionalRebates, true)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* GASTOS */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TrendingDown className="w-5 h-5" />
              GASTOS TOTALES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow className="bg-red-500/5 font-bold">
                  <TableCell>Total Gastos Amazon</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(totalGastos)}</TableCell>
                </TableRow>
                
                <TableRow className="border-b-2 border-border">
                  <TableCell colSpan={2} className="h-2"></TableCell>
                </TableRow>
                
                {/* Comisiones por ventas */}
                <TableRow>
                  <TableCell className="font-medium">Comisiones por Ventas</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(tarifasVenta)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8 text-muted-foreground text-sm">% sobre ingresos</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {ingresosConIVA > 0 ? ((tarifasVenta / ingresosConIVA) * 100).toFixed(2) : 0}%
                  </TableCell>
                </TableRow>
                
                {/* Comisiones FBA */}
                <TableRow className="border-t border-border">
                  <TableCell className="font-medium">Comisiones Logística FBA</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(tarifasLogistica)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8 text-muted-foreground text-sm">% sobre ventas FBA</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {ventasFBA > 0 ? ((tarifasLogistica / ventasFBA) * 100).toFixed(2) : 0}%
                  </TableCell>
                </TableRow>
                
                {/* Otras tarifas */}
                <TableRow className="border-t border-border">
                  <TableCell className="font-medium">Tarifas Otras Transacciones</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(tarifasOtras)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Otro</TableCell>
                  <TableCell className="text-right text-red-500">-{formatEUR(otros)}</TableCell>
                </TableRow>
                
                {/* Desglose de "Otro" por tipo */}
                {Array.from(metrics.byFeeType.entries())
                  .filter(([type]) => !['Tarifas de venta', 'Logística de Amazon'].includes(type))
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, amount]) => (
                    <TableRow key={type}>
                      <TableCell className="pl-8 text-muted-foreground text-sm">{type}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">-{formatEUR(amount)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tabla dinámica por tipo de transacción */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Desglose por Tipo de Transacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Importe Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(metrics.byTransactionTypeDetail.values())
                .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
                .map((tx) => (
                  <TableRow key={tx.type}>
                    <TableCell className="font-medium">{tx.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.category === 'income' ? 'bg-green-500/10 text-green-500' :
                        tx.category === 'expense' ? 'bg-red-500/10 text-red-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {tx.category === 'income' ? '📈 Ingreso' : 
                         tx.category === 'expense' ? '📉 Gasto' : '🔄 Otro'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{tx.count.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      tx.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatEUR(tx.totalAmount, true)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Otros Movimientos y Verificación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground">Otros Movimientos (No P&L)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Transferencias al banco y otros</TableCell>
                  <TableCell className="text-right">{formatEUR(metrics.otherMovements)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              Estos movimientos no son ingresos ni gastos operativos.
              Son transferencias de caja que no afectan al P&L.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <ArrowRight className="w-5 h-5" />
              Verificación de Cuadre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Total según archivo</TableCell>
                  <TableCell className="text-right font-medium">{formatEUR(metrics.actualTotal)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>EBITDA calculado</TableCell>
                  <TableCell className="text-right font-medium">{formatEUR(ebitda)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Otros movimientos</TableCell>
                  <TableCell className="text-right font-medium">{formatEUR(metrics.otherMovements)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 border-amber-500/30">
                  <TableCell className="font-bold">Diferencia</TableCell>
                  <TableCell className={`text-right font-bold ${
                    Math.abs(metrics.actualTotal - ebitda - metrics.otherMovements) < 1 
                      ? 'text-green-500' 
                      : 'text-amber-500'
                  }`}>
                    {formatEUR(metrics.actualTotal - ebitda - metrics.otherMovements)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              {Math.abs(metrics.actualTotal - ebitda - metrics.otherMovements) < 1 
                ? '✅ Los datos cuadran perfectamente'
                : '⚠️ Hay tipos de transacción sin clasificar correctamente'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CEOPLDashboard;
