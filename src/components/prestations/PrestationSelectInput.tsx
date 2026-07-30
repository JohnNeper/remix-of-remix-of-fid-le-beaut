import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Scissors } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypePrestation } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';

interface PrestationSelectInputProps {
  prestations: TypePrestation[];
  value?: string;
  onSelect: (prestation: TypePrestation) => void;
  placeholder?: string;
}

export function PrestationSelectInput({
  prestations,
  value,
  onSelect,
  placeholder,
}: PrestationSelectInputProps) {
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<TypePrestation | null>(
    prestations.find(p => p.id === value) || null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if value changes externally
  useEffect(() => {
    if (value) {
      const found = prestations.find(p => p.id === value);
      if (found) setSelected(found);
    } else {
      setSelected(null);
    }
  }, [value, prestations]);

  // Filtrage local par nom
  const filtered = searchTerm.trim()
    ? prestations.filter(p =>
        p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : prestations;

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (p: TypePrestation) => {
    setSelected(p);
    onSelect(p);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    setSelected(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  const openList = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Prestation sélectionnée : carte de confirmation ──
  if (selected) {
    return (
      <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {selected.imageUrl ? (
              <img src={selected.imageUrl} alt={selected.nom} className="w-full h-full object-cover" />
            ) : (
              <Scissors className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{selected.nom}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {selected.categorie && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {selected.categorie}
                </span>
              )}
              <span className="text-xs font-semibold text-primary">
                {formatCurrency(selected.prix)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
          onClick={clearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Aucune sélection : déclencheur + liste ──
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
          <Scissors className="h-4 w-4 opacity-40 flex-shrink-0" />
          <span>{placeholder || t('services.selectPrestation') || 'Choisir une prestation...'}</span>
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
                placeholder={t('services.searchPrestation') || 'Rechercher par nom ou catégorie...'}
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

          {/* Liste des prestations */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors group"
                  onClick={() => handleSelect(p)}
                >
                  {/* Icône / Thumbnail Image */}
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {p.nom}
                    </p>
                    {p.categorie && (
                      <span className="text-[10px] text-muted-foreground">{p.categorie}</span>
                    )}
                  </div>

                  {/* Prix */}
                  <span className="text-sm font-bold text-primary flex-shrink-0">
                    {formatCurrency(p.prix)}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  {t('services.notFound') || 'Aucune prestation trouvée'}
                </p>
              </div>
            )}
          </div>

          {/* Footer compteur */}
          {prestations.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 bg-muted/10 text-xs text-muted-foreground text-right">
              {filtered.length} / {prestations.length} prestation{prestations.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
