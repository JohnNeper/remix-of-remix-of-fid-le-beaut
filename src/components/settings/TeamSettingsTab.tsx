import React from 'react';
import { Users, UserPlus, Clock, Trash2, Mail, Phone, ShieldCheck, Crown, AlertTriangle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  const isLimitReached = staffLimit !== null && staff.length >= staffLimit;
  const usagePercentage = staffLimit ? Math.min(100, Math.round((staff.length / staffLimit) * 100)) : 0;

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
                  ? 'Gérez votre équipe, leurs photos, leurs rôles et leurs plannings.'
                  : 'Manage your team, photos, roles, and working schedules.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={onOpenAddStaff}
                className="gradient-primary rounded-2xl h-11 px-6 font-bold shadow-md gap-2 w-full md:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                {language === 'fr' ? 'Ajouter un collaborateur' : 'Add team member'}
              </Button>
            </div>
          </div>

          {/* Quota Progress */}
          {staffLimit !== null && (
            <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  {language === 'fr' ? 'Quota de collaborateurs utilisé:' : 'Staff limit used:'}
                </span>
                <span className="font-bold text-foreground">
                  {staff.length} / {staffLimit} membres
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2 rounded-full" />

              {isLimitReached && (
                <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {language === 'fr' 
                        ? 'Limite de collaborateurs atteinte pour votre forfait actuel.'
                        : 'Staff limit reached for your current plan.'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onExplorePlans} className="text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/10 h-7 px-3">
                    <Crown className="h-3.5 w-3.5 mr-1 inline" />
                    {language === 'fr' ? 'Mettre à niveau' : 'Upgrade'}
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
          const isManager = member.role === 'admin' || member.role === 'manager';
          const avatar = member.avatarUrl || (member as any).photoUrl || (member as any).avatar || (member as any).photo;

          return (
            <Card key={(member as any)._id || member.id} className="card-shadow rounded-3xl border-border/60 overflow-hidden hover:border-primary/40 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <div className="h-12 w-12 rounded-2xl border border-primary/20 overflow-hidden shadow-inner shrink-0">
                        <img src={avatar} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-primary text-lg shadow-inner shrink-0">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {member.name}
                      </h4>
                      <Badge variant="outline" className="font-semibold text-[10px] rounded-lg mt-0.5">
                        {isManager ? (language === 'fr' ? 'Gérant / Admin' : 'Manager') : (language === 'fr' ? 'Collaborateur' : 'Staff')}
                      </Badge>
                    </div>
                  </div>

                  {!isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStaff(member)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      title={language === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
