import React from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Copy, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BrandedShell } from '@/components/booking/BrandedShell';
import { readPublicSalon } from '@/lib/booking';
import { toast } from '@/hooks/use-toast';

export default function PublicBookingConfirmation() {
  const { slug, ref } = useParams<{ slug: string; ref: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { service?: string; date?: string; time?: string; salon?: string } };
  const salon = slug ? readPublicSalon(slug) : null;
  if (!salon) return <Navigate to="/booking/not-found" replace />;

  const info = location.state || {};

  const copyRef = async () => {
    if (!ref) return;
    await navigator.clipboard.writeText(ref);
    toast({ title: 'Référence copiée' });
  };

  return (
    <BrandedShell salon={salon}>
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold">Réservation enregistrée</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {salon.bookingSettings?.autoConfirm
            ? 'Votre rendez-vous est confirmé.'
            : `${salon.nom} vous contactera très bientôt pour confirmer.`}
        </p>

        <Card className="p-4 mt-6 text-left space-y-2">
          {info.service && <Row label="Prestation" value={info.service} />}
          {info.date && <Row label="Date" value={info.date} />}
          {info.time && <Row label="Heure" value={info.time} />}
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Référence</span>
            <button onClick={copyRef} className="flex items-center gap-1.5 font-mono font-bold text-primary">
              {ref}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>

        <div className="space-y-2 mt-6">
          <Button variant="outline" className="w-full h-12" onClick={() => navigate(`/booking/${slug}`)}>
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil du salon
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate(`/booking/${slug}/book`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Réserver à nouveau
          </Button>
        </div>
      </div>
    </BrandedShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}