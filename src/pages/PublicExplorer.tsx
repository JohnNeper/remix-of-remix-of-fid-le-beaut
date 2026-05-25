import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Search, ArrowRight, Star, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getSalonAccounts } from '@/lib/auth';

export default function PublicExplorer() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const salons = useMemo(
    () => getSalonAccounts().filter(s => !!s.slug),
    [],
  );

  const filtered = salons.filter(s => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.nom.toLowerCase().includes(q) ||
      (s.branding?.location || s.adresse || '').toLowerCase().includes(q) ||
      (s.branding?.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/explorer" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">BeautyFlow</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-xs"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Espace pro
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Réservez votre rendez-vous
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            beauté & bien-être
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Découvrez nos salons partenaires et réservez en quelques clics, 24h/24, sans appel.
        </p>

        <div className="mt-6 max-w-md mx-auto relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un salon, une ville…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-12 rounded-full bg-card shadow-sm"
          />
        </div>
      </section>

      {/* Salon grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {filtered.length} salon{filtered.length > 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Aucun salon ne correspond à votre recherche.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const primary = s.branding?.primaryColor || '350 75% 55%';
              const accent = s.branding?.secondaryColor || '25 95% 60%';
              return (
                <Card
                  key={s.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all border-border/60"
                  onClick={() => navigate(`/booking/${s.slug}`)}
                >
                  <div
                    className="h-32 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, hsl(${primary} / 0.95), hsl(${accent} / 0.85))`,
                    }}
                  >
                    {s.branding?.bannerUrl && (
                      <img
                        src={s.branding.bannerUrl}
                        alt={s.nom}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full px-2 py-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      Nouveau
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-12 w-12 -mt-8 rounded-xl border-4 border-card shadow-md flex items-center justify-center overflow-hidden shrink-0"
                        style={{ background: `hsl(${primary} / 0.15)` }}
                      >
                        {s.branding?.logoUrl ? (
                          <img src={s.branding.logoUrl} alt={s.nom} className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="h-5 w-5" style={{ color: `hsl(${primary})` }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight truncate">{s.nom}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {s.branding?.location || s.adresse || 'Cameroun'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {s.branding?.description && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.branding.description}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-3 group-hover:translate-x-0.5 transition-transform"
                      style={{
                        background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`,
                        color: 'white',
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1.5" />
                      Réserver
                      <ArrowRight className="h-4 w-4 ml-1.5" />
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