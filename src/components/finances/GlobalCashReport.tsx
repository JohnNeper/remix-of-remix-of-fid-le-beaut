import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, TrendingUp, TrendingDown, Wallet, PieChart, BarChart3 } from 'lucide-react';
import { Vente, Depense } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

interface GlobalCashReportProps {
  ventes: Vente[];
  depenses: Depense[];
  hasExport: boolean;
  onExportCSV: (data: { ventes: Vente[]; depenses: Depense[]; label: string }) => void;
  onExportPDF: (data: { ventes: Vente[]; depenses: Depense[]; label: string }) => void;
}

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
const COLORS = ['hsl(340, 65%, 50%)', 'hsl(200, 70%, 50%)', 'hsl(150, 60%, 45%)', 'hsl(40, 80%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(20, 80%, 55%)'];

function getWeekRange(date: Date) {
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

export function GlobalCashReport({ ventes, depenses, hasExport, onExportCSV, onExportPDF }: GlobalCashReportProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'range'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);

  const { filteredVentes, filteredDepenses, label } = useMemo(() => {
    const dateObj = new Date(selectedDate);
    let start: Date, end: Date, label: string;

    if (period === 'day') {
      start = new Date(selectedDate); start.setHours(0, 0, 0, 0);
      end = new Date(selectedDate); end.setHours(23, 59, 59, 999);
      label = `Rapport du ${dateObj.toLocaleDateString('fr-FR')}`;
    } else if (period === 'week') {
      const range = getWeekRange(dateObj);
      start = range.start; end = range.end;
      label = `Semaine du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    } else if (period === 'month') {
      start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
      end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
      label = `Mois de ${dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      start = new Date(dateStart); start.setHours(0, 0, 0, 0);
      end = new Date(dateEnd); end.setHours(23, 59, 59, 999);
      label = `Du ${new Date(dateStart).toLocaleDateString('fr-FR')} au ${new Date(dateEnd).toLocaleDateString('fr-FR')}`;
    }

    const fv = ventes.filter(v => { const d = new Date(v.date); return d >= start && d <= end; });
    const fd = depenses.filter(d => { const dd = new Date(d.date); return dd >= start && dd <= end; });
    return { filteredVentes: fv, filteredDepenses: fd, label };
  }, [ventes, depenses, period, selectedDate, dateStart, dateEnd]);

  const totalVentes = filteredVentes.reduce((s, v) => s + v.totalMontant, 0);
  const totalDepenses = filteredDepenses.reduce((s, d) => s + d.montant, 0);
  const solde = totalVentes - totalDepenses;
  const nbTransactions = filteredVentes.length + filteredDepenses.length;

  // Revenue by type
  const revenueByType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredVentes.forEach(v => v.items.forEach(i => {
      const key = i.type === 'prestation' ? 'Services' : 'Produits';
      map[key] = (map[key] || 0) + i.montant;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredVentes]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredDepenses.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredDepenses]);

  // Daily breakdown for bar chart
  const dailyBreakdown = useMemo(() => {
    const map: Record<string, { date: string; recettes: number; depenses: number }> = {};
    filteredVentes.forEach(v => {
      if (!map[v.date]) map[v.date] = { date: v.date, recettes: 0, depenses: 0 };
      map[v.date].recettes += v.totalMontant;
    });
    filteredDepenses.forEach(d => {
      if (!map[d.date]) map[d.date] = { date: d.date, recettes: 0, depenses: 0 };
      map[d.date].depenses += d.montant;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    }));
  }, [filteredVentes, filteredDepenses]);

  // Payment modes
  const paymentModes = useMemo(() => {
    const map: Record<string, number> = {};
    const labels: Record<string, string> = { especes: 'Espèces', mobile_money: 'Mobile Money', carte: 'Carte', mixte: 'Mixte' };
    filteredVentes.forEach(v => { const k = labels[v.modePaiement] || v.modePaiement; map[k] = (map[k] || 0) + v.totalMontant; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredVentes]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <TabsList>
                  <TabsTrigger value="day">Jour</TabsTrigger>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                  <TabsTrigger value="month">Mois</TabsTrigger>
                  <TabsTrigger value="range">Période</TabsTrigger>
                </TabsList>
              </Tabs>
              {hasExport && (
                <div className="flex gap-2 sm:ml-auto">
                  <Button variant="outline" size="sm" onClick={() => onExportCSV({ ventes: filteredVentes, depenses: filteredDepenses, label })}>
                    <Download className="h-4 w-4 mr-1" />CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onExportPDF({ ventes: filteredVentes, depenses: filteredDepenses, label })}>
                    <Download className="h-4 w-4 mr-1" />PDF
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {period === 'range' ? (
                <>
                  <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-auto" />
                  <span className="text-muted-foreground text-sm">au</span>
                  <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-auto" />
                </>
              ) : (
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-semibold text-primary">{label}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="card-shadow border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Recettes</p>
            </div>
            <p className="text-xl font-bold text-primary">{formatFCFA(totalVentes)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filteredVentes.length} vente(s)</p>
          </CardContent>
        </Card>
        <Card className="card-shadow border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Dépenses</p>
            </div>
            <p className="text-xl font-bold text-destructive">{formatFCFA(totalDepenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filteredDepenses.length} dépense(s)</p>
          </CardContent>
        </Card>
        <Card className={`card-shadow border-l-4 ${solde >= 0 ? 'border-l-success' : 'border-l-destructive'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4" style={{ color: solde >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
              <p className="text-xs text-muted-foreground">Solde net</p>
            </div>
            <p className={`text-xl font-bold ${solde >= 0 ? 'text-success' : 'text-destructive'}`} style={{ color: solde >= 0 ? 'hsl(var(--success))' : undefined }}>{formatFCFA(solde)}</p>
          </CardContent>
        </Card>
        <Card className="card-shadow border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-accent" />
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
            <p className="text-xl font-bold">{nbTransactions}</p>
            <p className="text-xs text-muted-foreground mt-1">total période</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {dailyBreakdown.length > 0 && (
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Évolution des recettes et dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatFCFA(value)} />
                <Bar dataKey="recettes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Recettes" />
                <Bar dataKey="depenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue by type */}
        {revenueByType.length > 0 && (
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recettes par type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie data={revenueByType} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatFCFA(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Expenses by category */}
        {expensesByCategory.length > 0 && (
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dépenses par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expensesByCategory.sort((a, b) => b.value - a.value).map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span>
                      <span className="font-semibold">{formatFCFA(cat.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${totalDepenses ? (cat.value / totalDepenses * 100) : 0}%`,
                        background: COLORS[i % COLORS.length],
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment modes */}
        {paymentModes.length > 0 && (
          <Card className="card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Par mode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentModes.map((pm) => (
                  <div key={pm.name} className="flex justify-between items-center">
                    <Badge variant="secondary">{pm.name}</Badge>
                    <span className="font-semibold text-sm">{formatFCFA(pm.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction details */}
      <Card className="card-shadow overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Détail des transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...filteredVentes.map(v => ({ id: v.id, date: v.date, type: 'vente' as const, desc: v.items.map(i => i.nom).join(', '), montant: v.totalMontant })),
                ...filteredDepenses.map(d => ({ id: d.id, date: d.date, type: 'depense' as const, desc: d.description, montant: d.montant })),
              ].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge className={t.type === 'vente' ? 'bg-primary/10 text-primary border-0' : 'bg-destructive/10 text-destructive border-0'}>
                      {t.type === 'vente' ? 'Recette' : 'Dépense'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{t.desc}</TableCell>
                  <TableCell className={`text-right font-semibold ${t.type === 'vente' ? 'text-primary' : 'text-destructive'}`}>
                    {t.type === 'vente' ? '+' : '-'}{formatFCFA(t.montant)}
                  </TableCell>
                </TableRow>
              ))}
              {nbTransactions === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune transaction pour cette période</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
