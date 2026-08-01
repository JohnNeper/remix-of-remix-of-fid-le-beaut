import React, { useState } from 'react';
import { Store, Copy, Check, ExternalLink, Crown, Users, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getPlanColor, PlanType } from '@/lib/plans';
import { cn } from '@/lib/utils';
import type { Salon } from '@/types';

interface SettingsHeaderProps {
  salon: Salon;
  plan: PlanType;
  staffCount: number;
  staffLimit: number | null;
  language: string;
  onExplorePlans: () => void;
}

export function SettingsHeader({
  salon,
  plan,
  staffCount,
  staffLimit,
  language,
  onExplorePlans
}: SettingsHeaderProps) {
  const [copied, setCopied] = useState(false);

  // Generate public booking URL
  const bookingSlug = salon.slug || (salon as any)._id || salon.id;
  const bookingUrl = `${window.location.origin}/book/${bookingSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({
      title: '✅ ' + (language === 'fr' ? 'Lien copié !' : 'Link copied!'),
      description: language === 'fr' 
        ? 'Le lien de votre page de réservation a été copié dans le presse-papier.'
        : 'Your booking page link has been copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const planColorClass = getPlanColor(plan);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 lg:p-8 card-shadow shadow-sm transition-all duration-300">
      {/* Subtle decorative background gradient elements */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: Salon Profile info */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-2xl border-2 border-primary/20 bg-muted/40 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
              {salon.logo ? (
                <img src={salon.logo} alt={salon.name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-10 w-10 text-primary/70" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center title={language === 'fr' ? 'Salon Actif' : 'Salon Active'}" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                {salon.name}
              </h2>
              <Badge 
                variant="outline" 
                className={cn(
                  "font-bold uppercase tracking-wider px-3 py-1 text-xs border rounded-xl shadow-xs cursor-pointer hover:opacity-90 transition-opacity",
                  planColorClass
                )}
                onClick={onExplorePlans}
              >
                <Crown className="h-3.5 w-3.5 mr-1 inline" />
                {plan.toUpperCase()}
              </Badge>
            </div>

            {salon.slogan && (
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 italic">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                {salon.slogan}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-1 flex-wrap">
              {salon.ville && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary/80" />
                  {salon.ville}{salon.pays ? `, ${salon.pays}` : ''}
                </span>
              )}

              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>
                  {language === 'fr' ? 'Équipe:' : 'Staff:'}{' '}
                  <strong className="text-foreground">{staffCount}</strong>
                  {staffLimit ? ` / ${staffLimit}` : ` (${language === 'fr' ? 'Illimité' : 'Unlimited'})`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 md:flex-none gap-2 rounded-2xl h-11 px-4 font-semibold hover:bg-primary/5 hover:text-primary transition-all border-border/80"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 font-bold">{language === 'fr' ? 'Lien copié !' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-primary" />
                <span>{language === 'fr' ? 'Lien de réservation' : 'Booking link'}</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(bookingUrl, '_blank')}
            className="rounded-2xl h-11 w-11 shrink-0 hover:bg-muted/80"
            title={language === 'fr' ? 'Ouvrir ma page publique' : 'Open public page'}
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
