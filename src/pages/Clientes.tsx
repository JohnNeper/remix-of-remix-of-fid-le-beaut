import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Phone, Calendar, Star, MoreVertical, Edit, Trash2, Eye, Clipboard, Gift, Users, UserPlus, MessageSquare, Globe, CheckCheck, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useRendezVous } from '@/hooks/useRendezVous';
import { Client, ClientStatus } from '@/types';
import { ClientForm } from '@/components/clients/ClientForm';
import { ClientDetail } from '@/components/clients/ClientDetail';
import { ImportContactsModal } from '@/components/clients/ImportContactsModal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { LimitReachedBanner } from '@/components/ui/UpgradePrompt';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const statusStyles: Record<ClientStatus, string> = {
  nouvelle: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  reguliere: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold',
  vip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-extrabold',
};

export default function Clientes() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { rendezVous, updateRendezVous } = useRendezVous();
  const { t, language } = useLanguage();
  const { canAddCustomer, getCustomerLimit, getUpgradePlan, hasCustomerSegmentation, plan } = useSubscriptionPlan();
  const customerLimit = getCustomerLimit();

  const statusLabels: Record<ClientStatus, string> = {
    nouvelle: t('clients.nouvelle') || 'Nouvelle',
    reguliere: t('clients.reguliere') || 'Régulière',
    vip: t('clients.vip') || 'VIP ✦',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'en_ligne'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importInitialTab, setImportInitialTab] = useState<'phone' | 'vcf' | 'paste'>('phone');

  // Reset to page 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, originFilter]);


  // Detect online booking customers not yet registered in salon database
  const unsavedOnlineClients = useMemo(() => {
    const onlineBookings = rendezVous.filter((r) => r.source === 'en_ligne' || r.source === 'public');
    const list: { name: string; phone: string; email?: string; rdvId: string; date: string; heure: string }[] = [];
    const seenPhones = new Set<string>();

    onlineBookings.forEach((rdv: any) => {
      const phone = rdv.customerPhone || rdv.client?.telephone;
      const name = rdv.customerName || rdv.client?.nom || t('clients.online_customer', 'Cliente En Ligne');

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const isAlreadyInClients = clients.some((c) => c.telephone && c.telephone.replace(/\D/g, '') === cleanPhone);

        if (!isAlreadyInClients && !seenPhones.has(cleanPhone)) {
          seenPhones.add(cleanPhone);
          list.push({
            name: name,
            phone: phone,
            email: rdv.customerEmail,
            rdvId: rdv.id,
            date: rdv.date,
            heure: rdv.heure,
          });
        }
      }
    });

    return list;
  }, [rendezVous, clients, t]);

  // Quick Action: Register single online customer directly
  const handleRegisterOnlineClient = async (item: { name: string; phone: string; email?: string; rdvId: string }) => {
    try {
      const newClient = await addClient({
        nom: item.name,
        telephone: item.phone,
        email: item.email || undefined,
        statut: 'nouvelle',
        groupe: 'En Ligne',
        notes: 'Cliente issue d\'une réservation en ligne',
      });

      const newClientId = newClient?.id || (newClient as any)?._id;
      if (newClientId && item.rdvId) {
        updateRendezVous({ id: item.rdvId, updates: { clientId: newClientId } });
      }

      toast.success(`${item.name} ${t('clients.added_to_contacts', 'a été enregistrée dans vos contacts salon !')}`);
    } catch (err: any) {
      console.error('Erreur ajout client en ligne:', err);
      toast.error(err.message || "Impossible d'enregistrer la cliente");
    }
  };

  // Quick Action: Register all online customers in 1-click
  const handleRegisterAllOnlineClients = async () => {
    try {
      for (const item of unsavedOnlineClients) {
        await handleRegisterOnlineClient(item);
      }
      toast.success(t('clients.all_online_saved', 'Toutes les clientes en ligne ont été ajoutées à vos contacts !'));
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.telephone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || client.statut === statusFilter;
      const isOnlineClient = (client as any).provenance === 'en_ligne' || client.groupe === 'En Ligne';
      const matchesOrigin = originFilter === 'all' || (originFilter === 'en_ligne' && isOnlineClient);
      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [clients, searchQuery, statusFilter, originFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const startIndex = filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredClients.length);

  const onlineClientsCount = useMemo(() => {
    return clients.filter((c) => (c as any).provenance === 'en_ligne' || c.groupe === 'En Ligne').length;
  }, [clients]);

  const handleAddClient = async (data: any) => {
    const parrainId = data.parrainId && data.parrainId !== 'none' ? data.parrainId : undefined;
    const cleanData = { ...data, parrainId };

    try {
      const newClient = await addClient(cleanData);

      if (parrainId) {
        const parrain = clients.find((c) => c.id === parrainId);
        if (parrain && newClient) {
          const newClientId = newClient.id;
          updateClient(parrainId, {
            pointsFidelite: (parrain.pointsFidelite || 0) + 1,
            filleuls: [...(parrain.filleuls || []), newClientId],
          });
        }
      }
      setShowAddDialog(false);
      toast.success(t('common.success') || 'Client ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      toast.error(t('common.error') || 'Une erreur est survenue');
    }
  };

  const handleEditClient = (data: Partial<Client>) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm(t('clients.deleteConfirm') || 'Voulez-vous vraiment supprimer cette cliente ?')) {
      deleteClient(id);
    }
  };

  const { session } = useAuth();
  const isStaff = session?.userRole === 'staff';

  if (isStaff) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-sans">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Eye className="h-8 w-8 text-slate-400 opacity-40" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{t('clients.restrictedAccessTitle') || 'Accès restreint'}</h1>
        <p className="text-muted-foreground text-center text-xs max-w-md">
          {t('clients.restrictedAccessDesc') || 'En tant que membre du personnel, vous n\'avez pas accès à la liste complète des clients pour des raisons de confidentialité.'}
        </p>
        <div className="flex gap-4 pt-2">
          <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-white font-bold h-10 px-4 rounded-xl shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            {t('clients.new') || 'Nouvelle cliente'}
          </Button>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-lg w-[95vw] sm:w-full rounded-2xl p-5 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-lg font-extrabold">{t('clients.new') || 'Nouvelle cliente'}</DialogTitle>
            </DialogHeader>
            <ClientForm clients={clients} onSubmit={handleAddClient} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('clients.title') || 'Gestion Clientèle'}</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {clients.length}
            {customerLimit ? `/${customerLimit}` : ''} {t('clients.registered') || 'clientes enregistrées'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold h-10 px-3.5 rounded-xl text-xs shadow-2xs">
                <Phone className="h-4 w-4 mr-2 text-rose-500" />
                <span>{t('clients.import') || 'Importer contacts'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl">
              <DropdownMenuItem onClick={() => { setImportInitialTab('phone'); setShowImportModal(true); }} className="font-semibold">
                <Phone className="h-4 w-4 mr-2 text-rose-500" />
                {t('clients.importPhone') || 'Depuis le téléphone'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setImportInitialTab('paste'); setShowImportModal(true); }} className="font-semibold">
                <Clipboard className="h-4 w-4 mr-2 text-rose-500" />
                {t('clients.importPaste') || 'Copier-Coller depuis PC'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setImportInitialTab('vcf'); setShowImportModal(true); }} className="font-semibold">
                <Calendar className="h-4 w-4 mr-2 text-rose-500" />
                {t('clients.importVcf') || 'Fichier Contacts (.vcf / Mac)'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold h-10 px-4 rounded-xl shadow-md shadow-rose-600/30 border-0 text-xs transition-transform hover:scale-[1.01] active:scale-95"
            disabled={!canAddCustomer(clients.length)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>{t('clients.new') || 'Nouvelle cliente'}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{t('clients.title') || 'Total'}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{clients.length}</p>
          </div>
        </div>

        {/* Online Clients KPI */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/20 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">En Ligne</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{onlineClientsCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-amber-500/30" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Clientes VIP</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{clients.filter((c) => c.statut === 'vip').length}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Fidélité Totale</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {clients.reduce((acc, c) => acc + (c.pointsFidelite || 0), 0)} pts
            </p>
          </div>
        </div>
      </div>

      {/* ── Banner for Pending Unsaved Online Customers ── */}
      {unsavedOnlineClients.length > 0 && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-card to-primary/5 rounded-2xl shadow-md p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {unsavedOnlineClients.length} {t('clients.unsaved_online_title', 'nouvelle(s) cliente(s) venue(s) de réservations en ligne')}
                  </h3>
                  <Badge className="bg-blue-600 text-white font-mono text-[10px]">Action requise</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('clients.unsaved_online_desc', 'Ajoutez-les directement à vos contacts salon pour leur attribuer la fidélité et des rappels.')}
                </p>

                {/* Inline customer mini badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {unsavedOnlineClients.map((item, idx) => (
                    <div key={idx} className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-blue-500/30 px-3 py-1 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                      <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                      <span>{item.name} ({item.phone})</span>
                      <button
                        type="button"
                        onClick={() => handleRegisterOnlineClient(item)}
                        className="text-blue-600 hover:underline font-extrabold ml-1"
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleRegisterAllOnlineClients}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl shadow-md shrink-0 text-xs self-end sm:self-center"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              <span>{t('clients.add_all_online', 'Tout enregistrer dans mes contacts')}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Limit banner */}
      {customerLimit && (
        <LimitReachedBanner
          current={clients.length}
          max={customerLimit}
          label={language === 'fr' ? 'clients' : 'clients'}
          requiredPlan={getUpgradePlan()}
        />
      )}

      {/* Segmentation hint for basic */}
      {!hasCustomerSegmentation && (
        <UpgradePrompt
          feature={language === 'fr' ? 'Segmentation clients (VIP, fréquent, inactif)' : 'Client segmentation (VIP, frequent, inactive)'}
          currentPlan={plan.name}
          requiredPlan={getUpgradePlan()}
          type="banner"
        />
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('clients.searchPlaceholder') || 'Rechercher par nom, téléphone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <Button
            variant={statusFilter === 'all' && originFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setOriginFilter('all');
            }}
            className={cn(
              'h-9 px-3 text-xs font-extrabold rounded-xl transition-all',
              statusFilter === 'all' && originFilter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-200 text-slate-700 dark:text-slate-300'
            )}
          >
            {t('clients.all') || 'Tous'} ({clients.length})
          </Button>

          {/* Filter: Online Bookings */}
          <Button
            variant={originFilter === 'en_ligne' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOriginFilter(originFilter === 'en_ligne' ? 'all' : 'en_ligne')}
            className={cn(
              'h-9 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5',
              originFilter === 'en_ligne'
                ? 'bg-blue-600 text-white'
                : 'border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>En Ligne</span> ({onlineClientsCount})
          </Button>

          {(['nouvelle', 'reguliere', 'vip'] as ClientStatus[]).map((status) => {
            const count = clients.filter((c) => c.statut === status).length;
            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'h-9 px-3 text-xs font-extrabold rounded-xl capitalize transition-all',
                  statusFilter === status ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border-slate-200 text-slate-700 dark:text-slate-300'
                )}
              >
                {statusLabels[status]} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedClients.map((client) => {
          const isOnlineClient = (client as any).provenance === 'en_ligne' || client.groupe === 'En Ligne';

          return (
            <Card key={client.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden bg-white dark:bg-slate-900 group">
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500/15 to-purple-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-base border border-rose-500/20 shadow-2xs">
                        {client.nom.charAt(0).toUpperCase()}
                      </div>
                      {client.statut === 'vip' && (
                        <div className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Star className="h-3 w-3 fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {client.nom}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant="outline" className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', statusStyles[client.statut])}>
                          {client.statut === 'vip' && <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />}
                          {statusLabels[client.statut]}
                        </Badge>

                        {isOnlineClient && (
                          <Badge variant="outline" className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            <Globe className="h-3 w-3 mr-1 text-blue-500" />
                            En Ligne
                          </Badge>
                        )}

                        {client.groupe && client.groupe !== 'En Ligne' && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {client.groupe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const cleanPhone = client.telephone.replace(/\D/g, '');
                        const formattedPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
                        window.open(`https://wa.me/${formattedPhone}`, '_blank');
                      }}
                      title="Envoyer un message WhatsApp"
                      className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setViewingClient(client)} className="font-semibold">
                          <Eye className="h-4 w-4 mr-2 text-slate-500" />
                          {t('clients.viewDetails') || 'Voir détails'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingClient(client)} className="font-semibold">
                          <Edit className="h-4 w-4 mr-2 text-slate-500" />
                          {t('clients.edit') || 'Modifier'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="font-semibold text-rose-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('clients.delete') || 'Supprimer'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{client.telephone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-extrabold">
                    <Gift className="h-3.5 w-3.5" />
                    <span>{client.pointsFidelite || 0} pts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination Bar */}
      {filteredClients.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {/* Info text and items per page selector */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span>
              Affichage de <strong className="text-slate-900 dark:text-white">{startIndex}</strong> à <strong className="text-slate-900 dark:text-white">{endIndex}</strong> sur <strong className="text-slate-900 dark:text-white">{filteredClients.length}</strong> clientes
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400">Afficher:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-rose-500 focus:border-rose-500"
              >
                <option value={12}>12 par page</option>
                <option value={24}>24 par page</option>
                <option value={48}>48 par page</option>
                <option value={96}>96 par page</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, page, index, array) => {
                  if (index > 0 && page - (array[index - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === 'number' ? (
                    <Button
                      key={idx}
                      variant={currentPage === item ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'h-8 w-8 p-0 rounded-lg text-xs font-bold',
                        currentPage === item
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {item}
                    </Button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 font-bold">
                      ...
                    </span>
                  )
                )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
              title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('clients.notFound') || 'Aucune cliente trouvée'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Essayez de modifier votre recherche ou le filtre de statut.' : 'Commencez par ajouter votre première cliente ou importez vos contacts.'}
          </p>
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg w-[95vw] sm:w-full rounded-2xl p-5 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-extrabold">{t('clients.new') || 'Nouvelle cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm clients={clients} onSubmit={handleAddClient} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="sm:max-w-lg w-[95vw] sm:w-full rounded-2xl p-5 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-extrabold">{t('clients.editTitle') || 'Modifier la cliente'}</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm
              client={editingClient}
              clients={clients}
              onSubmit={handleEditClient}
              onCancel={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Client Details Dialog */}
      <Dialog open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full p-0 overflow-y-auto max-h-[90vh] rounded-2xl sm:rounded-3xl border-none">
          {viewingClient && <ClientDetail client={viewingClient} />}
        </DialogContent>
      </Dialog>

      {/* Import Contacts Modal */}
      <ImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialTab={importInitialTab}
      />
    </div>
  );
}
