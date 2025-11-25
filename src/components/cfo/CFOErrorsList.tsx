import { FiscalError, FBAMovement } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, AlertCircle, Info, Truck, ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CFOErrorsListProps {
  errors: FiscalError[];
  fbaMovements: FBAMovement[];
}

const CFOErrorsList = ({ errors, fbaMovements }: CFOErrorsListProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const severityConfig = {
    critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
    high: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    medium: { icon: AlertCircle, color: 'text-cfo', bg: 'bg-cfo/10', border: 'border-cfo/30' },
    low: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border' },
  };

  const undeclaredMovements = fbaMovements.filter(m => !m.declared);

  return (
    <div className="space-y-6">
      {/* Fiscal Errors */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Errores Fiscales Detectados
            </CardTitle>
            <Badge variant="outline">{errors.length} errores</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No se han detectado errores fiscales</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {errors.map((error) => {
                const config = severityConfig[error.severity];
                const Icon = config.icon;
                
                return (
                  <AccordionItem key={error.id} value={error.id} className={`${config.bg} ${config.border} border rounded-lg px-4`}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{error.category}</span>
                            <Badge variant="outline" className="text-xs">
                              {error.affectedTransactions} tx
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {error.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${config.color}`}>
                            {formatCurrency(error.vatImpact)}
                          </p>
                          <p className="text-xs text-muted-foreground">impacto</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">País afectado</p>
                            <p className="font-medium">{error.country}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Severidad</p>
                            <Badge className={`${config.bg} ${config.color} border-0`}>
                              {error.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Recomendación</p>
                          <p className="text-sm">{error.recommendation}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* FBA Movements */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-cfo" />
              Movimientos FBA (Intrastat)
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{fbaMovements.length} movimientos</Badge>
              {undeclaredMovements.length > 0 && (
                <Badge variant="destructive">{undeclaredMovements.length} sin declarar</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fbaMovements.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No se han detectado movimientos FBA transfronterizos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fbaMovements.slice(0, 10).map((movement) => (
                <div 
                  key={movement.id} 
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    movement.declared 
                      ? 'bg-card/50 border-border/50' 
                      : 'bg-destructive/5 border-destructive/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFlagEmoji(movement.departureCountry)}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-lg">{getFlagEmoji(movement.arrivalCountry)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {movement.departureCountry} → {movement.arrivalCountry}
                      </p>
                      <p className="text-xs text-muted-foreground">{movement.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(movement.valueExclVat)}</p>
                      <p className="text-xs text-muted-foreground">IVA: {formatCurrency(movement.vatDue)}</p>
                    </div>
                    <div className="flex gap-1">
                      {movement.intrastatRequired && (
                        <Badge variant="outline" className="text-xs">Intrastat</Badge>
                      )}
                      <Badge variant={movement.declared ? 'outline' : 'destructive'} className="text-xs">
                        {movement.declared ? 'Declarado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              {fbaMovements.length > 10 && (
                <p className="text-sm text-center text-muted-foreground py-2">
                  +{fbaMovements.length - 10} movimientos más
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
    'BE': '🇧🇪', 'AT': '🇦🇹', 'PL': '🇵🇱', 'SE': '🇸🇪', 'CZ': '🇨🇿',
    'PT': '🇵🇹', 'IE': '🇮🇪', 'DK': '🇩🇰', 'FI': '🇫🇮', 'GR': '🇬🇷',
    'GB': '🇬🇧', 'US': '🇺🇸'
  };
  return flags[countryCode] || '🏳️';
}

export default CFOErrorsList;
