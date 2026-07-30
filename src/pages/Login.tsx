import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  Crown,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Scissors,
  Mail,
  Lock,
  ArrowRight,
  Star,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import loginBg from '@/assets/login-bg.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff'>('owner');
  const [expiredNotice, setExpiredNotice] = useState<{ reason: string; email: string } | null>(null);

  const { session, loginSalon, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Redirect authenticated user if already logged in (prevents back button showing login screen)
  React.useEffect(() => {
    if (session) {
      if (session.type === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connect to REST API backend (http://localhost:3000/api/auth/login via api.ts)
      const result = await loginSalon(email, password);
      if (result.success) {
        setExpiredNotice(null);
        toast({
          title: t('login.success') || 'Connexion réussie',
          description: t('login.welcomeBack') || 'Bienvenue dans votre espace salon !'
        });
        navigate('/');
      } else if (
        result.isSubscriptionExpired ||
        result.reason?.toLowerCase().includes('expiré') ||
        result.reason?.toLowerCase().includes('abonnement')
      ) {
        const reasonText = result.reason || 'Votre abonnement a expiré. Veuillez le renouveler pour réactiver votre salon.';
        setExpiredNotice({ reason: reasonText, email });
        toast({
          title: '⚠️ Abonnement Expiré',
          description: reasonText,
          variant: 'destructive',
        });
      } else {
        setExpiredNotice(null);
        toast({
          title: t('login.error') || 'Erreur de connexion',
          description: result.reason || 'Identifiants incorrects',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: t('login.error') || 'Erreur de connexion',
        description: err?.message || 'Impossible de se connecter au serveur backend.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    toast({
      title: 'Google Sign-In',
      description: 'Redirection vers la connexion sécurisée Google...',
    });
    setTimeout(() => {
      loginGoogle();
    }, 300);
  };

  const handleQuickDemoFill = (role: 'owner' | 'staff') => {
    setSelectedRole(role);
    if (role === 'owner') {
      setEmail('salon@beautyflow.com');
      setPassword('password123');
    } else {
      setEmail('staff@beautyflow.com');
      setPassword('password123');
    }
    toast({
      title: t('login.demoMode') || 'Mode Démo',
      description: `Identifiants appliqués : ${role === 'owner' ? t('login.roleOwner') : t('login.roleStaff')}`,
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-rose-500 selection:text-white">

      {/* ========================================================================= */}
      {/* LEFT SHOWCASE PANEL (Desktop Luxury Hero Banner) */}
      {/* ========================================================================= */}
      <div className="relative lg:w-[52%] xl:w-[55%] min-h-[380px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/80">

        {/* Background Image with Glass Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-950/80 to-rose-950/70 dark:from-slate-950 dark:via-slate-950/95 dark:to-rose-950/80 backdrop-blur-[3px]" />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full justify-between space-y-8">

          {/* Top Brand Pill & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/15 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-800 px-4 py-2 rounded-full shadow-lg">
              {/* Circular Logo filling circle cleanly */}
              <BeautyFlowLogo className="h-9 w-9" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wide text-white">Beauty<span className="text-rose-400 font-extrabold">Flow</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/30">
                  Business
                </span>
              </div>
            </div>

            {/* Language & Easy Theme Switcher Controls (Mobile Header) */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="my-auto py-6 space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin-slow" />
              <span>{t('login.badgeSaas') || "La référence SaaS des Salons & Spas"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              {t('login.heroTitle') || "Pilotez votre Salon avec Élégance & Sérénité"}
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light drop-shadow-sm">
              {t('login.heroDesc') || "La solution tout-en-un pensée pour les salons de beauté, coiffure, esthétique et spas d'exception."}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/15 dark:border-slate-800 backdrop-blur-md hover:bg-white/15 transition-colors">
                <div className="p-2 rounded-xl bg-rose-500/25 text-rose-300 shrink-0 shadow-sm">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t('login.feature1Title') || "Réservations 24/7"}</h4>
                  <p className="text-[11px] text-slate-300">{t('login.feature1Desc') || "Rappels SMS automatiques & zéro impayé"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/15 dark:border-slate-800 backdrop-blur-md hover:bg-white/15 transition-colors">
                <div className="p-2 rounded-xl bg-amber-500/25 text-amber-300 shrink-0 shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t('login.feature2Title') || "Caisse & Analytics"}</h4>
                  <p className="text-[11px] text-slate-300">{t('login.feature2Desc') || "Suivi du chiffre d'affaires en direct"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/15 dark:border-slate-800 backdrop-blur-md hover:bg-white/15 transition-colors">
                <div className="p-2 rounded-xl bg-pink-500/25 text-pink-300 shrink-0 shadow-sm">
                  <Scissors className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t('login.feature3Title') || "Gestion d'Équipe"}</h4>
                  <p className="text-[11px] text-slate-300">{t('login.feature3Desc') || "Planning & calcul rapide des commissions"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/15 dark:border-slate-800 backdrop-blur-md hover:bg-white/15 transition-colors">
                <div className="p-2 rounded-xl bg-emerald-500/25 text-emerald-300 shrink-0 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t('login.feature4Title') || "Données Sécurisées"}</h4>
                  <p className="text-[11px] text-slate-300">{t('login.feature4Desc') || "Chiffrement haute sécurité & sauvegardes"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof & Trust Footer */}
          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-rose-400 ring-2 ring-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">SB</div>
                <div className="w-6 h-6 rounded-full bg-amber-400 ring-2 ring-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">LF</div>
                <div className="w-6 h-6 rounded-full bg-purple-400 ring-2 ring-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">VD</div>
              </div>
              <span>{t('login.socialProof') || "Rejoint par +500 salons partenaires"}</span>
            </div>

            <div className="flex items-center gap-1 text-amber-300 font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{t('login.satisfaction') || "4.9 / 5 satisfaction pro"}</span>
            </div>
          </div>

        </div>
      </div>


      {/* ========================================================================= */}
      {/* RIGHT LOGIN FORM PANEL (Responsive, Light & Dark mode adaptive) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-slate-50 dark:bg-slate-950">

        {/* Top Header Controls (Desktop Header with Easy Theme Switcher) */}
        <div className="hidden lg:flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            <span>{t('login.portalSecured') || "Portail Sécurisé Professionnels"}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        {/* Center Login Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 py-4">

          {/* Brand & Circular Logo Header */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <BeautyFlowLogo className="h-11 w-11" />
              <div className="text-left">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Beauty<span className="text-rose-500">Flow</span></span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Business Space</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('login.title') || "Connexion Espace Salon"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t('login.accessSalon') || "Accédez à la gestion de votre salon"}
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div className="p-1 bg-slate-200/80 dark:bg-slate-900/90 rounded-2xl border border-slate-300/80 dark:border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${selectedRole === 'owner'
                  ? 'bg-rose-600 dark:bg-gradient-to-r dark:from-rose-600 dark:to-pink-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
                }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span>{t('login.roleOwner') || "Gérant / Owner"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${selectedRole === 'staff'
                  ? 'bg-rose-600 dark:bg-gradient-to-r dark:from-rose-600 dark:to-pink-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
                }`}
            >
              <User className="h-3.5 w-3.5 text-rose-300" />
              <span>{t('login.roleStaff') || "Équipe / Staff"}</span>
            </button>
          </div>

          {/* Login Card */}
          <Card className="bg-white dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-5">

              {/* SUBSCRIPTION EXPIRED ALERT BANNER */}
              {expiredNotice && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-3 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                        <span>Abonnement Expiré</span>
                        <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">Support Pro</span>
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {expiredNotice.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => navigate(`/subscription-expired?email=${encodeURIComponent(expiredNotice.email)}`, { state: { email: expiredNotice.email } })}
                      className="w-full sm:flex-1 h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Renouveler par Mobile Money</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = encodeURIComponent(`Bonjour l'équipe BeautyFlow, je souhaite renouveler l'abonnement de mon salon (${expiredNotice.email}).`);
                        window.open(`https://wa.me/237658315610?text=${text}`, '_blank');
                      }}
                      className="w-full sm:w-auto h-9 text-xs font-bold border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>WhatsApp BeautyFlow</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* GOOGLE SIGN-IN BUTTON */}
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
                className="w-full h-11 border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3"
              >
                {/* Official Google 4-Color SVG Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>{t('login.googleSubmit') || 'Continuer avec Google'}</span>
              </Button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t('login.orEmail') || 'ou se connecter avec email'}
                </div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('login.email') || 'Adresse Email Pro'}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="salon@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-11 pl-10 text-sm bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('login.password') || 'Mot de passe'}
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast({ title: t('login.forgotPassword') || 'Récupération de mot de passe', description: 'Veuillez contacter le gérant de votre salon.' })}
                      className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline transition-colors"
                    >
                      {t('login.forgotPassword') || 'Oublié ?'}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="h-11 pl-10 pr-10 text-sm bg-slate-50 dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1"
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-bold bg-rose-600 hover:bg-rose-700 dark:bg-gradient-to-r dark:from-rose-600 dark:via-pink-600 dark:to-amber-500 text-white shadow-lg shadow-rose-500/20 rounded-xl transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('login.loading') || 'Connexion en cours...'}</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>{t('login.submit') || 'Se connecter'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Helper Quick Fill */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {t('login.demoMode') || 'Mode Démo rapide :'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('owner')}
                    className="flex-1 py-2 px-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span>{t('login.demoOwner') || 'Démo Gérant'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('staff')}
                    className="flex-1 py-2 px-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700/60 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <User className="h-3 w-3 text-rose-500" />
                    <span>{t('login.demoStaff') || 'Démo Équipe'}</span>
                  </button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Client Booking Portal Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/explorer')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors py-1.5 px-3 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-900/60 border border-transparent hover:border-slate-300 dark:hover:border-slate-800"
            >
              <Calendar className="h-3.5 w-3.5 text-rose-500" />
              <span>{t('login.clientLink') || 'Vous êtes cliente ? Réservez un soin sur le portail public'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-[11px] text-slate-500 dark:text-slate-500 pt-6">
          <p>© {new Date().getFullYear()} BeautyFlow Business. All rights reserved.</p>
        </div>

      </div>

    </div>
  );
}
