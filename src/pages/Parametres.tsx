import React, { useEffect, useState } from 'react';
import {
  Building2, Users, Clock, Image as ImageIcon, Palette, Crown, Gift, Bell, CreditCard,
  AlertTriangle, Loader2, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSalon } from '@/hooks/useSalon';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { PlanType } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Internal & Modular Components
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { TeamSettingsTab } from '@/components/settings/TeamSettingsTab';
import { MediaSettingsTab } from '@/components/settings/MediaSettingsTab';
import { AppearanceSettingsTab } from '@/components/settings/AppearanceSettingsTab';
import { SubscriptionSettingsTab } from '@/components/settings/SubscriptionSettingsTab';
import { LoyaltySettingsTab } from '@/components/settings/LoyaltySettingsTab';
import { NotificationsSettingsTab } from '@/components/settings/NotificationsSettingsTab';
import { PayoutsSettingsTab } from '@/components/settings/PayoutsSettingsTab';
import { BookingSettingsCard } from '@/components/settings/BookingSettingsCard';
import { PlanComparisonDialog } from '@/components/settings/PlanComparisonDialog';
import PaymentModal from '@/components/settings/PaymentModal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { User } from '@/types';
import { useSearchParams } from 'react-router-dom';
import { TourPointer } from '@/components/ui/TourPointer';

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

const daysOrder = ["1", "2", "3", "4", "5", "6", "0"];
const timeOptions = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function Parametres() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabParam === 'subscription' || tabParam === 'abonnement') return 'abonnement';
    return tabParam || 'general';
  };

  const { salon, staff, updateSalon, updateConfigFidelite, refetch } = useSalon();
  const { t, language } = useLanguage();
  const { plan, getStaffLimit } = useSubscriptionPlan();

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (tabParam === 'subscription' || tabParam === 'abonnement') {
      setActiveTab('abonnement');
    } else if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Modals for Staff Management
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffAvatarUrl, setNewStaffAvatarUrl] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'co_owner'>('staff');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Edit Staff Modal
  const [editingStaffDetails, setEditingStaffDetails] = useState<User | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffAvatarUrl, setEditStaffAvatarUrl] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<'staff' | 'co_owner' | 'owner'>('staff');
  const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);

  // Staff Working Hours Modal
  const [editingStaffAvail, setEditingStaffAvail] = useState<User | null>(null);
  const [staffAvail, setStaffAvail] = useState<WeekAvailability>(defaultWeekAvailability);
  const [useGlobalHours, setUseGlobalHours] = useState(true);

  const staffLimit = getStaffLimit();
  const limitReached = staffLimit !== null && staff.length >= staffLimit;

  const handleOpenStaffAvail = (staffMember: User) => {
    setEditingStaffAvail(staffMember);
    const existingAvail = (staffMember as any).availability;
    if (existingAvail && Object.keys(existingAvail).length > 0) {
      setStaffAvail(existingAvail);
      setUseGlobalHours(false);
    } else {
      setStaffAvail(salon?.disponibilite || defaultWeekAvailability);
      setUseGlobalHours(true);
    }
  };

  const handleOpenEditStaffDetails = (staffMember: User) => {
    setEditingStaffDetails(staffMember);
    setEditStaffName(staffMember.name || '');
    setEditStaffEmail(staffMember.email || '');
    setEditStaffPhone(staffMember.telephone || '');
    setEditStaffAvatarUrl(staffMember.avatarUrl || (staffMember as any).photoUrl || (staffMember as any).avatar || '');
    setEditStaffRole((staffMember.role as any) === 'co_owner' ? 'co_owner' : (staffMember.role as any) === 'owner' ? 'owner' : 'staff');
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;

    if (limitReached) {
      toast({
        title: '❌ ' + (t('common.error') || 'Limite atteinte'),
        description: language === 'fr'
          ? `Votre plan actuel limite votre équipe à ${staffLimit} collaborateurs. Veuillez mettre à niveau.`
          : `Your current plan limits your team to ${staffLimit} staff members. Please upgrade.`,
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
        avatarUrl: newStaffAvatarUrl,
        role: newStaffRole,
      } as any);

      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: newStaffRole === 'co_owner'
          ? (language === 'fr' ? 'Co-propriétaire ajouté avec succès !' : 'Co-owner added successfully!')
          : (language === 'fr' ? 'Collaborateur ajouté avec succès !' : 'Team member added successfully!'),
      });

      setShowAddStaffModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffPassword('');
      setNewStaffAvatarUrl('');
      setNewStaffRole('staff');
      refetch();
    } catch (err: any) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: err.message || (language === 'fr' ? 'Échec de la création' : 'Failed to create staff'),
        variant: 'destructive',
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon || !editingStaffDetails) return;

    setIsUpdatingStaff(true);
    try {
      await api.updateStaff(salon.id || (salon as any)._id, (editingStaffDetails as any)._id || editingStaffDetails.id, {
        name: editStaffName,
        email: editStaffEmail,
        telephone: editStaffPhone,
        avatarUrl: editStaffAvatarUrl,
        role: editStaffRole,
      } as any);

      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr'
          ? 'Membre d\'équipe mis à jour avec succès !'
          : 'Team member updated successfully!',
      });

      setEditingStaffDetails(null);
      refetch();
    } catch (err: any) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: err.message || (language === 'fr' ? 'Échec de la mise à jour' : 'Failed to update team member'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStaff(false);
    }
  };

  const handleUpgradePlan = (newPlan: PlanType) => {
    setSelectedUpgradePlan(newPlan);
    setIsPaymentModalOpen(true);
  };

  if (!salon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner with Salon Profile */}
      <SettingsHeader
        salon={salon}
        plan={plan.name}
        staffCount={staff.length}
        staffLimit={staffLimit}
        language={language}
        onExplorePlans={() => setActiveTab('abonnement')}
      />

      {/* Tabs Navigation & Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-muted/40 p-1.5 rounded-2xl overflow-x-auto scrollbar-none border border-border/50">
          <TabsList className="bg-transparent flex w-max min-w-full justify-start gap-1 p-0 h-auto">
            <TourPointer stepId="step-1" title="Étape 1 : Paramètres du Salon" description="Renseignez le profil de votre établissement et l'équipe">
              <TabsTrigger
                value="general"
                className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                <Building2 className="h-4 w-4" /> {t('settings.general')}
              </TabsTrigger>
            </TourPointer>

            <TabsTrigger
              value="equipe"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4" /> Équipe ({staff.length})
            </TabsTrigger>

            <TabsTrigger
              value="disponibilite"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Clock className="h-4 w-4" /> {t('settings.availability')}
            </TabsTrigger>

            <TabsTrigger
              value="medias"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <ImageIcon className="h-4 w-4" /> Galerie & Médias
            </TabsTrigger>

            <TabsTrigger
              value="apparence"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="h-4 w-4" /> Apparence
            </TabsTrigger>

            <TabsTrigger
              value="abonnement"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Crown className="h-4 w-4" /> {t('settings.subscription')}
            </TabsTrigger>

            <TabsTrigger
              value="fidelite"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Gift className="h-4 w-4" /> {t('settings.loyalty')}
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Bell className="h-4 w-4" /> {t('settings.communications')}
            </TabsTrigger>

            <TabsTrigger
              value="payments"
              className="gap-2 rounded-xl px-4 py-2.5 font-bold text-xs shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <CreditCard className="h-4 w-4" /> {language === 'fr' ? 'Versements' : 'Payouts'}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Général */}
        <TabsContent value="general">
          <GeneralSettingsTab
            salon={salon}
            updateSalon={updateSalon}
            t={t}
            language={language}
          />
        </TabsContent>

        {/* Tab 2: Équipe */}
        <TabsContent value="equipe">
          <TeamSettingsTab
            salon={salon}
            staff={staff}
            staffLimit={staffLimit}
            language={language}
            t={t}
            onOpenAddStaff={() => setShowAddStaffModal(true)}
            onEditStaffAvail={handleOpenStaffAvail}
            onEditStaffDetails={handleOpenEditStaffDetails}
            onRefetch={refetch}
            onExplorePlans={() => setActiveTab('abonnement')}
          />
        </TabsContent>

        {/* Tab 3: Disponibilité / Horaires Salon */}
        <TabsContent value="disponibilite">
          <BookingSettingsCard
            salon={salon}
            onUpdate={updateSalon}
          />
        </TabsContent>

        {/* Tab 4: Médias / Galerie */}
        <TabsContent value="medias">
          <MediaSettingsTab
            salon={salon}
            updateSalon={updateSalon}
            language={language}
            t={t}
          />
        </TabsContent>

        {/* Tab 5: Apparence & Thèmes */}
        <TabsContent value="apparence">
          <AppearanceSettingsTab
            language={language}
            t={t}
          />
        </TabsContent>

        {/* Tab 6: Abonnement & Tarifs */}
        <TabsContent value="abonnement">
          <SubscriptionSettingsTab
            salon={salon}
            currentPlanKey={plan.name}
            language={language}
            t={t}
            onUpgrade={handleUpgradePlan}
            onOpenComparison={() => setIsComparisonOpen(true)}
          />
        </TabsContent>

        {/* Tab 7: Fidélité */}
        <TabsContent value="fidelite">
          <LoyaltySettingsTab
            salon={salon}
            updateConfigFidelite={updateConfigFidelite}
            updateSalon={updateSalon}
            language={language}
            t={t}
          />
        </TabsContent>

        {/* Tab 8: Notifications & Relances */}
        <TabsContent value="notifications">
          <NotificationsSettingsTab
            salon={salon}
            updateSalon={updateSalon}
            language={language}
            t={t}
          />
        </TabsContent>

        {/* Tab 9: Versements Mobile Money */}
        <TabsContent value="payments">
          <PayoutsSettingsTab
            salon={salon}
            updateSalon={updateSalon}
            language={language}
            t={t}
            onRefetch={refetch}
          />
        </TabsContent>
      </Tabs>

      {/* --- DIALOG MODALE D'ÉDITION DES HORAIRES STAFF --- */}
      <Dialog open={!!editingStaffAvail} onOpenChange={(open) => !open && setEditingStaffAvail(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 overflow-hidden bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-primary" />
              {language === 'fr'
                ? `Horaires de ${editingStaffAvail?.name}`
                : `${editingStaffAvail?.name}'s Schedule`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {language === 'fr'
                ? "Définissez les plages horaires spécifiques pour ce membre de l'équipe."
                : "Define specific working hours for this team member."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 my-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex items-center space-x-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <Checkbox
                id="use-global-hours"
                checked={useGlobalHours}
                onCheckedChange={(checked) => {
                  setUseGlobalHours(!!checked);
                  if (checked) {
                    setStaffAvail(salon.disponibilite || defaultWeekAvailability);
                  }
                }}
              />
              <label
                htmlFor="use-global-hours"
                className="text-xs font-semibold cursor-pointer"
              >
                {language === 'fr'
                  ? "S'aligner sur les horaires d'ouverture généraux du salon"
                  : "Align with the salon's general opening hours"}
              </label>
            </div>

            {!useGlobalHours && (
              <div className="space-y-2.5">
                {daysOrder.map((day) => {
                  const dayAvailability = staffAvail[day] || { open: false, start: '08:00', end: '19:00' };
                  return (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 gap-3"
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                        <span className="font-extrabold text-xs sm:text-sm capitalize min-w-[90px] text-slate-800 dark:text-slate-100">
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
                            "relative inline-flex h-8 w-24 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 font-extrabold text-xs tracking-wider shadow-xs",
                            dayAvailability.open
                              ? "bg-emerald-600 dark:bg-emerald-500 text-white border-transparent shadow-emerald-500/20"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700"
                          )}
                        >
                          {dayAvailability.open ? '🟢 ' + t('settings.open') : '🔴 ' + t('settings.closed')}
                        </button>
                      </div>

                      {dayAvailability.open && (
                        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
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
                              <SelectTrigger className="h-9 w-24 rounded-xl bg-background dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-foreground dark:text-slate-100 font-extrabold text-xs shadow-xs focus:ring-2 focus:ring-rose-500/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl bg-popover text-foreground">
                                {timeOptions.map((tOpt) => (
                                  <SelectItem key={tOpt} value={tOpt} className="rounded-lg text-xs font-bold">{tOpt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <span className="text-xs text-muted-foreground font-bold px-0.5">
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
                            className="rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1 px-2.5 h-9 shrink-0 font-extrabold text-xs"
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
              className="rounded-2xl font-semibold"
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
                    (editingStaffAvail as any)._id || editingStaffAvail.id,
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
              className="rounded-2xl font-bold gradient-primary shadow-md"
            >
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG MODALE D'AJOUT COLLABORATEUR --- */}
      <Dialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
        <DialogContent className="max-w-md bg-background rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {language === 'fr' ? 'Ajouter un collaborateur' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === 'fr'
                ? 'Créez un compte pour un membre de votre équipe. Il pourra se connecter avec ses identifiants.'
                : 'Create an account for a team member.'}
            </DialogDescription>
          </DialogHeader>

          {limitReached ? (
            <div className="space-y-4 py-4 text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base">
                  {language === 'fr' ? 'Limite de collaborateurs atteinte' : 'Staff Limit Reached'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? `Votre forfait actuel vous limite à ${staffLimit} collaborateurs.`
                    : `Your current plan limits you to ${staffLimit} staff members.`}
                </p>
              </div>
              <Button
                type="button"
                className="w-full gradient-primary rounded-2xl font-bold mt-2"
                onClick={() => {
                  setShowAddStaffModal(false);
                  setActiveTab('abonnement');
                }}
              >
                {language === 'fr' ? 'Découvrir les formules' : 'Explore Plans'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddStaffSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="staff-name" className="text-xs font-semibold">
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
                <Label htmlFor="staff-email" className="text-xs font-semibold">
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
                <Label htmlFor="staff-phone" className="text-xs font-semibold">
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
                <Label htmlFor="staff-password" className="text-xs font-semibold">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t('team.roleLabel') || (language === 'fr' ? 'Rôle & Permissions *' : 'Role & Permissions *')}
                </Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('staff')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      newStaffRole === 'staff'
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-foreground">
                      <span>👤</span> {t('team.roleStaff') || (language === 'fr' ? 'Collaborateur' : 'Staff')}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {language === 'fr' ? 'Soins & RDV uniquement' : 'Services & Bookings only'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStaffRole('co_owner')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      newStaffRole === 'co_owner'
                        ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                        : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-purple-700 dark:text-purple-300">
                      <span>👑</span> {t('team.roleCoOwner') || (language === 'fr' ? 'Co-propriétaire' : 'Co-owner')}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {language === 'fr' ? 'Accès complet d\'admin' : 'Full admin access'}
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {language === 'fr' ? 'Photo du collaborateur (optionnel)' : 'Staff Photo (optional)'}
                </Label>
                <ImageUpload
                  value={newStaffAvatarUrl}
                  onChange={(val) => setNewStaffAvatarUrl(Array.isArray(val) ? val[0] : val)}
                  aspectRatio="square"
                  label={language === 'fr' ? 'Ajouter une photo' : 'Add photo'}
                  className="w-28 h-28 mx-auto rounded-2xl border-2 border-dashed border-primary/30"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl font-semibold"
                  onClick={() => setShowAddStaffModal(false)}
                  disabled={isAddingStaff}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary font-bold rounded-2xl shadow-md"
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

      {/* --- DIALOG MODALE D'ÉDITION COLLABORATEUR --- */}
      <Dialog open={!!editingStaffDetails} onOpenChange={(open) => !open && setEditingStaffDetails(null)}>
        <DialogContent className="max-w-md bg-background rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {language === 'fr' ? 'Modifier le collaborateur' : 'Edit Team Member'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === 'fr'
                ? 'Modifiez les informations personnelles et la photo de votre collaborateur.'
                : 'Update your team member profile information and photo.'}
            </DialogDescription>
          </DialogHeader>

          {editingStaffDetails && (
            <form onSubmit={handleEditStaffSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {language === 'fr' ? 'Photo de profil' : 'Profile Photo'}
                </Label>
                <ImageUpload
                  value={editStaffAvatarUrl}
                  onChange={(val) => setEditStaffAvatarUrl(Array.isArray(val) ? val[0] : val)}
                  aspectRatio="square"
                  label={language === 'fr' ? 'Changer la photo' : 'Change photo'}
                  className="w-28 h-28 mx-auto rounded-2xl border-2 border-dashed border-primary/30"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-staff-name" className="text-xs font-semibold">
                  {language === 'fr' ? 'Nom complet *' : 'Full Name *'}
                </Label>
                <Input
                  id="edit-staff-name"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-staff-email" className="text-xs font-semibold">
                  {language === 'fr' ? 'Adresse e-mail *' : 'Email Address *'}
                </Label>
                <Input
                  id="edit-staff-email"
                  type="email"
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-staff-phone" className="text-xs font-semibold">
                  {language === 'fr' ? 'Téléphone' : 'Phone'}
                </Label>
                <Input
                  id="edit-staff-phone"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {editStaffRole !== 'owner' && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold">
                    {t('team.roleLabel') || (language === 'fr' ? 'Rôle & Permissions *' : 'Role & Permissions *')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditStaffRole('staff')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        editStaffRole === 'staff'
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1 text-foreground">
                        <span>👤</span> {t('team.roleStaff') || (language === 'fr' ? 'Collaborateur' : 'Staff')}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                        {language === 'fr' ? 'Soins & RDV uniquement' : 'Services & Bookings only'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStaffRole('co_owner')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        editStaffRole === 'co_owner'
                          ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                          : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1 text-purple-700 dark:text-purple-300">
                        <span>👑</span> {t('team.roleCoOwner') || (language === 'fr' ? 'Co-propriétaire' : 'Co-owner')}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                        {language === 'fr' ? 'Accès complet d\'admin' : 'Full admin access'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl font-semibold"
                  onClick={() => setEditingStaffDetails(null)}
                  disabled={isUpdatingStaff}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary font-bold rounded-2xl shadow-md"
                  disabled={isUpdatingStaff}
                >
                  {isUpdatingStaff ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'fr' ? 'Mise à jour...' : 'Updating...'}
                    </>
                  ) : (
                    language === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- PAYMENT MODAL & PLAN COMPARISON --- */}
      {selectedUpgradePlan && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          planKey={selectedUpgradePlan}
          salonId={salon.id || (salon as any)._id}
        />
      )}

      <PlanComparisonDialog
        open={isComparisonOpen}
        onOpenChange={setIsComparisonOpen}
        currentPlan={plan.name}
        onSelectPlan={handleUpgradePlan}
      />
    </div>
  );
}
