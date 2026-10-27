import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  User,
  Users,
  Calendar as CalendarIcon,
  Scissors,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { RendezVous } from '@/types/rendez-vous';
import { Vente, VenteItem } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSalon } from '@/hooks/useSalon';
import { usePrestations } from '@/hooks/usePrestations';
import { useClients } from '@/hooks/useClients';
import { useFinances } from '@/hooks/useFinances';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ValidationFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdv: RendezVous | null;
  onSuccess: (vente: Vente) => void;
}

export function ValidationFinanceModal({
  isOpen,
  onClose,
  rdv,
  onSuccess,
}: ValidationFinanceModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { formatCurrency } = useTranslations();
  const { staff } = useSalon();
  const { session } = useAuth();
  const { typesPrestations } = usePrestations();
  const { getClient } = useClients();
  const { addVenteAsync, ventes } = useFinances();
  const { updateRendezVous, updateRendezVousAsync } = useRendezVous();

  // Guard: Check if appointment has already been invoiced
  const isAlreadyValidated = Boolean(
    rdv?.financeValide ||
    rdv?.venteId ||
    rdv?.statut === 'termine' ||
    rdv?.statut === 'completed' ||
    (ventes && ventes.some((v) =>
      (rdv?.venteId && (v.id === rdv.venteId || (v as any)._id === rdv.venteId)) ||
      (rdv?.id && v.rendezVousId && String(v.rendezVousId) === String(rdv.id)) ||
      (rdv?.reference && v.rendezVousRef && v.rendezVousRef === rdv.reference)
    ))
  );

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [nombrePersonnes, setNombrePersonnes] = useState<number>(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [remise, setRemise] = useState<number>(0);
  const [selectedEmploye, setSelectedEmploye] = useState<string>('');
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile_money' | 'carte' | 'mixte'>('especes');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = React.useRef(false);

  // Match existing Vente if already validated
  const existingVente = useMemo(() => {
    if (!rdv) return null;
    return (ventes || []).find(
      (v) => (rdv.venteId && (v.id === rdv.venteId || (v as any)._id === rdv.venteId)) ||
             v.rendezVousId === rdv.id ||
             (v.rendezVousRef && v.rendezVousRef === rdv.reference)
    ) || null;
  }, [rdv, ventes]);

  // Prefill when rdv changes
  useEffect(() => {
    if (!rdv) return;

    const initialServiceId = rdv.typePrestationId || '';
    setSelectedServiceId(initialServiceId);

    const service = typesPrestations.find(
      (tp) => String(tp.id) === String(initialServiceId) || String((tp as any)._id) === String(initialServiceId)
    );
    const initialPrice = service?.prix || 0;
    setPrixUnitaire(initialPrice);

    // Initial beneficiaries count (default to rdv.nombrePersonnes if set, else 1)
    const initialNb = rdv.nombrePersonnes && rdv.nombrePersonnes >= 1 ? rdv.nombrePersonnes : 1;
    setNombrePersonnes(initialNb);
    setRemise(0);

    // Employee assignment: match by ID or name, fallback to active session
    let matchedEmpId = '';
    if (rdv.employe) {
      const foundStaff = staff.find(
        (s) => s.id === rdv.employe || s._id === rdv.employe || s.name === rdv.employe
      );
      if (foundStaff) {
        matchedEmpId = foundStaff._id || foundStaff.id;
      } else {
        matchedEmpId = rdv.employe;
      }
    }
    if (!matchedEmpId && session?.userId) {
      matchedEmpId = session.userId;
    }
    setSelectedEmploye(matchedEmpId);

    // Initial notes
    const refText = rdv.reference ? `Réf: ${rdv.reference}` : `RDV du ${rdv.date || ''}`;
    setNotes(rdv.notes ? `${rdv.notes}` : `Validation RDV (${refText})`);
  }, [rdv, typesPrestations, staff, session]);

  const handleServiceChange = (serviceId: string) => {
    if (isAlreadyValidated) return;
    setSelectedServiceId(serviceId);
    const service = typesPrestations.find(
      (tp) => String(tp.id) === String(serviceId) || String((tp as any)._id) === String(serviceId)
    );
    if (service) {
      setPrixUnitaire(service.prix);
    }
  };

  const currentService = useMemo(() => {
    return typesPrestations.find(
      (tp) => String(tp.id) === String(selectedServiceId) || String((tp as any)._id) === String(selectedServiceId)
    );
  }, [typesPrestations, selectedServiceId]);

  const client = useMemo(() => {
    if (!rdv) return null;
    if (rdv.clientId) return getClient(rdv.clientId);
    return null;
  }, [rdv, getClient]);

  const clientName = client?.nom || rdv?.customerName || t('finances.invoice.walkInClient', 'Client de passage');
  const clientPhone = client?.telephone || rdv?.customerPhone || '';

  // Calculations
  const sousTotal = Math.max(0, prixUnitaire * nombrePersonnes);
  const totalNet = Math.max(0, sousTotal - remise);

  // Submit & Validate
  const handleValiderFinances = async () => {
    if (!rdv) return;

    // Strict guard against duplicate validation or double-click
    if (isSubmittingRef.current || isSubmitting || isAlreadyValidated) {
      toast.error(t('appointments.alreadyInvoiced', 'Ce rendez-vous a déjà été validé et facturé.'));
      return;
    }
    isSubmittingRef.current = true;

    if (!selectedServiceId) {
      toast.error('Veuillez sélectionner une prestation.');
      return;
    }
    if (nombrePersonnes < 1) {
      toast.error('Le nombre de personnes doit être au moins 1.');
      return;
    }
    if (!selectedEmploye) {
      toast.error("Veuillez sélectionner l'employé(e) ayant pris en charge la prestation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceName = currentService?.nom || 'Prestation';
      const staffMember = staff.find((s) => s.id === selectedEmploye || s._id === selectedEmploye);
      const isSelf = selectedEmploye === session?.userId;
      const employeLabel = staffMember?.name || (isSelf ? (session?.userName || 'Boss') : selectedEmploye);

      const designation = nombrePersonnes > 1
        ? `${serviceName} (${nombrePersonnes} personnes)`
        : serviceName;

      const venteItem: VenteItem = {
        type: 'prestation',
        referenceId: selectedServiceId,
        nom: designation,
        quantite: nombrePersonnes,
        prixUnitaire: prixUnitaire,
        montant: sousTotal,
      };

      const venteData: Omit<Vente, 'id'> = {
        date: rdv.date || new Date().toISOString().split('T')[0],
        clientId: rdv.clientId || undefined,
        employe: selectedEmploye,
        employeNom: employeLabel,
        items: [venteItem],
        totalMontant: totalNet,
        remise: remise > 0 ? remise : undefined,
        modePaiement: modePaiement,
        statut: 'payee',
        notes: `Facturation RDV ${rdv.reference || rdv.id} (${nombrePersonnes} pers. - En charge: ${employeLabel}). ${notes}`.trim(),
        rendezVousId: rdv.id,
        rendezVousRef: rdv.reference,
        nombrePersonnes: nombrePersonnes,
      };

      // 1. Create sale
      const createdVente = await addVenteAsync(venteData);
      const resolvedVenteId = createdVente?.id || (createdVente as any)?._id || `rdv-fac-${rdv.id}`;

      // 2. Update RDV status to 'termine' and link finance validation
      await updateRendezVousAsync({
        id: rdv.id,
        updates: {
          statut: 'termine',
          financeValide: true,
          venteId: resolvedVenteId,
          employe: selectedEmploye,
          employeNom: employeLabel,
          nombrePersonnes: nombrePersonnes,
          montantTotal: totalNet,
        },
      });

      // 3. Immediately invalidate queries for real-time reactivity across Bilan, Planning, Caisse
      const sId = session?.salonId;
      if (sId) {
        queryClient.invalidateQueries({ queryKey: ['ventes', sId] });
        queryClient.invalidateQueries({ queryKey: ['rendezVous', sId] });
        queryClient.invalidateQueries({ queryKey: ['prestations', sId] });
        queryClient.invalidateQueries({ queryKey: ['clients', sId] });
      }

      window.dispatchEvent(
        new CustomEvent('finance:updated', {
          detail: {
            rdvId: rdv.id,
            venteId: resolvedVenteId,
            employe: selectedEmploye,
            employeNom: employeLabel,
            montant: totalNet,
          },
        })
      );

      toast.success(t('appointments.toast.updated', 'Rendez-vous validé par les finances avec succès !'), {
        description: `Facture de ${formatCurrency(totalNet)} pour ${nombrePersonnes} personne(s) — Pris en charge par ${employeLabel}.`,
        action: {
          label: 'Bilan Boss',
          onClick: () => navigate('/bilan'),
        },
      });

      onClose();
      onSuccess(createdVente || ({ ...venteData, id: resolvedVenteId } as Vente));
    } catch (err: any) {
      console.error('Erreur validation finance rendez-vous:', err);
      toast.error('Échec de la validation financière', {
        description: err.message || 'Une erreur est survenue lors de la création de la facture.',
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const paymentModes = [
    { id: 'especes', label: 'Espèces', icon: Banknote, color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
    { id: 'carte', label: 'Carte bancaire', icon: CreditCard, color: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
    { id: 'mixte', label: 'Autre / Mixte', icon: Sparkles, color: 'text-purple-500 border-purple-500/30 bg-purple-500/10' },
  ] as const;

  if (!rdv) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[28px] border border-border/60 shadow-2xl bg-background/95 backdrop-blur-xl w-[96vw] sm:w-full max-h-[92vh] flex flex-col">
        {/* Luxury Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden shrink-0 border-b border-white/10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          <DialogHeader className="relative z-10 text-left space-y-1.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-400 shadow-inner">
                  {isAlreadyValidated ? <Lock className="h-5 w-5 text-amber-400" /> : <Receipt className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {t('appointments.modal.financeTitle', 'Validation Financière')}
                    <span className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-semibold border',
                      isAlreadyValidated
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    )}>
                      {isAlreadyValidated ? t('appointments.status.facture', 'Facturé') : 'Caisse'}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-white/70">
                    {isAlreadyValidated
                      ? t('appointments.cannotRevalidate', 'Facture déjà émise')
                      : t('appointments.modal.financeDesc', 'Facturation et clôture du rendez-vous')}
                  </DialogDescription>
                </div>
              </div>

              {rdv.reference && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-semibold text-white/90">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Réf:</span>
                  <span>{rdv.reference}</span>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Banner if already validated */}
          {isAlreadyValidated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {t('appointments.cannotRevalidate', 'Facture déjà émise')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('appointments.modal.alreadyValidatedDesc', 'La facture correspondante a déjà été générée. Vous ne pouvez plus valider ce rendez-vous une seconde fois.')}
                </p>
              </div>
            </div>
          )}

          {/* Client & RDV Card */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 uppercase">
                {clientName.slice(0, 2)}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm truncate">{clientName}</span>
                  {rdv.source && (
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 border-border text-muted-foreground">
                      {rdv.source === 'en_ligne' || rdv.source === 'public' ? 'En ligne' : 'Au salon'}
                    </Badge>
                  )}
                </div>
                {clientPhone && (
                  <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
                    <Phone className="h-3 w-3 text-primary shrink-0" />
                    {clientPhone}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground sm:border-l sm:border-border/60 sm:pl-4 pt-2 sm:pt-0 shrink-0">
              <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{rdv.date}</span>
              <span>à</span>
              <span className="font-semibold text-foreground">{rdv.heure}</span>
            </div>
          </div>

          {/* Section 1: Prestation & Nombre de personnes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prestation réalisée *
                </Label>
                <Select value={selectedServiceId} onValueChange={handleServiceChange} disabled={isAlreadyValidated}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-input font-semibold text-xs">
                    <SelectValue placeholder="Sélectionner une prestation..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-xl max-h-[240px]">
                    {typesPrestations.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id} className="rounded-lg font-medium text-xs">
                        {tp.nom} · {formatCurrency(tp.prix)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prix unitaire (FCFA)
                </Label>
                <Input
                  type="number"
                  min="0"
                  disabled={isAlreadyValidated}
                  value={prixUnitaire}
                  onChange={(e) => setPrixUnitaire(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-11 rounded-xl bg-background border-input font-bold text-xs"
                />
              </div>
            </div>

            {/* Stepper Bénéficiaires */}
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {t('appointments.numberOfPersons', 'Nombre de personnes')} / {t('appointments.beneficiaries', 'Bénéficiaires')}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ajustez le nombre de bénéficiaires pris en charge pour ce créneau.
                  </p>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg font-bold hover:bg-background"
                    onClick={() => setNombrePersonnes((n) => Math.max(1, n - 1))}
                    disabled={isAlreadyValidated || nombrePersonnes <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    disabled={isAlreadyValidated}
                    value={nombrePersonnes}
                    onChange={(e) => setNombrePersonnes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-12 h-8 text-center font-bold text-xs rounded-lg border-none bg-background shadow-none focus-visible:ring-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg font-bold hover:bg-background"
                    onClick={() => setNombrePersonnes((n) => n + 1)}
                    disabled={isAlreadyValidated}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isAlreadyValidated}
                    onClick={() => setNombrePersonnes(num)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all border',
                      nombrePersonnes === num
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted',
                      isAlreadyValidated && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {num} {num > 1 ? 'personnes' : 'personne'}
                  </button>
                ))}
              </div>

              {/* Formula banner */}
              {nombrePersonnes > 1 && (
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-xs flex items-center justify-between text-primary font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Total ({nombrePersonnes} personnes)
                  </span>
                  <span className="font-mono font-bold">
                    {nombrePersonnes} × {formatCurrency(prixUnitaire)} = {formatCurrency(sousTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Membre d'équipe en charge */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-primary" />
              {t('appointments.assignedStaff', 'Employé(e) en charge')} *
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Membre d'équipe responsable pour le suivi des commissions et de l'historique.
            </p>

            <Select value={selectedEmploye} onValueChange={setSelectedEmploye} disabled={isAlreadyValidated}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-input font-semibold text-xs">
                <SelectValue placeholder="Sélectionner l'employé(e)..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl max-h-[250px]">
                {staff.map((member) => (
                  <SelectItem key={member._id || member.id} value={member._id || member.id} className="rounded-lg font-medium text-xs">
                    {member.name} {member.role ? `· ${member.role}` : ''}
                  </SelectItem>
                ))}
                {session?.userId && !staff.find((s) => (s._id || s.id) === session.userId) && (
                  <SelectItem value={session.userId} className="rounded-lg font-medium text-xs">
                    {session.userName} (Moi-même)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Section 3: Mode de règlement & Remise */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3.5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mode de règlement
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paymentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = modePaiement === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={isAlreadyValidated}
                      onClick={() => setModePaiement(mode.id as any)}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all',
                        isSelected
                          ? `${mode.color} border-2 shadow-xs font-extrabold`
                          : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60',
                        isAlreadyValidated && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] truncate">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Remise éventuelle (FCFA)
                </Label>
                <Input
                  type="number"
                  min="0"
                  disabled={isAlreadyValidated}
                  value={remise}
                  onChange={(e) => setRemise(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="h-11 rounded-xl bg-background border-input font-bold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes internes (optionnel)
                </Label>
                <Input
                  value={notes}
                  disabled={isAlreadyValidated}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Précisions de facturation..."
                  className="h-11 rounded-xl bg-background border-input font-medium text-xs"
                />
              </div>
            </div>
          </div>

          {/* Luxury Total Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>{currentService?.nom || 'Prestation'} ({nombrePersonnes} {nombrePersonnes > 1 ? 'personnes' : 'personne'})</span>
              <span className="font-mono font-semibold">{formatCurrency(sousTotal)}</span>
            </div>
            {remise > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-300">
                <span>Remise appliquée</span>
                <span className="font-mono font-semibold">- {formatCurrency(remise)}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{t('appointments.modal.totalNet', 'Total Net Encaissé')}</div>
                <div className="text-[10px] text-emerald-400 font-medium">Facturation liée au rendez-vous</div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {formatCurrency(totalNet)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-background border-t border-border/60 flex flex-col sm:flex-row gap-2.5 justify-end shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground"
          >
            {t('appointments.btn.close', 'Fermer')}
          </Button>

          {isAlreadyValidated ? (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                disabled
                className="h-11 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-80 shadow-none"
              >
                <Lock className="h-4 w-4 mr-2 text-amber-500" />
                <span>{t('appointments.btn.alreadyInvoicedLocked', 'Déjà validé & facturé (Bloqué)')}</span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  const resolvedVente = existingVente || ({
                    id: rdv.venteId || `rdv-${rdv.id}`,
                    date: rdv.date || new Date().toISOString().split('T')[0],
                    clientId: rdv.clientId,
                    employe: rdv.employe,
                    modePaiement: 'especes',
                    rendezVousId: rdv.id,
                    rendezVousRef: rdv.reference,
                    nombrePersonnes: rdv.nombrePersonnes || 1,
                    totalMontant: rdv.montantTotal || 0,
                    items: [{
                      type: 'prestation',
                      referenceId: rdv.typePrestationId,
                      nom: currentService?.nom || 'Prestation',
                      quantite: rdv.nombrePersonnes || 1,
                      prixUnitaire: currentService?.prix || 0,
                      montant: rdv.montantTotal || 0,
                    }],
                  } as Vente);
                  onSuccess(resolvedVente);
                }}
                className="h-11 px-5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 border-0 transition-all active:scale-[0.99]"
              >
                <Receipt className="h-4 w-4 mr-2" />
                <span>{t('appointments.modal.seeInvoice', 'Consulter la facture')}</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleValiderFinances}
              disabled={isSubmitting || !selectedServiceId || !selectedEmploye}
              className="h-11 px-5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-0 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span>Validation en cours...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span>{t('appointments.btn.validateAndInvoice', 'Valider & Facturer')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatCurrency(totalNet)}</span>
                </span>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
