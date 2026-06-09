import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ArrowRight, Star, Calendar, Sparkles, Scissors, Hand, Flower2, Brush, Navigation, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSalonAccounts } from '@/lib/auth';
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader';
import { getBookingPublicUrl, readServices } from '@/lib/booking';
import { getCategoryImage } from '@/lib/category-images';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: Sparkles },
  { id: 'Coiffure', label: 'Coiffure', icon: Scissors },
  { id: 'Onglerie', label: 'Ongles', icon: Hand },
  { id: 'Spa', label: 'Spa & Bien-être', icon: Flower2 },
  { id: 'Maquillage', label: 'Maquillage', icon: Brush },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function PublicExplorer() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const salons = useMemo(() => getSalonAccounts().filter(s => !!s.slug), []);

  // Unique cities derived from salon data
  const cities = useMemo(() => {
    const set = new Set<string>();
    salons.forEach(s => {
      const c = s.branding?.city || (s.branding?.location || s.adresse || '').split(',').pop()?.trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [salons]);

  // Unique services across all salons
  const allServiceNames = useMemo(() => {
    const set = new Set<string>();
    salons.forEach(s => readServices(s.id).forEach(p => set.add(p.nom)));
    return Array.from(set).sort();
  }, [salons]);

  // Map salonId -> service names
  const servicesBySalon = useMemo(() => {
    const m = new Map<string, string[]>();
    salons.forEach(s => m.set(s.id, readServices(s.id).map(p => p.nom)));
    return m;
  }, [salons]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Géolocalisation non supportée', variant: 'destructive' });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        toast({ title: '📍 Position détectée', description: 'Salons triés par proximité' });
      },
      () => {
        setGeoLoading(false);
        toast({ title: 'Position refusée', description: 'Autorisez la localisation pour trier par proximité', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const filtered = useMemo(() => {
    let list = salons.filter(s => {
      if (category !== 'all') {
        const cat = (s.branding?.category || '').toLowerCase();
        if (!cat.includes(category.toLowerCase())) return false;
      }
      if (city !== 'all') {
        const c = s.branding?.city || (s.branding?.location || s.adresse || '').toLowerCase();
        if (!c.toLowerCase().includes(city.toLowerCase())) return false;
      }
      if (serviceFilter !== 'all') {
        const list = servicesBySalon.get(s.id) || [];
        if (!list.includes(serviceFilter)) return false;
      }
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const services = (servicesBySalon.get(s.id) || []).join(' ').toLowerCase();
      return (
        s.nom.toLowerCase().includes(q) ||
        (s.branding?.location || s.adresse || '').toLowerCase().includes(q) ||
        (s.branding?.description || '').toLowerCase().includes(q) ||
        (s.branding?.category || '').toLowerCase().includes(q) ||
        services.includes(q)
      );
    });
    if (userPos) {
      list = [...list].sort((a, b) => {
        const da = a.branding?.coords ? haversineKm(userPos, a.branding.coords) : Infinity;
        const db = b.branding?.coords ? haversineKm(userPos, b.branding.coords) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [salons, category, city, serviceFilter, query, userPos, servicesBySalon]);

  const activeFilters = (category !== 'all' ? 1 : 0) + (city !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0) + (userPos ? 1 : 0);
  const resetFilters = () => { setCategory('all'); setCity('all'); setServiceFilter('all'); setUserPos(null); setQuery(''); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <ExplorerHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-10 right-0 h-64 w-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-6 text-center">
          <Badge variant="secondary" className="mb-4 animate-fade-in">
            <Sparkles className="h-3 w-3 mr-1" />
            {salons.length} salons partenaires • Réservation 24h/24
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-fade-in">
            Votre <span className="text-gradient">moment beauté</span><br />
            commence ici.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Découvrez les meilleurs salons près de chez vous et réservez en quelques secondes — sans inscription.
          </p>

          {/* Search + filters bar */}
          <div className="mt-6 max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-card rounded-2xl shadow-xl border border-border/60 p-2 flex flex-col sm:flex-row gap-2 items-stretch">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Salon, prestation, ville…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 sm:flex-none h-11 px-3 rounded-xl bg-muted/50 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-w-0"
                >
                  <option value="all">📍 Toutes villes</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button
                  type="button"
                  variant={userPos ? 'default' : 'outline'}
                  className="h-11 rounded-xl gap-1.5 shrink-0"
                  onClick={detectLocation}
                  disabled={geoLoading}
                >
                  <Navigation className={`h-4 w-4 ${geoLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{userPos ? 'Proche de moi' : 'Près de moi'}</span>
                </Button>
              </div>
            </div>

            {/* Service prestation filter */}
            {allServiceNames.length > 0 && (
              <div className="mt-3 flex items-center gap-2 max-w-full overflow-x-auto pb-1">
                <span className="text-[11px] text-muted-foreground shrink-0 uppercase tracking-wider font-semibold">Prestation:</span>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="h-9 px-3 rounded-full bg-card border border-border text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Toutes prestations</option>
                  {allServiceNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {activeFilters > 0 && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <X className="h-3 w-3" />Réinitialiser ({activeFilters})
                  </button>
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
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {filtered.length} salon{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </h2>
          {userPos && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Navigation className="h-3 w-3" />Trié par proximité
            </Badge>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground animate-fade-in">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Aucun salon ne correspond à votre recherche.
            <Button variant="link" onClick={resetFilters} className="mt-2">Réinitialiser les filtres</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((s, i) => {
              const primary = s.branding?.primaryColor || '350 75% 55%';
              const accent = s.branding?.secondaryColor || '25 95% 60%';
              const rating = s.branding?.rating ?? 4.8;
              const reviewCount = s.branding?.reviewCount ?? 0;
              const distance = userPos && s.branding?.coords
                ? haversineKm(userPos, s.branding.coords)
                : null;
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
                    </div>

                    {/* Rating + distance bottom */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur rounded-full px-2.5 py-1 text-xs font-semibold shadow">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                        <span className="text-muted-foreground font-normal">({reviewCount})</span>
                      </div>
                      {distance !== null && (
                        <div className="flex items-center gap-1 bg-primary/95 text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold shadow">
                          <Navigation className="h-3 w-3" />
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                        </div>
                      )}
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

      <footer className="border-t py-6 text-center text-xs text-muted-foreground px-4">
        Propulsé par <span className="font-semibold text-foreground">BeautyFlow</span>
        <span className="mx-1">•</span>
        <button onClick={() => navigate('/login')} className="underline underline-offset-2 hover:text-foreground">
          Vous êtes un salon ? Espace pro
        </button>
      </footer>
    </div>
  );
}