import { CFOAnalysisResult } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, AlertTriangle, Plane, Building2 } from 'lucide-react';

interface CFOVATAnalysisProps {
  analysis: CFOAnalysisResult;
}

const CFOVATAnalysis = ({ analysis }: CFOVATAnalysisProps) => {
  const { vatAnalysis, exports, intraEu } = analysis;
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const vatDiff = vatAnalysis.totalVatCollected - vatAnalysis.totalVatDue;
  const vatDiffPercent = vatAnalysis.totalVatDue > 0 
    ? ((vatDiff / vatAnalysis.totalVatDue) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* VAT Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cfo" />
            Análisis de IVA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main VAT Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-cfo/5 border border-cfo/20">
              <p className="text-xs text-muted-foreground">IVA Cobrado</p>
              <p className="text-xl font-bold text-cfo">{formatCurrency(vatAnalysis.totalVatCollected)}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground">IVA Calculado</p>
              <p className="text-xl font-bold">{formatCurrency(vatAnalysis.totalVatDue)}</p>
            </div>
            <div className={`p-4 rounded-xl ${vatDiff > 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'} border`}>
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p className={`text-xl font-bold ${vatDiff > 0 ? 'text-success' : 'text-destructive'}`}>
                {vatDiff > 0 ? '+' : ''}{formatCurrency(vatDiff)}
              </p>
              <p className="text-xs text-muted-foreground">{vatDiffPercent}%</p>
            </div>
            <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
              <p className="text-xs text-muted-foreground">Inconsistencias</p>
              <p className="text-xl font-bold text-warning">{vatAnalysis.vatInconsistent}</p>
            </div>
          </div>

          {/* Error Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-card/50 border border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Errores de tipo impositivo</span>
              <Badge variant={vatAnalysis.rateErrors > 0 ? 'destructive' : 'outline'}>
                {vatAnalysis.rateErrors}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reverse Charge mal aplicado</span>
              <Badge variant={vatAnalysis.reverseChargeErrors > 0 ? 'destructive' : 'outline'}>
                {vatAnalysis.reverseChargeErrors}
              </Badge>
            </div>
          </div>

          {/* VAT by Rate */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Desglose por Tipo Impositivo</p>
            {vatAnalysis.byRate.slice(0, 5).map((rate, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{rate.rate}% ({rate.count} tx)</span>
                  <span className="font-medium">{formatCurrency(rate.amount)}</span>
                </div>
                <Progress 
                  value={(rate.amount / vatAnalysis.totalVatCollected) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exports & Intra-EU Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Exports */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="w-5 h-5 text-cfo" />
              Exportaciones Extra-UE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-cfo/5 border border-cfo/20 text-center">
              <p className="text-2xl font-bold">{formatCurrency(exports.totalExportsOutsideEu)}</p>
              <p className="text-xs text-muted-foreground">Total exportaciones</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Con prueba de exportación</span>
                <Badge variant="outline" className="border-success text-success">
                  {exports.withProofOfExport}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Sin documentación</span>
                <Badge variant={exports.missingProof > 0 ? 'destructive' : 'outline'}>
                  {exports.missingProof}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Mal clasificadas</span>
                <Badge variant={exports.misclassified > 0 ? 'destructive' : 'outline'}>
                  {exports.misclassified}
                </Badge>
              </div>
            </div>

            {exports.missingProof > 0 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Exportaciones sin prueba pueden ser cuestionadas por la autoridad fiscal
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intra-EU */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cfo" />
              Operaciones Intracomunitarias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-cfo/5 border border-cfo/20 text-center">
                <p className="text-xl font-bold">{formatCurrency(intraEu.b2bTotal)}</p>
                <p className="text-xs text-muted-foreground">B2B Total</p>
              </div>
              <div className="p-4 rounded-xl bg-cfo/5 border border-cfo/20 text-center">
                <p className="text-xl font-bold">{formatCurrency(intraEu.b2cTotal)}</p>
                <p className="text-xs text-muted-foreground">B2C / OSS</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">VAT numbers inválidos</span>
                <Badge variant={intraEu.invalidVatNumbers > 0 ? 'destructive' : 'outline'}>
                  {intraEu.invalidVatNumbers}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Sin VAT number</span>
                <Badge variant={intraEu.missingVatNumbers > 0 ? 'destructive' : 'outline'}>
                  {intraEu.missingVatNumbers}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Errores clasificación</span>
                <Badge variant={intraEu.classificationErrors > 0 ? 'destructive' : 'outline'}>
                  {intraEu.classificationErrors}
                </Badge>
              </div>
            </div>

            {intraEu.invalidVatNumbers > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Ventas B2B sin VAT válido pueden requerir cobro de IVA retroactivo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CFOVATAnalysis;
