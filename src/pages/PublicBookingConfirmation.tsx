import React from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Copy, Home, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const autoConfirmed = salon.bookingSettings?.autoConfirm ?? true;

  const copyRef = async () => {
    if (!ref) return;
    await navigator.clipboard.writeText(ref);
    toast({ title: 'Référence copiée' });
  };

  const shareBooking = async () => {
    const text = `J'ai réservé chez ${salon.nom} (réf. ${ref})${info.date ? ` le ${info.date}` : ''}${info.time ? ` à ${info.time}` : ''}.`;
    if (navigator.share) {
      try { await navigator.share({ title: salon.nom, text }); return; } catch (err) { console.error(err); }
    }
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copié dans le presse-papier' });
  };

  return (
    <BrandedShell salon={salon}>
      <div className="max-w-md mx-auto px-4 py-10 text-center animate-fade-in">
        <div className="relative mx-auto mb-5 h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
        </div>
        {autoConfirmed && (
          <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Confirmé instantanément
          </Badge>
        )}
        <h1 className="text-2xl font-bold">
          {autoConfirmed ? 'C\'est confirmé ✨' : 'Réservation enregistrée'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {autoConfirmed
            ? `Votre rendez-vous chez ${salon.nom} est bloqué dans leur agenda. À très vite !`
            : `${salon.nom} a reçu votre demande et vous contactera très bientôt pour la confirmer.`}
        </p>

        <Card className="p-5 mt-6 text-left space-y-3 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          {info.service && <Row label="Prestation" value={info.service} />}
          {info.date && <Row label="Date" value={info.date} />}
          {info.time && <Row label="Heure" value={info.time} />}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Référence</span>
            <button onClick={copyRef} className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline">
              {ref}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>

        <div className="space-y-2 mt-6">
          <Button className="w-full h-12 gradient-primary shadow-lg" onClick={shareBooking}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager ma réservation
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => navigate(`/booking/${slug}`)}>
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil du salon
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate(`/booking/${slug}/book`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Réserver à nouveau
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-6">
          Besoin de modifier ? Contactez directement le salon avec votre référence.
        </p>
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