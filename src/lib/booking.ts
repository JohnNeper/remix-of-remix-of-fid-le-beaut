import { getSalonBySlug } from '@/lib/auth';
import { getStorageItem, setStorageItem, tenantStorageKey, STORAGE_KEYS } from '@/lib/storage';
import type { RendezVous } from '@/types/rendez-vous';
import type { TypePrestation } from '@/types';
import type { SalonAccount } from '@/types/auth';

export function readPublicSalon(slug: string): SalonAccount | null {
  return getSalonBySlug(slug);
}

export function readServices(salonId: string): TypePrestation[] {
  // Mirrors the tenant key used by usePrestations + defaults
  const key = tenantStorageKey(salonId, STORAGE_KEYS.TYPES_PRESTATIONS);
  const stored = getStorageItem<TypePrestation[]>(key, []);
  if (stored.length > 0) return stored;
  // Lazy import to avoid circular deps with mock-data
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { defaultTypesPrestations } = require('@/lib/mock-data');
  return defaultTypesPrestations as TypePrestation[];
}

export function readRendezVous(salonId: string): RendezVous[] {
  const key = tenantStorageKey(salonId, STORAGE_KEYS.RENDEZ_VOUS);
  return getStorageItem<RendezVous[]>(key, []);
}

export function addPublicRendezVous(salonId: string, rdv: Omit<RendezVous, 'id'>): RendezVous {
  const key = tenantStorageKey(salonId, STORAGE_KEYS.RENDEZ_VOUS);
  const list = getStorageItem<RendezVous[]>(key, []);
  const newRdv: RendezVous = { ...rdv, id: crypto.randomUUID() };
  list.push(newRdv);
  setStorageItem(key, list);
  return newRdv;
}

export function makeReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'BF-';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Build time slots between opening/closing every slotDurationMin
export function buildTimeSlots(openHour: number, closeHour: number, stepMin: number): string[] {
  const out: string[] = [];
  const start = openHour * 60;
  const end = closeHour * 60;
  for (let m = start; m + stepMin <= end; m += stepMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return out;
}

export function isSlotTaken(
  rdvs: RendezVous[], date: string, time: string,
): boolean {
  return rdvs.some(r =>
    r.date === date && r.heure === time && r.statut !== 'annule'
  );
}

export function getBookingPublicUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/booking/${slug}`;
}