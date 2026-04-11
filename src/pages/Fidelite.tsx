import React, { useState } from 'react';
import { Gift, Star, Award, TrendingUp, RotateCcw, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { toast } from 'sonner';

export default function Fidelite() {
  const { clients, updateClient } = useClients();
  const { salon } = useSalon();
  const { t } = useLanguage();
  const { hasLoyaltyRules, hasBirthdayBonus, getUpgradePlan, plan } = useSubscriptionPlan();
  const { language } = useLanguage();
  const [resetConfirm, setResetConfirm] = useState<string | null>(null);

  const clientsVIP = clients.filter(c => c.statut === 'vip');
  const totalPointsDistributed = clients.reduce((s, c) => s + c.pointsFidelite, 0);

  const clientsWithProgress = clients.map(client => {
    const pointsVersProchaineCadeau = client.pointsFidelite % salon.configFidelite.visitesRequises;
    const progress = (pointsVersProchaineCadeau / salon.configFidelite.visitesRequises) * 100;
    const cadeauxGagnes = Math.floor(client.pointsFidelite / salon.configFidelite.visitesRequises);
    const canRedeem = cadeauxGagnes > 0 && pointsVersProchaineCadeau === 0 && client.pointsFidelite > 0;
    return { ...client, progress, cadeauxGagnes, pointsVersProchaineCadeau, canRedeem };
  }).sort((a, b) => b.pointsFidelite - a.pointsFidelite);

  const handleRedeemGift = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Reset loyalty points to 0 but keep VIP status based on nombreVisites
    // VIP status is tied to total visits, not points
    updateClient(clientId, {
      pointsFidelite: 0,
      // Keep statut as-is — VIP is based on nombreVisites which doesn't reset
    });

    toast.success(`🎁 Cadeau offert à ${client.nom} ! Points remis à zéro.`);
    setResetConfirm(null);
  };

  const resetClient = resetConfirm ? clients.find(c => c.id === resetConfirm) : null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('loyalty.title')}</h1>
        <p className="text-muted-foreground">{t('loyalty.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Star className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes VIP</p>
              <p className="text-2xl font-bold">{clientsVIP.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visites → Cadeau</p>
              <p className="text-2xl font-bold">{salon.configFidelite.visitesRequises}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Réduction</p>
              <p className="text-2xl font-bold">{salon.configFidelite.reductionPourcentage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-info/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points distribués</p>
              <p className="text-2xl font-bold">{totalPointsDistributed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Règles de fidélité</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>🎯 Après <strong>{salon.configFidelite.visitesRequises} visites</strong>, la cliente obtient <strong>{salon.configFidelite.reductionPourcentage}% de réduction</strong>.</p>
                <p>⭐ Après <strong>{salon.configFidelite.visitesVIP} visites</strong>, la cliente devient <strong>VIP</strong> (statut permanent).</p>
                <p>🔄 Quand un cadeau est offert, les <strong>points sont remis à zéro</strong> mais le <strong>statut VIP reste acquis</strong>.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasLoyaltyRules && (
        <UpgradePrompt feature={language === 'fr' ? 'Règles de fidélité avancées (1 pt / 1000 FCFA)' : 'Advanced loyalty rules (1 pt / 1000 FCFA)'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}
      {!hasBirthdayBonus && (
        <UpgradePrompt feature={language === 'fr' ? 'Bonus anniversaire automatique' : 'Automatic birthday bonus'} currentPlan={plan.name} requiredPlan={getUpgradePlan()} type="banner" />
      )}

      {/* Client progress */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progression des clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientsWithProgress.map((client) => (
              <div key={client.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {client.nom.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{client.nom}</p>
                        {client.statut === 'vip' && (
                          <Badge className="bg-accent/20 text-accent text-xs">
                            <Star className="h-3 w-3 mr-1" />VIP
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {client.pointsFidelite} points • {client.nombreVisites} visites
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div>
                      <p className="font-bold text-primary">{client.cadeauxGagnes}</p>
                      <p className="text-xs text-muted-foreground">réductions gagnées</p>
                    </div>
                    {client.cadeauxGagnes > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => setResetConfirm(client.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Offrir cadeau
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prochaine réduction</span>
                    <span className="font-medium">
                      {client.pointsVersProchaineCadeau} / {salon.configFidelite.visitesRequises}
                    </span>
                  </div>
                  <Progress value={client.progress} className="h-2" />
                </div>
              </div>
            ))}

            {clientsWithProgress.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Aucune cliente enregistrée
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <Dialog open={!!resetConfirm} onOpenChange={() => setResetConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Offrir le cadeau fidélité
            </DialogTitle>
            <DialogDescription>
              {resetClient && (
                <>
                  Vous allez offrir la réduction de <strong>{salon.configFidelite.reductionPourcentage}%</strong> à <strong>{resetClient.nom}</strong>.
                  <br /><br />
                  Ses <strong>points seront remis à zéro</strong> pour recommencer le cycle.
                  {resetClient.statut === 'vip' && (
                    <><br /><br />✅ Son <strong>statut VIP est conservé</strong> (basé sur le nombre total de visites).</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setResetConfirm(null)} className="flex-1">Annuler</Button>
            <Button onClick={() => resetConfirm && handleRedeemGift(resetConfirm)} className="flex-1 gradient-primary">
              <Gift className="h-4 w-4 mr-2" />Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
