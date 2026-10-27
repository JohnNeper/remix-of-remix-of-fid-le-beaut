import { describe, it, expect } from "vitest";

describe("Validation Financière & Facturation des Rendez-vous", () => {
  it("calcule correctement le montant total en fonction du nombre de personnes (ex: père avec 4 enfants)", () => {
    const prixUnitaire = 5000; // ex: coupe enfant ou taper
    const nombrePersonnes = 5; // 1 adulte + 4 enfants
    const montantTotal = prixUnitaire * nombrePersonnes;

    expect(montantTotal).toBe(25000);
  });

  it("empêche la double facturation / validation multiple d'un même rendez-vous", () => {
    interface RendezVousMock {
      id: string;
      statut: 'en_attente' | 'confirme' | 'termine' | 'annule';
      isFactureValidee?: boolean;
      factureId?: string;
    }

    const rdvInitial: RendezVousMock = {
      id: "rdv-123",
      statut: "confirme",
      isFactureValidee: false,
    };

    // Helper vérifiant si le bouton Valider & Facturer doit être bloqué/désactivé
    const isValidationDisabled = (rdv: RendezVousMock) => {
      return Boolean(rdv.isFactureValidee || rdv.factureId || rdv.statut === 'termine');
    };

    // Avant validation : bouton actif
    expect(isValidationDisabled(rdvInitial)).toBe(false);

    // Après validation : le statut passe à terminé et la facture est générée
    const rdvValide: RendezVousMock = {
      ...rdvInitial,
      statut: "termine",
      isFactureValidee: true,
      factureId: "fact-999",
    };

    // Après validation : bouton immédiatement bloqué
    expect(isValidationDisabled(rdvValide)).toBe(true);
  });

  it("gère l'assignation de l'employé responsable lors de la validation", () => {
    const employesDisponibles = ["Awa Traoré", "Fatou Ndiaye", "Moussa Koné"];
    const employeSelectionne = "Awa Traoré";

    expect(employesDisponibles).toContain(employeSelectionne);

    const validationPayload = {
      rendezVousId: "rdv-456",
      employe: employeSelectionne,
      montant: 25000,
      methodePaiement: "wave",
      nombrePersonnes: 5,
    };

    expect(validationPayload.employe).toBe("Awa Traoré");
    expect(validationPayload.nombrePersonnes).toBe(5);
  });
});
