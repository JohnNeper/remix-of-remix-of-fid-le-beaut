import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { User, Scissors, Banknote, CreditCard, Users, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { PrestationSelectInput } from '@/components/prestations/PrestationSelectInput';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useFinances } from '@/hooks/useFinances';
import { toast } from '@/hooks/use-toast';
import { InvoiceGenerator } from '@/components/finances/InvoiceGenerator';
import { Vente } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';
import { Client } from '@/types';
import { ClientSearchInput } from '@/components/clients/ClientSearchInput';
import { useAuth } from '@/contexts/AuthContext';
import { useSalon } from '@/hooks/useSalon';

interface NouvellePrestationProps {
  onClose: () => void;
  defaultPrestationId?: string;
}

const modePaiementLabels: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  carte: 'Carte',
  mixte: 'Mixte',
};

export function NouvellePrestation({ onClose, defaultPrestationId }: NouvellePrestationProps) {
  const { t } = useLanguage();
  const { session, currentSalon } = useAuth();
  const { salon, staff } = useSalon();
  const isStaff = session?.userRole === 'staff';
  const { formatCurrency } = useTranslations();
  const { typesPrestations, addPrestation, getTypePrestation } = usePrestations();
  const { clients, updateClientStats } = useClients();
  const { addVenteAsync } = useFinances();
  const [invoiceVente, setInvoiceVente] = useState<Vente | null>(null);

  const prestationSchema = z.object({
    clientId: z.string().optional(),
    typePrestationId: z.string().min(1, t('services.selectPrestation')),
    prix: z.coerce.number().min(0, t('services.priceError')),
    employe: z.string().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().optional(),
    modePaiement: z.enum(['especes', 'mobile_money', 'carte', 'mixte']).default('especes'),
  });

  type PrestationFormData = z.infer<typeof prestationSchema>;

  const modePaiementLabels: Record<string, string> = {
    especes: t('finances.paymentModes.especes'),
    mobile_money: t('finances.paymentModes.mobile_money'),
    carte: t('finances.paymentModes.carte'),
    mixte: t('finances.paymentModes.mixte'),
  };

  const form = useForm<PrestationFormData>({
    resolver: zodResolver(prestationSchema),
    defaultValues: {
      clientId: '',
      typePrestationId: defaultPrestationId || '',
      prix: defaultPrestationId ? (getTypePrestation(defaultPrestationId)?.prix || 0) : 0,
      employe: session?.userId || '',
      notes: '',
      imageUrl: '',
      modePaiement: 'especes'
    },
  });

  const selectedType = getTypePrestation(form.watch('typePrestationId'));

  const onSubmit = async (data: PrestationFormData) => {
    const type = getTypePrestation(data.typePrestationId);
    if (!type) return;

    const finalPrice = data.prix;
    const dateStr = new Date().toISOString().split('T')[0];
    // "anonymous" or empty = vente sans client enregistré
    const resolvedClientId = (data.clientId && data.clientId !== 'anonymous') ? data.clientId : undefined;

    const selectedStaff = staff.find(s => s._id === data.employe);
    const employeNom = selectedStaff ? selectedStaff.name : (data.employe === session?.userId ? session?.userName : data.employe);

    if (resolvedClientId) {
      addPrestation({
        clientId: resolvedClientId,
        typePrestationId: data.typePrestationId,
        employe: employeNom,
        notes: data.notes,
        imageUrls: data.imageUrl ? [data.imageUrl] : [],
        montant: finalPrice,
      });
      updateClientStats(resolvedClientId, finalPrice);
    }

    const newVente = await addVenteAsync({
      date: dateStr,
      clientId: resolvedClientId,
      employe: data.employe, // ID de l'employé
      items: [{ type: 'prestation', referenceId: type.id, nom: type.nom, quantite: 1, prixUnitaire: finalPrice, montant: finalPrice }],
      totalMontant: finalPrice,
      modePaiement: data.modePaiement,
      notes: data.notes,
    });

    toast({ title: 'Prestation enregistrée', description: `${type.nom} — ${type.prix.toLocaleString()} FCFA ajouté aux finances` });

    // Show invoice
    setInvoiceVente(newVente);
  };

  if (invoiceVente) {
    return (
      <InvoiceGenerator
        vente={invoiceVente}
        isOpen={true}
        onClose={() => { setInvoiceVente(null); onClose(); }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">

        {/* ── Client (optionnel) ── */}
        <FormField control={form.control} name="clientId" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary" />
              {t('finances.client')}
              <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional') || 'optionnel'})</span>
            </FormLabel>
            <ClientSearchInput
              clients={clients}
              defaultValue={field.value}
              isStaff={isStaff}
              onSelect={(client) => {
                if (client === 'anonymous') {
                  field.onChange('anonymous');
                } else {
                  field.onChange(client.id);
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground mt-1 ml-1 opacity-70">
              {t('finances.anonymousHint') || 'La vente sera enregistrée dans les finances sans affecter de profil'}
            </p>
            <FormMessage />
          </FormItem>
        )} />

        {/* ── Prestation ── */}
        <FormField control={form.control} name="typePrestationId" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <Scissors className="h-3.5 w-3.5 text-primary" />
              {t('services.serviceLabel') || 'Prestation'}
            </FormLabel>
            <PrestationSelectInput
              prestations={typesPrestations}
              value={field.value}
              onSelect={(type) => {
                field.onChange(type.id);
                form.setValue('prix', type.prix);
              }}
            />
            <FormMessage />
          </FormItem>
        )} />

        {/* ── Prix + Mode de paiement (2 colonnes sur sm+) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField control={form.control} name="prix" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <Banknote className="h-3.5 w-3.5 text-primary" />
                {t('finances.amount')} (FCFA)
              </FormLabel>
              <FormControl>
                <Input type="number" {...field} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-lg font-semibold" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="modePaiement" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                {t('finances.paymentMethod')}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {Object.entries(modePaiementLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="rounded-lg m-1 font-medium">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* ── Employé(e) ── */}
        <FormField control={form.control} name="employe" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              {t('services.employee')}
              <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional') || 'optionnel'})</span>
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20">
                  <SelectValue placeholder={t('services.employeePlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {session?.userId && !staff.find(s => s._id === session.userId) && (
                  <SelectItem value={session.userId} className="rounded-lg m-1">{session.userName}</SelectItem>
                )}
                {staff.map((member) => (
                  <SelectItem key={member._id} value={member._id} className="rounded-lg m-1">{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* ── Photo / Réalisation (optionnel) ── */}
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              {t('services.imageLabel') || 'Photo avant/après ou réalisation'}
              <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional') || 'optionnel'})</span>
            </FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value || ''}
                onChange={field.onChange}
                label={t('services.addImage') || 'Ajouter une photo'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* ── Notes ── */}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              {t('clients.notes')}
              <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional') || 'optionnel'})</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('services.notesPlaceholder')}
                className="resize-none min-h-[80px] rounded-2xl bg-muted/30 border-none shadow-inner p-4 focus:ring-primary/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 sm:h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 sm:h-14 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2"
          >
            {t('services.saveAndInvoice')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
