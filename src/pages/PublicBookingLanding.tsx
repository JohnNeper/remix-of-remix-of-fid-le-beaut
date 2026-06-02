import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  MapPin, Clock, Star, Sparkles, Calendar, Heart, Share2,
  Instagram, Users, Camera, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BrandedShell } from '@/components/booking/BrandedShell';
import { readPublicSalon, readServices } from '@/lib/booking';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { toast } from '@/hooks/use-toast';

export default function PublicBookingLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const salon = slug ? readPublicSalon(slug) : null;
  const { client, isFavorite, toggleFavorite, logVisit } = useClientAuth();
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (salon && client) {
      logVisit({ salonId: salon.id, salonSlug: salon.slug!, salonNom: salon.nom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id, client?.id]);

  if (!salon) return <Navigate to="/booking/not-found" replace />;

  const allServices = readServices(salon.id);
  const banner = salon.branding?.bannerUrl;
  const logo = salon.branding?.logoUrl;
  const gallery = salon.branding?.gallery || [];
  const staff = salon.branding?.staff || [];
  const rating = salon.branding?.rating ?? 4.8;
  const reviewCount = salon.branding?.reviewCount ?? 0;
  const fav = isFavorite(salon.id);

  const servicesByCat = useMemo(() => {
    const m = new Map<string, typeof allServices>();
    for (const s of allServices) {
      const c = s.categorie || 'Prestations';
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(s);
    }
    return Array.from(m.entries());
  }, [allServices]);

  const handleFav = () => {
    if (!client) { navigate(`/explorer/login?redirect=/booking/${slug}`); return; }
    toggleFavorite(salon.id);
    toast({ title: fav ? 'Retiré des favoris' : '♥ Ajouté à vos favoris' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: salon.nom, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié' });
    }
  };

  return (
    <BrandedShell salon={salon} showHeader={false}>
      <div className="max-w-2xl mx-auto pb-28">
        {/* Hero banner */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20">
          {banner && (
            <img src={banner} alt={salon.nom} className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Top actions */}
          <div className="absolute top-3 left-3 right-3 flex justify-between">
            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-background/90 backdrop-blur shadow" onClick={() => navigate('/explorer')}>
              <Sparkles className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-background/90 backdrop-blur shadow" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary" size="icon"
                className={`h-9 w-9 rounded-full backdrop-blur shadow transition-all ${fav ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-background/90'}`}
                onClick={handleFav}
              >
                <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-14 relative">
          {/* Logo + name */}
          <div className="flex items-end gap-4 animate-fade-in">
            <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img src={logo} alt={salon.nom} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="pb-2 min-w-0 flex-1">
              {salon.branding?.category && (
                <Badge variant="secondary" className="mb-1 text-[10px]">{salon.branding.category}</Badge>
              )}
              <h1 className="text-2xl font-bold leading-tight truncate">{salon.nom}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                  <span>({reviewCount} avis)</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Award className="h-3 w-3" />Pro vérifié</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {salon.branding?.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.05s' }}>
              {salon.branding.description}
            </p>
          )}

          {/* Quick info */}
          <div className="mt-5 grid grid-cols-1 gap-2">
            {(salon.branding?.location || salon.adresse) && (
              <InfoLine icon={MapPin} text={salon.branding?.location || salon.adresse!} />
            )}
            {salon.branding?.hours && <InfoLine icon={Clock} text={salon.branding.hours} />}
            {salon.branding?.instagram && (
              <InfoLine icon={Instagram} text={salon.branding.instagram} />
            )}
          </div>

          {/* Tabs: Services / Galerie / Équipe */}
          <Tabs defaultValue="services" className="mt-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="services"><Sparkles className="h-3.5 w-3.5 mr-1" />Services</TabsTrigger>
              <TabsTrigger value="gallery"><Camera className="h-3.5 w-3.5 mr-1" />Galerie</TabsTrigger>
              <TabsTrigger value="staff"><Users className="h-3.5 w-3.5 mr-1" />Équipe</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4 space-y-4">
              {servicesByCat.slice(0, 4).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h3>
                  <div className="space-y-1.5">
                    {items.slice(0, 4).map(s => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/booking/${slug}/book`)}
                        className="w-full text-left p-3 rounded-xl border bg-card hover:border-primary hover:shadow-sm transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{s.nom}</div>
                          {s.description && <div className="text-[11px] text-muted-foreground truncate">{s.description}</div>}
                        </div>
                        <div className="text-sm font-bold text-primary whitespace-nowrap">{s.prix.toLocaleString('fr-FR')} FCFA</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              {gallery.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Aucune photo pour le moment.
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(src)}
                      className="relative aspect-square overflow-hidden rounded-xl group animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <img src={src} alt={`${salon.nom} ${i + 1}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff" className="mt-4">
              {staff.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Équipe non renseignée.
                </Card>
              ) : (
                <div className="space-y-2">
                  {staff.map((m, i) => (
                    <Card key={m.id} className="p-3 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                        {m.photoUrl ? <img src={m.photoUrl} alt={m.nom} className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{m.nom}</div>
                        {m.role && <div className="text-[11px] text-muted-foreground">{m.role}</div>}
                        {m.specialties && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.specialties.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg" />
          </div>
        )}

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-xl border-t z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              size="lg"
              className="w-full h-13 text-base gradient-primary shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => navigate(`/booking/${slug}/book`)}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Réserver un rendez-vous
            </Button>
          </div>
        </div>
      </div>
    </BrandedShell>
  );
}

function InfoLine({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:border-primary/40 transition-colors">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}