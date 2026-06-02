import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { MapPin, Clock, Star, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BrandedShell } from '@/components/booking/BrandedShell';
import { readPublicSalon, readServices } from '@/lib/booking';

export default function PublicBookingLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const salon = slug ? readPublicSalon(slug) : null;
  if (!salon) return <Navigate to="/booking/not-found" replace />;

  const allServices = readServices(salon.id);
  const services = allServices.slice(0, 6);
  const banner = salon.branding?.bannerUrl;
  const logo = salon.branding?.logoUrl;

  return (
    <BrandedShell salon={salon} showHeader={false}>
      <div className="max-w-2xl mx-auto pb-24">
        {/* Banner */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10">
          {banner && (
            <img src={banner} alt={salon.nom} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="px-4 -mt-12 relative">
          {/* Logo + name */}
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img src={logo} alt={salon.nom} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="pb-2">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{salon.nom}</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>Nouveau salon</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {salon.branding?.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {salon.branding.description}
            </p>
          )}

          {/* Info cards */}
          <div className="mt-5 grid grid-cols-1 gap-2">
            {(salon.branding?.location || salon.adresse) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{salon.branding?.location || salon.adresse}</span>
              </div>
            )}
            {salon.branding?.hours && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{salon.branding.hours}</span>
              </div>
            )}
          </div>

          {/* Services preview */}
          <div className="mt-6">
            <h2 className="text-base font-semibold mb-3">Nos prestations populaires</h2>
            <div className="grid grid-cols-2 gap-2">
              {services.map(s => (
                <Card key={s.id} className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{s.nom}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.prix.toLocaleString('fr-FR')} FCFA
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              size="lg"
              className="w-full h-14 text-base gradient-primary shadow-lg"
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