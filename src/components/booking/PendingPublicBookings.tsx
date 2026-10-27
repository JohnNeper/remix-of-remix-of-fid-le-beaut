import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Globe2, Phone, Mail, Check, X, MessageCircle, UserPlus, Users, Receipt, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRendezVous } from '@/hooks/useRendezVous';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useFinances } from '@/hooks/useFinances';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { ValidationFinanceModal } from '@/components/prestations/ValidationFinanceModal';
import { InvoiceGenerator } from '@/components/finances/InvoiceGenerator';
import { Vente } from '@/types';
import { RendezVous } from '@/types/rendez-vous';

export function PendingPublicBookings() {
  const { rendezVous, updateRendezVous, deleteRendezVous } = useRendezVous();
  const { getTypePrestation } = usePrestations();
  const { clients, addClient } = useClients();
  const { ventes } = useFinances();
  const { canAddCustomer } = useSubscriptionPlan();
  const { t, language } = useLanguage();
  const { formatCurrency } = useTranslations();
  const locale = language === 'fr' ? fr : enUS;

  const [selectedRdvForFinance, setSelectedRdvForFinance] = useState<RendezVous | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [pendingInvoiceVente, setPendingInvoiceVente] = useState<Vente | null>(null);

  const pending = rendezVous
    .filter((r) => (r.source === 'public' || r.source === 'en_ligne') && r.statut === 'en_attente')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (pending.length === 0) return null;

  const handleRegisterClient = async (r: any) => {
    if (!canAddCustomer(clients.length)) {
      toast({
        title: 'Limite atteinte',
        description: "Votre forfait actuel ne vous permet pas d'ajouter de nouvelles clientes à vos contacts.",
        variant: 'destructive',
      });
      return;
    }
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

  const handleOpenFacture = (r: any) => {
    const foundVente = (ventes || []).find(
      (v) => (r.venteId && (v.id === r.venteId || (v as any)._id === r.venteId)) ||
             v.rendezVousId === r.id ||
             (v.rendezVousRef && v.rendezVousRef === r.reference)
    );

    if (foundVente) {
      setPendingInvoiceVente(foundVente);
      return;
    }

    const prestation = getTypePrestation(r.typePrestationId);
    const prix = prestation?.prix || 0;
    const nb = r.nombrePersonnes || 1;
    const total = r.montantTotal || (prix * nb);

    setPendingInvoiceVente({
      id: r.venteId || `rdv-${r.id}`,
      date: r.date || new Date().toISOString().split('T')[0],
      clientId: r.clientId,
      employe: r.employe,
      modePaiement: 'especes',
      rendezVousId: r.id,
      rendezVousRef: r.reference,
      nombrePersonnes: nb,
      totalMontant: total,
      items: [
        {
          type: 'prestation',
          referenceId: r.typePrestationId || '',
          nom: `${prestation?.nom || 'Prestation'}${nb > 1 ? ` (${nb} pers.)` : ''}`,
          quantite: nb,
          prixUnitaire: prix,
          montant: total,
        },
      ],
    } as Vente);
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
          const isAlreadyValidated = Boolean(
            r.financeValide ||
            r.venteId ||
            r.statut === 'termine' ||
            r.statut === 'completed' ||
            (ventes && ventes.some((v) =>
              (r.venteId && (v.id === r.venteId || (v as any)._id === r.venteId)) ||
              (v.rendezVousId && String(v.rendezVousId) === String(r.id)) ||
              (r.reference && v.rendezVousRef && v.rendezVousRef === r.reference)
            ))
          );
          const whatsapp = r.customerPhone
            ? `https://wa.me/${r.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${r.customerName ?? ''}, votre rendez-vous du ${r.date} à ${r.heure} est confirmé.`,
              )}`
            : null;

          return (
            <div key={r.id} className="p-3.5 rounded-xl bg-card border border-border/40 border-l-4 border-l-amber-500 space-y-2.5 shadow-sm hover:shadow-amber-500/10 transition-all max-w-full overflow-hidden">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-foreground truncate">{r.customerName || 'Cliente en ligne'}</span>
                    {r.nombrePersonnes && r.nombrePersonnes > 1 && (
                      <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40 font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                        <Users className="h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                        {r.nombrePersonnes} personnes
                      </Badge>
                    )}
                  </div>
                  {r.reference && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">Réf. {r.reference}</div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAlreadyValidated && (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> {t('appointments.status.facture', 'Facturé')}
                    </Badge>
                  )}
                  <Badge className="text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25 border-0 shrink-0 px-3 py-0.5 rounded-full">
                    {t('appointments.status.en_attente', 'En attente')}
                  </Badge>
                </div>
              </div>

              <div className="text-xs font-semibold flex items-center gap-2 flex-wrap text-foreground">
                <span className="text-primary font-bold truncate">{service?.nom || 'Prestation'}</span>
                {service?.prix && (
                  <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
                    {formatCurrency(service.prix * (r.nombrePersonnes || 1))}
                    {r.nombrePersonnes && r.nombrePersonnes > 1 ? ` (${r.nombrePersonnes} pers.)` : ''}
                  </span>
                )}
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
                {isAlreadyValidated ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      disabled
                      className="rounded-xl h-8 px-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-80 shadow-none shrink-0"
                      title={t('appointments.alreadyInvoiced', 'Ce rendez-vous a déjà été validé et facturé.')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                      <span>{t('appointments.alreadyValidatedBtn', 'Validé (Bloqué)')}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFacture(r)}
                      className="rounded-xl h-8 px-2.5 text-xs font-extrabold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0"
                    >
                      <Receipt className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      <span>{t('appointments.btn.invoice', 'Facture')}</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3.5 text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all active:scale-[0.98]"
                    onClick={() => {
                      if (r.financeValide || r.venteId) {
                        toast({
                          title: t('appointments.alreadyInvoiced', 'Ce rendez-vous a déjà été validé et facturé.'),
                          description: t('appointments.modal.alreadyValidatedDesc', 'La facture correspondante a déjà été générée.'),
                        });
                        handleOpenFacture(r);
                        return;
                      }
                      setSelectedRdvForFinance(r);
                      setIsFinanceModalOpen(true);
                    }}
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> {t('appointments.btn.validateAndInvoice', 'Valider & Facturer')}
                  </Button>
                )}

                {!isAlreadyValidated && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                    onClick={() => {
                      updateRendezVous({ id: r.id, updates: { statut: 'confirme' } });
                      toast({ title: t('appointments.confirmed_toast', 'Rendez-vous confirmé') });
                    }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> {t('appointments.btn.confirm', 'Confirmer')}
                  </Button>
                )}

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

      {/* Financial Validation & Billing Modal */}
      <ValidationFinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setSelectedRdvForFinance(null);
        }}
        rdv={selectedRdvForFinance}
        onSuccess={(createdVente) => {
          setPendingInvoiceVente(createdVente);
        }}
      />

      {/* Invoice Modal */}
      {pendingInvoiceVente && (
        <InvoiceGenerator
          vente={pendingInvoiceVente}
          isOpen={!!pendingInvoiceVente}
          onClose={() => setPendingInvoiceVente(null)}
        />
      )}
    </Card>
  );
}