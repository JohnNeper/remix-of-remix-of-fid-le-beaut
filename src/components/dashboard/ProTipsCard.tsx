import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function ProTipsCard() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const tips = [
    {
      id: 'rappels',
      title: 'BeautyFlow Tip',
      description: "Saviez-vous que relancer une cliente inactive coûte 5x moins cher que d'en acquérir une nouvelle ?",
      actionText: t('protips.tip2Btn') || 'Rappels',
      actionUrl: '/rappels',
    },
    {
      id: 'fidelite',
      title: 'BeautyFlow Tip',
      description: 'Attribuer 10 points bonus au 3ème soin transforme 40% de vos clientes occasionnelles en habituées.',
      actionText: t('protips.tip1Btn') || 'Gérer la Fidélité',
      actionUrl: '/fidelite',
    },
    {
      id: 'stock',
      title: 'BeautyFlow Tip',
      description: "Proposer un produit d'entretien adapté à la caisse augmente votre panier moyen de 25%.",
      actionText: t('protips.tip3Btn') || 'Voir le Stock',
      actionUrl: '/stock',
    },
    {
      id: 'campagnes',
      title: 'BeautyFlow Tip',
      description: 'Envoyer un message de relance aux clientes absentes depuis 45 jours remplit vos créneaux calmes.',
      actionText: t('protips.tip4Btn') || 'Créer une Campagne',
      actionUrl: '/campagnes',
    }
  ];

  const currentTip = tips[currentIndex];

  const nextTip = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  return (
    <div className="relative rounded-[24px] overflow-hidden bg-[#18171C] text-white p-6 sm:p-7 shadow-xl border border-white/5 group transition-all">
      {/* Decorative Star & Plus SVG ornament from reference image */}
      <svg
        className="absolute top-4 right-4 w-24 h-24 sm:w-28 sm:h-28 text-white/[0.07] pointer-events-none group-hover:text-white/[0.12] transition-colors"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M50 12 C50 34 66 50 88 50 C66 50 50 66 50 88 C50 66 34 50 12 50 C34 50 50 34 50 12 Z" />
        <path d="M80 18 V28 M75 23 H85" strokeWidth="4" />
      </svg>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 mb-4">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          {currentTip.title}
        </h3>

        {/* Subtle Carousel controls */}
        {tips.length > 1 && (
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={prevTip}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
              title="Précédent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-semibold text-slate-300 px-1">
              {currentIndex + 1}/{tips.length}
            </span>
            <button
              type="button"
              onClick={nextTip}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
              title="Suivant"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tip Description */}
      <p className="text-sm sm:text-[15px] text-slate-200 font-normal leading-relaxed mb-6 relative z-10 max-w-[92%]">
        {currentTip.description}
      </p>

      {/* Action Button */}
      <div className="relative z-10">
        <Link to={currentTip.actionUrl} className="block w-full">
          <Button
            type="button"
            className="w-full h-12 rounded-full bg-[#F4ECE6] hover:bg-[#EBE2DC] text-[#3D251E] font-bold text-sm sm:text-base transition-transform active:scale-[0.98] shadow-md border-0"
          >
            {currentTip.actionText}
          </Button>
        </Link>
      </div>
    </div>
  );
}

