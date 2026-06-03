import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { SalonAccount } from '@/types/auth';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';

interface Props {
  salon: SalonAccount;
  children: React.ReactNode;
  /** Show the sticky branded header (default true). Pass false for landing if you handle hero yourself. */
  showHeader?: boolean;
}

/**
 * Standalone white-label shell for the public booking experience.
 * Injects the salon's branding (primary/accent HSL) as CSS variables and
 * provides a dedicated header + footer so the booking flow feels fully
 * detached from the BeautyFlow management dashboard.
 */
export function BrandedShell({ salon, children, showHeader = true }: Props) {
  const primary = salon.branding?.primaryColor || '350 75% 55%';
  const secondary = salon.branding?.secondaryColor || '25 95% 60%';
  const logo = salon.branding?.logoUrl;

  useEffect(() => {
    // Update <title> + theme-color so installed PWA shortcut feels salon-branded
    const prevTitle = document.title;
    document.title = `${salon.nom} — Réservation`;
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = meta?.getAttribute('content') || null;
    meta?.setAttribute('content', `hsl(${primary})`);
    return () => {
      document.title = prevTitle;
      if (meta && prevTheme) meta.setAttribute('content', prevTheme);
    };
  }, [salon.nom, primary]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground"
      style={{
        ['--primary' as any]: primary,
        ['--accent' as any]: secondary,
        ['--ring' as any]: primary,
      }}
    >
      {showHeader && (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${secondary}))` }}
            >
              {logo ? (
                <img src={logo} alt={salon.nom} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">{salon.nom}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Réservation en ligne</div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      <footer className="mt-auto py-4 border-t border-border/40">
        <Link
          to="/explorer"
          className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <span>Propulsé par</span>
          <BeautyFlowLogo className="h-4 w-4 rounded" />
          <span className="font-semibold text-foreground/80">BeautyFlow</span>
        </Link>
      </footer>
    </div>
  );
}