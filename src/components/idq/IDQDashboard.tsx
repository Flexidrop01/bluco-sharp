import { useState } from 'react';
import { IDQAnalysisResult } from '@/types/idq';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Download, FileText, Sparkles, BarChart3, 
  List, Target, AlertTriangle, Search 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import IDQCatalogDiagnosis from './IDQCatalogDiagnosis';
import IDQASINDetail from './IDQASINDetail';
import IDQActionPlan from './IDQActionPlan';

interface IDQDashboardProps {
  analysis: IDQAnalysisResult;
  onReset: () => void;
}

const IDQDashboard = ({ analysis, onReset }: IDQDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  };

  const filteredAsins = analysis.asinAnalyses.filter(asin => 
    asin.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asin.marketplace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAsins = [...filteredAsins].sort((a, b) => (a.idqScore || 100) - (b.idqScore || 100));

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
              <Sparkles className="w-4 h-4 text-idq" />
              <span className="font-medium text-foreground">{analysis.fileName}</span>
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
          <Button className="bg-idq hover:bg-idq/90 text-white" size="sm" onClick={onReset}>
            Nuevo análisis
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="glass-card border-idq/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-idq" />
            Resumen Ejecutivo IDQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm prose-invert max-w-none">
            <div 
              className="text-sm leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: analysis.executiveSummary
                  .replace(/## /g, '<h3 class="text-lg font-bold text-idq mt-4 mb-2">')
                  .replace(/### /g, '<h4 class="text-base font-semibold text-foreground mt-3 mb-1">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <Card className="glass-card border-status-warning/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-status-warning">Advertencias del análisis</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="diagnosis" className="space-y-4">
        <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Diagnóstico Catálogo</span>
            <span className="sm:hidden">Catálogo</span>
          </TabsTrigger>
          <TabsTrigger value="asins" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Análisis por ASIN</span>
            <span className="sm:hidden">ASINs</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Plan de Acción</span>
            <span className="sm:hidden">Acciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <IDQCatalogDiagnosis diagnosis={analysis.catalogDiagnosis} />
        </TabsContent>

        <TabsContent value="asins" className="space-y-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por ASIN o marketplace..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {sortedAsins.length} de {analysis.asinAnalyses.length} ASINs
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sortedAsins.map((asin) => (
              <IDQASINDetail key={asin.asin} analysis={asin} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <IDQActionPlan actions={analysis.actionPlan} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IDQDashboard;
