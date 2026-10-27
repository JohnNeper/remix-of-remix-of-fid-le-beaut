// Image mapping for service categories (Authentic African beauty & hair)
import afroKnotlessBraids from '@/assets/afro-knotless-braids.jpg';
import afroLaceFrontale from '@/assets/afro-lace-frontale.jpg';
import afroSoinKarite from '@/assets/afro-soin-karite.jpg';
import serviceOngles from '@/assets/service-ongles.jpg';
import serviceMaquillage from '@/assets/service-makeup.jpg';
import serviceMassage from '@/assets/service-massage.jpg';
import serviceHamam from '@/assets/service-hamam.jpg';
import serviceHomme from '@/assets/service-homme.jpg';
import afroTaperHomme from '@/assets/afro-taper-homme.jpg';

const categoryImages: Record<string, string> = {
  'Coiffure': afroLaceFrontale,
  'Tresses': afroKnotlessBraids,
  'Ongles': serviceOngles,
  'Maquillage': serviceMaquillage,
  'Soins': afroSoinKarite,
  'Massage': serviceMassage,
  'Hamam': serviceHamam,
  'Homme': afroTaperHomme || serviceHomme,
  'Traitement': afroSoinKarite,
};

export function getCategoryImage(categorie?: string): string {
  if (!categorie) return afroKnotlessBraids;
  return categoryImages[categorie] || afroKnotlessBraids;
}

export function getAllCategories(): string[] {
  return Object.keys(categoryImages);
}

export default categoryImages;
