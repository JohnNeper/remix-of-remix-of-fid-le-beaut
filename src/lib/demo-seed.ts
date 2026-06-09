import { getSalonAccounts, saveSalonAccounts, slugify } from '@/lib/auth';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import { defaultTypesPrestations, mockClients, mockPrestations } from '@/lib/mock-data';
import type { SalonAccount, SalonUser } from '@/types/auth';
import type { RendezVous } from '@/types/rendez-vous';
import type { Produit, Vente, Depense } from '@/types';

const DEMO_FLAG = 'beautyflow_demo_seeded_v4';
const DEMO_PASSWORD = 'demo2025';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Seed a fully-featured demo salon on first launch so the user can immediately
 * test the public booking flow (link: /booking/demo) and the dashboard.
 * Idempotent: runs only once per browser (guarded by localStorage flag).
 */
export function seedDemoData(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(DEMO_FLAG)) return;

  const existing = getSalonAccounts();
  const today = new Date().toISOString().split('T')[0];
  const hashedPwd = simpleHash(DEMO_PASSWORD);

  const demoSalonsSpecs: Array<{
    slug: string; nom: string; proprietaire: string; email: string;
    telephone: string; adresse: string;
    branding: any;
    staffNames: Array<{ nom: string; role: string; bio?: string; specialties?: string[]; img: number }>;
  }> = [
    {
      slug: 'elegance',
      nom: 'Salon Élégance',
      proprietaire: 'Sophie Mboma',
      email: 'elegance@beautyflow.com',
      telephone: '+237 690 000 001',
      adresse: 'Bonapriso, Douala',
      branding: {
        primaryColor: '350 75% 55%',
        secondaryColor: '25 95% 60%',
        description:
          "Salon premium expert en tresses, soins capillaires, maquillage et bien-être. Une expérience luxueuse pensée pour vous.",
        location: 'Bonapriso, Douala — face pharmacie centrale',
        hours: 'Lun-Sam 9h-19h • Dimanche fermé',
        instagram: '@salon.elegance',
        category: 'Coiffure & Tresses',
        rating: 4.8, reviewCount: 142,
        bannerUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
          'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80',
        ],
      },
      staffNames: [
        { nom: 'Sophie M.', role: 'Fondatrice — Tresses & coloration', bio: '15 ans d\'expérience, formée à Paris.', specialties: ['Tresses', 'Coloration'], img: 47 },
        { nom: 'Cindy', role: 'Coiffeuse senior', specialties: ['Tissage', 'Locs'], img: 32 },
        { nom: 'Marlène', role: 'Maquilleuse pro', specialties: ['Maquillage', 'Soins'], img: 26 },
      ],
    },
    {
      slug: 'glow-studio',
      nom: 'Glow Studio',
      proprietaire: 'Aïcha Ngono',
      email: 'glow@beautyflow.com',
      telephone: '+237 690 000 002',
      adresse: 'Akwa, Douala',
      branding: {
        primaryColor: '280 70% 55%',
        secondaryColor: '180 65% 50%',
        description:
          "Studio moderne dédié à la beauté du visage, des ongles et au maquillage professionnel pour tous vos événements.",
        location: 'Akwa, Douala — Rue Joss',
        hours: 'Mar-Dim 10h-20h • Lundi fermé',
        instagram: '@glow.studio',
        category: 'Onglerie & Maquillage',
        rating: 4.9, reviewCount: 89,
        bannerUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
          'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80',
          'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&q=80',
          'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&q=80',
        ],
      },
      staffNames: [
        { nom: 'Aïcha N.', role: 'Nail artist principale', specialties: ['Gel UV', 'Nail art'], img: 45 },
        { nom: 'Jade', role: 'Maquilleuse événementiel', specialties: ['Maquillage mariée'], img: 9 },
        { nom: 'Lina', role: 'Esthéticienne', specialties: ['Soins du visage'], img: 16 },
      ],
    },
    {
      slug: 'royal-beauty',
      nom: 'Royal Beauty Lounge',
      proprietaire: 'Mireille Etoundi',
      email: 'royal@beautyflow.com',
      telephone: '+237 690 000 003',
      adresse: 'Bastos, Yaoundé',
      branding: {
        primaryColor: '40 90% 50%',
        secondaryColor: '15 80% 45%',
        description:
          "Lounge haut de gamme spécialisé en extensions, perruques sur-mesure, soins du corps et massages relaxants.",
        location: 'Bastos, Yaoundé — face ambassade',
        hours: 'Tous les jours 9h-21h',
        instagram: '@royal.beauty.lounge',
        category: 'Spa & Bien-être',
        rating: 4.7, reviewCount: 213,
        bannerUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
          'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80',
          'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=80',
        ],
      },
      staffNames: [
        { nom: 'Mireille E.', role: 'Directrice — Spa', specialties: ['Massage', 'Hamam'], img: 49 },
        { nom: 'Patricia', role: 'Masseuse certifiée', specialties: ['Massage pierres chaudes'], img: 23 },
        { nom: 'Rachelle', role: 'Spécialiste extensions', specialties: ['Perruques', 'Extensions'], img: 38 },
      ],
    },
  ];

  const createdSalons: SalonAccount[] = [];

  // Update existing demo salons in place (so users who already seeded v2 get the new branding/staff)
  const allSalons = [...existing];
  let mutatedExisting = false;

  for (const spec of demoSalonsSpecs) {
    const staff = spec.staffNames.map(s => ({
      id: crypto.randomUUID(),
      nom: s.nom,
      role: s.role,
      bio: s.bio,
      specialties: s.specialties,
      photoUrl: `https://i.pravatar.cc/200?img=${s.img}`,
    }));
    const existingIdx = allSalons.findIndex(s => s.slug === spec.slug);
    if (existingIdx >= 0) {
      allSalons[existingIdx] = {
        ...allSalons[existingIdx],
        branding: { ...allSalons[existingIdx].branding, ...spec.branding, staff },
      };
      mutatedExisting = true;
      continue;
    }
    const salonId = crypto.randomUUID();
    const owner: SalonUser = {
      id: crypto.randomUUID(),
      salonId,
      nom: spec.proprietaire,
      email: spec.email,
      motDePasse: hashedPwd,
      role: 'owner',
      telephone: spec.telephone,
      dateCreation: today,
    };
    createdSalons.push({
      id: salonId,
      nom: spec.nom,
      proprietaire: spec.proprietaire,
      telephone: spec.telephone,
      adresse: spec.adresse,
      email: spec.email,
      motDePasse: hashedPwd,
      dateCreation: today,
      dernierPaiement: today,
      abonnementActif: true,
      montantAbonnement: 15000,
      joursAbonnement: 30,
      plan: 'pro',
      users: [owner],
      slug: spec.slug,
      branding: { ...spec.branding, staff },
      bookingSettings: {
        autoConfirm: true,
        allowGuest: true,
        slotDurationMin: 30,
        openingHour: 9,
        closingHour: 19,
        closedDays: [0],
      },
    });
  }

  saveSalonAccounts([...allSalons, ...createdSalons]);

  // Seed tenant data for each new demo salon
  for (const salon of createdSalons) {
    const k = (key: string) => tenantStorageKey(salon.id, key);
    setStorageItem(k(STORAGE_KEYS.TYPES_PRESTATIONS), defaultTypesPrestations);
    const clients = mockClients.map(c => ({ ...c }));
    if (clients[1] && clients[0]) clients[1].parrainId = clients[0].id;
    setStorageItem(k(STORAGE_KEYS.CLIENTS), clients);
    setStorageItem(k(STORAGE_KEYS.PRESTATIONS), mockPrestations);
    const rdvs: RendezVous[] = [
    {
      id: crypto.randomUUID(),
      clientId: clients[0].id,
      typePrestationId: '2',
      date: isoDaysFromNow(0),
      heure: '10:00',
      duree: 90,
      employe: salon.proprietaire.split(' ')[0],
      statut: 'confirme',
      source: 'salon',
    },
    {
      id: crypto.randomUUID(),
      clientId: clients[1].id,
      typePrestationId: '5',
      date: isoDaysFromNow(0),
      heure: '14:30',
      duree: 45,
      employe: 'Marie',
      statut: 'confirme',
      source: 'salon',
    },
    {
      id: crypto.randomUUID(),
      clientId: clients[3].id,
      typePrestationId: '9',
      date: isoDaysFromNow(1),
      heure: '11:00',
      duree: 60,
      employe: salon.proprietaire.split(' ')[0],
      statut: 'confirme',
      source: 'salon',
    },
    {
      id: crypto.randomUUID(),
      clientId: '',
      typePrestationId: '7',
      date: isoDaysFromNow(2),
      heure: '15:00',
      duree: 60,
      statut: 'en_attente',
      source: 'public',
      customerName: 'Cliente en ligne (démo)',
      customerPhone: '+237 699 555 111',
      customerEmail: 'cliente@example.com',
      reference: 'BF-' + salon.slug!.slice(0, 4).toUpperCase(),
      createdAt: new Date().toISOString(),
    },
    ];
    setStorageItem(k(STORAGE_KEYS.RENDEZ_VOUS), rdvs);
    const produits: Produit[] = [
    { id: crypto.randomUUID(), nom: 'Shampoing professionnel', categorie: 'Capillaire', prix: 7500, prixAchat: 4500, quantite: 12, seuilAlerte: 5, unite: 'flacon' },
    { id: crypto.randomUUID(), nom: 'Huile de ricin', categorie: 'Capillaire', prix: 3500, prixAchat: 2000, quantite: 3, seuilAlerte: 5, unite: 'flacon' },
    { id: crypto.randomUUID(), nom: 'Vernis à ongles', categorie: 'Ongles', prix: 2500, prixAchat: 1200, quantite: 25, seuilAlerte: 10, unite: 'unité' },
    { id: crypto.randomUUID(), nom: 'Masque visage hydratant', categorie: 'Soins', prix: 4000, prixAchat: 2500, quantite: 8, seuilAlerte: 5, unite: 'sachet' },
    ];
    setStorageItem(k(STORAGE_KEYS.PRODUITS), produits);
    const ventes: Vente[] = [
    {
      id: crypto.randomUUID(),
      date: today,
      clientId: clients[0].id,
      items: [
        { type: 'prestation', referenceId: '2', nom: 'Tresses africaines', quantite: 1, prixUnitaire: 15000, montant: 15000 },
        { type: 'produit', referenceId: produits[0].id, nom: produits[0].nom, quantite: 1, prixUnitaire: 7500, montant: 7500 },
      ],
      totalMontant: 22500,
      modePaiement: 'mobile_money',
    },
    {
      id: crypto.randomUUID(),
      date: isoDaysFromNow(-2),
      clientId: clients[1].id,
      items: [
        { type: 'prestation', referenceId: '5', nom: 'Manucure', quantite: 1, prixUnitaire: 3000, montant: 3000 },
      ],
      totalMontant: 3000,
      modePaiement: 'especes',
    },
    ];
    setStorageItem(k(STORAGE_KEYS.VENTES), ventes);
    const depenses: Depense[] = [
    { id: crypto.randomUUID(), date: isoDaysFromNow(-5), categorie: 'Achats produits', description: 'Réassort shampoing', montant: 45000 },
    { id: crypto.randomUUID(), date: isoDaysFromNow(-10), categorie: 'Loyer', description: 'Loyer mensuel', montant: 80000 },
    ];
    setStorageItem(k(STORAGE_KEYS.DEPENSES), depenses);
  }

  localStorage.setItem(DEMO_FLAG, '1');
}

export const DEMO_INFO = {
  slugs: ['elegance', 'glow-studio', 'royal-beauty'],
  password: DEMO_PASSWORD,
};