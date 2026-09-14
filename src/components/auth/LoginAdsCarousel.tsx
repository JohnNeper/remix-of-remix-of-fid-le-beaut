import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import loginBg from '@/assets/login-bg.jpg';

interface AdSlide {
  id: string;
  image: string;
  badge: { fr: string; en: string };
  title: { fr: string; en: string };
  highlight: { fr: string; en: string };
  description: { fr: string; en: string };
  stats?: { number: string; label: { fr: string; en: string } }[];
  tagColor: string;
}

const ADS_SLIDES: AdSlide[] = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1600&q=85',
    badge: { fr: '✨ LOGICIEL N°1 POUR SALONS & SPAS', en: '✨ #1 SALON & SPA MANAGEMENT SOFTWARE' },
    title: { fr: 'Gérez votre Salon & vos Réservations', en: 'Manage Your Salon & Bookings Effortlessly' },
    highlight: { fr: 'en Temps Réel 24/7', en: 'in Real-Time 24/7' },
    description: {
      fr: 'Recevez des réservations automatiques 24h/24, éliminez les absences avec les rappels SMS/WhatsApp et boostez votre chiffre d’affaires.',
      en: 'Get 24/7 automated bookings, eliminate no-shows with instant SMS/WhatsApp reminders, and grow your salon revenue.'
    },
    stats: [
      { number: '24/7', label: { fr: 'Réservation en ligne', en: 'Online Booking' } },
      { number: '-85%', label: { fr: 'RDV manqués', en: 'No-Show Rate' } },
      { number: '+35%', label: { fr: 'Chiffre d’affaires', en: 'Revenue Growth' } }
    ],
    tagColor: 'from-rose-500 to-pink-600'
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=85',
    badge: { fr: '💳 PAIEMENTS MOBILE MONEY INTÉGRÉS', en: '💳 INTEGRATED MOBILE MONEY PAYMENTS' },
    title: { fr: 'Encaissez via Wave, Orange, MTN', en: 'Accept Payments via Wave, Orange, MTN' },
    highlight: { fr: '& M-Pesa en Toute Sécurité', en: '& M-Pesa Seamlessly' },
    description: {
      fr: 'Proposez le paiement d’acomptes et la réservation en ligne sécurisée dans plus de 10 pays africains.',
      en: 'Enable online deposits and secure digital checkout across 10+ African countries.'
    },
    stats: [
      { number: '10+', label: { fr: 'Pays d’Afrique', en: 'African Countries' } },
      { number: '100%', label: { fr: 'Sécurisé (pawaPay)', en: 'Secure (pawaPay)' } },
      { number: 'Instant', label: { fr: 'Validation Mobile', en: 'Mobile Checkout' } }
    ],
    tagColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 'slide-3',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85',
    badge: { fr: '🌸 RITUELS SOINS & SPAS D’EXCEPTION', en: '🌸 LUXURY SPA & WELLNESS EXPERIENCE' },
    title: { fr: 'Offrez une Expérience Client', en: 'Deliver an Unmatched VIP' },
    highlight: { fr: 'Inoubliable & Sur-Mesure', en: 'Beauty Experience' },
    description: {
      fr: 'Historique beauté complet, fiches diagnostiques et suivi personnalisé pour fidéliser vos clientes d’exception.',
      en: 'Complete client history, custom beauty diagnostics, and personalized tracking for loyal repeat customers.'
    },
    stats: [
      { number: '4.9★', label: { fr: 'Satisfaction Client', en: 'Client Rating' } },
      { number: 'x2.5', label: { fr: 'Fréquence de visite', en: 'Visit Frequency' } },
      { number: '100%', label: { fr: 'Suivi Personnalisé', en: 'Client Records' } }
    ],
    tagColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'slide-4',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1600&q=85',
    badge: { fr: '🚀 FIDÉLISATIONS & MARKETING SMS', en: '🚀 DIGITAL LOYALTY & SMS CAMPAIGNS' },
    title: { fr: 'Fidélisez votre Clientèle', en: 'Retain Your Clients' },
    highlight: { fr: '& Lancez des Promos Ciblées', en: '& Launch Targeted Promos' },
    description: {
      fr: 'Cartes de fidélité digitales automatiques, relances pour créneaux creux et campagnes marketing ciblées.',
      en: 'Digital loyalty cards, automated re-engagement for quiet hours, and targeted marketing campaigns.'
    },
    stats: [
      { number: '+40%', label: { fr: 'Rétention Client', en: 'Client Retention' } },
      { number: 'SMS', label: { fr: 'Relance Automatique', en: 'Auto Reminders' } },
      { number: '1-Clic', label: { fr: 'Offres Privilèges', en: '1-Click Promos' } }
    ],
    tagColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'slide-5',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=85',
    badge: { fr: '🌍 MARKETPLACE BEAUTYFLOW AFRICA', en: '🌍 BEAUTYFLOW AFRICA MARKETPLACE' },
    title: { fr: 'Gagnez en Visibilité', en: 'Boost Your Online Visibility' },
    highlight: { fr: '& Attirez de Nouvelles Clientes', en: '& Attract New Clients' },
    description: {
      fr: 'Rejoignez le 1er réseau de salons et professionnels de beauté indépendants en Afrique.',
      en: 'Join the #1 marketplace network of top salons and independent beauty pros across Africa.'
    },
    stats: [
      { number: '50k+', label: { fr: 'Clientes actives', en: 'Active Clients' } },
      { number: 'TOP 1', label: { fr: 'Réseau Beauté', en: 'Beauty Platform' } },
      { number: '24/7', label: { fr: 'Vitrine Web', en: 'Web Exposure' } }
    ],
    tagColor: 'from-cyan-500 to-blue-600'
  }
];

export const LoginAdsCarousel: React.FC = () => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lang = language === 'en' ? 'en' : 'fr';

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ADS_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ADS_SLIDES.length) % ADS_SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused]);

  const currentSlide = ADS_SLIDES[currentIndex];

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Carousel with Smooth Fade & Scale Animation */}
      {ADS_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-out scale-105"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Multi-layer Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/40" />
        </div>
      ))}

      {/* Ambient Decorative Glows */}
      <div className="absolute top-1/4 -left-16 w-96 h-96 bg-rose-500/25 rounded-full blur-3xl pointer-events-none z-10" />
      <div className="absolute bottom-1/4 -right-16 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none z-10" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full justify-between p-8 lg:p-14">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-bold shadow-xl">
            <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${currentSlide.tagColor} animate-pulse`} />
            <span>{currentSlide.badge[lang]}</span>
          </div>

          {/* Slide Counter Badge */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-900/60 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
            <span className="text-white">0{currentIndex + 1}</span>
            <span className="text-white/30">/</span>
            <span className="text-white/50">0{ADS_SLIDES.length}</span>
          </div>
        </div>

        {/* Center Main Slide Content */}
        <div className="my-auto py-6 space-y-6 max-w-xl">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight drop-shadow-lg transition-all duration-500">
              {currentSlide.title[lang]} <br />
              <span className={`bg-gradient-to-r ${currentSlide.tagColor} bg-clip-text text-transparent drop-shadow-sm`}>
                {currentSlide.highlight[lang]}
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal drop-shadow-sm">
              {currentSlide.description[lang]}
            </p>
          </div>

          {/* Dynamic Stats Row */}
          {currentSlide.stats && currentSlide.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-3 p-4.5 rounded-2xl bg-white/10 dark:bg-black/40 border border-white/20 backdrop-blur-xl shadow-2xl">
              {currentSlide.stats.map((stat, sIdx) => (
                <div key={sIdx} className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">{stat.number}</div>
                  <div className="text-[11px] text-slate-300 font-semibold leading-tight">{stat.label[lang]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls & Indicators */}
        <div className="pt-6 border-t border-white/15 flex items-center justify-between gap-4">
          {/* Slide Dots */}
          <div className="flex items-center gap-2">
            {ADS_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-9 bg-rose-500 shadow-md shadow-rose-500/50'
                    : 'w-2.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={prevSlide}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl transition-all active:scale-95 shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl transition-all active:scale-95 shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
