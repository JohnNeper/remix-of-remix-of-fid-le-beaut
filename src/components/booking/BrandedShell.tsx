import React, { useEffect } from 'react';
import type { SalonAccount } from '@/types/auth';

interface Props {
  salon: SalonAccount;
  children: React.ReactNode;
}

/**
 * Wraps public booking pages and injects salon branding as CSS variables
 * scoped to the wrapper, so the existing semantic tokens (primary, accent)
 * automatically reflect the salon's colors.
 */
export function BrandedShell({ salon, children }: Props) {
  const primary = salon.branding?.primaryColor || '350 75% 55%';
  const secondary = salon.branding?.secondaryColor || '25 95% 60%';

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
      className="min-h-screen bg-background text-foreground"
      style={{
        ['--primary' as any]: primary,
        ['--accent' as any]: secondary,
        ['--ring' as any]: primary,
      }}
    >
      {children}
    </div>
  );
}