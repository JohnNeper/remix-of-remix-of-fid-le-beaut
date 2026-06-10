import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';

export function ExplorerHeader() {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <BeautyFlowLogo className="h-10 w-10 rounded-2xl shadow-md group-hover:scale-105 transition-transform" />
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-sm sm:text-base">
              Beauty<span className="text-primary">Flow</span>
            </div>
            <div className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">Réservez beauté & bien-être</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {client ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/explorer/account?tab=favorites')} className="gap-1.5">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoris</span>
                {client.favorites.length > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {client.favorites.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/explorer/account')} className="gap-1.5">
                <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {client.nom.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-24 truncate">{client.nom.split(' ')[0]}</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/explorer/login')} className="gap-1.5">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Se connecter</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}