import React, { useMemo, useState, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Clock,
  User,
  Scissors,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CalendarCheck,
  Globe,
  Store,
  Coins,
  TrendingUp,
  Receipt,
  Search,
  Phone,
  Check,
  Loader2,
  UserPlus,
  MessageCircle,
  List,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useClients } from '@/hooks/useClients';
import { usePrestations } from '@/hooks/usePrestations';
import { useFinances } from '@/hooks/useFinances';
import { RendezVousForm, RdvFormData } from './RendezVousForm';
import { InvoiceGenerator } from '@/components/finances/InvoiceGenerator';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Vente } from '@/types';
import { getCategoryImage } from '@/lib/category-images';

export function CalendrierRendezVous() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddRdv, setShowAddRdv] = useState(false);
  const [prefilledTimeSlot, setPrefilledTimeSlot] = useState<string | undefined>(undefined);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);

  // Layout & View States
  const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('timeline');
  const [filterSource, setFilterSource] = useState<'all' | 'salon' | 'en_ligne'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingInvoiceVente, setPendingInvoiceVente] = useState<Vente | null>(null);

  const isMobile = useIsMobile();

  const { getRendezVousByDate, getDatesAvecRendezVous, addRendezVous, updateRendezVous, deleteRendezVous, loading } = useRendezVous();
  const { clients, getClient, addClient } = useClients();
  const { getTypePrestation } = usePrestations();
  const { addVenteAsync } = useFinances();
  const { t, language } = useLanguage();
  const { formatCurrency } = useTranslations();

  const currentLocale = language === 'fr' ? fr : enUS;

  // Date Navigation Controls
  const handlePrevDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(selectedDate);
    for (let i = -3; i <= 6; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const statutConfig: Record<string, { label: string; icon: any; className: string }> = useMemo(
    () => ({
      confirme: {
        label: t('appointments.status.confirme', 'Confirmé'),
        icon: CheckCircle2,
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      },
      en_attente: {
        label: t('appointments.status.en_attente', 'En attente'),
        icon: AlertCircle,
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      },
      annule: {
        label: t('appointments.status.annule', 'Annulé'),
        icon: XCircle,
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      },
      termine: {
        label: t('appointments.status.termine', 'Terminé'),
        icon: CheckCircle2,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      completed: {
        label: t('appointments.status.termine', 'Terminé'),
        icon: CheckCircle2,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      paid: {
        label: t('appointments.status.confirme', 'Payé'),
        icon: CheckCircle2,
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      },
    }),
    [t]
  );

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const rdvDuJour = getRendezVousByDate(dateStr);
  const datesAvecRdv = getDatesAvecRendezVous();

  const stats = useMemo(() => {
    const total = rdvDuJour.length;
    const online = rdvDuJour.filter((r) => r.source === 'en_ligne' || r.source === 'public').length;
    const completed = rdvDuJour.filter((r) => r.statut === 'termine' || (r.statut as string) === 'completed').length;
    const revenue = rdvDuJour.reduce((acc, rdv) => {
      if (rdv.statut === 'annule') return acc;
      const type = getTypePrestation(rdv.typePrestationId);
      return acc + (type?.prix || 0);
    }, 0);
    return { total, online, revenue, completed };
  }, [rdvDuJour, getTypePrestation]);

  const filteredRdv = useMemo(() => {
    return rdvDuJour.filter((r) => {
      const isOnline = r.source === 'en_ligne' || r.source === 'public';
      if (filterSource === 'salon' && isOnline) return false;
      if (filterSource === 'en_ligne' && !isOnline) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = getClient(r.clientId);
        const type = getTypePrestation(r.typePrestationId);
        const clientNom = (client?.nom || (r as any).customerName || '').toLowerCase();
        const clientTel = (client?.telephone || (r as any).customerPhone || '').toLowerCase();
        const typeNom = (type?.nom || '').toLowerCase();
        const employe = typeof r.employe === 'string' ? r.employe.toLowerCase() : '';
        return clientNom.includes(q) || clientTel.includes(q) || typeNom.includes(q) || employe.includes(q);
      }
      return true;
    });
  }, [rdvDuJour, filterSource, searchQuery, getClient, getTypePrestation]);

  // Hourly timeline slots generation (08:00 to 19:00)
  const hourlySlots = useMemo(() => {
    const hours = [];
    for (let h = 8; h <= 19; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }, []);

  // Map appointments to hourly slots
  const hourlyRdvMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    hourlySlots.forEach((slot) => (map[slot] = []));

    filteredRdv.forEach((rdv) => {
      const rdvHour = (rdv.heure || '09:00').substring(0, 2) + ':00';
      if (map[rdvHour]) {
        map[rdvHour].push(rdv);
      } else {
        if (!map['09:00']) map['09:00'] = [];
        map['09:00'].push(rdv);
      }
    });

    return map;
  }, [filteredRdv, hourlySlots]);

  // Check if client is saved in contacts
  const isClientSaved = useCallback(
    (rdv: any) => {
      if (rdv.clientId && getClient(rdv.clientId)) return true;
      const phone = (rdv as any).customerPhone || (rdv as any).client?.telephone;
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return clients.some((c) => c.telephone && c.telephone.replace(/\D/g, '') === cleanPhone);
      }
      return false;
    },
    [clients, getClient]
  );

  // Auto-register online customer to salon contacts
  const handleRegisterOnlineClient = async (rdv: any) => {
    const nom = (rdv as any).customerName || (rdv as any).client?.nom || t('appointments.online_client', 'Cliente En Ligne');
    const telephone = (rdv as any).customerPhone || (rdv as any).client?.telephone || '';

    if (!telephone && !nom) {
      toast({ title: 'Erreur', description: t('appointments.missing_info', 'Informations cliente manquantes'), variant: 'destructive' });
      return;
    }

    try {
      const newClient = await addClient({
        nom: nom,
        telephone: telephone || '00000000',
        statut: 'nouvelle',
      });

      const newClientId = newClient?.id || (newClient as any)?._id;
      if (newClientId) {
        updateRendezVous({ id: rdv.id, updates: { clientId: newClientId } });
      }

      toast({
        title: t('appointments.client_saved', 'Cliente enregistrée !'),
        description: `${nom} ${t('appointments.added_to_contacts', 'a été ajoutée à vos contacts avec succès.')}`,
      });
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement du client:', err);
      toast({ title: 'Erreur', description: err.message || 'Impossible d\'ajouter la cliente', variant: 'destructive' });
    }
  };

  // Direct WhatsApp message launcher
  const handleOpenWhatsApp = (rdv: any) => {
    const client = getClient(rdv.clientId);
    const phone = client?.telephone || (rdv as any).customerPhone || (rdv as any).client?.telephone;
    const name = client?.nom || (rdv as any).customerName || t('appointments.dear_client', 'Chère cliente');
    if (!phone) {
      toast({ title: 'Numéro introuvable', description: 'Aucun numéro de téléphone disponible.', variant: 'destructive' });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = `Bonjour ${name} 👋 Un rappel pour votre rendez-vous du ${format(selectedDate, 'dd/MM/yyyy')} à ${rdv.heure}. À très bientôt !`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleAddRdv = (data: RdvFormData) => {
    addRendezVous({
      clientId: data.clientId,
      typePrestationId: data.typePrestationId,
      date: data.date,
      heure: data.heure,
      duree: data.duree,
      employe: data.employe,
      notes: data.notes,
      source: data.source || 'salon',
      statut: 'en_attente',
    });
    setShowAddRdv(false);
    setPrefilledTimeSlot(undefined);
    toast({
      title: t('appointments.scheduled_toast', 'Rendez-vous planifié'),
      description: `RDV ${data.heure}`,
    });
  };

  const handleStatutChange = (id: string, statut: string) => {
    updateRendezVous({ id, updates: { statut: statut as any } });
    const label = statutConfig[statut]?.label || statut;
    toast({ title: (t('appointments.toast.updated', 'Statut mis à jour : {status}')).replace('{status}', label) });
  };

  const handleTerminer = async (rdv: any) => {
    updateRendezVous({ id: rdv.id, updates: { statut: 'termine' } });
    const label = statutConfig['termine']?.label || 'Terminé';
    toast({ title: (t('appointments.toast.updated', 'Statut mis à jour : {status}')).replace('{status}', label) });

    try {
      const prestation = getTypePrestation(rdv.typePrestationId);
      const prix = prestation?.prix || 0;
      const nomPrestation = prestation?.nom || t('finances.invoice.service', 'Prestation');

      const venteData: Omit<Vente, 'id'> = {
        date: rdv.date || new Date().toISOString().split('T')[0],
        clientId: rdv.clientId || undefined,
        employe: rdv.employe || undefined,
        modePaiement: 'especes',
        notes: t('appointments.autoInvoiceNote', 'RDV terminé') + ` à ${rdv.heure}`,
        totalMontant: prix,
        items: [
          {
            type: 'prestation',
            referenceId: rdv.typePrestationId || '',
            nom: nomPrestation,
            quantite: 1,
            prixUnitaire: prix,
            montant: prix,
          },
        ],
      };

      const createdVente = await addVenteAsync(venteData);
      setPendingInvoiceVente(createdVente || ({ ...venteData, id: `rdv-${rdv.id}` } as Vente));
    } catch (err) {
      console.error('Erreur lors de la création de la vente:', err);
      const prestation = getTypePrestation(rdv.typePrestationId);
      const prix = prestation?.prix || 0;
      setPendingInvoiceVente({
        id: `rdv-${rdv.id}`,
        date: rdv.date || new Date().toISOString().split('T')[0],
        clientId: rdv.clientId,
        modePaiement: 'especes',
        totalMontant: prix,
        items: [
          {
            type: 'prestation',
            referenceId: rdv.typePrestationId || '',
            nom: prestation?.nom || 'Prestation',
            quantite: 1,
            prixUnitaire: prix,
            montant: prix,
          },
        ],
      } as Vente);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('appointments.confirm_delete', 'Supprimer ce rendez-vous ?'))) {
      deleteRendezVous(id);
      toast({ title: t('appointments.deleted_toast', 'Rendez-vous supprimé') });
    }
  };

  const modifiers = {
    hasRdv: datesAvecRdv.map((d) => new Date(d + 'T00:00:00')),
  };

  const modifiersStyles = {
    hasRdv: {
      position: 'relative' as const,
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 lg:pb-4 max-w-full overflow-hidden font-sans">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-full">
        {/* Total Appts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('appointments.stats.total', 'Total RDV')}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total}
            </h3>
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-xs">
            <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        {/* Online Bookings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('appointments.stats.online', 'En ligne')}
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {stats.online}
              </h3>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                ({stats.total > 0 ? `${Math.round((stats.online / stats.total) * 100)}%` : '0%'})
              </span>
            </div>
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        {/* Estimated Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('appointments.stats.revenue', 'Revenu estimé')}
            </p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
              {formatCurrency(stats.revenue)}
            </h3>
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        {/* Completed Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {t('appointments.stats.completed', 'Honorés')}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.completed} <span className="text-xs font-bold text-slate-400">/ {stats.total}</span>
            </h3>
          </div>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {/* ── Main Schedule Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-full">
        {/* Left Column: Mini Calendar (Desktop) */}
        <Card className="hidden lg:block lg:col-span-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 sticky top-6">
          <CardHeader className="bg-slate-50 dark:bg-slate-950/60 py-4 px-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <CalendarIcon className="h-4 w-4 text-rose-500" />
                <span>{t('appointments.calendar', 'Calendrier')}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl h-7 px-3"
              >
                {t('appointments.today', "Aujourd'hui")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={currentLocale}
              className="pointer-events-auto w-full"
              modifiers={modifiers}
              modifiersClassNames={{ hasRdv: 'relative rdv-dot' }}
              modifiersStyles={modifiersStyles}
              classNames={{
                day_selected: 'bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold rounded-xl shadow-md',
                day_today: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black border border-rose-500/40 rounded-xl',
                day: 'h-9 w-9 p-0 font-bold hover:bg-rose-500/10 rounded-xl text-xs transition-colors',
                cell: 'h-9 w-9 text-center text-xs p-0 relative',
                head_cell: 'text-slate-400 w-9 font-extrabold text-[10px] uppercase tracking-wider',
              }}
            />
          </CardContent>
        </Card>

        {/* Right Column: Interactive Schedule Board */}
        <Card className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 min-h-[500px] flex flex-col max-w-full">
          {/* Header Controls */}
          <CardHeader className="py-4 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col gap-4 max-w-full backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full">
              {/* Date Nav Controls */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 shadow-2xs">
                  <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-700">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 text-xs font-black">
                    {t('appointments.today', "Aujourd'hui")}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-700">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black capitalize text-slate-900 dark:text-white leading-snug truncate">
                    {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: currentLocale })}
                  </h2>
                  <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 truncate">
                    {filteredRdv.length} {t('appointments.count_label', 'rendez-vous planifié(s)')}
                  </p>
                </div>
              </div>

              {/* View Switcher & Add Button */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('timeline')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5',
                      viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Planning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5',
                      viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    <List className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Liste</span>
                  </button>
                </div>

                <Button
                  onClick={() => {
                    setPrefilledTimeSlot(undefined);
                    setShowAddRdv(true);
                  }}
                  size="sm"
                  className="rounded-2xl h-9 px-4 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5 shrink-0" />
                  <span>{t('appointments.newRdv', 'Nouveau RDV')}</span>
                </Button>
              </div>
            </div>

            {/* Day Carousel Strip for Quick Navigation */}
            <div className="w-full overflow-hidden border-t border-slate-200/60 dark:border-slate-800 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
                {weekDays.map((day, idx) => {
                  const isSelected = format(day, 'yyyy-MM-dd') === dateStr;
                  const count = getRendezVousByDate(format(day, 'yyyy-MM-dd')).length;
                  const dayName = format(day, 'EEE', { locale: currentLocale });
                  const dayNum = format(day, 'dd');

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'flex flex-col items-center justify-center py-2 px-3 rounded-2xl min-w-[58px] cursor-pointer border text-xs snap-center transition-all relative',
                        isSelected
                          ? 'bg-gradient-to-br from-rose-600 to-purple-700 text-white font-black border-transparent shadow-md shadow-rose-600/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-rose-500/30'
                      )}
                    >
                      <span className="text-[10px] uppercase font-extrabold opacity-80">{dayName}</span>
                      <span className="text-sm font-black mt-0.5">{dayNum}</span>
                      {count > 0 && (
                        <span className={cn(
                          'mt-1 text-[10px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center',
                          isSelected ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 max-w-full overflow-hidden">
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto gap-1 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className={cn(
                    'flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0',
                    filterSource === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  Tous ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('salon')}
                  className={cn(
                    'flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shrink-0',
                    filterSource === 'salon' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  <Store className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>Salon ({stats.total - stats.online})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSource('en_ligne')}
                  className={cn(
                    'flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shrink-0',
                    filterSource === 'en_ligne' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>En ligne ({stats.online})</span>
                </button>
              </div>

              <div className="relative w-full sm:max-w-xs min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t('appointments.search_placeholder', 'Rechercher cliente, tél, prestation...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-xs font-bold focus:ring-rose-500/20 w-full"
                />
              </div>
            </div>
          </CardHeader>

          {/* Bounded Scrollable Container */}
          <CardContent className="p-4 sm:p-6 flex-1 max-h-[550px] overflow-y-auto space-y-3 scrollbar-thin max-w-full">
            {/* TIMELINE HOURLY VIEW */}
            {viewMode === 'timeline' && (
              <div className="space-y-3 max-w-full">
                {hourlySlots.map((slot) => {
                  const slotRdvs = hourlyRdvMap[slot] || [];

                  return (
                    <div key={slot} className="flex items-start gap-3 sm:gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 max-w-full">
                      {/* Hour Indicator */}
                      <div className="w-12 sm:w-14 pt-1 font-mono font-black text-xs text-slate-400 dark:text-slate-500 text-right shrink-0">
                        {slot}
                      </div>

                      {/* Slot Content */}
                      <div className="flex-1 min-w-0">
                        {slotRdvs.length > 0 ? (
                          <div className="space-y-2.5 max-w-full">
                            {slotRdvs.map((rdv) => {
                              const client = getClient(rdv.clientId);
                              const type = getTypePrestation(rdv.typePrestationId);
                              const isOnline = rdv.source === 'en_ligne' || rdv.source === 'public';
                              const isSaved = isClientSaved(rdv);
                              const config = statutConfig[rdv.statut] || statutConfig['en_attente'];
                              const StatutIcon = config.icon || AlertCircle;

                              const clientNameDisplay = client?.nom || (rdv as any).customerName || t('appointments.online_client', 'Cliente en ligne');
                              const clientPhoneDisplay = client?.telephone || (rdv as any).customerPhone || '';

                              return (
                                <div
                                  key={rdv.id}
                                  className={cn(
                                    'p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs max-w-full overflow-hidden',
                                    'border-l-4',
                                    rdv.statut === 'confirme'
                                      ? 'border-l-emerald-500'
                                      : rdv.statut === 'termine'
                                      ? 'border-l-blue-500'
                                      : rdv.statut === 'annule'
                                      ? 'border-l-rose-500 opacity-60'
                                      : 'border-l-amber-500'
                                  )}
                                >
                                  {/* Info row */}
                                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                      <img src={type?.imageUrl || getCategoryImage(type?.categorie)} alt="" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="min-w-0 flex-1 overflow-hidden">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                          {type?.nom || 'Prestation'}
                                        </span>
                                        {type?.prix !== undefined && (
                                          <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded-lg shrink-0">
                                            {formatCurrency(type.prix)}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-medium">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                                          <User className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                          <span className="truncate">{clientNameDisplay}</span>
                                        </span>

                                        {clientPhoneDisplay && (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenWhatsApp(rdv)}
                                            className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1 shrink-0"
                                          >
                                            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>WhatsApp</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Badges & Actions */}
                                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                                    {isOnline && (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shrink-0">
                                        <Globe className="h-3 w-3 mr-1 shrink-0 text-blue-500" />
                                        <span>En ligne</span>
                                      </Badge>
                                    )}

                                    <Badge variant="outline" className={cn('rounded-lg px-2.5 py-1 font-extrabold text-[10px] shrink-0', config.className)}>
                                      <StatutIcon className="h-3 w-3 mr-1 shrink-0" />
                                      <span>{config.label}</span>
                                    </Badge>

                                    {isOnline && !isSaved && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRegisterOnlineClient(rdv)}
                                        className="rounded-xl h-8 px-2.5 text-xs font-extrabold border-blue-500/30 text-blue-600 hover:bg-blue-500/10 shrink-0"
                                      >
                                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Contact
                                      </Button>
                                    )}

                                    {rdv.statut === 'en_attente' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatutChange(rdv.id, 'confirme')}
                                        className="rounded-xl h-8 px-2.5 text-xs font-extrabold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 shrink-0"
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1" /> Confirmer
                                      </Button>
                                    )}

                                    {(rdv.statut === 'confirme' || rdv.statut === 'en_attente') && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleTerminer(rdv)}
                                        className="rounded-xl h-8 px-3 text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 shrink-0"
                                      >
                                        <Receipt className="h-3.5 w-3.5 mr-1.5" /> Facture
                                      </Button>
                                    )}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0">
                                          <MoreVertical className="h-4 w-4 text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-bold">
                                        <DropdownMenuItem onClick={() => handleOpenWhatsApp(rdv)} className="font-bold text-emerald-600">
                                          <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                                        </DropdownMenuItem>
                                        {rdv.statut !== 'annule' && (
                                          <DropdownMenuItem onClick={() => handleStatutChange(rdv.id, 'annule')} className="font-bold text-rose-600">
                                            <XCircle className="h-4 w-4 mr-2" /> Annuler
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDelete(rdv.id)} className="font-bold text-destructive">
                                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Free Slot CTA */
                          <button
                            type="button"
                            onClick={() => {
                              setPrefilledTimeSlot(slot);
                              setShowAddRdv(true);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-xs group/btn"
                          >
                            <span className="font-extrabold flex items-center gap-2">
                              <Plus className="h-4 w-4 text-rose-500 opacity-70 group-hover/btn:scale-125 transition-transform" />
                              Disponible à {slot}
                            </span>
                            <span className="text-xs font-black opacity-0 group-hover/btn:opacity-100 transition-opacity text-rose-600">
                              + Réserver
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CARDS LIST VIEW */}
            {viewMode === 'cards' && filteredRdv.length > 0 && (
              <div className="space-y-3 max-w-full">
                {filteredRdv.map((rdv) => {
                  const client = getClient(rdv.clientId);
                  const type = getTypePrestation(rdv.typePrestationId);
                  const isOnline = rdv.source === 'en_ligne' || rdv.source === 'public';
                  const isSaved = isClientSaved(rdv);
                  const config = statutConfig[rdv.statut] || statutConfig['en_attente'];
                  const StatutIcon = config.icon || AlertCircle;

                  const clientNameDisplay = client?.nom || (rdv as any).customerName || t('appointments.online_client', 'Cliente en ligne');
                  const clientPhoneDisplay = client?.telephone || (rdv as any).customerPhone || '';

                  return (
                    <div
                      key={rdv.id}
                      className={cn(
                        'p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs max-w-full overflow-hidden',
                        'border-l-4',
                        rdv.statut === 'confirme'
                          ? 'border-l-emerald-500'
                          : rdv.statut === 'termine'
                          ? 'border-l-blue-500'
                          : rdv.statut === 'annule'
                          ? 'border-l-rose-500 opacity-60'
                          : 'border-l-amber-500'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        <div className="bg-gradient-to-br from-rose-600 to-purple-700 text-white rounded-xl px-3 py-1.5 text-center shrink-0 shadow-xs">
                          <span className="text-xs font-black tracking-tight">{rdv.heure}</span>
                        </div>

                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img src={type?.imageUrl || getCategoryImage(type?.categorie)} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">{type?.nom || 'Prestation'}</span>
                            {type?.prix !== undefined && (
                              <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded-lg shrink-0">
                                {formatCurrency(type.prix)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                              <User className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{clientNameDisplay}</span>
                            </span>

                            {clientPhoneDisplay && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(rdv)}
                                className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1 shrink-0"
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>WhatsApp</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800">
                        {isOnline && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shrink-0">
                            <Globe className="h-3 w-3 mr-1 shrink-0 text-blue-500" />
                            <span>En ligne</span>
                          </Badge>
                        )}

                        <Badge variant="outline" className={cn('rounded-lg px-2.5 py-1 font-extrabold text-[10px] shrink-0', config.className)}>
                          <StatutIcon className="h-3 w-3 mr-1 shrink-0" />
                          <span>{config.label}</span>
                        </Badge>

                        {(rdv.statut === 'confirme' || rdv.statut === 'en_attente') && (
                          <Button
                            size="sm"
                            onClick={() => handleTerminer(rdv)}
                            className="rounded-xl h-8 px-3 text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 shrink-0"
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1.5" /> Facture
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* EMPTY STATE */}
            {filteredRdv.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                  <CalendarIcon className="h-7 w-7" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {t('appointments.no_rdv_title', 'Aucun rendez-vous sur cette date')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">
                  {searchQuery
                    ? t('appointments.no_search_results', 'Aucun rendez-vous ne correspond à votre recherche.')
                    : t('appointments.no_rdv_desc', 'Cliquez ci-dessous pour ajouter un rendez-vous.')}
                </p>
                <Button
                  onClick={() => {
                    setPrefilledTimeSlot(undefined);
                    setShowAddRdv(true);
                  }}
                  size="sm"
                  className="mt-4 rounded-2xl h-9 px-5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t('appointments.newRdv', 'Nouveau RDV')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for Mobile */}
      <Button
        onClick={() => {
          setPrefilledTimeSlot(undefined);
          setShowAddRdv(true);
        }}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full gradient-primary shadow-xl flex items-center justify-center text-primary-foreground z-40 lg:hidden p-0"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Invoice Generator Modal */}
      {pendingInvoiceVente && (
        <InvoiceGenerator
          vente={pendingInvoiceVente}
          isOpen={true}
          onClose={() => setPendingInvoiceVente(null)}
        />
      )}

      {/* Add RDV Dialog / Drawer */}
      {isMobile ? (
        <Drawer open={showAddRdv} onOpenChange={setShowAddRdv}>
          <DrawerContent className="p-0 bg-background border-none rounded-t-[24px] overflow-hidden max-h-[92vh] outline-none">
            <div className="bg-primary p-5 text-primary-foreground relative overflow-hidden shrink-0">
              <DrawerHeader className="relative z-10 text-left p-0">
                <DrawerTitle className="text-lg font-bold tracking-tight">{t('appointments.newRdvTitle', 'Nouveau Rendez-vous')}</DrawerTitle>
                <p className="text-primary-foreground/80 font-medium text-xs capitalize mt-0.5">
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: currentLocale })}
                  {prefilledTimeSlot ? ` à ${prefilledTimeSlot}` : ''}
                </p>
              </DrawerHeader>
            </div>
            <div className="p-4 overflow-y-auto pb-8">
              <RendezVousForm
                defaultDate={dateStr}
                defaultHeure={prefilledTimeSlot}
                onSubmit={handleAddRdv}
                onCancel={() => setShowAddRdv(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showAddRdv} onOpenChange={setShowAddRdv}>
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[24px] border-none shadow-2xl bg-background/95 backdrop-blur-xl w-[95vw] sm:w-full">
            <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-xl font-bold tracking-tight">{t('appointments.newRdvTitle', 'Nouveau Rendez-vous')}</DialogTitle>
                <p className="text-primary-foreground/80 font-medium text-xs capitalize mt-0.5">
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: currentLocale })}
                  {prefilledTimeSlot ? ` à ${prefilledTimeSlot}` : ''}
                </p>
              </DialogHeader>
            </div>
            <div className="p-5 sm:p-6">
              <RendezVousForm
                defaultDate={dateStr}
                defaultHeure={prefilledTimeSlot}
                onSubmit={handleAddRdv}
                onCancel={() => setShowAddRdv(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Calendar Drawer */}
      <Drawer open={showMobileCalendar} onOpenChange={setShowMobileCalendar}>
        <DrawerContent className="p-4 bg-background border-none rounded-t-[24px] w-full max-h-[85vh] outline-none">
          <DrawerHeader className="pb-2 border-b border-border/40">
            <DrawerTitle className="text-base font-bold text-center">{t('appointments.calendar', 'Calendrier')}</DrawerTitle>
          </DrawerHeader>
          <div className="p-3 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowMobileCalendar(false);
                }
              }}
              locale={currentLocale}
              className="p-0 border-none justify-center w-full"
              modifiers={modifiers}
              modifiersClassNames={{ hasRdv: 'relative rdv-dot' }}
              modifiersStyles={modifiersStyles}
            />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="ghost" className="rounded-xl font-bold w-full h-10 text-xs">
                {t('appointments.btn.close', 'Fermer')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
