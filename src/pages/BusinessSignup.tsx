import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Check, ArrowRight, Store, Calendar, Users, BarChart3,
  MessageCircle, Bell, CreditCard, Shield, Zap, Star, ChevronRight,
  Gift, Smartphone, Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';
import { PLANS, formatPlanPrice, type PlanType } from '@/lib/plans';

const WHATSAPP_NUMBER = '237600000000';

const FEATURES = [
  { icon: Calendar, title: 'Agenda intelligent', desc: 'Calendrier interactif, rappels automatiques, zéro double réservation.' },
  { icon: Users, title: 'Fiches clients & fidélité', desc: 'Historique complet, points de fidélité, parrainage intégré.' },
  { icon: MessageCircle, title: 'WhatsApp intégré', desc: 'Confirmations & rappels en un clic, sans risque de spam.' },
  { icon: BarChart3, title: 'Finances & stock', desc: 'Suivi des ventes, dépenses, marges et alertes produits.' },
  { icon: Bell, title: 'Notifications temps réel', desc: 'Centre d\'alertes pour ne rater aucun rendez-vous.' },
  { icon: Smartphone, title: 'App installable (PWA)', desc: 'Fonctionne hors-ligne, sur mobile comme sur desktop.' },
];

const STEPS = [
  { n: '01', title: 'Choisissez votre formule', desc: 'BASIC, PRO ou PREMIUM — adaptée à la taille de votre salon.' },
  { n: '02', title: 'Activation en 24h', desc: 'Notre équipe vous configure votre espace et forme votre équipe.' },
  { n: '03', title: 'Apparaissez dans BeautyFlow', desc: 'Votre salon est visible par des milliers de clientes en recherche.' },
];

const TESTIMONIALS = [
  { name: 'Sandrine M.', salon: 'Glow Studio, Douala', text: 'Mes rendez-vous ont doublé en 2 mois. La gestion WhatsApp m\'a changé la vie.', stars: 5 },
  { name: 'Aïcha K.', salon: 'Royal Spa, Yaoundé', text: 'Enfin un outil pensé pour nous, en FCFA et bilingue. Mes clientes adorent.', stars: 5 },
  { name: 'Brenda T.', salon: 'Belle Époque, Bafoussam', text: 'Le suivi de fidélité me ramène mes clientes chaque mois. Je recommande.', stars: 5 },
];

export default function BusinessSignup() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [form, setForm] = useState({ name: '', salon: '', city: '', phone: '', notes: '' });

  const buildWhatsappUrl = () => {
    const plan = PLANS[selectedPlan];
    const text =
      `Bonjour BeautyFlow ✨%0A%0A` +
      `Je souhaite référencer mon salon et m'abonner à la formule *${plan.label}* (${formatPlanPrice(plan.price)}).%0A%0A` +
      `👤 Nom: ${form.name || '—'}%0A` +
      `💇 Salon: ${form.salon || '—'}%0A` +
      `📍 Ville: ${form.city || '—'}%0A` +
      `📞 WhatsApp: ${form.phone || '—'}%0A` +
      `📝 Notes: ${form.notes || '—'}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(buildWhatsappUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <BeautyFlowLogo className="h-10 w-10 rounded-2xl shadow-md group-hover:scale-105 transition-transform" />
            <div className="leading-tight">
              <div className="font-bold tracking-tight text-sm sm:text-base">
                Beauty<span className="text-primary">Flow</span>
              </div>
              <div className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">Espace professionnels</div>
            </div>
          </Link>
          <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← Retour à l'explorateur
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 -left-20 w-72 h-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
          <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-accent/30 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" /> SaaS n°1 beauté & bien-être au Cameroun
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Faites grandir votre <span className="text-aurora">salon</span> avec une plateforme{' '}
              <span className="italic font-serif">tout-en-un</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Référencez votre salon sur BeautyFlow, attirez plus de clientes, gérez vos rendez-vous, votre stock et votre fidélité — depuis une seule app, en FCFA.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#pricing">
                <Button size="lg" className="gradient-primary text-primary-foreground shadow-lg hover:shadow-2xl press h-12 px-7 rounded-full text-sm font-semibold">
                  Voir les formules <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </a>
              <a href="#signup">
                <Button size="lg" variant="outline" className="h-12 px-7 rounded-full text-sm font-semibold border-2">
                  Référencer mon salon
                </Button>
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-success" /> Sans engagement</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> Activé en 24h</span>
              <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-primary" /> FR & EN</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto">
            {[
              { v: '+500', l: 'Salons partenaires' },
              { v: '50k+', l: 'Rendez-vous gérés' },
              { v: '4.9★', l: 'Note moyenne' },
              { v: '24h', l: 'Activation' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 text-center hover:border-primary/30 transition-colors">
                <div className="text-2xl sm:text-3xl font-bold text-aurora">{s.v}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Tout ce qu'il vous faut pour <span className="text-primary">prospérer</span></h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Une suite complète pensée pour les salons africains modernes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shadow-md group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/30 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Comment ça marche ?</h2>
            <p className="mt-3 text-muted-foreground">Trois étapes simples pour transformer votre salon.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="relative p-6 rounded-2xl bg-card border border-border/60">
                <div className="text-5xl font-bold text-primary/20">{s.n}</div>
                <h3 className="mt-2 font-semibold text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 h-6 rounded-full bg-accent/15 text-accent text-[11px] font-semibold mb-3">
            <Gift className="h-3 w-3" /> 14 jours d'essai offerts
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Une formule pour <span className="text-primary">chaque salon</span></h2>
          <p className="mt-3 text-muted-foreground">Tarifs transparents en FCFA. Sans frais cachés.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {(Object.keys(PLANS) as PlanType[]).map((key) => {
            const plan = PLANS[key];
            const isPro = key === 'pro';
            const isSelected = selectedPlan === key;
            return (
              <button
                key={key}
                onClick={() => { setSelectedPlan(key); document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`text-left relative p-6 rounded-3xl border-2 transition-all duration-300 ${
                  isPro ? 'border-primary shadow-xl scale-[1.02]' : 'border-border/60 hover:border-primary/50'
                } ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} bg-card hover:-translate-y-1`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 h-6 inline-flex items-center rounded-full gradient-primary text-primary-foreground text-[11px] font-bold shadow-md">
                    ⭐ Le plus populaire
                  </span>
                )}
                <div className="text-xs font-semibold text-muted-foreground tracking-wider">{plan.label}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price.toLocaleString('fr-FR')}</span>
                  <span className="text-sm text-muted-foreground">FCFA/mois</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="mt-5 space-y-2.5 text-sm">
                  <Feat ok>{plan.maxCustomers === -1 ? 'Clientes illimitées' : `Jusqu'à ${plan.maxCustomers} clientes`}</Feat>
                  <Feat ok>{plan.maxStaff === -1 ? 'Équipe illimitée' : `${plan.maxStaff} membres d'équipe`}</Feat>
                  <Feat ok>Agenda + rappels WhatsApp</Feat>
                  <Feat ok={plan.loyaltyRulesEnabled}>Programme fidélité avancé</Feat>
                  <Feat ok={plan.campaignsEnabled}>{plan.campaignsEnabled ? `${plan.maxCampaignsPerMonth === -1 ? '∞' : plan.maxCampaignsPerMonth} campagnes/mois` : 'Campagnes marketing'}</Feat>
                  <Feat ok={plan.exportEnabled}>Exports & rapports détaillés</Feat>
                  <Feat ok={plan.automationEnabled}>Automatisations</Feat>
                  <Feat ok={plan.multiBranchEnabled}>Multi-établissements</Feat>
                  <Feat ok={plan.prioritySupport}>Support prioritaire</Feat>
                </ul>

                <div className={`mt-6 h-11 rounded-full inline-flex items-center justify-center w-full text-sm font-semibold transition-all ${
                  isPro ? 'gradient-primary text-primary-foreground shadow-md' : 'border-2 border-foreground/15 hover:border-primary hover:text-primary'
                }`}>
                  Choisir {plan.label} <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ils nous font <span className="text-primary">confiance</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl border border-border/60 bg-card">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-4 pt-4 border-t border-border/60">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.salon}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP FORM */}
      <section id="signup" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-primary opacity-95" />
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-primary-foreground">
          <div className="text-center mb-8">
            <Store className="h-10 w-10 mx-auto mb-3" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Référencez votre salon</h2>
            <p className="mt-2 text-primary-foreground/85">Formule sélectionnée : <strong>{PLANS[selectedPlan].label}</strong> — {formatPlanPrice(PLANS[selectedPlan].price)}</p>
          </div>

          <form onSubmit={submit} className="bg-card text-card-foreground rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 border border-white/20">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Votre nom</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Marie Ngono" className="mt-1.5 h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nom du salon</label>
                <Input required value={form.salon} onChange={(e) => setForm({ ...form, salon: e.target.value })} placeholder="Glow Beauty Studio" className="mt-1.5 h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Ville</label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Douala" className="mt-1.5 h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">WhatsApp</label>
                <Input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+237 6 XX XX XX XX" className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Message (optionnel)</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Parlez-nous brièvement de votre salon..." className="mt-1.5 min-h-[88px]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PLANS) as PlanType[]).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setSelectedPlan(k)}
                  className={`h-10 rounded-full text-xs font-semibold border-2 transition-all ${
                    selectedPlan === k ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {PLANS[k].label}
                </button>
              ))}
            </div>
            <Button type="submit" size="lg" className="w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl">
              <MessageCircle className="h-4 w-4" /> Envoyer via WhatsApp
            </Button>
            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" /> Vos données restent privées. Aucun paiement en ligne — activation manuelle.
            </p>
          </form>

          <div className="mt-8 text-center text-sm text-primary-foreground/85">
            Une question ? Écrivez-nous directement sur{' '}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>© {new Date().getFullYear()} <strong className="text-gradient">BeautyFlow</strong> — Conçu avec amour au Cameroun</span>
        </div>
      </footer>
    </div>
  );
}

function Feat({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? '' : 'opacity-40 line-through'}`}>
      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${ok ? 'text-success' : 'text-muted-foreground'}`} />
      <span>{children}</span>
    </li>
  );
}