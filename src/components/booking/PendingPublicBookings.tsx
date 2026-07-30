import React from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Globe2, Phone, Mail, Check, X, MessageCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRendezVous } from '@/hooks/useRendezVous';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export function PendingPublicBookings() {
  const { rendezVous, updateRendezVous, deleteRendezVous } = useRendezVous();
  const { getTypePrestation } = usePrestations();
  const { clients, addClient } = useClients();
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const pending = rendezVous
    .filter((r) => (r.source === 'public' || r.source === 'en_ligne') && r.statut === 'en_attente')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (pending.length === 0) return null;

  const handleRegisterClient = async (r: any) => {
    const name = r.customerName || 'Cliente En Ligne';
    const phone = r.customerPhone || '';
    try {
      const newClient = await addClient({
        nom: name,
        telephone: phone || '00000000',
        statut: 'nouvelle',
      });
      const newClientId = newClient?.id || (newClient as any)?._id;
      if (newClientId) {
        updateRendezVous({ id: r.id, updates: { clientId: newClientId } });
      }
      toast({
        title: t('appointments.client_saved', 'Cliente enregistrée !'),
        description: `${name} ${t('appointments.added_to_contacts', 'a été ajoutée à vos contacts.')}`,
      });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="card-shadow border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-card to-primary/5 rounded-2xl overflow-hidden w-full max-w-full">
      <CardHeader className="p-4 sm:p-5 border-b border-border/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Globe2 className="h-5 w-5 text-blue-500 shrink-0" />
            <CardTitle className="text-base font-bold truncate">
              {t('appointments.pending_online_title', 'Demandes de réservation en ligne')}
            </CardTitle>
          </div>
          <Badge className="bg-blue-600 text-white rounded-full font-mono text-xs shrink-0">{pending.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3 max-w-full overflow-hidden">
        {pending.map((r) => {
          const service = getTypePrestation(r.typePrestationId);
          const isSaved = clients.some((c) => c.telephone && r.customerPhone && c.telephone.replace(/\D/g, '') === r.customerPhone.replace(/\D/g, ''));
          const whatsapp = r.customerPhone
            ? `https://wa.me/${r.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${r.customerName ?? ''}, votre rendez-vous du ${r.date} à ${r.heure} est confirmé.`,
              )}`
            : null;

          return (
            <div key={r.id} className="p-3.5 rounded-xl bg-card border border-border/40 space-y-2.5 shadow-sm max-w-full overflow-hidden">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground truncate">{r.customerName || 'Cliente en ligne'}</div>
                  {r.reference && <div className="text-[11px] font-mono text-muted-foreground">Réf. {r.reference}</div>}
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                  {t('appointments.status.en_attente', 'En attente')}
                </Badge>
              </div>

              <div className="text-xs font-semibold flex items-center gap-2 flex-wrap text-foreground">
                <span className="text-primary font-bold truncate">{service?.nom || 'Prestation'}</span>
                <span className="text-muted-foreground font-normal shrink-0">
                  · {format(new Date(r.date + 'T00:00:00'), 'EEE dd MMM', { locale })} à {r.heure}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
                {r.customerPhone && (
                  <span className="inline-flex items-center gap-1 font-mono font-medium truncate">
                    <Phone className="h-3 w-3 text-primary shrink-0" /> {r.customerPhone}
                  </span>
                )}
                {r.customerEmail && (
                  <span className="inline-flex items-center gap-1 font-medium truncate max-w-[200px]">
                    <Mail className="h-3 w-3 shrink-0" /> {r.customerEmail}
                  </span>
                )}
              </div>

              {r.notes && <p className="text-xs italic text-muted-foreground bg-muted/40 p-2 rounded-lg break-words">"{r.notes}"</p>}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="gradient-primary h-8 px-3 text-xs font-bold rounded-lg shadow-sm shrink-0"
                  onClick={() => {
                    updateRendezVous({ id: r.id, updates: { statut: 'confirme' } });
                    toast({ title: t('appointments.confirmed_toast', 'Rendez-vous confirmé') });
                  }}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> {t('appointments.btn.confirm', 'Confirmer')}
                </Button>

                {!isSaved && r.customerPhone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs font-bold text-blue-600 border-blue-500/30 hover:bg-blue-500/10 rounded-lg shrink-0"
                    onClick={() => handleRegisterClient(r)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> {t('appointments.btn.add_contact', 'Ajouter contact')}
                  </Button>
                )}

                {whatsapp && (
                  <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg shrink-0">
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </a>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg shrink-0 sm:ml-auto"
                  onClick={() => {
                    if (confirm(t('appointments.confirm_refuse', 'Refuser cette demande ?'))) {
                      deleteRendezVous(r.id);
                      toast({ title: t('appointments.deleted_toast', 'Demande supprimée') });
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> {t('appointments.btn.refuse', 'Refuser')}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}