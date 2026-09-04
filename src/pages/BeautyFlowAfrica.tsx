import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, Users, Globe2, Building2, Target, Rocket,
  BarChart3, ShieldCheck, Smartphone, Wallet, MapPin, Mail, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeautyFlowLogo } from '@/components/branding/BeautyFlowLogo';
import heroImg from '@/assets/hero-salon.jpg';
import celebrationImg from '@/assets/celebration.jpg';

const CONTACT_WHATSAPP = '237600000000';

const KPIS = [
  { value: '12 Mds $', label: 'Marché beauté & bien-être en Afrique subsaharienne', sub: 'Croissance annuelle estimée à 9%' },
  { value: '85%', label: 'Des salons gérés encore au cahier papier', sub: 'Aucun outil digital structurant' },
  { value: '3 min', label: 'Temps moyen pour réserver sur BeautyFlow', sub: 'Contre 2 allers-retours WhatsApp' },
  { value: '5 000 FCFA', label: 'Ticket d\'entrée mensuel SaaS', sub: 'Accessible dès le petit salon' },
];

const PROBLEMS = [
  { title: 'Réservations perdues', desc: 'Les salons perdent 30% de leurs demandes faute de canal structuré : appels manqués, messages non lus, doubles réservations.' },
  { title: 'Aucune donnée client', desc: 'Pas d\'historique, pas de fidélisation, pas de rappel. Le client revient par hasard, pas par système.' },
  { title: 'Trésorerie opaque', desc: 'Ventes, dépenses et stock sont suivis de tête. Impossible de savoir ce qui rapporte réellement.' },
];

const SOLUTION = [
  { icon: Smartphone, title: 'Marketplace grand public', desc: 'Un portail de découverte et de réservation instantanée, mobile-first, pensé pour les usages africains.' },
  { icon: Building2, title: 'SaaS de gestion multi-tenant', desc: 'Agenda, CRM, fidélité, stock, finances et facturation — chaque salon dans son espace isolé.' },
  { icon: Globe2, title: 'Page de réservation white-label', desc: 'Chaque salon dispose de son lien et de sa marque, tout en alimentant le réseau BeautyFlow.' },
  { icon: Wallet, title: 'Paiements & abonnements locaux', desc: 'Tarification en FCFA, encaissements mobile money, facturation adaptée au marché.' },
];

const REVENUE = [
  { name: 'Abonnements SaaS', share: '65%', desc: 'BASIC 5 000 · PRO 20 000 · PREMIUM 30 000 FCFA / mois' },
  { name: 'Commissions marketplace', share: '20%', desc: 'Sur les réservations générées par le portail public' },
  { name: 'Services à valeur ajoutée', share: '15%', desc: 'Campagnes marketing, mise en avant, formation, matériel' },
];

const TRACTION = [
  { period: 'Phase 1 — Cameroun', points: ['Douala & Yaoundé', 'Acquisition salons pilotes', 'Product-market fit local'] },
  { period: 'Phase 2 — CEMAC', points: ['Gabon, Congo, Côte d\'Ivoire', 'Paiement mobile money intégré', 'Réseau d\'ambassadeurs'] },
  { period: 'Phase 3 — Afrique francophone', points: ['Sénégal, Bénin, Togo', 'Marketplace à l\'échelle', 'Offre entreprise multi-sites'] },
];

const MOAT = [
  'Produit déjà en production, utilisé en conditions réelles',
  'Architecture multi-tenant isolée et prête à l\'échelle',
  'PWA installable : aucun store, faible consommation data',
  'Bilingue FR / EN, tarification FCFA native',
  'Flux WhatsApp maîtrisé, conforme aux usages locaux',
  'Effet réseau : chaque salon amène ses clientes sur le portail',
];

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur p-5 sm:p-6 card-shadow hover:-translate-y-1 transition-transform">
      <div className="text-2xl sm:text-3xl font-bold text-gradient">{value}</div>
      <div className="mt-2 text-sm font-semibold leading-snug">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

export default function BeautyFlowAfrica() {
  const [email, setEmail] = useState('');

  const deckUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
    'Bonjour BeautyFlow Africa, je suis investisseur et souhaite recevoir le deck complet.'
  )}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BeautyFlowLogo className="h-9 w-9 rounded-2xl shadow-md" />
            <div className="leading-tight">
              <div className="font-bold tracking-tight text-sm sm:text-base">
                Beauty<span className="text-primary">Flow</span> Africa
              </div>
              <div className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">
                Investor overview
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#contact" className="hidden sm:inline-flex text-xs font-semibold px-3.5 h-9 items-center rounded-full border border-foreground/15 hover:border-primary/50 hover:text-primary transition-all press">
              Nous contacter
            </a>
            <a href={deckUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="rounded-full gap-1.5 press">
                Recevoir le deck <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img src={heroImg} alt="" aria-hidden className="h-full w-full object-cover opacity-20 animate-ken-burns" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </div>
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob -z-10" />
          <div className="absolute top-10 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob -z-10" />

          <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-24 sm:pb-24">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-primary">
              <Rocket className="h-3.5 w-3.5" /> Levée d'amorçage — Afrique francophone
            </div>
            <h1 className="animate-rise mt-5 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] max-w-4xl">
              Le système d'exploitation de la{' '}
              <span className="text-aurora">beauté en Afrique</span>
            </h1>
            <p className="animate-rise mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              BeautyFlow digitalise les salons de beauté et de bien-être africains — gestion complète d'un
              côté, marketplace de réservation grand public de l'autre. Un marché de plusieurs milliards,
              encore quasi entièrement hors ligne.
            </p>
            <div className="animate-rise mt-8 flex flex-wrap gap-3">
              <a href={deckUrl} target="_blank" rel="noreferrer">
                <Button size="lg" className="rounded-full h-12 px-6 gap-2 glow-primary press">
                  Recevoir le deck investisseur <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/">
                <Button size="lg" variant="outline" className="rounded-full h-12 px-6 gap-2 press">
                  Voir le produit en direct
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {KPIS.map((k) => (
                <Stat key={k.label} {...k} />
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-16 sm:py-24 border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Le problème</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Un secteur immense, piloté à l'aveugle
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Des centaines de milliers de salons, barbiers et spas génèrent des revenus quotidiens
                significatifs sans aucun outil de pilotage ni canal d'acquisition digital.
              </p>
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {PROBLEMS.map((p, i) => (
                <div key={p.title} className="rounded-3xl border border-border/60 bg-card p-6 card-shadow">
                  <div className="h-9 w-9 rounded-2xl gradient-primary text-primary-foreground grid place-items-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="py-16 sm:py-24 gradient-soft">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">La solution</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Une plateforme, deux faces qui se renforcent
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Le SaaS retient les salons. La marketplace attire les clientes. Chaque nouveau salon
                enrichit le portail, chaque cliente renforce la valeur du SaaS.
              </p>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {SOLUTION.map((s) => (
                <div key={s.title} className="group rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-6 card-shadow hover:-translate-y-1 transition-all">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:scale-110 transition-transform">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business model */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Modèle économique</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Revenus récurrents, marge logicielle
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Un abonnement mensuel accessible dès 5 000 FCFA, complété par des revenus transactionnels
                et des services à forte valeur ajoutée.
              </p>
              <div className="mt-8 space-y-3">
                {REVENUE.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-border/60 bg-card p-4 flex items-start gap-4">
                    <div className="shrink-0 h-10 w-14 rounded-xl gradient-primary text-primary-foreground grid place-items-center text-sm font-bold">
                      {r.share}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-2xl -z-10" />
              <img
                src={celebrationImg}
                alt="Équipe d'un salon partenaire BeautyFlow"
                loading="lazy"
                className="rounded-[2rem] w-full h-72 sm:h-96 object-cover card-shadow"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl glass border border-border/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Objectif : 1 000 salons abonnés sur 24 mois
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-16 sm:py-24 border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Feuille de route</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Une expansion par cercles concentriques
              </h2>
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {TRACTION.map((t, i) => (
                <div key={t.period} className="rounded-3xl border border-border/60 bg-card p-6 card-shadow">
                  <div className="flex items-center gap-2 text-primary text-xs font-bold">
                    <MapPin className="h-3.5 w-3.5" /> ÉTAPE {i + 1}
                  </div>
                  <h3 className="mt-3 font-semibold">{t.period}</h3>
                  <ul className="mt-4 space-y-2">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Moat */}
        <section className="py-16 sm:py-24 gradient-soft">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Avantage compétitif</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Pourquoi BeautyFlow gagne ici
              </h2>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOAT.map((m) => (
                <div key={m} className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-4 flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use of funds */}
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-primary">Utilisation des fonds</div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">Où va l'investissement</h2>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, t: 'Équipe terrain', v: '40%', d: 'Commerciaux et onboarding salon par salon' },
                { icon: BarChart3, t: 'Produit & tech', v: '30%', d: 'Backend, paiements, scalabilité' },
                { icon: Target, t: 'Acquisition clientes', v: '20%', d: 'Marketing digital et ambassadrices' },
                { icon: Building2, t: 'Opérations', v: '10%', d: 'Support, conformité, structure' },
              ].map((f) => (
                <div key={f.t} className="rounded-3xl border border-border/60 bg-card p-6 card-shadow">
                  <f.icon className="h-5 w-5 text-primary" />
                  <div className="mt-4 text-2xl font-bold text-gradient">{f.v}</div>
                  <div className="mt-1 font-semibold text-sm">{f.t}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="relative overflow-hidden rounded-[2rem] gradient-primary text-primary-foreground p-8 sm:p-14 shimmer">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                  Parlons de la prochaine étape
                </h2>
                <p className="mt-4 text-primary-foreground/90 leading-relaxed">
                  Deck complet, métriques détaillées et démonstration produit disponibles sur demande.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.open(
                      `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
                        `Bonjour BeautyFlow Africa, merci de m'envoyer le deck investisseur. Email : ${email || '—'}`
                      )}`,
                      '_blank'
                    );
                  }}
                  className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="h-12 flex-1 rounded-full px-5 bg-background/95 text-foreground text-sm outline-none focus:ring-2 focus:ring-background"
                  />
                  <Button type="submit" size="lg" variant="secondary" className="h-12 rounded-full px-6 gap-2 press">
                    <Mail className="h-4 w-4" /> Demander le deck
                  </Button>
                </form>
              </div>
              <div className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BeautyFlowLogo className="h-6 w-6 rounded-lg" />
            <span>© {new Date().getFullYear()} BeautyFlow Africa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-primary transition-colors">Portail clientes</Link>
            <Link to="/pro" className="hover:text-primary transition-colors">Offre salons</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
