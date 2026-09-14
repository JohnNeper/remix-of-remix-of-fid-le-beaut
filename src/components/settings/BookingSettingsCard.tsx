import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  ExternalLink,
  Clock,
  Save,
  Check,
  Globe,
  Share2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  CalendarDays,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateSalonAccount, slugify, getSalonBySlug, getSalonAccounts } from '@/lib/auth';
import { getBookingPublicUrl } from '@/lib/booking';
import type { Salon, SalonBookingSettings, DateOverride } from '@/types';

const daysList = [
  { id: '1', defaultLabel: 'Lundi' },
  { id: '2', defaultLabel: 'Mardi' },
  { id: '3', defaultLabel: 'Mercredi' },
  { id: '4', defaultLabel: 'Jeudi' },
  { id: '5', defaultLabel: 'Vendredi' },
  { id: '6', defaultLabel: 'Samedi' },
  { id: '0', defaultLabel: 'Dimanche' },
];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const defaultSchedule = {
  "1": { open: true, start: "08:00", end: "19:00" },
  "2": { open: true, start: "08:00", end: "19:00" },
  "3": { open: true, start: "08:00", end: "19:00" },
  "4": { open: true, start: "08:00", end: "19:00" },
  "5": { open: true, start: "08:00", end: "19:00" },
  "6": { open: true, start: "09:00", end: "18:00" },
  "0": { open: false, start: "09:00", end: "18:00" },
};

export interface BookingSettingsCardProps {
  salon?: Salon;
  onUpdate?: (updates: Partial<Salon>) => Promise<any>;
}

export function BookingSettingsCard({ salon, onUpdate }: BookingSettingsCardProps = {}) {
  const { session } = useAuth();
  const { t, language } = useLanguage();
  const [tick, force] = useState(0);

  const localSalon = session?.salonId
    ? getSalonAccounts().find(s => s.id === session.salonId)
    : null;

  const activeSalon = salon || localSalon;
  void tick;

  const salonName = activeSalon?.name || activeSalon?.nom || 'Mon Salon';
  const initialSlug = activeSalon?.slug || slugify(salonName) || 'leaderbright-beauty-salon-bafoussam';

  const [editedSlug, setEditedSlug] = useState<string>(initialSlug);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [copied, setCopied] = useState(false);

  // Date Override Form State
  const [newOverrideDate, setNewOverrideDate] = useState<string>('');
  const [newOverrideIsOpen, setNewOverrideIsOpen] = useState<boolean>(false);
  const [newOverrideStart, setNewOverrideStart] = useState<string>('09:00');
  const [newOverrideEnd, setNewOverrideEnd] = useState<string>('17:00');
  const [newOverrideReason, setNewOverrideReason] = useState<string>('');
  const [customDatesState, setCustomDatesState] = useState<Record<string, DateOverride>>({});

  useEffect(() => {
    if (activeSalon?.slug) {
      setEditedSlug(activeSalon.slug);
    } else if (salonName) {
      setEditedSlug(slugify(salonName));
    }
  }, [activeSalon?.slug, salonName]);

  useEffect(() => {
    const rawCustomDates =
      activeSalon?.bookingSettings?.customDates ||
      (activeSalon as any)?.disponibilite?.customDates ||
      (activeSalon as any)?.availability?.customDates ||
      {};
    setCustomDatesState(rawCustomDates);
  }, [
    JSON.stringify(activeSalon?.bookingSettings?.customDates),
    JSON.stringify((activeSalon as any)?.disponibilite?.customDates),
    JSON.stringify((activeSalon as any)?.availability?.customDates)
  ]);

  if (!activeSalon) {
    return (
      <Card className="card-shadow lg:col-span-2 border-primary/20 p-6 text-center">
        <p className="text-sm font-semibold text-muted-foreground">{t('bookingSettings.loading', 'Chargement du salon...')}</p>
      </Card>
    );
  }

  const settings: SalonBookingSettings = {
    autoConfirm: true,
    allowGuest: true,
    openingHour: 8,
    closingHour: 20,
    slotDurationMin: 30,
    minBookingNoticeMin: 90,
    ...(activeSalon.bookingSettings || {}),
    customDates: customDatesState
  };

  const customDates = customDatesState;

  const currentSlug = activeSalon.slug || slugify(salonName);
  const publicUrl = getBookingPublicUrl(currentSlug);

  const schedule = activeSalon.disponibilite || activeSalon.availability || defaultSchedule;

  const generateHorairesSummary = (sched: typeof defaultSchedule) => {
    const dayNames: Record<string, string> = {
      '1': 'Lun', '2': 'Mar', '3': 'Mer', '4': 'Jeu', '5': 'Ven', '6': 'Sam', '0': 'Dim'
    };
    return Object.entries(sched)
      .map(([k, v]) => `${dayNames[k] || k}: ${v.open ? `${v.start}-${v.end}` : 'Fermé'}`)
      .join(', ');
  };

  const save = async (updates: any) => {
    try {
      if (onUpdate) {
        await onUpdate(updates);
      }
      if (localSalon?.id) {
        updateSalonAccount(localSalon.id, updates);
      }
      force(v => v + 1);
    } catch (e) {
      console.error('Error saving settings:', e);
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible de synchroniser les paramètres.",
        variant: "destructive"
      });
    }
  };

  const updateScheduleDay = (dayId: string, dayUpdates: Partial<{ open: boolean; start: string; end: string }>) => {
    const updatedSchedule = {
      ...schedule,
      [dayId]: {
        ...(schedule[dayId] || { open: true, start: "08:00", end: "19:00" }),
        ...dayUpdates
      }
    };
    const summary = generateHorairesSummary(updatedSchedule);
    save({
      disponibilite: updatedSchedule,
      availability: updatedSchedule,
      horaires: summary
    });
    toast({ title: t('bookingSettings.toastHoursUpdated', '✅ Horaires mis à jour') });
  };

  const applyPresetSchedule = (type: 'mon_sat' | 'mon_fri' | 'all_week') => {
    let newSched = { ...defaultSchedule };
    if (type === 'mon_sat') {
      newSched = {
        "1": { open: true, start: "08:00", end: "19:00" },
        "2": { open: true, start: "08:00", end: "19:00" },
        "3": { open: true, start: "08:00", end: "19:00" },
        "4": { open: true, start: "08:00", end: "19:00" },
        "5": { open: true, start: "08:00", end: "19:00" },
        "6": { open: true, start: "09:00", end: "18:00" },
        "0": { open: false, start: "09:00", end: "18:00" },
      };
    } else if (type === 'mon_fri') {
      newSched = {
        "1": { open: true, start: "09:00", end: "18:00" },
        "2": { open: true, start: "09:00", end: "18:00" },
        "3": { open: true, start: "09:00", end: "18:00" },
        "4": { open: true, start: "09:00", end: "18:00" },
        "5": { open: true, start: "09:00", end: "18:00" },
        "6": { open: false, start: "09:00", end: "18:00" },
        "0": { open: false, start: "09:00", end: "18:00" },
      };
    } else if (type === 'all_week') {
      newSched = {
        "1": { open: true, start: "08:00", end: "20:00" },
        "2": { open: true, start: "08:00", end: "20:00" },
        "3": { open: true, start: "08:00", end: "20:00" },
        "4": { open: true, start: "08:00", end: "20:00" },
        "5": { open: true, start: "08:00", end: "20:00" },
        "6": { open: true, start: "08:00", end: "20:00" },
        "0": { open: true, start: "09:00", end: "19:00" },
      };
    }

    const summary = generateHorairesSummary(newSched);
    save({
      disponibilite: newSched,
      availability: newSched,
      horaires: summary
    });
    toast({ title: '✅ Modèle horaire appliqué avec succès' });
  };

  const handleSaveSlug = async () => {
    const cleaned = slugify(editedSlug || salonName || 'leaderbright-beauty-salon-bafoussam');
    if (!cleaned) {
      toast({ title: t('bookingSettings.linkEmptyError', 'Le lien ne peut pas être vide'), variant: 'destructive' });
      return;
    }

    setIsSavingSlug(true);
    try {
      const existing = getSalonBySlug(cleaned);
      if (existing && existing.id !== activeSalon.id) {
        toast({ title: t('bookingSettings.toastLinkInUse', 'Ce lien est déjà utilisé'), variant: 'destructive' });
        setIsSavingSlug(false);
        return;
      }

      await save({ slug: cleaned });
      setEditedSlug(cleaned);
      toast({
        title: t('bookingSettings.toastLinkSaved', '✅ Lien public enregistré'),
        description: `https://www.beautyflowafrica.com/booking/${cleaned}`
      });
    } catch (err) {
      toast({ title: 'Erreur lors de la mise à jour du lien', variant: 'destructive' });
    } finally {
      setIsSavingSlug(false);
    }
  };

  const handleAddDateOverride = async () => {
    if (!newOverrideDate) {
      toast({ title: t('bookingSettings.selectDateError', 'Veuillez sélectionner une date'), variant: 'destructive' });
      return;
    }

    const updatedCustomDates: Record<string, DateOverride> = {
      ...customDatesState,
      [newOverrideDate]: {
        open: newOverrideIsOpen,
        start: newOverrideIsOpen ? newOverrideStart : undefined,
        end: newOverrideIsOpen ? newOverrideEnd : undefined,
        reason: newOverrideReason.trim() || (newOverrideIsOpen ? (language === 'fr' ? 'Horaires spéciaux' : 'Special hours') : (language === 'fr' ? 'Fermeture exceptionnelle' : 'Exceptional closure'))
      }
    };

    setCustomDatesState(updatedCustomDates);

    await save({
      bookingSettings: {
        ...settings,
        customDates: updatedCustomDates
      },
      disponibilite: {
        ...schedule,
        customDates: updatedCustomDates
      },
      availability: {
        ...schedule,
        customDates: updatedCustomDates
      }
    });

    setNewOverrideDate('');
    setNewOverrideReason('');
    setNewOverrideIsOpen(false);
    toast({ title: `${t('bookingSettings.toastExceptionAdded', '✅ Exception enregistrée pour le')} ${newOverrideDate}` });
  };

  const handleDeleteDateOverride = async (dateKey: string) => {
    const updatedCustomDates = { ...customDatesState };
    delete updatedCustomDates[dateKey];

    setCustomDatesState(updatedCustomDates);

    await save({
      bookingSettings: {
        ...settings,
        customDates: updatedCustomDates
      },
      disponibilite: {
        ...schedule,
        customDates: updatedCustomDates
      },
      availability: {
        ...schedule,
        customDates: updatedCustomDates
      }
    });
    toast({ title: `${t('bookingSettings.toastExceptionDeleted', '✅ Exception supprimée pour le')} ${dateKey}` });
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({ title: t('bookingSettings.toastLinkCopied', '✅ Lien copié dans le presse-papier') });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      language === 'fr'
        ? `Bonjour ! Découvrez notre salon et prenez votre rendez-vous directement en ligne ici : ${publicUrl}`
        : `Hello! Discover our salon and book your appointment online here: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const isSlugChanged = slugify(editedSlug) !== currentSlug;

  const formatDateDisplay = (dateKey: string) => {
    try {
      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day, 12, 0, 0);
        return format(d, 'EEEE d MMMM yyyy', { locale: language === 'fr' ? fr : undefined });
      }
      const d = new Date(dateKey + 'T12:00:00');
      return format(d, 'EEEE d MMMM yyyy', { locale: language === 'fr' ? fr : undefined });
    } catch {
      return dateKey;
    }
  };

  return (
    <Card className="card-shadow lg:col-span-2 border-primary/20 bg-card rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-rose-500/10 via-primary/5 to-transparent border-b border-border/40 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs border border-primary/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-black">{t('bookingSettings.title', 'Disponibilité & Page de réservation')}</CardTitle>
            <CardDescription className="text-xs font-semibold mt-0.5">
              {t('bookingSettings.description', "Définissez vos horaires d'ouverture récurrents, vos fermetures exceptionnelles et gérez votre lien public de réservation.")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-8">
        
        {/* ========================================================================= */}
        {/* --- SECTION 1: LIEN PUBLIC DE RÉSERVATION (BEAUTYFLOWAFRICA.COM) --- */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/[0.04] via-background to-amber-500/[0.03] border border-rose-500/20 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label className="text-sm font-extrabold flex items-center gap-2 text-foreground">
              <Globe className="h-4 w-4 text-rose-500" />
              <span>{t('bookingSettings.publicLinkTitle', 'Votre lien public de réservation')}</span>
            </Label>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] font-bold">
              {t('bookingSettings.badgeOnline24', 'En ligne 24h/24')}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            {t('bookingSettings.linkPrefixNote', "Personnalisez l'adresse web de réservation que vous partagez sur WhatsApp, Instagram, TikTok et Facebook :")}
          </p>

          {/* Public Link Input + Base Domain Prefix */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center rounded-2xl border-2 border-primary/30 bg-background px-3.5 py-2 text-xs sm:text-sm font-mono shadow-xs focus-within:border-primary transition-all overflow-hidden">
                <span className="text-primary font-bold shrink-0 select-none whitespace-nowrap">
                  https://www.beautyflowafrica.com/booking/
                </span>
                <Input
                  value={editedSlug}
                  onChange={e => setEditedSlug(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveSlug();
                    }
                  }}
                  placeholder="leaderbright-beauty-salon-bafoussam"
                  className="h-8 px-1.5 border-0 bg-transparent font-mono font-bold text-foreground focus-visible:ring-0 text-xs sm:text-sm flex-1 min-w-[140px]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {isSlugChanged && (
                  <Button
                    onClick={handleSaveSlug}
                    disabled={isSavingSlug}
                    size="sm"
                    className="gradient-primary rounded-xl h-11 px-4 font-bold shadow-sm shrink-0"
                  >
                    {isSavingSlug ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-4 w-4 mr-1.5" />
                    )}
                    <span>{t('bookingSettings.saveLink', 'Enregistrer')}</span>
                  </Button>
                )}

                <Button
                  onClick={copyUrl}
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-11 px-3.5 font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{t('bookingSettings.copied', 'Copié !')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5 text-rose-500" />
                      <span>{t('bookingSettings.copy', 'Copier')}</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={shareWhatsApp}
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-11 px-3.5 font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
                  title="Partager sur WhatsApp"
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  <span>WhatsApp</span>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl h-11 px-4 font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 shadow-xs shrink-0"
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    <span>{t('bookingSettings.openLink', 'Ouvrir')}</span>
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold px-1">
              <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
              <span>{t('bookingSettings.activeLink', 'Lien actif :')}</span>
              <span className="text-foreground font-mono font-bold truncate">{publicUrl}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- SECTION 2: DÉLAI MINIMUM DE PRÉAVIS (ANTI DERNIÈRE MINUTE) --- */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground">
                  {t('bookingSettings.minBookingNoticeTitle', 'Délai minimum de réservation avant le créneau (Préavis)')}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('bookingSettings.minBookingNoticeDesc', 'Empêche les clientes de réserver trop tard afin d\'assurer leur prise en charge à temps.')}
                </p>
              </div>
            </div>

            <Select
              defaultValue={String(settings.minBookingNoticeMin ?? 90)}
              onValueChange={v => save({ bookingSettings: { ...settings, minBookingNoticeMin: Number(v) } })}
            >
              <SelectTrigger className="h-10 w-48 rounded-xl bg-background border-slate-300 dark:border-slate-700 font-extrabold text-xs shadow-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="30" className="font-bold text-xs">{t('bookingSettings.notice30min', '30 minutes')}</SelectItem>
                <SelectItem value="60" className="font-bold text-xs">{t('bookingSettings.notice1h', '1 heure')}</SelectItem>
                <SelectItem value="90" className="font-bold text-xs">{t('bookingSettings.notice1h30', '1h30 (90 min) — Recommandé')}</SelectItem>
                <SelectItem value="120" className="font-bold text-xs">{t('bookingSettings.notice2h', '2 heures')}</SelectItem>
                <SelectItem value="180" className="font-bold text-xs">{t('bookingSettings.notice3h', '3 heures')}</SelectItem>
                <SelectItem value="1440" className="font-bold text-xs">{t('bookingSettings.notice24h', '24 heures (1 jour avant)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- SECTION 3: FERMETURES EXCEPTIONNELLES & HORAIRES PAR DATE --- */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-foreground uppercase tracking-wider">
                <CalendarIcon className="h-4 w-4 text-rose-500" />
                <span>{t('bookingSettings.exceptionsTitle', 'Exceptions & Fermetures ponctuelles par date')}</span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {t('bookingSettings.exceptionsDesc', 'Bloquez un jour précis (ex: fermeture exceptionnelle un mercredi précis) sans modifier vos semaines suivantes.')}
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
              {t('bookingSettings.multiWeekBadge', 'Multi-semaines dynamique')}
            </Badge>
          </div>

          {/* Form to add a new date override */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-background border border-border/70 shadow-2xs items-end">
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">{t('bookingSettings.dateTarget', 'Date concernée')}</Label>
              <Input
                type="date"
                value={newOverrideDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewOverrideDate(e.target.value)}
                className="h-9 text-xs rounded-lg font-bold"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">{t('bookingSettings.statusThisDay', 'Statut ce jour-là')}</Label>
              <Select
                value={newOverrideIsOpen ? 'open' : 'closed'}
                onValueChange={v => setNewOverrideIsOpen(v === 'open')}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="closed" className="text-rose-600 font-bold text-xs">{t('bookingSettings.closedAllDay', '🔴 Fermé (Toute la journée)')}</SelectItem>
                  <SelectItem value="open" className="text-emerald-600 font-bold text-xs">{t('bookingSettings.specificHours', '🟡 Horaires spécifiques')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newOverrideIsOpen && (
              <div className="sm:col-span-3 flex items-center gap-1">
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">{t('bookingSettings.from', 'De')}</Label>
                  <Input
                    type="time"
                    value={newOverrideStart}
                    onChange={e => setNewOverrideStart(e.target.value)}
                    className="h-9 text-xs rounded-lg font-bold px-1"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">{t('bookingSettings.to', 'À')}</Label>
                  <Input
                    type="time"
                    value={newOverrideEnd}
                    onChange={e => setNewOverrideEnd(e.target.value)}
                    className="h-9 text-xs rounded-lg font-bold px-1"
                  />
                </div>
              </div>
            )}

            <div className={newOverrideIsOpen ? "sm:col-span-2 space-y-1" : "sm:col-span-4 space-y-1"}>
              <Label className="text-[11px] font-bold text-muted-foreground">{t('bookingSettings.reasonLabel', 'Motif / Raison')}</Label>
              <Input
                placeholder={t('bookingSettings.reasonPlaceholder', 'Ex: Inventaire, Férié, Travaux...')}
                value={newOverrideReason}
                onChange={e => setNewOverrideReason(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <div className={newOverrideIsOpen ? "sm:col-span-1" : "sm:col-span-2"}>
              <Button
                type="button"
                size="sm"
                onClick={handleAddDateOverride}
                className="w-full h-9 rounded-lg font-bold text-xs gradient-primary shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{t('bookingSettings.addException', 'Ajouter')}</span>
              </Button>
            </div>
          </div>

          {/* List of active custom date overrides */}
          {Object.keys(customDates).length > 0 ? (
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold text-muted-foreground">{t('bookingSettings.plannedExceptions', 'Exceptions planifiées :')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(customDates)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, override]) => (
                    <div
                      key={dateKey}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs shadow-2xs transition-all ${
                        override.open
                          ? 'bg-amber-500/[0.08] dark:bg-amber-950/20 border-amber-500/30 text-amber-950 dark:text-amber-200'
                          : 'bg-rose-500/[0.08] dark:bg-rose-950/20 border-rose-500/30 text-rose-950 dark:text-rose-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-extrabold flex items-center gap-1.5 flex-wrap">
                          <span className="capitalize">{formatDateDisplay(dateKey)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-extrabold ${override.open ? 'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10' : 'border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10'}`}>
                            {override.open ? `${override.start} - ${override.end}` : (language === 'fr' ? 'Fermé' : 'Closed')}
                          </Badge>
                          {override.reason && (
                            <span className="text-[11px] text-muted-foreground truncate font-medium">
                              • {override.reason}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDateOverride(dateKey)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                        title={language === 'fr' ? 'Supprimer cette exception' : 'Delete this exception'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground font-semibold italic">
              {t('bookingSettings.noExceptions', 'Aucune exception de date configurée. Les horaires hebdomadaires récurrents ci-dessous s\'appliquent à toutes les semaines.')}
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* --- SECTION 4: HORAIRES D'OUVERTURE HEBDOMADAIRES RÉCURRENTS --- */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-foreground uppercase tracking-wider">
                <Clock className="h-4 w-4 text-rose-500" />
                <span>{t('bookingSettings.weeklyHours', "Horaires habituels hebdomadaires")}</span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {language === 'fr'
                  ? 'Ces horaires réguliers s\'appliquent automatiquement chaque semaine.'
                  : 'These regular hours apply automatically every week.'}
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground mr-1">{t('bookingSettings.presets', 'Modèles :')}</span>
              <button
                type="button"
                onClick={() => applyPresetSchedule('mon_sat')}
                className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all border border-border/60"
              >
                {t('bookingSettings.presetMonSat', 'Lun-Sam 8h-19h')}
              </button>
              <button
                type="button"
                onClick={() => applyPresetSchedule('mon_fri')}
                className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all border border-border/60"
              >
                {t('bookingSettings.presetMonFri', 'Lun-Ven 9h-18h')}
              </button>
              <button
                type="button"
                onClick={() => applyPresetSchedule('all_week')}
                className="text-[10.5px] font-bold px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all border border-border/60"
              >
                {t('bookingSettings.presetAllWeek', '7j/7')}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {daysList.map((day) => {
              const dayData = schedule[day.id] || { open: false, start: '08:00', end: '19:00' };
              return (
                <div
                  key={day.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 gap-3 ${
                    dayData.open
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-2xs'
                      : 'border-slate-200/50 dark:border-slate-800/40 bg-muted/20 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <span className="font-extrabold text-xs sm:text-sm capitalize min-w-[95px] text-slate-800 dark:text-slate-100">
                      {t(`settings.day.${day.id}`, day.defaultLabel)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateScheduleDay(day.id, { open: !dayData.open })}
                      className={`relative inline-flex h-8 w-24 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 font-extrabold text-xs tracking-wider shadow-xs ${
                        dayData.open
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-transparent shadow-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {dayData.open ? t('bookingSettings.statusOpen', '🟢 Ouvert') : t('bookingSettings.statusClosed', '🔴 Fermé')}
                    </button>
                  </div>

                  {dayData.open ? (
                    <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={dayData.start}
                          onValueChange={(val) => updateScheduleDay(day.id, { start: val })}
                        >
                          <SelectTrigger className="h-9 w-24 rounded-xl bg-background dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-foreground dark:text-slate-100 font-extrabold text-xs shadow-xs focus:ring-2 focus:ring-rose-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl bg-popover text-foreground">
                            {timeOptions.map((tOpt) => (
                              <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-bold">{tOpt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span className="text-xs text-muted-foreground font-bold px-0.5">{t('bookingSettings.to', 'à')}</span>

                        <Select
                          value={dayData.end}
                          onValueChange={(val) => updateScheduleDay(day.id, { end: val })}
                        >
                          <SelectTrigger className="h-9 w-24 rounded-xl bg-background dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-foreground dark:text-slate-100 font-extrabold text-xs shadow-xs focus:ring-2 focus:ring-rose-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl bg-popover text-foreground">
                            {timeOptions.map((tOpt) => (
                              <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-bold">{tOpt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const updated = { ...schedule };
                          Object.keys(updated).forEach(k => {
                            if (k !== day.id && updated[k]?.open) {
                              updated[k] = { ...updated[k], start: dayData.start, end: dayData.end };
                            }
                          });
                          const summary = generateHorairesSummary(updated);
                          save({
                            disponibilite: updated,
                            availability: updated,
                            horaires: summary
                          });
                          toast({ title: t('bookingSettings.toastHoursCopied', '✅ Horaires copiés sur les autres jours ouverts') });
                        }}
                        className="rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1 px-2.5 h-9 shrink-0 font-extrabold text-xs"
                        title={t('bookingSettings.copyHoursTitle', 'Copier ces horaires sur les autres jours ouverts')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('bookingSettings.copyHours', 'Copier')}</span>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold italic sm:text-right">
                      {t('bookingSettings.restDayClosed', 'Jour de repos / Salon fermé')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- SECTION 5: PARAMÈTRES DE CRÉNEAUX & CONFIRMATION --- */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold text-foreground dark:text-slate-100 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>{t('bookingSettings.autoConfirmTitle', 'Confirmation automatique')}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('bookingSettings.autoConfirmDesc', 'Les rendez-vous sont confirmés dès la réservation sans validation manuelle requise.')}
              </div>
            </div>
            <Switch
              checked={settings.autoConfirm}
              onCheckedChange={v => save({ bookingSettings: { ...settings, autoConfirm: v } })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {t('bookingSettings.openingHour', "Heure d'ouverture (0-23h)")}
              </Label>
              <Input
                type="number" min={0} max={23}
                defaultValue={settings.openingHour}
                onBlur={e => save({ bookingSettings: { ...settings, openingHour: Number(e.target.value) } })}
                className="h-10 rounded-xl bg-background dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-foreground font-extrabold text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {t('bookingSettings.closingHour', "Heure de fermeture (1-24h)")}
              </Label>
              <Input
                type="number" min={1} max={24}
                defaultValue={settings.closingHour}
                onBlur={e => save({ bookingSettings: { ...settings, closingHour: Number(e.target.value) } })}
                className="h-10 rounded-xl bg-background dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-foreground font-extrabold text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {t('bookingSettings.slotInterval', "Intervalle créneaux (min)")}
              </Label>
              <Select
                defaultValue={String(settings.slotDurationMin || 30)}
                onValueChange={v => save({ bookingSettings: { ...settings, slotDurationMin: Number(v) } })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-foreground font-extrabold text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="15" className="font-bold text-xs">15 minutes</SelectItem>
                  <SelectItem value="30" className="font-bold text-xs">30 minutes</SelectItem>
                  <SelectItem value="45" className="font-bold text-xs">45 minutes</SelectItem>
                  <SelectItem value="60" className="font-bold text-xs">60 minutes (1 heure)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- SECTION 6: VISIBILITÉ DU SALON --- */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border bg-amber-500/10 border-amber-500/30 p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                {(activeSalon.isHidden || activeSalon.hidden) ? (
                  <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
                ) : (
                  <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
                <span>{t('bookingSettings.visibilityTitle', "Visibilité du salon sur l'annuaire public")}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {(activeSalon.isHidden || activeSalon.hidden)
                  ? t('bookingSettings.hiddenDesc', '⚠️ Votre salon est actuellement masqué du public. Vos données restent conservées mais les clientes ne peuvent pas réserver.')
                  : t('bookingSettings.visibleDesc', "Votre salon est public et visible sur l'annuaire. Activez le bouton pour masquer votre salon temporairement sans le supprimer.")}
              </div>
            </div>
            <Switch
              checked={!(activeSalon.isHidden || activeSalon.hidden)}
              onCheckedChange={async (isPublic) => {
                const shouldHide = !isPublic;
                save({ isHidden: shouldHide, hidden: shouldHide } as any);
                toast({
                  title: shouldHide
                    ? t('bookingSettings.toastHiddenTitle', '🙈 Salon masqué du public')
                    : t('bookingSettings.toastVisibleTitle', '👁️ Salon de nouveau visible'),
                  description: shouldHide
                    ? t('bookingSettings.toastHiddenDesc', "Votre salon n'apparaît plus sur l'annuaire et la plateforme de réservation.")
                    : t('bookingSettings.toastVisibleDesc', 'Votre salon est désormais visible et prêt à recevoir des réservations.'),
                });
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs font-semibold text-muted-foreground flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('bookingSettings.operationalBanner', 'Disponibilités, préavis (1h30) & exceptions par date opérationnels')}</span>
          </span>
          <Badge variant="secondary" className="text-[10px] font-bold">
            {t('bookingSettings.planFreePro', 'BeautyFlow Free & Pro')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}