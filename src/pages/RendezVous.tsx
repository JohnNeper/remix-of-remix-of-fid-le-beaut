import React from 'react';
import { CalendrierRendezVous } from '@/components/prestations/CalendrierRendezVous';
import { useLanguage } from '@/contexts/LanguageContext';
import { PendingPublicBookings } from '@/components/booking/PendingPublicBookings';
import { useAuth } from '@/contexts/AuthContext';
import { getSalonAccounts } from '@/lib/auth';
import { getBookingPublicUrl } from '@/lib/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Copy, ExternalLink, MessageCircle, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RendezVousPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const salon = session?.salonId
    ? getSalonAccounts().find(s => s.id === session.salonId)
    : null;
  const slug = salon?.slug;
  const publicUrl = slug ? getBookingPublicUrl(slug) : '';
  const instant = salon?.bookingSettings?.autoConfirm ?? true;

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Lien copié — collez-le à votre cliente' });
  };
  const shareWa = () => {
    const msg = `Bonjour 👋 Réservez votre rendez-vous chez ${salon?.nom} en ligne : ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('appointments.title')}</h1>
        <p className="text-muted-foreground">{t('appointments.subtitle')}</p>
      </div>

      {slug && (
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">Votre lien de réservation</h3>
                {instant && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px] h-5">
                    <Zap className="h-3 w-3 mr-0.5" /> Confirmation auto
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Partagez-le à vos clientes pour qu'elles réservent en ligne.</p>
              <div className="mt-2 flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono overflow-x-auto">
                {publicUrl}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copier
                </Button>
                <Button size="sm" variant="outline" onClick={shareWa} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                </Button>
                <Button size="sm" asChild className="gradient-primary">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Aperçu
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <PendingPublicBookings />
      <CalendrierRendezVous />
    </div>
  );
}
