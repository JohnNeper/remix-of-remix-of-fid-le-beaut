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
  Calendar,
  ExternalLink
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

import { LoginAdsCarousel } from '@/components/auth/LoginAdsCarousel';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        const reasonText = result.reason || t('login.expiredDefaultText');
        setExpiredNotice({ reason: reasonText, email });
        toast({
          title: `⚠️ ${t('login.subscriptionExpired')}`,
          description: reasonText,
          variant: 'destructive',
        });
      } else {
        setExpiredNotice(null);
        toast({
          title: t('login.error'),
          description: result.reason || t('login.invalidCredentials'),
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: t('login.error'),
        description: err?.message || t('login.serverError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    toast({
      title: t('login.googleToastTitle'),
      description: t('login.googleToastDesc'),
    });
    setTimeout(() => {
      loginGoogle();
    }, 300);
  };

  return (
    <div className="relative min-h-[100dvh] lg:h-screen lg:max-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-rose-500 selection:text-white">

      {/* Decorative Ambient Background Lighting Blobs */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-rose-500/15 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-pink-500/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* DESKTOP SHOWCASE PANEL (Photo Ads Carousel) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex relative lg:w-[48%] xl:w-[50%] h-screen min-h-screen flex-col overflow-hidden border-r border-slate-200/80 dark:border-slate-800/80 shadow-2xl shrink-0">
        <LoginAdsCarousel />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & DESKTOP LOGIN FORM PANEL */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between px-4 sm:px-8 lg:px-10 xl:px-12 pt-safe-offset-2 lg:pt-5 pb-safe lg:pb-4 min-h-[100dvh] lg:min-h-0 lg:h-screen relative z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md overflow-y-auto lg:overflow-y-auto">

        {/* Top Floating Controls Bar */}
        <div className="flex items-center justify-between w-full mb-2 sm:mb-4 lg:mb-2 shrink-0">
          {/* Subtle Portal Link */}
          <a
            href="https://beautyflowafrica.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors py-1 px-3 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-xs active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>beautyflowafrica.com</span>
            <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
          </a>

          {/* Theme & Language Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs shrink-0">
            <ThemeToggle compact />
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <LanguageToggle />
          </div>
        </div>

        {/* Center Hero & Form Container */}
        <div className="my-auto w-full max-w-sm sm:max-w-md mx-auto space-y-3.5 sm:space-y-4 lg:space-y-3.5 py-1 sm:py-2">

          {/* Centered Brand Hero Showcase */}
          <div className="text-center space-y-1.5 sm:space-y-2">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-pink-500/20 to-amber-500/20 blur-md animate-pulse pointer-events-none" />
                <div className="relative p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center transition-transform hover:scale-105 duration-300">
                  <BeautyFlowLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
                </div>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Beauty<span className="text-rose-500">Flow</span>
                </h1>
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 shadow-xs">
                  {t('login.businessBadge') || 'BUSINESS'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-tight">
                {t('login.accessSalon')}
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-900/5 dark:shadow-black/40 rounded-3xl overflow-hidden transition-all duration-300">
            <CardContent className="p-4 sm:p-5 lg:p-5.5 space-y-3.5 sm:space-y-4">

              {/* SUBSCRIPTION EXPIRED ALERT BANNER */}
              {expiredNotice && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-slate-900 dark:text-rose-100 space-y-2.5 shadow-inner">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400">
                        {t('login.subscriptionExpired')}
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-tight font-medium text-[11px]">
                        {expiredNotice.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
                    <Button
                      type="button"
                      onClick={() => navigate(`/subscription-expired?email=${encodeURIComponent(expiredNotice.email)}`, { state: { email: expiredNotice.email } })}
                      className="w-full sm:flex-1 h-8.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{t('login.renew')}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = encodeURIComponent(`Bonjour l'équipe BeautyFlow, je souhaite renouveler l'abonnement de mon salon (${expiredNotice.email}).`);
                        window.open(`https://wa.me/237658315610?text=${text}`, '_blank');
                      }}
                      className="w-full sm:w-auto h-8.5 text-xs font-bold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{t('login.whatsapp')}</span>
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
                className="w-full h-10.5 sm:h-11 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-200 shadow-xs flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>{t('login.googleSubmit')}</span>
              </Button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-0.5 sm:my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                </div>
                <div className="relative px-2.5 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t('login.orEmail')}
                </div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">

                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('login.email')}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none">
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
                      className="h-10 sm:h-10.5 pl-9 text-sm bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('login.password')}
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast({ title: t('login.forgotPassword'), description: t('login.forgotPasswordDesc') })}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline transition-colors py-0.5"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none">
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
                      className="h-10 sm:h-10.5 pl-9 pr-10 text-sm bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-xl"
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
                  className="w-full h-10.5 sm:h-11 text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 rounded-2xl transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            </CardContent>
          </Card>

          {/* Client Booking Portal Link Redirecting to https://beautyflowafrica.com */}
          <div>
            <a
              href="https://beautyflowafrica.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-rose-500/15 dark:border-rose-500/20 transition-all duration-200 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                    {t('login.clientPlatformTitle')}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {t('login.clientPlatformDesc')}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all shrink-0 ml-1.5" />
            </a>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-1 pb-safe-offset-2 lg:pb-0 shrink-0">
          <p>© {new Date().getFullYear()} BeautyFlow Business. {t('login.allRightsReserved')}</p>
        </div>

      </div>

    </div>
  );
}


