import React from 'react';
import { Sun, Moon, Monitor, Palette, Sparkles, Check, Crown, Star, ShieldCheck, Heart, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface AppearanceSettingsTabProps {
  language: string;
  t: (key: string) => string;
}

export function AppearanceSettingsTab({ language, t }: AppearanceSettingsTabProps) {
  const { theme, setTheme, color, setColor } = useTheme();

  const colorOptions = [
    {
      id: 'rose',
      name: language === 'fr' ? 'Rose Glamour' : 'Glamour Rose',
      desc: language === 'fr' ? 'Féminin, élégant et chaleureux' : 'Feminine, elegant and warm',
      bgClass: 'bg-rose-600',
      gradient: 'from-rose-500 to-rose-700'
    },
    {
      id: 'violet',
      name: language === 'fr' ? 'Violet Céleste' : 'Celestial Violet',
      desc: language === 'fr' ? 'Sophistiqué et moderne' : 'Sophisticated and modern',
      bgClass: 'bg-purple-600',
      gradient: 'from-purple-600 to-indigo-600'
    },
    {
      id: 'gold',
      name: language === 'fr' ? 'Or Champagne' : 'Champagne Gold',
      desc: language === 'fr' ? 'Luxe, haut de gamme et prestige' : 'Luxury, high-end and prestige',
      bgClass: 'bg-amber-500',
      gradient: 'from-amber-500 to-yellow-600'
    },
    {
      id: 'blue',
      name: language === 'fr' ? 'Bleu Royal' : 'Royal Blue',
      desc: language === 'fr' ? 'Serein, professionnel et apaisant' : 'Serene, professional and calming',
      bgClass: 'bg-blue-600',
      gradient: 'from-blue-600 to-indigo-700'
    },
    {
      id: 'green',
      name: language === 'fr' ? 'Vert Émeraude' : 'Emerald Green',
      desc: language === 'fr' ? 'Bio, naturel et bien-être' : 'Organic, natural and wellness',
      bgClass: 'bg-emerald-600',
      gradient: 'from-emerald-600 to-teal-700'
    },
    {
      id: 'orange',
      name: language === 'fr' ? 'Orange Ambré' : 'Warm Amber',
      desc: language === 'fr' ? 'Dynamique, joyeux et accueillant' : 'Dynamic, cheerful and welcoming',
      bgClass: 'bg-orange-500',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      id: 'zinc',
      name: language === 'fr' ? 'Gris Ardoise' : 'Minimalist Slate',
      desc: language === 'fr' ? 'Épuré, sobre et intemporel' : 'Clean, sleek and timeless',
      bgClass: 'bg-slate-900 dark:bg-slate-100',
      gradient: 'from-slate-800 to-slate-950'
    }
  ];

  const activeColorObj = colorOptions.find(c => c.id === color) || colorOptions[0];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* ── 1. MODE D'AFFICHAGE (LIGHT / DARK / SYSTEM) ── */}
      <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold">
                {language === 'fr' ? 'Thème d\'Affichage' : 'Display Theme'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'fr'
                  ? 'Basculez entre le mode clair, le mode sombre ou l\'adaptation automatique à votre système'
                  : 'Switch between light mode, dark mode, or automatic system sync'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode Clair Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                "group relative flex flex-col rounded-2xl border-2 p-4 transition-all duration-300 text-left cursor-pointer overflow-hidden",
                theme === 'light'
                  ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/20 scale-[1.02]"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {/* Mini App UI Mockup (Light) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 mb-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-2 w-12 rounded-full bg-slate-200" />
                </div>
                <div className="flex gap-2">
                  <div className="h-14 w-1/3 rounded-lg bg-slate-200" />
                  <div className="h-14 w-2/3 rounded-lg bg-white p-2 border border-slate-200 space-y-1">
                    <div className="h-2 w-3/4 rounded bg-slate-300" />
                    <div className="h-2 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-foreground">
                      {language === 'fr' ? 'Mode Clair' : 'Light Mode'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'fr' ? 'Fond lumineux et épuré' : 'Bright and clean background'}
                    </p>
                  </div>
                </div>
                {theme === 'light' && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] rounded-lg">
                    <Check className="h-3 w-3 mr-1" />
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </Badge>
                )}
              </div>
            </button>

            {/* Mode Sombre Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                "group relative flex flex-col rounded-2xl border-2 p-4 transition-all duration-300 text-left cursor-pointer overflow-hidden",
                theme === 'dark'
                  ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/20 scale-[1.02]"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {/* Mini App UI Mockup (Dark) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 mb-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-2 w-12 rounded-full bg-slate-800" />
                </div>
                <div className="flex gap-2">
                  <div className="h-14 w-1/3 rounded-lg bg-slate-800" />
                  <div className="h-14 w-2/3 rounded-lg bg-slate-900 p-2 border border-slate-800 space-y-1">
                    <div className="h-2 w-3/4 rounded bg-slate-700" />
                    <div className="h-2 w-1/2 rounded bg-slate-800" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-foreground">
                      {language === 'fr' ? 'Mode Sombre' : 'Dark Mode'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'fr' ? 'Reposant pour les yeux' : 'Easy on the eyes'}
                    </p>
                  </div>
                </div>
                {theme === 'dark' && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] rounded-lg">
                    <Check className="h-3 w-3 mr-1" />
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </Badge>
                )}
              </div>
            </button>

            {/* Mode Système Card */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                "group relative flex flex-col rounded-2xl border-2 p-4 transition-all duration-300 text-left cursor-pointer overflow-hidden",
                theme === 'system'
                  ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/20 scale-[1.02]"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {/* Mini App UI Mockup (Split System) */}
              <div className="rounded-xl border border-slate-400/40 bg-gradient-to-r from-slate-100 to-slate-900 p-3 space-y-2 mb-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-400/40 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="h-2 w-12 rounded-full bg-slate-400/50" />
                </div>
                <div className="flex gap-2">
                  <div className="h-14 w-1/3 rounded-lg bg-slate-300 dark:bg-slate-800" />
                  <div className="h-14 w-2/3 rounded-lg bg-white/80 dark:bg-slate-900 p-2 border border-slate-300 dark:border-slate-800 space-y-1">
                    <div className="h-2 w-3/4 rounded bg-slate-400 dark:bg-slate-700" />
                    <div className="h-2 w-1/2 rounded bg-slate-300 dark:bg-slate-800" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-foreground">
                      {language === 'fr' ? 'Automatique' : 'System Auto'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'fr' ? 'S\'adapte selon votre appareil' : 'Matches device settings'}
                    </p>
                  </div>
                </div>
                {theme === 'system' && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] rounded-lg">
                    <Check className="h-3 w-3 mr-1" />
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </Badge>
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. SELECTION DE LA PALETTE DE COULEUR PRINCIPALE ── */}
      <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold">
                {language === 'fr' ? 'Couleur d\'Accentuation Principale' : 'Primary Accent Color'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'fr'
                  ? 'Choisissez l\'ambiance colorée qui reflète la personnalité de votre établissement'
                  : 'Select the color palette matching your salon brand personality'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {colorOptions.map((c) => {
              const isSelected = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id as any)}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md ring-4 ring-primary/20 scale-[1.05]"
                      : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-2",
                      c.bgClass,
                      isSelected ? "border-white ring-4 ring-primary/30 scale-105" : "border-transparent"
                    )}
                  >
                    {isSelected && <Check className="h-5 w-5 text-white stroke-[3]" />}
                  </div>

                  <div>
                    <p className={cn("text-xs font-extrabold transition-colors", isSelected ? "text-primary" : "text-foreground")}>
                      {c.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Color Info Box */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-4 w-4 rounded-full shadow-sm shrink-0", activeColorObj.bgClass)} />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {language === 'fr' ? 'Nuance sélectionnée :' : 'Selected accent:'}{' '}
                  <span className="text-primary">{activeColorObj.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activeColorObj.desc}</p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
              theme-{activeColorObj.id}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. SIMULATEUR D'INTERFACE EN DIRECT (LIVE PREVIEW) ── */}
      <Card className="card-shadow rounded-3xl border-border/60 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-primary">
                {language === 'fr' ? 'Simulateur d\'Interface en Direct' : 'Live Interface Simulator'}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {language === 'fr' ? 'Temps Réel' : 'Real-time'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Simulated App Card */}
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-6">
            {/* Header section in mockup */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-md">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">Aperçu du Salon BeautyFlow</h4>
                  <p className="text-xs text-muted-foreground">Exemple de carte de rendez-vous en direct</p>
                </div>
              </div>
              <Badge className="gradient-primary text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                ⭐ VIP PASS
              </Badge>
            </div>

            {/* Appointment Card preview */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  MN
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Marie Nguema</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    Soin du Visage & Coiffure • 14:30
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-extrabold text-sm text-primary">25 000 FCFA</span>
                <Button className="gradient-primary rounded-xl font-bold text-xs h-9 px-4 shadow-sm">
                  {language === 'fr' ? 'Valider RDV' : 'Confirm Appt'}
                </Button>
              </div>
            </div>

            {/* Component Showcase buttons & elements */}
            <div className="pt-2 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'fr' ? 'Composants de l\'Application :' : 'App Components:'}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Button className="gradient-primary rounded-2xl font-bold text-xs shadow-md">
                  Bouton Action Gradient
                </Button>
                <Button variant="outline" className="rounded-2xl font-semibold text-xs border-primary/40 text-primary hover:bg-primary/5">
                  Bouton Contour Primary
                </Button>
                <Badge variant="outline" className="rounded-xl px-3 py-1 border-primary/40 text-primary font-bold text-xs">
                  Badge Accentué
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
