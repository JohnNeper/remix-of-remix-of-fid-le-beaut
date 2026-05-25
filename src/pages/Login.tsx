import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, Shield, Eye, EyeOff, Crown, User, Calendar, ArrowRight } from 'lucide-react';
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
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-2xl ring-4 ring-primary-foreground/20">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">LeaderBright</h1>
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

        {/* Customer entry — direct booking */}
        <Card className="bg-card/70 backdrop-blur-xl border-primary-foreground/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Vous êtes cliente ? Réservez en ligne
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const slug = String(data.get('slug') || '').trim().toLowerCase();
                if (slug) navigate(`/booking/${slug}`);
              }}
              className="flex gap-2"
            >
              <div className="flex-1 flex items-center gap-1 rounded-lg border bg-background/60 px-3 h-10 text-sm">
                <span className="text-muted-foreground text-xs">/booking/</span>
                <input
                  name="slug"
                  defaultValue="demo"
                  placeholder="nom-du-salon"
                  className="flex-1 bg-transparent outline-none font-mono text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="gradient-primary">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground">
              Essai démo : <button type="button" onClick={() => navigate('/booking/demo')} className="text-primary underline underline-offset-2">/booking/demo</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
