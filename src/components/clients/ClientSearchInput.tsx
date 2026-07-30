import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X, ChevronDown, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClientSearchInputProps {
  onSelect: (client: Client | 'anonymous') => void;
  defaultValue?: string;
  placeholder?: string;
  isStaff?: boolean;
  clients: Client[];
}

export function ClientSearchInput({ onSelect, defaultValue, placeholder, isStaff, clients }: ClientSearchInputProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | 'anonymous' | null>(
    defaultValue === 'anonymous' ? 'anonymous' : clients.find(c => c.id === defaultValue) || null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrage local par nom, insensible à la casse
  const filteredClients = searchTerm.trim()
    ? clients.filter(c =>
      c.nom?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // ── Client sélectionné : afficher la carte ──
  if (selectedClient) {
    return (
      <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">
              {selectedClient === 'anonymous'
                ? (t('finances.anonymousClient') || 'Client anonyme')
                : selectedClient.nom}
            </p>
            {selectedClient !== 'anonymous' && selectedClient.telephone && (
              <p className="text-xs text-muted-foreground">{selectedClient.telephone}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          onClick={clearSelection}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Aucune sélection : afficher le déclencheur + la liste ──
  return (
    <div ref={containerRef} className="relative">
      {/* Déclencheur */}
      <button
        type="button"
        onClick={openList}
        className={cn(
          'w-full flex items-center justify-between gap-2 h-11 px-3 rounded-xl bg-muted/30 border border-transparent text-sm text-muted-foreground transition-all',
          'hover:border-primary/30 hover:bg-muted/50',
          isOpen && 'border-primary/40 bg-muted/50 ring-2 ring-primary/10'
        )}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 opacity-40 flex-shrink-0" />
          <span>{placeholder || t('clients.nameSearchPlaceholder') || 'Sélectionner un client...'}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 opacity-40 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>

      {/* Liste déroulante */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 border border-border rounded-2xl bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Barre de recherche interne */}
          <div className="p-2 border-b border-border/60 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Liste des clients */}
          <div className="max-h-56 overflow-y-auto">
            {/* Option client anonyme */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-muted-foreground border-b border-border/40"
              onClick={() => handleSelect('anonymous')}
            >
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserX className="h-3.5 w-3.5" />
              </div>
              <span className="italic">{t('finances.anonymousClient') || 'Client anonyme'}</span>
            </button>

            {filteredClients.length > 0 ? (
              filteredClients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors group"
                  onClick={() => handleSelect(c)}
                >
                  {/* Avatar initiales */}
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold group-hover:bg-primary/20 transition-colors">
                    {c.nom?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{c.nom}</p>
                    {c.telephone && (
                      <p className="text-xs text-muted-foreground truncate">{c.telephone}</p>
                    )}
                  </div>
                  {c.statut && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0',
                      c.statut === 'vip' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                    )}>
                      {c.statut === 'vip' ? 'VIP' : c.statut}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  {t('clients.noResults') || 'Aucun client trouvé'}
                </p>
              </div>
            )}
          </div>

          {/* Footer avec le total */}
          {clients.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 bg-muted/10 text-xs text-muted-foreground text-right">
              {filteredClients.length} / {clients.length} client{clients.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
