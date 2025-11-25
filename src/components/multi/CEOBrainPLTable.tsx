/**
 * CEO Brain P&L Table Component
 * Muestra la tabla P&L mensual con estructura idéntica a ARCOS USA (Bluco format)
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle, Info, FileSpreadsheet, BarChart3, Brain
} from 'lucide-react';
import { 
  MonthlyPLTable, PLRow, MONTH_NAMES, ExecutiveSummary 
} from '@/lib/ceoBrainPLBuilder';

interface CEOBrainPLTableProps {
  plTable: MonthlyPLTable;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const formatCurrency = (value: number, decimals = 2): string => {
  if (Math.abs(value) < 0.01) return '-';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

const formatPercent = (value: number): string => {
  if (Math.abs(value) < 0.01) return '-';
  return `${value.toFixed(2)}%`;
};

// Executive Summary Component
const ExecutiveSummaryCard: React.FC<{ summary: ExecutiveSummary; year: number }> = ({ summary, year }) => {
  const trendIcon = {
    up: <TrendingUp className="w-5 h-5 text-green-500" />,
    down: <TrendingDown className="w-5 h-5 text-red-500" />,
    stable: <Minus className="w-5 h-5 text-yellow-500" />
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          Análisis Ejecutivo CEO Brain - {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Mejor Mes (Ingresos)</div>
            <div className="text-lg font-bold text-green-600">
              {MONTH_NAMES[summary.bestIncomeMonth.month] || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(summary.bestIncomeMonth.value)}€
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Mayor Gasto Fees</div>
            <div className="text-lg font-bold text-red-600">
              {MONTH_NAMES[summary.highestFeesMonth.month] || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(summary.highestFeesMonth.value)}€
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Tendencia EBITDA</div>
            <div className="flex items-center justify-center gap-1">
              {trendIcon[summary.ebitdaTrend]}
              <span className="text-lg font-bold capitalize">{summary.ebitdaTrend}</span>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Mayor Discrepancia</div>
            <div className="text-lg font-bold text-orange-600">
              {MONTH_NAMES[summary.largestMistakeMonth.month] || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(summary.largestMistakeMonth.value)}€
            </div>
          </div>
        </div>

        {/* Rates */}
        <div className="flex gap-4 flex-wrap">
          <Badge variant={summary.avgRefundRate > 5 ? "destructive" : "secondary"}>
            Tasa Devoluciones: {formatPercent(summary.avgRefundRate)}
          </Badge>
          <Badge variant={summary.avgFeeRate > 35 ? "destructive" : "secondary"}>
            Tasa Fees Amazon: {formatPercent(summary.avgFeeRate)}
          </Badge>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-1">
            <Info className="w-4 h-4" />
            Recomendaciones
          </div>
          <div className="space-y-1">
            {summary.recommendations.map((rec, i) => (
              <div key={i} className="text-sm text-muted-foreground bg-background/30 rounded px-2 py-1">
                {rec}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main P&L Table Row
const PLTableRow: React.FC<{ row: PLRow; currency: string }> = ({ row, currency }) => {
  const getCellClass = (value: number) => {
    if (row.isHeader) return '';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getRowClass = () => {
    if (row.level === 0) return 'bg-primary/10 font-bold text-primary';
    if (row.level === 1) return 'bg-muted/50 font-semibold';
    if (row.level === 2) return 'bg-muted/30 font-medium';
    return '';
  };

  const getHighlightClass = () => {
    switch (row.highlight) {
      case 'positive': return 'bg-green-500/10';
      case 'negative': return 'bg-red-500/10';
      case 'warning': return 'bg-orange-500/10';
      default: return '';
    }
  };

  const paddingClass = `pl-${Math.min(row.level * 4, 12)}`;

  // Si es fila vacía (spacer)
  if (!row.concept && row.isHeader) {
    return <tr className="h-4"><td colSpan={14}></td></tr>;
  }

  const isPercentRow = row.concept.includes('%') || row.concept.includes('Rate');

  return (
    <tr className={`${getRowClass()} ${getHighlightClass()} hover:bg-muted/20 transition-colors`}>
      <td className={`sticky left-0 bg-inherit px-3 py-1.5 text-sm whitespace-nowrap ${paddingClass}`}>
        {row.concept}
      </td>
      <td className={`px-3 py-1.5 text-right text-sm font-medium ${getCellClass(row.totalYear)}`}>
        {row.isHeader ? '' : (isPercentRow ? formatPercent(row.totalYear) : formatCurrency(row.totalYear))}
      </td>
      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
        <td 
          key={month} 
          className={`px-2 py-1.5 text-right text-xs ${getCellClass(row.months[month] || 0)}`}
        >
          {row.isHeader ? '' : (
            isPercentRow ? formatPercent(row.months[month] || 0) : formatCurrency(row.months[month] || 0, 0)
          )}
        </td>
      ))}
    </tr>
  );
};

// Main Component
const CEOBrainPLTable: React.FC<CEOBrainPLTableProps> = ({ 
  plTable, 
  onExportPDF,
  onExportExcel 
}) => {
  const [activeTab, setActiveTab] = useState('table');

  // Filter rows by category for summary view
  const categorizedRows = useMemo(() => {
    const income: PLRow[] = [];
    const expenses: PLRow[] = [];
    const results: PLRow[] = [];
    
    let currentSection = 'income';
    
    for (const row of plTable.rows) {
      if (row.concept === 'TOTAL EXPENSES') currentSection = 'expenses';
      if (row.concept === 'EBITDA (IT-GT)') currentSection = 'results';
      
      if (currentSection === 'income') income.push(row);
      else if (currentSection === 'expenses') expenses.push(row);
      else results.push(row);
    }
    
    return { income, expenses, results };
  }, [plTable.rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            P&L Mensual {plTable.year}
          </h2>
          <p className="text-muted-foreground text-sm">
            CEO Brain - Análisis automático desde Transaction Report
          </p>
        </div>
        
        <div className="flex gap-2">
          {onExportExcel && (
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          )}
          {onExportPDF && (
            <Button variant="default" size="sm" onClick={onExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* KPIs Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Income</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(plTable.totalIncome)}€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(plTable.totalExpenses)}€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">EBITDA</div>
            <div className={`text-xl font-bold ${plTable.ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(plTable.ebitda)}€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Net Profit</div>
            <div className={`text-xl font-bold ${plTable.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(plTable.netProfit)}€
            </div>
          </CardContent>
        </Card>
        <Card className={Math.abs(plTable.mistake) > 100 ? 'border-orange-500' : ''}>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {Math.abs(plTable.mistake) > 100 && <AlertTriangle className="w-3 h-3 text-orange-500" />}
              Discrepancy
            </div>
            <div className={`text-xl font-bold ${Math.abs(plTable.mistake) > 100 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {formatCurrency(plTable.mistake)}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryCard summary={plTable.executiveSummary} year={plTable.year} />

      {/* Missing Data Alert */}
      {plTable.missingData.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-700">Datos Externos No Disponibles</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Los siguientes conceptos solo se pueden completar con una tabla adicional de costes externos:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {plTable.missingData.map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="table" className="flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4" />
            Tabla P&L Completa
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="min-w-[1400px]">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-background z-10 border-b">
                      <tr>
                        <th className="sticky left-0 bg-background px-3 py-2 text-left text-sm font-semibold min-w-[280px]">
                          Concepto
                        </th>
                        <th className="px-3 py-2 text-right text-sm font-semibold min-w-[100px] bg-primary/5">
                          Total {plTable.year}
                        </th>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <th 
                            key={month} 
                            className="px-2 py-2 text-right text-sm font-medium min-w-[70px]"
                          >
                            {month}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {plTable.rows.map((row, index) => (
                        <PLTableRow 
                          key={index} 
                          row={row} 
                          currency={plTable.currency}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Income Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Ingresos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const productSalesRow = plTable.rows.find(r => r.concept === 'Total revenue' && r.level === 3);
                    const value = productSalesRow?.months[month] || 0;
                    const maxValue = Math.max(...(productSalesRow?.months ? Object.values(productSalesRow.months) : [1]));
                    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={month} className="flex items-center gap-2">
                        <span className="w-8 text-sm text-muted-foreground">{MONTH_NAMES[month]}</span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm">{formatCurrency(value, 0)}€</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Expenses Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Gastos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    // Sum all expense rows for this month
                    const expenseRows = plTable.rows.filter(r => 
                      r.concept.includes('Commission') || 
                      r.concept.includes('Fee') ||
                      r.concept.includes('Storage') ||
                      r.concept.includes('Advertising')
                    );
                    const value = expenseRows.reduce((sum, r) => sum + Math.abs(r.months[month] || 0), 0);
                    const maxValue = Math.max(...Array.from({ length: 12 }, (_, i) => 
                      expenseRows.reduce((sum, r) => sum + Math.abs(r.months[i + 1] || 0), 0)
                    ), 1);
                    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={month} className="flex items-center gap-2">
                        <span className="w-8 text-sm text-muted-foreground">{MONTH_NAMES[month]}</span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm">{formatCurrency(value, 0)}€</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Evolution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Evolución EBITDA Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const ebitdaRow = plTable.rows.find(r => r.concept === 'EBITDA (IT-GT)');
                    const value = ebitdaRow?.months[month] || 0;
                    const maxAbs = Math.max(...(ebitdaRow?.months ? Object.values(ebitdaRow.months).map(Math.abs) : [1]));
                    const heightPercent = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
                    
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex-1 w-full flex items-end justify-center">
                          <div 
                            className={`w-full max-w-8 rounded-t transition-all ${value >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ height: `${heightPercent}%`, minHeight: value !== 0 ? '4px' : '0' }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{MONTH_NAMES[month]}</span>
                        <span className={`text-xs font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(value, 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CEOBrainPLTable;
