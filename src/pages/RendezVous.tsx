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
import { Link2, Copy, ExternalLink, MessageCircle, Zap, CalendarCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RendezVousPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const salon = session?.salonId
    ? getSalonAccounts().find((s) => s.id === session.salonId)
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
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
              <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {t('appointments.title') || 'Gestion des Rendez-vous'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {t('appointments.subtitle') || 'Gérez vos créneaux, réservations en ligne et le planning de votre salon.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Booking Link Card */}
      {slug && (
        <Card className="p-4 sm:p-6 rounded-3xl border-primary/20 bg-gradient-to-r from-primary/10 via-card to-muted/20 shadow-md backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl gradient-primary text-white flex items-center justify-center shrink-0 shadow-md">
                <Link2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                    Lien de réservation en ligne
                  </h3>
                  {instant && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-extrabold text-[11px] h-6 px-2.5 rounded-full">
                      <Zap className="h-3 w-3 mr-1 text-emerald-500 fill-emerald-500" /> Auto-confirmation
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Partagez ce lien à vos clientes pour leur permettre de réserver 24/7 en toute autonomie.
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 px-3.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 max-w-full overflow-x-auto shadow-2xs">
                  {publicUrl}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
              <Button
                size="sm"
                variant="outline"
                onClick={copy}
                className="rounded-xl h-9 px-3.5 text-xs font-extrabold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> Copier le lien
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={shareWa}
                className="rounded-xl h-9 px-3.5 text-xs font-extrabold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> WhatsApp
              </Button>
              <Button
                size="sm"
                asChild
                className="rounded-xl h-9 px-4 text-xs font-extrabold bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-700 hover:to-purple-700 shadow-md shadow-rose-600/20"
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Aperçu client
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Public Bookings Notification Banner */}
      <PendingPublicBookings />

      {/* Main Interactive Calendar */}
      <CalendrierRendezVous />
    </div>
  );
}
