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
import CountryBreakdown from './CountryBreakdown';
import DemographicAnalysis from './DemographicAnalysis';
import SKURanking from './SKURanking';
import TransactionTypeBreakdown from './TransactionTypeBreakdown';
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

      {/* Global Summary Metrics */}
      <GlobalSummary global={analysis.global} fileCount={analysis.fileCount} />

      {/* Main Tabs - SIMPLIFICADO sin pestañas redundantes */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto flex-wrap">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">Transacciones</span>
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Por País</span>
          </TabsTrigger>
          <TabsTrigger value="demographic" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Demográfico</span>
          </TabsTrigger>
          <TabsTrigger value="skus" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            SKUs
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Fees
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

        <TabsContent value="transactions">
          <TransactionTypeBreakdown byTransactionType={analysis.byTransactionType || []} fbaVsFbm={analysis.global.fbaVsFbm} />
        </TabsContent>

        <TabsContent value="countries">
          <CountryBreakdown countries={analysis.byCountry} />
        </TabsContent>

        <TabsContent value="demographic">
          <DemographicAnalysis byCity={analysis.byCity || []} byRegion={analysis.byRegion || []} />
        </TabsContent>

        <TabsContent value="skus">
          <SKURanking allSKUs={analysis.allSKUs || []} topSKUs={analysis.topSKUs} bottomSKUs={analysis.bottomSKUs} />
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
