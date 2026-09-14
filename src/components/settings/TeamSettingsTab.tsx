import React from 'react';
import { Users, UserPlus, Clock, Trash2, Mail, Phone, ShieldCheck, Crown, AlertTriangle, Pencil, Power, CheckCircle2, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { User, Salon } from '@/types';

interface TeamSettingsTabProps {
  salon: Salon;
  staff: User[];
  staffLimit: number | null;
  language: string;
  t: (key: string) => string;
  onOpenAddStaff: () => void;
  onEditStaffAvail: (staffMember: User) => void;
  onEditStaffDetails?: (staffMember: User) => void;
  onRefetch: () => void;
  onExplorePlans: () => void;
}

export function TeamSettingsTab({
  salon,
  staff,
  staffLimit,
  language,
  t,
  onOpenAddStaff,
  onEditStaffAvail,
  onEditStaffDetails,
  onRefetch,
  onExplorePlans
}: TeamSettingsTabProps) {
  const activeStaff = staff.filter(m => m.actif !== false);
  const inactiveStaff = staff.filter(m => m.actif === false);
  const isLimitReached = staffLimit !== null && activeStaff.length >= staffLimit;
  const isOverQuota = staffLimit !== null && activeStaff.length > staffLimit;
  const usagePercentage = staffLimit ? Math.min(100, Math.round((activeStaff.length / staffLimit) * 100)) : 0;

  const handleToggleStaffStatus = async (staffMember: User, newStatus: boolean) => {
    const staffId = (staffMember as any)._id || staffMember.id;
    const salonId = (salon as any)._id || salon.id;

    try {
      await api.updateStaff(salonId, staffId, { actif: newStatus });
      toast({
        title: '✅ ' + (t('common.success') || 'Succès'),
        description: newStatus
          ? (language === 'fr' ? `${staffMember.name} est maintenant actif et réservable.` : `${staffMember.name} is now active and bookable.`)
          : (language === 'fr' ? `${staffMember.name} a été mis en pause.` : `${staffMember.name} has been paused.`),
      });
      onRefetch();
    } catch (err: any) {
      toast({
        title: '❌ ' + (t('common.error') || 'Erreur'),
        description: err.message || (language === 'fr' ? 'Impossible de modifier le statut' : 'Failed to update status'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStaff = async (staffMember: User) => {
    const staffId = (staffMember as any)._id || staffMember.id;
    const salonId = (salon as any)._id || salon.id;

    if (window.confirm(language === 'fr' 
      ? `Êtes-vous sûr de vouloir supprimer ${staffMember.name} de votre équipe ?`
      : `Are you sure you want to remove ${staffMember.name} from your team?`)) {
      try {
        await api.deleteStaff(salonId, staffId);
        toast({
          title: '✅ ' + (t('common.success') || 'Succès'),
          description: language === 'fr' ? 'Collaborateur supprimé avec succès.' : 'Team member deleted.',
        });
        onRefetch();
      } catch (err: any) {
        toast({
          title: '❌ ' + (t('common.error') || 'Erreur'),
          description: err.message || (language === 'fr' ? 'Échec de la suppression' : 'Failed to delete'),
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Banner: Staff Quota */}
      <Card className="card-shadow rounded-3xl border-border/60 bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {language === 'fr' ? 'Gestion des Collaborateurs' : 'Team Members'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Gérez votre équipe, leurs photos, leurs rôles et leurs plannings. Vos données restent conservées en cas de changement de forfait.'
                  : 'Manage your team, photos, roles, and working schedules. Your data remains fully preserved across plan changes.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={onOpenAddStaff}
                disabled={isLimitReached}
                className="gradient-primary rounded-2xl h-11 px-6 font-bold shadow-md gap-2 w-full md:w-auto disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {language === 'fr' ? 'Ajouter un collaborateur' : 'Add team member'}
              </Button>
            </div>
          </div>

          {/* Quota Progress */}
          {staffLimit !== null && (
            <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
                <span className="text-muted-foreground">
                  {t('team.activeStaffCount') || (language === 'fr' ? 'Collaborateurs actifs :' : 'Active staff:')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground">
                    {activeStaff.length} / {staffLimit} {language === 'fr' ? 'actifs' : 'active'}
                  </span>
                  {inactiveStaff.length > 0 && (
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-600 bg-amber-500/10">
                      +{inactiveStaff.length} {language === 'fr' ? 'en pause' : 'paused'}
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={usagePercentage} className="h-2 rounded-full" />

              {/* Informative notification when quota is reached or exceeded */}
              {(isLimitReached || isOverQuota || (inactiveStaff.length > 0 && staffLimit !== null)) && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs shadow-2xs">
                  <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <div className="font-bold text-amber-900 dark:text-amber-200">
                        {isOverQuota 
                          ? (language === 'fr' ? 'Quota dépassé suite au changement de forfait' : 'Quota exceeded following plan change')
                          : (language === 'fr' ? 'Limite de collaborateurs actifs atteinte' : 'Active staff limit reached')}
                      </div>
                      <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                        {language === 'fr'
                          ? `Votre forfait autorise ${staffLimit} collaborateurs actifs. Vos ${staff.length} collaborateurs restent 100% conservés. Vous pouvez activer/désactiver les membres de votre choix ci-dessous.`
                          : `Your plan allows ${staffLimit} active staff. All ${staff.length} members are safely stored. You can toggle members active/paused below.`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onExplorePlans}
                    className="gradient-primary rounded-xl font-bold h-8 px-3.5 text-xs shadow-xs shrink-0 self-start sm:self-center"
                  >
                    <Crown className="h-3.5 w-3.5 mr-1 inline" />
                    {language === 'fr' ? 'Passer au forfait supérieur' : 'Upgrade plan'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((member) => {
          const isOwner = member.role === 'owner' || member.role === 'admin';
          const isCoOwner = member.role === 'co_owner';
          const isActif = member.actif !== false;
          const avatar = member.avatarUrl || (member as any).photoUrl || (member as any).avatar || (member as any).photo;

          return (
            <Card
              key={(member as any)._id || member.id}
              className={`card-shadow rounded-3xl border transition-all duration-300 group overflow-hidden ${
                isActif
                  ? 'border-border/60 hover:border-primary/40 bg-card'
                  : 'border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-950/10'
              }`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar ? (
                      <div className="h-12 w-12 rounded-2xl border border-primary/20 overflow-hidden shadow-inner shrink-0 relative">
                        <img src={avatar} alt={member.name} className={`w-full h-full object-cover ${!isActif ? 'grayscale-[50%] opacity-80' : ''}`} />
                      </div>
                    ) : (
                      <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center font-extrabold text-lg shadow-inner shrink-0 ${
                        isActif ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {isOwner && (
                          <Badge variant="outline" className="font-extrabold text-[10px] rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            ⭐ {t('team.ownerBadge') || (language === 'fr' ? 'Propriétaire' : 'Owner')}
                          </Badge>
                        )}
                        {isCoOwner && (
                          <Badge variant="outline" className="font-extrabold text-[10px] rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                            👑 {t('team.coOwnerBadge') || (language === 'fr' ? 'Co-propriétaire' : 'Co-owner')}
                          </Badge>
                        )}
                        {!isOwner && !isCoOwner && (
                          <Badge variant="outline" className="font-semibold text-[10px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            👤 {t('team.staffBadge') || (language === 'fr' ? 'Collaborateur' : 'Staff')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStaff(member)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                      title={language === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Status Indicator & Active Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/40 border border-border/40 text-xs">
                  <div className="flex items-center gap-1.5">
                    {isActif ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <PauseCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className={`font-bold text-[11px] ${isActif ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isActif
                        ? (t('team.statusActiveShort') || (language === 'fr' ? 'Actif & Réservable' : 'Active & Bookable'))
                        : (t('team.statusPausedShort') || (language === 'fr' ? 'En pause (Inactif)' : 'Paused (Inactive)'))}
                    </span>
                  </div>

                  {!isOwner && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {isActif ? (language === 'fr' ? 'En ligne' : 'Online') : (language === 'fr' ? 'Désactivé' : 'Disabled')}
                      </span>
                      <Switch
                        checked={isActif}
                        onCheckedChange={(checked) => handleToggleStaffStatus(member, checked)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                  {member.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.telephone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{member.telephone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditStaffDetails?.(member)}
                    className="flex-1 gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/5 hover:text-primary border-border/80"
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                    {language === 'fr' ? 'Modifier' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditStaffAvail(member)}
                    className="flex-1 gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/5 hover:text-primary border-border/80"
                  >
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {language === 'fr' ? 'Horaires' : 'Hours'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {staff.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card rounded-3xl border border-dashed border-border p-8 space-y-3">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="font-semibold text-foreground">
              {language === 'fr' ? 'Aucun collaborateur enregistré' : 'No team members added yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {language === 'fr'
                ? 'Ajoutez des membres à votre équipe pour leur attribuer des rendez-vous et gérer leurs plannings.'
                : 'Add team members to assign appointments and manage schedules.'}
            </p>
            <Button onClick={onOpenAddStaff} className="gradient-primary rounded-2xl font-bold gap-2">
              <UserPlus className="h-4 w-4" />
              {language === 'fr' ? 'Ajouter un collaborateur' : 'Add team member'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
