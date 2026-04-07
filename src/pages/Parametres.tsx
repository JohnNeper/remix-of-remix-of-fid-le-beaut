import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Gift, Bell, Building2, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { getPlanColor, formatPlanPrice } from '@/lib/plans';

const salonSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().min(9, 'Numéro de téléphone invalide'),
  adresse: z.string().optional(),
});

const fideliteSchema = z.object({
  visitesRequises: z.coerce.number().min(1, 'Minimum 1 visite'),
  reductionPourcentage: z.coerce.number().min(1).max(100, 'Maximum 100%'),
  visitesVIP: z.coerce.number().min(1, 'Minimum 1 visite'),
});

const rappelSchema = z.object({
  joursRappelInactivite: z.coerce.number().min(1, 'Minimum 1 jour'),
  joursRappelSuivi: z.coerce.number().min(1, 'Minimum 1 jour'),
});

export default function Parametres() {
  const { salon, updateSalon, updateConfigFidelite } = useSalon();
  const { t } = useLanguage();

  const salonForm = useForm({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      nom: salon.nom,
      telephone: salon.telephone,
      adresse: salon.adresse || '',
    },
  });

  const fideliteForm = useForm({
    resolver: zodResolver(fideliteSchema),
    defaultValues: {
      visitesRequises: salon.configFidelite.visitesRequises,
      reductionPourcentage: salon.configFidelite.reductionPourcentage,
      visitesVIP: salon.configFidelite.visitesVIP,
    },
  });

  const rappelForm = useForm({
    resolver: zodResolver(rappelSchema),
    defaultValues: {
      joursRappelInactivite: salon.joursRappelInactivite,
      joursRappelSuivi: salon.joursRappelSuivi,
    },
  });

  const onSalonSubmit = (data: z.infer<typeof salonSchema>) => {
    updateSalon(data);
    toast({ title: t('settings.salonUpdated') });
  };

  const onFideliteSubmit = (data: z.infer<typeof fideliteSchema>) => {
    updateConfigFidelite(data);
    toast({ title: t('settings.loyaltyUpdated') });
  };

  const onRappelSubmit = (data: z.infer<typeof rappelSchema>) => {
    updateSalon(data);
    toast({ title: t('settings.remindersUpdated') });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salon info */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.salonInfo')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...salonForm}>
              <form onSubmit={salonForm.handleSubmit(onSalonSubmit)} className="space-y-4">
                <FormField
                  control={salonForm.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.salonName')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salonForm.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.phone')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salonForm.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.address')}</FormLabel>
                      <FormControl><Input placeholder={t('settings.addressPlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gradient-primary">{t('settings.save')}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

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

        {/* Rappels config */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <CardTitle>{t('settings.remindersConfig')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...rappelForm}>
              <form onSubmit={rappelForm.handleSubmit(onRappelSubmit)} className="space-y-4">
                <FormField
                  control={rappelForm.control}
                  name="joursRappelInactivite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.daysInactive')}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>{t('settings.daysInactiveDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rappelForm.control}
                  name="joursRappelSuivi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.daysFollowUp')}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>{t('settings.daysFollowUpDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="gradient-primary">{t('settings.save')}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
