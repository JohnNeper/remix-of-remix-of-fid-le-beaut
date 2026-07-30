import React, { useState, useMemo } from 'react';
import {
  Send, Users, Star, Clock, UserPlus, AlertCircle, ChevronRight,
  MessageSquare, Sparkles, Lock, Plus, Trash2, Zap, FolderOpen,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { useCampaigns } from '@/hooks/useCampaigns';
import { toast } from 'sonner';
import { Client } from '@/types';
import { CampaignGroupSelector } from '@/components/campaigns/CampaignGroupSelector';
import { CampaignMessagePreview } from '@/components/campaigns/CampaignMessagePreview';
import { MessageTemplates } from '@/components/campaigns/MessageTemplates';
import { CreateGroupModal } from '@/components/campaigns/CreateGroupModal';
import { AutoSendMode } from '@/components/campaigns/AutoSendMode';
import { EmptyState } from '@/components/ui/EmptyState';
import heroSalon from '@/assets/hero-salon.jpg';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt, LimitReachedBanner } from '@/components/ui/UpgradePrompt';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ContactGroup } from '@/lib/api';

export default function Campagnes() {
  const { clients, getInactiveClients } = useClients();
  const { salon } = useSalon();
  const { canCreateCampaign, getCampaignLimit, getUpgradePlan, hasScheduledCampaigns, hasAutomation, hasCampaigns, plan } = useSubscriptionPlan();
  const { t, language } = useLanguage();
  const { groupes, loading: groupesLoading, createGroupe, deleteGroupe, saveCampagne, updateStats } = useCampaigns();

  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('compose');
  const [sendMode, setSendMode] = useState<'manual' | 'auto'>('auto');
  const [campaignsSentThisMonth] = useState(0);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const campaignLimit = getCampaignLimit();

  // ── Données dérivées (AVANT le guard pour respecter les règles des hooks) ──
  const clientesInactives = useMemo(
    () => getInactiveClients(salon?.joursRappelInactivite || 30),
    [clients, salon?.joursRappelInactivite] // eslint-disable-line
  );
  const clientesVIP = useMemo(() => clients.filter(c => c.statut === 'vip'), [clients]);
  const clientesNouvelles = useMemo(() => clients.filter(c => c.statut === 'nouvelle'), [clients]);

  const predefinedGroups = useMemo(() => {
    const base = [
      { id: 'all', label: t('campaigns.allClients'), icon: Users, count: clients.length, description: t('campaigns.sendToAll') },
      { id: 'vip', label: t('campaigns.vipClients'), icon: Star, count: clientesVIP.length, description: t('campaigns.bestClients') },
      { id: 'inactives', label: t('campaigns.inactiveClients'), icon: Clock, count: clientesInactives.length, description: `+${salon?.joursRappelInactivite || 30} ${t('common.days') || 'jours'} sans visite` },
      { id: 'nouvelles', label: t('campaigns.newClients'), icon: UserPlus, count: clientesNouvelles.length, description: t('campaigns.recentlyRegistered') },
    ];
    const legacyGroups = Array.from(new Set(clients.map(c => c.groupe).filter(Boolean)));
    legacyGroups.forEach(groupName => {
      base.push({
        id: `custom-${groupName}`,
        label: groupName!,
        icon: Users,
        count: clients.filter(c => c.groupe === groupName).length,
        description: t('campaigns.customGroup') || 'Groupe personnalisé',
      });
    });
    return base;
  }, [clients, clientesVIP, clientesInactives, clientesNouvelles, salon?.joursRappelInactivite, t]);

  const allDisplayGroups = useMemo(() => [
    ...predefinedGroups,
    ...groupes.map(g => ({
      id: `saved-${g._id}`,
      label: g.nom,
      icon: Users,
      count: Array.isArray(g.clients) ? g.clients.length : 0,
      description: g.description || 'Groupe personnalisé',
      couleur: g.couleur,
      isSaved: true,
      savedId: g._id,
    })),
  ], [predefinedGroups, groupes]);

  const selectedClients = useMemo(() => {
    const clientSet = new Set<string>();
    selectedGroups.forEach(group => {
      let groupClients: Client[] = [];
      switch (group) {
        case 'all': groupClients = clients; break;
        case 'vip': groupClients = clientesVIP; break;
        case 'inactives': groupClients = clientesInactives; break;
        case 'nouvelles': groupClients = clientesNouvelles; break;
        default:
          if (group.startsWith('custom-')) {
            const gn = group.replace('custom-', '');
            groupClients = clients.filter(c => c.groupe === gn);
          } else if (group.startsWith('saved-')) {
            const savedId = group.replace('saved-', '');
            const savedGroup = groupes.find(g => g._id === savedId);
            if (savedGroup) {
              const ids = (savedGroup.clients as any[]).map((c: any) =>
                typeof c === 'string' ? c : c._id
              );
              groupClients = clients.filter(c => ids.includes(c.id));
            }
          }
      }
      groupClients.forEach(c => clientSet.add(c.id));
    });
    return clients.filter(c => clientSet.has(c.id));
  }, [selectedGroups, clients, clientesVIP, clientesInactives, clientesNouvelles, groupes]);

  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // ── Guard: plan sans campagnes ─────────────────────────────────────────────
  if (!hasCampaigns) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="relative h-40 lg:h-48 rounded-2xl overflow-hidden">
          <img src={heroSalon} alt="Salon de beauté" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent flex items-center p-6">
            <div className="text-white">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Campagnes Marketing</h1>
              <p className="text-white/80 max-w-md">
                Envoyez des messages personnalisés à vos clientes via WhatsApp
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">{t('campaigns.moduleNotAvailable')}</h2>
            <p className="text-muted-foreground">{t('campaigns.notIncludedBasic')}</p>
            <UpgradePrompt feature={t('campaigns.marketing')} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="card" />
          </div>
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
    setSentMessages(new Set());
  };

  const handleMarkSent = (clientId: string) => {
    setSentMessages(prev => new Set([...prev, clientId]));
  };

  const handleLaunchCampaign = async () => {
    if (selectedClients.length === 0) {
      toast({ title: 'Aucune cliente sélectionnée', description: 'Veuillez sélectionner au moins un groupe', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Message vide', description: 'Veuillez écrire un message', variant: 'destructive' });
      return;
    }

    // Enregistrement de la campagne en base de données pour le suivi
    const saved = await saveCampagne({
      nom: `Campagne ${new Date().toLocaleDateString()}`,
      message: message,
      groupes: selectedGroups.filter(g => g.startsWith('saved-')).map(g => g.replace('saved-', '')),
      groupesPredefinies: selectedGroups.filter(g => !g.startsWith('saved-')) as any[],
      delaiEntreMessages: 30
    });

    if (saved) {
      setActiveCampaignId(saved._id);
      setActiveTab('send');
      toast.success(t('campaigns.launchSuccess'), {
        description: t('campaigns.launchSuccessDesc').replace('{count}', selectedClients.length.toString())
      });
    }
  };

  const progress = selectedClients.length > 0 ? Math.round((sentMessages.size / selectedClients.length) * 100) : 0;



  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Hero */}
      <div className="relative h-40 lg:h-48 rounded-2xl overflow-hidden">
        <img src={heroSalon} alt="Salon de beauté" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent flex items-center p-6">
          <div className="text-white">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Campagnes Marketing</h1>
            <p className="text-white/80 max-w-md">Envoyez des messages personnalisés à vos clientes via WhatsApp, un par un pour éviter le spam</p>
          </div>
        </div>
      </div>

      {/* Anti-spam notice */}
      <Alert className="border-info/50 bg-info/10">
        <AlertCircle className="h-4 w-4 text-info" />
        <AlertDescription className="text-info">
          <strong>Envoi anti-spam :</strong> Les messages sont envoyés individuellement. Vous copiez le message puis ouvrez WhatsApp pour chaque cliente.
        </AlertDescription>
      </Alert>

      {campaignLimit !== null && (
        <LimitReachedBanner
          current={campaignsSentThisMonth}
          max={campaignLimit}
          label={t('campaigns.thisMonth') || (language === 'fr' ? 'campagnes ce mois' : 'campaigns this month')}
          requiredPlan={getUpgradePlan()}
        />
      )}

      {!hasScheduledCampaigns && (
        <UpgradePrompt feature={language === 'fr' ? 'Planification de campagnes' : 'Campaign scheduling'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {!hasAutomation && plan.name !== 'basic' && (
        <UpgradePrompt feature={language === 'fr' ? 'Campagnes automatisées (fidélité, inactivité)' : 'Automated campaigns'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="compose" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">{t('campaigns.compose')}</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" /><span className="hidden sm:inline">Groupes</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /><span className="hidden sm:inline">{t('campaigns.templates')}</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-1.5">
            <Send className="h-4 w-4" /><span className="hidden sm:inline">{t('campaigns.send')}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Composer ───────────────────────────────────────────────── */}
        <TabsContent value="compose" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sélection groupe */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />{t('campaigns.recipients')}
                </CardTitle>
                <CardDescription>{t('campaigns.chooseGroups')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignGroupSelector
                  groups={allDisplayGroups}
                  selectedGroups={selectedGroups}
                  onToggleGroup={toggleGroup}
                />
                {selectedClients.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 mt-4 border border-primary/20">
                    <p className="font-semibold text-primary flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      {selectedClients.length} {t('campaigns.selected')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />{t('campaigns.message')}
                </CardTitle>
                <CardDescription>{t('campaigns.personalize')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`Bonjour {nom} ! 👋\n\nNous avons une offre spéciale pour vous...\n\n${salon.nom}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setMessage(prev => prev + '{nom}')}>+ Prénom</Button>
                  <Button variant="outline" size="sm" onClick={() => setMessage(prev => prev + salon.nom)}>+ Nom salon</Button>
                  <Button variant="outline" size="sm" onClick={() => setMessage(prev => prev + '💇‍♀️')}>+ 💇‍♀️</Button>
                  <Button variant="outline" size="sm" onClick={() => setMessage(prev => prev + '✨')}>+ ✨</Button>
                </div>

                {/* Mode d'envoi toggle */}
                <div className="pt-2 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Mode d'envoi :</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSendMode('auto')}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        sendMode === 'auto'
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={cn("h-4 w-4", sendMode === 'auto' ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-semibold">Automatique</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Envoi auto avec délai anti-ban</p>
                    </button>
                    <button
                      onClick={() => setSendMode('manual')}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        sendMode === 'manual'
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Edit3 className={cn("h-4 w-4", sendMode === 'manual' ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-semibold">Manuel</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Copier/coller un par un</p>
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full gradient-primary"
                  size="lg"
                  onClick={handleLaunchCampaign}
                  disabled={selectedClients.length === 0 || !message.trim()}
                >
                  <Send className="h-5 w-5 mr-2" />
                  {t('campaigns.prepareButton')} ({selectedClients.length})
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: Groupes ────────────────────────────────────────────────── */}
        <TabsContent value="groups" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Mes groupes de contacts</h2>
              <p className="text-sm text-muted-foreground">Créez des groupes personnalisés pour vos campagnes WhatsApp</p>
            </div>
            <Button className="gradient-primary" onClick={() => setShowCreateGroup(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un groupe
            </Button>
          </div>

          {groupes.length === 0 ? (
            <Card className="card-shadow">
              <CardContent className="py-12">
                <EmptyState
                  icon={FolderOpen}
                  title="Aucun groupe créé"
                  description="Créez des groupes pour cibler précisément vos clientes dans vos campagnes publicitaires."
                  action={
                    <Button className="gradient-primary" onClick={() => setShowCreateGroup(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer mon premier groupe
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupes.map(groupe => {
                const clientCount = Array.isArray(groupe.clients) ? groupe.clients.length : 0;
                return (
                  <Card key={groupe._id} className="card-shadow hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: groupe.couleur + '25' }}
                          >
                            <Users className="h-5 w-5" style={{ color: groupe.couleur }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{groupe.nom}</p>
                            <p className="text-xs text-muted-foreground">{clientCount} contact{clientCount > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteGroupe(groupe._id)}
                          className="h-7 w-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {groupe.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{groupe.description}</p>
                      )}

                      {/* Preview contacts */}
                      {Array.isArray(groupe.clients) && groupe.clients.length > 0 && (
                        <div className="flex -space-x-1.5 mb-3">
                          {(groupe.clients as any[]).slice(0, 5).map((c: any, i: number) => {
                            const name = typeof c === 'string' ? '?' : c.nom;
                            return (
                              <div
                                key={i}
                                className="h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: groupe.couleur, zIndex: 5 - i }}
                                title={name}
                              >
                                {name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                          {clientCount > 5 && (
                            <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              +{clientCount - 5}
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          const gid = `saved-${groupe._id}`;
                          if (!selectedGroups.includes(gid)) toggleGroup(gid);
                          setActiveTab('compose');
                          toast.success(`Groupe "${groupe.nom}" sélectionné`);
                        }}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Utiliser pour une campagne
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Templates ──────────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-6">
          <MessageTemplates
            salonName={salon?.name || 'BeautyFlow'}
            onSelectTemplate={(template) => {
              setMessage(template);
              setActiveTab('compose');
              toast.success(t('campaigns.templateLoaded'), { description: t('campaigns.templateLoadedDesc') });
            }}
          />
        </TabsContent>

        {/* ── TAB: Envoyer ────────────────────────────────────────────────── */}
        <TabsContent value="send" className="space-y-6 mt-6">
          {selectedClients.length === 0 || !message.trim() ? (
            <Card className="card-shadow">
              <CardContent className="py-12">
                <EmptyState
                  icon={Send}
                  title={t('campaigns.noCampaign')}
                  description={t('campaigns.noCampaignDesc')}
                  action={<Button onClick={() => setActiveTab('compose')}>{t('campaigns.composeMessage')}</Button>}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mode Switch Banner */}
              <Card className="card-shadow border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {sendMode === 'auto' ? '⚡ Mode Automatique' : '✏️ Mode Manuel'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sendMode === 'auto'
                          ? `Envoi automatique vers ${selectedClients.length} contacts avec délai anti-ban`
                          : `Copier/coller manuellement vers ${selectedClients.length} contacts`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={sendMode === 'auto' ? 'default' : 'outline'}
                        onClick={() => setSendMode('auto')}
                        className={sendMode === 'auto' ? 'gradient-primary' : ''}
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" /> Auto
                      </Button>
                      <Button
                        size="sm"
                        variant={sendMode === 'manual' ? 'default' : 'outline'}
                        onClick={() => setSendMode('manual')}
                        className={sendMode === 'manual' ? 'gradient-primary' : ''}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Manuel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AUTO MODE */}
              {sendMode === 'auto' && (
                <AutoSendMode
                  clients={selectedClients}
                  message={message}
                  onComplete={(stats) => {
                    toast.success('Campagne terminée', {
                      description: `${stats.envoyes} messages envoyés.`
                    });
                  }}
                />
              )}

              {/* MANUAL MODE */}
              {sendMode === 'manual' && (
                <>
                  <Card className="card-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{t('campaigns.progress')}</span>
                        <span className="text-primary font-bold">{progress}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{sentMessages.size} / {selectedClients.length} {t('campaigns.messagesSent')}</p>
                    </CardContent>
                  </Card>

                  <Card className="card-shadow">
                    <CardHeader>
                      <CardTitle>{t('campaigns.messagesToSend')}</CardTitle>
                      <CardDescription>{t('campaigns.copyThen')}</CardDescription>
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
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Création Groupe */}
      {showCreateGroup && (
        <CreateGroupModal
          clients={clients}
          onClose={() => setShowCreateGroup(false)}
          onCreate={async (data) => { await createGroupe(data); }}
          loading={groupesLoading}
        />
      )}
    </div>
  );
}
