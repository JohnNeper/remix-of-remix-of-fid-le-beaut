import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, ShieldCheck, Edit, X, Save, AlertTriangle, CheckCircle, Smartphone, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Salon } from '@/types';

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

interface PayoutsSettingsTabProps {
  salon: Salon;
  updateSalon: (updates: Partial<Salon>) => Promise<any>;
  language: string;
  t: (key: string) => string;
  onRefetch: () => void;
}

export function PayoutsSettingsTab({
  salon,
  updateSalon,
  language,
  t,
  onRefetch
}: PayoutsSettingsTabProps) {
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof paymentConfigSchema>>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      payoutMomoNumber: salon.paymentConfig?.payoutMomoNumber || '',
      payoutOperator: (salon.paymentConfig?.payoutOperator as any) || '',
      payoutMomoName: salon.paymentConfig?.payoutMomoName || '',
      payoutMtnNumber: salon.paymentConfig?.payoutMtnNumber || '',
      payoutMtnName: salon.paymentConfig?.payoutMtnName || '',
      payoutOrangeNumber: salon.paymentConfig?.payoutOrangeNumber || '',
      payoutOrangeName: salon.paymentConfig?.payoutOrangeName || '',
      payoutWaveNumber: salon.paymentConfig?.payoutWaveNumber || '',
      payoutWaveName: salon.paymentConfig?.payoutWaveName || ''
    }
  });

  const onSubmit = async (data: z.infer<typeof paymentConfigSchema>) => {
    setIsSubmitting(true);
    try {
      await updateSalon({ paymentConfig: data });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr' ? 'Configuration des versements mise à jour avec succès !' : 'Payout configuration updated successfully!',
      });
      setEditing(false);
      onRefetch();
    } catch (err: any) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: err.message || (language === 'fr' ? 'Échec de la mise à jour' : 'Update failed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentConfig = salon.paymentConfig;
  const isMissingAccount = !paymentConfig?.payoutMomoNumber && !paymentConfig?.payoutMtnNumber && !paymentConfig?.payoutOrangeNumber;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
      <Card className="lg:col-span-2 card-shadow rounded-3xl border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">
                  {language === 'fr' ? 'Versements & Comptes Mobile Money' : 'Payouts & Mobile Money Accounts'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'fr' ? 'Comptes enregistrés pour recevoir automatiquement les paiements de vos réservations' : 'Configured accounts to receive automated booking payouts'}
                </CardDescription>
              </div>
            </div>

            <Button
              variant={editing ? "ghost" : "outline"}
              size="sm"
              onClick={() => setEditing(!editing)}
              className="gap-2 rounded-2xl font-semibold border-border/80"
            >
              {editing ? <><X className="h-4 w-4" /> {t('common.cancel')}</> : <><Edit className="h-4 w-4" /> {t('common.edit')}</>}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!editing ? (
            <div className="space-y-6">
              {/* Primary MOMO card */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {language === 'fr' ? 'Compte Principal (Mobile Money)' : 'Primary Account (Mobile Money)'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Opérateur:</span>
                    <p className="font-extrabold text-foreground uppercase">
                      {paymentConfig?.payoutOperator || (language === 'fr' ? 'Non configuré' : 'Not set')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Numéro de Versement:</span>
                    <p className="font-mono font-bold text-foreground">
                      {paymentConfig?.payoutMomoNumber || (language === 'fr' ? 'Aucun numéro' : 'No number')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
                    <span className="text-muted-foreground font-semibold">Titulaire du Compte:</span>
                    <p className="font-bold text-foreground truncate">
                      {paymentConfig?.payoutMomoName || (language === 'fr' ? 'Non spécifié' : 'Not specified')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specific Carrier Cards */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {language === 'fr' ? 'Comptes Dédiés par Opérateur' : 'Dedicated Accounts by Operator'}
                </h4>

                <div className="space-y-3">
                  {/* MTN Mobile Money */}
                  <div className="p-3.5 rounded-xl bg-background border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-400/20 text-amber-500 font-extrabold flex items-center justify-center text-xs">
                        MTN
                      </div>
                      <div>
                        <p className="font-bold text-xs text-foreground">MTN Mobile Money</p>
                        <p className="text-[11px] text-muted-foreground">
                          Titulaire: <strong className="text-foreground">{paymentConfig?.payoutMtnName || 'Non défini'}</strong>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono font-bold text-xs rounded-lg py-1 px-3">
                      {paymentConfig?.payoutMtnNumber || 'Non configuré'}
                    </Badge>
                  </div>

                  {/* Orange Money */}
                  <div className="p-3.5 rounded-xl bg-background border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/20 text-orange-500 font-extrabold flex items-center justify-center text-xs">
                        OM
                      </div>
                      <div>
                        <p className="font-bold text-xs text-foreground">Orange Money</p>
                        <p className="text-[11px] text-muted-foreground">
                          Titulaire: <strong className="text-foreground">{paymentConfig?.payoutOrangeName || 'Non défini'}</strong>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono font-bold text-xs rounded-lg py-1 px-3">
                      {paymentConfig?.payoutOrangeNumber || 'Non configuré'}
                    </Badge>
                  </div>

                  {/* Wave */}
                  <div className="p-3.5 rounded-xl bg-background border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-sky-400/20 text-sky-500 font-extrabold flex items-center justify-center text-xs">
                        W
                      </div>
                      <div>
                        <p className="font-bold text-xs text-foreground">Wave Digital</p>
                        <p className="text-[11px] text-muted-foreground">
                          Titulaire: <strong className="text-foreground">{paymentConfig?.payoutWaveName || 'Non défini'}</strong>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono font-bold text-xs rounded-lg py-1 px-3">
                      {paymentConfig?.payoutWaveNumber || 'Non configuré'}
                    </Badge>
                  </div>
                </div>
              </div>

              {isMissingAccount && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Attention : </strong>
                    Veuillez ajouter au moins un numéro Mobile Money valide (MTN ou Orange) pour vous assurer de recevoir vos versements sans interruption.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Form Primary Account */}
                <div className="p-4 rounded-2xl border border-border/60 bg-muted/10 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Compte Principal (Mobile Money)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="payoutOperator" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Opérateur</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="mtn">MTN Mobile Money 🇨🇲</SelectItem>
                            <SelectItem value="orange">Orange Money 🇨🇲</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="payoutMomoNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Numéro (ex: 6XXXXXXXX)</FormLabel>
                        <FormControl><Input className="rounded-xl font-mono" placeholder="6XXXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="payoutMomoName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nom du Titulaire</FormLabel>
                        <FormControl><Input className="rounded-xl" placeholder="Nom enregistré sur la SIM" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Form Dedicated Accounts */}
                <div className="p-4 rounded-2xl border border-border/60 bg-muted/10 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Comptes Dédiés Optionnels
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="payoutMtnNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Numéro MTN Momo</FormLabel>
                        <FormControl><Input className="rounded-xl font-mono" placeholder="6XXXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="payoutMtnName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nom Titulaire MTN</FormLabel>
                        <FormControl><Input className="rounded-xl" placeholder="Ex: Jean Dupont" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="payoutOrangeNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Numéro Orange Money</FormLabel>
                        <FormControl><Input className="rounded-xl font-mono" placeholder="6XXXXXXXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="payoutOrangeName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nom Titulaire Orange</FormLabel>
                        <FormControl><Input className="rounded-xl" placeholder="Ex: Jean Dupont" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-2xl font-semibold" onClick={() => setEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-2xl px-8 font-bold shadow-md">
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('common.save')}...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> {t('common.save')}</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Security & Info Panel */}
      <div className="space-y-6">
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader className="border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-extrabold">Versements Sécurisés</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">🔒 Transfert instantané & sécurisé :</strong> Les montants des acompteurs et réservations payés en ligne par vos clients sont automatiquement reversés sur votre compte Mobile Money.
            </p>
            <p>
              <strong className="text-foreground">⚡ Délais de règlement :</strong> Les versements sont crédités sous 24h après la validation de la prestation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
