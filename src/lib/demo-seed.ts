import { getSalonAccounts, saveSalonAccounts, slugify } from '@/lib/auth';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import { defaultTypesPrestations, mockClients, mockPrestations } from '@/lib/mock-data';
import type { SalonAccount, SalonUser } from '@/types/auth';
import type { RendezVous } from '@/types/rendez-vous';
import type { Produit, Vente, Depense } from '@/types';

const DEMO_FLAG = 'beautyflow_demo_seeded_v1';
const DEMO_SLUG = 'demo';
const DEMO_EMAIL = 'demo@beautyflow.com';
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
  // If a salon with this slug already exists, just mark seeded and bail
  if (existing.some(s => s.slug === DEMO_SLUG)) {
    localStorage.setItem(DEMO_FLAG, '1');
    return;
  }

  const salonId = crypto.randomUUID();
  const ownerId = crypto.randomUUID();
  const today = new Date().toISOString().split('T')[0];
  const hashedPwd = simpleHash(DEMO_PASSWORD);

  const owner: SalonUser = {
    id: ownerId,
    salonId,
    nom: 'Sophie Demo',
    email: DEMO_EMAIL,
    motDePasse: hashedPwd,
    role: 'owner',
    telephone: '+237 690 000 000',
    dateCreation: today,
  };

  const demoSalon: SalonAccount = {
    id: salonId,
    nom: 'Salon Élégance Demo',
    proprietaire: 'Sophie Demo',
    telephone: '+237 690 000 000',
    adresse: 'Bonapriso, Douala',
    email: DEMO_EMAIL,
    motDePasse: hashedPwd,
    dateCreation: today,
    dernierPaiement: today,
    abonnementActif: true,
    montantAbonnement: 15000,
    joursAbonnement: 30,
    plan: 'pro',
    users: [owner],
    slug: DEMO_SLUG,
    branding: {
      primaryColor: '350 75% 55%',
      secondaryColor: '25 95% 60%',
      description:
        "Salon premium expert en tresses, soins capillaires, maquillage et bien-être. Une expérience luxueuse pensée pour vous.",
      location: 'Bonapriso, Douala — face pharmacie centrale',
      hours: 'Lun-Sam 9h-19h • Dimanche fermé',
      instagram: '@salon.elegance.demo',
    },
    bookingSettings: {
      autoConfirm: false,
      allowGuest: true,
      slotDurationMin: 30,
      openingHour: 9,
      closingHour: 19,
      closedDays: [0],
    },
  };

  saveSalonAccounts([...existing, demoSalon]);

  // ===== Tenant data =====
  const k = (key: string) => tenantStorageKey(salonId, key);

  // Services catalogue
  setStorageItem(k(STORAGE_KEYS.TYPES_PRESTATIONS), defaultTypesPrestations);

  // Clients (with referral chain)
  const clients = mockClients.map(c => ({ ...c }));
  if (clients[1] && clients[0]) clients[1].parrainId = clients[0].id;
  setStorageItem(k(STORAGE_KEYS.CLIENTS), clients);

  // Past prestations
  setStorageItem(k(STORAGE_KEYS.PRESTATIONS), mockPrestations);

  // Upcoming appointments (mix of confirmed + a pending public booking)
  const rdvs: RendezVous[] = [
    {
      id: crypto.randomUUID(),
      clientId: clients[0].id,
      typePrestationId: '2',
      date: isoDaysFromNow(0),
      heure: '10:00',
      duree: 90,
      employe: 'Sophie',
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
      employe: 'Sophie',
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
      reference: 'BF-DEMO1',
      createdAt: new Date().toISOString(),
    },
  ];
  setStorageItem(k(STORAGE_KEYS.RENDEZ_VOUS), rdvs);

  // Stock
  const produits: Produit[] = [
    { id: crypto.randomUUID(), nom: 'Shampoing professionnel', categorie: 'Capillaire', prix: 7500, prixAchat: 4500, quantite: 12, seuilAlerte: 5, unite: 'flacon' },
    { id: crypto.randomUUID(), nom: 'Huile de ricin', categorie: 'Capillaire', prix: 3500, prixAchat: 2000, quantite: 3, seuilAlerte: 5, unite: 'flacon' },
    { id: crypto.randomUUID(), nom: 'Vernis à ongles', categorie: 'Ongles', prix: 2500, prixAchat: 1200, quantite: 25, seuilAlerte: 10, unite: 'unité' },
    { id: crypto.randomUUID(), nom: 'Masque visage hydratant', categorie: 'Soins', prix: 4000, prixAchat: 2500, quantite: 8, seuilAlerte: 5, unite: 'sachet' },
  ];
  setStorageItem(k(STORAGE_KEYS.PRODUITS), produits);

  // Ventes (this month) — sample
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

  // Dépenses
  const depenses: Depense[] = [
    { id: crypto.randomUUID(), date: isoDaysFromNow(-5), categorie: 'Achats produits', description: 'Réassort shampoing', montant: 45000 },
    { id: crypto.randomUUID(), date: isoDaysFromNow(-10), categorie: 'Loyer', description: 'Loyer mensuel', montant: 80000 },
  ];
  setStorageItem(k(STORAGE_KEYS.DEPENSES), depenses);

  localStorage.setItem(DEMO_FLAG, '1');
}

export const DEMO_INFO = {
  slug: DEMO_SLUG,
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};