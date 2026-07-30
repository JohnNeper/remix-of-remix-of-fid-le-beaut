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
import { Client, ClientStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Phone, Calendar as CalendarIcon, Star, Users, Tag, FileText, Gift, Mail } from 'lucide-react';

const clientSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().min(8, 'Numéro de téléphone invalide'),
  email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  dateAnniversaire: z.string().optional(),
  statut: z.enum(['nouvelle', 'reguliere', 'vip']),
  notes: z.string().optional(),
  parrainId: z.string().optional(),
  groupe: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  clients?: Client[];
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export function ClientForm({ client, clients = [], onSubmit, onCancel }: ClientFormProps) {
  const { t } = useLanguage();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: client?.nom || '',
      telephone: client?.telephone || '',
      email: client?.email || '',
      dateAnniversaire: client?.dateAnniversaire || '',
      statut: client?.statut || 'nouvelle',
      notes: client?.notes || '',
      parrainId: client?.parrainId || '',
      groupe: client?.groupe || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left font-sans">
        
        {/* Nom Complet & Téléphone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <User className="h-3.5 w-3.5 text-rose-500" />
                  <span>{t('clients.name') || 'Nom complet'} *</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Marie Nguema" 
                    className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-rose-500/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-rose-500" />
                  <span>{t('clients.phone') || 'Téléphone (WhatsApp)'} *</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+237 6XX XXX XXX" 
                    className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-rose-500/20" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-rose-500" />
                  <span>Email</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t('common.optional') || 'optionnel'}</span>
              </FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="exemple@email.com" 
                  className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold focus:ring-rose-500/20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statut & Date Anniversaire */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="statut"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t('clients.status') || 'Statut'}</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="nouvelle" className="font-semibold">✨ Nouvelle</SelectItem>
                    <SelectItem value="reguliere" className="font-semibold">🌿 Régulière</SelectItem>
                    <SelectItem value="vip" className="font-semibold">👑 VIP ✦</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateAnniversaire"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-rose-500" />
                    <span>{t('clients.birthdayOptional') || "Date d'anniversaire"}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t('common.optional') || 'optionnel'}</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Parrain & Groupe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="parrainId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-rose-500" />
                    <span>{t('clients.selectReferrerPlaceholder') || 'Parrain / Marraine'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t('common.optional') || 'optionnel'}</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold">
                      <SelectValue placeholder={t('clients.selectReferrer') || 'Sélectionner un parrain'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl max-h-48">
                    <SelectItem value="none" className="font-semibold">{t('clients.noReferrer') || 'Aucun parrain'}</SelectItem>
                    {clients.filter(c => c.id !== client?.id).map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-semibold">{c.nom} ({c.telephone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-rose-500" />
                    <span>{t('clients.group') || 'Groupe / Catégorie'}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t('common.optional') || 'optionnel'}</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Coiffure, Onglerie, Soins..." 
                    className="h-11 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <FileText className="h-3.5 w-3.5 text-rose-500" />
                <span>{t('clients.notesOptional') || 'Notes & Préférences particulières'}</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('clients.notesPlaceholder') || "Préférences de coiffure, allergies, soins habituels..."}
                  className="resize-none min-h-[80px] rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold p-3"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800 order-2 sm:order-1"
          >
            {t('common.cancel') || 'Annuler'}
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-11 rounded-xl font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 border-0 order-1 sm:order-2"
          >
            {client ? (t('common.edit') || 'Enregistrer les modifications') : (t('common.add') || 'Ajouter la cliente')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
