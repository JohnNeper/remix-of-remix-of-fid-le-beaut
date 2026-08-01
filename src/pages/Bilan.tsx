import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Users, CalendarDays, DollarSign,
  Award, Scissors, BarChart3, Clock, Star, UserCheck,
  Download, Sparkles, Activity, PieChart, CreditCard, Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinances } from '@/hooks/useFinances';
import { useClients } from '@/hooks/useClients';
import { useRendezVous } from '@/hooks/useRendezVous';
import { usePrestations } from '@/hooks/usePrestations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Period = 'day' | 'week' | 'month' | 'year';

function StatCard({ title, value, sub, icon: Icon, type = 'default', trend }: {
  title: string; value: string; sub?: React.ReactNode; icon: any; type?: 'default' | 'success' | 'danger' | 'warning' | 'info'; trend?: 'up' | 'down' | 'neutral';
}) {
  const styles = {
    default: "from-primary/30 via-primary/5 to-transparent text-primary border-primary/20",
    success: "from-emerald-500/30 via-emerald-500/5 to-transparent text-emerald-600 border-emerald-500/20",
    danger: "from-rose-500/30 via-rose-500/5 to-transparent text-rose-600 border-rose-500/20",
    warning: "from-amber-500/30 via-amber-500/5 to-transparent text-amber-600 border-amber-500/20",
    info: "from-blue-500/30 via-blue-500/5 to-transparent text-blue-600 border-blue-500/20",
  };

  const bgGradient = styles[type];
  const colorClass = bgGradient.split(' ').find(c => c.startsWith('text-'));

  return (
    <Card className="relative overflow-hidden group border-muted/60 hover:border-primary/40 transition-all duration-500 hover:shadow-xl bg-card/60 backdrop-blur-xl">
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl -mr-10 -mt-10 opacity-40 group-hover:opacity-80 transition-opacity duration-700", bgGradient.split(' ').slice(0,3).join(' '))} />
      
      <CardContent className="p-5 lg:p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl bg-background/80 shadow-sm border backdrop-blur-sm", bgGradient.split(' ').pop())}>
            <Icon className={cn("h-6 w-6", colorClass)} />
          </div>
          {trend && (
            <Badge variant="outline" className={cn(
              "font-bold px-2 py-0.5 bg-background/50 backdrop-blur-md shadow-sm",
              trend === 'up' ? 'text-emerald-500 border-emerald-500/30' : trend === 'down' ? 'text-rose-500 border-rose-500/30' : 'text-muted-foreground border-muted'
            )}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            </Badge>
          )}
        </div>
        
        <div>
          <p className="text-sm font-bold text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">{value}</p>
          {sub && <div className="text-xs font-semibold text-muted-foreground mt-2">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Bilan() {
  const [period, setPeriod] = useState<Period>('day');
  const { ventes, depenses } = useFinances();
  const { clients } = useClients();
  const { rendezVous } = useRendezVous();
  const { typesPrestations } = usePrestations();
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useTranslations();
  const { session } = useAuth();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getStartDate = (p: Period): string => {
    const d = new Date(now);
    if (p === 'day') return todayStr;
    if (p === 'week') { d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
    if (p === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return `${now.getFullYear()}-01-01`; // year
  };

  const startDate = getStartDate(period);

  const filteredVentes = useMemo(() =>
    ventes.filter(v => (v.date || '') >= startDate && (v.date || '') <= todayStr),
    [ventes, startDate, todayStr]
  );

  const filteredDepenses = useMemo(() =>
    depenses.filter(d => (d.date || '') >= startDate && (d.date || '') <= todayStr),
    [depenses, startDate, todayStr]
  );

  const filteredRdv = useMemo(() =>
    rendezVous.filter(r => (r.date || '') >= startDate && (r.date || '') <= todayStr),
    [rendezVous, startDate, todayStr]
  );

  // KPIs financiers
  const totalRevenus = filteredVentes.reduce((s, v) => s + (v.totalMontant || 0), 0);
  const totalDepensesVal = filteredDepenses.reduce((s, d) => s + (d.montant || 0), 0);
  const benefice = totalRevenus - totalDepensesVal;
  const revenusPrestations = filteredVentes.reduce((s, v) =>
    s + (v.items || []).filter(i => i.type === 'prestation').reduce((si, i) => si + (i.montant || 0), 0), 0);
  const revenusProduits = filteredVentes.reduce((s, v) =>
    s + (v.items || []).filter(i => i.type === 'produit').reduce((si, i) => si + (i.montant || 0), 0), 0);

  // Clients reçus (ventes uniques par clientId)
  const clientsRecus = new Set(filteredVentes.filter(v => v.clientId).map(v =>
    typeof v.clientId === 'object' ? (v.clientId as any)?._id : v.clientId
  )).size;
  const ventesAnonymous = filteredVentes.filter(v => !v.clientId).length;

  // RDV stats
  const rdvTotal = filteredRdv.length;
  const rdvConfirmes = filteredRdv.filter(r => r.statut === 'confirme').length;
  const rdvAnnules = filteredRdv.filter(r => r.statut === 'annule').length;

  // Clients nouveaux (inscrits dans la période)
  const newClients = clients.filter(c => {
    const d = (c.dateInscription || '').split('T')[0];
    return d >= startDate && d <= todayStr;
  }).length;

  // Prestations populaires
  const prestationCounts: Record<string, { nom: string; count: number; montant: number }> = {};
  filteredVentes.forEach(v => {
    (v.items || []).filter(i => i.type === 'prestation').forEach(item => {
      if (!prestationCounts[item.referenceId]) {
        prestationCounts[item.referenceId] = { nom: item.nom, count: 0, montant: 0 };
      }
      prestationCounts[item.referenceId].count += item.quantite || 1;
      prestationCounts[item.referenceId].montant += item.montant || 0;
    });
  });
  const topPrestations = Object.values(prestationCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  const maxPrestationCount = topPrestations.length > 0 ? topPrestations[0].count : 1;

  // Employé performance (par vente.employe)
  const employeStats: Record<string, { nom: string; ventes: number; montant: number }> = {};
  filteredVentes.forEach(v => {
    const emp = v as any;
    if (emp.employe) {
      const empId = typeof emp.employe === 'object' ? emp.employe._id : emp.employe;
      const empNom = typeof emp.employe === 'object' ? (emp.employe.name || emp.employe.email) : empId;
      if (!employeStats[empId]) employeStats[empId] = { nom: empNom, ventes: 0, montant: 0 };
      employeStats[empId].ventes += 1;
      employeStats[empId].montant += v.totalMontant || 0;
    }
  });
  const topEmployes = Object.values(employeStats).sort((a, b) => b.montant - a.montant);

  // Modes de paiement
  const parMode: Record<string, number> = {};
  filteredVentes.forEach(v => {
    if (v.modePaiement) parMode[v.modePaiement] = (parMode[v.modePaiement] || 0) + (v.totalMontant || 0);
  });

  const periodLabel = period === 'day' ? (t('bilan.periods.dayLabel') || "Aujourd'hui") : period === 'week' ? (t('bilan.periods.weekLabel') || 'Cette semaine') : period === 'month' ? (t('bilan.periods.monthLabel') || 'Ce mois') : (t('bilan.periods.yearLabel') || 'Cette année');
  const modeLabels: Record<string, { label: string, icon: any, color: string }> = {
    especes: { label: 'Espèces', icon: Wallet, color: 'text-emerald-500' },
    mobile_money: { label: 'Mobile Money', icon: CreditCard, color: 'text-amber-500' },
    carte: { label: 'Carte Bancaire', icon: CreditCard, color: 'text-blue-500' },
    mixte: { label: 'Mixte', icon: PieChart, color: 'text-purple-500' }
  };

  const exportBilanPDF = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bilan ${periodLabel}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:900px;margin:auto}
    h1{font-size:20px;border-bottom:3px solid #d6336c;padding-bottom:8px;color:#d6336c}
    h2{font-size:15px;margin-top:20px;color:#333}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0}
    .kpi{border:1px solid #eee;border-radius:8px;padding:12px;text-align:center}
    .kpi .val{font-size:20px;font-weight:bold;color:#d6336c}
    .kpi .lbl{font-size:11px;color:#666;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}
    th{background:#f5f5f5}
    .pos{color:#16a34a}.neg{color:#dc2626}
    </style></head><body>
    <h1>📊 Bilan — ${periodLabel}</h1>
    <p style="color:#666;font-size:12px">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
    <div class="grid">
      <div class="kpi"><div class="val">${formatCurrency(totalRevenus)}</div><div class="lbl">Revenus</div></div>
      <div class="kpi"><div class="val">${formatCurrency(totalDepensesVal)}</div><div class="lbl">Dépenses</div></div>
      <div class="kpi"><div class="val ${benefice >= 0 ? 'pos' : 'neg'}">${formatCurrency(benefice)}</div><div class="lbl">Bénéfice</div></div>
      <div class="kpi"><div class="val">${filteredVentes.length}</div><div class="lbl">Ventes</div></div>
      <div class="kpi"><div class="val">${clientsRecus}</div><div class="lbl">Clients reçus</div></div>
      <div class="kpi"><div class="val">${rdvTotal}</div><div class="lbl">Rendez-vous</div></div>
    </div>
    <h2>Top Prestations</h2>
    <table><tr><th>Prestation</th><th>Nb</th><th>Montant</th></tr>
    ${topPrestations.map(p => `<tr><td>${p.nom}</td><td>${p.count}</td><td class="pos">${formatCurrency(p.montant)}</td></tr>`).join('')}
    </table>
    <h2>Performance Employés</h2>
    <table><tr><th>Employé</th><th>Ventes</th><th>CA</th></tr>
    ${topEmployes.map(e => `<tr><td>${e.nom}</td><td>${e.ventes}</td><td class="pos">${formatCurrency(e.montant)}</td></tr>`).join('')}
    </table>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-background min-h-screen">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 border border-muted/50 p-6 rounded-3xl shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0 duration-300">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">{t('bilan.title')}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
              <Activity className="h-4 w-4 text-primary" /> {t('bilan.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="bg-muted/50 p-1 rounded-xl grid grid-cols-4 sm:flex shadow-inner w-full sm:w-auto">
            {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg font-bold px-2 sm:px-4 transition-all duration-300 text-xs sm:text-sm w-full",
                  period === p ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`bilan.periods.${p}`)}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="w-full sm:w-auto rounded-xl border-primary/20 hover:bg-primary/5 font-bold shadow-sm h-9" onClick={exportBilanPDF}>
            <Download className="h-4 w-4 mr-2 text-primary" /> {t('bilan.export')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2">
        <Sparkles className="h-5 w-5 text-accent animate-pulse" />
        <h2 className="text-lg font-bold">{t('bilan.overview')} ({periodLabel})</h2>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title={t('bilan.revenue')} 
          value={formatCurrency(totalRevenus)} 
          icon={TrendingUp} 
          type="success" 
          trend="up" 
          sub={<span className="flex items-center gap-1"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{filteredVentes.length} ventes</Badge> réalisées</span>} 
        />
        <StatCard 
          title={t('bilan.expenses')} 
          value={formatCurrency(totalDepensesVal)} 
          icon={TrendingDown} 
          type="danger" 
          trend="down" 
          sub={<span className="flex items-center gap-1"><Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">{filteredDepenses.length} ops</Badge> enregistrées</span>} 
        />
        <StatCard 
          title={t('bilan.netProfit')} 
          value={formatCurrency(benefice)} 
          icon={DollarSign} 
          type={benefice >= 0 ? 'default' : 'danger'} 
          trend={benefice >= 0 ? 'up' : 'down'} 
          sub={benefice >= 0 ? "Excellente marge !" : "Attention aux coûts"}
        />
        <StatCard 
          title={t('bilan.clientsReceived')} 
          value={String(clientsRecus)} 
          icon={Users} 
          type="info" 
          sub={<span className="text-blue-600">+{ventesAnonymous} visiteurs anonymes</span>} 
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title={t('bilan.revenuePrestations')} value={formatCurrency(revenusPrestations)} icon={Scissors} type="default" />
        <StatCard title={t('bilan.revenueProducts')} value={formatCurrency(revenusProduits)} icon={Award} type="warning" />
        <StatCard 
          title={t('bilan.appointments')} 
          value={String(rdvTotal)} 
          icon={CalendarDays} 
          type="info" 
          sub={
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">{rdvConfirmes} ✓</span>
              <span className="text-rose-600 font-bold">{rdvAnnules} ✗</span>
            </div>
          } 
        />
        <StatCard title={t('bilan.newClients')} value={String(newClients)} icon={UserCheck} type="success" />
      </div>

      {/* Detailed Analysis Tabs */}
      <Card className="border-muted/50 shadow-xl bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden mt-8">
        <Tabs defaultValue="prestations" className="w-full">
          <div className="border-b border-border/50 bg-muted/20 px-4 sm:px-6 py-4 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-background/80 backdrop-blur-md border shadow-sm p-1 rounded-2xl inline-flex w-max">
              <TabsTrigger value="prestations" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.topPrestationsTab')}</TabsTrigger>
              <TabsTrigger value="employes" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.topStaffTab')}</TabsTrigger>
              <TabsTrigger value="finances" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t('bilan.treasuryTab')}</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Top Prestations */}
            <TabsContent value="prestations" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-6">
                {topPrestations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-50">
                    <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-bold">{t('bilan.noServices')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {topPrestations.map((p, i) => (
                      <div key={i} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-muted/50 bg-background/50 hover:bg-background transition-colors hover:shadow-md">
                        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-1/3">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn(
                              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg font-black shadow-inner shrink-0",
                              i === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900' : 
                              i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800' : 
                              i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900' : 
                              'bg-muted text-muted-foreground'
                            )}>
                              #{i + 1}
                            </div>
                            <p className="font-bold text-sm sm:text-base truncate">{p.nom}</p>
                          </div>
                          <div className="sm:hidden text-right shrink-0">
                            <p className="font-black text-base text-primary">{formatCurrency(p.montant)}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                          <div className="flex-1 h-2 sm:h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner relative">
                            <div 
                              className="absolute top-0 left-0 h-full gradient-primary rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${(p.count / maxPrestationCount) * 100}%` }} 
                            />
                          </div>
                          <span className="font-bold text-muted-foreground w-10 sm:w-12 text-right text-xs sm:text-sm">{p.count}x</span>
                        </div>

                        <div className="hidden sm:block w-32 text-right">
                          <p className="font-black text-lg text-primary">{formatCurrency(p.montant)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Employés */}
            <TabsContent value="employes" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topEmployes.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-50">
                    <Star className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-bold">{t('bilan.noStaffData')}</p>
                  </div>
                ) : topEmployes.map((e, i) => (
                  <Card key={i} className="border-muted/50 shadow-sm hover:shadow-xl transition-shadow bg-background/50 overflow-hidden relative group">
                    {i === 0 && <div className="absolute top-0 inset-x-0 h-1 gradient-primary" />}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                          {(e.nom || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-lg">{e.nom}</p>
                          <Badge variant="secondary" className="font-semibold mt-1">
                            {e.ventes} prestation{e.ventes > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                        <span className="text-sm font-bold text-muted-foreground">CA Généré</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(e.montant)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Finances détaillées */}
            <TabsContent value="finances" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Modes de paiement */}
                <Card className="border-muted/50 shadow-md bg-background/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> 
                      {t('bilan.byPaymentMethod')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(parMode).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noTransactions')}</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(parMode)
                          .sort((a,b) => b[1] - a[1])
                          .map(([mode, montant]) => {
                          const conf = modeLabels[mode] || { label: mode, icon: CreditCard, color: 'text-muted-foreground' };
                          const IconComp = conf.icon;
                          const percent = Math.round((montant / totalRevenus) * 100);
                          
                          return (
                            <div key={mode} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl bg-background shadow-sm border", conf.color)}>
                                  <IconComp className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold">{conf.label}</p>
                                  <p className="text-xs font-semibold text-muted-foreground">{percent}% du total</p>
                                </div>
                              </div>
                              <span className="font-black text-base sm:text-lg">{formatCurrency(montant)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* {t('bilan.expensesByCategory')} */}
                <Card className="border-muted/50 shadow-md bg-background/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-rose-500" /> 
                      Dépenses par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const cats: Record<string, number> = {};
                      filteredDepenses.forEach(d => { cats[d.categorie] = (cats[d.categorie] || 0) + d.montant; });
                      const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
                      
                      return sortedCats.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noExpenses')}</p>
                      ) : (
                        <div className="space-y-4">
                          {sortedCats.map(([cat, montant]) => {
                            const percent = Math.round((montant / totalDepensesVal) * 100);
                            return (
                              <div key={cat} className="group p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                <div className="flex justify-between items-center mb-2">
                                  <Badge variant="outline" className="bg-background font-bold text-rose-600 border-rose-200 uppercase tracking-wider">{cat}</Badge>
                                  <span className="font-black text-rose-600">{formatCurrency(montant)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-rose-100 dark:bg-rose-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-rose-500/70 w-8">{percent}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
