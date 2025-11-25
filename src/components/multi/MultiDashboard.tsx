import { MultiAnalysisResult } from '@/types/multiTransaction';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Download, Globe, BarChart3, Layers, 
  AlertTriangle, Target, Package, FileText, MapPin, Receipt, Calculator
} from 'lucide-react';
import GlobalSummary from './GlobalSummary';
import CountryBreakdown from './CountryBreakdown';
import DemographicAnalysis from './DemographicAnalysis';
import SKURanking from './SKURanking';
import TransactionTypeBreakdown from './TransactionTypeBreakdown';
import { PLDashboard, PLMetrics } from './PLDashboard';

interface MultiDashboardProps {
  analysis: MultiAnalysisResult;
  plMetrics?: PLMetrics;
  onReset: () => void;
}

const MultiDashboard = ({ analysis, plMetrics, onReset }: MultiDashboardProps) => {
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

      {/* Executive Summary */}
      <Card className="glass-card border-multi/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-multi" />
            Resumen Ejecutivo Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: analysis.executiveSummary
                .replace(/## /g, '<h3 class="text-lg font-bold text-multi mt-4 mb-2">')
                .replace(/### /g, '<h4 class="text-base font-semibold text-foreground mt-3 mb-1">')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                .replace(/\| /g, '<span class="px-2">|</span> ')
                .replace(/\n/g, '<br/>')
            }}
          />
        </CardContent>
      </Card>

      {/* Global Summary Metrics */}
      <GlobalSummary global={analysis.global} fileCount={analysis.fileCount} />

      {/* Main Tabs */}
      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto flex-wrap">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Por País</span>
          </TabsTrigger>
          <TabsTrigger value="demographic" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Demográfico</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">Transacciones</span>
          </TabsTrigger>
          <TabsTrigger value="skus" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            SKUs
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="pl" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertas
            {analysis.alerts.filter(a => a.severity === 'critical').length > 0 && (
              <Badge className="bg-status-critical text-white ml-1">
                {analysis.alerts.filter(a => a.severity === 'critical').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Acciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CountryBreakdown countries={analysis.byCountry} />
        </TabsContent>

        <TabsContent value="demographic">
          <DemographicAnalysis byCity={analysis.byCity || []} byRegion={analysis.byRegion || []} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionTypeBreakdown byTransactionType={analysis.byTransactionType || []} fbaVsFbm={analysis.global.fbaVsFbm} />
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
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Desglose de Fees por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.byFeeType.map((fee) => (
                  <div key={fee.feeType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{fee.feeType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          ${fee.totalAmountUSD.toLocaleString()}
                        </span>
                        <Badge variant="outline">{fee.percentOfTotal.toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-multi rounded-full transition-all"
                        style={{ width: `${fee.percentOfTotal}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl">
          {plMetrics ? (
            <PLDashboard metrics={plMetrics} currency="USD" period={`${analysis.files[0]?.fileName || 'Análisis'}`} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">P&L se genera automáticamente al procesar archivos de transacciones</p>
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
          <div className="space-y-4">
            {analysis.alerts.map((alert, index) => (
              <Card key={index} className={`glass-card border ${getSeverityColor(alert.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-status-critical' :
                      alert.severity === 'warning' ? 'text-status-warning' : 'text-primary'
                    }`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        {alert.country && <Badge variant="outline">{alert.country}</Badge>}
                      </div>
                      <p className="text-sm font-medium">{alert.description}</p>
                      {alert.difference !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Esperado: {alert.expectedValue} | Actual: {alert.actualValue} | Diferencia: {alert.difference}
                        </p>
                      )}
                      <p className="text-sm text-multi">💡 {alert.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
