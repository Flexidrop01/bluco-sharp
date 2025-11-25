import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SKUMetrics } from '@/types/multiTransaction';
import { Package, TrendingUp, TrendingDown, Search, MapPin, RotateCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SKURankingProps {
  allSKUs: SKUMetrics[];
  topSKUs: SKUMetrics[];
  bottomSKUs: SKUMetrics[];
}

const SKURanking = ({ allSKUs, topSKUs, bottomSKUs }: SKURankingProps) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'sales' | 'profit' | 'quantity' | 'refundRate'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredSKUs = allSKUs
    .filter(sku => 
      sku.sku.toLowerCase().includes(search.toLowerCase()) ||
      (sku.description?.toLowerCase().includes(search.toLowerCase())) ||
      (sku.asin?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'sales': aVal = a.totalSales; bVal = b.totalSales; break;
        case 'profit': aVal = a.profit; bVal = b.profit; break;
        case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
        case 'refundRate': aVal = a.refundRate; bVal = b.refundRate; break;
        default: aVal = a.totalSales; bVal = b.totalSales;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIndicator = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ? ' ↓' : ' ↑';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-status-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-status-success" />
              <span className="text-xs text-muted-foreground">Top Ventas</span>
            </div>
            <p className="font-bold text-lg">{topSKUs[0]?.sku || '-'}</p>
            <p className="text-sm text-status-success">${topSKUs[0]?.totalSales.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Más Vendido</span>
            </div>
            <p className="font-bold text-lg">{[...allSKUs].sort((a, b) => b.quantity - a.quantity)[0]?.sku || '-'}</p>
            <p className="text-sm text-primary">{[...allSKUs].sort((a, b) => b.quantity - a.quantity)[0]?.quantity.toLocaleString() || 0} uds</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-status-critical" />
              <span className="text-xs text-muted-foreground">Más Devoluciones</span>
            </div>
            <p className="font-bold text-lg">{bottomSKUs[0]?.sku || '-'}</p>
            <p className="text-sm text-status-critical">{bottomSKUs[0]?.refundRate.toFixed(1) || 0}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total SKUs</span>
            </div>
            <p className="font-bold text-2xl">{allSKUs.length}</p>
            <p className="text-xs text-muted-foreground">productos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Top & Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top SKUs */}
        <Card className="glass-card border-status-success/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-status-success">
              <TrendingUp className="w-4 h-4" />
              🏆 Top 5 SKUs por Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSKUs.map((sku, i) => (
                <div key={sku.sku} className="p-3 rounded-lg bg-status-success/5 border border-status-success/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-status-success/20 text-status-success text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{sku.sku}</p>
                        <p className="text-xs text-muted-foreground">{sku.asin}</p>
                      </div>
                    </div>
                    <Badge className="bg-status-success text-white">{sku.profitMargin.toFixed(1)}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{sku.description}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Ventas</p>
                      <p className="font-medium">${sku.totalSales.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cantidad</p>
                      <p className="font-medium">{sku.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit</p>
                      <p className="font-medium text-status-success">${sku.profit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Refund</p>
                      <p className="font-medium">{sku.refundRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sku.cities.slice(0, 3).map(city => (
                      <Badge key={city} variant="outline" className="text-[10px] flex items-center gap-1">
                        <MapPin className="w-2 h-2" />{city}
                      </Badge>
                    ))}
                    {sku.cities.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">+{sku.cities.length - 3}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom SKUs */}
        <Card className="glass-card border-status-critical/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-status-critical">
              <TrendingDown className="w-4 h-4" />
              ⚠️ SKUs Problemáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomSKUs.map((sku, i) => (
                <div key={sku.sku} className="p-3 rounded-lg bg-status-critical/5 border border-status-critical/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-status-critical/20 text-status-critical text-xs font-bold flex items-center justify-center">
                        !
                      </span>
                      <div>
                        <p className="font-medium text-sm">{sku.sku}</p>
                        <p className="text-xs text-muted-foreground">{sku.asin}</p>
                      </div>
                    </div>
                    <Badge className="bg-status-critical text-white">{sku.refundRate.toFixed(1)}% dev.</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{sku.description}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Ventas</p>
                      <p className="font-medium">${sku.totalSales.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fee %</p>
                      <p className="font-medium text-status-critical">{sku.feePercent.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit</p>
                      <p className="font-medium">${sku.profit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margen</p>
                      <p className="font-medium">{sku.profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full SKU Table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Catálogo Completo de SKUs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar SKU, ASIN, descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('quantity')}
                  >
                    Cantidad{SortIndicator({ column: 'quantity' })}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('sales')}
                  >
                    Ventas{SortIndicator({ column: 'sales' })}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('profit')}
                  >
                    Profit{SortIndicator({ column: 'profit' })}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('refundRate')}
                  >
                    Refund %{SortIndicator({ column: 'refundRate' })}
                  </TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ciudades Top</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSKUs.slice(0, 20).map((sku, index) => (
                  <TableRow key={sku.sku}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sku.sku}</p>
                        <p className="text-xs text-muted-foreground">{sku.asin}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-xs truncate" title={sku.description}>{sku.description}</p>
                    </TableCell>
                    <TableCell className="font-medium">{sku.quantity.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${sku.totalSales.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={sku.profit > 0 ? 'text-status-success' : 'text-status-critical'}>
                        ${sku.profit.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={sku.refundRate > 10 ? 'text-status-critical font-bold' : ''}>
                        {sku.refundRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sku.fulfillmentModel === 'FBA' ? 'default' : 'secondary'}>
                        {sku.fulfillmentModel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sku.cities.slice(0, 2).map(city => (
                          <Badge key={city} variant="outline" className="text-[10px]">{city}</Badge>
                        ))}
                        {sku.cities.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{sku.cities.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredSKUs.length > 20 && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Mostrando 20 de {filteredSKUs.length} SKUs
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SKURanking;
