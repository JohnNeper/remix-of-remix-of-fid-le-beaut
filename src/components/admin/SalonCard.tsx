import React, { useState } from 'react';
import { Building2, RefreshCw, Users, UserPlus, Trash2, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SalonAccount } from '@/types/auth';
import { isSalonSubscriptionActive, addStaffToSalon, removeStaffFromSalon, getSalonAccounts, saveSalonAccounts } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { PLANS, PlanType, getPlanColor, formatPlanPrice, getPlan } from '@/lib/plans';

interface Props {
  salon: SalonAccount;
  onRenew: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onRefresh?: () => void;
}

function daysRemaining(salon: SalonAccount): number {
  const expiry = new Date(salon.dernierPaiement);
  expiry.setDate(expiry.getDate() + salon.joursAbonnement);
  const diff = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SalonCard({ salon, onRenew, onToggle, onRefresh }: Props) {
  const active = isSalonSubscriptionActive(salon);
  const days = daysRemaining(salon);
  const currentPlan = getPlan(salon.plan || 'basic');
  const [showUsers, setShowUsers] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [staffNom, setStaffNom] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPwd, setStaffPwd] = useState('');

  const users = salon.users || [];
  const maxStaff = currentPlan.maxStaff === -1 ? Infinity : currentPlan.maxStaff;

  const handleAddStaff = () => {
    if (!staffNom || !staffEmail || !staffPwd) return;
    if (users.length >= maxStaff) {
      toast({ title: `Limite staff atteinte (${currentPlan.label})`, variant: 'destructive' });
      return;
    }
    const result = addStaffToSalon(salon.id, { nom: staffNom, email: staffEmail, motDePasse: staffPwd });
    if (result) {
      toast({ title: 'Staff ajouté', description: `${staffNom} peut maintenant se connecter.` });
      setStaffNom(''); setStaffEmail(''); setStaffPwd('');
      setShowAddStaff(false);
      onRefresh?.();
    } else {
      toast({ title: 'Email déjà utilisé', variant: 'destructive' });
    }
  };

  const handleRemoveStaff = (userId: string, name: string) => {
    removeStaffFromSalon(salon.id, userId);
    toast({ title: `${name} supprimé du staff` });
    onRefresh?.();
  };

  const handleChangePlan = (newPlan: PlanType) => {
    const plan = PLANS[newPlan];
    const salons = getSalonAccounts();
    const idx = salons.findIndex(s => s.id === salon.id);
    if (idx >= 0) {
      salons[idx].plan = newPlan;
      salons[idx].montantAbonnement = plan.price;
      saveSalonAccounts(salons);
      toast({ title: `Plan changé → ${plan.label}`, description: formatPlanPrice(plan.price) });
      setShowPlanChange(false);
      onRefresh?.();
    }
  };

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
                {users.length}{maxStaff < Infinity ? `/${maxStaff}` : ''}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{salon.proprietaire} · {salon.telephone}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{salon.email} · {formatPlanPrice(currentPlan.price)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-12 sm:ml-[52px] flex-wrap">
          <Button size="sm" variant="outline" onClick={() => onRenew(salon.id)} className="text-xs h-8">
            <RefreshCw className="h-3 w-3 mr-1" />
            Renouveler
          </Button>
          <Button size="sm" variant={active ? 'destructive' : 'default'} onClick={() => onToggle(salon.id, !active)} className="text-xs h-8">
            {active ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowPlanChange(!showPlanChange)} className="text-xs h-8">
            Plan
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowUsers(!showUsers)} className="text-xs h-8">
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
                    className={`p-2 rounded-lg border text-center transition-all text-xs ${
                      isCurrent
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
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                <div className="flex items-center gap-2">
                  {user.role === 'owner' ? (
                    <Crown className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="font-medium">{user.nom}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <Badge variant={user.role === 'owner' ? 'default' : 'secondary'} className="text-[10px]">
                    {user.role === 'owner' ? 'Owner' : 'Staff'}
                  </Badge>
                </div>
                {user.role === 'staff' && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveStaff(user.id, user.nom)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add staff */}
            {users.length < maxStaff && (
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
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs h-7 gradient-primary" onClick={handleAddStaff}>Ajouter</Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAddStaff(false)}>Annuler</Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {users.length >= maxStaff && maxStaff < Infinity && (
              <p className="text-xs text-center text-muted-foreground py-1">
                Limite staff atteinte ({users.length}/{maxStaff}) — Plan {currentPlan.label}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
