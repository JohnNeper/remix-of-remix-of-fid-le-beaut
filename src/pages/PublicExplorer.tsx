import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ArrowRight, Star, Calendar, Heart, Sparkles, Scissors, Hand, Flower2, Brush, SlidersHorizontal, Navigation, Clock, Zap, X, Loader2 } from 'lucide-react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getSalonAccounts } from '@/lib/auth';
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { getBookingPublicUrl } from '@/lib/booking';
import { getCategoryImage } from '@/lib/category-images';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: Sparkles },
  { id: 'Coiffure', label: 'Coiffure', icon: Scissors },
  { id: 'Onglerie', label: 'Ongles', icon: Hand },
  { id: 'Spa', label: 'Spa & Bien-être', icon: Flower2 },
  { id: 'Maquillage', label: 'Maquillage', icon: Brush },
];

function extractCity(loc?: string): string | null {
  if (!loc) return null;
  // Use the last comma-separated chunk (typical "Quartier, Ville" format),
  // fallback to trimmed string.
  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
  const city = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return city || null;
}

function isSalonOpenNow(s: ReturnType<typeof getSalonAccounts>[number]): boolean {
  const bs = s.bookingSettings;
  if (!bs) return true;
  const now = new Date();
  const day = now.getDay();
  if (bs.closedDays?.includes(day)) return false;
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= (bs.openingHour ?? 9) && h < (bs.closingHour ?? 19);
}

export default function PublicExplorer() {
  const navigate = useNavigate();
  const { client, isFavorite, toggleFavorite } = useClientAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [openNow, setOpenNow] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);
  const [locating, setLocating] = useState(false);

  const salons = useMemo(() => getSalonAccounts().filter(s => !!s.slug), []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const s of salons) {
      const c = extractCity(s.branding?.location || s.adresse);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [salons]);

  const filtered = salons.filter(s => {
    if (category !== 'all') {
      const cat = (s.branding?.category || '').toLowerCase();
      if (!cat.includes(category.toLowerCase())) return false;
    }
    if (cityFilter !== 'all') {
      const c = extractCity(s.branding?.location || s.adresse);
      if (!c || c.toLowerCase() !== cityFilter.toLowerCase()) return false;
    }
    if (openNow && !isSalonOpenNow(s)) return false;
    if (instantOnly && !s.bookingSettings?.autoConfirm) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.nom.toLowerCase().includes(q) ||
      (s.branding?.location || s.adresse || '').toLowerCase().includes(q) ||
      (s.branding?.description || '').toLowerCase().includes(q) ||
      (s.branding?.category || '').toLowerCase().includes(q)
    );
  });

  const activeFiltersCount =
    (category !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0) +
    (openNow ? 1 : 0) +
    (instantOnly ? 1 : 0);

  const resetFilters = () => {
    setCategory('all');
    setCityFilter('all');
    setOpenNow(false);
    setInstantOnly(false);
    setQuery('');
  };

  const detectMyCity = () => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'Géolocalisation indisponible', description: 'Votre navigateur ne supporte pas cette fonctionnalité.', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
          );
          const data = await res.json();
          const detected: string | undefined = data.city || data.locality || data.principalSubdivision;
          if (detected) {
            const match = cities.find(c => c.toLowerCase() === detected.toLowerCase())
              || cities.find(c => detected.toLowerCase().includes(c.toLowerCase()))
              || cities.find(c => c.toLowerCase().includes(detected.toLowerCase()));
            if (match) {
              setCityFilter(match);
              toast({ title: `Position détectée : ${detected}`, description: `Salons à ${match} affichés.` });
            } else {
              setQuery(detected);
              toast({ title: `Position détectée : ${detected}`, description: 'Aucun salon enregistré dans cette ville — recherche élargie.' });
            }
          } else {
            toast({ title: 'Position non identifiée', description: 'Impossible de déterminer votre ville.', variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Erreur de géolocalisation', description: 'Réessayez dans un instant.', variant: 'destructive' });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast({ title: 'Accès refusé', description: 'Autorisez la localisation pour utiliser cette option.', variant: 'destructive' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <ExplorerHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-10 right-0 h-64 w-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8 text-center">
          <Badge variant="secondary" className="mb-4 animate-fade-in">
            <Sparkles className="h-3 w-3 mr-1" />
            {salons.length} salons partenaires • Réservation 24h/24
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight animate-fade-in">
            Votre <span className="text-gradient">moment beauté</span><br />
            commence ici.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {client ? `Bienvenue ${client.nom.split(' ')[0]} ✨ Trouvez votre prochain rendez-vous` : 'Découvrez les meilleurs salons près de chez vous et réservez en quelques secondes.'}
          </p>

          {/* Smart search bar */}
          <div className="mt-6 max-w-2xl mx-auto animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 bg-card rounded-full shadow-xl border border-border/60 p-1.5 pl-4 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Salon, ville, service…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 shadow-none bg-transparent h-10 px-1 focus-visible:ring-0 text-sm sm:text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Effacer"
                  className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={detectMyCity}
                disabled={locating}
                className="rounded-full h-10 px-3 gap-1.5 text-xs hidden sm:inline-flex hover:bg-primary/10 hover:text-primary"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                Près de moi
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" size="sm" className="rounded-full h-10 gap-1.5 px-4 gradient-primary shadow-md">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtres</span>
                    {activeFiltersCount > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background text-primary text-[10px] font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filtres</h3>
                    {activeFiltersCount > 0 && (
                      <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                        Tout réinitialiser
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Ville
                    </Label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Toutes les villes" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">Toutes les villes</SelectItem>
                        {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Type de soin
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="f-open" className="text-sm flex items-center gap-2 cursor-pointer">
                        <Clock className="h-4 w-4 text-primary" />
                        Ouvert maintenant
                      </Label>
                      <Switch id="f-open" checked={openNow} onCheckedChange={setOpenNow} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="f-instant" className="text-sm flex items-center gap-2 cursor-pointer">
                        <Zap className="h-4 w-4 text-accent" />
                        Confirmation instantanée
                      </Label>
                      <Switch id="f-instant" checked={instantOnly} onCheckedChange={setInstantOnly} />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectMyCity}
                    disabled={locating}
                    className="w-full gap-2 sm:hidden"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    Utiliser ma position
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 animate-fade-in">
                {cityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7">
                    <MapPin className="h-3 w-3" /> {cityFilter}
                    <button onClick={() => setCityFilter('all')} className="ml-0.5 rounded-full hover:bg-background/50 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {category !== 'all' && (
                  <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7">
                    {CATEGORIES.find(c => c.id === category)?.label}
                    <button onClick={() => setCategory('all')} className="ml-0.5 rounded-full hover:bg-background/50 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {openNow && (
                  <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7">
                    <Clock className="h-3 w-3" /> Ouvert
                    <button onClick={() => setOpenNow(false)} className="ml-0.5 rounded-full hover:bg-background/50 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {instantOnly && (
                  <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7">
                    <Zap className="h-3 w-3" /> Instantané
                    <button onClick={() => setInstantOnly(false)} className="ml-0.5 rounded-full hover:bg-background/50 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-5xl mx-auto px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-1">
            {CATEGORIES.map((c, i) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-4 h-10 rounded-full border-2 text-sm font-medium transition-all active:scale-95 animate-fade-in ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/40'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Salon grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {filtered.length} salon{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground animate-fade-in">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Aucun salon ne correspond à votre recherche.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => {
              const primary = s.branding?.primaryColor || '350 75% 55%';
              const accent = s.branding?.secondaryColor || '25 95% 60%';
              const fav = isFavorite(s.id);
              const rating = s.branding?.rating ?? 4.8;
              const reviewCount = s.branding?.reviewCount ?? 0;
              return (
                <Card
                  key={s.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/60 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => navigate(`/booking/${s.slug}`)}
                >
                  <div className="h-40 relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}>
                    <img
                      src={s.branding?.bannerUrl || getCategoryImage(s.branding?.category?.split(' ')[0])}
                      alt={s.nom}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = getCategoryImage(); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      {s.branding?.category && (
                        <span className="bg-background/95 backdrop-blur rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm">
                          {s.branding.category}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          aria-label="Partager le lien"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = getBookingPublicUrl(s.slug!);
                            const shareData = { title: s.nom, text: `Réservez chez ${s.nom}`, url };
                            try {
                              if (navigator.share) {
                                await navigator.share(shareData);
                              } else {
                                await navigator.clipboard.writeText(url);
                                toast({ title: 'Lien copié', description: url });
                              }
                            } catch {
                              try {
                                await navigator.clipboard.writeText(url);
                                toast({ title: 'Lien copié', description: url });
                              } catch {
                                toast({ title: 'Impossible de partager', description: url, variant: 'destructive' });
                              }
                            }
                          }}
                          className="h-8 w-8 rounded-full backdrop-blur flex items-center justify-center shadow transition-all active:scale-90 bg-background/95 text-foreground hover:bg-background"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Ajouter aux favoris"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!client) { navigate('/explorer/login'); return; }
                            toggleFavorite(s.id);
                          }}
                          className={`h-8 w-8 rounded-full backdrop-blur flex items-center justify-center shadow transition-all active:scale-90 ${
                            fav ? 'bg-primary text-primary-foreground' : 'bg-background/95 text-foreground hover:bg-background'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Rating bottom-left */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/95 backdrop-blur rounded-full px-2.5 py-1 text-xs font-semibold shadow">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rating.toFixed(1)}
                      <span className="text-muted-foreground font-normal">({reviewCount})</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-base leading-tight truncate">{s.nom}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.branding?.location || s.adresse || 'Cameroun'}</span>
                    </div>
                    {s.branding?.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.branding.description}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-3 group-hover:shadow-md transition-all rounded-lg"
                      style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`, color: 'white' }}
                    >
                      <Calendar className="h-4 w-4 mr-1.5" />
                      Réserver
                      <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Propulsé par <span className="font-semibold text-foreground">BeautyFlow</span>
      </footer>
    </div>
  );
}