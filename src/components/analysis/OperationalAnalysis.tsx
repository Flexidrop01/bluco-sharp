import { Settings, Coins, RotateCcw, Package, DollarSign, Truck, Boxes, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';

interface OperationalAnalysisProps {
  analysis: AnalysisResult['operationalAnalysis'];
}

const OperationalAnalysis = ({ analysis }: OperationalAnalysisProps) => {
  const sections = [
    {
      icon: Coins,
      title: 'Estructura de Fees',
      content: analysis.feeStructure,
      color: 'text-primary'
    },
    {
      icon: RotateCcw,
      title: 'Estructura de Devoluciones',
      content: analysis.refundStructure,
      color: 'text-warning'
    }
  ];

  const issuesSections = [
    {
      icon: Package,
      title: 'Problemas de SKU',
      items: analysis.skuIssues,
      color: 'text-destructive'
    },
    {
      icon: DollarSign,
      title: 'Problemas de Pricing',
      items: analysis.pricingIssues,
      color: 'text-warning'
    },
    {
      icon: Truck,
      title: 'Problemas de Logística',
      items: analysis.logisticsIssues,
      color: 'text-primary'
    },
    {
      icon: Boxes,
      title: 'Problemas de Inventario',
      items: analysis.inventoryIssues,
      color: 'text-muted-foreground'
    }
  ];

  return (
    <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <div className="section-header">
        <div className="section-icon">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Análisis Operativo</h2>
          <p className="text-sm text-muted-foreground">Perspectiva KAM Amazon Senior</p>
        </div>
      </div>
      
      {/* Fee and Refund Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {sections.map((section, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <div className={`flex items-center gap-2 mb-3 ${section.color}`}>
              <section.icon className="w-4 h-4" />
              <h3 className="font-semibold">{section.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issuesSections.map((section, index) => (
          <div key={index} className="space-y-2">
            <div className={`flex items-center gap-2 ${section.color}`}>
              <section.icon className="w-4 h-4" />
              <h3 className="font-semibold text-sm">{section.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <AlertCircle className="w-3 h-3 mt-1 flex-shrink-0 text-muted-foreground/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OperationalAnalysis;
