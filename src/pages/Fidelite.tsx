import React from 'react';
import { Gift, Star, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useClients } from '@/hooks/useClients';
import { useSalon } from '@/hooks/useSalon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

export default function Fidelite() {
  const { clients } = useClients();
  const { salon } = useSalon();
  const { t } = useLanguage();

  const clientsVIP = clients.filter(c => c.statut === 'vip');
  const clientsWithProgress = clients.map(client => {
    const pointsVersProchaineCadeau = client.pointsFidelite % salon.configFidelite.visitesRequises;
    const progress = (pointsVersProchaineCadeau / salon.configFidelite.visitesRequises) * 100;
    const cadeauxGagnes = Math.floor(client.pointsFidelite / salon.configFidelite.visitesRequises);
    return { ...client, progress, cadeauxGagnes, pointsVersProchaineCadeau };
  }).sort((a, b) => b.pointsFidelite - a.pointsFidelite);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('loyalty.title')}</h1>
        <p className="text-muted-foreground">{t('loyalty.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground">Visites → Réduction</p>
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
              <p className="text-sm text-muted-foreground">Réduction offerte</p>
              <p className="text-2xl font-bold">{salon.configFidelite.reductionPourcentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Règles de fidélité</p>
              <p className="text-sm text-muted-foreground mt-1">
                Après <strong>{salon.configFidelite.visitesRequises} visites</strong>, la cliente obtient <strong>{salon.configFidelite.reductionPourcentage}% de réduction</strong> sur sa prochaine prestation.
                <br />
                Après <strong>{salon.configFidelite.visitesVIP} visites</strong>, la cliente devient automatiquement <strong>VIP</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                            <Star className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {client.pointsFidelite} points • {client.nombreVisites} visites
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{client.cadeauxGagnes}</p>
                    <p className="text-xs text-muted-foreground">réductions gagnées</p>
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
    </div>
  );
}
