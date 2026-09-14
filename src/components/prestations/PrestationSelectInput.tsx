import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Scissors, Plus } from 'lucide-react';
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
  onAddNew?: () => void;
  placeholder?: string;
}

export function PrestationSelectInput({
  prestations,
  value,
  onSelect,
  onAddNew,
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
    // Sur écran tactile / mobile, NE PAS forcer le focus automatique pour éviter l'ouverture intempestive du clavier
    const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    if (!isTouch) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // ── Prestation sélectionnée : carte de confirmation ──
  if (selected) {
    return (
      <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/20 p-3 rounded-2xl border border-primary/20 animate-in fade-in duration-150">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden text-primary">
            {selected.imageUrl ? (
              <img src={selected.imageUrl} alt={selected.nom} className="w-full h-full object-cover" />
            ) : (
              <Scissors className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-extrabold truncate text-foreground">{selected.nom}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {selected.categorie && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                  {selected.categorie}
                </span>
              )}
              <span className="text-xs font-bold text-primary">
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
    <div ref={containerRef} className="relative w-full">
      {/* Déclencheur */}
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
          <Scissors className="h-4 w-4 opacity-50 flex-shrink-0 text-primary" />
          <span className="truncate">{placeholder || t('services.selectPrestation') || 'Choisir une prestation...'}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>

      {/* Liste déroulante */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 border border-border/80 rounded-2xl bg-background/95 backdrop-blur-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Bouton d'ajout d'une nouvelle prestation si callback disponible */}
          {onAddNew && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); onAddNew(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border-b border-border/50 transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>+ Créer un nouveau type de prestation</span>
            </button>
          )}

          {/* Barre de recherche interne */}
          <div className="p-2 border-b border-border/60 bg-muted/20 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={t('services.searchPrestation') || 'Rechercher par nom ou catégorie...'}
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
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="sm:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Liste des prestations */}
          <div className="max-h-[40vh] sm:max-h-60 overflow-y-auto divide-y divide-border/30">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3.5 py-3 sm:py-2.5 text-xs sm:text-sm hover:bg-accent/70 transition-colors group text-left min-h-[44px]"
                  onClick={() => handleSelect(p)}
                >
                  {/* Icône / Thumbnail Image */}
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Scissors className="h-4 w-4 text-primary group-hover:text-white" />
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold truncate text-foreground group-hover:text-primary transition-colors">
                      {p.nom}
                    </p>
                    {p.categorie && (
                      <span className="text-[10px] text-muted-foreground">{p.categorie}</span>
                    )}
                  </div>

                  {/* Prix */}
                  <span className="text-xs sm:text-sm font-black text-primary flex-shrink-0">
                    {formatCurrency(p.prix)}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-5 text-center space-y-2">
                <p className="text-xs text-muted-foreground italic">
                  {t('services.notFound') || 'Aucune prestation trouvée pour'} "{searchTerm}"
                </p>
                {onAddNew && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => { setIsOpen(false); onAddNew(); }}
                    className="w-full font-bold text-xs bg-primary text-white shadow-md rounded-xl gap-1.5 h-9"
                  >
                    <Plus className="h-4 w-4" />
                    Créer la prestation "{searchTerm}"
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer compteur */}
          {prestations.length > 0 && (
            <div className="px-3.5 py-2 border-t border-border/40 bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{filtered.length} prestation{filtered.length > 1 ? 's' : ''}</span>
              {onAddNew && (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); onAddNew(); }}
                  className="text-primary font-bold hover:underline"
                >
                  + Ajouter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
