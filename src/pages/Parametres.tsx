import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, Globe, Sparkles, Bell, Save, CheckCircle, AlertTriangle,
  Phone, Mail, MapPin, Clock, CreditCard, ShieldCheck,
  Zap, Edit, X, Info, Gift, Heart, User, LayoutDashboard,
  ArrowRight, Crown, Star, Check, ZapOff,
  Tag,
  Store,
  Copy,
  Moon, Sun, Monitor, Palette, Image as ImageIcon, Users, UserPlus, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useSalon } from '@/hooks/useSalon';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { getPlanColor, formatPlanPrice, PlanType } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { PlanComparisonDialog } from '@/components/settings/PlanComparisonDialog';
import PaymentModal from '@/components/settings/PaymentModal';
import { MapSelector } from '@/components/ui/MapSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ─────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────
const infoSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  phone: z.string().min(9, 'Numéro invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().min(2, 'Adresse requise'),
  ville: z.string().optional(),
  pays: z.string().min(2, 'Pays requis'),
  devise: z.string().min(1),
  description: z.string().max(500).optional(),
  slogan: z.string().max(200).optional(),
  horaires: z.string().max(100).optional(),
  typeEtablissement: z.string().optional(),
  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number()
  }).optional()
});

const rappelSchema = z.object({
  joursRappelInactivite: z.coerce.number().min(7).max(365),
  joursRappelSuivi: z.coerce.number().min(7).max(90),
});

const fideliteSchema = z.object({
  visitesRequises: z.coerce.number().min(1),
  reductionPourcentage: z.coerce.number().min(1).max(100),
  visitesVIP: z.coerce.number().min(1),
});

const paymentConfigSchema = z.object({
  payoutMomoNumber: z.string().refine(val => {
    if (!val) return true;
    const clean = val.replace(/\D/g, '');
    return clean.length === 9 || (clean.length === 12 && clean.startsWith('237'));
  }, {
    message: "Le numéro Mobile Money doit comporter 9 chiffres (ex: 6XXXXXXXX) ou 12 chiffres avec l'indicatif 237."
  }).optional().or(z.literal('')),
  payoutOperator: z.enum(['mtn', 'orange', '']).optional().or(z.literal('')),
  payoutMomoName: z.string().optional().or(z.literal('')),
  payoutMtnNumber: z.string().refine(val => {
    if (!val) return true;
    const clean = val.replace(/\D/g, '');
    return clean.length === 9 || (clean.length === 12 && clean.startsWith('237'));
  }, {
    message: "Le numéro MTN doit comporter 9 chiffres (ex: 6XXXXXXXX) ou 12 chiffres avec l'indicatif 237."
  }).optional().or(z.literal('')),
  payoutMtnName: z.string().optional().or(z.literal('')),
  payoutOrangeNumber: z.string().refine(val => {
    if (!val) return true;
    const clean = val.replace(/\D/g, '');
    return clean.length === 9 || (clean.length === 12 && clean.startsWith('237'));
  }, {
    message: "Le numéro Orange doit comporter 9 chiffres (ex: 6XXXXXXXX) ou 12 chiffres avec l'indicatif 237."
  }).optional().or(z.literal('')),
  payoutOrangeName: z.string().optional().or(z.literal('')),
  payoutWaveNumber: z.string().optional().or(z.literal('')),
  payoutWaveName: z.string().optional().or(z.literal(''))
});

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const TYPES_ETAB = [
  { value: 'salon_coiffure', labelKey: 'settings.types.salon_coiffure' },
  { value: 'spa', labelKey: 'settings.types.spa' },
  { value: 'institut_beaute', labelKey: 'settings.types.institut_beaute' },
  { value: 'barbershop', labelKey: 'settings.types.barbershop' },
  { value: 'onglerie', labelKey: 'settings.types.onglerie' },
  { value: 'mixte', labelKey: 'settings.types.mixte' },
  { value: 'autre', labelKey: 'settings.types.autre' },
];

const PAYS_LIST = [
  { code: 'CM', labelKey: 'settings.countries.CM' },
  { code: 'SN', labelKey: 'settings.countries.SN' },
  { code: 'CI', labelKey: 'settings.countries.CI' },
  { code: 'FR', labelKey: 'settings.countries.FR' },
];

// ─────────────────────────────────────────────
// COMPOSANTS INTERNES
// ─────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon?: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      {Icon && (
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type DayAvailability = {
  open: boolean;
  start: string;
  end: string;
};

type WeekAvailability = Record<string, DayAvailability>;

const defaultWeekAvailability: WeekAvailability = {
  "1": { open: true, start: "08:00", end: "19:00" }, // Lundi
  "2": { open: true, start: "08:00", end: "19:00" }, // Mardi
  "3": { open: true, start: "08:00", end: "19:00" }, // Mercredi
  "4": { open: true, start: "08:00", end: "19:00" }, // Jeudi
  "5": { open: true, start: "08:00", end: "19:00" }, // Vendredi
  "6": { open: true, start: "09:00", end: "18:00" }, // Samedi
  "0": { open: false, start: "09:00", end: "18:00" }, // Dimanche
};

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function Parametres() {
  const { salon, staff, updateSalon, updateConfigFidelite, refetch } = useSalon();
  const { t, language } = useLanguage();
  const { plan, getCustomerLimit, getStaffLimit, getCampaignLimit } = useSubscriptionPlan();
  const { theme, setTheme, color, setColor } = useTheme();

  const [editingInfo, setEditingInfo] = useState(false);
  const [editingRappels, setEditingRappels] = useState(false);
  const [editingFidelite, setEditingFidelite] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [editingStaffAvail, setEditingStaffAvail] = useState<any | null>(null);
  const [staffAvail, setStaffAvail] = useState<WeekAvailability>(defaultWeekAvailability);
  const [useGlobalHours, setUseGlobalHours] = useState(true);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const limit = getStaffLimit();
  const limitReached = limit !== null && staff.length >= limit;

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      toast({
        title: '❌ ' + (t('common.error') || 'Limite atteinte'),
        description: language === 'fr'
          ? `Votre plan actuel limite votre équipe à ${limit} collaborateurs. Veuillez mettre à niveau.`
          : `Your current plan limits your team to ${limit} staff members. Please upgrade.`,
        variant: 'destructive',
      });
      return;
    }

    if (!newStaffName || !newStaffEmail || !newStaffPassword) {
      toast({
        title: '⚠️ ' + (t('common.error') || 'Champs requis'),
        description: language === 'fr'
          ? 'Veuillez remplir tous les champs obligatoires (*).'
          : 'Please fill in all required fields (*).',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingStaff(true);
    try {
      await api.createStaff(salon.id || (salon as any)._id, {
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword,
        telephone: newStaffPhone,
      });

      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr'
          ? 'Le collaborateur a été ajouté avec succès.'
          : 'Team member added successfully.',
      });

      setShowAddStaffModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffPassword('');
      refetch();
    } catch (err: any) {
      console.error(err);
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: err.message || (language === 'fr' ? "Erreur lors de l'ajout." : 'Failed to add staff member.'),
        variant: 'destructive',
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  useEffect(() => {
    if (editingStaffAvail) {
      if (editingStaffAvail.availability) {
        setStaffAvail(editingStaffAvail.availability as WeekAvailability);
        setUseGlobalHours(false);
      } else {
        setStaffAvail(defaultWeekAvailability);
        setUseGlobalHours(true);
      }
    }
  }, [editingStaffAvail]);

  const [availability, setAvailability] = useState<WeekAvailability>(() => {
    if (salon?.availability && typeof salon.availability === 'object') {
      return salon.availability as WeekAvailability;
    }
    return defaultWeekAvailability;
  });

  useEffect(() => {
    if (salon?.availability && typeof salon.availability === 'object') {
      setAvailability(salon.availability as WeekAvailability);
    }
  }, [salon]);

  const timeOptions = useMemo(() => {
    const slots = [];
    for (let h = 5; h <= 23; h++) {
      const hStr = h.toString().padStart(2, '0');
      slots.push(`${hStr}:00`);
      slots.push(`${hStr}:30`);
    }
    return slots;
  }, []);

  const daysOrder = ["1", "2", "3", "4", "5", "6", "0"]; // Lun -> Dim

  const handleToggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        open: !prev[day].open
      }
    }));
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  const handleCopyHours = (day: string) => {
    const hoursToCopy = availability[day];
    setAvailability(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k !== day && next[k].open) {
          next[k] = {
            ...next[k],
            start: hoursToCopy.start,
            end: hoursToCopy.end
          };
        }
      });
      return next;
    });
    toast({
      title: '📋 ' + (t('common.success') || 'Succès'),
      description: language === 'fr'
        ? `Horaires du jour recopiés sur tous les autres jours ouverts.`
        : `Day hours successfully copied to all other open days.`,
    });
  };

  const handleSaveAvailability = async () => {
    setIsSavingAvailability(true);
    try {
      // Met également à jour le champ texte 'horaires' pour compatibilité d'affichage
      const activeDays = daysOrder
        .filter(d => availability[d].open)
        .map(d => {
          const dayName = t(`settings.day.${d}`).substring(0, 3);
          return `${dayName} (${availability[d].start}-${availability[d].end})`;
        })
        .join(', ');

      await updateSalon({
        availability,
        horaires: activeDays || (language === 'fr' ? 'Fermé' : 'Closed')
      });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr'
          ? 'Horaires de disponibilité mis à jour avec succès.'
          : 'Availability schedule successfully updated.',
      });
    } catch (err) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: t('common.error') || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const infoForm = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: '', phone: '', email: '', address: '', ville: '',
      pays: 'CM', devise: 'FCFA', description: '', slogan: '',
      horaires: '', typeEtablissement: 'salon_coiffure',
      location: { lat: 0, lng: 0 }
    },
  });

  const mapLat = infoForm.watch('location.lat');
  const mapLng = infoForm.watch('location.lng');

  const rappelForm = useForm<z.infer<typeof rappelSchema>>({
    resolver: zodResolver(rappelSchema),
    defaultValues: { joursRappelInactivite: 30, joursRappelSuivi: 14 },
  });

  const fideliteForm = useForm<z.infer<typeof fideliteSchema>>({
    resolver: zodResolver(fideliteSchema),
    defaultValues: { visitesRequises: 10, reductionPourcentage: 20, visitesVIP: 50 },
  });

  const [editingPaymentConfig, setEditingPaymentConfig] = useState(false);
  const paymentConfigForm = useForm<z.infer<typeof paymentConfigSchema>>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      payoutMomoNumber: '',
      payoutOperator: '',
      payoutMomoName: '',
      payoutMtnNumber: '',
      payoutMtnName: '',
      payoutOrangeNumber: '',
      payoutOrangeName: '',
      payoutWaveNumber: '',
      payoutWaveName: ''
    }
  });

  useEffect(() => {
    if (!salon) return;
    infoForm.reset({
      name: salon.name || '',
      phone: salon.telephone || '',
      email: salon.email || '',
      address: salon.address || '',
      ville: salon.ville || '',
      pays: salon.pays || 'CM',
      devise: salon.devise || 'FCFA',
      description: salon.description || '',
      slogan: salon.slogan || '',
      horaires: salon.horaires || '',
      typeEtablissement: salon.typeEtablissement || 'salon_coiffure',
      location: {
        lat: salon.location?.lat || 0,
        lng: salon.location?.lng || 0,
      }
    });
    rappelForm.reset({
      joursRappelInactivite: salon.joursRappelInactivite || 30,
      joursRappelSuivi: salon.joursRappelSuivi || 14,
    });
    fideliteForm.reset({
      visitesRequises: salon.configFidelite?.visitesRequises || 10,
      reductionPourcentage: salon.configFidelite?.reductionPourcentage || 20,
      visitesVIP: salon.configFidelite?.visitesVIP || 50,
    });
    paymentConfigForm.reset({
      payoutMomoNumber: salon.paymentConfig?.payoutMomoNumber || '',
      payoutOperator: salon.paymentConfig?.payoutOperator || '',
      payoutMomoName: salon.paymentConfig?.payoutMomoName || '',
      payoutMtnNumber: salon.paymentConfig?.payoutMtnNumber || '',
      payoutMtnName: salon.paymentConfig?.payoutMtnName || '',
      payoutOrangeNumber: salon.paymentConfig?.payoutOrangeNumber || '',
      payoutOrangeName: salon.paymentConfig?.payoutOrangeName || '',
      payoutWaveNumber: salon.paymentConfig?.payoutWaveNumber || '',
      payoutWaveName: salon.paymentConfig?.payoutWaveName || ''
    });
  }, [salon, infoForm, rappelForm, fideliteForm, paymentConfigForm]);

  const onInfoSubmit = async (data: z.infer<typeof infoSchema>) => {
    try {
      await updateSalon(data as any);
      toast({ title: '✅ Succès', description: 'Informations mises à jour' });
      setEditingInfo(false);
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const onRappelSubmit = async (data: z.infer<typeof rappelSchema>) => {
    try {
      await updateSalon(data);
      toast({ title: '✅ Succès', description: 'Délais de rappel mis à jour avec succès' });
      setEditingRappels(false);
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const onFideliteSubmit = async (data: z.infer<typeof fideliteSchema>) => {
    try {
      await updateConfigFidelite(data);
      toast({ title: '✅ Succès', description: 'Programme de fidélité mis à jour' });
      setEditingFidelite(false);
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const onPaymentConfigSubmit = async (data: z.infer<typeof paymentConfigSchema>) => {
    try {
      await updateSalon({ paymentConfig: data });
      toast({ title: '✅ Succès', description: 'Configuration de paiement mise à jour' });
      setEditingPaymentConfig(false);
      refetch();
    } catch (err: any) {
      toast({ title: '❌ Erreur', description: err.message || 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const handleUpgrade = (newPlan: PlanType) => {
    setSelectedUpgradePlan(newPlan);
    setIsPaymentModalOpen(true);
  };

  if (!salon) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap sm:flex-nowrap h-auto w-full justify-start overflow-x-auto gap-1">
          <TabsTrigger value="general" className="gap-2 shrink-0"><Building2 className="h-4 w-4" /> {t('settings.general')}</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2 shrink-0"><Users className="h-4 w-4" /> Équipe</TabsTrigger>
          <TabsTrigger value="disponibilite" className="gap-2 shrink-0"><Clock className="h-4 w-4" /> {t('settings.availability')}</TabsTrigger>
          <TabsTrigger value="medias" className="gap-2 shrink-0"><ImageIcon className="h-4 w-4" /> Galerie & Médias</TabsTrigger>
          <TabsTrigger value="apparence" className="gap-2 shrink-0"><Palette className="h-4 w-4" /> Apparence</TabsTrigger>
          <TabsTrigger value="abonnement" className="gap-2 shrink-0"><Crown className="h-4 w-4" /> {t('settings.subscription')}</TabsTrigger>
          <TabsTrigger value="fidelite" className="gap-2 shrink-0"><Gift className="h-4 w-4" /> {t('settings.loyalty')}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 shrink-0"><Bell className="h-4 w-4" /> {t('settings.communications')}</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 shrink-0"><CreditCard className="h-4 w-4" /> {language === 'fr' ? 'Versements' : 'Payouts'}</TabsTrigger>
        </TabsList>

        {/* ── GÉNÉRAL ── */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 card-shadow overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <CardTitle>{t('settings.identity')}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingInfo(!editingInfo)} className="gap-2">
                    {editingInfo ? <><X className="h-4 w-4" /> {t('common.cancel')}</> : <><Edit className="h-4 w-4" /> {t('common.edit')}</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!editingInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    <InfoRow icon={Building2} label={t('settings.salonName')} value={salon.name} />
                    <InfoRow icon={Sparkles} label={t('settings.slogan')} value={salon.slogan} />
                    <InfoRow icon={Phone} label={t('settings.phone')} value={salon.phone} />
                    <InfoRow icon={Mail} label={t('login.email')} value={salon.email} />
                    <InfoRow icon={MapPin} label={t('settings.address')} value={salon.address} />
                    <InfoRow icon={MapPin} label={t('clients.ville')} value={salon.ville} />
                    <InfoRow icon={Globe} label={t('clients.pays')} value={salon.pays} />
                    <InfoRow icon={CreditCard} label={t('clients.devise')} value={salon.devise} />
                    <InfoRow icon={MapPin} label="Latitude GPS" value={salon.location?.lat?.toString() || '0'} />
                    <InfoRow icon={MapPin} label="Longitude GPS" value={salon.location?.lng?.toString() || '0'} />
                    <div className="md:col-span-2 pt-4">
                      <p className="text-xs text-muted-foreground mb-1">{t('finances.description')}</p>
                      <p className="text-sm text-pretty">{salon.description || t('common.none')}</p>
                    </div>
                  </div>
                ) : (
                  <Form {...infoForm}>
                    <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={infoForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>{t('settings.salonName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="typeEtablissement" render={({ field }) => (
                          <FormItem><FormLabel>{t('services.type')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{TYPES_ETAB.map((type) => <SelectItem key={type.value} value={type.value}>{t(type.labelKey)}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>{t('settings.phone')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>{t('login.email')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="address" render={({ field }) => (
                          <FormItem><FormLabel>{t('settings.address')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="ville" render={({ field }) => (
                          <FormItem><FormLabel>{t('clients.ville')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="pays" render={({ field }) => (
                          <FormItem><FormLabel>{t('clients.pays')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{PAYS_LIST.map((p) => <SelectItem key={p.code} value={p.code}>{t(p.labelKey)}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="location.lat" render={({ field }) => (
                          <FormItem><FormLabel>Latitude GPS</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={infoForm.control} name="location.lng" render={({ field }) => (
                          <FormItem><FormLabel>Longitude GPS</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <div className="space-y-2 mb-4">
                        <FormLabel>Position sur la carte (cliquer ou glisser le marqueur)</FormLabel>
                        <MapSelector
                          lat={Number(mapLat) || 4.0508}
                          lng={Number(mapLng) || 9.7085}
                          onChange={(lat, lng) => {
                            infoForm.setValue('location.lat', lat, { shouldDirty: true, shouldValidate: true });
                            infoForm.setValue('location.lng', lng, { shouldDirty: true, shouldValidate: true });
                          }}
                        />
                      </div>

                      <FormField control={infoForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t('finances.description')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setEditingInfo(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" className="gradient-primary px-8">{t('common.save')}</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> {t('settings.horaires')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted/40 rounded-lg text-sm italic font-medium">
                    {salon.horaires || t('common.none')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'fr'
                      ? 'Configurez les plages d\'heures détaillées par jour dans l\'onglet Disponibilité.'
                      : 'Configure detailed day-by-day business hours in the Availability tab.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="card-shadow bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{t('settings.support')}</h3>
                  <p className="text-xs text-muted-foreground">{t('settings.supportDesc')}</p>
                  <Button variant="link" className="text-primary h-auto p-0">{t('settings.contactSupport')}</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── ÉQUIPE ── */}
        <TabsContent value="equipe" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader icon={Users} title="Équipe du Salon" description="Gérez les membres de votre équipe et leurs photos de profil." />
            <Button className="gradient-primary rounded-xl font-bold gap-2" onClick={() => setShowAddStaffModal(true)}>
              <UserPlus className="h-4 w-4" />
              {language === 'fr' ? 'Ajouter un collaborateur' : 'Add Team Member'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staff.map(member => (
              <Card key={member._id || member._id} className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <CardDescription>{member.role === 'owner' ? 'Propriétaire' : 'Membre de l\'équipe'}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 relative group">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Fake invisible input overlay for simplified avatar update logic via ImageUpload component pattern? No, use ImageUpload component directly. */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageUpload
                        value={member.avatarUrl || ''}
                        onChange={async (url) => {
                          try {
                            await api.updateStaff(salon.id || (salon as any)._id, member._id || member._id as string, { avatarUrl: url as string } as any);
                            toast({ title: '✅ Succès', description: 'Photo mise à jour' });
                            refetch();
                          } catch (err) {
                            toast({ title: '❌ Erreur', description: 'Erreur lors de la mise à jour', variant: 'destructive' });
                          }
                        }}
                        label="Upload"
                        className="w-full h-full opacity-0 absolute cursor-pointer"
                      />
                      <ImageIcon className="text-white h-6 w-6 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.telephone || 'Aucun numéro'}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setEditingStaffAvail(member)}
                      className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 hover:text-primary mt-2 gap-1.5 h-8 font-semibold text-xs"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {language === 'fr' ? 'Horaires & Dispo' : 'Hours & Availability'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── MÉDIAS & GALERIE ── */}
        <TabsContent value="medias" className="space-y-6">
          <SectionHeader icon={ImageIcon} title="Galerie & Médias" description="Gérez le logo, la bannière et les photos de présentation de votre salon." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">Logo du Salon</CardTitle>
                <CardDescription>Format recommandé: Carré (1:1), max 5MB</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={salon.logoUrl || ''}
                  onChange={async (url) => {
                    await updateSalon({ logoUrl: url as string } as any);
                    toast({ title: '✅ Succès', description: 'Logo mis à jour' });
                  }}
                  label="Changer le logo"
                />
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">Bannière</CardTitle>
                <CardDescription>Format recommandé: Paysage (16:9), max 5MB</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={salon.bannerUrl || ''}
                  onChange={async (url) => {
                    await updateSalon({ bannerUrl: url as string } as any);
                    toast({ title: '✅ Succès', description: 'Bannière mise à jour' });
                  }}
                  label="Changer la bannière"
                />
              </CardContent>
            </Card>

            <Card className="card-shadow md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">Galerie Photos</CardTitle>
                <CardDescription>Ajoutez des photos de votre salon, de vos réalisations, etc. (Max 10 photos)</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={salon.galleryUrls || []}
                  onChange={async (urls) => {
                    await updateSalon({ galleryUrls: urls as string[] } as any);
                    toast({ title: '✅ Succès', description: 'Galerie mise à jour' });
                  }}
                  multiple={true}
                  label="Ajouter des photos à la galerie"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── APPARENCE ── */}
        <TabsContent value="apparence" className="space-y-6">
          <SectionHeader icon={Palette} title="Apparence & Thème" description="Personnalisez les couleurs et le thème visuel de votre application." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" /> Mode d'Affichage
                </CardTitle>
                <CardDescription>Choisissez entre un thème clair, sombre, ou basé sur le système.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className={cn("flex-1 h-20 flex flex-col gap-2", theme === 'light' && "gradient-primary border-none text-white")}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-6 w-6" />
                  <span>Clair</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className={cn("flex-1 h-20 flex flex-col gap-2", theme === 'dark' && "gradient-primary border-none text-white")}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-6 w-6" />
                  <span>Sombre</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className={cn("flex-1 h-20 flex flex-col gap-2", theme === 'system' && "gradient-primary border-none text-white")}
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-6 w-6" />
                  <span>Système</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" /> Couleur Principale
                </CardTitle>
                <CardDescription>Sélectionnez la couleur d'accentuation de votre espace.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                {[
                  { id: 'rose', name: 'Rose', class: 'bg-[#e11d48]' },
                  { id: 'blue', name: 'Bleu', class: 'bg-[#2563eb]' },
                  { id: 'green', name: 'Vert', class: 'bg-[#16a34a]' },
                  { id: 'orange', name: 'Orange', class: 'bg-[#ea580c]' },
                  { id: 'zinc', name: 'Gris', class: 'bg-[#18181b] dark:bg-[#fafafa]' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id as any)}
                    className={cn(
                      "relative h-14 w-14 rounded-full flex flex-col items-center justify-center border-2 transition-all",
                      color === c.id ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-full shadow-inner", c.class)} />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABONNEMENT ── */}
        <TabsContent value="abonnement" className="space-y-8">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-8 border border-primary/20 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-2">
                <Badge className={cn("px-4 py-1 text-sm font-semibold mb-2", getPlanColor(plan.name))}>{t('settings.planCurrent').toUpperCase()}</Badge>
                <h2 className="text-3xl font-bold">{t('settings.planUsage', { plan: plan.label })}</h2>
                <p className="text-muted-foreground max-w-md">{t('settings.planUnlock')}</p>
              </div>
              <div className="p-2 rounded-lg bg-background border">
                <p className="text-muted-foreground text-xs">Analytics</p>
                <p className="font-bold capitalize">{plan.analyticsLevel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {plan.automationEnabled && <Badge variant="secondary" className="text-[10px]">🤖 Automation</Badge>}
              {plan.exportEnabled && <Badge variant="secondary" className="text-[10px]">📊 Export</Badge>}
              {plan.multiBranchEnabled && <Badge variant="secondary" className="text-[10px]">🏢 Multi-branches</Badge>}
              {plan.loyaltyRulesEnabled && <Badge variant="secondary" className="text-[10px]">⭐ Règles fidélité</Badge>}
              {plan.prioritySupport && <Badge variant="secondary" className="text-[10px]">🎯 Support prioritaire</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Contactez LeaderBright pour changer de plan' : 'Contact LeaderBright to change your plan'}
            </p>
          </div>
        </TabsContent>

        {/* Language */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-info" />
              <CardTitle>{t('settings.language')}</CardTitle>
            </div>
            <CardDescription>{t('settings.languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <LanguageToggle />
          </CardContent>
        </Card>

        {/* Fidélité config */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent" />
              <CardTitle>{t('settings.loyaltyProgram')}</CardTitle>
            </div>
            <CardDescription>{t('settings.loyaltyConfig')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...fideliteForm}>
              <form onSubmit={fideliteForm.handleSubmit(onFideliteSubmit)} className="space-y-4">
                <FormField
                  control={fideliteForm.control}
                  name="visitesRequises"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.visitsForDiscount')}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>{t('settings.visitsForDiscountDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fideliteForm.control}
                  name="reductionPourcentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.discountPercent')}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fideliteForm.control}
                  name="visitesVIP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.visitsForVip')}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>{t('settings.visitsForVipDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gradient-primary">{t('settings.save')}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="card-shadow border-accent/20">
          <CardHeader><CardTitle className="text-base">{t('settings.howItWorks')}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('settings.loyaltyExpl1')}</p>
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p>{t('settings.loyaltyStep1')}</p>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p>{t('settings.loyaltyStep2', { visits: salon.configFidelite?.visitesRequises })}</p>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                <p>{t('settings.loyaltyStep3')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* ── RAPPELS ── */}
        <TabsContent value="notifications" className="space-y-6">
          <SectionHeader icon={Bell} title={t('settings.autoReminders')} description={t('settings.autoRemindersDesc')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="card-shadow border-orange-500/20">
              <CardHeader className="bg-orange-500/5">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" /> {t('settings.delayConfig')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!editingRappels ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><p className="font-bold">{t('settings.inactivityDelay')}</p><p className="text-xs text-muted-foreground">{t('settings.inactivityDelayDesc')}</p></div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">{salon.joursRappelInactivite} {t('common.days')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="font-bold">{t('settings.followUpDelay')}</p><p className="text-xs text-muted-foreground">{t('settings.followUpDelayDesc')}</p></div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">{salon.joursRappelSuivi} {t('common.days')}</Badge>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full gap-2" onClick={() => setEditingRappels(true)}><Edit className="h-4 w-4" /> {t('settings.modifyDelays')}</Button>
                  </div>
                ) : (
                  <Form {...rappelForm}>
                    <form onSubmit={rappelForm.handleSubmit(onRappelSubmit)} className="space-y-5">
                      <FormField control={rappelForm.control} name="joursRappelInactivite" render={({ field }) => (
                        <FormItem><FormLabel>{t('settings.daysBeforeInactivity')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>{t('settings.inactivityHelp')}</FormDescription><FormMessage /></FormItem>
                      )} />
                      <FormField control={rappelForm.control} name="joursRappelSuivi" render={({ field }) => (
                        <FormItem><FormLabel>{t('settings.daysForFollowUp')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>{t('settings.followUpHelp')}</FormDescription><FormMessage /></FormItem>
                      )} />
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingRappels(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" className="gradient-primary flex-1">{t('common.save')}</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 text-sm">
              <div className="p-6 rounded-2xl bg-muted/40 border space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> {t('settings.howItWorks')}</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p><strong>{t('settings.clientFollowUp')} :</strong> {t('settings.remindersStep1', { days: salon.joursRappelSuivi })}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <p><strong>{t('settings.inactivity')} :</strong> {t('settings.remindersStep2', { days: salon.joursRappelInactivite })}</p>
                  </div>
                </div>
              </div>
              <Card className="card-shadow border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-bold"><Zap className="h-4 w-4" /> {t('settings.marketingTip')}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.marketingTipDesc')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent >

    {/* ── DISPONIBILITÉ ── */ }
    < TabsContent value = "disponibilite" className = "space-y-6 animate-in fade-in-50 duration-300" >
          <SectionHeader
            icon={Clock}
            title={t('settings.availability')}
            description={t('settings.availabilityDesc')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 card-shadow overflow-hidden bg-card/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {language === 'fr' ? 'Horaires d\'ouverture hebdomadaires' : 'Weekly Opening Hours'}
                </CardTitle>
                <CardDescription>
                  {language === 'fr'
                    ? 'Définissez les jours et heures où votre salon accueille des clients.'
                    : 'Set the days and hours when your salon is open for clients.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="divide-y divide-border/60">
                  {daysOrder.map(day => {
                    const dayAvailability = availability[day] || { open: false, start: '08:00', end: '19:00' };
                    return (
                      <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base capitalize min-w-[100px] text-foreground">
                            {t(`settings.day.${day}`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDay(day)}
                            className={cn(
                              "relative inline-flex h-7 w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent transition-all duration-300 font-bold text-[10px] uppercase tracking-wider shadow-inner",
                              dayAvailability.open
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {dayAvailability.open ? t('settings.open') : t('settings.closed')}
                          </button>
                        </div>

                        {dayAvailability.open ? (
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={dayAvailability.start}
                                onValueChange={(val) => handleTimeChange(day, 'start', val)}
                              >
                                <SelectTrigger className="h-9 w-24 rounded-xl bg-muted/30 border-none shadow-inner font-bold text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-xl border-none shadow-2xl">
                                  {timeOptions.map((tOpt) => (
                                    <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-semibold">{tOpt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-muted-foreground font-semibold px-0.5">{language === 'fr' ? 'à' : 'to'}</span>
                              <Select
                                value={dayAvailability.end}
                                onValueChange={(val) => handleTimeChange(day, 'end', val)}
                              >
                                <SelectTrigger className="h-9 w-24 rounded-xl bg-muted/30 border-none shadow-inner font-bold text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-xl border-none shadow-2xl">
                                  {timeOptions.map((tOpt) => (
                                    <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-semibold">{tOpt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyHours(day)}
                              className="rounded-xl text-primary hover:bg-primary/5 hover:text-primary gap-1 px-2.5 h-9"
                              title={language === 'fr' ? "Copier ces horaires sur les autres jours ouverts" : "Copy these hours to other open days"}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'fr' ? 'Copier' : 'Copy'}</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50 italic py-2 sm:py-0 pr-4">
                            {language === 'fr' ? 'Salon fermé' : 'Salon closed'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button
                    onClick={handleSaveAvailability}
                    disabled={isSavingAvailability}
                    className="gradient-primary px-8 rounded-xl font-bold flex items-center gap-2 h-11"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingAvailability ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-muted/40 border space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  {language === 'fr' ? 'Ergonomie & Calendrier' : 'Ergonomics & Calendar'}
                </h4>
                <div className="space-y-3.5 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    {language === 'fr'
                      ? 'Ces réglages de disponibilité contrôlent en temps réel la prise de rendez-vous :'
                      : 'These availability settings control real-time appointment scheduling:'}
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-1">
                    <li>
                      <strong>{language === 'fr' ? 'Jours fermés :' : 'Closed days:'}</strong>{' '}
                      {language === 'fr'
                        ? 'La prise de rendez-vous sera bloquée et le système signalera clairement que le salon est fermé.'
                        : 'Appointments will be blocked and the system will show that the salon is closed.'}
                    </li>
                    <li>
                      <strong>{language === 'fr' ? 'Limites horaires :' : 'Hour limits:'}</strong>{' '}
                      {language === 'fr'
                        ? 'Seuls les créneaux compris dans l\'intervalle configuré (ex: 08:30 à 19:00) seront sélectionnables.'
                        : 'Only slots within the configured range (e.g. 08:30 to 19:00) will be selectable.'}
                    </li>
                    <li>
                      <strong>{language === 'fr' ? 'Copie rapide :' : 'Quick copy:'}</strong>{' '}
                      {language === 'fr'
                        ? 'Utilisez le bouton "Copier" pour appliquer les horaires d\'une journée à toute votre semaine.'
                        : 'Use the "Copy" button to apply one day\'s hours to your entire week.'}
                    </li>
                  </ul>
                </div>
              </div>

              <Card className="card-shadow border-primary/20 bg-primary/5">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sparkles className="h-4 w-4" />
                    {language === 'fr' ? 'Personnalisation dynamique' : 'Dynamic Personalization'}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === 'fr'
                      ? 'Ajustez les heures en fonction de vos pics d\'activité (ex: fermer plus tôt le lundi, prolonger le samedi soir) pour maximiser vos réservations.'
                      : 'Adjust hours based on your activity peaks (e.g. close earlier on Mondays, extend Saturday nights) to maximize bookings.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent >

    {/* ── VERSEMENTS & PAYMENTS ── */ }
    < TabsContent value = "payments" className = "space-y-6 animate-in fade-in-50 duration-300" >
          <SectionHeader
            icon={CreditCard}
            title={language === 'fr' ? 'Versements & Comptes de Paiement' : 'Payouts & Payment Accounts'}
            description={language === 'fr' 
              ? 'Configurez le compte Mobile Money (MOMO) sur lequel vous souhaitez recevoir automatiquement les paiements des réservations de vos clients.'
              : 'Configure the Mobile Money (MOMO) account where you wish to automatically receive client booking payments.'}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 card-shadow overflow-hidden bg-card/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {language === 'fr' ? 'Configuration de réception Mobile Money' : 'Mobile Money Payout Setup'}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPaymentConfig(!editingPaymentConfig)} className="gap-2">
                    {editingPaymentConfig ? <><X className="h-4 w-4" /> {t('common.cancel')}</> : <><Edit className="h-4 w-4" /> {t('common.edit')}</>}
                  </Button>
                </div>
                <CardDescription>
                  {language === 'fr'
                    ? 'Veuillez renseigner un numéro valide doté d\'un compte Mobile Money actif.'
                    : 'Please specify a valid phone number with an active Mobile Money account.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!editingPaymentConfig ? (
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/45 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'fr' ? 'Compte Principal (Mobile Money)' : 'Primary Account (Mobile Money)'}
                      </h4>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="font-medium text-sm text-muted-foreground">Opérateur</span>
                        <Badge variant="secondary" className="uppercase font-bold">
                          {salon.paymentConfig?.payoutOperator || (language === 'fr' ? 'Non configuré' : 'Not configured')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="font-medium text-sm text-muted-foreground">Numéro de Versement</span>
                        <span className="font-bold text-foreground">
                          {salon.paymentConfig?.payoutMomoNumber || (language === 'fr' ? 'Aucun numéro' : 'No number')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="font-medium text-sm text-muted-foreground">Titulaire du Compte</span>
                        <span className="font-bold text-foreground text-sm">
                          {salon.paymentConfig?.payoutMomoName || (language === 'fr' ? 'Non spécifié' : 'Not specified')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/45 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'fr' ? 'Moyens de Paiement Dédiés Additionnels' : 'Additional Dedicated Payout Methods'}
                      </h4>

                      {/* MTN Dédié */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-border/50 gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            MTN Mobile Money
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {language === 'fr' ? 'Titulaire : ' : 'Holder: '}
                            <span className="font-medium">{salon.paymentConfig?.payoutMtnName || (language === 'fr' ? 'Non défini' : 'Not defined')}</span>
                          </div>
                        </div>
                        <span className="font-bold text-sm font-mono bg-background px-2.5 py-1 rounded-lg border border-border/50">
                          {salon.paymentConfig?.payoutMtnNumber || (language === 'fr' ? 'Non configuré' : 'Not configured')}
                        </span>
                      </div>

                      {/* Orange Dédié */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-border/50 gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            Orange Money
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {language === 'fr' ? 'Titulaire : ' : 'Holder: '}
                            <span className="font-medium">{salon.paymentConfig?.payoutOrangeName || (language === 'fr' ? 'Non défini' : 'Not defined')}</span>
                          </div>
                        </div>
                        <span className="font-bold text-sm font-mono bg-background px-2.5 py-1 rounded-lg border border-border/50">
                          {salon.paymentConfig?.payoutOrangeNumber || (language === 'fr' ? 'Non configuré' : 'Not configured')}
                        </span>
                      </div>

                      {/* Wave Dédié */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            Wave
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {language === 'fr' ? 'Titulaire : ' : 'Holder: '}
                            <span className="font-medium">{salon.paymentConfig?.payoutWaveName || (language === 'fr' ? 'Non défini' : 'Not defined')}</span>
                          </div>
                        </div>
                        <span className="font-bold text-sm font-mono bg-background px-2.5 py-1 rounded-lg border border-border/50">
                          {salon.paymentConfig?.payoutWaveNumber || (language === 'fr' ? 'Non configuré' : 'Not configured')}
                        </span>
                      </div>
                    </div>

                    {!salon.paymentConfig?.payoutMomoNumber && !salon.paymentConfig?.payoutMtnNumber && (
                      <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>{language === 'fr' ? 'Action requise : ' : 'Action required: '}</strong>
                          {language === 'fr' 
                            ? 'Aucun compte MTN Mobile Money n\'est configuré pour recevoir vos versements de réservations. Veuillez en ajouter un.'
                            : 'No MTN Mobile Money account configured to receive payouts. Please configure one.'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Form {...paymentConfigForm}>
                    <form onSubmit={paymentConfigForm.handleSubmit(onPaymentConfigSubmit)} className="space-y-6">
                      
                      {/* --- COMPTE PRINCIPAL --- */}
                      <div className="p-4 rounded-2xl border border-border bg-muted/10 space-y-4">
                        <h4 className="text-sm font-bold text-foreground">
                          {language === 'fr' ? '1. Compte Principal (Mobile Money)' : '1. Primary Account (Mobile Money)'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutOperator"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Opérateur principal' : 'Primary Operator'}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl h-11">
                                      <SelectValue placeholder="Opérateur..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                                    <SelectItem value="orange">Orange Money</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutMomoNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="6XXXXXXXX" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={paymentConfigForm.control}
                          name="payoutMomoName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'fr' ? 'Nom associé au compte' : 'Account Owner Name'}</FormLabel>
                              <FormControl>
                                <Input placeholder="ex: Jean Dupont" className="rounded-xl h-11" {...field} />
                              </FormControl>
                              <FormDescription>
                                {language === 'fr'
                                  ? 'Le nom complet du propriétaire du compte Mobile Money principal.'
                                  : 'Full name of the primary Mobile Money account owner.'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* --- COMPTE MTN DÉDIÉ --- */}
                      <div className="p-4 rounded-2xl border border-border bg-muted/10 space-y-4">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          {language === 'fr' ? '2. Compte MTN Mobile Money dédié' : '2. Dedicated MTN Mobile Money Account'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutMtnNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: 677XXXXXX" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutMtnName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Nom du titulaire' : 'Account Holder'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Jean Dupont" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* --- COMPTE ORANGE DÉDIÉ --- */}
                      <div className="p-4 rounded-2xl border border-border bg-muted/10 space-y-4">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          {language === 'fr' ? '3. Compte Orange Money dédié' : '3. Dedicated Orange Money Account'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutOrangeNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: 699XXXXXX" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutOrangeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Nom du titulaire' : 'Account Holder'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Jean Dupont" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* --- COMPTE WAVE DÉDIÉ --- */}
                      <div className="p-4 rounded-2xl border border-border bg-muted/10 space-y-4">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                          {language === 'fr' ? '4. Compte Wave dédié' : '4. Dedicated Wave Account'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutWaveNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Numéro de compte / téléphone' : 'Account / Phone Number'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: +2376XXXXXXXX" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentConfigForm.control}
                            name="payoutWaveName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === 'fr' ? 'Nom du titulaire' : 'Account Holder'}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Jean Dupont" className="rounded-xl h-11" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1 rounded-xl h-11" 
                          onClick={() => setEditingPaymentConfig(false)}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 rounded-xl h-11 gradient-primary shadow-md shadow-primary/20"
                        >
                          {t('common.save')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 text-sm">
              <div className="p-6 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> 
                  {language === 'fr' ? 'Sécurité & Conformité' : 'Security & Compliance'}
                </h4>
                <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>MTN MOMO / Orange Money :</strong> Les fonds collectés lors des réservations en ligne sont transférés directement vers ce compte après vérification sécurisée par nos partenaires de passerelle de paiement (PawaPay).
                  </p>
                  <p>
                    <strong>Validation rigoureuse :</strong> Tout numéro renseigné subit un test d\'intégrité de format. Assurez-vous d\'avoir l\'accès physique à la SIM associée pour confirmer les notifications de test.
                  </p>
                  <p>
                    <strong>Responsabilité :</strong> Assurez-vous que le nom du titulaire du compte MoMo correspond exactement au nom enregistré du salon pour éviter tout blocage de conformité financière (processus de vérification KYC/AML).
                  </p>
                </div>
              </div>

              <Card className="card-shadow border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle className="h-4 w-4" /> 
                    {language === 'fr' ? 'Versements Instantanés' : 'Instant Payouts'}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Les gains de vos rendez-vous payés en ligne vous sont versés instantanément ou sous 24h ouvrables selon la politique de règlement choisie lors de votre activation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent >
      </Tabs >

    {/* ── DIALOG HORAIRES STAFF ── */ }
    < Dialog open = {!!editingStaffAvail
} onOpenChange = {(open) => !open && setEditingStaffAvail(null)}>
  <DialogContent className="max-w-2xl rounded-2xl p-6 overflow-hidden bg-background">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-xl font-bold">
        <Clock className="h-5 w-5 text-primary" />
        {language === 'fr'
          ? `Horaires de ${editingStaffAvail?.name}`
          : `${editingStaffAvail?.name}'s Schedule`}
      </DialogTitle>
      <DialogDescription>
        {language === 'fr'
          ? "Définissez les plages horaires spécifiques pour ce membre de l'équipe."
          : "Define specific working hours for this team member."}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6 my-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="flex items-center space-x-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
        <Checkbox
          id="use-global-hours"
          checked={useGlobalHours}
          onCheckedChange={(checked) => {
            setUseGlobalHours(!!checked);
            if (checked) {
              setStaffAvail(defaultWeekAvailability);
            } else {
              // Try to copy current active salon hours
              setStaffAvail(availability);
            }
          }}
        />
        <label
          htmlFor="use-global-hours"
          className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {language === 'fr'
            ? "S'aligner sur les horaires d'ouverture généraux du salon"
            : "Align with the salon's general opening hours"}
        </label>
      </div>

      {!useGlobalHours && (
        <div className="divide-y divide-border/60">
          {daysOrder.map((day) => {
            const dayAvailability = staffAvail[day] || { open: false, start: '08:00', end: '19:00' };
            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base capitalize min-w-[100px] text-foreground">
                    {t(`settings.day.${day}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffAvail(prev => ({
                        ...prev,
                        [day]: {
                          ...prev[day],
                          open: !prev[day].open
                        }
                      }));
                    }}
                    className={cn(
                      "relative inline-flex h-7 w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent transition-all duration-300 font-bold text-[10px] uppercase tracking-wider shadow-inner",
                      dayAvailability.open
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {dayAvailability.open ? t('settings.open') : t('settings.closed')}
                  </button>
                </div>

                {dayAvailability.open && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={dayAvailability.start}
                      onValueChange={(val) => {
                        setStaffAvail(prev => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            start: val
                          }
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 w-24 rounded-xl bg-muted/30 border-none shadow-inner font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 rounded-xl border-none shadow-2xl bg-popover">
                        {timeOptions.map((tOpt) => (
                          <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-semibold">{tOpt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground font-semibold px-0.5">
                      {language === 'fr' ? 'à' : 'to'}
                    </span>
                    <Select
                      value={dayAvailability.end}
                      onValueChange={(val) => {
                        setStaffAvail(prev => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            end: val
                          }
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 w-24 rounded-xl bg-muted/30 border-none shadow-inner font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 rounded-xl border-none shadow-2xl bg-popover">
                        {timeOptions.map((tOpt) => (
                          <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-semibold">{tOpt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        const hoursToCopy = staffAvail[day];
                        setStaffAvail(prev => {
                          const next = { ...prev };
                          Object.keys(next).forEach(k => {
                            if (k !== day && next[k].open) {
                              next[k] = {
                                ...next[k],
                                start: hoursToCopy.start,
                                end: hoursToCopy.end
                              };
                            }
                          });
                          return next;
                        });
                      }}
                      className="rounded-xl text-primary hover:bg-primary/5 hover:text-primary gap-1 px-2.5 h-9"
                      title={language === 'fr' ? "Copier ces horaires sur les autres jours ouverts" : "Copy these hours to other open days"}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'fr' ? 'Copier' : 'Copy'}</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    <DialogFooter className="border-t pt-4 gap-2">
      <Button
        variant="outline"
        type="button"
        onClick={() => setEditingStaffAvail(null)}
        className="rounded-xl font-bold"
      >
        {language === 'fr' ? 'Annuler' : 'Cancel'}
      </Button>
      <Button
        type="button"
        onClick={async () => {
          if (!editingStaffAvail) return;
          try {
            const payload = {
              availability: useGlobalHours ? null : staffAvail
            };
            await api.updateStaff(
              salon.id || (salon as any)._id,
              editingStaffAvail._id || (editingStaffAvail as any).id,
              payload as any
            );
            toast({
              title: '✅ ' + (t('common.success') || 'Succès'),
              description: language === 'fr'
                ? 'Disponibilité du collaborateur mise à jour.'
                : 'Staff availability updated successfully.',
            });
            setEditingStaffAvail(null);
            refetch();
          } catch (err) {
            toast({
              title: '❌ ' + (t('common.error') || 'Erreur'),
              description: language === 'fr' ? 'Erreur de mise à jour.' : 'Failed to update schedule.',
              variant: 'destructive',
            });
          }
        }}
        className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95"
      >
        {language === 'fr' ? 'Enregistrer' : 'Save'}
      </Button>
    </DialogFooter>
  </DialogContent>
      </Dialog >

  { selectedUpgradePlan && (
    <PaymentModal
      open={isPaymentModalOpen}
      onOpenChange={setIsPaymentModalOpen}
      planKey={selectedUpgradePlan}
      salonId={salon.id || (salon as any)._id}
    />
  )}

{/* ── DIALOG AJOUT STAFF ── */ }
<Dialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
  <DialogContent className="max-w-md bg-background rounded-2xl p-6">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold">
        {language === 'fr' ? 'Ajouter un collaborateur' : 'Add Team Member'}
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        {language === 'fr'
          ? 'Créez un compte pour un membre de votre équipe. Il pourra se connecter avec ses identifiants.'
          : 'Create an account for a team member. They will be able to log in with their credentials.'}
      </DialogDescription>
    </DialogHeader>

    {limitReached ? (
      <div className="space-y-4 py-4 text-center">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-lg">
            {language === 'fr' ? 'Limite de collaborateurs atteinte' : 'Staff Limit Reached'}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'fr'
              ? `Votre forfait actuel vous limite à ${limit} collaborateurs.`
              : `Your current plan limits you to ${limit} staff members.`}
          </p>
        </div>
        <Button
          type="button"
          className="w-full gradient-primary rounded-xl font-bold mt-2"
          onClick={() => {
            setShowAddStaffModal(false);
            const exploreBtn = document.querySelector('[data-value="abonnement"]') as HTMLButtonElement;
            if (exploreBtn) exploreBtn.click();
          }}
        >
          {language === 'fr' ? 'Découvrir les formules' : 'Explore Plans'}
        </Button>
      </div>
    ) : (
      <form onSubmit={handleAddStaffSubmit} className="space-y-4 py-2">
        <div className="space-y-1">
          <Label htmlFor="staff-name" className="text-sm font-medium">
            {language === 'fr' ? 'Nom complet *' : 'Full Name *'}
          </Label>
          <Input
            id="staff-name"
            placeholder={language === 'fr' ? 'Ex: Marie Dubois' : 'e.g. Jane Doe'}
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="staff-email" className="text-sm font-medium">
            {language === 'fr' ? 'Adresse e-mail *' : 'Email Address *'}
          </Label>
          <Input
            id="staff-email"
            type="email"
            placeholder={language === 'fr' ? 'Ex: marie@mon-salon.com' : 'e.g. jane@salon.com'}
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="staff-phone" className="text-sm font-medium">
            {language === 'fr' ? 'Téléphone' : 'Phone'}
          </Label>
          <Input
            id="staff-phone"
            placeholder="Ex: +237 6..."
            value={newStaffPhone}
            onChange={(e) => setNewStaffPhone(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="staff-password" className="text-sm font-medium">
            {language === 'fr' ? 'Mot de passe *' : 'Password *'}
          </Label>
          <Input
            id="staff-password"
            type="password"
            placeholder={language === 'fr' ? 'Minimum 6 caractères' : 'Min 6 characters'}
            value={newStaffPassword}
            onChange={(e) => setNewStaffPassword(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setShowAddStaffModal(false)}
            disabled={isAddingStaff}
          >
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            className="gradient-primary font-bold rounded-xl"
            disabled={isAddingStaff}
          >
            {isAddingStaff ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'fr' ? 'Création...' : 'Creating...'}
              </>
            ) : (
              language === 'fr' ? 'Créer le compte' : 'Create Account'
            )}
          </Button>
        </DialogFooter>
      </form>
    )}
  </DialogContent>
</Dialog>
    </div >
  );
}
