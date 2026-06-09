import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';

export function ExplorerHeader() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link to="/explorer" className="flex items-center gap-2.5 group">
          <BeautyFlowLogo className="h-10 w-10 rounded-2xl shadow-md group-hover:scale-105 transition-transform" />
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-sm sm:text-base">
              Beauty<span className="text-primary">Flow</span>
            </div>
            <div className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">Réservez beauté & bien-être</div>
          </div>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-xs gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Espace pro</span>
        </Button>
      </div>
    </header>
  );
}