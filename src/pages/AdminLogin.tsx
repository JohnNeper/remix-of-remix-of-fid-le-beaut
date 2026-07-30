import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import bfLogo from '@/assets/BF.png';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { session, loginAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session?.type === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(email, password)) {
      toast({ title: 'Connecté en tant qu\'administrateur' });
      navigate('/admin');
    } else {
      toast({ title: 'Identifiants incorrects', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-muted inline-flex items-center justify-center">
              <img src={bfLogo} alt="BeautyFlow Logo" className="h-12 sm:h-14 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Espace de gestion global</p>
        </div>

        <Card className="card-shadow">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Connexion Admin</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gérez les salons et abonnements</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 sm:h-10 text-base sm:text-sm">Se connecter</Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-muted-foreground text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 mr-1" />
            Espace Salon
          </Button>
        </div>
      </div>
    </div>
  );
}
