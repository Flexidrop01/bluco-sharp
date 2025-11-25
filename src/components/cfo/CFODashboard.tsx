import { CFOAnalysisResult } from '@/types/cfo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, FileText, Scale, Globe, AlertTriangle, ClipboardList } from 'lucide-react';
import CFOExecutiveSummary from './CFOExecutiveSummary';
import CFOCountryObligations from './CFOCountryObligations';
import CFOVATAnalysis from './CFOVATAnalysis';
import CFOErrorsList from './CFOErrorsList';
import CFOActionPlan from './CFOActionPlan';

interface CFODashboardProps {
  analysis: CFOAnalysisResult;
  onReset: () => void;
}

const CFODashboard = ({ analysis, onReset }: CFODashboardProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onReset}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-6 h-6 text-cfo" />
              <h1 className="text-2xl font-bold text-gradient-cfo">CFO Brain</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.fileName} • {analysis.period}
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-cfo/30 hover:bg-cfo/10">
          <Download className="w-4 h-4 mr-2" />
          Exportar Informe
        </Button>
      </div>

      {/* Executive Summary */}
      <CFOExecutiveSummary summary={analysis.executiveSummary} />

      {/* Tabs */}
      <Tabs defaultValue="countries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/50">
          <TabsTrigger value="countries" className="py-3 data-[state=active]:bg-cfo data-[state=active]:text-cfo-foreground">
            <Globe className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Obligaciones</span>
          </TabsTrigger>
          <TabsTrigger value="vat" className="py-3 data-[state=active]:bg-cfo data-[state=active]:text-cfo-foreground">
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">IVA</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="py-3 data-[state=active]:bg-cfo data-[state=active]:text-cfo-foreground">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Errores</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="py-3 data-[state=active]:bg-cfo data-[state=active]:text-cfo-foreground">
            <ClipboardList className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Acciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CFOCountryObligations countries={analysis.countryObligations} />
        </TabsContent>

        <TabsContent value="vat">
          <CFOVATAnalysis analysis={analysis} />
        </TabsContent>

        <TabsContent value="errors">
          <CFOErrorsList 
            errors={analysis.errors} 
            fbaMovements={analysis.fbaMovements} 
          />
        </TabsContent>

        <TabsContent value="actions">
          <CFOActionPlan 
            actions={analysis.actionPlan} 
            regularizations={analysis.regularizations} 
          />
        </TabsContent>
      </Tabs>

      {/* Raw Metrics Footer */}
      <div className="p-4 rounded-xl bg-card/30 border border-border/30">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Tipo: {analysis.reportType}</span>
          <span>•</span>
          <span>{analysis.rawMetrics.totalRows.toLocaleString()} filas procesadas</span>
          <span>•</span>
          <span>{analysis.rawMetrics.validTransactions.toLocaleString()} transacciones válidas</span>
          <span>•</span>
          <span>{analysis.rawMetrics.uniqueSkus} SKUs únicos</span>
          <span>•</span>
          <span>{analysis.rawMetrics.uniqueCountries.length} países</span>
        </div>
      </div>
    </div>
  );
};

export default CFODashboard;
