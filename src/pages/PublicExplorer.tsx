import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ArrowRight, Star, Calendar, Heart, Sparkles, Scissors, Hand, Flower2, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSalonAccounts } from '@/lib/auth';
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader';
import { useClientAuth } from '@/contexts/ClientAuthContext';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: Sparkles },
  { id: 'Coiffure', label: 'Coiffure', icon: Scissors },
  { id: 'Onglerie', label: 'Ongles', icon: Hand },
  { id: 'Spa', label: 'Spa & Bien-être', icon: Flower2 },
  { id: 'Maquillage', label: 'Maquillage', icon: Brush },
];

export default function PublicExplorer() {
  const navigate = useNavigate();
  const { client, isFavorite, toggleFavorite } = useClientAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const salons = useMemo(() => getSalonAccounts().filter(s => !!s.slug), []);

  const filtered = salons.filter(s => {
    if (category !== 'all') {
      const cat = (s.branding?.category || '').toLowerCase();
      if (!cat.includes(category.toLowerCase())) return false;
    }
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.nom.toLowerCase().includes(q) ||
      (s.branding?.location || s.adresse || '').toLowerCase().includes(q) ||
      (s.branding?.description || '').toLowerCase().includes(q) ||
      (s.branding?.category || '').toLowerCase().includes(q)
    );
  });

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

          <div className="mt-6 max-w-md mx-auto relative animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un salon, une ville, un service…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 py-3 rounded-full bg-card shadow-lg border-border/60 focus-visible:ring-primary"
            />
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
                    {s.branding?.bannerUrl && (
                      <img src={s.branding.bannerUrl} alt={s.nom} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      {s.branding?.category && (
                        <span className="bg-background/95 backdrop-blur rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm">
                          {s.branding.category}
                        </span>
                      )}
                      <button
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
        Propulsé par <span className="font-semibold text-foreground">BeautyFlow</span> •
        <button onClick={() => navigate('/login')} className="ml-1 underline underline-offset-2 hover:text-foreground">
          Vous êtes un salon ? Connexion pro
        </button>
      </footer>
    </div>
  );
}