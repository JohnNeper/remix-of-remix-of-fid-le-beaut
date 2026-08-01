import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Clock, Edit, X, Save, MessageSquare, Smartphone, Zap, Info, Loader2 } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
import type { Salon } from '@/types';

const rappelSchema = z.object({
  joursRappelInactivite: z.coerce.number().min(7, 'Minimum 7 jours').max(365, 'Maximum 365 jours'),
  joursRappelSuivi: z.coerce.number().min(7, 'Minimum 7 jours').max(90, 'Maximum 90 jours'),
});

interface NotificationsSettingsTabProps {
  salon: Salon;
  updateSalon: (updates: Partial<Salon>) => Promise<any>;
  language: string;
  t: (key: string, arg2?: string | Record<string, string | number>, arg3?: string | Record<string, string | number>) => string;
}

export function NotificationsSettingsTab({
  salon,
  updateSalon,
  language,
  t
}: NotificationsSettingsTabProps) {
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof rappelSchema>>({
    resolver: zodResolver(rappelSchema),
    defaultValues: {
      joursRappelInactivite: salon.joursRappelInactivite || 30,
      joursRappelSuivi: salon.joursRappelSuivi || 14
    }
  });

  const watchInactivite = form.watch('joursRappelInactivite') || 30;
  const watchSuivi = form.watch('joursRappelSuivi') || 14;

  const onSubmit = async (data: z.infer<typeof rappelSchema>) => {
    setIsSubmitting(true);
    try {
      await updateSalon(data);
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr' ? 'Délais de rappel automatisés mis à jour !' : 'Automated reminder delays updated!',
      });
      setEditing(false);
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
      {/* Col 1 & 2: Reminder Delays Configuration */}
      <Card className="lg:col-span-2 card-shadow rounded-3xl border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">{t('settings.autoReminders')}</CardTitle>
                <CardDescription className="text-xs">{t('settings.autoRemindersDesc')}</CardDescription>
              </div>
            </div>

            <Button
              variant={editing ? "ghost" : "outline"}
              size="sm"
              onClick={() => setEditing(!editing)}
              className="gap-2 rounded-2xl font-semibold border-border/80"
            >
              {editing ? <><X className="h-4 w-4" /> {t('common.cancel')}</> : <><Edit className="h-4 w-4" /> {t('settings.modifyDelays')}</>}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!editing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.inactivityDelay')}
                    </span>
                    <Badge variant="secondary" className="font-extrabold text-sm px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {salon.joursRappelInactivite || 30} {t('common.days')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {t('settings.inactivityDelayDesc')}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t('settings.followUpDelay')}
                    </span>
                    <Badge variant="secondary" className="font-extrabold text-sm px-3 py-1 bg-primary/10 text-primary border border-primary/20">
                      {salon.joursRappelSuivi || 14} {t('common.days')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {t('settings.followUpDelayDesc')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="joursRappelInactivite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.daysBeforeInactivity')} *</FormLabel>
                      <FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">{t('settings.inactivityHelp')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joursRappelSuivi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.daysForFollowUp')} *</FormLabel>
                      <FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">{t('settings.followUpHelp')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

          {/* Explanation Info */}
          <div className="mt-8 pt-6 border-t border-border/40 space-y-3">
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              {t('settings.howItWorks')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-foreground">{t('settings.clientFollowUp')}:</strong>{' '}
                  {t('settings.remindersStep1', { days: watchSuivi })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-foreground">{t('settings.inactivity')}:</strong>{' '}
                  {t('settings.remindersStep2', { days: watchInactivite })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Phone / WhatsApp Message Preview */}
      <div className="space-y-6">
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <CardHeader className="border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-extrabold">{t('settings.whatsappPreviewTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Phone Chat Mockup */}
            <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-xl space-y-3 border border-slate-800">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-300">{salon.nom || (salon as any).name}</span>
                <span className="text-[10px] text-slate-500 ml-auto">{t('settings.autoRelanceTag')}</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-emerald-950/80 border border-emerald-800/40 p-3.5 rounded-2xl text-xs space-y-2 text-emerald-100 shadow-inner">
                <p className="font-medium leading-relaxed">
                  {t('settings.whatsappPreviewMsg1', { days: watchInactivite })} <strong>{salon.nom || (salon as any).name}</strong>.
                </p>
                <p className="font-medium leading-relaxed">
                  {t('settings.whatsappPreviewMsg2', { percent: salon.configFidelite?.reductionPourcentage || 20 })}
                </p>
                <div className="text-[9px] text-emerald-400 font-bold text-right pt-1">
                  10:42 • WhatsApp Business
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{t('settings.marketingTip')}:</strong>{' '}
                {t('settings.marketingTipDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
