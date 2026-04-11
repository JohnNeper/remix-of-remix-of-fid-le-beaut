import React from 'react';
import { Vente } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Printer, X } from 'lucide-react';
import { useSalon } from '@/hooks/useSalon';
import { useClients } from '@/hooks/useClients';

interface InvoiceGeneratorProps {
  vente: Vente;
  isOpen: boolean;
  onClose: () => void;
}

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const modePaiementLabels: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  carte: 'Carte bancaire',
  mixte: 'Paiement mixte',
};

export function InvoiceGenerator({ vente, isOpen, onClose }: InvoiceGeneratorProps) {
  const { salon } = useSalon();
  const { clients } = useClients();
  const client = vente.clientId ? clients.find(c => c.id === vente.clientId) : null;
  const invoiceNum = `FAC-${vente.date.replace(/-/g, '')}-${vente.id.slice(0, 6).toUpperCase()}`;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture ${invoiceNum}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #d6336c; }
      .salon-name { font-size: 22px; font-weight: 700; color: #d6336c; }
      .salon-info { font-size: 12px; color: #666; margin-top: 4px; }
      .invoice-title { text-align: right; }
      .invoice-title h2 { font-size: 28px; color: #d6336c; text-transform: uppercase; letter-spacing: 2px; }
      .invoice-num { font-size: 13px; color: #666; margin-top: 4px; }
      .parties { display: flex; justify-content: space-between; margin: 24px 0; }
      .party { flex: 1; }
      .party-label { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 6px; }
      .party-name { font-size: 15px; font-weight: 600; }
      .party-detail { font-size: 12px; color: #666; }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; }
      th { background: #f8f0f4; color: #d6336c; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; text-align: left; }
      th:last-child { text-align: right; }
      td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
      td:last-child { text-align: right; font-weight: 600; }
      .type-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
      .type-prestation { background: #fce4ec; color: #d6336c; }
      .type-produit { background: #e8f5e9; color: #2e7d32; }
      .totals { margin-top: 16px; text-align: right; }
      .total-row { display: flex; justify-content: flex-end; gap: 40px; padding: 6px 0; font-size: 13px; }
      .total-final { font-size: 20px; font-weight: 700; color: #d6336c; padding-top: 10px; border-top: 2px solid #d6336c; margin-top: 8px; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
      .payment-badge { display: inline-block; padding: 4px 12px; background: #f0f0f0; border-radius: 12px; font-size: 12px; margin-top: 8px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      ${printContent.innerHTML}
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Facture
          </DialogTitle>
        </DialogHeader>

        <div id="invoice-content" className="bg-white text-foreground p-6 rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-primary">
            <div>
              <p className="text-xl font-bold text-primary">{salon.nom}</p>
              {salon.telephone && <p className="text-xs text-muted-foreground mt-1">📞 {salon.telephone}</p>}
              {salon.adresse && <p className="text-xs text-muted-foreground">📍 {salon.adresse}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-primary tracking-wider">FACTURE</h2>
              <p className="text-xs text-muted-foreground mt-1">N° {invoiceNum}</p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date(vente.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Client info */}
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Émetteur</p>
              <p className="font-semibold">{salon.nom}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Client(e)</p>
              <p className="font-semibold">{client?.nom || 'Client(e) de passage'}</p>
              {client?.telephone && <p className="text-xs text-muted-foreground">{client.telephone}</p>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-primary/5">
                <th className="text-left p-2 text-xs uppercase tracking-wider text-primary">Désignation</th>
                <th className="text-left p-2 text-xs uppercase tracking-wider text-primary">Type</th>
                <th className="text-center p-2 text-xs uppercase tracking-wider text-primary">Qté</th>
                <th className="text-right p-2 text-xs uppercase tracking-wider text-primary">P.U.</th>
                <th className="text-right p-2 text-xs uppercase tracking-wider text-primary">Total</th>
              </tr>
            </thead>
            <tbody>
              {vente.items.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="p-2 font-medium">{item.nom}</td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.type === 'prestation' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                    }`}>
                      {item.type === 'prestation' ? 'Service' : 'Produit'}
                    </span>
                  </td>
                  <td className="p-2 text-center">{item.quantite}</td>
                  <td className="p-2 text-right">{formatFCFA(item.prixUnitaire)}</td>
                  <td className="p-2 text-right font-semibold">{formatFCFA(item.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 mt-4">
            <div className="flex gap-8 text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">{formatFCFA(vente.totalMontant)}</span>
            </div>
            <div className="flex gap-8 text-xl font-bold text-primary pt-2 mt-2 border-t-2 border-primary">
              <span>TOTAL</span>
              <span>{formatFCFA(vente.totalMontant)}</span>
            </div>
          </div>

          {/* Payment mode */}
          <div className="mt-6 text-center">
            <span className="inline-block px-4 py-1.5 bg-muted rounded-full text-xs font-medium">
              Mode de paiement: {modePaiementLabels[vente.modePaiement] || vente.modePaiement}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border text-center text-[11px] text-muted-foreground">
            <p>Merci pour votre confiance ! — {salon.nom}</p>
            <p className="mt-1">Cette facture a été générée automatiquement par BeautyFlow</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="h-4 w-4 mr-2" />Fermer
          </Button>
          <Button onClick={handlePrint} className="flex-1 gradient-primary">
            <Printer className="h-4 w-4 mr-2" />Imprimer / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
