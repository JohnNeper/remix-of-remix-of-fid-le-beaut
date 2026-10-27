import { describe, it, expect } from "vitest";
import {
  POPULAR_SERVICE_TEMPLATES,
  STARTER_PACKS,
} from "@/lib/popular-service-templates";
import { getCategoryImage, getAllCategories } from "@/lib/category-images";

describe("Catalogue Afro & Modèles de Coiffures Populaires", () => {
  it("contient une liste robuste de modèles de coiffures et soins africains", () => {
    expect(POPULAR_SERVICE_TEMPLATES.length).toBeGreaterThanOrEqual(15);
  });

  it("vérifie que chaque modèle a des données bilingues complètes (FR et EN)", () => {
    POPULAR_SERVICE_TEMPLATES.forEach((tpl) => {
      expect(tpl.id).toBeTruthy();
      expect(tpl.nom.fr).toBeTruthy();
      expect(tpl.nom.en).toBeTruthy();
      expect(tpl.categorie.fr).toBeTruthy();
      expect(tpl.categorie.en).toBeTruthy();
      expect(tpl.description.fr).toBeTruthy();
      expect(tpl.description.en).toBeTruthy();
      expect(tpl.prix).toBeGreaterThan(0);
      expect(tpl.duree).toBeGreaterThan(0);
      expect(tpl.imageUrl).toBeTruthy();
      expect(tpl.fallbackImage).toBeTruthy();
    });
  });

  it("inclut les coiffures et rituels emblématiques de la beauté africaine", () => {
    const templateIds = POPULAR_SERVICE_TEMPLATES.map((t) => t.id);

    // Tresses protectrices & nattes
    expect(templateIds).toContain("knotless_braids");
    expect(templateIds).toContain("nattes_peules_fulani");
    expect(templateIds).toContain("nattes_collees_cornrows");
    expect(templateIds).toContain("box_braids_boheme");

    // Perruques, lissage nappy & locks
    expect(templateIds).toContain("pose_lace_frontale");
    expect(templateIds).toContain("silk_press_nappy");
    expect(templateIds).toContain("retwist_entretien_locks");

    // Cérémonie & soins ancestraux
    expect(templateIds).toContain("mariee_africaine_gele");
    expect(templateIds).toContain("soin_pur_karite_chebe");
    expect(templateIds).toContain("tatouage_henne_mains");

    // Barbiers hommes
    expect(templateIds).toContain("degrade_homme_taper");
    expect(templateIds).toContain("sculpture_barbe_chaude");
  });

  it("vérifie les Packs Clés en Main et la validité de leurs modèles inclus", () => {
    expect(STARTER_PACKS.length).toBeGreaterThanOrEqual(4);

    const allTemplateIds = new Set(POPULAR_SERVICE_TEMPLATES.map((t) => t.id));

    STARTER_PACKS.forEach((pack) => {
      expect(pack.id).toBeTruthy();
      expect(pack.nom.fr).toBeTruthy();
      expect(pack.nom.en).toBeTruthy();
      expect(pack.description.fr).toBeTruthy();
      expect(pack.description.en).toBeTruthy();
      expect(pack.templateIds.length).toBeGreaterThan(0);

      // Tous les templateIds du pack doivent exister dans POPULAR_SERVICE_TEMPLATES
      pack.templateIds.forEach((id) => {
        expect(allTemplateIds.has(id)).toBe(true);
      });
    });
  });

  it("vérifie le mapping d'images par défaut pour les catégories africaines", () => {
    const tressesImg = getCategoryImage("Tresses");
    const coiffureImg = getCategoryImage("Coiffure");
    const soinsImg = getCategoryImage("Soins");
    const hommeImg = getCategoryImage("Homme");
    const fallbackImg = getCategoryImage(undefined);

    expect(tressesImg).toBeTruthy();
    expect(coiffureImg).toBeTruthy();
    expect(soinsImg).toBeTruthy();
    expect(hommeImg).toBeTruthy();
    expect(fallbackImg).toBeTruthy();

    const categories = getAllCategories();
    expect(categories).toContain("Tresses");
    expect(categories).toContain("Coiffure");
    expect(categories).toContain("Homme");
    expect(categories).toContain("Ongles");
  });
});
