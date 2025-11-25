import { IDQASINAnalysis } from '@/types/idq';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, Image, List, Tag, FolderTree, AlertTriangle, 
  CheckCircle, Copy, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface IDQASINDetailProps {
  analysis: IDQASINAnalysis;
}

const IDQASINDetail = ({ analysis }: IDQASINDetailProps) => {
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 90) return 'text-status-success';
    if (score >= 80) return 'text-status-warning';
    if (score >= 60) return 'text-amazon-orange';
    return 'text-status-critical';
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 90) return 'bg-status-success/20 text-status-success';
    if (score >= 80) return 'bg-status-warning/20 text-status-warning';
    if (score >= 60) return 'bg-amazon-orange/20 text-amazon-orange';
    return 'bg-status-critical/20 text-status-critical';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-status-critical/20 text-status-critical';
      case 'high': return 'bg-amazon-orange/20 text-amazon-orange';
      case 'medium': return 'bg-status-warning/20 text-status-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const issuesByType = analysis.issues.reduce((acc, issue) => {
    if (!acc[issue.issueType]) acc[issue.issueType] = [];
    acc[issue.issueType].push(issue);
    return acc;
  }, {} as Record<string, typeof analysis.issues>);

  const issueTypeIcons: Record<string, React.ReactNode> = {
    title: <FileText className="w-4 h-4" />,
    bullets: <List className="w-4 h-4" />,
    description: <FileText className="w-4 h-4" />,
    images: <Image className="w-4 h-4" />,
    attributes: <Tag className="w-4 h-4" />,
    category: <FolderTree className="w-4 h-4" />,
    compliance: <AlertTriangle className="w-4 h-4" />,
    other: <AlertTriangle className="w-4 h-4" />
  };

  const issueTypeLabels: Record<string, string> = {
    title: 'Título',
    bullets: 'Bullet Points',
    description: 'Descripción / A+',
    images: 'Imágenes / Vídeo',
    attributes: 'Atributos',
    category: 'Categoría / Variaciones',
    compliance: 'Cumplimiento',
    other: 'Otros'
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-mono">{analysis.asin}</CardTitle>
            {analysis.marketplace && (
              <Badge variant="outline" className="text-xs">{analysis.marketplace}</Badge>
            )}
          </div>
          <div className={`px-3 py-1 rounded-lg font-bold text-lg ${getScoreBadge(analysis.idqScore)}`}>
            {analysis.idqScore ?? 'N/A'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Issues Summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(issuesByType).map(([type, issues]) => (
            <div key={type} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs">
              {issueTypeIcons[type]}
              <span>{issueTypeLabels[type]}</span>
              <Badge className={getSeverityBadge(issues[0].severity)} variant="secondary">
                {issues.length}
              </Badge>
            </div>
          ))}
        </div>

        <Accordion type="multiple" className="space-y-2">
          {/* Issues Detail */}
          <AccordionItem value="issues" className="border rounded-lg px-3">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                Problemas Detectados ({analysis.issues.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {issueTypeIcons[issue.issueType]}
                        <span className="font-medium text-sm">{issue.attributeName}</span>
                      </div>
                      <Badge className={getSeverityBadge(issue.severity)} variant="secondary">
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    {issue.recommendation && (
                      <p className="text-sm text-idq">💡 {issue.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Title Improvement */}
          {analysis.improvements.title && (
            <AccordionItem value="title" className="border rounded-lg px-3 border-idq/30">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-idq" />
                  Título Optimizado
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {analysis.improvements.title.current && (
                    <div className="p-3 rounded-lg bg-status-critical/10 border border-status-critical/20">
                      <p className="text-xs text-status-critical mb-1 font-medium">Título actual:</p>
                      <p className="text-sm">{analysis.improvements.title.current}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-status-success font-medium">Título propuesto:</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(analysis.improvements.title!.proposed, 'Título')}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{analysis.improvements.title.proposed}</p>
                  </div>
                  {analysis.improvements.title.placeholders && analysis.improvements.title.placeholders.length > 0 && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">⚠️ Datos a completar:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.improvements.title.placeholders.map((ph) => (
                          <code key={ph} className="text-xs px-1.5 py-0.5 rounded bg-idq/20 text-idq">
                            {`{${ph}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Bullets Improvement */}
          {analysis.improvements.bullets && (
            <AccordionItem value="bullets" className="border rounded-lg px-3 border-idq/30">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-idq" />
                  Bullet Points Optimizados
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {analysis.improvements.bullets.current && (
                    <div className="p-3 rounded-lg bg-status-critical/10 border border-status-critical/20">
                      <p className="text-xs text-status-critical mb-2 font-medium">Bullets actuales:</p>
                      <ul className="space-y-1">
                        {analysis.improvements.bullets.current.map((bullet, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-status-success font-medium">Bullets propuestos:</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(analysis.improvements.bullets!.proposed.join('\n'), 'Bullets')}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {analysis.improvements.bullets.proposed.map((bullet, i) => (
                        <li key={i} className="text-sm">{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Description / A+ Improvement */}
          {analysis.improvements.description && (
            <AccordionItem value="description" className="border rounded-lg px-3 border-idq/30">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-idq" />
                  Descripción / A+ Content
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-status-success font-medium">Descripción propuesta:</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(analysis.improvements.description!.proposed, 'Descripción')}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-line">{analysis.improvements.description.proposed}</p>
                  </div>
                  
                  {analysis.improvements.description.aPlus && (
                    <div className="p-3 rounded-lg bg-idq/10 border border-idq/20">
                      <p className="text-xs text-idq font-medium mb-2">📐 Estructura A+ sugerida:</p>
                      <div className="space-y-2">
                        {analysis.improvements.description.aPlus.map((module, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="w-6 h-6 rounded bg-idq/20 text-idq text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <span className="font-medium">{module.module}:</span>
                              <span className="text-muted-foreground ml-1">{module.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Media Plan */}
          {analysis.improvements.mediaPlan && (
            <AccordionItem value="media" className="border rounded-lg px-3 border-idq/30">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-idq" />
                  Plan de Multimedia
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-status-critical">{analysis.improvements.mediaPlan.currentImages}</p>
                      <p className="text-xs text-muted-foreground">Actuales</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-status-success">{analysis.improvements.mediaPlan.recommendedImages}</p>
                      <p className="text-xs text-muted-foreground">Recomendadas</p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-idq/10 border border-idq/20">
                    <p className="text-xs text-idq font-medium mb-2">📷 Tipos de imagen recomendados:</p>
                    <ul className="space-y-1">
                      {analysis.improvements.mediaPlan.imageTypes.map((type, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-status-success" />
                          {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {analysis.improvements.mediaPlan.videoRecommendation && (
                    <div className="p-3 rounded-lg bg-amazon-orange/10 border border-amazon-orange/20">
                      <p className="text-xs text-amazon-orange font-medium mb-1">🎬 Vídeo recomendado:</p>
                      <p className="text-sm">{analysis.improvements.mediaPlan.videoRecommendation}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Attributes */}
          {analysis.improvements.attributes && analysis.improvements.attributes.length > 0 && (
            <AccordionItem value="attributes" className="border rounded-lg px-3 border-idq/30">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-idq" />
                  Atributos a Completar ({analysis.improvements.attributes.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {analysis.improvements.attributes.map((attr, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">{attr.name}</code>
                        <Badge 
                          variant="secondary" 
                          className={attr.type === 'critical' ? 'bg-status-critical/20 text-status-critical' : 'bg-status-warning/20 text-status-warning'}
                        >
                          {attr.type === 'critical' ? 'Crítico' : 'Recomendado'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{attr.suggestedAction}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default IDQASINDetail;
