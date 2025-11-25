import { IDQCatalogDiagnosis as IDQCatalogDiagnosisType } from '@/types/idq';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, AlertTriangle, CheckCircle, Globe, TrendingUp } from 'lucide-react';

interface IDQCatalogDiagnosisProps {
  diagnosis: IDQCatalogDiagnosisType;
}

const IDQCatalogDiagnosis = ({ diagnosis }: IDQCatalogDiagnosisProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-status-success';
    if (score >= 80) return 'text-status-warning';
    if (score >= 60) return 'text-amazon-orange';
    return 'text-status-critical';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-status-success/20';
    if (score >= 80) return 'bg-status-warning/20';
    if (score >= 60) return 'bg-amazon-orange/20';
    return 'bg-status-critical/20';
  };

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Score Medio</p>
                <p className={`text-3xl font-bold ${getScoreColor(diagnosis.averageScore || 0)}`}>
                  {diagnosis.averageScore?.toFixed(1) || 'N/A'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreBg(diagnosis.averageScore || 0)}`}>
                <BarChart3 className={`w-6 h-6 ${getScoreColor(diagnosis.averageScore || 0)}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total ASINs</p>
                <p className="text-3xl font-bold text-foreground">{diagnosis.totalAsins}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-idq/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-idq" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Críticos (&lt;60)</p>
                <p className="text-3xl font-bold text-status-critical">{diagnosis.scoreDistribution.poor}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-status-critical/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-status-critical" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Excelentes (90+)</p>
                <p className="text-3xl font-bold text-status-success">{diagnosis.scoreDistribution.excellent}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-status-success/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-idq" />
            Distribución de Scores IDQ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { label: 'Excelente (90+)', value: diagnosis.scoreDistribution.excellent, color: 'bg-status-success' },
              { label: 'Bueno (80-89)', value: diagnosis.scoreDistribution.good, color: 'bg-status-warning' },
              { label: 'Regular (60-79)', value: diagnosis.scoreDistribution.fair, color: 'bg-amazon-orange' },
              { label: 'Crítico (<60)', value: diagnosis.scoreDistribution.poor, color: 'bg-status-critical' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value} ASINs ({((item.value / diagnosis.totalAsins) * 100).toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(item.value / diagnosis.totalAsins) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Issues by Category */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Problemas por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diagnosis.topIssuesByCategory.map((issue, index) => (
              <div key={issue.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-idq/20 text-idq text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">{issue.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{issue.count} ASINs</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-status-critical/20 text-status-critical font-medium">
                      {issue.percentage}%
                    </span>
                  </div>
                </div>
                <div className="pl-8">
                  <div className="flex flex-wrap gap-1">
                    {issue.examples.map((example, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Findings & Quick Wins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-status-critical/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-status-critical">
              <AlertTriangle className="w-4 h-4" />
              Hallazgos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {diagnosis.criticalFindings.map((finding, index) => (
                <li key={index} className="text-sm text-foreground/90 leading-relaxed">
                  {finding}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-status-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-status-success">
              <TrendingUp className="w-4 h-4" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {diagnosis.quickWins.map((win, index) => (
                <li key={index} className="text-sm text-foreground/90 leading-relaxed">
                  {win}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Breakdown */}
      {diagnosis.marketplaceBreakdown && diagnosis.marketplaceBreakdown.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-idq" />
              Desglose por Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Marketplace</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">ASINs</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Score Medio</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Problemas Principales</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosis.marketplaceBreakdown.map((mp) => (
                    <tr key={mp.marketplace} className="border-b border-border/30">
                      <td className="py-3 px-3">
                        <span className="font-medium">{mp.marketplace}</span>
                      </td>
                      <td className="py-3 px-3 text-center">{mp.asinCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${getScoreColor(mp.avgScore || 0)}`}>
                          {mp.avgScore?.toFixed(0) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {mp.mainIssues.map((issue, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IDQCatalogDiagnosis;
