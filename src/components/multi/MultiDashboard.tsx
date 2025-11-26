import { MultiAnalysisResult } from '@/types/multiTransaction';
import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Download, Globe, BarChart3, Layers, 
  AlertTriangle, Target, Package, FileText, MapPin, Receipt, Calculator, Brain
} from 'lucide-react';
import GlobalSummary from './GlobalSummary';
import CountryBreakdownV2 from './CountryBreakdownV2';
import DemographicAnalysisV2 from './DemographicAnalysisV2';
import SKURanking from './SKURanking';
import TransactionBreakdownV2 from './TransactionBreakdownV2';
import FeeBreakdown from './FeeBreakdown';
import AlertsPanel from './AlertsPanel';
import { PLDashboard } from './PLDashboard';
import CEOBrainPLTable from './CEOBrainPLTable';
import CEOPLDashboard from './CEOPLDashboard';
import { PLResult } from '@/lib/metricsToPL';
import { MonthlyPLTable } from '@/lib/ceoBrainPLBuilder';

interface MultiDashboardProps {
  analysis: MultiAnalysisResult;
  rawMetrics?: AggregatedMetrics;
  plResult?: PLResult;
  ceoBrainPL?: MonthlyPLTable;
  onReset: () => void;
}

const MultiDashboard = ({ analysis, rawMetrics, plResult, ceoBrainPL, onReset }: MultiDashboardProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-status-critical/20 text-status-critical border-status-critical/30';
      case 'warning': return 'bg-status-warning/20 text-status-warning border-status-warning/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-status-critical text-white';
      case 'high': return 'bg-amazon-orange text-white';
      case 'medium': return 'bg-status-warning text-black';
      default: return 'bg-muted text-foreground';
    }
  };

  // Contar alertas críticas para el badge
  const criticalAlerts = rawMetrics ? (() => {
    let count = 0;
    const ventasConIVA = rawMetrics.salesWithTax;
    const gastosTotales = Math.abs(rawMetrics.totalFees);
    const reembolsos = rawMetrics.totalRefunds;
    const ebitda = rawMetrics.ebitda;
    
    const margenEbitda = ventasConIVA > 0 ? (ebitda / ventasConIVA) * 100 : 0;
    const feePercent = ventasConIVA > 0 ? (gastosTotales / ventasConIVA) * 100 : 0;
    const refundRate = ventasConIVA > 0 ? (reembolsos / ventasConIVA) * 100 : 0;
    
    if (margenEbitda < 0) count++;
    if (feePercent > 40) count++;
    if (refundRate > 10) count++;
    
    return count;
  })() : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onReset}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-multi" />
              <span className="font-medium text-foreground">
                Análisis Multi-Mercado
              </span>
              <Badge variant="outline">{analysis.fileCount} archivos</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analizado: {formatDate(analysis.analyzedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button className="bg-multi hover:bg-multi/90 text-white" size="sm" onClick={onReset}>
            Nuevo análisis
          </Button>
        </div>
      </div>

      {/* CEO P&L Dashboard - Visual and Professional */}
      {rawMetrics && (
        <CEOPLDashboard metrics={rawMetrics} />
      )}

      {/* Global Summary Metrics - Usando rawMetrics */}
      {rawMetrics && (
        <GlobalSummary metrics={rawMetrics} fileCount={analysis.fileCount} />
      )}

      {/* Main Tabs - Improved UX */}
      <Tabs defaultValue="countries" className="space-y-6">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsList className="glass-card p-1.5 w-full grid grid-cols-4 md:grid-cols-8 gap-1 h-auto">
            <TabsTrigger 
              value="countries" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-medium">País</span>
            </TabsTrigger>
            <TabsTrigger 
              value="demographic" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-multi data-[state=active]:text-white"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-medium">Demográfico</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-amazon-orange data-[state=active]:text-white"
            >
              <Receipt className="w-4 h-4" />
              <span className="text-[10px] font-medium">Transacciones</span>
            </TabsTrigger>
            <TabsTrigger 
              value="skus" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-idq data-[state=active]:text-white"
            >
              <Package className="w-4 h-4" />
              <span className="text-[10px] font-medium">SKUs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="fees" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-cfo data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-medium">Fees</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pl" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-status-success data-[state=active]:text-white"
            >
              <Calculator className="w-4 h-4" />
              <span className="text-[10px] font-medium">P&L</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ceobrain" 
              className="flex flex-col items-center gap-1 py-2 px-2 bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="w-4 h-4" />
              <span className="text-[10px] font-medium">CEO Brain</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-status-critical data-[state=active]:text-white relative"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-medium">Alertas</span>
              {criticalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-critical text-white text-[8px] rounded-full flex items-center justify-center">
                  {criticalAlerts}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="countries">
          {rawMetrics ? (
            <CountryBreakdownV2 metrics={rawMetrics} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay datos de países disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="demographic">
          {rawMetrics ? (
            <DemographicAnalysisV2 metrics={rawMetrics} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay datos demográficos disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          {rawMetrics ? (
            <TransactionBreakdownV2 metrics={rawMetrics} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay datos de transacciones disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="skus">
          <SKURanking allSKUs={analysis.allSKUs || []} topSKUs={analysis.topSKUs} bottomSKUs={analysis.bottomSKUs} />
        </TabsContent>

        <TabsContent value="models">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.byModel.map((model) => (
              <Card key={model.model} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      model.model === 'FBA' ? 'bg-primary' :
                      model.model === 'FBM' ? 'bg-amazon-orange' : 'bg-idq'
                    }`} />
                    {model.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Ventas</p>
                      <p className="text-xl font-bold">${(model.totalSalesUSD / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Fee %</p>
                      <p className={`text-xl font-bold ${model.feePercent > 30 ? 'text-status-critical' : 'text-foreground'}`}>
                        {model.feePercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Refund Rate</p>
                      <p className={`text-xl font-bold ${model.refundRate > 8 ? 'text-status-critical' : 'text-foreground'}`}>
                        {model.refundRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Transacciones</p>
                      <p className="text-xl font-bold">{model.transactionCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Países activos:</p>
                    <div className="flex flex-wrap gap-1">
                      {model.countries.map(c => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees">
          {rawMetrics ? (
            <FeeBreakdown metrics={rawMetrics} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay datos de fees disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pl">
          {plResult ? (
            <PLDashboard 
              metrics={plResult.total} 
              currency={plResult.currency} 
              period={`${analysis.files[0]?.fileName || 'Análisis'}`}
              monthlyData={plResult.monthly}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">P&L se genera automáticamente al procesar archivos de transacciones</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ceobrain">
          {ceoBrainPL ? (
            <CEOBrainPLTable 
              plTable={ceoBrainPL}
              onExportPDF={() => {
                // TODO: Implement PDF export
                console.log('Export CEO Brain P&L to PDF');
              }}
              onExportExcel={() => {
                // TODO: Implement Excel export
                console.log('Export CEO Brain P&L to Excel');
              }}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">CEO Brain P&L mensual se genera automáticamente al procesar archivos de transacciones</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="skus">
          <div className="space-y-6">
            <Card className="glass-card border-status-success/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-status-success">🏆 Top SKUs por Rentabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topSKUs.map((sku, i) => (
                    <div key={sku.sku} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-status-success/20 text-status-success text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{sku.sku}</p>
                          <p className="text-xs text-muted-foreground">{sku.asin}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-status-success">${sku.profit.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{sku.profitMargin.toFixed(1)}% margen</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-status-critical/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-status-critical">⚠️ SKUs Problemáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.bottomSKUs.map((sku, i) => (
                    <div key={sku.sku} className="flex items-center justify-between p-3 rounded-lg bg-status-critical/10">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-status-critical" />
                        <div>
                          <p className="font-medium text-sm">{sku.sku}</p>
                          <p className="text-xs text-muted-foreground">
                            Fee: {sku.feePercent.toFixed(1)}% | Refund: {sku.refundRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-status-critical">{sku.profitMargin.toFixed(1)}% margen</p>
                        <p className="text-xs text-muted-foreground">${sku.profit.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          {rawMetrics ? (
            <AlertsPanel metrics={rawMetrics} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay datos para generar alertas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-multi" />
                Plan de Acción Priorizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{rec.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.impact}</p>
                      {rec.country && (
                        <Badge variant="outline" className="mt-2 text-xs">{rec.country}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Files Processed */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Archivos Procesados ({analysis.files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.files.map((file) => (
              <div key={file.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-multi" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.country} • {file.currency} • {file.rowCount.toLocaleString()} filas
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{file.reportType}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiDashboard;
