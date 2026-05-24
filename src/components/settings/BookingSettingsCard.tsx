import React, { useState } from 'react';
import { Link2, Copy, ExternalLink, Image as ImageIcon, Palette, Globe2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateSalonAccount, slugify, getSalonBySlug, getSalonAccounts } from '@/lib/auth';
import { getBookingPublicUrl } from '@/lib/booking';

const PALETTES = [
  { name: 'Rose Gold', primary: '350 75% 55%', secondary: '25 95% 60%' },
  { name: 'Coral', primary: '14 85% 60%', secondary: '340 75% 65%' },
  { name: 'Émeraude', primary: '160 60% 40%', secondary: '180 50% 50%' },
  { name: 'Royal', primary: '260 70% 55%', secondary: '290 65% 60%' },
  { name: 'Or noir', primary: '40 80% 50%', secondary: '0 0% 15%' },
];

export function BookingSettingsCard() {
  const { session } = useAuth();
  const [tick, force] = useState(0);
  const currentSalon = session?.salonId
    ? getSalonAccounts().find(s => s.id === session.salonId)
    : null;
  // re-read on tick changes
  void tick;
  if (!currentSalon) return null;

  const branding = currentSalon.branding || {};
  const settings = currentSalon.bookingSettings!;
  const slug = currentSalon.slug || slugify(currentSalon.nom);
  const publicUrl = getBookingPublicUrl(slug);

  const save = (updates: Partial<typeof currentSalon>) => {
    updateSalonAccount(currentSalon.id, updates);
    force(v => v + 1);
  };

  const onUploadLogo = (file?: File | null) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      toast({ title: 'Image trop volumineuse (max 1 Mo)', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      save({ branding: { ...branding, logoUrl: reader.result as string } });
      toast({ title: 'Logo mis à jour' });
    };
    reader.readAsDataURL(file);
  };

  const onUploadBanner = (file?: File | null) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      toast({ title: 'Image trop volumineuse (max 1.5 Mo)', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      save({ branding: { ...branding, bannerUrl: reader.result as string } });
      toast({ title: 'Bannière mise à jour' });
    };
    reader.readAsDataURL(file);
  };

  const handleSlugChange = (v: string) => {
    const cleaned = slugify(v);
    const existing = getSalonBySlug(cleaned);
    if (existing && existing.id !== currentSalon.id) {
      toast({ title: 'Ce lien est déjà utilisé', variant: 'destructive' });
      return;
    }
    save({ slug: cleaned });
    toast({ title: 'Lien public mis à jour' });
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Lien copié' });
  };

  return (
    <Card className="card-shadow lg:col-span-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" />
          <CardTitle>Page de réservation publique</CardTitle>
        </div>
        <CardDescription>
          Partagez ce lien avec vos clientes pour qu'elles réservent directement en ligne.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public URL */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5">
            <Link2 className="h-4 w-4" /> Votre lien public
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-1 rounded-lg border bg-muted px-3 py-2 text-sm font-mono overflow-x-auto">
              <span className="text-muted-foreground shrink-0">/booking/</span>
              <Input
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                className="h-7 px-2 border-0 bg-transparent font-mono"
              />
            </div>
            <Button onClick={copyUrl} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1.5" /> Copier
            </Button>
            <Button asChild size="sm" className="gradient-primary">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" /> Ouvrir
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground break-all">{publicUrl}</p>
        </div>

        {/* Branding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm flex items-center gap-1.5 mb-1.5">
              <ImageIcon className="h-4 w-4" /> Logo
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl bg-muted border overflow-hidden flex items-center justify-center">
                {branding.logoUrl
                  ? <img src={branding.logoUrl} className="w-full h-full object-cover" alt="logo" />
                  : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
              </div>
              <Input type="file" accept="image/*" onChange={e => onUploadLogo(e.target.files?.[0])} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-sm flex items-center gap-1.5 mb-1.5">
              <ImageIcon className="h-4 w-4" /> Bannière
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 rounded-xl bg-muted border overflow-hidden flex items-center justify-center">
                {branding.bannerUrl
                  ? <img src={branding.bannerUrl} className="w-full h-full object-cover" alt="bannière" />
                  : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
              </div>
              <Input type="file" accept="image/*" onChange={e => onUploadBanner(e.target.files?.[0])} className="text-xs" />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <Label className="text-sm flex items-center gap-1.5 mb-2">
            <Palette className="h-4 w-4" /> Couleurs
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {PALETTES.map(p => {
              const active = branding.primaryColor === p.primary;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => save({ branding: { ...branding, primaryColor: p.primary, secondaryColor: p.secondary } })}
                  className={`p-2 rounded-lg border-2 transition-all ${active ? 'border-foreground' : 'border-transparent'}`}
                >
                  <div className="flex gap-1 mb-1">
                    <div className="h-6 flex-1 rounded" style={{ background: `hsl(${p.primary})` }} />
                    <div className="h-6 flex-1 rounded" style={{ background: `hsl(${p.secondary})` }} />
                  </div>
                  <div className="text-[10px] text-center text-muted-foreground">{p.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description / location / hours */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Description courte</Label>
            <Textarea
              defaultValue={branding.description || ''}
              onBlur={e => save({ branding: { ...branding, description: e.target.value } })}
              rows={2}
              placeholder="Salon expert en tresses, soins capillaires et maquillage..."
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Adresse / localisation</Label>
              <Input
                defaultValue={branding.location || currentSalon.adresse || ''}
                onBlur={e => save({ branding: { ...branding, location: e.target.value } })}
                className="mt-1"
                placeholder="Bonapriso, Douala"
              />
            </div>
            <div>
              <Label className="text-sm">Horaires</Label>
              <Input
                defaultValue={branding.hours || ''}
                onBlur={e => save({ branding: { ...branding, hours: e.target.value } })}
                className="mt-1"
                placeholder="Lun-Sam 9h-19h"
              />
            </div>
          </div>
        </div>

        {/* Booking settings */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Confirmation automatique</div>
              <div className="text-xs text-muted-foreground">Les réservations sont confirmées sans validation manuelle.</div>
            </div>
            <Switch
              checked={settings.autoConfirm}
              onCheckedChange={v => save({ bookingSettings: { ...settings, autoConfirm: v } })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Ouverture</Label>
              <Input
                type="number" min={0} max={23}
                defaultValue={settings.openingHour}
                onBlur={e => save({ bookingSettings: { ...settings, openingHour: Number(e.target.value) } })}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Fermeture</Label>
              <Input
                type="number" min={1} max={24}
                defaultValue={settings.closingHour}
                onBlur={e => save({ bookingSettings: { ...settings, closingHour: Number(e.target.value) } })}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Créneau (min)</Label>
              <Input
                type="number" min={15} max={120} step={15}
                defaultValue={settings.slotDurationMin}
                onBlur={e => save({ bookingSettings: { ...settings, slotDurationMin: Number(e.target.value) } })}
                className="h-9 mt-1"
              />
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="text-xs">
          Les nouvelles réservations apparaissent dans l'onglet Rendez-vous.
        </Badge>
      </CardContent>
    </Card>
  );
}