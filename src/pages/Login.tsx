import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  MessageCircle,
  CheckCircle2,
  Calendar
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
  const [showDemo, setShowDemo] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState<{ reason: string; email: string } | null>(null);

  const { session, loginSalon, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Redirect authenticated user if already logged in
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
    if (!email || !password) return;
    setLoading(true);

    try {
      const result = await loginSalon(email, password);
      if (result.success) {
        setExpiredNotice(null);
        toast({
          title: t('login.success'),
          description: t('login.welcomeBack')
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
          title: t('login.error'),
          description: result.reason || 'Identifiants incorrects',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: t('login.error'),
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
    if (role === 'owner') {
      setEmail('salon@beautyflow.com');
      setPassword('password123');
    } else {
      setEmail('staff@beautyflow.com');
      setPassword('password123');
    }
    toast({
      title: t('login.demoMode'),
      description: `Identifiants appliqués : ${role === 'owner' ? t('login.roleOwner') : t('login.roleStaff')}`,
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-rose-500 selection:text-white">

      {/* ========================================================================= */}
      {/* DESKTOP SHOWCASE PANEL (Hidden on Mobile for fast & direct login UX) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex relative lg:w-[48%] xl:w-[50%] min-h-screen flex-col justify-between p-10 lg:p-14 overflow-hidden border-r border-slate-200/80 dark:border-slate-800/80">

        {/* High-End Background with Monochromatic Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        <div className="absolute inset-0 bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-[3px]" />

        {/* Ambient Warm Rose Glow */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full justify-between space-y-8">

          {/* Top Brand Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border border-white/15 dark:border-slate-800 px-4 py-2 rounded-full shadow-lg">
              <BeautyFlowLogo className="h-8 w-8" />
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Beauty<span className="text-rose-400">Flow</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  Business
                </span>
              </div>
            </div>
          </div>

          {/* Center Value Proposition */}
          <div className="my-auto py-6 space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>{t('login.badgeSaas')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
              {t('login.heroTitle')}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              {t('login.heroDesc')}
            </p>

            {/* Minimalist Glass Features List */}
            <div className="p-4 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 dark:border-slate-800/80 backdrop-blur-md space-y-3">
              <p className="text-xs font-semibold text-white/90 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-rose-400" />
                <span>{t('login.whyTrustUs')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{t('login.feature1Title')} & {t('login.feature1Desc')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{t('login.feature2Title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{t('login.feature3Title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{t('login.feature4Title')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 text-xs text-slate-400">
            <span>{t('login.socialProof')}</span>
            <span className="font-semibold text-rose-400">{t('login.satisfaction')}</span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & DESKTOP LOGIN FORM PANEL */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-14 relative z-10 bg-slate-50 dark:bg-slate-950">

        {/* Top Header Controls */}
        <div className="flex items-center justify-between w-full mb-6 pt-1">
          {/* Logo Brand Pill for Mobile & Desktop */}
          <div className="flex items-center gap-2.5">
            <BeautyFlowLogo className="h-9 w-9 shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                Beauty<span className="text-rose-500">Flow</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/90 dark:text-rose-400">
                Business
              </span>
            </div>
          </div>

          {/* Theme & Language Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        {/* Center Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-5 py-2">

          {/* Form Title & Subtitle */}
          <div className="space-y-1 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('login.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t('login.accessSalon')}
            </p>
          </div>

          {/* Login Card */}
          <Card className="bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-5 sm:p-8 space-y-5">

              {/* SUBSCRIPTION EXPIRED ALERT BANNER */}
              {expiredNotice && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-slate-900 dark:text-rose-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        Abonnement Expiré
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
                      className="w-full sm:flex-1 h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Renouveler</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = encodeURIComponent(`Bonjour l'équipe BeautyFlow, je souhaite renouveler l'abonnement de mon salon (${expiredNotice.email}).`);
                        window.open(`https://wa.me/237658315610?text=${text}`, '_blank');
                      }}
                      className="w-full sm:w-auto h-10 text-xs font-bold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
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
                className="w-full h-12 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>{t('login.googleSubmit')}</span>
              </Button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t('login.orEmail')}
                </div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('login.email')}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="salon@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10 text-base sm:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('login.password')}
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast({ title: t('login.forgotPassword'), description: 'Veuillez contacter le gérant de votre salon.' })}
                      className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline transition-colors py-0.5"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10 pr-11 text-base sm:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 rounded-xl"
                      aria-label={showPassword ? t('login.hide') : 'Show'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 rounded-2xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('login.loading')}</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>{t('login.submit')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Discrete Quick Fill Accordion / Toggle for Testing / Demo */}
              <div className="pt-1">
                {!showDemo ? (
                  <button
                    type="button"
                    onClick={() => setShowDemo(true)}
                    className="w-full text-center text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center justify-center gap-1 py-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                    <span>{t('login.quickDemoFill')}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                        {t('login.quickDemoFill')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDemo(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                      >
                        {t('login.hide')}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('owner')}
                        className="flex-1 py-2 px-2 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                      >
                        <span>{t('login.roleOwner')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('staff')}
                        className="flex-1 py-2 px-2 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                      >
                        <span>{t('login.roleStaff')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Client Booking Portal Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/explorer')}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors py-2 px-3 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-900/60 border border-transparent hover:border-slate-300 dark:hover:border-slate-800 w-full sm:w-auto"
            >
              <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{t('login.clientLink')}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-4 pb-2">
          <p>© {new Date().getFullYear()} BeautyFlow Business. {t('login.allRightsReserved')}</p>
        </div>

      </div>

    </div>
  );
}
