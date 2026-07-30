import React, { useState, useMemo } from 'react';
import { X, Search, Check, Users, Tag, Palette, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Client } from '@/types';

interface CreateGroupModalProps {
  clients: Client[];
  onClose: () => void;
  onCreate: (data: { nom: string; description?: string; couleur: string; clients: string[] }) => Promise<void>;
  loading?: boolean;
}

const COULEURS = [
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CreateGroupModal({ clients, onClose, onCreate, loading }: CreateGroupModalProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search)
    ),
    [clients, search]
  );

  const toggleClient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleSubmit = async () => {
    if (!nom.trim() || selectedIds.size === 0) return;
    await onCreate({ nom: nom.trim(), description: description.trim() || undefined, couleur, clients: Array.from(selectedIds) });
    onClose();
  };

  const statutLabel = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      vip: { label: 'VIP', color: 'bg-amber-100 text-amber-700' },
      reguliere: { label: 'Régulière', color: 'bg-blue-100 text-blue-700' },
      nouvelle: { label: 'Nouvelle', color: 'bg-green-100 text-green-700' },
      inactif: { label: 'Inactive', color: 'bg-gray-100 text-gray-500' },
    };
    return map[s] || { label: s, color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: couleur + '25' }}>
              <Users className="h-5 w-5" style={{ color: couleur }} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Créer un groupe</h2>
              <p className="text-sm text-muted-foreground">Sélectionnez des contacts pour votre campagne</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Form info */}
          <div className="p-6 pb-4 space-y-4 border-b border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Nom du groupe *
                </label>
                <Input
                  placeholder="Ex: Clientes VIP Avril"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" /> Couleur
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COULEURS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all border-2",
                        couleur === c ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setCouleur(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description (optionnel)</label>
              <Textarea
                placeholder="Ex: Campagne promo mai 2025"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-16 resize-none text-sm"
              />
            </div>
          </div>

          {/* Client selector */}
          <div className="p-4 pb-2 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">Tout sélec.</Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">Effacer</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedIds.size} sélectionné(s) sur {clients.length} contacts
            </p>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="p-4 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Aucun contact trouvé</p>
              ) : (
                filtered.map(client => {
                  const sel = selectedIds.has(client.id);
                  const { label, color } = statutLabel(client.statut);
                  return (
                    <div
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        sel
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      {/* Checkbox visual */}
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        sel ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {sel && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Avatar */}
                      <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold",
                        sel ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {client.nom.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{client.nom}</p>
                        <p className="text-xs text-muted-foreground">{client.telephone}</p>
                      </div>

                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", color)}>
                        {label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className="flex-1 gradient-primary"
            onClick={handleSubmit}
            disabled={!nom.trim() || selectedIds.size === 0 || loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Création...' : `Créer le groupe (${selectedIds.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
