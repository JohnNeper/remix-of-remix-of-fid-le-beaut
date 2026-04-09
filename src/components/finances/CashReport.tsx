import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download } from 'lucide-react';
import { Vente, Depense } from '@/types';

interface CashReportProps {
  ventes: Vente[];
  depenses: Depense[];
  hasExport: boolean;
  onExportCSV: (data: { ventes: Vente[]; depenses: Depense[]; label: string }) => void;
  onExportPDF: (data: { ventes: Vente[]; depenses: Depense[]; label: string }) => void;
}

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function CashReport({ ventes, depenses, hasExport, onExportCSV, onExportPDF }: CashReportProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'custom'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { filteredVentes, filteredDepenses, label } = useMemo(() => {
    const dateObj = new Date(selectedDate);
    let start: Date, end: Date, label: string;

    if (period === 'day') {
      start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      label = `Rapport du ${dateObj.toLocaleDateString('fr-FR')}`;
    } else if (period === 'week') {
      const range = getWeekRange(dateObj);
      start = range.start;
      end = range.end;
      label = `Semaine du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    } else {
      start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      label = `Rapport du ${dateObj.toLocaleDateString('fr-FR')}`;
    }

    const fv = ventes.filter(v => {
      const d = new Date(v.date);
      return d >= start && d <= end;
    });
    const fd = depenses.filter(d => {
      const dd = new Date(d.date);
      return dd >= start && dd <= end;
    });

    return { filteredVentes: fv, filteredDepenses: fd, label };
  }, [ventes, depenses, period, selectedDate]);

  const totalVentes = filteredVentes.reduce((s, v) => s + v.totalMontant, 0);
  const totalDepenses = filteredDepenses.reduce((s, d) => s + d.montant, 0);
  const solde = totalVentes - totalDepenses;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'custom')}>
          <TabsList>
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="custom">Date spécifique</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
        </div>
        {hasExport && (
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => onExportCSV({ ventes: filteredVentes, depenses: filteredDepenses, label })}>
              <Download className="h-4 w-4 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExportPDF({ ventes: filteredVentes, depenses: filteredDepenses, label })}>
              <Download className="h-4 w-4 mr-1" />PDF
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-muted-foreground">{label}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-shadow">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Recettes</p>
            <p className="text-lg font-bold text-primary">{formatFCFA(totalVentes)}</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="text-lg font-bold text-destructive">{formatFCFA(totalDepenses)}</p>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className={`text-lg font-bold ${solde >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatFCFA(solde)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="card-shadow overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Détail des transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVentes.map(v => (
                <TableRow key={v.id}>
                  <TableCell><Badge className="bg-primary/10 text-primary border-0">Vente</Badge></TableCell>
                  <TableCell className="text-sm">{v.items.map(i => i.nom).join(', ')}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">+{formatFCFA(v.totalMontant)}</TableCell>
                </TableRow>
              ))}
              {filteredDepenses.map(d => (
                <TableRow key={d.id}>
                  <TableCell><Badge variant="destructive" className="border-0">Dépense</Badge></TableCell>
                  <TableCell className="text-sm">{d.description}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">-{formatFCFA(d.montant)}</TableCell>
                </TableRow>
              ))}
              {filteredVentes.length === 0 && filteredDepenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucune transaction pour cette période</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
