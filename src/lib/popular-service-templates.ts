import afroKnotlessBraids from '@/assets/afro-knotless-braids.jpg';
import afroFulaniBraids from '@/assets/afro-fulani-braids.jpg';
import afroCornrows from '@/assets/afro-cornrows.jpg';
import afroLocsRetwist from '@/assets/afro-locs-retwist.jpg';
import afroLaceFrontale from '@/assets/afro-lace-frontale.jpg';
import afroMarieeGele from '@/assets/afro-mariee-gele.jpg';
import afroSoinKarite from '@/assets/afro-soin-karite.jpg';
import afroSilkPress from '@/assets/afro-silk-press.jpg';
import afroHenneMariage from '@/assets/afro-henne-mariage.jpg';
import serviceTresses from '@/assets/service-tresses.jpg';
import serviceHomme from '@/assets/service-homme.jpg';
import afroTaperHomme from '@/assets/afro-taper-homme.jpg';
import afroBarbeChaude from '@/assets/afro-barbe-chaude.jpg';
import afroCoupeGarcon from '@/assets/afro-coupe-garcon.jpg';
import afroTressesHomme from '@/assets/afro-tresses-homme.jpg';
import serviceOngles from '@/assets/service-ongles.jpg';
import serviceMaquillage from '@/assets/service-makeup.jpg';
import serviceMassage from '@/assets/service-massage.jpg';
import serviceHamam from '@/assets/service-hamam.jpg';

export interface PopularServiceTemplate {
  id: string;
  nom: {
    fr: string;
    en: string;
  };
  categorie: {
    fr: string;
    en: string;
  };
  prix: number; // Prix suggéré en FCFA
  duree: number; // en minutes
  description: {
    fr: string;
    en: string;
  };
  imageUrl: string;
  fallbackImage: string;
  badge?: {
    fr: string;
    en: string;
  };
  featured?: boolean;
}

export interface StarterPack {
  id: string;
  nom: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  categorieLabel: {
    fr: string;
    en: string;
  };
  badge: {
    fr: string;
    en: string;
  };
  templateIds: string[];
  gradient: string;
}

export const POPULAR_SERVICE_TEMPLATES: PopularServiceTemplate[] = [
  // ── Tresses Africaines & Nattes / African Braids & Twists ─────────
  {
    id: 'knotless_braids',
    nom: {
      fr: 'Knotless Braids (Sans nœuds)',
      en: 'Knotless Braids',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 25000,
    duree: 180,
    description: {
      fr: 'Tresses protectrices modernes ultra-légères, sans douleur à la racine et zéro tension sur les tempes. Finition soignée au gel de tressage.',
      en: 'Modern lightweight pain-free protective braids with seamless root finish and scalp comfort.',
    },
    imageUrl: afroKnotlessBraids,
    fallbackImage: serviceTresses,
    badge: {
      fr: '⭐ Top Tendance Afrique',
      en: '⭐ Top Trending Africa',
    },
    featured: true,
  },
  {
    id: 'french_curl_braids',
    nom: {
      fr: 'French Curl Braids (Pointes Ondulées Glamour)',
      en: 'French Curl Braids (Bouncy Spiral Curls)',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 30000,
    duree: 210,
    description: {
      fr: 'La coiffure N°1 sur Pinterest & Instagram : tresses sans nœuds légères avec somptueuses boucles rebondies et volumineuses aux pointes.',
      en: 'Pinterest viral hairstyle: lightweight knotless braids flowing into glossy, bouncy spiral French curls.',
    },
    imageUrl: afroKnotlessBraids,
    fallbackImage: serviceTresses,
    badge: {
      fr: '🔥 N°1 Pinterest',
      en: '🔥 Pinterest Viral',
    },
    featured: true,
  },
  {
    id: 'nattes_peules_fulani',
    nom: {
      fr: 'Nattes Peules / Fulani Braids',
      en: 'Fulani Braids (Peul Heritage)',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 28000,
    duree: 210,
    description: {
      fr: 'Coiffure traditionnelle peule avec nattes collées centrales, tresses descendantes ornées de perles dorées, cauris et anneaux métalliques.',
      en: 'Traditional Fulani cornrows with side accent braids adorned with authentic gold cuffs, cowrie shells and wooden beads.',
    },
    imageUrl: afroFulaniBraids,
    fallbackImage: serviceTresses,
    badge: {
      fr: '👑 Héritage & Style',
      en: '👑 Heritage & Chic',
    },
    featured: true,
  },
  {
    id: 'nattes_collees_cornrows',
    nom: {
      fr: 'Nattes Collées Artistiques / Cornrows',
      en: 'Artistic Cornrows / Scalp Braids',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 18000,
    duree: 90,
    description: {
      fr: 'Tresses plaquées au cuir chevelu avec motifs géométriques créatifs, zigzags ou lignes droites et sculptage précis des baby hairs.',
      en: 'Precision artistic scalp cornrows with geometric patterns, clean partings and styled baby hairs.',
    },
    imageUrl: afroCornrows,
    fallbackImage: serviceTresses,
    badge: {
      fr: 'Incontournable',
      en: 'Essential Classic',
    },
    featured: true,
  },
  {
    id: 'box_braids_boheme',
    nom: {
      fr: 'Box Braids Bohème / Goddess Braids',
      en: 'Goddess / Bohemian Box Braids',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 22000,
    duree: 180,
    description: {
      fr: 'Tresses au carré régulières avec mèches bouclées vaporeuses incorporées pour un look bohème glamour et volumineux.',
      en: 'Neat box parted braids enriched with wavy curly strands for a lush, effortless goddess look.',
    },
    imageUrl: serviceTresses,
    fallbackImage: serviceTresses,
    badge: {
      fr: 'Bohème Chic',
      en: 'Boho Chic',
    },
  },
  {
    id: 'passion_twists_vanilles',
    nom: {
      fr: 'Passion Twists & Vanilles Texturées',
      en: 'Passion Twists & Afro Twists',
    },
    categorie: {
      fr: 'Tresses',
      en: 'Braids',
    },
    prix: 20000,
    duree: 150,
    description: {
      fr: 'Vanilles afro douces, souples et ultra légères réalisées avec mèches texturées. Style protecteur résistant à l’humidité.',
      en: 'Soft, bouncy and lightweight textured twists with natural curly ends, perfect protective humidity-proof style.',
    },
    imageUrl: afroLocsRetwist,
    fallbackImage: serviceTresses,
  },

  // ── Perruques, Tissages & Locks / Wigs, Weaves & Locs ─────────────
  {
    id: 'pose_lace_frontale',
    nom: {
      fr: 'Pose Lace Frontale (Melt Invisible)',
      en: 'HD Lace Frontal Install (Melanin Melt)',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 30000,
    duree: 90,
    description: {
      fr: 'Fonte de dentelle haute définition adaptée aux carnations mélaniques, colle waterproof hypoallergénique et sculptage des bordures.',
      en: 'HD melted lace frontal install matched to deep melanin skin tones, waterproof hold, and laid baby hairs.',
    },
    imageUrl: afroLaceFrontale,
    fallbackImage: afroLaceFrontale,
    badge: {
      fr: '🔥 Bestseller Salon',
      en: '🔥 Salon Bestseller',
    },
    featured: true,
  },
  {
    id: 'customisation_perruque',
    nom: {
      fr: 'Customisation & Plucking Perruque',
      en: 'Wig Customization & Bleaching',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 15000,
    duree: 60,
    description: {
      fr: 'Épilation minutieuse de la ligne frontale pour effet cuir chevelu naturel, décoloration des nœuds et shampooing hydratant.',
      en: 'Custom hairline plucking, knot bleaching, and texturizing for an ultra-realistic scalp illusion.',
    },
    imageUrl: afroLaceFrontale,
    fallbackImage: afroLaceFrontale,
  },
  {
    id: 'tissage_avec_closure',
    nom: {
      fr: 'Tissage Cousu Traditionnel avec Closure',
      en: 'Traditional Sew-in Weave with Closure',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 20000,
    duree: 120,
    description: {
      fr: 'Nattage protecteur serré, pose cousue solide avec fil adapté et fermeture closure 4x4 ou 5x5 sans produits adhésifs.',
      en: 'Protective base cornrows, firmly sewn wefts with matching thread and glue-free closure placement.',
    },
    imageUrl: afroSilkPress,
    fallbackImage: afroSilkPress,
  },
  {
    id: 'retwist_entretien_locks',
    nom: {
      fr: 'Resserrage & Retwist Locks / Dreadlocks',
      en: 'Locs Retwist & Scalp Treatment',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 15000,
    duree: 90,
    description: {
      fr: 'Shampooing détoxifiant clarifiant, tournage au peigne avec gel naturel végétal, coiffage en torsades et séchage sous casque.',
      en: 'Deep clarifying locs detox wash, palm-roll / comb retwist with natural botanical gel, and hooded dryer set.',
    },
    imageUrl: afroLocsRetwist,
    fallbackImage: afroLocsRetwist,
    badge: {
      fr: 'Spécial Locks',
      en: 'Locs Specialist',
    },
    featured: true,
  },
  {
    id: 'depart_locks_starter',
    nom: {
      fr: 'Création Départ de Locks (Starter Locs)',
      en: 'Starter Locs Creation (Comb Coils / Twists)',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 25000,
    duree: 150,
    description: {
      fr: 'Traçage géométrique précis au carré ou triangle, départ en vanilles ou comb coils avec produits naturels scellants.',
      en: 'Precise geometric scalp grid sectioning and starter locs installation with comb coils or two-strand twists.',
    },
    imageUrl: afroLocsRetwist,
    fallbackImage: afroLocsRetwist,
  },

  // ── Coiffures Événement & Brushing / Ceremonial Styling & Silk Press ───
  {
    id: 'mariee_africaine_gele',
    nom: {
      fr: 'Coiffure Mariage Royal & Attaché de Foulard (Gele / Moussor)',
      en: 'African Bridal Hair & Royal Headwrap (Gele / Moussor)',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 40000,
    duree: 120,
    description: {
      fr: 'Attaché d’apparat traditionnel de foulard royal (Gele nigérian, Moussor sénégalais ou Duku), chignon de cérémonie et parure dorée.',
      en: 'Royal African bridal styling with hand-sculpted Gele / Moussor headwrap, luxury bridal updo and traditional jewelry placement.',
    },
    imageUrl: afroMarieeGele,
    fallbackImage: afroMarieeGele,
    badge: {
      fr: '👑 Cérémonie Royale',
      en: '👑 Royal Ceremony',
    },
    featured: true,
  },
  {
    id: 'silk_press_nappy',
    nom: {
      fr: 'Silk Press & Brushing Cheveux Nappy (4A-4C)',
      en: 'Silk Press & Blowout on Natural Afro Hair (4A-4C)',
    },
    categorie: {
      fr: 'Coiffure',
      en: 'Hairstyling',
    },
    prix: 18000,
    duree: 80,
    description: {
      fr: 'Lissage thermique protecteur sans défrisage chimique. Shampoing hydratant, brushing et passage aux plaques céramique brillance soyeuse.',
      en: 'Chemical-free heat smoothing on natural coils. Deep conditioning, round-brush tension blowout and ceramic silk press.',
    },
    imageUrl: afroSilkPress,
    fallbackImage: afroSilkPress,
    badge: {
      fr: '100% Nappy Friendly',
      en: '100% Nappy Friendly',
    },
    featured: true,
  },

  // ── Soins Ancestraux & Traitements / African Hair Care Rituals ───
  {
    id: 'soin_pur_karite_chebe',
    nom: {
      fr: 'Soin Ancestral au Pur Beurre de Karité & Chébé',
      en: 'Ancestral Raw Shea Butter & Chébé Treatment',
    },
    categorie: {
      fr: 'Soins',
      en: 'Care',
    },
    prix: 15000,
    duree: 60,
    description: {
      fr: 'Masque chaud au véritable beurre de karité brut d’Afrique de l’Ouest et poudre de chébé tchadienne pour stopper la casse et sceller l’hydratation.',
      en: 'Hot butter masque using authentic West African raw shea butter and Chadian Chébé powder to lock in intense moisture and stop breakage.',
    },
    imageUrl: afroSoinKarite,
    fallbackImage: afroSoinKarite,
    badge: {
      fr: '🌿 100% Naturel & Bio',
      en: '🌿 100% Natural & Organic',
    },
    featured: true,
  },
  {
    id: 'bain_vapeur_hydratant',
    nom: {
      fr: 'Bain de Vapeur Hydratant sous Casque Ozone',
      en: 'Steam Therapy & Deep Moisture Masque',
    },
    categorie: {
      fr: 'Soins',
      en: 'Care',
    },
    prix: 12000,
    duree: 60,
    description: {
      fr: 'Diffusion de vapeur tiède pour ouvrir les cuticules des cheveux à faible porosité, pénétration des huiles végétales et massage crânien stimulant.',
      en: 'Ozone micro-mist steam bath to lift low-porosity cuticles, deep botanical oils infusion, and invigorating scalp massage.',
    },
    imageUrl: serviceHamam,
    fallbackImage: serviceHamam,
  },

  // ── Barbershop & Homme Afro / African Men Grooming ───────────────
  {
    id: 'degrade_homme_taper',
    nom: {
      fr: 'Coupe Homme Dégradé Américain / Taper Fade Afro',
      en: 'Afro Taper Fade / Sharp Skin Fade',
    },
    categorie: {
      fr: 'Homme',
      en: 'Men',
    },
    prix: 5000,
    duree: 45,
    description: {
      fr: 'Dégradé progressif à blanc sur les tempes et la nuque, traçage ultra-net des contours au rasoir de barbier et brossage texturé waves.',
      en: 'Crisp afro taper skin fade, ultra-sharp straight razor line-up, and textured waves enhancement.',
    },
    imageUrl: afroTaperHomme,
    fallbackImage: serviceHomme,
    badge: {
      fr: '💈 Barbershop Pro',
      en: '💈 Barbershop Pro',
    },
    featured: true,
  },
  {
    id: 'sculpture_barbe_chaude',
    nom: {
      fr: 'Taille de Barbe & Rituel Serviette Chaude',
      en: 'Beard Sculpting & Hot Towel Gentlemen Care',
    },
    categorie: {
      fr: 'Homme',
      en: 'Men',
    },
    prix: 4000,
    duree: 30,
    description: {
      fr: 'Sculpture et égalisation de la barbe, application d’huile de ricin fortifiante, compresse serviette chaude vapeur et finitions au coupe-chou.',
      en: 'Beard shaping, organic castor oil conditioning, relaxing steamed hot towel wrap, and straight-razor detailing.',
    },
    imageUrl: afroBarbeChaude,
    fallbackImage: serviceHomme,
    badge: {
      fr: 'Barbe & Soin',
      en: 'Beard Ritual',
    },
  },
  {
    id: 'tresses_homme_pop_smoke',
    nom: {
      fr: 'Tresses & Nattes Homme (Style Pop Smoke / Flacko)',
      en: 'Men Scalp Cornrows & Pop Smoke Braids',
    },
    categorie: {
      fr: 'Homme',
      en: 'Men',
    },
    prix: 10000,
    duree: 75,
    description: {
      fr: 'Nattes collées stylisées pour homme inspirées des tendances Pinterest : motifs géométriques, zig-zags et traçage net des contours au rasoir.',
      en: 'Trendy men scalp cornrows inspired by Pinterest styles, geometric parts, and razor-sharp contour line-up.',
    },
    imageUrl: afroTressesHomme,
    fallbackImage: serviceHomme,
    badge: {
      fr: '🔥 Tendance Pinterest',
      en: '🔥 Pinterest Trend',
    },
    featured: true,
  },
  {
    id: 'coupe_enfant_garcon',
    nom: {
      fr: 'Coupe Dégradé Garçon & Dessin Rasoir (Junior)',
      en: 'Kids / Boys Fade & Custom Hair Design',
    },
    categorie: {
      fr: 'Homme',
      en: 'Men',
    },
    prix: 3500,
    duree: 35,
    description: {
      fr: 'Coupe enfant moderne et soignée avec dégradé doux, contours précis sans irritation et petit trait ou motif personnalisé sur le côté.',
      en: 'Modern gentle fade for young boys with irritation-free clean edging and custom side razor wave design.',
    },
    imageUrl: afroCoupeGarcon,
    fallbackImage: serviceHomme,
    badge: {
      fr: 'Junior & Ado',
      en: 'Kids Favorite',
    },
  },
  {
    id: 'formule_vip_homme',
    nom: {
      fr: 'Formule VIP Homme (Coupe + Barbe + Shampoing Massant)',
      en: 'VIP Afro Barber Package (Cut + Beard + Wash)',
    },
    categorie: {
      fr: 'Homme',
      en: 'Men',
    },
    prix: 8000,
    duree: 60,
    description: {
      fr: 'Prise en charge intégrale : coupe au choix, soin barbe serviette chaude, shampooing mentholé rafraîchissant et lotion après-rasage parfumée.',
      en: 'Full grooming package: signature haircut, hot towel beard sculpting, refreshing shampoo and soothing aftershave balm.',
    },
    imageUrl: afroTaperHomme,
    fallbackImage: serviceHomme,
    badge: {
      fr: 'Formule Complète',
      en: 'Full VIP Package',
    },
  },

  // ── Henné, Maquillage & Cils / African Glam & Henna ──────────────
  {
    id: 'tatouage_henne_mains',
    nom: {
      fr: 'Tatouage Henné Traditionnel & Mehendi Cérémonie',
      en: 'Traditional Henna & Bridal Mehendi Hands',
    },
    categorie: {
      fr: 'Maquillage',
      en: 'Makeup',
    },
    prix: 15000,
    duree: 60,
    description: {
      fr: 'Dessins traditionnels délicats au henné 100% naturel sur les mains et avant-bras pour mariages, baptêmes et fêtes de Tabaski/Korité.',
      en: 'Intricate traditional henna art hand-painted with pure natural henna paste on dark skin for weddings and cultural ceremonies.',
    },
    imageUrl: afroHenneMariage,
    fallbackImage: afroHenneMariage,
    badge: {
      fr: '✨ Cérémonie & Fête',
      en: '✨ Henna Tradition',
    },
    featured: true,
  },
  {
    id: 'maquillage_glamour_soiree',
    nom: {
      fr: 'Maquillage Glamour Soirée & Teint Ébène Zéro Défaut',
      en: 'Glam Melanin Glow Evening Makeup',
    },
    categorie: {
      fr: 'Maquillage',
      en: 'Makeup',
    },
    prix: 20000,
    duree: 60,
    description: {
      fr: 'Mise en valeur experte des carnations noires et métissées : base matifiante anti-brillance, contouring chaud, lèvres irisées et fard pigmenté.',
      en: 'Specialized makeup artistry for rich melanin skin tones: matte all-day base, warm golden contour, radiant glow and sculpted lips.',
    },
    imageUrl: serviceMaquillage,
    fallbackImage: serviceMaquillage,
    badge: {
      fr: 'Glow Ébène',
      en: 'Melanin Glow',
    },
    featured: true,
  },

  // ── Onglerie & Pédicure / Nails & Feet Care ───────────────────────
  {
    id: 'pose_gel_capsules',
    nom: {
      fr: 'Pose Complète Gel & Capsules sur Peau Noire',
      en: 'Full Set Acrylic / Gel Nails on Dark Skin',
    },
    categorie: {
      fr: 'Ongles',
      en: 'Nails',
    },
    prix: 15000,
    duree: 90,
    description: {
      fr: 'Rallongement des ongles, modelage gel solide, teintes nudes flatteuses ou couleurs vives sublimant les mains ébène et top coat haute brillance.',
      en: 'Full set sculpted nail extensions with flattering rich nudes or bold colors perfectly complementing darker skin tones.',
    },
    imageUrl: serviceOngles,
    fallbackImage: serviceOngles,
    badge: {
      fr: 'Ongles Parfaits',
      en: 'Flawless Nails',
    },
    featured: true,
  },
  {
    id: 'pedicure_spa_detox',
    nom: {
      fr: 'Pédicure Spa Détox & Bain Relaxant',
      en: 'Luxury Detox Spa Pedicure & Foot Scrub',
    },
    categorie: {
      fr: 'Ongles',
      en: 'Nails',
    },
    prix: 12000,
    duree: 60,
    description: {
      fr: 'Bain aux huiles essentielles, râpage doux des callosités, gommage exfoliant au sel marin et pose de vernis longue durée.',
      en: 'Warm aromatic foot soak, gentle callus reduction, sea salt exfoliation, and chip-resistant longwear polish.',
    },
    imageUrl: serviceMassage,
    fallbackImage: serviceMassage,
  },
];

// Packs de démarrage prêts à l'emploi (One-click complete African salon packs)
export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'pack_afro_tresses_royales',
    nom: {
      fr: 'Pack Tresses Africaines & Soins Protecteurs',
      en: 'Royal African Braids & Protective Styles Pack',
    },
    description: {
      fr: 'Le menu incontournable des salons afro : Knotless Braids, Nattes Peules avec perles, Nattes collées cornrows, Silk press et Soin au beurre de karité.',
      en: 'The quintessential African hair salon menu: Knotless Braids, Fulani beaded braids, Cornrows, Silk Press, and Raw Shea Butter treatment.',
    },
    categorieLabel: {
      fr: '5 Prestations Phares Afro',
      en: '5 Top African Hairstyles',
    },
    badge: {
      fr: '⭐ Plus Populaire',
      en: '⭐ Most Popular',
    },
    templateIds: ['knotless_braids', 'nattes_peules_fulani', 'nattes_collees_cornrows', 'silk_press_nappy', 'soin_pur_karite_chebe'],
    gradient: 'from-amber-600 via-rose-600 to-purple-700',
  },
  {
    id: 'pack_perruques_locks',
    nom: {
      fr: 'Pack Perruques HD Lace, Tissages & Locks',
      en: 'HD Lace Wigs, Weaves & Locs Studio Pack',
    },
    description: {
      fr: 'Pose perruque lace frontale fondue, customisation, tissage traditionnel cousu et entretien retwist des locks.',
      en: 'Melted HD lace frontal wig install, customization, sewn-in weave, and locs retwist maintenance.',
    },
    categorieLabel: {
      fr: '4 Prestations Tendance',
      en: '4 Trending Services',
    },
    badge: {
      fr: 'Luxe & Tendance',
      en: 'Luxury & Trend',
    },
    templateIds: ['pose_lace_frontale', 'customisation_perruque', 'tissage_avec_closure', 'retwist_entretien_locks'],
    gradient: 'from-fuchsia-700 via-pink-600 to-rose-600',
  },
  {
    id: 'pack_barbershop_afro',
    nom: {
      fr: 'Pack Barbershop & Grooming Homme Afro',
      en: 'African Barbershop & Men Grooming Pack',
    },
    description: {
      fr: 'Coupe dégradé américain / taper fade, traçage barbe à la serviette chaude et formule VIP complète coupe + barbe.',
      en: 'Afro skin taper fade, straight razor beard sculpting with hot towel wrap, and all-in-one VIP package.',
    },
    categorieLabel: {
      fr: '5 Prestations Homme & Barber',
      en: '5 Barber Services',
    },
    badge: {
      fr: 'Barber Pro',
      en: 'Barber Pro',
    },
    templateIds: ['degrade_homme_taper', 'sculpture_barbe_chaude', 'tresses_homme_pop_smoke', 'coupe_enfant_garcon', 'formule_vip_homme'],
    gradient: 'from-slate-800 via-indigo-900 to-blue-900',
  },
  {
    id: 'pack_mariee_ceremonie_afro',
    nom: {
      fr: 'Pack Mariage Royal, Henné & Beauté Glamour',
      en: 'African Bridal Glamour & Traditional Henna Pack',
    },
    description: {
      fr: 'Attaché de foulard royal Gele / Moussor, tatouage au henné traditionnel cérémonies, maquillage glamour teint ébène et manucure gel.',
      en: 'Royal Gele bridal headwrap, traditional hand-painted henna, glowing melanin evening makeup, and gel nail extensions.',
    },
    categorieLabel: {
      fr: '4 Prestations Mariage & Fête',
      en: '4 Bridal & Festive Services',
    },
    badge: {
      fr: 'Mariage & Cérémonie',
      en: 'Royal Ceremony',
    },
    templateIds: ['mariee_africaine_gele', 'tatouage_henne_mains', 'maquillage_glamour_soiree', 'pose_gel_capsules'],
    gradient: 'from-emerald-700 via-teal-700 to-amber-600',
  },
];
