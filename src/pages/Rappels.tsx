import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell, MessageSquare, Clock, CheckCircle, Send, ThumbsUp,
  Calendar, Star, Phone, Search, Users, TrendingUp, Gift,
  Heart, Sparkles, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { toast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { SatisfactionSurvey } from '@/components/sav/SatisfactionSurvey';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';

export default function Rappels() {
  const { clients, getInactiveClients, updateClient } = useClients();
  const { salon: activeSalon, updateSalon } = useSalon();
  const { currentSalon } = useAuth();
  const { t, language } = useLanguage();
  const { formatDate } = useTranslations();
  const salon = activeSalon || currentSalon;

  const [searchQuery, setSearchQuery] = useState('');
  const [showSatisfaction, setShowSatisfaction] = useState<string | null>(null);

  const [tempJoursSuivi, setTempJoursSuivi] = useState(14);
  const [updatingDays, setUpdatingDays] = useState(false);

  // Pagination states for each tab
  const [activeTab, setActiveTab] = useState('inactives');
  const [pageInactives, setPageInactives] = useState(1);
  const [pageAnniv, setPageAnniv] = useState(1);
  const [pageSuivi, setPageSuivi] = useState(1);
  const [pageFidelite, setPageFidelite] = useState(1);
  const [pageAll, setPageAll] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    if (salon?.joursRappelSuivi) {
      setTempJoursSuivi(salon.joursRappelSuivi);
    }
  }, [salon?.joursRappelSuivi]);

  const handleSaveJoursSuivi = async () => {
    if (!salon) return;
    setUpdatingDays(true);
    try {
      await updateSalon({ joursRappelSuivi: tempJoursSuivi });
      toast({
        title: t('common.success', 'Succès'),
        description: t('reminders.delayUpdated', 'Délai de suivi mis à jour avec succès !')
      });
    } catch (e) {
      console.error(e);
      toast({
        title: t('common.error', 'Erreur'),
        description: t('reminders.updateError', 'Erreur lors de la mise à jour'),
        variant: "destructive"
      });
    } finally {
      setUpdatingDays(false);
    }
  };

  const joursRappelInactivite = (salon && 'joursRappelInactivite' in salon && typeof (salon as any).joursRappelInactivite === 'number') ? (salon as any).joursRappelInactivite : 30;
  const joursRappelSuivi = (salon && 'joursRappelSuivi' in salon && typeof (salon as any).joursRappelSuivi === 'number') ? (salon as any).joursRappelSuivi : 14;
  const configFidelite = salon && 'configFidelite' in salon ? (salon as any).configFidelite : null;

  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);

  const clientesInactives = useMemo(() => {
    if (!safeClients.length) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (joursRappelInactivite || 30));
    return safeClients.filter(c => {
      if (!c.derniereVisite) return true;
      const d = new Date(c.derniereVisite);
      return !isNaN(d.getTime()) && d < cutoffDate;
    });
  }, [safeClients, joursRappelInactivite]);

  const clientesAnniversaire = useMemo(() => safeClients.filter(c => {
    if (!c.dateAnniversaire) return false;
    const today = new Date();
    const anniv = new Date(c.dateAnniversaire);
    return !isNaN(anniv.getTime()) && anniv.getMonth() === today.getMonth();
  }), [safeClients]);

  const clientesSuivi = useMemo(() => {
    return safeClients
      .filter(c => {
        if (!c.derniereVisite) return false;
        const dateObj = new Date(c.derniereVisite);
        if (isNaN(dateObj.getTime())) return false;
        const daysSince = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 0 && daysSince <= (joursRappelSuivi || 14);
      })
      .sort((a, b) => new Date(b.derniereVisite!).getTime() - new Date(a.derniereVisite!).getTime());
  }, [safeClients, joursRappelSuivi]);

  const clientesProcheCadeau = useMemo(() => safeClients.filter(c => {
    if (!configFidelite || !configFidelite.visitesRequises) return false;
    const pts = c.pointsFidelite || 0;
    const req = configFidelite.visitesRequises || 10;
    const remaining = req - (pts % req);
    return remaining <= 2 && remaining > 0 && pts > 0;
  }), [safeClients, configFidelite]);

  const clientesNouvelles = useMemo(() => safeClients.filter(c => (c.nombreVisites || 0) <= 1), [safeClients]);

  const totalActions = (clientesInactives?.length || 0) + (clientesAnniversaire?.length || 0) + (clientesSuivi?.length || 0) + (clientesProcheCadeau?.length || 0);

  const filterClients = (list: typeof clients) => {
    if (!list || !Array.isArray(list)) return [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c => (c.nom && c.nom.toLowerCase().includes(q)) || (c.telephone && c.telephone.includes(q)));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPageInactives(1);
    setPageAnniv(1);
    setPageSuivi(1);
    setPageFidelite(1);
    setPageAll(1);
  };

  const handleSendWhatsApp = (client: typeof clients[0], messageKey: string) => {
    const defaultMessages: Record<string, string> = {
      'reminders.msg.inactivity': `Bonjour {nom} ! 💇‍♀️\n\nCela fait un moment que nous ne vous avons pas vue au salon ${salon?.nom || ''}. Vous nous manquez !\n\nVotre dernière visite remonte au {derniere_prestation}. Nous serions ravis de vous revoir.\n\nÀ très bientôt ! ✨`,
      'reminders.msg.birthday': `🎂 Joyeux anniversaire {nom} ! 🎉\n\nToute l'équipe de ${salon?.nom || 'notre salon'} vous souhaite une merveilleuse journée !\n\nPour célébrer, nous vous offrons une surprise lors de votre prochaine visite. 🎁\n\nÀ bientôt ! 💕`,
      'reminders.msg.followUp': `Bonjour {nom} ! 😊\n\nNous espérons que votre dernière visite chez ${salon?.nom || 'notre salon'} vous a satisfaite !\n\nN'hésitez pas à nous faire part de vos remarques. Votre avis compte beaucoup pour nous ! ✨`,
      'reminders.msg.loyalty': `Bonjour {nom} ! 🌟\n\nBonne nouvelle ! Vous êtes à seulement quelques visites de votre cadeau fidélité chez ${salon?.nom || 'notre salon'} !\n\nVous avez déjà {points} points. On vous attend ! 💝`,
      'reminders.msg.welcome': `Bonjour {nom} ! 💫\n\nMerci d'avoir choisi ${salon?.nom || 'notre salon'} ! Nous sommes ravis de vous compter parmi nos clientes.\n\nÀ bientôt ! 🌸`
    };

    const template = t(messageKey, defaultMessages[messageKey] || '');
    const formattedMessage = template
      .replace('{nom}', client.nom)
      .replace('{derniere_prestation}', client.derniereVisite ? new Date(client.derniereVisite).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : 'N/A')
      .replace('{points}', String(client.pointsFidelite))
      .replace('{visites}', String(client.nombreVisites));

    const phone = client.telephone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(formattedMessage)}`, '_blank');
    toast({
      title: t('reminders.whatsappOpened', 'WhatsApp ouvert'),
      description: t('reminders.messagePrepared', 'Message préparé pour {nom}', { nom: client.nom })
    });
  };

  const handleSatisfactionSubmit = (rating: number, comment: string) => {
    if (showSatisfaction) {
      const client = clients.find(c => c.id === showSatisfaction);
      if (client) {
        const satisfactionNote = `[Satisfaction ${rating}/3] ${comment}`;
        updateClient(client.id, {
          notes: client.notes
            ? `${client.notes}\n${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}: ${satisfactionNote}`
            : `${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}: ${satisfactionNote}`
        });
      }
    }
    setShowSatisfaction(null);
  };

  const selectedClient = showSatisfaction ? clients.find(c => c.id === showSatisfaction) : null;

  const getDaysSinceLastVisit = (date?: string) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filtered lists
  const filteredInactives = useMemo(() => filterClients(clientesInactives), [clientesInactives, searchQuery]);
  const filteredAnniv = useMemo(() => filterClients(clientesAnniversaire), [clientesAnniversaire, searchQuery]);
  const filteredSuivi = useMemo(() => filterClients(clientesSuivi), [clientesSuivi, searchQuery]);
  const filteredFidelite = useMemo(() => filterClients(clientesProcheCadeau), [clientesProcheCadeau, searchQuery]);
  const filteredAll = useMemo(() => filterClients(clients), [clients, searchQuery]);

  // Paginated lists
  const paginatedInactives = useMemo(() => filteredInactives.slice((pageInactives - 1) * itemsPerPage, pageInactives * itemsPerPage), [filteredInactives, pageInactives]);
  const paginatedAnniv = useMemo(() => filteredAnniv.slice((pageAnniv - 1) * itemsPerPage, pageAnniv * itemsPerPage), [filteredAnniv, pageAnniv]);
  const paginatedSuivi = useMemo(() => filteredSuivi.slice((pageSuivi - 1) * itemsPerPage, pageSuivi * itemsPerPage), [filteredSuivi, pageSuivi]);
  const paginatedFidelite = useMemo(() => filteredFidelite.slice((pageFidelite - 1) * itemsPerPage, pageFidelite * itemsPerPage), [filteredFidelite, pageFidelite]);
  const paginatedAll = useMemo(() => filteredAll.slice((pageAll - 1) * itemsPerPage, pageAll * itemsPerPage), [filteredAll, pageAll]);

  const renderPagination = (page: number, setPage: React.Dispatch<React.SetStateAction<number>>, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4">
        <span className="text-xs text-muted-foreground font-semibold">
          {t('common.page') || 'Page'} {page} {t('common.of') || 'sur'} {totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0 rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-6xl mx-auto font-sans animate-in fade-in duration-300">

      {/* ── HEADER CARD ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                <Bell className="h-3.5 w-3.5 mr-1 text-primary" />
                {t('reminders.title', 'Service Après-Vente')}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {t('reminders.subtitle', 'Rappels, suivi satisfaction et fidélisation de vos clientes')}
            </h1>
            {totalActions > 0 && (
              <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {t('reminders.actionsToday', "🎉 {count} action(s) recommandée(s) aujourd'hui !", { count: totalActions })}
              </p>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('reminders.searchClient', 'Rechercher une cliente...')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 h-11 rounded-xl bg-card border-border/50 text-xs font-medium"
            />
          </div>
        </div>
      </Card>

      {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: t('reminders.inactive', 'Inactives'), count: clientesInactives.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t('reminders.birthdays', 'Anniversaires'), count: clientesAnniversaire.length, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: t('reminders.followUp', 'À suivre'), count: clientesSuivi.length, icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('reminders.nearGift', 'Proche du cadeau'), count: clientesProcheCadeau.length, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: t('reminders.newClients', 'Nouvelles clientes'), count: clientesNouvelles.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-card border border-border/40 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{item.label}</p>
              <p className="text-lg font-black text-foreground">{item.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS CONTENT ─────────────────────────────────────────────────── */}
      <Card className="border-border/40 shadow-sm bg-card rounded-3xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="border-b border-border/40 bg-muted/20 px-4 py-3 sm:px-6 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-background/80 backdrop-blur-md border shadow-sm p-1 rounded-2xl inline-flex w-max">
              <TabsTrigger value="inactives" className="rounded-xl px-4 font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                ⏰ {t('reminders.inactive', 'Inactives')} ({filteredInactives.length})
              </TabsTrigger>
              <TabsTrigger value="anniversaires" className="rounded-xl px-4 font-bold text-xs data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all">
                🎂 {t('reminders.birthdays', 'Anniversaires')} ({filteredAnniv.length})
              </TabsTrigger>
              <TabsTrigger value="suivi" className="rounded-xl px-4 font-bold text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all">
                👍 {t('reminders.followUp', 'À suivre')} ({filteredSuivi.length})
              </TabsTrigger>
              <TabsTrigger value="fidelite" className="rounded-xl px-4 font-bold text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all">
                🎁 {t('reminders.loyalty', 'Fidélité')} ({filteredFidelite.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl px-4 font-bold text-xs data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                {t('common.all', 'Tous')} ({filteredAll.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* INACTIFS */}
          <TabsContent value="inactives" className="m-0 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('reminders.inactiveClients', 'Clientes inactives')}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{t('reminders.noVisitSince', 'Pas de visite depuis plus de {days} jours', { days: salon?.joursRappelInactivite || 30 })}</p>
              </div>
            </div>

            {filteredInactives.length > 0 ? (
              <div>
                <div className="divide-y divide-border/30 border border-border/40 rounded-2xl overflow-hidden">
                  {paginatedInactives.map((client) => {
                    const days = getDaysSinceLastVisit(client.derniereVisite);
                    const isUrgent = days && days > 60;
                    return (
                      <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-600 shrink-0">
                            {client.nom.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-sm text-foreground truncate">{client.nom}</p>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> {t('reminders.urgent', 'Urgent')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {client.derniereVisite
                                ? t('reminders.lastVisitDays', 'Dernière visite il y a {days} jours', { days: String(days) })
                                : t('reminders.never', 'Jamais')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="icon" variant="outline" className="rounded-xl h-9 w-9 border-border/50" onClick={() => window.open(`tel:${client.telephone.replace(/\D/g, '')}`, '_self')}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button className="rounded-xl h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm" onClick={() => handleSendWhatsApp(client, 'reminders.msg.inactivity')}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {renderPagination(pageInactives, setPageInactives, filteredInactives.length)}
              </div>
            ) : (
              <EmptyState icon={CheckCircle} title={t('reminders.allActive', '🎉 Toutes actives !')} description={t('reminders.allActiveDesc', 'Toutes vos clientes sont venues récemment')} />
            )}
          </TabsContent>

          {/* ANNIVERSAIRES */}
          <TabsContent value="anniversaires" className="m-0 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('reminders.birthdaysMonth', '🎂 Anniversaires ce mois')}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{t('reminders.wishThem', "Souhaitez-leur une belle journée !")}</p>
              </div>
            </div>

            {filteredAnniv.length > 0 ? (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {paginatedAnniv.map((client) => {
                    const annivDate = client.dateAnniversaire ? new Date(client.dateAnniversaire) : null;
                    const today = new Date();
                    const isToday = annivDate && annivDate.getDate() === today.getDate() && annivDate.getMonth() === today.getMonth();

                    return (
                      <div key={client.id} className={cn("p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3", isToday ? "border-rose-400 bg-rose-500/5 shadow-sm" : "border-border/40 bg-card hover:bg-muted/20")}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center text-xl shrink-0", isToday ? "bg-rose-500/20" : "bg-muted/60")}>
                              {isToday ? '🎉' : '🎂'}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-foreground">{client.nom}</p>
                              <p className="text-xs text-muted-foreground font-medium">{annivDate ? formatDate(annivDate.toISOString()) : ''}</p>
                            </div>
                          </div>
                          {isToday && <Badge className="bg-rose-500 text-white font-bold text-[10px]">{t('reminders.today', "Aujourd'hui")}</Badge>}
                        </div>

                        <Button className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-9 shadow-sm" onClick={() => handleSendWhatsApp(client, 'reminders.msg.birthday')}>
                          <Send className="h-3.5 w-3.5 mr-1.5" /> {t('reminders.wish', 'Souhaiter')}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {renderPagination(pageAnniv, setPageAnniv, filteredAnniv.length)}
              </div>
            ) : (
              <EmptyState icon={Calendar} title={t('reminders.noBirthday', 'Aucun anniversaire')} description={t('reminders.noBirthdayDesc', "Pas d'anniversaire à célébrer ce mois-ci")} />
            )}
          </TabsContent>

          {/* SUIVI */}
          <TabsContent value="suivi" className="m-0 p-5 sm:p-6 space-y-6">
            <Card className="border-blue-500/20 shadow-sm bg-blue-500/5 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {t('reminders.customFollowUpDelay', 'Délai de suivi personnalisé')}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium max-w-lg">
                    {t('reminders.customFollowUpDelayDesc', "Définissez après combien de jours relancer le client pour lui demander son avis sur la prestation.")}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="number"
                    min={7}
                    max={90}
                    value={tempJoursSuivi}
                    onChange={(e) => setTempJoursSuivi(Number(e.target.value))}
                    className="w-16 text-center font-extrabold h-9 rounded-xl text-xs bg-card"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">{t('reminders.days', 'jours')}</span>
                  <Button
                    onClick={handleSaveJoursSuivi}
                    disabled={updatingDays || tempJoursSuivi < 7 || tempJoursSuivi > 90}
                    className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                  >
                    {updatingDays ? '...' : t('common.save', 'Valider')}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                <ThumbsUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('reminders.satisfaction', 'Suivi satisfaction')}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{t('reminders.satisfactionDesc', "Clientes venues récemment (0 à {days} jours) — relancez-les juste après leur soin !", { days: String(salon?.joursRappelSuivi || 14) })}</p>
              </div>
            </div>

            {filteredSuivi.length > 0 ? (
              <div>
                <div className="divide-y divide-border/30 border border-border/40 rounded-2xl overflow-hidden">
                  {paginatedSuivi.map((client) => {
                    const days = getDaysSinceLastVisit(client.derniereVisite);
                    return (
                      <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-600 shrink-0">
                            {client.nom.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-sm text-foreground truncate">{client.nom}</p>
                              {days === 0 ? (
                                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">{t('reminders.visitedToday', 'Aujourd\'hui ✨')}</Badge>
                              ) : days === 1 ? (
                                <Badge className="bg-blue-500 text-white font-bold text-[10px]">{t('reminders.visitedYesterday', 'Hier')}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">{t('reminders.visitedDaysAgo', 'Il y a {days} jours', { days: String(days) })}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {client.derniereVisite && `${t('reminders.lastVisit', 'Dernière visite')} ${formatDate(client.derniereVisite)}`}
                              {' '}• {t('reminders.totalVisitsCount', '{count} visites réalisées', { count: String(client.nombreVisites) })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="rounded-xl h-9 px-3 text-xs font-bold border-border/50" onClick={() => setShowSatisfaction(client.id)}>
                            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" /> {t('reminders.internalNote', 'Note interne')}
                          </Button>
                          <Button size="sm" className="rounded-xl h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm" onClick={() => handleSendWhatsApp(client, 'reminders.msg.followUp')}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> {t('reminders.followUpAction', 'Relancer')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {renderPagination(pageSuivi, setPageSuivi, filteredSuivi.length)}
              </div>
            ) : (
              <EmptyState icon={ThumbsUp} title={t('reminders.noFollowUp', 'Aucun suivi en attente')} description={t('reminders.noFollowUpDesc', 'Les clientes récentes seront listées ici pour un suivi satisfaction')} />
            )}
          </TabsContent>

          {/* FIDELITE & NOUVEAUX */}
          <TabsContent value="fidelite" className="m-0 p-5 sm:p-6 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{t('reminders.nearGiftTitle', "Clientes proches d'un cadeau")}</h3>
                  <p className="text-xs text-muted-foreground font-semibold">{t('reminders.nearGiftDesc', "Incitez vos clientes à revenir pour débloquer leur réduction.")}</p>
                </div>
              </div>

              {filteredFidelite.length > 0 ? (
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paginatedFidelite.map((client) => {
                      const visitsReq = (salon as any)?.configFidelite?.visitesRequises || 10;
                      const remaining = visitsReq - (client.pointsFidelite % visitsReq);
                      const progress = ((visitsReq - remaining) / visitsReq) * 100;

                      return (
                        <div key={client.id} className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-600 font-bold">
                                <Gift className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-sm text-foreground truncate">{client.nom}</p>
                                <p className="text-xs text-muted-foreground font-medium">{t('reminders.nearGiftPrompt', 'Plus que {count} visite(s) pour le cadeau !', { count: String(remaining) })}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                              <span>{t('loyalty.progress', 'Progression')}</span>
                              <span className="text-primary">{client.pointsFidelite} / {visitsReq} {t('common.pts', 'pts')}</span>
                            </div>
                            <div className="h-2 bg-muted/60 rounded-full overflow-hidden border border-border/30">
                              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs shadow-sm" onClick={() => handleSendWhatsApp(client, 'reminders.msg.loyalty')}>
                            <Send className="h-3.5 w-3.5 mr-1.5" /> {t('reminders.motivate', 'Motiver la cliente')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {renderPagination(pageFidelite, setPageFidelite, filteredFidelite.length)}
                </div>
              ) : (
                <EmptyState icon={Gift} title={t('reminders.noNearGift', 'Aucune cliente proche du cadeau')} description={t('reminders.noNearGiftDesc', 'Les clientes à 1-2 visites de leur récompense apparaîtront ici.')} />
              )}
            </div>
          </TabsContent>

          {/* TOUS */}
          <TabsContent value="all" className="m-0 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-foreground/10 rounded-xl text-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{t('reminders.allClients', 'Toutes les clientes')}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{t('reminders.allClientsDesc', "Envoyez un message personnalisé à n'importe quelle cliente")}</p>
              </div>
            </div>

            {filteredAll.length > 0 ? (
              <div>
                <div className="divide-y divide-border/30 border border-border/40 rounded-2xl overflow-hidden">
                  {paginatedAll.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-9 w-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0", client.statut === 'vip' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'bg-primary/10 text-primary')}>
                          {client.statut === 'vip' ? <Star className="h-4 w-4" /> : client.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-foreground truncate">{client.nom}</p>
                          <p className="text-xs text-muted-foreground font-medium">{client.telephone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="icon" variant="ghost" className="rounded-xl h-8 w-8 hover:bg-amber-500/10 hover:text-amber-600" onClick={() => setShowSatisfaction(client.id)}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-xl h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => handleSendWhatsApp(client, 'reminders.msg.followUp')}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(pageAll, setPageAll, filteredAll.length)}
              </div>
            ) : (
              <EmptyState icon={Users} title={t('reminders.noClients', 'Aucune cliente trouvée')} description={t('loyalty.tryModifyingSearch', 'Essayez de modifier votre recherche')} />
            )}
          </TabsContent>

        </Tabs>
      </Card>

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
