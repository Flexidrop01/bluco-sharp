import { useState } from 'react';
import { IDQOptimizerResult, ProductIDQAnalysis } from '@/lib/idqOptimizerParser';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Download, Sparkles, BarChart3, List, Target, Search, 
  AlertTriangle, CheckCircle, Image, Video, FileText, Star, ShoppingCart,
  TrendingUp, Filter, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

interface IDQOptimizerDashboardProps {
  result: IDQOptimizerResult;
  onReset: () => void;
}

const IDQOptimizerDashboard = ({ result, onReset }: IDQOptimizerDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'sales' | 'issues'>('sales');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  };

  // Filtrar y ordenar productos
  const filteredProducts = result.products
    .filter(p => 
      p.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return a.scores.overall - b.scores.overall;
      if (sortBy === 'sales') return b.sales - a.sales;
      return b.issues.length - a.issues.length;
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success';
    if (score >= 60) return 'text-status-warning';
    return 'text-status-critical';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-status-success';
    if (score >= 60) return 'bg-status-warning';
    return 'bg-status-critical';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-status-critical text-white';
      case 'high': return 'bg-amazon-orange text-white';
      case 'medium': return 'bg-status-warning text-black';
      default: return 'bg-muted text-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      default: return 'Bajo';
    }
  };

  // Componente de producto expandible
  const ProductCard = ({ product }: { product: ProductIDQAnalysis }) => {
    const isExpanded = expandedProduct === product.asin;
    
    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {/* Header del producto */}
          <div 
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpandedProduct(isExpanded ? null : product.asin)}
          >
            <div className="flex items-start gap-4">
              {/* Imagen */}
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{product.asin}</Badge>
                  <Badge className={getPriorityColor(product.priority)}>
                    {getPriorityLabel(product.priority)}
                  </Badge>
                  {product.issues.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {product.issues.length} issues
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2">{product.title}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {product.sales > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      €{product.sales.toFixed(2)}
                    </span>
                  )}
                  {product.metrics.bsr && (
                    <span>BSR #{product.metrics.bsr.toLocaleString()}</span>
                  )}
                  <span>{product.country}</span>
                </div>
              </div>
              
              {/* Score */}
              <div className="flex flex-col items-center gap-1">
                <div className={`text-2xl font-bold ${getScoreColor(product.scores.overall)}`}>
                  {product.scores.overall}
                </div>
                <span className="text-xs text-muted-foreground">IDQ Score</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
          
          {/* Contenido expandido */}
          {isExpanded && (
            <div className="border-t border-border p-4 space-y-4">
              {/* Grid de métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricBadge 
                  label="Título" 
                  value={`${product.metrics.titleLength} chars`}
                  score={product.scores.title}
                  target="150-200"
                />
                <MetricBadge 
                  label="Bullets" 
                  value={`${product.metrics.bulletPointsCount}/5`}
                  score={product.scores.bulletPoints}
                  target="5"
                />
                <MetricBadge 
                  label="Imágenes" 
                  value={`${product.metrics.imagesCount}`}
                  score={product.scores.images}
                  target="7+"
                />
                <MetricBadge 
                  label="Vídeos" 
                  value={`${product.metrics.videosCount}`}
                  score={product.scores.videos}
                  target="1+"
                />
                <MetricBadge 
                  label="A+ Content" 
                  value={product.metrics.hasAPlus ? 'Sí' : 'No'}
                  score={product.scores.aPlus}
                  target="Sí"
                />
                <MetricBadge 
                  label="Rating" 
                  value={product.metrics.rating > 0 ? `${product.metrics.rating.toFixed(1)}★` : 'N/A'}
                  score={product.scores.rating}
                  target="4.0+"
                />
                <MetricBadge 
                  label="Reseñas" 
                  value={`${product.metrics.reviewsCount}`}
                  score={product.scores.reviews}
                  target="30+"
                />
                <MetricBadge 
                  label="Buy Box" 
                  value={product.metrics.buyBoxOwner ? 'Sí' : 'No'}
                  score={product.metrics.buyBoxOwner?.toLowerCase().includes('pikolin') ? 100 : 0}
                  target="Propia"
                />
              </div>
              
              {/* Issues */}
              {product.issues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-warning" />
                    Problemas detectados ({product.issues.length})
                  </p>
                  <div className="space-y-2">
                    {product.issues.map((issue, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg text-sm ${
                          issue.severity === 'critical' ? 'bg-status-critical/10 border border-status-critical/30' :
                          issue.severity === 'warning' ? 'bg-status-warning/10 border border-status-warning/30' :
                          'bg-muted/50'
                        }`}
                      >
                        <p className="font-medium">{issue.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">💡 {issue.recommendation}</p>
                        <p className="text-xs text-muted-foreground">📊 {issue.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Link a Amazon */}
              {product.amazonUrl && (
                <a 
                  href={product.amazonUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en Amazon
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente de métrica
  const MetricBadge = ({ label, value, score, target }: { 
    label: string; value: string; score: number; target: string 
  }) => (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium ${getScoreColor(score)}`}>{score}%</span>
      </div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">Objetivo: {target}</p>
      <Progress value={score} className="h-1 mt-1" />
    </div>
  );

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
              <span className="font-medium text-foreground">IDQ Optimizer</span>
              <Badge variant="outline">{result.totalProducts} productos</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analizado: {formatDate(result.analyzedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-idq hover:bg-idq/90 text-white" size="sm" onClick={onReset}>
            Nuevo análisis
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${getScoreColor(result.averageScore)}`}>
              {result.averageScore}
            </div>
            <p className="text-xs text-muted-foreground">IDQ Score Medio</p>
            <Progress value={result.averageScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-status-critical">
              {result.actionPlan.critical.length}
            </div>
            <p className="text-xs text-muted-foreground">Acciones Críticas</p>
            <p className="text-xs text-status-critical mt-1">Requieren atención urgente</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-amazon-orange/30">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amazon-orange">
              {result.actionPlan.high.length}
            </div>
            <p className="text-xs text-muted-foreground">Prioridad Alta</p>
            <p className="text-xs text-amazon-orange mt-1">Impacto en ventas</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-status-success/30">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-status-success">
              {result.products.filter(p => p.scores.overall >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">Optimizados</p>
            <p className="text-xs text-status-success mt-1">Score ≥ 80</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de issues por categoría */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-idq" />
            Diagnóstico por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <CategoryStat icon={<FileText className="w-4 h-4" />} label="Títulos" issues={result.summary.titleIssues} total={result.totalProducts} />
            <CategoryStat icon={<List className="w-4 h-4" />} label="Bullets" issues={result.summary.bulletPointsIssues} total={result.totalProducts} />
            <CategoryStat icon={<Image className="w-4 h-4" />} label="Imágenes" issues={result.summary.imageIssues} total={result.totalProducts} />
            <CategoryStat icon={<Video className="w-4 h-4" />} label="Vídeos" issues={result.summary.videoIssues} total={result.totalProducts} />
            <CategoryStat icon={<Star className="w-4 h-4" />} label="Reseñas" issues={result.summary.reviewIssues} total={result.totalProducts} />
            <CategoryStat icon={<Star className="w-4 h-4" />} label="Rating" issues={result.summary.ratingIssues} total={result.totalProducts} />
            <CategoryStat icon={<Sparkles className="w-4 h-4" />} label="A+" issues={result.summary.aPlusIssues} total={result.totalProducts} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="priority" className="space-y-4">
        <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Plan de Acción
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Todos los Productos
          </TabsTrigger>
          <TabsTrigger value="critical" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Críticos ({result.actionPlan.critical.length})
          </TabsTrigger>
        </TabsList>

        {/* Plan de Acción */}
        <TabsContent value="priority" className="space-y-6">
          {result.actionPlan.critical.length > 0 && (
            <PrioritySection 
              title="🚨 Acción Crítica" 
              subtitle="Productos con alto impacto en ventas y problemas graves"
              products={result.actionPlan.critical}
              color="status-critical"
              ProductCard={ProductCard}
            />
          )}
          
          {result.actionPlan.high.length > 0 && (
            <PrioritySection 
              title="⚡ Prioridad Alta" 
              subtitle="Optimizaciones que mejorarán significativamente el rendimiento"
              products={result.actionPlan.high}
              color="amazon-orange"
              ProductCard={ProductCard}
            />
          )}
          
          {result.actionPlan.medium.length > 0 && (
            <PrioritySection 
              title="📋 Prioridad Media" 
              subtitle="Mejoras recomendadas para optimización continua"
              products={result.actionPlan.medium.slice(0, 5)}
              color="status-warning"
              ProductCard={ProductCard}
              showViewMore={result.actionPlan.medium.length > 5}
              totalCount={result.actionPlan.medium.length}
            />
          )}
        </TabsContent>

        {/* Todos los productos */}
        <TabsContent value="all" className="space-y-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por ASIN o título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select 
                    className="bg-muted border-0 rounded-md px-3 py-2 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="sales">Por Ventas</option>
                    <option value="score">Por Score (menor primero)</option>
                    <option value="issues">Por Issues</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            Mostrando {filteredProducts.length} de {result.totalProducts} productos
          </p>

          <div className="space-y-3">
            {filteredProducts.slice(0, 20).map((product) => (
              <ProductCard key={product.asin} product={product} />
            ))}
          </div>
          
          {filteredProducts.length > 20 && (
            <p className="text-center text-sm text-muted-foreground">
              Mostrando 20 de {filteredProducts.length} productos. Usa la búsqueda para filtrar.
            </p>
          )}
        </TabsContent>

        {/* Críticos */}
        <TabsContent value="critical" className="space-y-4">
          {result.actionPlan.critical.length > 0 ? (
            <div className="space-y-3">
              {result.actionPlan.critical.map((product) => (
                <ProductCard key={product.asin} product={product} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-4" />
                <p className="font-medium">¡No hay productos críticos!</p>
                <p className="text-sm text-muted-foreground">
                  Ningún producto con ventas tiene problemas graves de IDQ
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente de estadística por categoría
const CategoryStat = ({ icon, label, issues, total }: { 
  icon: React.ReactNode; label: string; issues: number; total: number 
}) => {
  const okCount = total - issues;
  const percentage = total > 0 ? Math.round((okCount / total) * 100) : 0;
  
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`text-lg font-bold ${percentage >= 80 ? 'text-status-success' : percentage >= 50 ? 'text-status-warning' : 'text-status-critical'}`}>
        {percentage}%
      </div>
      <p className="text-xs text-muted-foreground">{okCount}/{total} OK</p>
    </div>
  );
};

// Componente de sección de prioridad
const PrioritySection = ({ 
  title, subtitle, products, color, ProductCard, showViewMore, totalCount 
}: { 
  title: string; 
  subtitle: string; 
  products: ProductIDQAnalysis[]; 
  color: string;
  ProductCard: React.FC<{ product: ProductIDQAnalysis }>;
  showViewMore?: boolean;
  totalCount?: number;
}) => (
  <div className="space-y-3">
    <div className={`p-3 rounded-lg border-l-4 border-${color} bg-${color}/5`}>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCard key={product.asin} product={product} />
      ))}
    </div>
    {showViewMore && totalCount && (
      <p className="text-sm text-muted-foreground text-center">
        +{totalCount - products.length} productos más en esta categoría
      </p>
    )}
  </div>
);

export default IDQOptimizerDashboard;
