import React from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Heart, MapPin, Sparkles, Calendar, LogOut, Trash2, History, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader';
import { getSalonAccounts } from '@/lib/auth';

export default function ClientAccount() {
  const { client, signout, toggleFavorite } = useClientAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'profile';

  if (!client) return <Navigate to="/explorer/login?redirect=/explorer/account" replace />;

  const allSalons = getSalonAccounts();
  const favorites = allSalons.filter(s => client.favorites.includes(s.id));

  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />
      <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
            {client.nom.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight truncate">{client.nom}</h1>
            <p className="text-xs text-muted-foreground truncate">{client.email}</p>
            <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
              <span><Heart className="h-3 w-3 inline mr-0.5" />{client.favorites.length} favoris</span>
              <span><History className="h-3 w-3 inline mr-0.5" />{client.visits.length} visites</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { signout(); navigate('/explorer'); }} title="Déconnexion">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue={tab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-1" />Profil</TabsTrigger>
            <TabsTrigger value="favorites"><Heart className="h-4 w-4 mr-1" />Favoris</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-1" />Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-3">
            <Card className="p-4">
              <Row label="Nom" value={client.nom} />
              <Row label="Email" value={client.email} />
              {client.telephone && <Row label="Téléphone" value={client.telephone} />}
              <Row label="Membre depuis" value={format(new Date(client.dateCreation), 'd MMMM yyyy', { locale: fr })} />
            </Card>
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-sm mb-1">Bientôt</h3>
              <p className="text-xs text-muted-foreground">Notifications de rappel, recommandations personnalisées et code de fidélité multi-salons.</p>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            {favorites.length === 0 ? (
              <Card className="p-10 text-center">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Aucun favori pour l'instant</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Explorez les salons et touchez le cœur ♥ pour les sauvegarder.</p>
                <Button asChild className="gradient-primary"><Link to="/explorer">Explorer les salons</Link></Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(s => {
                  const primary = s.branding?.primaryColor || '350 75% 55%';
                  const accent = s.branding?.secondaryColor || '25 95% 60%';
                  return (
                    <Card key={s.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate(`/booking/${s.slug}`)}>
                      <div className="h-24 relative" style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}>
                        {s.branding?.bannerUrl && <img src={s.branding.bannerUrl} alt={s.nom} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                        <Button
                          size="icon" variant="secondary"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-sm truncate">{s.nom}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /><span className="truncate">{s.branding?.location || s.adresse}</span></div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {client.visits.length === 0 ? (
              <Card className="p-10 text-center">
                <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Aucune visite enregistrée</p>
                <p className="text-xs text-muted-foreground mt-1">Les salons que vous consultez apparaîtront ici.</p>
              </Card>
            ) : (
              <Card className="divide-y">
                {client.visits.map((v, i) => (
                  <Link key={i} to={`/booking/${v.salonSlug}`} className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{v.salonNom}</div>
                      <div className="text-[11px] text-muted-foreground">{format(new Date(v.visitedAt), 'd MMM yyyy à HH:mm', { locale: fr })}</div>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}