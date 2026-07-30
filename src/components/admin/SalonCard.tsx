import React, { useState } from 'react';
import { Building2, RefreshCw, Users, UserPlus, Trash2, Crown, User, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { Salon } from '@/types/auth';
import { toast } from '@/hooks/use-toast';
import { PLANS, PlanType, getPlanColor, formatPlanPrice, getPlan } from '@/lib/plans';

interface Props {
  salon: SalonAccount;
  onRenew: (id: string) => void;
  onToggle: (salon: Salon) => Promise<void>;
  onRefresh?: () => void;
}

function daysRemaining(salon: SalonAccount): number {
  const expiry = new Date(salon.dernierPaiement);
  expiry.setDate(expiry.getDate() + salon.joursAbonnement);
  const diff = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const formatDateForInput = (dateString?: string | Date) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function SalonCard({ salon, onRenew, onToggle, onRefresh }: Props) {
  const active = isSalonSubscriptionActive(salon);
  const days = daysRemaining(salon);
  const currentPlan = getPlan(salon.plan || 'basic');

  // Collapsible sections
  const [showUsers, setShowUsers] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);

  // Staff creation state
  const [staffNom, setStaffNom] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPwd, setStaffPwd] = useState('');
  const [staffTel, setStaffTel] = useState('');

  // Staff list & dynamic load
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Staff edit state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPwd, setEditPwd] = useState('');
  const [editTel, setEditTel] = useState('');

  // Subscription management dialog state
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [subStatut, setSubStatut] = useState(salon.abonnement?.statut || 'essai');
  const [subPlan, setSubPlan] = useState<PlanType>(salon.plan || 'basic');
  const [subMontant, setSubMontant] = useState(salon.abonnement?.montant || 25000);
  const [subDateDebut, setSubDateDebut] = useState(formatDateForInput(salon.abonnement?.dateDebut));
  const [subDateFin, setSubDateFin] = useState(formatDateForInput(salon.abonnement?.dateFin));
  const [subRenouvellementAuto, setSubRenouvellementAuto] = useState(salon.abonnement?.renouvellementAuto || false);

  React.useEffect(() => {
    if (showSubDialog) {
      setSubStatut(salon.abonnement?.statut || 'essai');
      setSubPlan(salon.plan || 'basic');
      setSubMontant(salon.abonnement?.montant || 25000);
      setSubDateDebut(formatDateForInput(salon.abonnement?.dateDebut));
      setSubDateFin(formatDateForInput(salon.abonnement?.dateFin));
      setSubRenouvellementAuto(!!salon.abonnement?.renouvellementAuto);
    }
  }, [showSubDialog, salon]);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const data = await api.getStaff(salon._id || '');
      setStaffList(data);
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de charger le personnel', variant: 'destructive' });
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleToggleUsers = () => {
    if (!showUsers) {
      fetchStaff();
    }
    setShowUsers(!showUsers);
  };

  const handleAddStaff = async () => {
    if (!staffNom || !staffEmail || !staffPwd) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }

    try {
      await api.createStaff(salon._id || '', {
        name: staffNom,
        email: staffEmail,
        password: staffPwd,
        telephone: staffTel
      });
      toast({ title: 'Membre du personnel créé avec succès' });
      setStaffNom('');
      setStaffEmail('');
      setStaffPwd('');
      setStaffTel('');
      setShowAddStaff(false);
      fetchStaff();
      onRefresh?.(); // refresh salon stats
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le personnel',
        variant: 'destructive'
      });
    }
  };

  const handleEditStaffClick = (user: any) => {
    setEditingStaffId(user.id);
    setEditNom(user.nom);
    setEditEmail(user.email);
    setEditTel(user.telephone || '');
    setEditPwd('');
  };

  const handleUpdateStaff = async (userId: string) => {
    if (!editNom || !editEmail) {
      toast({ title: 'Erreur', description: 'Le nom et l\'email sont requis', variant: 'destructive' });
      return;
    }

    try {
      await api.updateStaff(salon._id || '', userId, {
        name: editNom,
        email: editEmail,
        telephone: editTel,
        password: editPwd || undefined
      });
      toast({ title: 'Personnel mis à jour avec succès' });
      setEditingStaffId(null);
      fetchStaff();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de mettre à jour', variant: 'destructive' });
    }
  };

  const handleRemoveStaff = async (userId: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${name} du personnel ?`)) return;

    try {
      await api.deleteStaff(salon._id || '', userId);
      toast({ title: `${name} a été supprimé` });
      fetchStaff();
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  const handleChangePlan = async (newPlan: PlanType) => {
    try {
      await api.adminUpdateSalonStatus(salon._id || '', { plan: newPlan, statutAbonnement: 'actif' });
      toast({ title: `Plan mis à jour` });
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast({ title: `Erreur lors de la mise à jour`, variant: 'destructive' });
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminUpdateSalonStatus(salon._id || '', {
        plan: subPlan,
        abonnement: {
          statut: subStatut,
          montant: subMontant,
          dateDebut: subDateDebut,
          dateFin: subDateFin,
          renouvellementAuto: subRenouvellementAuto,
        }
      });
      toast({ title: 'Abonnement mis à jour avec succès' });
      setShowSubDialog(false);
      onRefresh?.();
    } catch (error: any) {
      toast({ title: 'Erreur lors de la mise à jour', description: error.message, variant: 'destructive' });
    }
  };

  const maxStaff = currentPlan.maxStaff === -1 ? Infinity : currentPlan.maxStaff;

  const ownerUser = salon.owner ? {
    id: typeof salon.owner === 'object' ? (salon.owner as any)._id : salon.owner,
    nom: typeof salon.owner === 'object' ? (salon.owner as any).name : 'Propriétaire',
    email: typeof salon.owner === 'object' ? (salon.owner as any).email : '',
    role: 'owner',
    telephone: typeof salon.owner === 'object' ? (salon.owner as any).telephone : ''
  } : null;

  const usersToShow = [
    ...(ownerUser ? [ownerUser] : []),
    ...staffList.map(s => ({
      id: s._id || s.id,
      nom: s.name,
      email: s.email,
      role: 'staff',
      telephone: s.telephone
    }))
  ];

  const staffCount = staffList.length;

  return (
    <div className={`p-3 sm:p-4 rounded-xl border ${active ? 'border-border bg-card' : 'border-destructive/30 bg-destructive/5'}`}>
      <div className="flex flex-col gap-3">
        {/* Salon info */}
        <div className="flex items-start gap-3">
          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-primary/20' : 'bg-destructive/20'}`}>
            <Building2 className={`h-4 w-4 sm:h-5 sm:w-5 ${active ? 'text-primary' : 'text-destructive'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base text-foreground">{salon.nom}</h3>
              <Badge className={`${getPlanColor(salon.plan || 'basic')} text-[10px] sm:text-xs`}>
                {currentPlan.label}
              </Badge>
              <Badge className={`text-[10px] sm:text-xs ${active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                {active ? `${days}j restants` : 'Expiré'}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <Users className="h-3 w-3 mr-1" />
                {staffCount} staff(s){maxStaff < Infinity ? `/${maxStaff}` : ''}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{(salon.proprietaire as any)?.name || (salon.owner as any)?.name || 'N/A'} · {salon.phone || (salon.proprietaire as any)?.telephone || (salon.owner as any)?.telephone}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{salon.email} · {formatPlanPrice(salon.abonnement?.montant || currentPlan.price)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-12 sm:ml-[52px] flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowSubDialog(true)} className="text-xs h-8">
            <RefreshCw className="h-3 w-3 mr-1" />
            Abonnement
          </Button>
          <Button size="sm" variant={active ? 'destructive' : 'default'} onClick={() => onToggle(salon)} className="text-xs h-8">
            {active ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowPlanChange(!showPlanChange)} className="text-xs h-8">
            Plan
          </Button>
          <Button size="sm" variant="outline" onClick={handleToggleUsers} className="text-xs h-8">
            <Users className="h-3 w-3 mr-1" />
            {showUsers ? 'Masquer' : 'Utilisateurs'}
          </Button>
        </div>

        {/* Plan change */}
        {showPlanChange && (
          <div className="ml-12 sm:ml-[52px] pt-2 border-t border-border">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Changer le plan :</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
                const p = PLANS[planKey];
                const isCurrent = (salon.plan || 'basic') === planKey;
                return (
                  <button
                    key={planKey}
                    onClick={() => !isCurrent && handleChangePlan(planKey)}
                    disabled={isCurrent}
                    className={`p-2 rounded-lg border text-center transition-all text-xs ${isCurrent
                        ? 'border-primary bg-primary/10 opacity-60 cursor-default'
                        : 'border-border hover:border-primary/40 cursor-pointer'
                      }`}
                  >
                    <Badge className={`${getPlanColor(planKey)} text-[10px]`}>{p.label}</Badge>
                    <p className="font-bold mt-1">{p.price.toLocaleString('fr-FR')}</p>
                    <p className="text-[10px] text-muted-foreground">FCFA</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Users panel */}
        {showUsers && (
          <div className="ml-12 sm:ml-[52px] space-y-2 pt-2 border-t border-border">
            {loadingStaff ? (
              <p className="text-xs text-muted-foreground text-center py-2 animate-pulse">Chargement du personnel...</p>
            ) : (
              usersToShow.map(user => {
                const isEditing = editingStaffId === user.id;
                return (
                  <div key={user.id} className="flex flex-col gap-2 p-2 rounded-md bg-muted/50 text-sm">
                    {isEditing ? (
                      <div className="space-y-2 p-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Nom</Label>
                            <Input value={editNom} onChange={e => setEditNom(e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                            <Input value={editTel} onChange={e => setEditTel(e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Email</Label>
                            <Input value={editEmail} type="email" onChange={e => setEditEmail(e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Mot de passe (laisser vide si inchangé)</Label>
                            <Input value={editPwd} type="password" placeholder="••••••" onChange={e => setEditPwd(e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-1">
                          <Button size="sm" className="text-xs h-7 gradient-primary" onClick={() => handleUpdateStaff(user.id)}>Enregistrer</Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingStaffId(null)}>Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {user.role === 'owner' ? (
                            <Crown className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="font-medium truncate">{user.nom}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                          {user.telephone && (
                            <span className="text-xs text-muted-foreground truncate">· {user.telephone}</span>
                          )}
                          <Badge variant={user.role === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                            {user.role === 'owner' ? 'Owner' : 'Staff'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {user.role === 'staff' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditStaffClick(user)}>
                                <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveStaff(user.id, user.nom)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Add staff */}
            {staffCount < maxStaff && !loadingStaff && (
              <>
                {!showAddStaff ? (
                  <Button variant="outline" size="sm" className="text-xs h-8 w-full" onClick={() => setShowAddStaff(true)}>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Ajouter un staff
                  </Button>
                ) : (
                  <div className="space-y-2 p-2 rounded-md border bg-background">
                    <Input placeholder="Nom" value={staffNom} onChange={e => setStaffNom(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Email" type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Mot de passe" type="password" value={staffPwd} onChange={e => setStaffPwd(e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="Téléphone (optionnel)" value={staffTel} onChange={e => setStaffTel(e.target.value)} className="h-8 text-xs" />
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7 gradient-primary" onClick={handleAddStaff}>Ajouter</Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAddStaff(false)}>Annuler</Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {staffCount >= maxStaff && maxStaff < Infinity && !loadingStaff && (
              <p className="text-xs text-center text-muted-foreground py-1">
                Limite staff atteinte ({staffCount}/{maxStaff}) — Plan {currentPlan.label}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dialog Gérer Abonnement */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              Gérer l'abonnement de {salon.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Plan de l'abonnement</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
                  const p = PLANS[planKey];
                  const isSelected = subPlan === planKey;
                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => setSubPlan(planKey)}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/40'
                        }`}
                    >
                      <Badge className={`${getPlanColor(planKey)} text-[10px] mb-1`}>{p.label}</Badge>
                      <p className="text-[10px] text-muted-foreground">{p.price.toLocaleString('fr-FR')} FCFA</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium font-sans">Statut</Label>
              <select
                value={subStatut}
                onChange={e => setSubStatut(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none"
              >
                <option value="actif">Actif</option>
                <option value="essai">Essai</option>
                <option value="expire">Expiré</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>

            {/* Montant & Renouvellement Auto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Montant payé (FCFA)</Label>
                <Input
                  type="number"
                  value={subMontant}
                  onChange={e => setSubMontant(Number(e.target.value))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="auto-renew"
                  checked={subRenouvellementAuto}
                  onChange={e => setSubRenouvellementAuto(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="auto-renew" className="text-sm font-medium cursor-pointer">Renouvellement Auto</Label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date de début</Label>
                <Input
                  type="date"
                  value={subDateDebut}
                  onChange={e => setSubDateDebut(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date de fin</Label>
                <Input
                  type="date"
                  value={subDateFin}
                  onChange={e => setSubDateFin(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowSubDialog(false)}>Annuler</Button>
              <Button type="submit" className="gradient-primary">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
