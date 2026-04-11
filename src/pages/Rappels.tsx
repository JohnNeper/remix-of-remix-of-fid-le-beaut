import React, { useState, useMemo } from 'react';
import { Bell, MessageSquare, Clock, CheckCircle, Send, ThumbsUp, Calendar, Star, Phone, Search, Users, TrendingUp, Gift, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { SatisfactionSurvey } from '@/components/sav/SatisfactionSurvey';
import { cn } from '@/lib/utils';
import heroSalon from '@/assets/hero-salon.jpg';
import celebrationImg from '@/assets/celebration.jpg';

export default function Rappels() {
  const { clients, getInactiveClients, updateClient } = useClients();
  const { salon } = useSalon();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSatisfaction, setShowSatisfaction] = useState<string | null>(null);

  const clientesInactives = getInactiveClients(salon.joursRappelInactivite);

  const clientesAnniversaire = useMemo(() => clients.filter(c => {
    if (!c.dateAnniversaire) return false;
    const today = new Date();
    const anniv = new Date(c.dateAnniversaire);
    return anniv.getMonth() === today.getMonth();
  }), [clients]);

  const clientesSuivi = useMemo(() => clients.filter(c => {
    if (!c.derniereVisite) return false;
    const daysSince = Math.floor((Date.now() - new Date(c.derniereVisite).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7 && daysSince <= salon.joursRappelSuivi;
  }), [clients, salon.joursRappelSuivi]);

  // Clients fidèles proches d'un cadeau
  const clientesProcheCadeau = useMemo(() => clients.filter(c => {
    const remaining = salon.configFidelite.visitesRequises - (c.pointsFidelite % salon.configFidelite.visitesRequises);
    return remaining <= 2 && remaining > 0 && c.pointsFidelite > 0;
  }), [clients, salon.configFidelite.visitesRequises]);

  // Clients who haven't been contacted recently (new clients)
  const clientesNouvelles = useMemo(() => clients.filter(c => c.nombreVisites <= 1), [clients]);

  const totalActions = clientesInactives.length + clientesAnniversaire.length + clientesSuivi.length + clientesProcheCadeau.length;

  const filterClients = (list: typeof clients) => {
    if (!searchQuery) return list;
    return list.filter(c => c.nom.toLowerCase().includes(searchQuery.toLowerCase()) || c.telephone.includes(searchQuery));
  };

  const handleSendWhatsApp = (client: typeof clients[0], message: string) => {
    const formattedMessage = message
      .replace('{nom}', client.nom)
      .replace('{derniere_prestation}', client.derniereVisite ? new Date(client.derniereVisite).toLocaleDateString('fr-FR') : 'N/A')
      .replace('{points}', String(client.pointsFidelite))
      .replace('{visites}', String(client.nombreVisites));

    const phone = client.telephone.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(formattedMessage)}`, '_blank');
    toast({ title: 'WhatsApp ouvert', description: `Message préparé pour ${client.nom}` });
  };

  const handleSatisfactionSubmit = (rating: number, comment: string) => {
    if (showSatisfaction) {
      const client = clients.find(c => c.id === showSatisfaction);
      if (client) {
        const satisfactionNote = `[Satisfaction ${rating}/3] ${comment}`;
        updateClient(client.id, {
          notes: client.notes
            ? `${client.notes}\n${new Date().toLocaleDateString('fr-FR')}: ${satisfactionNote}`
            : `${new Date().toLocaleDateString('fr-FR')}: ${satisfactionNote}`
        });
      }
    }
    setShowSatisfaction(null);
  };

  const messageInactivite = `Bonjour {nom} ! 💇‍♀️\n\nCela fait un moment que nous ne vous avons pas vue au salon. Vous nous manquez !\n\nVotre dernière visite remonte au {derniere_prestation}. Nous serions ravis de vous revoir et de prendre soin de vous.\n\nÀ très bientôt ! ✨\n${salon.nom}`;
  const messageAnniversaire = `🎂 Joyeux anniversaire {nom} ! 🎉\n\nToute l'équipe de ${salon.nom} vous souhaite une merveilleuse journée !\n\nPour célébrer, nous vous offrons une surprise lors de votre prochaine visite. 🎁\n\nÀ bientôt ! 💕`;
  const messageSuivi = `Bonjour {nom} ! 😊\n\nNous espérons que votre dernière visite vous a satisfaite !\n\nN'hésitez pas à nous faire part de vos remarques. Votre avis compte beaucoup pour nous.\n\n${salon.nom} 💇‍♀️✨`;
  const messageFidelite = `Bonjour {nom} ! 🌟\n\nBonne nouvelle ! Vous êtes à seulement quelques visites de votre cadeau fidélité !\n\nVous avez déjà {points} points. Encore un petit effort et vous obtenez {salon.configFidelite.reductionPourcentage}% de réduction !\n\nOn vous attend ! 💝\n${salon.nom}`;
  const messageBienvenue = `Bonjour {nom} ! 💫\n\nMerci d'avoir choisi ${salon.nom} ! Nous sommes ravis de vous compter parmi nos clientes.\n\nN'hésitez pas à nous contacter pour votre prochain rendez-vous. Nous serons enchantés de vous revoir !\n\nÀ bientôt ! 🌸\n${salon.nom}`;

  const selectedClient = showSatisfaction ? clients.find(c => c.id === showSatisfaction) : null;

  const getDaysSinceLastVisit = (date?: string) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative h-40 lg:h-48 rounded-2xl overflow-hidden">
        <img src={heroSalon} alt="Service client" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent flex items-center p-6">
          <div className="text-white">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Service Après-Vente</h1>
            <p className="text-white/80 max-w-md">Rappels, suivi satisfaction et fidélisation de vos clientes</p>
          </div>
        </div>
      </div>

      {/* Action summary */}
      {totalActions > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {totalActions} action{totalActions > 1 ? 's' : ''} à effectuer aujourd'hui
              </p>
              <p className="text-sm text-muted-foreground">
                {clientesInactives.length > 0 && `${clientesInactives.length} inactive(s) • `}
                {clientesAnniversaire.length > 0 && `${clientesAnniversaire.length} anniversaire(s) • `}
                {clientesSuivi.length > 0 && `${clientesSuivi.length} suivi(s) • `}
                {clientesProcheCadeau.length > 0 && `${clientesProcheCadeau.length} proche(s) du cadeau`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inactives</p>
              <p className="text-2xl font-bold">{clientesInactives.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Anniversaires</p>
              <p className="text-2xl font-bold">{clientesAnniversaire.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-info/20 flex items-center justify-center shrink-0">
              <ThumbsUp className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">À suivre</p>
              <p className="text-2xl font-bold">{clientesSuivi.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proche cadeau</p>
              <p className="text-2xl font-bold">{clientesProcheCadeau.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nouvelles</p>
              <p className="text-2xl font-bold">{clientesNouvelles.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher une cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="inactives" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="inactives" className="text-xs sm:text-sm">
            ⏰ Inactives
          </TabsTrigger>
          <TabsTrigger value="anniversaires" className="text-xs sm:text-sm">
            🎂 Anniv.
          </TabsTrigger>
          <TabsTrigger value="suivi" className="text-xs sm:text-sm">
            👍 Suivi
          </TabsTrigger>
          <TabsTrigger value="fidelite" className="text-xs sm:text-sm">
            🎁 Fidélité
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Toutes
          </TabsTrigger>
        </TabsList>

        {/* Inactives */}
        <TabsContent value="inactives" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Clientes inactives
              </CardTitle>
              <CardDescription>Pas de visite depuis plus de {salon.joursRappelInactivite} jours — relancez-les !</CardDescription>
            </CardHeader>
            <CardContent>
              {filterClients(clientesInactives).length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {filterClients(clientesInactives).map((client) => {
                      const days = getDaysSinceLastVisit(client.derniereVisite);
                      const urgency = days && days > 60 ? 'destructive' : days && days > 30 ? 'warning' : 'muted';
                      return (
                        <div key={client.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-warning/50 transition-all hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                              <span className="text-warning font-semibold">{client.nom.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{client.nom}</p>
                                {days && days > 60 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgent</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {client.derniereVisite
                                  ? `Dernière visite il y a ${days} jours`
                                  : 'Jamais venue'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              const phone = client.telephone.replace(/\s/g, '').replace('+', '');
                              window.open(`tel:${phone}`, '_self');
                            }}>
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="gradient-primary" onClick={() => handleSendWhatsApp(client, messageInactivite)}>
                              <Send className="h-4 w-4 mr-2" />WhatsApp
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <EmptyState icon={CheckCircle} title="🎉 Toutes actives !" description="Toutes vos clientes sont venues récemment" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anniversaires */}
        <TabsContent value="anniversaires" className="space-y-4">
          <Card className="card-shadow overflow-hidden">
            <div className="relative h-24">
              <img src={celebrationImg} alt="Célébration" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-6">
                <div className="text-white">
                  <h3 className="font-bold text-lg">🎂 Anniversaires ce mois</h3>
                  <p className="text-sm opacity-90">Souhaitez-leur une belle journée !</p>
                </div>
              </div>
            </div>
            <CardContent className="pt-4">
              {filterClients(clientesAnniversaire).length > 0 ? (
                <div className="space-y-3">
                  {filterClients(clientesAnniversaire).map((client) => {
                    const annivDate = client.dateAnniversaire ? new Date(client.dateAnniversaire) : null;
                    const today = new Date();
                    const isToday = annivDate && annivDate.getDate() === today.getDate() && annivDate.getMonth() === today.getMonth();
                    return (
                      <div key={client.id} className={cn("flex items-center justify-between p-4 rounded-xl border", isToday ? "border-accent bg-accent/10 shadow-sm" : "border-accent/30 bg-accent/5")}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                            <span className="text-lg">{isToday ? '🎉' : '🎂'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{client.nom}</p>
                              {isToday && <Badge className="bg-accent text-accent-foreground text-[10px]">Aujourd'hui !</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {annivDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="gradient-primary" onClick={() => handleSendWhatsApp(client, messageAnniversaire)}>
                          <Send className="h-4 w-4 mr-2" />Souhaiter
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Calendar} title="Aucun anniversaire" description="Pas d'anniversaire à célébrer ce mois-ci" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suivi satisfaction */}
        <TabsContent value="suivi" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-info" />
                Suivi satisfaction
              </CardTitle>
              <CardDescription>Clientes venues entre 7 et {salon.joursRappelSuivi} jours — demandez leur avis !</CardDescription>
            </CardHeader>
            <CardContent>
              {filterClients(clientesSuivi).length > 0 ? (
                <div className="space-y-3">
                  {filterClients(clientesSuivi).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-info/20 flex items-center justify-center shrink-0">
                          <span className="text-info font-semibold">{client.nom.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{client.nom}</p>
                          <p className="text-sm text-muted-foreground">
                            Visite le {client.derniereVisite && new Date(client.derniereVisite).toLocaleDateString('fr-FR')}
                            {' '}• {client.nombreVisites} visites au total
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowSatisfaction(client.id)}>
                          <Star className="h-4 w-4 mr-2" />Satisfaction
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSendWhatsApp(client, messageSuivi)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ThumbsUp} title="Aucun suivi en attente" description="Les clientes récentes seront listées ici pour un suivi satisfaction" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fidélité - proche du cadeau */}
        <TabsContent value="fidelite" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Clientes proches du cadeau fidélité
              </CardTitle>
              <CardDescription>
                Ces clientes sont à 1-2 visites de leur cadeau — encouragez-les à revenir !
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filterClients(clientesProcheCadeau).length > 0 ? (
                <div className="space-y-3">
                  {filterClients(clientesProcheCadeau).map((client) => {
                    const remaining = salon.configFidelite.visitesRequises - (client.pointsFidelite % salon.configFidelite.visitesRequises);
                    const progress = ((salon.configFidelite.visitesRequises - remaining) / salon.configFidelite.visitesRequises) * 100;
                    return (
                      <div key={client.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{client.nom}</p>
                                {client.statut === 'vip' && <Badge className="bg-accent/20 text-accent text-xs"><Star className="h-3 w-3 mr-1" />VIP</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Plus que <strong>{remaining} visite{remaining > 1 ? 's' : ''}</strong> pour le cadeau !
                              </p>
                            </div>
                          </div>
                          <Button size="sm" className="gradient-primary" onClick={() => handleSendWhatsApp(client, messageFidelite)}>
                            <Send className="h-4 w-4 mr-2" />Motiver
                          </Button>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {client.pointsFidelite} / {salon.configFidelite.visitesRequises} points
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Gift} title="Aucune cliente proche du cadeau" description="Les clientes à 1-2 visites de leur récompense apparaîtront ici" />
              )}
            </CardContent>
          </Card>

          {/* Nouvelles clientes */}
          {clientesNouvelles.length > 0 && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-accent" />
                  Nouvelles clientes à fidéliser
                </CardTitle>
                <CardDescription>Clientes avec 0-1 visite — un message de bienvenue fait toujours plaisir !</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filterClients(clientesNouvelles).slice(0, 10).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                          <Heart className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            Inscrite le {new Date(client.dateInscription).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleSendWhatsApp(client, messageBienvenue)}>
                        <Send className="h-4 w-4 mr-1" />Bienvenue
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Toutes */}
        <TabsContent value="all" className="space-y-4">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Toutes les clientes</CardTitle>
              <CardDescription>Envoyez un message personnalisé à n'importe quelle cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {filterClients(clients).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", client.statut === 'vip' ? 'bg-accent/20' : 'bg-primary/20')}>
                          {client.statut === 'vip' ? <Star className="h-4 w-4 text-accent" /> : <span className="text-primary text-sm font-semibold">{client.nom.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.nom}</p>
                          <p className="text-xs text-muted-foreground">{client.telephone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowSatisfaction(client.id)}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSendWhatsApp(client, messageSuivi)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Satisfaction Survey Dialog */}
      {selectedClient && (
        <SatisfactionSurvey
          client={selectedClient}
          isOpen={!!showSatisfaction}
          onClose={() => setShowSatisfaction(null)}
          onSubmit={handleSatisfactionSubmit}
        />
      )}
    </div>
  );
}
