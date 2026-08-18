import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X, ChevronDown, UserX, UserPlus, Phone, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ClientSearchInputProps {
  onSelect: (client: Client | 'anonymous') => void;
  defaultValue?: string;
  placeholder?: string;
  isStaff?: boolean;
  clients: Client[];
}

export function ClientSearchInput({ onSelect, defaultValue, placeholder, isStaff, clients }: ClientSearchInputProps) {
  const { t } = useLanguage();
  const { addClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | 'anonymous' | null>(
    defaultValue === 'anonymous' ? 'anonymous' : clients.find(c => c.id === defaultValue) || null
  );

  // Modale de création rapide de client
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if defaultValue changes externally
  useEffect(() => {
    if (defaultValue === 'anonymous') {
      setSelectedClient('anonymous');
    } else if (defaultValue) {
      const found = clients.find(c => c.id === defaultValue || (c as any)._id === defaultValue);
      if (found) setSelectedClient(found);
    }
  }, [defaultValue, clients]);

  // Filtrage local par nom ou téléphone, insensible à la casse
  const filteredClients = searchTerm.trim()
    ? clients.filter(c =>
        c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telephone?.includes(searchTerm)
      )
    : clients;

  // Fermer la liste si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client: Client | 'anonymous') => {
    setSelectedClient(client);
    onSelect(client);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    setSelectedClient(null);
    onSelect('anonymous');
    setSearchTerm('');
    setIsOpen(false);
  };

  const openList = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleOpenAddModal = (initialName: string = '') => {
    setNewNom(initialName);
    setNewTelephone('');
    setIsOpen(false);
    setShowAddModal(true);
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) {
      toast.error('Le nom de la cliente est requis.');
      return;
    }
    if (!newTelephone.trim() || newTelephone.trim().length < 8) {
      toast.error('Un numéro de téléphone valide (8 chiffres min) est requis.');
      return;
    }

    setIsCreatingClient(true);
    try {
      const created = await addClient({
        nom: newNom.trim(),
        telephone: newTelephone.trim(),
        statut: 'nouvelle',
      });

      const clientObj: Client = {
        id: (created as any)?._id || (created as any)?.id || String(Date.now()),
        nom: newNom.trim(),
        telephone: newTelephone.trim(),
        statut: 'nouvelle',
        dateInscription: new Date().toISOString(),
        pointsFidelite: 0,
        totalDepense: 0,
        nombreVisites: 0,
      };

      toast.success(`Cliente "${newNom.trim()}" enregistrée avec succès !`);
      setShowAddModal(false);
      setNewNom('');
      setNewTelephone('');
      handleSelect(clientObj);
    } catch (err: any) {
      console.error('Erreur lors de la création rapide du client:', err);
      toast.error(err?.message || 'Erreur lors de la création du contact');
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Client sélectionné : afficher la carte ── */}
      {selectedClient ? (
        <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl border border-primary/20 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-black text-sm">
              {selectedClient === 'anonymous' ? <UserX className="h-4 w-4" /> : selectedClient.nom?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-extrabold truncate text-foreground">
                {selectedClient === 'anonymous'
                  ? (t('finances.anonymousClient') || 'Client anonyme')
                  : selectedClient.nom}
              </p>
              {selectedClient !== 'anonymous' && selectedClient.telephone && (
                <p className="text-[11px] text-muted-foreground truncate">{selectedClient.telephone}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={clearSelection}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* ── Aucune sélection : afficher le déclencheur + la liste ── */
        <>
          <button
            type="button"
            onClick={openList}
            className={cn(
              'w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-muted-foreground transition-all',
              'hover:border-primary/40 hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20',
              isOpen && 'border-primary/50 bg-muted/70 ring-2 ring-primary/20'
            )}
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Search className="h-4 w-4 opacity-50 flex-shrink-0 text-primary" />
              <span className="truncate">{placeholder || t('clients.nameSearchPlaceholder') || 'Rechercher ou sélectionner une cliente...'}</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
          </button>

          {/* Liste déroulante */}
          {isOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1.5 border border-border/80 rounded-2xl bg-background/95 backdrop-blur-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
              {/* Bouton de création rapide permanent en haut */}
              <button
                type="button"
                onClick={() => handleOpenAddModal(searchTerm)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border-b border-border/50 transition-colors"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span>+ Ajouter une nouvelle cliente</span>
              </button>

              {/* Barre de recherche interne */}
              <div className="p-2 border-b border-border/60 bg-muted/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Filtrer par nom ou tél..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8.5 pr-8 h-9 text-xs border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des clients (Responsive height) */}
              <div className="max-h-[40vh] sm:max-h-56 overflow-y-auto divide-y divide-border/30">
                {/* Option client anonyme */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3.5 py-3 sm:py-2.5 text-xs sm:text-sm hover:bg-accent/70 transition-colors text-muted-foreground min-h-[44px]"
                  onClick={() => handleSelect('anonymous')}
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <UserX className="h-3.5 w-3.5" />
                  </div>
                  <span className="italic font-medium">{t('finances.anonymousClient') || 'Client anonyme (sans profil)'}</span>
                </button>

                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <button
                      key={c.id || (c as any)._id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3.5 py-3 sm:py-2.5 text-xs sm:text-sm hover:bg-accent/70 transition-colors group text-left min-h-[44px]"
                      onClick={() => handleSelect(c)}
                    >
                      {/* Avatar initiales */}
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-extrabold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                        {c.nom?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-foreground group-hover:text-primary transition-colors">{c.nom}</p>
                        {c.telephone && (
                          <p className="text-[11px] text-muted-foreground truncate">{c.telephone}</p>
                        )}
                      </div>
                      {c.statut && (
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0',
                          c.statut === 'vip' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-muted text-muted-foreground'
                        )}>
                          {c.statut === 'vip' ? 'VIP' : c.statut}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-5 text-center space-y-3">
                    <p className="text-xs text-muted-foreground italic">
                      {t('clients.noResults') || 'Aucune cliente trouvée pour'} "{searchTerm}"
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenAddModal(searchTerm)}
                      className="w-full font-bold text-xs bg-primary text-white shadow-md rounded-xl gap-1.5 h-10"
                    >
                      <UserPlus className="h-4 w-4" />
                      Créer le contact "{searchTerm}"
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer avec le total */}
              {clients.length > 0 && (
                <div className="px-3.5 py-2 border-t border-border/40 bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{filteredClients.length} cliente{filteredClients.length > 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(searchTerm)}
                    className="text-primary font-bold hover:underline"
                  >
                    + Nouveau contact
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modale de création rapide de cliente ── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nouveau contact client
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Enregistrez rapidement une nouvelle cliente pour l'associer immédiatement au rendez-vous ou à la prestation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClientSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Nom complet *
              </label>
              <Input
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                placeholder="Ex: Aminata Diop"
                className="h-11 rounded-2xl bg-muted/30 border-slate-200 dark:border-slate-800 font-semibold text-sm focus:ring-primary/20"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                Téléphone (WhatsApp) *
              </label>
              <Input
                type="tel"
                value={newTelephone}
                onChange={(e) => setNewTelephone(e.target.value)}
                placeholder="Ex: 77 123 45 67"
                className="h-11 rounded-2xl bg-muted/30 border-slate-200 dark:border-slate-800 font-semibold text-sm focus:ring-primary/20"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingClient}
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-11 rounded-2xl font-bold text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isCreatingClient}
                className="flex-1 h-11 rounded-2xl font-bold text-xs bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isCreatingClient ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    Enregistrer & Sélectionner
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
