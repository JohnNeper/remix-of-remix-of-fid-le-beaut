import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gift, Star, Award, Sparkles, Check, HelpCircle, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import type { Salon, ConfigFidelite } from '@/types';

const fideliteSchema = z.object({
  visitesRequises: z.coerce.number().min(1, 'Minimum 1 visite'),
  reductionPourcentage: z.coerce.number().min(1, 'Minimum 1%').max(100, 'Maximum 100%'),
  visitesVIP: z.coerce.number().min(1, 'Minimum 1 visite'),
});

interface LoyaltySettingsTabProps {
  salon: Salon;
  updateConfigFidelite: (updates: Partial<Salon['configFidelite']>) => Promise<any> | void;
  updateSalon: (updates: Partial<Salon>) => Promise<any>;
  language: string;
  t: (key: string, options?: any) => string;
}

export function LoyaltySettingsTab({
  salon,
  updateConfigFidelite,
  updateSalon,
  language,
  t
}: LoyaltySettingsTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = salon.configFidelite || {
    visitesRequises: 10,
    reductionPourcentage: 20,
    visitesVIP: 50
  };

  const form = useForm<z.infer<typeof fideliteSchema>>({
    resolver: zodResolver(fideliteSchema),
    defaultValues: {
      visitesRequises: config.visitesRequises || 10,
      reductionPourcentage: config.reductionPourcentage || 20,
      visitesVIP: config.visitesVIP || 50
    }
  });

  const watchVisites = form.watch('visitesRequises') || 10;
  const watchReduction = form.watch('reductionPourcentage') || 20;
  const watchVIP = form.watch('visitesVIP') || 50;

  const onSubmit = async (data: z.infer<typeof fideliteSchema>) => {
    setIsSubmitting(true);
    try {
      if (typeof updateConfigFidelite === 'function') {
        await updateConfigFidelite(data);
      }
      await updateSalon({ configFidelite: data as ConfigFidelite });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr' ? 'Programme de fidélité mis à jour !' : 'Loyalty program updated!',
      });
    } catch (err) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: language === 'fr' ? 'Échec de la sauvegarde.' : 'Save failed.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
      {/* Configuration Form Card */}
      <Card className="lg:col-span-2 card-shadow rounded-3xl border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold">{t('settings.loyaltyProgram')}</CardTitle>
              <CardDescription className="text-xs">{t('settings.loyaltyConfig')}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="visitesRequises"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.visitsForDiscount')} *</FormLabel>
                      <FormControl>
                        <Input type="number" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        {t('settings.visitsForDiscountDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reductionPourcentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.discountPercent')} *</FormLabel>
                      <FormControl>
                        <Input type="number" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Pourcentage appliqué automatiquement sur la prestation offerte
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visitesVIP"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-xs">{t('settings.visitsForVip')} *</FormLabel>
                      <FormControl>
                        <Input type="number" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        {t('settings.visitsForVipDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
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

          {/* Explanation box */}
          <div className="mt-8 pt-6 border-t border-border/40 space-y-3">
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary" />
              {t('settings.howItWorks')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 space-y-1">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">1</div>
                <p className="font-semibold text-foreground">{t('settings.loyaltyStep1')}</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 space-y-1">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">2</div>
                <p className="font-semibold text-foreground">
                  {t('settings.loyaltyStep2', { visits: watchVisites })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 space-y-1">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">3</div>
                <p className="font-semibold text-foreground">{t('settings.loyaltyStep3')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Digital Loyalty Card Mockup */}
      <div className="space-y-6">
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden bg-gradient-to-br from-primary/15 via-card to-accent/15">
          <CardHeader className="border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-extrabold">Aperçu Carte Fidélité Client</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Simulated Digital Pass */}
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-xl space-y-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Carte Pass Fidélité</p>
                  <p className="text-lg font-extrabold text-white truncate">{salon.name}</p>
                </div>
                <Award className="h-8 w-8 text-amber-400" />
              </div>

              {/* Stamp progress dots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                  <span>Tampons accumulés</span>
                  <span className="font-bold text-amber-400">4 / {watchVisites}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: Math.min(10, watchVisites) }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-8 rounded-xl border flex items-center justify-center transition-all ${
                        idx < 4
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950 font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-600'
                      }`}
                    >
                      {idx < 4 ? <Star className="h-4 w-4 fill-current" /> : idx + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward notice */}
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-300">Réduction offerte:</span>
                <span className="font-bold text-emerald-400 text-sm">-{watchReduction}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
