import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Globe2, Phone, Mail, Check, X, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRendezVous } from '@/hooks/useRendezVous';
import { usePrestations } from '@/hooks/usePrestations';
import { toast } from '@/hooks/use-toast';

export function PendingPublicBookings() {
  const { rendezVous, updateRendezVous, deleteRendezVous } = useRendezVous();
  const { getTypePrestation } = usePrestations();

  const pending = rendezVous
    .filter(r => r.source === 'public' && r.statut === 'en_attente')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (pending.length === 0) return null;

  return (
    <Card className="card-shadow border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Demandes de réservation en ligne</CardTitle>
          </div>
          <Badge className="bg-primary text-primary-foreground">{pending.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map(r => {
          const service = getTypePrestation(r.typePrestationId);
          const whatsapp = r.customerPhone
            ? `https://wa.me/${r.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${r.customerName ?? ''}, votre rendez-vous du ${r.date} à ${r.heure} est confirmé. Référence: ${r.reference}`,
              )}`
            : null;
          return (
            <div key={r.id} className="p-3 rounded-xl bg-card border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.customerName}</div>
                  <div className="text-xs text-muted-foreground">Réf. {r.reference}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">En attente</Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">{service?.nom || 'Prestation'}</span>
                <span className="text-muted-foreground"> · {format(new Date(r.date), 'EEE dd MMM', { locale: fr })} à {r.heure}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.customerPhone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.customerPhone}</span>}
                {r.customerEmail && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.customerEmail}</span>}
              </div>
              {r.notes && <p className="text-xs italic text-muted-foreground">"{r.notes}"</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm" className="gradient-primary h-8"
                  onClick={() => { updateRendezVous(r.id, { statut: 'confirme' }); toast({ title: 'Rendez-vous confirmé' }); }}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Confirmer
                </Button>
                {whatsapp && (
                  <Button asChild size="sm" variant="outline" className="h-8">
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  size="sm" variant="ghost" className="h-8 text-destructive"
                  onClick={() => { if (confirm('Refuser cette demande ?')) { deleteRendezVous(r.id); toast({ title: 'Demande supprimée' }); } }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Refuser
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}