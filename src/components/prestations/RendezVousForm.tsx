import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';
import {
  User,
  Scissors,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  FileText,
  Users,
  AlertTriangle,
  Globe,
  Store
} from 'lucide-react';
import { useSalon } from '@/hooks/useSalon';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export type RdvFormData = {
  clientId: string;
  typePrestationId: string;
  date: string;
  heure: string;
  duree: number;
  employe?: string;
  notes?: string;
  source?: 'salon' | 'en_ligne' | 'public';
};

interface RendezVousFormProps {
  defaultDate?: string;
  defaultHeure?: string;
  defaultPrestationId?: string;
  onSubmit: (data: RdvFormData) => void;
  onCancel: () => void;
}

export function RendezVousForm({ defaultDate, defaultHeure, defaultPrestationId, onSubmit, onCancel }: RendezVousFormProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useTranslations();
  const { typesPrestations } = usePrestations();
  const { clients } = useClients();
  const { session } = useAuth();
  const { salon, staff } = useSalon();

  const rdvSchema = z.object({
    clientId: z.string().min(1, t('services.selectClient') || 'Veuillez sélectionner une cliente'),
    typePrestationId: z.string().min(1, t('services.selectPrestation') || 'Veuillez sélectionner une prestation'),
    date: z.string().min(1, t('appointments.selectDate')),
    heure: z.string().min(1, t('appointments.selectTime')),
    duree: z.coerce.number().min(15, t('appointments.minDuration')),
    employe: z.string().optional(),
    notes: z.string().optional(),
    source: z.enum(['salon', 'en_ligne', 'public']).default('salon'),
  });

  const form = useForm<RdvFormData>({
    resolver: zodResolver(rdvSchema),
    defaultValues: {
      clientId: '',
      typePrestationId: defaultPrestationId || '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      heure: defaultHeure || '09:00',
      duree: 60,
      employe: session?.userId || '',
      notes: '',
      source: 'salon',
    },
  });

  const selectedDate = form.watch('date');

  const defaultWeekAvailability = React.useMemo(() => ({
    "1": { open: true, start: "08:00", end: "19:00" }, // Lundi
    "2": { open: true, start: "08:00", end: "19:00" }, // Mardi
    "3": { open: true, start: "08:00", end: "19:00" }, // Mercredi
    "4": { open: true, start: "08:00", end: "19:00" }, // Jeudi
    "5": { open: true, start: "08:00", end: "19:00" }, // Vendredi
    "6": { open: true, start: "09:00", end: "18:00" }, // Samedi
    "0": { open: false, start: "09:00", end: "18:00" }, // Dimanche
  }), []);

  const dayOfWeek = React.useMemo(() => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate + 'T00:00:00');
    return dateObj.getDay().toString();
  }, [selectedDate]);

  const dayConfig = React.useMemo(() => {
    if (dayOfWeek === null) return null;
    const availability = salon?.availability;
    if (availability && typeof availability === 'object' && availability[dayOfWeek]) {
      return availability[dayOfWeek];
    }
    return defaultWeekAvailability[dayOfWeek as keyof typeof defaultWeekAvailability];
  }, [salon, dayOfWeek, defaultWeekAvailability]);

  const dynamicHeures = React.useMemo(() => {
    if (!dayConfig || !dayConfig.open) return [];
    const slots = [];
    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);

    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    for (let m = startMin; m <= endMin; m += 30) {
      const currentH = Math.floor(m / 60);
      const currentM = m % 60;
      slots.push(`${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`);
    }
    return slots;
  }, [dayConfig]);

  const selectedHeure = form.watch('heure');
  React.useEffect(() => {
    if (dayConfig?.open && dynamicHeures.length > 0) {
      if (!dynamicHeures.includes(selectedHeure)) {
        form.setValue('heure', dynamicHeures[0]);
      }
    }
  }, [dynamicHeures, dayConfig, selectedHeure, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 font-sans">
        {/* Client & Prestation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5 text-rose-500" />
                  {t('finances.client') || 'Cliente'}
                </FormLabel>
                <ClientSearchInput
                  clients={clients}
                  defaultValue={field.value}
                  isStaff={useAuth().session?.userRole === 'staff'}
                  onSelect={(client) => {
                    if (client === 'anonymous') {
                      field.onChange('');
                    } else {
                      field.onChange(client.id);
                    }
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="typePrestationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Scissors className="h-3.5 w-3.5 text-rose-500" />
                  Prestation
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <SelectValue placeholder="Sélectionner une prestation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl max-h-[280px]">
                    {typesPrestations.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="rounded-xl font-bold text-xs">
                        {type.nom} - <span className="text-rose-600 dark:text-rose-400">{type.prix.toLocaleString()} FCFA</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date, Heure, Durée Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <CalendarIcon className="h-3.5 w-3.5 text-rose-500" />
                  Date
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-bold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heure"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                  {t('appointments.time') || 'Heure'}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!dayConfig || !dayConfig.open}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <SelectValue placeholder={!dayConfig?.open ? t('settings.closed') : undefined} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl max-h-[250px]">
                    {dynamicHeures.map((h) => (
                      <SelectItem key={h} value={h} className="rounded-xl font-bold text-xs">{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duree"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                  Durée
                </FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
                    <SelectItem value="15" className="rounded-xl font-bold text-xs">15 min</SelectItem>
                    <SelectItem value="30" className="rounded-xl font-bold text-xs">30 min</SelectItem>
                    <SelectItem value="45" className="rounded-xl font-bold text-xs">45 min</SelectItem>
                    <SelectItem value="60" className="rounded-xl font-bold text-xs">1h</SelectItem>
                    <SelectItem value="90" className="rounded-xl font-bold text-xs">1h30</SelectItem>
                    <SelectItem value="120" className="rounded-xl font-bold text-xs">2h</SelectItem>
                    <SelectItem value="180" className="rounded-xl font-bold text-xs">3h</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!dayConfig?.open && dayOfWeek !== null && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 animate-in fade-in duration-200 text-xs font-extrabold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              {t('appointments.closedOnDay', { day: t(`settings.day.${dayOfWeek}`) }) || 'Le salon est fermé ce jour-là.'}
            </span>
          </div>
        )}

        {/* Employé & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Users className="h-3.5 w-3.5 text-rose-500" />
                  {t('services.employee') || 'Coiffeur/Employé'}
                  <span className="lowercase font-normal opacity-50 ml-1">({t('common.optional')})</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <SelectValue placeholder={t('services.employeePlaceholder') || 'Attribuer à...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl">
                    {session?.userId && !staff.find(s => s._id === session.userId) && (
                      <SelectItem value={session.userId} className="rounded-xl font-bold text-xs">{session.userName}</SelectItem>
                    )}
                    {staff.map((member) => (
                      <SelectItem key={member._id} value={member._id} className="rounded-xl font-bold text-xs">{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-rose-500" />
                  Source du RDV
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('salon')}
                      className={cn(
                        "flex items-center justify-center gap-2 h-11 rounded-2xl border text-xs font-black transition-all shadow-2xs",
                        field.value === 'salon'
                          ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white border-transparent shadow-md shadow-rose-600/20"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      <Store className="h-4 w-4" />
                      <span>Salon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('en_ligne')}
                      className={cn(
                        "flex items-center justify-center gap-2 h-11 rounded-2xl border text-xs font-black transition-all shadow-2xs",
                        field.value === 'en_ligne'
                          ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white border-transparent shadow-md shadow-rose-600/20"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      <span>En ligne</span>
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <FileText className="h-3.5 w-3.5 text-rose-500" />
                Notes (optionnel)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('appointments.notesPlaceholder') || 'Notes particulières, demandes spécifiques...'}
                  className="resize-none min-h-[70px] rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 p-3.5 text-xs font-bold focus:ring-rose-500/20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md pt-3 pb-3 border-t border-slate-200 dark:border-slate-800 z-10 flex items-center gap-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 rounded-2xl font-extrabold text-xs border-slate-200 dark:border-slate-800">
            {t('common.cancel') || 'Annuler'}
          </Button>
          <Button
            type="submit"
            disabled={!dayConfig || !dayConfig.open}
            className="flex-1 h-11 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-purple-700 disabled:opacity-50"
          >
            {t('appointments.plan') || 'Enregistrer le rendez-vous'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
