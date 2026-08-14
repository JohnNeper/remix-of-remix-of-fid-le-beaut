import React from 'react';
import { Image as ImageIcon, Sparkles, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from '@/hooks/use-toast';
import type { Salon } from '@/types';

interface MediaSettingsTabProps {
  salon: Salon;
  updateSalon: (updates: Partial<Salon>) => Promise<any>;
  language: string;
  t: (key: string) => string;
}

export function MediaSettingsTab({ salon, updateSalon, language, t }: MediaSettingsTabProps) {
  const logoUrl = salon.logoUrl || salon.logo || salon.branding?.logoUrl || '';
  const bannerUrl = salon.bannerUrl || salon.branding?.bannerUrl || '';
  const galleryUrls = salon.galleryUrls?.length ? salon.galleryUrls : (salon.branding?.gallery || []);

  const handleLogoChange = async (url: string | string[]) => {
    try {
      const finalUrl = Array.isArray(url) ? url[0] : url;
      await updateSalon({ logo: finalUrl, logoUrl: finalUrl, branding: { ...(salon.branding || {}), logoUrl: finalUrl } } as any);
      toast({ 
        title: '✅ ' + (t('common.success') || 'Succès'), 
        description: language === 'fr' ? 'Logo du salon mis à jour' : 'Logo updated' 
      });
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const handleBannerChange = async (url: string | string[]) => {
    try {
      const finalUrl = Array.isArray(url) ? url[0] : url;
      await updateSalon({ bannerUrl: finalUrl, branding: { ...(salon.branding || {}), bannerUrl: finalUrl } } as any);
      toast({ 
        title: '✅ ' + (t('common.success') || 'Succès'), 
        description: language === 'fr' ? 'Bannière de couverture mise à jour' : 'Cover banner updated' 
      });
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  const handleGalleryChange = async (urls: string | string[]) => {
    try {
      const finalUrls = Array.isArray(urls) ? urls : [urls];
      await updateSalon({
        galleryUrls: finalUrls,
        branding: { ...(salon.branding || {}), gallery: finalUrls }
      } as any);
      toast({ 
        title: '✅ ' + (t('common.success') || 'Succès'), 
        description: language === 'fr' ? 'Galerie photos mise à jour' : 'Gallery updated' 
      });
    } catch (err) {
      toast({ title: '❌ Erreur', description: 'Échec de la mise à jour', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Card */}
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Logo Officiel</CardTitle>
                <CardDescription className="text-xs">Image au format carré (1:1), max 5 MB</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <ImageUpload
              value={logoUrl}
              onChange={handleLogoChange}
              aspectRatio="square"
              label={language === 'fr' ? 'Changer le logo' : 'Change logo'}
              className="w-40 h-40 mx-auto rounded-2xl border-2 border-dashed border-primary/30"
            />
          </CardContent>
        </Card>

        {/* Banner Card */}
        <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Bannière de Couverture</CardTitle>
                <CardDescription className="text-xs">Format paysage (16:9), max 5 MB</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <ImageUpload
              value={bannerUrl}
              onChange={handleBannerChange}
              aspectRatio="wide"
              label={language === 'fr' ? 'Changer la bannière' : 'Change cover'}
              className="w-full h-40 rounded-2xl border-2 border-dashed border-primary/30"
            />
          </CardContent>
        </Card>

        {/* Gallery Card */}
        <Card className="card-shadow rounded-3xl border-border/60 md:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Galerie de Réalisations & Intérieur</CardTitle>
                <CardDescription className="text-xs">
                  {language === 'fr' 
                    ? 'Ajoutez jusqu\'à 10 photos présentées aux clients sur la page de réservation.'
                    : 'Add up to 10 photos showcasing your work on your booking page.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ImageUpload
              value={galleryUrls}
              onChange={handleGalleryChange}
              multiple={true}
              label={language === 'fr' ? 'Ajouter des photos à la galerie' : 'Add photos to gallery'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
