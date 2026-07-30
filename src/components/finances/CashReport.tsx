import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'custom')} className="w-full">
            <TabsList className="w-full sm:w-auto inline-flex">
              <TabsTrigger value="day" className="flex-1 whitespace-nowrap">Jour</TabsTrigger>
              <TabsTrigger value="week" className="flex-1 whitespace-nowrap">Semaine</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 whitespace-nowrap">Date spécifique</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm">Détail des transactions</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Type</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Montant</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {(() => {
                const allTransactions = [
                  ...filteredVentes.map(v => ({ id: v.id, date: v.date, type: 'vente' as const, desc: v.items.map(i => i.nom).join(', '), montant: v.totalMontant })),
                  ...filteredDepenses.map(d => ({ id: d.id, date: d.date, type: 'depense' as const, desc: d.description, montant: d.montant })),
                ].sort((a, b) => b.date.localeCompare(a.date));
                
                const searched = allTransactions.filter(t => 
                  t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  new Date(t.date).toLocaleDateString('fr-FR').includes(searchQuery)
                );
                
                const totalPages = Math.ceil(searched.length / itemsPerPage);
                const paginated = searched.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                
                return (
                  <>
                    {paginated.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge className={t.type === 'vente' ? 'bg-primary/10 text-primary border-0' : 'bg-destructive/10 text-destructive border-0'}>
                            {t.type === 'vente' ? 'Vente' : 'Dépense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{t.desc}</TableCell>
                        <TableCell className={`text-right font-semibold ${t.type === 'vente' ? 'text-primary' : 'text-destructive'}`}>
                          {t.type === 'vente' ? '+' : '-'}{formatFCFA(t.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {searched.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucune transaction trouvée</TableCell>
                      </TableRow>
                    )}
                    {totalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })()}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
