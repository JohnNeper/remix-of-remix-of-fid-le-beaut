import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  MapPin,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Navigation,
  Loader2,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  FileText,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import LocationPickerMap from './LocationPickerMap';

interface EditSalonModalProps {
  salon: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onSaved?: () => void;
}

export function EditSalonModal({ salon, open, onOpenChange, onSuccess, onSaved }: EditSalonModalProps) {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [typeEtablissement, setTypeEtablissement] = useState('salon_coiffure');
  const [businessType, setBusinessType] = useState('salon');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Location & Position
  const [address, setAddress] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('CM');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Visibility & Sponsorship
  const [isActive, setIsActive] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);

  // Branding Images
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Plan & Subscription
  const [plan, setPlan] = useState('basic');
  const [subStatut, setSubStatut] = useState('actif');
  const [subDateFin, setSubDateFin] = useState('');

  useEffect(() => {
    if (salon && open) {
      setName(salon.name || salon.nom || '');
      setSlug(salon.slug || '');
      setSlogan(salon.slogan || salon.branding?.slogan || '');
      setDescription(salon.description || salon.branding?.description || '');
      setTypeEtablissement(salon.typeEtablissement || 'salon_coiffure');
      setBusinessType(salon.businessType || salon.branding?.businessType || 'salon');
      setPhone(salon.phone || salon.telephone || '');
      setEmail(salon.email || '');

      setAddress(salon.address || salon.adresse || '');
      setVille(salon.ville || '');
      setPays(salon.pays || salon.branding?.pays || 'CM');
      setLat(salon.location?.lat !== undefined && salon.location?.lat !== null ? String(salon.location.lat) : '');
      setLng(salon.location?.lng !== undefined && salon.location?.lng !== null ? String(salon.location.lng) : '');

      setIsActive(salon.isActive !== false);
      setIsHidden(Boolean(salon.isHidden || salon.hidden));
      setIsSponsored(Boolean(salon.isSponsored || salon.branding?.isSponsored));

      setLogoUrl(salon.logoUrl || salon.branding?.logoUrl || '');
      setBannerUrl(salon.bannerUrl || salon.branding?.bannerUrl || '');

      setPlan(salon.plan || 'basic');
      setSubStatut(salon.abonnement?.statut || 'essai');
      if (salon.abonnement?.dateFin) {
        const d = new Date(salon.abonnement.dateFin);
        if (!isNaN(d.getTime())) {
          setSubDateFin(d.toISOString().split('T')[0]);
        }
      } else {
        setSubDateFin('');
      }
    }
  }, [salon, open]);

  // Handle image upload to Cloudinary via backend
  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: "L'image ne doit pas dépasser 10 Mo.",
        variant: 'destructive',
      });
      return;
    }

    try {
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);

      const url = await api.uploadImage(file);
      if (url) {
        if (type === 'logo') {
          setLogoUrl(url);
          toast({ title: 'Logo uploadé avec succès !' });
        } else {
          setBannerUrl(url);
          toast({ title: 'Bannière uploadée avec succès !' });
        }
      } else {
        throw new Error("L'URL de l'image n'a pas été renvoyée par le serveur.");
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast({
        title: "Échec de l'upload",
        description: err.message || "Impossible d'uploader l'image. Vous pouvez également coller un lien direct.",
        variant: 'destructive',
      });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  // Map location change handler - only update coordinates, preserve manual address/quartier/ville
  const handleMapLocationChange = (coords: { lat: number; lng: number }) => {
    setLat(String(coords.lat));
    setLng(String(coords.lng));
  };

  // Auto geocoding helper via OpenStreetMap Nominatim
  const handleAutoGeocode = async () => {
    const fullQuery = [address, ville, pays].filter(Boolean).join(', ');
    if (!fullQuery.trim()) {
      toast({
        title: 'Adresse requise',
        description: 'Veuillez saisir une adresse et une ville avant de géolocaliser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        const foundLat = parseFloat(data[0].lat).toFixed(6);
        const foundLng = parseFloat(data[0].lon).toFixed(6);
        setLat(foundLat);
        setLng(foundLng);
        toast({
          title: 'Position GPS trouvée !',
          description: `Lat: ${foundLat}, Lng: ${foundLng}`,
        });
      } else {
        toast({
          title: 'Position introuvable',
          description: "Impossible d'extraire automatiquement les coordonnées. Utilisez la carte interactive ci-dessous.",
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Erreur de géocodage',
        description: 'Vérifiez votre connexion internet.',
        variant: 'destructive',
      });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon?._id && !salon?.id) return;

    const salonId = salon._id || salon.id;

    try {
      setLoading(true);

      const payload: Record<string, any> = {
        name,
        slug: slug.trim() || undefined,
        slogan,
        description,
        typeEtablissement,
        businessType,
        phone,
        email,
        address,
        ville,
        pays: pays.toUpperCase(),
        isActive,
        isHidden,
        hidden: isHidden,
        isSponsored,
        logoUrl,
        bannerUrl,
        plan,
        location: {
          lat: lat.trim() ? parseFloat(lat) : undefined,
          lng: lng.trim() ? parseFloat(lng) : undefined,
        },
        branding: {
          ...(salon.branding || {}),
          isSponsored,
          logoUrl,
          bannerUrl,
          category: typeEtablissement,
          location: `${address}${ville ? ', ' + ville : ''}`,
          pays: pays.toUpperCase(),
        },
      };

      if (subStatut || subDateFin) {
        payload.abonnement = {
          ...(salon.abonnement || {}),
          statut: subStatut,
          dateFin: subDateFin ? new Date(subDateFin).toISOString() : salon.abonnement?.dateFin,
        };
      }

      await api.adminUpdateSalon(salonId, payload);

      toast({
        title: 'Salon mis à jour avec succès',
        description: `Les modifications pour ${name} ont été enregistrées.`,
      });

      onOpenChange(false);
      onSuccess?.();
      onSaved?.();
    } catch (err: any) {
      toast({
        title: 'Erreur de sauvegarde',
        description: err.message || 'Impossible de mettre à jour le salon.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!salon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Building2 className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">Gérer le salon : {salon.name || salon.nom}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modifiez la carte interactive GPS, la mise en avant, la visibilité, les photos (logo & bannière) et l'abonnement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* 1. MISE EN AVANT & VISIBILITÉ RAPIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/80">
            {/* Sponsorisé */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 shadow-xs">
              <div className="space-y-0.5">
                <Label htmlFor="switch-sponsored" className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-amber-500">
                  <Sparkles className="w-4 h-4 fill-amber-500" />
                  Sponsorisé (Top)
                </Label>
                <p className="text-[10px] text-muted-foreground">En tête de l'Explorer</p>
              </div>
              <Switch id="switch-sponsored" checked={isSponsored} onCheckedChange={setIsSponsored} />
            </div>

            {/* Actif / Inactif */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 shadow-xs">
              <div className="space-y-0.5">
                <Label htmlFor="switch-active" className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Compte Actif
                </Label>
                <p className="text-[10px] text-muted-foreground">Autoriser connexions</p>
              </div>
              <Switch id="switch-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Masqué / Visible */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 shadow-xs">
              <div className="space-y-0.5">
                <Label htmlFor="switch-hidden" className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-foreground">
                  {isHidden ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-primary" />}
                  Masqué public
                </Label>
                <p className="text-[10px] text-muted-foreground">{isHidden ? 'Caché sur Explorer' : 'Visible partout'}</p>
              </div>
              <Switch id="switch-hidden" checked={isHidden} onCheckedChange={setIsHidden} />
            </div>
          </div>

          {/* 2. LOCALISATION, RECHERCHE & CARTE INTERACTIVE GPS */}
          <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Position GPS & Carte Interactive</h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoGeocode}
                disabled={geocoding}
                className="h-8 text-xs font-semibold rounded-full bg-background border-primary/30 hover:bg-primary/10 gap-1.5 shadow-xs"
              >
                {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-primary" />}
                <span>Auto-détecter GPS</span>
              </Button>
            </div>

            {/* Interactive Leaflet Map with Live Search and Pin Dragging */}
            <LocationPickerMap
              lat={lat ? parseFloat(lat) : null}
              lng={lng ? parseFloat(lng) : null}
              address={address}
              ville={ville}
              pays={pays}
              onLocationChange={handleMapLocationChange}
            />

            {/* Coordinate input fields and address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Adresse / Quartier</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rue des Palmiers, Akwa"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Ville</Label>
                <Input
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ex: Douala, Yaoundé"
                  className="h-8 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Pays (ISO)</Label>
                <Select value={pays} onValueChange={setPays}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CM">🇨🇲 Cameroun (CM)</SelectItem>
                    <SelectItem value="CI">🇨🇮 Côte d'Ivoire (CI)</SelectItem>
                    <SelectItem value="SN">🇸🇳 Sénégal (SN)</SelectItem>
                    <SelectItem value="NG">🇳🇬 Nigeria (NG)</SelectItem>
                    <SelectItem value="GA">🇬🇦 Gabon (GA)</SelectItem>
                    <SelectItem value="CD">🇨🇩 RDC (CD)</SelectItem>
                    <SelectItem value="FR">🇫🇷 France (FR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Latitude GPS</Label>
                <Input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Ex: 4.051056"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Longitude GPS</Label>
                <Input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Ex: 9.767868"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. LOGO & BANNIÈRE (UPLOAD DIRECT & URL) */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              Médias du Salon (Logo & Bannière)
            </h4>

            {/* Hidden native file inputs */}
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'logo');
              }}
            />
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'banner');
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Section */}
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Logo du Salon</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="h-7 text-[11px] font-semibold rounded-full gap-1.5 bg-background hover:bg-primary/10 hover:text-primary"
                  >
                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <UploadCloud className="w-3 h-3 text-primary" />}
                    <span>{uploadingLogo ? 'Upload...' : 'Uploader Logo'}</span>
                  </Button>
                </div>

                {/* Logo Preview */}
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-muted-foreground/40" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Ou coller une URL https://..."
                      className="h-8 text-xs font-mono"
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Supprimer le logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Section */}
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Bannière / Couverture</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="h-7 text-[11px] font-semibold rounded-full gap-1.5 bg-background hover:bg-primary/10 hover:text-primary"
                  >
                    {uploadingBanner ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <UploadCloud className="w-3 h-3 text-primary" />}
                    <span>{uploadingBanner ? 'Upload...' : 'Uploader Bannière'}</span>
                  </Button>
                </div>

                {/* Banner Preview */}
                <div className="space-y-1.5">
                  <div className="relative h-16 w-full rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden shadow-xs">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" /> Aucune bannière
                      </span>
                    )}
                    {uploadingBanner && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="Ou coller une URL https://..."
                      className="h-8 text-xs font-mono flex-1"
                    />
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="text-[10px] text-destructive hover:underline shrink-0"
                        title="Supprimer la bannière"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. IDENTITÉ & PROFIL DU SALON */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Identité & Profil
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nom du salon *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slug URL (ex: /salon/mon-salon)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="laisser vide pour auto"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Type d'établissement</Label>
                <Select value={typeEtablissement} onValueChange={setTypeEtablissement}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon_coiffure">Salon de Coiffure</SelectItem>
                    <SelectItem value="barbershop">Barber Shop</SelectItem>
                    <SelectItem value="onglerie">Bar à Ongles / Onglerie</SelectItem>
                    <SelectItem value="spa">Spa & Massages</SelectItem>
                    <SelectItem value="institut_beaute">Institut de Beauté</SelectItem>
                    <SelectItem value="mixte">Salon Mixte / Beauté Complète</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Modèle de structure</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">Salon avec local physique</SelectItem>
                    <SelectItem value="freelance">Freelance / Prestataire indépendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Téléphone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email professionnel</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description / Biographie</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentation des services, ambiance et expertise..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* 5. PLAN & ABONNEMENT */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Abonnement & Plan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Plan BeautyFlow</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="h-9 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Statut Abonnement</Label>
                <Select value={subStatut} onValueChange={setSubStatut}>
                  <SelectTrigger className="h-9 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">🟢 Actif</SelectItem>
                    <SelectItem value="essai">🔵 Essai gratuit</SelectItem>
                    <SelectItem value="expire">🔴 Expiré</SelectItem>
                    <SelectItem value="suspendu">🟡 Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date d'expiration</Label>
                <Input
                  type="date"
                  value={subDateFin}
                  onChange={(e) => setSubDateFin(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between gap-3 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading || uploadingLogo || uploadingBanner}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-full px-6 gap-2 shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Enregistrer les modifications</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditSalonModal;
