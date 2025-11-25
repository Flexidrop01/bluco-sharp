import { CountryVATSummary } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Globe, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface CFOCountryObligationsProps {
  countries: CountryVATSummary[];
}

const CFOCountryObligations = ({ countries }: CFOCountryObligationsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const getStatusBadge = (country: CountryVATSummary) => {
    if (country.vatInconsistencies > 5) {
      return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Revisar</Badge>;
    }
    if (country.registrationRequired && !country.domesticSales) {
      return <Badge variant="outline" className="text-xs border-warning text-warning"><AlertTriangle className="w-3 h-3 mr-1" />Registro</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-success text-success"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-cfo" />
          Obligaciones Fiscales por País
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">IVA Cobrado</TableHead>
                <TableHead className="text-right">IVA Debido</TableHead>
                <TableHead className="text-center">Doméstico</TableHead>
                <TableHead className="text-center">B2B</TableHead>
                <TableHead className="text-center">B2C/OSS</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((country) => (
                <TableRow key={country.countryCode}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFlagEmoji(country.countryCode)}</span>
                      <div>
                        <p className="font-medium">{country.country}</p>
                        <p className="text-xs text-muted-foreground">{country.transactionCount} tx</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(country.totalSales)}
                  </TableCell>
                  <TableCell className="text-right text-cfo">
                    {formatCurrency(country.totalVatCollected)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(country.totalVatDue)}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {country.domesticSales > 0 ? formatCurrency(country.domesticSales) : '-'}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {country.intraEuB2B > 0 ? formatCurrency(country.intraEuB2B) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs">{country.intraEuB2C > 0 ? formatCurrency(country.intraEuB2C) : '-'}</span>
                      {country.ossApplicable && (
                        <Badge variant="outline" className="text-[10px] mt-1 border-cfo/30 text-cfo">OSS</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(country)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-cfo/5 border border-cfo/20 text-center">
            <p className="text-2xl font-bold text-cfo">{countries.length}</p>
            <p className="text-xs text-muted-foreground">Países activos</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
            <p className="text-2xl font-bold text-success">
              {countries.filter(c => c.declarationRequired).length}
            </p>
            <p className="text-xs text-muted-foreground">Con declaración</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-center">
            <p className="text-2xl font-bold text-warning">
              {countries.filter(c => c.ossApplicable).length}
            </p>
            <p className="text-xs text-muted-foreground">Aplica OSS</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
            <p className="text-2xl font-bold text-destructive">
              {countries.filter(c => c.vatInconsistencies > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Con incidencias</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
    'BE': '🇧🇪', 'AT': '🇦🇹', 'PL': '🇵🇱', 'SE': '🇸🇪', 'CZ': '🇨🇿',
    'PT': '🇵🇹', 'IE': '🇮🇪', 'DK': '🇩🇰', 'FI': '🇫🇮', 'GR': '🇬🇷',
    'HU': '🇭🇺', 'RO': '🇷🇴', 'SK': '🇸🇰', 'BG': '🇧🇬', 'HR': '🇭🇷',
    'SI': '🇸🇮', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪', 'LU': '🇱🇺',
    'MT': '🇲🇹', 'CY': '🇨🇾', 'GB': '🇬🇧', 'US': '🇺🇸', 'CH': '🇨🇭'
  };
  return flags[countryCode] || '🏳️';
}

export default CFOCountryObligations;
