import React from 'react';
import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicBookingNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Frown className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Salon introuvable</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Le lien de réservation que vous avez utilisé n'existe pas ou n'est plus actif.
        </p>
        <Button asChild className="mt-6">
          <Link to="/explorer">Voir tous les salons</Link>
        </Button>
      </div>
    </div>
  );
}