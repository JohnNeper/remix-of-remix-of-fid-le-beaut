import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Eye, EyeOff, Crown, User, Calendar } from 'lucide-react';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import loginBg from '@/assets/login-bg.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginSalon } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = loginSalon(email, password);
    if (result.success) {
      toast({ title: t('login.success'), description: t('login.welcomeBack') });
      navigate('/');
    } else {
      toast({ title: t('login.error'), description: result.reason, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-6">
        {/* Language toggle */}
        <div className="flex justify-end">
          <div className="bg-background/20 backdrop-blur-md rounded-full">
            <LanguageToggle />
          </div>
        </div>

        {/* Logo */}
        <div className="text-center">
          <BeautyFlowLogo className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl mx-auto mb-4 shadow-2xl ring-4 ring-primary-foreground/20" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">
            Beauty<span className="text-white/90">Flow</span>
          </h1>
          <p className="text-sm sm:text-base text-primary-foreground/80 mt-1">{t('login.salonSpace')}</p>
        </div>

        {/* Login card with glassmorphism */}
        <Card className="bg-card/80 backdrop-blur-xl border-primary-foreground/10 shadow-2xl">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <LogIn className="h-5 w-5 text-primary" />
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('login.accessSalon')}</CardDescription>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-accent" /> Owner</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> Staff</span>
              <span>— connectez-vous avec vos identifiants</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="salon@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 sm:h-10 text-base sm:text-sm bg-background/60 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 sm:h-10 text-base sm:text-sm pr-10 bg-background/60 backdrop-blur-sm"
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
              <Button type="submit" className="w-full gradient-primary h-11 sm:h-10 text-base sm:text-sm shadow-lg" disabled={loading}>
                {loading ? t('login.loading') : t('login.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/login')} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1" />
            {t('login.admin')}
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/explorer')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-4"
          >
            <Calendar className="h-4 w-4" />
            Vous êtes cliente ? Réservez sur le portail public
          </button>
        </div>
      </div>
    </div>
  );
}
