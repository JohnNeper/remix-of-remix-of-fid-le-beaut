import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, CalendarDays, DollarSign,
  Award, Scissors, BarChart3, Clock, Star, UserCheck,
  Download, Sparkles, Activity, PieChart, CreditCard, Wallet,
  RefreshCw, Search, Filter, CheckCircle2, Package, ShoppingBag,
  Phone, Mail, Crown, Medal, ArrowUpRight, ArrowDownRight,
  Receipt, Calendar, ChevronRight, ChevronLeft, SlidersHorizontal, Sparkle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useFinances } from '@/hooks/useFinances';
import { useClients } from '@/hooks/useClients';
import { useRendezVous } from '@/hooks/useRendezVous';
import { usePrestations } from '@/hooks/usePrestations';
import { useStock } from '@/hooks/useStock';
import { useSalon } from '@/hooks/useSalon';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Period = 'day' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
type FluxFilter = 'all' | 'entree' | 'sortie';
type StaffSortBy = 'ca' | 'prestations' | 'produits' | 'clients' | 'panier';

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  type = 'default',
  trend
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  icon: any;
  type?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  trend?: 'up' | 'down' | 'neutral';
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
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl -mr-10 -mt-10 opacity-40 group-hover:opacity-80 transition-opacity duration-700", bgGradient.split(' ').slice(0, 3).join(' '))} />

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
          <p className="text-xs sm:text-sm font-bold text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">{value}</p>
          {sub && <div className="text-xs font-semibold text-muted-foreground mt-2">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Bilan() {
  const [period, setPeriod] = useState<Period>('day');
  const [customDay, setCustomDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState<'journal' | 'employes' | 'prestations' | 'produits' | 'finances'>('journal');
  const [fluxFilter, setFluxFilter] = useState<FluxFilter>('all');
  const [fluxSearch, setFluxSearch] = useState<string>('');
  const [staffSort, setStaffSort] = useState<StaffSortBy>('ca');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [journalPage, setJournalPage] = useState(1);
  const journalPageSize = 12;

  const { plan } = useSubscriptionPlan();
  const { session } = useAuth();
  const salonId = session?.salonId;
  const queryClient = useQueryClient();

  const { ventes, depenses, refetchVentes, refetchDepenses } = useFinances();
  const { clients } = useClients();
  const { rendezVous } = useRendezVous();
  const { typesPrestations, prestations, refetchPrestations } = usePrestations();
  const { produits } = useStock();
  const { salon, staff, refetch: refetchSalon } = useSalon();
  const { t, language } = useLanguage();
  const { formatCurrency, formatDate } = useTranslations();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Calcul dynamique de la période
  const { startDate, endDate, periodLabel } = useMemo(() => {
    let s = todayStr;
    let e = todayStr;
    let label = t('bilan.periods.dayLabel') || "Aujourd'hui";

    if (period === 'day') {
      s = customDay || todayStr;
      e = customDay || todayStr;
      label = s === todayStr ? (t('bilan.periods.dayLabel') || "Aujourd'hui") : formatDate(s);
    } else if (period === 'yesterday') {
      s = yesterdayStr;
      e = yesterdayStr;
      label = t('bilan.periods.yesterdayLabel') || 'Hier';
    } else if (period === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
      d.setDate(diff);
      s = d.toISOString().split('T')[0];
      e = todayStr;
      label = t('bilan.periods.weekLabel') || 'Cette semaine';
    } else if (period === 'month') {
      s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      e = todayStr;
      label = t('bilan.periods.monthLabel') || 'Ce mois';
    } else if (period === 'year') {
      s = `${now.getFullYear()}-01-01`;
      e = todayStr;
      label = t('bilan.periods.yearLabel') || 'Cette année';
    } else if (period === 'custom') {
      s = customRange.start || todayStr;
      e = customRange.end || todayStr;
      label = `${formatDate(s)} → ${formatDate(e)}`;
    }

    return { startDate: s, endDate: e, periodLabel: label };
  }, [period, customDay, customRange, todayStr, yesterdayStr, t, formatDate]);

  // Actualisation globale
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchVentes?.(),
        refetchDepenses?.(),
        refetchPrestations?.(),
        refetchSalon?.(),
        queryClient.invalidateQueries({ queryKey: ['clients', salonId] }),
        queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] }),
        queryClient.invalidateQueries({ queryKey: ['produits', salonId] }),
      ]);
      toast.success(t('bilan.refreshed') || 'Données actualisées avec succès');
    } catch (err) {
      toast.error(t('bilan.refreshError') || 'Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchVentes, refetchDepenses, refetchPrestations, refetchSalon, queryClient, salonId, t]);

  // Écoute des mises à jour financières en temps réel (validation de rendez-vous, encaissement)
  useEffect(() => {
    const handleFinanceEvent = () => {
      refetchVentes?.();
      refetchDepenses?.();
      refetchPrestations?.();
      refetchSalon?.();
      if (salonId) {
        queryClient.invalidateQueries({ queryKey: ['ventes', salonId] });
        queryClient.invalidateQueries({ queryKey: ['rendezVous', salonId] });
        queryClient.invalidateQueries({ queryKey: ['clients', salonId] });
      }
    };
    window.addEventListener('finance:updated', handleFinanceEvent);
    return () => window.removeEventListener('finance:updated', handleFinanceEvent);
  }, [refetchVentes, refetchDepenses, refetchPrestations, refetchSalon, queryClient, salonId]);

  // Ventes filtrées par date
  const filteredVentes = useMemo(() =>
    ventes.filter(v => {
      const d = (v.date || '').split('T')[0];
      return d >= startDate && d <= endDate;
    }),
    [ventes, startDate, endDate]
  );

  // Dépenses filtrées par date
  const filteredDepenses = useMemo(() =>
    depenses.filter(d => {
      const dDate = (d.date || '').split('T')[0];
      return dDate >= startDate && dDate <= endDate;
    }),
    [depenses, startDate, endDate]
  );

  // Prestations de la période
  const filteredPrestations = useMemo(() =>
    prestations.filter(p => {
      const pDate = (p.date || '').split('T')[0];
      return pDate >= startDate && pDate <= endDate;
    }),
    [prestations, startDate, endDate]
  );

  // RDV de la période
  const filteredRdv = useMemo(() =>
    rendezVous.filter(r => {
      const rDate = (r.date || '').split('T')[0];
      return rDate >= startDate && rDate <= endDate;
    }),
    [rendezVous, startDate, endDate]
  );

  // Nouveaux clients enregistrés dans la période
  const newClients = useMemo(() =>
    clients.filter(c => {
      const d = (c.dateInscription || '').split('T')[0];
      return d >= startDate && d <= endDate;
    }).length,
    [clients, startDate, endDate]
  );

  // Détection des prestations orphelines (prestations sans ticket vente lié)
  const orphanPrestations = useMemo(() => {
    return filteredPrestations.filter(p => {
      const pDate = (p.date || '').split('T')[0];
      const matchingVente = filteredVentes.find(v => {
        const vDate = (v.date || '').split('T')[0];
        const vClientId = typeof v.clientId === 'object' ? (v.clientId as any)?._id : v.clientId;
        return vDate === pDate && vClientId && vClientId === p.clientId;
      });
      return !matchingVente;
    });
  }, [filteredPrestations, filteredVentes]);

  const orphanRevenus = useMemo(() =>
    orphanPrestations.reduce((s, p) => s + (p.montant || 0), 0),
    [orphanPrestations]
  );

  // Totaux financiers
  const totalRevenusVentes = useMemo(() =>
    filteredVentes.reduce((s, v) => s + (v.totalMontant || 0), 0),
    [filteredVentes]
  );

  const totalRevenus = totalRevenusVentes + orphanRevenus;
  const totalDepensesVal = useMemo(() =>
    filteredDepenses.reduce((s, d) => s + (d.montant || 0), 0),
    [filteredDepenses]
  );

  const benefice = totalRevenus - totalDepensesVal;
  const margePct = totalRevenus > 0 ? Math.round((benefice / totalRevenus) * 100) : 0;

  // Répartition CA soins vs CA produits
  const revenusPrestationsVentes = useMemo(() =>
    filteredVentes.reduce((s, v) =>
      s + (v.items || []).filter(i => i.type === 'prestation').reduce((si, i) => si + (i.montant || 0), 0), 0),
    [filteredVentes]
  );
  const revenusPrestations = revenusPrestationsVentes + orphanRevenus;

  const revenusProduits = useMemo(() =>
    filteredVentes.reduce((s, v) =>
      s + (v.items || []).filter(i => i.type === 'produit').reduce((si, i) => si + (i.montant || 0), 0), 0),
    [filteredVentes]
  );

  // Compteurs de volumes
  const totalPrestationsCount = useMemo(() => {
    const fromVentes = filteredVentes.reduce((s, v) =>
      s + (v.items || []).filter(i => i.type === 'prestation').reduce((si, i) => si + (i.quantite || 1), 0), 0);
    return fromVentes + orphanPrestations.length;
  }, [filteredVentes, orphanPrestations]);

  const totalProduitsVendusCount = useMemo(() =>
    filteredVentes.reduce((s, v) =>
      s + (v.items || []).filter(i => i.type === 'produit').reduce((si, i) => si + (i.quantite || 1), 0), 0),
    [filteredVentes]
  );

  // Clients reçus (uniques)
  const clientsRecus = useMemo(() => {
    const set = new Set<string>();
    filteredVentes.forEach(v => {
      const cId = typeof v.clientId === 'object' ? (v.clientId as any)?._id : v.clientId;
      if (cId) set.add(String(cId));
    });
    orphanPrestations.forEach(p => {
      if (p.clientId) set.add(String(p.clientId));
    });
    return set.size;
  }, [filteredVentes, orphanPrestations]);

  const ventesAnonymous = useMemo(() =>
    filteredVentes.filter(v => !v.clientId).length,
    [filteredVentes]
  );

  const totalClientsVisites = clientsRecus + ventesAnonymous;
  const panierMoyenGlobal = totalClientsVisites > 0 ? Math.round(totalRevenus / totalClientsVisites) : 0;

  // RDV stats
  const rdvTotal = filteredRdv.length;
  const rdvConfirmes = filteredRdv.filter(r => r.statut === 'confirme' || r.statut === 'termine' || r.statut === 'completed' || r.financeValide).length;
  const rdvAnnules = filteredRdv.filter(r => r.statut === 'annule').length;

  // Résolution d'un employé (par ID, objet ou nom) avec support complet du Boss (Owner), des noms stockés et de la détection ObjectId
  const resolveStaffMember = useCallback((rawEmp: any, fallbackNom?: string, notes?: string): { id: string; name: string; role: string; avatarUrl?: string } => {
    // 1. Nettoyer le fallback s'il s'agit d'un hex ObjectId
    let cleanFallback = fallbackNom?.trim();
    if (cleanFallback && /^[0-9a-fA-F]{24}$/.test(cleanFallback)) {
      cleanFallback = undefined;
    }

    // 2. Extraire ID et nom brut
    let rawId = '';
    let rawName = '';
    let avatarUrl: string | undefined;

    if (rawEmp && typeof rawEmp === 'object') {
      rawId = String(rawEmp._id || rawEmp.id || '');
      rawName = rawEmp.name || rawEmp.nom || rawEmp.email || '';
      avatarUrl = rawEmp.avatarUrl;
    } else if (rawEmp) {
      rawId = String(rawEmp);
      rawName = String(rawEmp);
    }

    // Extraction depuis les notes si nécessaire ("En charge: ...")
    if ((!rawName || /^[0-9a-fA-F]{24}$/.test(rawName)) && notes) {
      const match = notes.match(/En charge:\s*([^).,]+)/i);
      if (match && match[1]?.trim()) {
        cleanFallback = match[1].trim();
      }
    }

    // 3. Correspondance dans la liste du personnel (staff)
    const foundStaff = staff.find(s =>
      (rawId && (s.id === rawId || s._id === rawId)) ||
      (rawName && (
        (s.name && s.name.toLowerCase() === rawName.toLowerCase()) ||
        (s.email && s.email.toLowerCase() === rawName.toLowerCase())
      ))
    );

    if (foundStaff) {
      return {
        id: foundStaff._id || foundStaff.id,
        name: foundStaff.name || foundStaff.email.split('@')[0],
        role: foundStaff.role || t('bilan.staffCol') || 'Collaborateur',
        avatarUrl: foundStaff.avatarUrl || avatarUrl,
      };
    }

    // 4. Correspondance avec le compte Boss / Propriétaire connecté
    const isBossSession = Boolean(
      (session?.userId && (rawId === session.userId || rawName === session.userId)) ||
      (session?.userName && rawName && session.userName.toLowerCase() === rawName.toLowerCase()) ||
      (session?.userEmail && rawName && session.userEmail.toLowerCase() === rawName.toLowerCase())
    );

    if (isBossSession) {
      return {
        id: session?.userId || 'boss-owner',
        name: session?.userName || salon?.nom || 'Boss (Propriétaire)',
        role: 'Propriétaire',
        avatarUrl: undefined,
      };
    }

    // 5. Correspondance avec le propriétaire du salon (salon.owner)
    const ownerObj = salon?.owner as any;
    const isSalonOwner = Boolean(
      ownerObj && (
        (typeof ownerObj === 'object' && (rawId === ownerObj._id || rawId === ownerObj.id)) ||
        (typeof ownerObj === 'string' && rawId === ownerObj)
      )
    );

    if (isSalonOwner) {
      const ownerName = (typeof ownerObj === 'object' ? ownerObj.name : null) || session?.userName || 'Propriétaire';
      return {
        id: (typeof ownerObj === 'object' ? (ownerObj._id || ownerObj.id) : ownerObj) || 'boss-owner',
        name: ownerName,
        role: 'Propriétaire',
        avatarUrl: undefined,
      };
    }

    // 6. Si un nom de secours explicite existe (employeNom)
    if (cleanFallback) {
      return {
        id: rawId || cleanFallback,
        name: cleanFallback,
        role: t('bilan.staffCol') || 'Collaborateur',
        avatarUrl,
      };
    }

    // 7. Si rawName est un nom lisible (pas un hash hexadécimal de 24 caractères)
    if (rawName && !/^[0-9a-fA-F]{24}$/.test(rawName)) {
      return {
        id: rawId || rawName,
        name: rawName,
        role: t('bilan.staffCol') || 'Collaborateur',
        avatarUrl,
      };
    }

    // 8. Non assigné
    if (!rawId || rawId === 'unassigned') {
      return {
        id: 'unassigned',
        name: t('bilan.unassigned') || 'Non assigné',
        role: t('bilan.generalTeam') || 'Équipe générale',
      };
    }

    // 9. Fallback par défaut propre
    return {
      id: rawId,
      name: t('bilan.staffMember') || 'Collaborateur',
      role: t('bilan.staffCol') || 'Collaborateur',
    };
  }, [staff, session, salon, t]);

  // Résolution d'un nom de client
  const resolveClientName = useCallback((rawClient: any): string => {
    if (!rawClient) return t('bilan.walkInClient') || 'Client de passage';
    if (typeof rawClient === 'object') {
      return rawClient.nom || rawClient.name || t('bilan.walkInClient') || 'Client de passage';
    }
    const found = clients.find(c => c.id === rawClient || (c as any)._id === rawClient);
    return found ? found.nom : t('bilan.walkInClient') || 'Client de passage';
  }, [clients, t]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TOP EMPLOYÉS (Détails approfondis)
  // ─────────────────────────────────────────────────────────────────────────────
  const detailedTopEmployes = useMemo(() => {
    type StaffAccumulator = {
      id: string;
      nom: string;
      role: string;
      avatarUrl?: string;
      caTotal: number;
      caSoins: number;
      caProduits: number;
      nbPrestations: number;
      nbProduits: number;
      nbVentes: number;
      clientIds: Set<string>;
      nbAnonymous: number;
      rdvAssocies: number;
      rdvConfirmes: number;
    };

    const map: Record<string, StaffAccumulator> = {};

    // Initialiser les membres d'équipe enregistrés
    staff.forEach(s => {
      const key = s._id || s.id;
      map[key] = {
        id: key,
        nom: s.name || s.email.split('@')[0],
        role: s.role || t('bilan.staffCol') || 'Collaborateur',
        avatarUrl: s.avatarUrl,
        caTotal: 0,
        caSoins: 0,
        caProduits: 0,
        nbPrestations: 0,
        nbProduits: 0,
        nbVentes: 0,
        clientIds: new Set<string>(),
        nbAnonymous: 0,
        rdvAssocies: 0,
        rdvConfirmes: 0,
      };
    });

    // Initialiser le Boss / Propriétaire connecté dans l'équipe
    const ownerId = session?.userId || (typeof salon?.owner === 'object' ? (salon?.owner as any)?._id : salon?.owner);
    const ownerName = session?.userName || (typeof salon?.owner === 'object' ? (salon?.owner as any)?.name : null) || 'Boss (Propriétaire)';
    if (ownerId && !map[ownerId]) {
      map[ownerId] = {
        id: ownerId,
        nom: ownerName,
        role: 'Propriétaire',
        avatarUrl: undefined,
        caTotal: 0,
        caSoins: 0,
        caProduits: 0,
        nbPrestations: 0,
        nbProduits: 0,
        nbVentes: 0,
        clientIds: new Set<string>(),
        nbAnonymous: 0,
        rdvAssocies: 0,
        rdvConfirmes: 0,
      };
    }

    filteredVentes.forEach(v => {
      const matchingRdv = filteredRdv.find(r =>
        (v.rendezVousId && (r.id === v.rendezVousId || (r as any)._id === v.rendezVousId)) ||
        (v.id && r.venteId === v.id) ||
        (v.rendezVousRef && r.reference === v.rendezVousRef)
      );
      const fallbackNom = v.employeNom || matchingRdv?.employeNom;
      const empInfo = resolveStaffMember(v.employe, fallbackNom, v.notes);
      const key = empInfo.id;

      if (!map[key]) {
        map[key] = {
          id: key,
          nom: empInfo.name,
          role: empInfo.role,
          avatarUrl: empInfo.avatarUrl,
          caTotal: 0,
          caSoins: 0,
          caProduits: 0,
          nbPrestations: 0,
          nbProduits: 0,
          nbVentes: 0,
          clientIds: new Set<string>(),
          nbAnonymous: 0,
          rdvAssocies: 0,
          rdvConfirmes: 0,
        };
      }

      const rec = map[key];
      rec.nbVentes += 1;
      rec.caTotal += v.totalMontant || 0;

      const cId = typeof v.clientId === 'object' ? (v.clientId as any)?._id : v.clientId;
      if (cId) {
        rec.clientIds.add(String(cId));
      } else {
        rec.nbAnonymous += 1;
      }

      (v.items || []).forEach(item => {
        if (item.type === 'prestation') {
          rec.caSoins += item.montant || 0;
          rec.nbPrestations += item.quantite || 1;
        } else if (item.type === 'produit') {
          rec.caProduits += item.montant || 0;
          rec.nbProduits += item.quantite || 1;
        }
      });
    });

    orphanPrestations.forEach(p => {
      const empInfo = resolveStaffMember(p.employe);
      const key = empInfo.id;
      if (!map[key]) {
        map[key] = {
          id: key,
          nom: empInfo.name,
          role: empInfo.role,
          avatarUrl: empInfo.avatarUrl,
          caTotal: 0,
          caSoins: 0,
          caProduits: 0,
          nbPrestations: 0,
          nbProduits: 0,
          nbVentes: 0,
          clientIds: new Set<string>(),
          nbAnonymous: 0,
          rdvAssocies: 0,
          rdvConfirmes: 0,
        };
      }
      const rec = map[key];
      rec.caTotal += p.montant || 0;
      rec.caSoins += p.montant || 0;
      rec.nbPrestations += 1;
      if (p.clientId) rec.clientIds.add(String(p.clientId));
    });

    filteredRdv.forEach(r => {
      const empInfo = resolveStaffMember(r.employe, r.employeNom, r.notes);
      const key = empInfo.id;
      if (!map[key]) {
        map[key] = {
          id: key,
          nom: empInfo.name,
          role: empInfo.role,
          avatarUrl: empInfo.avatarUrl,
          caTotal: 0,
          caSoins: 0,
          caProduits: 0,
          nbPrestations: 0,
          nbProduits: 0,
          nbVentes: 0,
          clientIds: new Set<string>(),
          nbAnonymous: 0,
          rdvAssocies: 0,
          rdvConfirmes: 0,
        };
      }
      map[key].rdvAssocies += 1;
      const isConfirmedOrFinished = r.statut === 'confirme' || r.statut === 'termine' || r.statut === 'completed' || r.financeValide;
      if (isConfirmedOrFinished) {
        map[key].rdvConfirmes += 1;
      }
    });

    const list = Object.values(map).map(emp => {
      const nbClientsTotal = emp.clientIds.size + emp.nbAnonymous;
      const panierMoyen = emp.nbVentes > 0 ? Math.round(emp.caTotal / emp.nbVentes) : 0;
      const partDuCA = totalRevenus > 0 ? Math.round((emp.caTotal / totalRevenus) * 100) : 0;

      return {
        ...emp,
        nbClientsTotal,
        panierMoyen,
        partDuCA,
      };
    });

    list.sort((a, b) => {
      if (staffSort === 'ca') return b.caTotal - a.caTotal;
      if (staffSort === 'prestations') return b.nbPrestations - a.nbPrestations;
      if (staffSort === 'produits') return b.nbProduits - a.nbProduits;
      if (staffSort === 'clients') return b.nbClientsTotal - a.nbClientsTotal;
      if (staffSort === 'panier') return b.panierMoyen - a.panierMoyen;
      return b.caTotal - a.caTotal;
    });

    return list;
  }, [filteredVentes, orphanPrestations, filteredRdv, staff, session, salon, totalRevenus, staffSort, resolveStaffMember, t]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. JOURNAL DES FLUX (Entrées & Sorties de la journée / période)
  // ─────────────────────────────────────────────────────────────────────────────
  interface JournalEntry {
    id: string;
    date: string;
    time: string;
    type: 'entree' | 'sortie';
    nature: 'vente' | 'prestation' | 'depense';
    titre: string;
    description: string;
    clientNom: string;
    employeNom: string;
    modePaiement: string;
    montant: number;
    itemsBadge?: string;
  }

  const journalEntries = useMemo<JournalEntry[]>(() => {
    const list: JournalEntry[] = [];

    // Entrées depuis ventes
    filteredVentes.forEach(v => {
      const dateParts = (v.date || '').split('T');
      const d = dateParts[0] || todayStr;
      const tStr = dateParts[1] ? dateParts[1].substring(0, 5) : '12:00';

      const itemsDesc = (v.items || [])
        .map(i => `${i.quantite || 1}x ${i.nom}`)
        .join(', ') || t('bilan.ticketSale') || 'Vente caisse';

      const matchingRdv = filteredRdv.find(r =>
        (v.rendezVousId && (r.id === v.rendezVousId || (r as any)._id === v.rendezVousId)) ||
        (v.id && r.venteId === v.id) ||
        (v.rendezVousRef && r.reference === v.rendezVousRef)
      );
      const fallbackNom = v.employeNom || matchingRdv?.employeNom;
      const emp = resolveStaffMember(v.employe, fallbackNom, v.notes);
      const cl = resolveClientName(v.clientId);

      list.push({
        id: `v-${v.id || (v as any)._id}`,
        date: d,
        time: tStr,
        type: 'entree',
        nature: 'vente',
        titre: `${t('bilan.ticketSale') || 'Ticket Vente'} #${(v.id || (v as any)._id || '').slice(-5)}`,
        description: itemsDesc,
        clientNom: cl,
        employeNom: emp.name,
        modePaiement: v.modePaiement || 'especes',
        montant: v.totalMontant || 0,
        itemsBadge: `${v.items?.length || 0} ${t('bilan.productsWord') || 'article(s)'}`,
      });
    });

    // Entrées depuis prestations orphelines
    orphanPrestations.forEach(p => {
      const dateParts = (p.date || '').split('T');
      const d = dateParts[0] || todayStr;
      const tStr = dateParts[1] ? dateParts[1].substring(0, 5) : '12:00';

      const typePresta = typesPrestations.find(t => t.id === p.typePrestationId || (t as any)._id === p.typePrestationId);
      const nomPresta = typePresta ? typePresta.nom : t('bilan.careService') || 'Prestation de soin';

      const emp = resolveStaffMember(p.employe);
      const cl = resolveClientName(p.clientId);

      list.push({
        id: `p-${p.id}`,
        date: d,
        time: tStr,
        type: 'entree',
        nature: 'prestation',
        titre: t('bilan.directService') || 'Prestation Directe',
        description: nomPresta,
        clientNom: cl,
        employeNom: emp.name,
        modePaiement: 'especes',
        montant: p.montant || 0,
        itemsBadge: `1 ${t('bilan.servicesWord') || 'soin'}`,
      });
    });

    // Sorties depuis dépenses
    filteredDepenses.forEach(d => {
      const dateParts = (d.date || '').split('T');
      const dDate = dateParts[0] || todayStr;
      const tStr = dateParts[1] ? dateParts[1].substring(0, 5) : '12:00';

      list.push({
        id: `d-${d.id}`,
        date: dDate,
        time: tStr,
        type: 'sortie',
        nature: 'depense',
        titre: `${t('bilan.expensePrefix') || 'Dépense'} • ${d.categorie || 'Autre'}`,
        description: d.description || t('bilan.operatingExpense') || 'Dépense d\'exploitation',
        clientNom: '—',
        employeNom: t('bilan.cashOutflow') || 'Caisse',
        modePaiement: t('bilan.cashOutflow') || 'Caisse',
        montant: d.montant || 0,
        itemsBadge: d.categorie,
      });
    });

    list.sort((a, b) => {
      const timeA = `${a.date}T${a.time}`;
      const timeB = `${b.date}T${b.time}`;
      return timeB.localeCompare(timeA);
    });

    return list;
  }, [filteredVentes, orphanPrestations, filteredDepenses, todayStr, resolveStaffMember, resolveClientName, typesPrestations, t]);

  // Filtrage du journal par type et recherche
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      if (fluxFilter === 'entree' && entry.type !== 'entree') return false;
      if (fluxFilter === 'sortie' && entry.type !== 'sortie') return false;

      if (fluxSearch.trim()) {
        const query = fluxSearch.toLowerCase();
        const matchesDesc = entry.description.toLowerCase().includes(query);
        const matchesTitle = entry.titre.toLowerCase().includes(query);
        const matchesClient = entry.clientNom.toLowerCase().includes(query);
        const matchesEmp = entry.employeNom.toLowerCase().includes(query);
        const matchesBadge = (entry.itemsBadge || '').toLowerCase().includes(query);
        return matchesDesc || matchesTitle || matchesClient || matchesEmp || matchesBadge;
      }

      return true;
    });
  }, [journalEntries, fluxFilter, fluxSearch]);

  // Réinitialiser la pagination lors d'un changement de filtre ou recherche
  useEffect(() => {
    setJournalPage(1);
  }, [fluxFilter, fluxSearch]);

  const totalJournalPages = Math.max(1, Math.ceil(filteredJournalEntries.length / journalPageSize));
  const paginatedJournalEntries = useMemo(() => {
    const start = (journalPage - 1) * journalPageSize;
    return filteredJournalEntries.slice(start, start + journalPageSize);
  }, [filteredJournalEntries, journalPage, journalPageSize]);

  const totalJournalEntrees = useMemo(() =>
    journalEntries.filter(e => e.type === 'entree').reduce((s, e) => s + e.montant, 0),
    [journalEntries]
  );
  const totalJournalSorties = useMemo(() =>
    journalEntries.filter(e => e.type === 'sortie').reduce((s, e) => s + e.montant, 0),
    [journalEntries]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PALMARÈS PRESTATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const topPrestations = useMemo(() => {
    const counts: Record<string, { nom: string; count: number; montant: number }> = {};

    filteredVentes.forEach(v => {
      (v.items || []).filter(i => i.type === 'prestation').forEach(item => {
        const key = item.referenceId || item.nom;
        if (!counts[key]) counts[key] = { nom: item.nom, count: 0, montant: 0 };
        counts[key].count += item.quantite || 1;
        counts[key].montant += item.montant || 0;
      });
    });

    orphanPrestations.forEach(p => {
      const typePresta = typesPrestations.find(t => t.id === p.typePrestationId || (t as any)._id === p.typePrestationId);
      const nom = typePresta ? typePresta.nom : t('bilan.careService') || 'Prestation';
      const key = p.typePrestationId || nom;
      if (!counts[key]) counts[key] = { nom, count: 0, montant: 0 };
      counts[key].count += 1;
      counts[key].montant += p.montant || 0;
    });

    return Object.values(counts).sort((a, b) => b.montant - a.montant);
  }, [filteredVentes, orphanPrestations, typesPrestations, t]);

  const maxPrestationCount = topPrestations.length > 0 ? Math.max(...topPrestations.map(p => p.count)) : 1;

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TOP PRODUITS VENDUS
  // ─────────────────────────────────────────────────────────────────────────────
  const topProduitsVendus = useMemo(() => {
    const map: Record<string, { id: string; nom: string; quantite: number; montant: number; stockRestant?: number; seuil?: number }> = {};

    filteredVentes.forEach(v => {
      (v.items || []).filter(i => i.type === 'produit').forEach(item => {
        const key = item.referenceId || item.nom;
        if (!map[key]) {
          const matchedProd = produits.find(p => p.id === item.referenceId || (p as any)._id === item.referenceId || p.nom.toLowerCase() === item.nom.toLowerCase());
          map[key] = {
            id: key,
            nom: item.nom,
            quantite: 0,
            montant: 0,
            stockRestant: matchedProd?.quantite,
            seuil: matchedProd?.seuilAlerte,
          };
        }
        map[key].quantite += item.quantite || 1;
        map[key].montant += item.montant || 0;
      });
    });

    return Object.values(map).sort((a, b) => b.montant - a.montant);
  }, [filteredVentes, produits]);

  const maxProductQty = topProduitsVendus.length > 0 ? Math.max(...topProduitsVendus.map(p => p.quantite)) : 1;

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. MODES DE PAIEMENT & DÉPENSES
  // ─────────────────────────────────────────────────────────────────────────────
  const parMode = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredVentes.forEach(v => {
      const mode = v.modePaiement || 'especes';
      acc[mode] = (acc[mode] || 0) + (v.totalMontant || 0);
    });
    if (orphanRevenus > 0) {
      acc['especes'] = (acc['especes'] || 0) + orphanRevenus;
    }
    return acc;
  }, [filteredVentes, orphanRevenus]);

  const modeLabels: Record<string, { label: string; icon: any; color: string }> = {
    especes: { label: t('bilan.methodCash') || 'Espèces (Caisse)', icon: Wallet, color: 'text-emerald-500' },
    mobile_money: { label: t('bilan.methodMobileMoney') || 'Mobile Money (Orange/MTN/Wave)', icon: CreditCard, color: 'text-amber-500' },
    carte: { label: t('bilan.methodCard') || 'Carte Bancaire', icon: CreditCard, color: 'text-blue-500' },
    mixte: { label: t('bilan.methodMixed') || 'Paiement Mixte', icon: PieChart, color: 'text-purple-500' }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. EXPORT PDF PROFESSIONNEL
  // ─────────────────────────────────────────────────────────────────────────────
  const exportBilanPDF = () => {
    const salonNom = salon?.name || 'BeautyFlow';
    const printDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${t('bilan.title')} — ${periodLabel} — ${salonNom}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 960px; margin: auto; }
    .header { border-bottom: 3px solid #e11d48; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 24px; font-weight: 900; color: #e11d48; margin: 0; }
    .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #ffe4e6; color: #e11d48; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background: #f8fafc; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .kpi-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; }
    .pos { color: #16a34a !important; }
    .neg { color: #dc2626 !important; }
    h2 { font-size: 16px; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 24px 0 10px 0; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 700; color: #475569; border: 1px solid #e2e8f0; }
    td { padding: 8px 10px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">📊 ${t('bilan.pdfTitle')}</h1>
      <p class="subtitle">${salonNom} • ${t('bilan.periods.customLabel') || 'Période'} : <strong>${periodLabel}</strong></p>
    </div>
    <div style="text-align: right;">
      <span class="badge">${t('bilan.pdfGeneratedOn')} ${printDate}</span>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-lbl">${t('bilan.totalInflows')}</div>
      <div class="kpi-val pos">${formatCurrency(totalRevenus)}</div>
      <small style="font-size:10px;color:#64748b;">${totalPrestationsCount} ${t('bilan.servicesWord')} • ${totalProduitsVendusCount} ${t('bilan.productsWord')}</small>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">${t('bilan.totalOutflows')}</div>
      <div class="kpi-val neg">${formatCurrency(totalDepensesVal)}</div>
      <small style="font-size:10px;color:#64748b;">${filteredDepenses.length} ${t('bilan.operationsWord')}</small>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">${t('bilan.netProfit')}</div>
      <div class="kpi-val ${benefice >= 0 ? 'pos' : 'neg'}">${formatCurrency(benefice)}</div>
      <small style="font-size:10px;color:#64748b;">${t('bilan.netMarginLabel')} : ${margePct}%</small>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">${t('bilan.clientsReceived')}</div>
      <div class="kpi-val">${totalClientsVisites}</div>
      <small style="font-size:10px;color:#64748b;">${t('bilan.averageBasketLabel')} : ${formatCurrency(panierMoyenGlobal)}</small>
    </div>
  </div>

  <h2>👩‍💼 ${t('bilan.teamPerformanceTitle')}</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">${t('bilan.rankCol')}</th>
        <th>${t('bilan.collabCol')}</th>
        <th>${t('bilan.roleCol')}</th>
        <th style="text-align: right;">${t('bilan.totalCaCol')}</th>
        <th style="text-align: right;">${t('bilan.careCaCol')}</th>
        <th style="text-align: right;">${t('bilan.prodCaCol')}</th>
        <th style="text-align: right;">${t('bilan.clientsServedCol')}</th>
        <th style="text-align: right;">${t('bilan.avgBasketCol')}</th>
        <th style="text-align: right;">${t('bilan.contributionCol')}</th>
      </tr>
    </thead>
    <tbody>
      ${detailedTopEmployes.map((e, idx) => `
        <tr>
          <td style="font-weight: 800; text-align: center;">#${idx + 1}</td>
          <td><strong>${e.nom}</strong></td>
          <td>${e.role}</td>
          <td style="text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(e.caTotal)}</td>
          <td style="text-align: right;">${e.nbPrestations} (${formatCurrency(e.caSoins)})</td>
          <td style="text-align: right;">${e.nbProduits} (${formatCurrency(e.caProduits)})</td>
          <td style="text-align: right;">${e.nbClientsTotal}</td>
          <td style="text-align: right;">${formatCurrency(e.panierMoyen)}</td>
          <td style="text-align: right; font-weight: bold;">${e.partDuCA}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>📑 ${t('bilan.journalTitle')}</h2>
  <table>
    <thead>
      <tr>
        <th>${t('bilan.dateTime')}</th>
        <th>${t('bilan.flowType')}</th>
        <th>${t('bilan.descDetails')}</th>
        <th>${t('bilan.clientCol')}</th>
        <th>${t('bilan.staffCol')}</th>
        <th>${t('bilan.paymentCol')}</th>
        <th style="text-align: right;">${t('bilan.amountCol')}</th>
      </tr>
    </thead>
    <tbody>
      ${journalEntries.slice(0, 50).map(j => `
        <tr>
          <td>${j.date} ${j.time}</td>
          <td><span style="font-weight: bold; color: ${j.type === 'entree' ? '#16a34a' : '#dc2626'};">${j.type === 'entree' ? t('bilan.inflowBadge') : t('bilan.outflowBadge')}</span></td>
          <td><strong>${j.titre}</strong><br><small style="color: #64748b;">${j.description}</small></td>
          <td>${j.clientNom}</td>
          <td>${j.employeNom}</td>
          <td>${j.modePaiement}</td>
          <td style="text-align: right; font-weight: 800; color: ${j.type === 'entree' ? '#16a34a' : '#dc2626'};">${j.type === 'entree' ? '+' : '-'}${formatCurrency(j.montant)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>🏆 ${t('bilan.topPrestationsTab')} & ${t('bilan.productsTab')}</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
    <div>
      <h3 style="font-size: 13px; color: #334155;">${t('bilan.topPrestationsTab')}</h3>
      <table>
        <tr><th>${t('bilan.servicesWord')}</th><th style="text-align: right;">Nb</th><th style="text-align: right;">CA</th></tr>
        ${topPrestations.slice(0, 5).map(p => `<tr><td>${p.nom}</td><td style="text-align: right;">${p.count}</td><td style="text-align: right; font-weight: bold;">${formatCurrency(p.montant)}</td></tr>`).join('')}
      </table>
    </div>
    <div>
      <h3 style="font-size: 13px; color: #334155;">${t('bilan.productsTab')}</h3>
      <table>
        <tr><th>${t('bilan.productsWord')}</th><th style="text-align: right;">${t('bilan.unitsSoldLabel')}</th><th style="text-align: right;">CA</th></tr>
        ${topProduitsVendus.slice(0, 5).map(p => `<tr><td>${p.nom}</td><td style="text-align: right;">${p.quantite}</td><td style="text-align: right; font-weight: bold;">${formatCurrency(p.montant)}</td></tr>`).join('')}
      </table>
    </div>
  </div>

  <div class="footer">
    ${t('bilan.pdfConfidential')} • ${salonNom}
  </div>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-background min-h-screen">
      {/* ── TOP HEADER EXECUTIVE ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/50 border border-muted/60 p-6 rounded-3xl shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 rotate-2 transition-transform hover:rotate-0 duration-300 shrink-0">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {t('bilan.title')}
              </h1>
              <Badge variant="outline" className="font-extrabold text-xs uppercase bg-primary/10 text-primary border-primary/20">
                {t('bilan.bossMode')}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-xs px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1",
                  plan.name === 'premium'
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : plan.name === 'pro'
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground border-border"
                )}
              >
                {plan.name === 'premium' && <Crown className="h-3 w-3 text-amber-500" />}
                {plan.name === 'pro' && <Sparkles className="h-3 w-3 text-primary" />}
                Plan {plan.label || (plan.name.charAt(0).toUpperCase() + plan.name.slice(1))}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1 text-sm">
              <Activity className="h-4 w-4 text-primary" /> {t('bilan.subtitle')} • {periodLabel}
            </p>
          </div>
        </div>

        {/* Boutons d'actions & Périodes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Sélecteur de période */}
          <div className="bg-muted/60 p-1 rounded-2xl grid grid-cols-3 sm:flex shadow-inner w-full sm:w-auto">
            <Button
              variant={period === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('day')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'day' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.dayLabel')}
            </Button>
            <Button
              variant={period === 'yesterday' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('yesterday')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'yesterday' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.yesterday')}
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('week')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'week' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.week')}
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('month')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'month' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.month')}
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('year')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'year' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.year')}
            </Button>
            <Button
              variant={period === 'custom' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('custom')}
              className={cn(
                "rounded-xl font-bold px-3 transition-all duration-300 text-xs sm:text-sm",
                period === 'custom' ? "gradient-primary shadow-md text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('bilan.periods.custom')}
            </Button>
          </div>

          {/* Actualiser & Export */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/20 hover:bg-primary/5 font-bold shadow-sm h-10 px-3"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={t('bilan.refresh')}
            >
              <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-primary/20 hover:bg-primary/5 font-bold shadow-sm h-10"
              onClick={exportBilanPDF}
            >
              <Download className="h-4 w-4 mr-2 text-primary" /> {t('bilan.export')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── SÉLECTEUR DE DATE PRÉCISE SI NÉCESSAIRE ────────────────────── */}
      {(period === 'day' || period === 'custom') && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/40 border border-muted/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {period === 'day' ? t('bilan.selectDay') : t('bilan.selectRange')}
            </span>
          </div>

          {period === 'day' ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customDay}
                max={todayStr}
                onChange={(e) => setCustomDay(e.target.value)}
                className="w-44 font-bold bg-background rounded-xl border-primary/30"
              />
              {customDay !== todayStr && (
                <Button variant="ghost" size="sm" onClick={() => setCustomDay(todayStr)} className="text-xs font-bold text-primary">
                  {t('bilan.backToToday')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customRange.start}
                max={customRange.end || todayStr}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-40 font-bold bg-background rounded-xl"
              />
              <span className="text-xs font-bold text-muted-foreground">{t('bilan.to')}</span>
              <Input
                type="date"
                value={customRange.end}
                min={customRange.start}
                max={todayStr}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-40 font-bold bg-background rounded-xl"
              />
            </div>
          )}
        </div>
      )}

      {/* ── KPIS FINANCIERS PRINCIPAUX ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {t('bilan.overview')} — {periodLabel}
            </h2>
          </div>
          <Badge variant="outline" className="font-bold text-xs bg-muted/40">
            {filteredVentes.length} {t('bilan.productsWord')} • {filteredDepenses.length} {t('bilan.expenses')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title={t('bilan.totalInflows')}
            value={formatCurrency(totalRevenus)}
            icon={ArrowUpRight}
            type="success"
            trend="up"
            sub={
              <div className="flex flex-col gap-1">
                <span className="text-emerald-600 font-bold">
                  {formatCurrency(revenusPrestations)} {t('bilan.servicesWord')} • {formatCurrency(revenusProduits)} {t('bilan.productsWord')}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {totalPrestationsCount} {t('bilan.careServicesActs')} • {totalProduitsVendusCount} {t('bilan.productsSold')}
                </span>
              </div>
            }
          />

          <StatCard
            title={t('bilan.totalOutflows')}
            value={formatCurrency(totalDepensesVal)}
            icon={ArrowDownRight}
            type="danger"
            trend="down"
            sub={
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                  {filteredDepenses.length} {t('bilan.operationsWord')}
                </Badge>
                <span>{t('bilan.operatingCosts')}</span>
              </div>
            }
          />

          <StatCard
            title={t('bilan.netProfit')}
            value={formatCurrency(benefice)}
            icon={DollarSign}
            type={benefice >= 0 ? 'default' : 'danger'}
            trend={benefice >= 0 ? 'up' : 'down'}
            sub={
              <div className="flex items-center justify-between">
                <span className={cn("font-black", benefice >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {t('bilan.netMarginLabel')} : {margePct}%
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {benefice >= 0 ? t('bilan.positiveBalance') : t('bilan.deficitBalance')}
                </span>
              </div>
            }
          />

          <StatCard
            title={t('bilan.clientsReceived')}
            value={String(totalClientsVisites)}
            icon={Users}
            type="info"
            sub={
              <div className="flex flex-col gap-1">
                <span className="text-blue-600 font-bold">
                  {t('bilan.averageBasketLabel')} : {formatCurrency(panierMoyenGlobal)}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {clientsRecus} {t('bilan.identifiedClients')} • {ventesAnonymous} {t('bilan.walkInSales')}
                </span>
              </div>
            }
          />
        </div>

        {/* ── KPIS SECONDAIRES ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title={t('bilan.revenuePrestations')}
            value={formatCurrency(revenusPrestations)}
            icon={Scissors}
            type="default"
            sub={<span>{totalPrestationsCount} {t('bilan.servicesExecuted')}</span>}
          />
          <StatCard
            title={t('bilan.revenueProducts')}
            value={formatCurrency(revenusProduits)}
            icon={Package}
            type="warning"
            sub={<span>{totalProduitsVendusCount} {t('bilan.unitsSoldLabel')}</span>}
          />
          <StatCard
            title={t('bilan.appointments')}
            value={String(rdvTotal)}
            icon={CalendarDays}
            type="info"
            sub={
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-bold">{rdvConfirmes} {t('bilan.confirmedLabel')}</span>
                <span className="text-rose-600 font-bold">{rdvAnnules} {t('bilan.cancelledLabel')}</span>
              </div>
            }
          />
          <StatCard
            title={t('bilan.newClients')}
            value={String(newClients)}
            icon={UserCheck}
            type="success"
            sub={<span className="text-muted-foreground">{t('bilan.registeredInPeriod')}</span>}
          />
        </div>
      </div>

      {/* ── ONGLETS D'ANALYSE APPROFONDIE ──────────────────────────────── */}
      <Card className="border-muted/60 shadow-xl bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden mt-8">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          {/* Navigation des onglets */}
          <div className="border-b border-border/50 bg-muted/20 px-4 sm:px-6 py-4 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-background/80 backdrop-blur-md border shadow-sm p-1 rounded-2xl inline-flex w-max">
              <TabsTrigger
                value="journal"
                className="rounded-xl px-5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                {t('bilan.journalTab')}
              </TabsTrigger>
              <TabsTrigger
                value="employes"
                className="rounded-xl px-5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
              >
                <Crown className="h-4 w-4 text-amber-500" />
                {t('bilan.topStaffTab')}
              </TabsTrigger>
              <TabsTrigger
                value="prestations"
                className="rounded-xl px-5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
              >
                <Scissors className="h-4 w-4" />
                {t('bilan.topPrestationsTab')}
              </TabsTrigger>
              <TabsTrigger
                value="produits"
                className="rounded-xl px-5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                {t('bilan.productsTab')}
              </TabsTrigger>
              <TabsTrigger
                value="finances"
                className="rounded-xl px-5 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                {t('bilan.treasuryTab')}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 1: JOURNAL DES FLUX (Entrées / Sorties)
            ═══════════════════════════════════════════════════════════════ */}
            <TabsContent value="journal" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    {t('bilan.journalTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t('bilan.journalSubtitle')} <strong>{periodLabel}</strong>
                  </p>
                </div>

                {/* Filtres Rapides Journal */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-muted/50 p-1 rounded-xl flex items-center shadow-inner">
                    <Button
                      variant={fluxFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFluxFilter('all')}
                      className={cn("rounded-lg text-xs font-bold h-8", fluxFilter === 'all' && "gradient-primary text-white shadow-sm")}
                    >
                      {t('bilan.filterAll')} ({journalEntries.length})
                    </Button>
                    <Button
                      variant={fluxFilter === 'entree' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFluxFilter('entree')}
                      className={cn("rounded-lg text-xs font-bold h-8 text-emerald-600", fluxFilter === 'entree' && "bg-emerald-600 text-white shadow-sm")}
                    >
                      {t('bilan.filterIn')}
                    </Button>
                    <Button
                      variant={fluxFilter === 'sortie' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFluxFilter('sortie')}
                      className={cn("rounded-lg text-xs font-bold h-8 text-rose-600", fluxFilter === 'sortie' && "bg-rose-600 text-white shadow-sm")}
                    >
                      {t('bilan.filterOut')}
                    </Button>
                  </div>

                  {/* Recherche */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('bilan.searchFlux')}
                      value={fluxSearch}
                      onChange={(e) => setFluxSearch(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Barre de synthèse du journal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/30 border border-muted/60">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 shadow-sm border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">{t('bilan.totalCashIn')}</p>
                      <p className="text-lg font-black text-emerald-600">+{formatCurrency(totalJournalEntrees)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    {journalEntries.filter(e => e.type === 'entree').length} {t('bilan.flowsCount')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 shadow-sm border border-rose-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                      <ArrowDownRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">{t('bilan.totalExpensesOut')}</p>
                      <p className="text-lg font-black text-rose-600">-{formatCurrency(totalJournalSorties)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                    {journalEntries.filter(e => e.type === 'sortie').length} {t('bilan.flowsCount')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 shadow-sm border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">{t('bilan.netPeriodBalance')}</p>
                      <p className={cn("text-lg font-black", benefice >= 0 ? "text-primary" : "text-rose-600")}>
                        {formatCurrency(benefice)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold">
                    {t('bilan.marginBadge')} {margePct}%
                  </Badge>
                </div>
              </div>

              {/* Tableau des flux */}
              {filteredJournalEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50 bg-muted/10 rounded-2xl border border-dashed">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-base font-bold text-foreground">{t('bilan.noFlows')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('bilan.noFlowsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* VUE MOBILE (< md) : Cartes tactiles 100% lisibles, ZERO scroll horizontal */}
                  <div className="block md:hidden space-y-3">
                    {paginatedJournalEntries.map((entry) => (
                      <div key={entry.id} className="p-4 rounded-2xl border border-muted/60 bg-card/80 backdrop-blur-sm shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{formatDate(entry.date)} à {entry.time}</span>
                          </div>
                          {entry.type === 'entree' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px] gap-1">
                              <ArrowUpRight className="h-3 w-3" /> {t('bilan.inflowBadge')}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] gap-1">
                              <ArrowDownRight className="h-3 w-3" /> {t('bilan.outflowBadge')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{entry.titre}</span>
                              {entry.itemsBadge && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold shrink-0">
                                  {entry.itemsBadge}
                                </Badge>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{entry.description}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={cn("text-base font-black tracking-tight", entry.type === 'entree' ? 'text-emerald-600' : 'text-rose-600')}>
                              {entry.type === 'entree' ? '+' : '-'}{formatCurrency(entry.montant)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                            <span className="font-semibold text-foreground truncate">{entry.clientNom}</span>
                            <span>•</span>
                            <span className="font-medium truncate">{entry.employeNom}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize bg-muted/40 font-medium shrink-0">
                            {entry.modePaiement.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* VUE DESKTOP & TABLETTE (hidden md:block) : 100% Adaptée, ZERO Scroll Horizontal */}
                  <div className="hidden md:block rounded-2xl border border-muted/60 overflow-hidden bg-background/60 shadow-sm">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                      <thead className="bg-muted/40 text-[11px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="py-3 px-3.5 w-[18%]">{t('bilan.dateTime')}</th>
                          <th className="py-3 px-3 w-[16%]">{t('bilan.flowType')} & {t('bilan.paymentCol')}</th>
                          <th className="py-3 px-3 w-[44%]">{t('bilan.descDetails')} & Intervenants</th>
                          <th className="py-3 px-3.5 w-[22%] text-right">{t('bilan.amountCol')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {paginatedJournalEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                            {/* 1. Date & Heure */}
                            <td className="py-3.5 px-3.5 align-top">
                              <div className="font-bold text-foreground text-xs">{formatDate(entry.date)}</div>
                              <div className="text-[11px] flex items-center gap-1 text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3 shrink-0 text-muted-foreground" /> {entry.time}
                              </div>
                            </td>

                            {/* 2. Type & Règlement */}
                            <td className="py-3.5 px-3 align-top space-y-1">
                              <div>
                                {entry.type === 'entree' ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[11px] gap-1">
                                    <ArrowUpRight className="h-3 w-3" /> {t('bilan.inflowBadge')}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-[11px] gap-1">
                                    <ArrowDownRight className="h-3 w-3" /> {t('bilan.outflowBadge')}
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <Badge variant="outline" className="text-[10px] capitalize bg-muted/30 text-muted-foreground font-medium">
                                  {entry.modePaiement.replace('_', ' ')}
                                </Badge>
                              </div>
                            </td>

                            {/* 3. Détails & Intervenants (Client & Staff) */}
                            <td className="py-3.5 px-3 align-top">
                              <div className="space-y-1">
                                <div className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                                  <span className="truncate max-w-[280px]">{entry.titre}</span>
                                  {entry.itemsBadge && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold shrink-0">
                                      {entry.itemsBadge}
                                    </Badge>
                                  )}
                                </div>
                                {entry.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{entry.description}</p>
                                )}
                                <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                    <span className="text-muted-foreground font-normal">Client:</span> {entry.clientNom}
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="text-muted-foreground font-normal">Staff:</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/20">
                                      {entry.employeNom}
                                    </Badge>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Montant */}
                            <td className="py-3.5 px-3.5 text-right align-top">
                              <div className={cn("text-base lg:text-lg font-black tracking-tight", entry.type === 'entree' ? 'text-emerald-600' : 'text-rose-600')}>
                                {entry.type === 'entree' ? '+' : '-'}{formatCurrency(entry.montant)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Contrôles de pagination */}
                  {totalJournalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                      <p className="font-medium text-center sm:text-left">
                        Affichage de <span className="font-bold text-foreground">{(journalPage - 1) * journalPageSize + 1}</span> à <span className="font-bold text-foreground">{Math.min(journalPage * journalPageSize, filteredJournalEntries.length)}</span> sur <span className="font-bold text-foreground">{filteredJournalEntries.length}</span> opérations
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={journalPage <= 1}
                          onClick={() => setJournalPage(p => Math.max(1, p - 1))}
                          className="h-8 px-3 rounded-xl gap-1 text-xs font-semibold"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Précédent</span>
                        </Button>
                        <span className="font-bold text-foreground px-2">
                          {journalPage} / {totalJournalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={journalPage >= totalJournalPages}
                          onClick={() => setJournalPage(p => Math.min(totalJournalPages, p + 1))}
                          className="h-8 px-3 rounded-xl gap-1 text-xs font-semibold"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 2: TOP EMPLOYÉS (Classement & Performance Détaillée)
            ═══════════════════════════════════════════════════════════════ */}
            <TabsContent value="employes" className="m-0 space-y-8 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Crown className="h-6 w-6 text-amber-500" />
                    {t('bilan.teamPerformanceTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t('bilan.teamPerformanceSubtitle')}
                  </p>
                </div>

                {/* Sélecteur de tri */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-bold text-muted-foreground hidden sm:inline">{t('bilan.sortByLabel')}</span>
                  <Select value={staffSort} onValueChange={(v: any) => setStaffSort(v)}>
                    <SelectTrigger className="w-52 h-9 rounded-xl font-bold bg-background text-xs">
                      <SelectValue placeholder={t('bilan.sortPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca" className="text-xs font-bold">{t('bilan.sortCA')}</SelectItem>
                      <SelectItem value="prestations" className="text-xs font-bold">{t('bilan.sortPrestations')}</SelectItem>
                      <SelectItem value="produits" className="text-xs font-bold">{t('bilan.sortProducts')}</SelectItem>
                      <SelectItem value="clients" className="text-xs font-bold">{t('bilan.sortClients')}</SelectItem>
                      <SelectItem value="panier" className="text-xs font-bold">{t('bilan.sortBasket')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {detailedTopEmployes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50 bg-muted/10 rounded-2xl border border-dashed">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-bold">{t('bilan.noStaffData')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('bilan.noStaffDesc')}</p>
                </div>
              ) : (
                <>
                  {/* PODIUM TOP 3 HIGHLIGHT */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {detailedTopEmployes.slice(0, 3).map((emp, index) => {
                      const isFirst = index === 0;
                      const isSecond = index === 1;
                      const isThird = index === 2;

                      const rankBadges = [
                        { color: 'from-amber-400 to-amber-600 text-amber-950', ring: 'ring-amber-400/40', border: 'border-amber-400/40', title: t('bilan.firstPlace') },
                        { color: 'from-slate-300 to-slate-400 text-slate-900', ring: 'ring-slate-300/40', border: 'border-slate-300/40', title: t('bilan.secondPlace') },
                        { color: 'from-amber-600 to-orange-700 text-amber-100', ring: 'ring-orange-500/40', border: 'border-orange-500/40', title: t('bilan.thirdPlace') },
                      ];
                      const badgeConf = rankBadges[index];

                      return (
                        <Card
                          key={emp.id}
                          className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-2xl border bg-card/60 backdrop-blur-xl group",
                            badgeConf.border,
                            isFirst && "md:-translate-y-2 ring-2 ring-primary/20 shadow-lg"
                          )}
                        >
                          <div className={cn("h-2 w-full bg-gradient-to-r", badgeConf.color)} />

                          <CardContent className="p-6 relative z-10 space-y-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn("relative h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ring-4 group-hover:scale-105 transition-transform", badgeConf.ring, isFirst ? "gradient-primary text-white" : "bg-muted text-foreground")}>
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.nom} className="h-full w-full object-cover rounded-2xl" />
                                  ) : (
                                    emp.nom.charAt(0).toUpperCase()
                                  )}
                                  <div className={cn("absolute -bottom-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shadow-md bg-gradient-to-r", badgeConf.color)}>
                                    #{index + 1}
                                  </div>
                                </div>

                                <div>
                                  <p className="font-black text-lg text-foreground group-hover:text-primary transition-colors">
                                    {emp.nom}
                                  </p>
                                  <p className="text-xs font-semibold text-muted-foreground">
                                    {emp.role}
                                  </p>
                                </div>
                              </div>

                              <Badge variant="outline" className={cn("text-[11px] font-black uppercase tracking-wider", badgeConf.border)}>
                                {badgeConf.title}
                              </Badge>
                            </div>

                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center shadow-inner">
                              <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t('bilan.generatedRevenue')}</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(emp.caTotal)}</span>
                              </div>
                              <Badge className="font-extrabold text-xs gradient-primary text-white">
                                {emp.partDuCA}% {t('bilan.ofTotal')}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-muted/40 border border-muted/60">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                                  <Scissors className="h-3.5 w-3.5 text-primary" /> {t('bilan.executedServices')}
                                </span>
                                <p className="text-sm font-black text-foreground mt-1">
                                  {emp.nbPrestations} <span className="text-[11px] text-muted-foreground font-medium">({formatCurrency(emp.caSoins)})</span>
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-muted/40 border border-muted/60">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5 text-amber-500" /> {t('bilan.soldProductsLabel')}
                                </span>
                                <p className="text-sm font-black text-foreground mt-1">
                                  {emp.nbProduits} <span className="text-[11px] text-muted-foreground font-medium">({formatCurrency(emp.caProduits)})</span>
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-muted/40 border border-muted/60">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-blue-500" /> {t('bilan.servedClientsLabel')}
                                </span>
                                <p className="text-sm font-black text-foreground mt-1">
                                  {emp.nbClientsTotal} <span className="text-[11px] text-muted-foreground font-medium">{t('bilan.visitsUnit')}</span>
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-muted/40 border border-muted/60">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                                  <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" /> {t('bilan.averageBasketLabel')}
                                </span>
                                <p className="text-sm font-black text-emerald-600 mt-1">
                                  {formatCurrency(emp.panierMoyen)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* TABLEAU RÉCAPITULATIF COMPLET DE TOUTE L'ÉQUIPE */}
                  <div className="space-y-3 mt-6">
                    <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Medal className="h-5 w-5 text-primary" />
                      {t('bilan.teamTableTitle')}
                    </h4>

                    <div className="space-y-4">
                      {/* VUE MOBILE (< md) : Cartes d'équipe ultra-claires, ZERO scroll horizontal */}
                      <div className="block md:hidden space-y-3">
                        {detailedTopEmployes.map((emp, idx) => (
                          <div key={emp.id} className="p-4 rounded-2xl border border-muted/60 bg-card/80 backdrop-blur-sm shadow-sm space-y-3">
                            {/* Header: Rank, Name, Role */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn(
                                  "inline-flex items-center justify-center h-8 w-8 rounded-xl text-xs font-black shadow-inner shrink-0",
                                  idx === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" :
                                  idx === 1 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                                  idx === 2 ? "bg-orange-100 text-orange-900 border border-orange-300" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-sm text-foreground truncate">{emp.nom}</h5>
                                  <p className="text-[11px] text-muted-foreground truncate">{emp.role}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-black text-primary">{formatCurrency(emp.caTotal)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground">{emp.partDuCA}% du CA</p>
                              </div>
                            </div>

                            {/* Barre de contribution */}
                            <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full gradient-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(emp.partDuCA, 100)}%` }} />
                            </div>

                            {/* Grille métriques */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded-xl border border-border/40">
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Soins ({emp.nbPrestations})</span>
                                <span className="font-bold text-foreground">{formatCurrency(emp.caSoins)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Produits ({emp.nbProduits})</span>
                                <span className="font-bold text-foreground">{formatCurrency(emp.caProduits)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Clientes Reçues</span>
                                <span className="font-bold text-foreground">{emp.nbClientsTotal} visites</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground block">Panier Moyen</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(emp.panierMoyen)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* VUE DESKTOP & TABLETTE (hidden md:block) : 4 Colonnes structurées, 100% Adaptée, ZERO Scroll */}
                      <div className="hidden md:block rounded-2xl border border-muted/60 overflow-hidden bg-background/60 shadow-sm">
                        <table className="w-full text-left text-sm border-collapse table-fixed">
                          <thead className="bg-muted/40 text-[11px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                            <tr>
                              <th className="py-3 px-3.5 w-[30%]">{t('bilan.collabCol')} & {t('bilan.roleCol')}</th>
                              <th className="py-3 px-3 w-[26%]">{t('bilan.totalCaCol')} & Répartition</th>
                              <th className="py-3 px-3 w-[20%]">Activité & Volumes</th>
                              <th className="py-3 px-3.5 w-[24%] text-right">{t('bilan.avgBasketCol')} & {t('bilan.contributionCol')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {detailedTopEmployes.map((emp, idx) => (
                              <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                                {/* 1. Collaborateur & Rôle */}
                                <td className="py-3.5 px-3.5 align-top">
                                  <div className="flex items-start gap-2.5">
                                    <div className={cn(
                                      "inline-flex items-center justify-center h-8 w-8 rounded-xl text-xs font-black shadow-inner shrink-0 mt-0.5",
                                      idx === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" :
                                      idx === 1 ? "bg-slate-200 text-slate-800 border border-slate-300" :
                                      idx === 2 ? "bg-orange-100 text-orange-900 border border-orange-300" :
                                      "bg-muted text-muted-foreground"
                                    )}>
                                      #{idx + 1}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                      <div className="font-extrabold text-sm text-foreground truncate">{emp.nom}</div>
                                      <div className="text-xs text-muted-foreground font-medium truncate">{emp.role}</div>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 bg-muted/20 text-muted-foreground font-semibold">
                                        {emp.nbClientsTotal} {t('bilan.clientsServedCol').toLowerCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Chiffre d'Affaires Total & Répartition */}
                                <td className="py-3.5 px-3 align-top space-y-1">
                                  <div className="font-black text-base lg:text-lg text-primary tracking-tight">
                                    {formatCurrency(emp.caTotal)}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                                    <div className="flex items-center justify-between pr-2">
                                      <span>{t('bilan.careCaCol')}:</span>
                                      <span className="font-bold text-foreground">{formatCurrency(emp.caSoins)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pr-2">
                                      <span>{t('bilan.prodCaCol')}:</span>
                                      <span className="font-bold text-foreground">{formatCurrency(emp.caProduits)}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Activité & Volumes */}
                                <td className="py-3.5 px-3 align-top space-y-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="secondary" className="font-bold text-xs gap-1">
                                      <Scissors className="w-3 h-3 text-primary" />
                                      {emp.nbPrestations} soins
                                    </Badge>
                                    {emp.nbProduits > 0 && (
                                      <Badge variant="outline" className="font-bold text-xs gap-1 border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                        <Package className="w-3 h-3 text-amber-500" />
                                        {emp.nbProduits} prods
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {emp.nbClientsTotal} client(e)s au total
                                  </p>
                                </td>

                                {/* 4. Panier Moyen & Part du CA */}
                                <td className="py-3.5 px-3.5 text-right align-top space-y-1">
                                  <div>
                                    <span className="text-xs text-muted-foreground font-semibold block">{t('bilan.avgBasketCol')}</span>
                                    <span className="font-black text-sm lg:text-base text-emerald-600">
                                      {formatCurrency(emp.panierMoyen)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <div className="w-16 h-2 bg-muted/60 rounded-full overflow-hidden shadow-inner">
                                      <div className="h-full gradient-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(emp.partDuCA, 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-foreground w-10 text-right">{emp.partDuCA}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 3: PALMARÈS PRESTATIONS
            ═══════════════════════════════════════════════════════════════ */}
            <TabsContent value="prestations" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-primary" />
                    {t('bilan.servicesTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t('bilan.servicesSubtitle')} <strong>{periodLabel}</strong>
                  </p>
                </div>
                <Badge variant="outline" className="font-bold">
                  {totalPrestationsCount} {t('bilan.totalServicesBadge')}
                </Badge>
              </div>

              {topPrestations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50 bg-muted/10 rounded-2xl border border-dashed">
                  <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-bold">{t('bilan.noServices')}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {topPrestations.map((p, i) => {
                    const percentOfRevenue = totalRevenus > 0 ? Math.round((p.montant / totalRevenus) * 100) : 0;
                    return (
                      <div
                        key={i}
                        className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-muted/60 bg-background/50 hover:bg-background transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-1/3">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn(
                              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-base font-black shadow-inner shrink-0",
                              i === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 font-black' :
                              i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black' :
                              i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-950 font-black' :
                              'bg-muted text-muted-foreground font-bold'
                            )}>
                              #{i + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">{p.nom}</p>
                              <span className="text-xs text-muted-foreground font-semibold">{percentOfRevenue}% {t('bilan.ofGlobalCA')}</span>
                            </div>
                          </div>
                          <div className="sm:hidden text-right shrink-0">
                            <p className="font-black text-base text-primary">{formatCurrency(p.montant)}</p>
                          </div>
                        </div>

                        <div className="flex-1 w-full flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                          <div className="flex-1 h-3 bg-muted/60 rounded-full overflow-hidden shadow-inner relative">
                            <div
                              className="absolute top-0 left-0 h-full gradient-primary rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${(p.count / maxPrestationCount) * 100}%` }}
                            />
                          </div>
                          <Badge variant="secondary" className="font-extrabold text-xs w-14 justify-center">
                            {p.count}x
                          </Badge>
                        </div>

                        <div className="hidden sm:block w-36 text-right">
                          <p className="font-black text-lg text-primary">{formatCurrency(p.montant)}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground">{t('bilan.avgShort')} {formatCurrency(Math.round(p.montant / p.count))}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 4: TOP PRODUITS VENDUS
            ═══════════════════════════════════════════════════════════════ */}
            <TabsContent value="produits" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-500" />
                    {t('bilan.productsTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t('bilan.productsSubtitle')}
                  </p>
                </div>
                <Badge variant="outline" className="font-bold text-amber-600 border-amber-300">
                  {totalProduitsVendusCount} {t('bilan.unitsSoldBadge')}
                </Badge>
              </div>

              {topProduitsVendus.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50 bg-muted/10 rounded-2xl border border-dashed">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-bold">{t('bilan.noProductsRecorded')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('bilan.noProductsDesc')}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {topProduitsVendus.map((prod, i) => (
                    <div
                      key={prod.id || i}
                      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-muted/60 bg-background/50 hover:bg-background transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-1/3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">{prod.nom}</p>
                            {prod.stockRestant !== undefined && (
                              <span className={cn(
                                "text-xs font-semibold",
                                prod.seuil && prod.stockRestant <= prod.seuil ? "text-rose-600 font-bold" : "text-muted-foreground"
                              )}>
                                {t('bilan.remainingStock')} : {prod.stockRestant} {prod.seuil && prod.stockRestant <= prod.seuil ? `⚠️ ${t('bilan.stockAlert')}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="sm:hidden text-right shrink-0">
                          <p className="font-black text-base text-primary">{formatCurrency(prod.montant)}</p>
                        </div>
                      </div>

                      <div className="flex-1 w-full flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                        <div className="flex-1 h-3 bg-muted/60 rounded-full overflow-hidden shadow-inner relative">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(prod.quantite / maxProductQty) * 100}%` }}
                          />
                        </div>
                        <Badge variant="outline" className="font-extrabold text-xs text-amber-600 border-amber-300 w-14 justify-center">
                          {prod.quantite}x
                        </Badge>
                      </div>

                      <div className="hidden sm:block w-36 text-right">
                        <p className="font-black text-lg text-primary">{formatCurrency(prod.montant)}</p>
                        <p className="text-[11px] font-semibold text-muted-foreground">{t('bilan.avgShort')} {formatCurrency(Math.round(prod.montant / prod.quantite))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════════════════════
                ONGLET 5: TRÉSORERIE & MOYENS DE RÈGLEMENT
            ═══════════════════════════════════════════════════════════════ */}
            <TabsContent value="finances" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Répartition par mode de paiement */}
                <Card className="border-muted/60 shadow-md bg-background/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      {t('bilan.byPaymentMethod')}
                    </CardTitle>
                    <CardDescription>
                      {t('bilan.paymentChannelsDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(parMode).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noTransactions')}</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(parMode)
                          .sort((a, b) => b[1] - a[1])
                          .map(([mode, montant]) => {
                            const conf = modeLabels[mode] || { label: mode, icon: CreditCard, color: 'text-muted-foreground' };
                            const IconComp = conf.icon;
                            const percent = totalRevenus > 0 ? Math.round((montant / totalRevenus) * 100) : 0;

                            return (
                              <div key={mode} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={cn("p-2.5 rounded-xl bg-background shadow-sm border", conf.color)}>
                                    <IconComp className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground text-sm">{conf.label}</p>
                                    <p className="text-xs font-semibold text-muted-foreground">{percent}% {t('bilan.pctOfTotalCollected')}</p>
                                  </div>
                                </div>
                                <span className="font-black text-base sm:text-lg text-foreground">{formatCurrency(montant)}</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dépenses par catégorie */}
                <Card className="border-muted/60 shadow-md bg-background/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-rose-500" />
                      {t('bilan.expensesByCategory')}
                    </CardTitle>
                    <CardDescription>
                      {t('bilan.expensesDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const cats: Record<string, number> = {};
                      filteredDepenses.forEach(d => {
                        cats[d.categorie] = (cats[d.categorie] || 0) + d.montant;
                      });
                      const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);

                      return sortedCats.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('bilan.noExpenses')}</p>
                      ) : (
                        <div className="space-y-4">
                          {sortedCats.map(([cat, montant]) => {
                            const percent = totalDepensesVal > 0 ? Math.round((montant / totalDepensesVal) * 100) : 0;
                            return (
                              <div key={cat} className="group p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                <div className="flex justify-between items-center mb-2">
                                  <Badge variant="outline" className="bg-background font-bold text-rose-600 border-rose-200 uppercase tracking-wider text-[11px]">
                                    {cat}
                                  </Badge>
                                  <span className="font-black text-rose-600">{formatCurrency(montant)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-rose-100 dark:bg-rose-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-rose-500/80 w-9 text-right">{percent}%</span>
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
