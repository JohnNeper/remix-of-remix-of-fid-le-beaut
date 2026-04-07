import React, { useState, useMemo } from 'react';
import { Send, Users, Star, Clock, UserPlus, AlertCircle, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { toast } from '@/hooks/use-toast';
import { Client } from '@/types';
import { CampaignGroupSelector } from '@/components/campaigns/CampaignGroupSelector';
import { CampaignMessagePreview } from '@/components/campaigns/CampaignMessagePreview';
import { MessageTemplates } from '@/components/campaigns/MessageTemplates';
import { EmptyState } from '@/components/ui/EmptyState';
import heroSalon from '@/assets/hero-salon.jpg';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt, LimitReachedBanner } from '@/components/ui/UpgradePrompt';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Campagnes() {
  const { clients, getInactiveClients } = useClients();
  const { salon } = useSalon();
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('compose');

  const clientesInactives = getInactiveClients(salon.joursRappelInactivite);
  const clientesVIP = clients.filter(c => c.statut === 'vip');
  const clientesNouvelles = clients.filter(c => c.statut === 'nouvelle');

  const groups = [
    { 
      id: 'all', 
      label: 'Toutes les clientes', 
      icon: Users, 
      count: clients.length,
      description: 'Envoyer à toute la base'
    },
    { 
      id: 'vip', 
      label: 'Clientes VIP', 
      icon: Star, 
      count: clientesVIP.length,
      description: 'Vos meilleures clientes'
    },
    { 
      id: 'inactives', 
      label: 'Clientes inactives', 
      icon: Clock, 
      count: clientesInactives.length,
      description: `+${salon.joursRappelInactivite} jours sans visite`
    },
    { 
      id: 'nouvelles', 
      label: 'Nouvelles clientes', 
      icon: UserPlus, 
      count: clientesNouvelles.length,
      description: 'Inscrites récemment'
    },
  ];

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
    // Reset sent messages when changing groups
    setSentMessages(new Set());
  };

  const selectedClients = useMemo(() => {
    const clientSet = new Set<string>();
    
    selectedGroups.forEach(group => {
      let groupClients: Client[] = [];
      switch (group) {
        case 'all':
          groupClients = clients;
          break;
        case 'vip':
          groupClients = clientesVIP;
          break;
        case 'inactives':
          groupClients = clientesInactives;
          break;
        case 'nouvelles':
          groupClients = clientesNouvelles;
          break;
      }
      groupClients.forEach(c => clientSet.add(c.id));
    });

    return clients.filter(c => clientSet.has(c.id));
  }, [clients, selectedGroups, clientesVIP, clientesInactives, clientesNouvelles]);

  const handleMarkSent = (clientId: string) => {
    setSentMessages(prev => new Set([...prev, clientId]));
  };

  const handleLaunchCampaign = () => {
    if (selectedClients.length === 0) {
      toast({
        title: 'Aucune cliente sélectionnée',
        description: 'Veuillez sélectionner au moins un groupe',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Message vide',
        description: 'Veuillez écrire un message',
        variant: 'destructive',
      });
      return;
    }

    // Switch to sending tab
    setActiveTab('send');
    toast({
      title: 'Campagne prête !',
      description: `${selectedClients.length} messages à envoyer individuellement`,
    });
  };

  const progress = selectedClients.length > 0 
    ? Math.round((sentMessages.size / selectedClients.length) * 100) 
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative h-40 lg:h-48 rounded-2xl overflow-hidden">
        <img 
          src={heroSalon} 
          alt="Salon de beauté" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent flex items-center p-6">
          <div className="text-white">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Campagnes Marketing</h1>
            <p className="text-white/80 max-w-md">
              Envoyez des messages personnalisés à vos clientes via WhatsApp, un par un pour éviter le spam
            </p>
          </div>
        </div>
      </div>

      {/* Anti-Spam Alert */}
      <Alert className="border-info/50 bg-info/10">
        <AlertCircle className="h-4 w-4 text-info" />
        <AlertDescription className="text-info">
          <strong>Envoi anti-spam :</strong> Les messages sont envoyés individuellement. Vous copiez le message puis ouvrez WhatsApp pour chaque cliente, évitant ainsi d'être bloqué par WhatsApp.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Composer
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Envoyer
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Groups selection */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Destinataires
                </CardTitle>
                <CardDescription>Choisissez un ou plusieurs groupes</CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignGroupSelector
                  groups={groups}
                  selectedGroups={selectedGroups}
                  onToggleGroup={toggleGroup}
                />

                {selectedClients.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 mt-4 border border-primary/20">
                    <p className="font-semibold text-primary flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {selectedClients.length} cliente(s) sélectionnée(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message composition */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Message
                </CardTitle>
                <CardDescription>
                  Utilisez <code className="bg-muted px-1 rounded">{'{nom}'}</code> pour personnaliser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`Bonjour {nom} ! 👋

Nous avons une offre spéciale pour vous...

${salon.nom}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px] resize-none"
                />

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(prev => prev + '{nom}')}
                  >
                    + Prénom
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(prev => prev + salon.nom)}
                  >
                    + Nom salon
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(prev => prev + '💇‍♀️')}
                  >
                    + 💇‍♀️
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(prev => prev + '✨')}
                  >
                    + ✨
                  </Button>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full gradient-primary"
                    size="lg"
                    onClick={handleLaunchCampaign}
                    disabled={selectedClients.length === 0 || !message.trim()}
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Préparer l'envoi ({selectedClients.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <MessageTemplates 
            salonName={salon.nom} 
            onSelectTemplate={(template) => {
              setMessage(template);
              setActiveTab('compose');
              toast({
                title: 'Modèle chargé !',
                description: 'Personnalisez-le si nécessaire',
              });
            }} 
          />
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-6 mt-6">
          {selectedClients.length === 0 || !message.trim() ? (
            <Card className="card-shadow">
              <CardContent className="py-12">
                <EmptyState
                  icon={Send}
                  title="Aucune campagne préparée"
                  description="Composez votre message et sélectionnez des destinataires d'abord"
                  action={
                    <Button onClick={() => setActiveTab('compose')}>
                      Composer un message
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress */}
              <Card className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Progression</span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {sentMessages.size} / {selectedClients.length} messages envoyés
                  </p>
                </CardContent>
              </Card>

              {/* Messages List */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Messages à envoyer</CardTitle>
                  <CardDescription>
                    Cliquez sur "Copier" puis "Ouvrir WhatsApp" pour chaque cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {selectedClients.map((client, index) => (
                        <CampaignMessagePreview
                          key={client.id}
                          client={client}
                          message={message}
                          index={index}
                          onSent={handleMarkSent}
                          isSent={sentMessages.has(client.id)}
                          delay={500}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
