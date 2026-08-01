import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2, Sparkles, Phone, Mail, MapPin, CreditCard, Globe,
  Edit, X, Save, Store, Clock, Image as ImageIcon, CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapSelector } from '@/components/ui/MapSelector';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from '@/hooks/use-toast';
import type { Salon } from '@/types';

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

const TYPES_ETAB = [
  { value: 'salon_coiffure', labelFr: 'Salon de coiffure', labelEn: 'Hair Salon' },
  { value: 'spa', labelFr: 'Spa & Bien-être', labelEn: 'Spa & Wellness' },
  { value: 'institut_beaute', labelFr: 'Institut de beauté', labelEn: 'Beauty Institute' },
  { value: 'barbershop', labelFr: 'Barbershop', labelEn: 'Barbershop' },
  { value: 'onglerie', labelFr: 'Onglerie & Nail Bar', labelEn: 'Nail Bar & Care' },
  { value: 'mixte', labelFr: 'Établissement mixte', labelEn: 'Mixed Establishment' },
  { value: 'autre', labelFr: 'Autre', labelEn: 'Other' },
];

const PAYS_LIST = [
  { code: 'CM', labelFr: 'Cameroun 🇨🇲', labelEn: 'Cameroon 🇨🇲' },
  { code: 'SN', labelFr: 'Sénégal 🇸🇳', labelEn: 'Senegal 🇸🇳' },
  { code: 'CI', labelFr: 'Côte d\'Ivoire 🇨🇮', labelEn: 'Ivory Coast 🇨🇮' },
  { code: 'FR', labelFr: 'France 🇫🇷', labelEn: 'France 🇫🇷' },
];

interface GeneralSettingsTabProps {
  salon: Salon;
  updateSalon: (updates: Partial<Salon>) => Promise<any>;
  t: (key: string) => string;
  language: string;
}

function InfoRow({ icon: Icon, label, value, fallback }: { icon?: any; label: string; value?: string | null; fallback?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      {Icon && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value || fallback || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

export function GeneralSettingsTab({ salon, updateSalon, t, language }: GeneralSettingsTabProps) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const infoForm = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: salon.name || '',
      phone: salon.phone || '',
      email: salon.email || '',
      address: salon.address || '',
      ville: salon.ville || '',
      pays: salon.pays || 'CM',
      devise: salon.devise || 'XAF',
      description: salon.description || '',
      slogan: salon.slogan || '',
      horaires: salon.horaires || '',
      typeEtablissement: salon.typeEtablissement || 'salon_coiffure',
      location: {
        lat: salon.location?.lat || 4.0508,
        lng: salon.location?.lng || 9.7085
      }
    }
  });

  const mapLat = infoForm.watch('location.lat');
  const mapLng = infoForm.watch('location.lng');

  const onInfoSubmit = async (data: z.infer<typeof infoSchema>) => {
    setIsSubmitting(true);
    try {
      await updateSalon(data as any);
      toast({ 
        title: '✅ ' + (t('common.success') || 'Succès'), 
        description: language === 'fr' ? 'Informations générales mises à jour avec succès.' : 'General info updated successfully.' 
      });
      setEditingInfo(false);
    } catch (err: any) {
      toast({ 
        title: '❌ ' + (t('common.error') || 'Erreur'), 
        description: err?.message || (language === 'fr' ? 'Échec de la mise à jour' : 'Failed to update'), 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpdate = async (url: string) => {
    try {
      await updateSalon({ logo: url });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr' ? 'Logo du salon mis à jour.' : 'Salon logo updated.'
      });
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour du logo', variant: 'destructive' });
    }
  };

  const handleCoverUpdate = async (url: string) => {
    try {
      await updateSalon({ bannerUrl: url });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: language === 'fr' ? 'Photo de couverture mise à jour.' : 'Cover photo updated.'
      });
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour de la photo de couverture', variant: 'destructive' });
    }
  };

  const fallbackText = language === 'fr' ? 'Non renseigné' : 'Not specified';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
      {/* Col 1 & 2: Information form / read card */}
      <Card className="lg:col-span-2 card-shadow overflow-hidden rounded-3xl border-border/60">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold">{t('settings.identity')}</CardTitle>
                <CardDescription className="text-xs">
                  {language === 'fr' ? 'Informations visibles par vos clients sur votre page' : 'Information visible to your clients'}
                </CardDescription>
              </div>
            </div>

            <Button 
              variant={editingInfo ? "ghost" : "outline"} 
              size="sm" 
              onClick={() => setEditingInfo(!editingInfo)} 
              className="gap-2 rounded-2xl font-semibold border-border/80"
            >
              {editingInfo ? (
                <><X className="h-4 w-4" /> {t('common.cancel')}</>
              ) : (
                <><Edit className="h-4 w-4" /> {t('common.edit')}</>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!editingInfo ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <InfoRow icon={Building2} label={t('settings.salonName')} value={salon.name} fallback={fallbackText} />
                <InfoRow icon={Sparkles} label={t('settings.slogan')} value={salon.slogan} fallback={fallbackText} />
                <InfoRow icon={Phone} label={t('settings.phone')} value={salon.phone} fallback={fallbackText} />
                <InfoRow icon={Mail} label={t('login.email')} value={salon.email} fallback={fallbackText} />
                <InfoRow icon={MapPin} label={t('settings.address')} value={salon.address} fallback={fallbackText} />
                <InfoRow icon={MapPin} label={t('clients.ville')} value={salon.ville} fallback={fallbackText} />
                <InfoRow icon={Globe} label={t('clients.pays')} value={salon.pays} fallback={fallbackText} />
                <InfoRow icon={CreditCard} label={t('clients.devise')} value={salon.devise} fallback={fallbackText} />
                <InfoRow icon={MapPin} label="Latitude GPS" value={salon.location?.lat?.toString() || '4.0508'} />
                <InfoRow icon={MapPin} label="Longitude GPS" value={salon.location?.lng?.toString() || '9.7085'} />
              </div>

              {salon.description && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('finances.description')}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {salon.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Form {...infoForm}>
              <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={infoForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.salonName')} *</FormLabel>
                      <FormControl><Input className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="slogan" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.slogan')}</FormLabel>
                      <FormControl><Input className="rounded-xl" placeholder={language === 'fr' ? 'Ex: Votre beauté, notre passion' : 'e.g. Your beauty, our passion'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="typeEtablissement" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('services.type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          {TYPES_ETAB.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {language === 'fr' ? type.labelFr : type.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.phone')} *</FormLabel>
                      <FormControl><Input className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('login.email')}</FormLabel>
                      <FormControl><Input className="rounded-xl" type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('settings.address')} *</FormLabel>
                      <FormControl><Input className="rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="ville" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('clients.ville')}</FormLabel>
                      <FormControl><Input className="rounded-xl" placeholder={language === 'fr' ? 'Ex: Douala' : 'e.g. London'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="pays" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('clients.pays')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-2xl">
                          {PAYS_LIST.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                              {language === 'fr' ? p.labelFr : p.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={infoForm.control} name="devise" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs">{t('clients.devise')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="USD">Dollar ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Map GPS position */}
                <div className="space-y-2 pt-2">
                  <FormLabel className="font-semibold text-xs flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {language === 'fr' ? 'Position GPS sur la carte (glisser ou cliquer pour définir)' : 'GPS position on map (drag or click to set)'}
                  </FormLabel>
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
                  <FormItem>
                    <FormLabel className="font-semibold text-xs">{t('finances.description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} className="rounded-xl" placeholder={language === 'fr' ? 'Présentez votre établissement à vos clients...' : 'Describe your salon to your clients...'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-2xl font-semibold" onClick={() => setEditingInfo(false)}>
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

      {/* Col 3: Branding & Photos (Logo & Cover) */}
      <div className="space-y-6">
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">
                  {language === 'fr' ? 'Logo & Identité Visuelle' : 'Logo & Brand Identity'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'fr' ? 'Image principale affichée sur vos reçus et votre site' : 'Primary image displayed on receipts and site'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <ImageUpload
                value={salon.logo || ''}
                onChange={handleLogoUpdate}
                aspectRatio="square"
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-primary/30"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Format recommandé: Carré (1:1), max 5 Mo' : 'Recommended format: Square (1:1), max 5 MB'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">
                  {language === 'fr' ? 'Photo de Couverture' : 'Cover Banner Photo'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'fr' ? 'Bannière en haut de votre page de réservation' : 'Header banner on your booking page'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <ImageUpload
              value={salon.bannerUrl || ''}
              onChange={handleCoverUpdate}
              aspectRatio="wide"
              className="w-full h-40 rounded-2xl border-2 border-dashed border-primary/30"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Format recommandé: Paysage (16:9), max 5 Mo' : 'Recommended format: Landscape (16:9), max 5 MB'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
