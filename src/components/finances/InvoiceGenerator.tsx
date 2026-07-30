import React from 'react';
import { Vente } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Printer, X, Sparkles, Trash2 } from 'lucide-react';
import { useSalon } from '@/hooks/useSalon';
import { useClients } from '@/hooks/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { shareHtmlAsPdfViaWhatsApp } from '@/utils/whatsapp';

interface InvoiceGeneratorProps {
  vente: Vente;
  isOpen: boolean;
  onClose: () => void;
  onDeleteRequest?: () => void;
}

// Brand-accurate WhatsApp icon SVG
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.456 3.473 1.326 4.988l-1.41 5.15 5.27-1.383c1.467.8 3.12 1.22 4.802 1.22 5.506 0 9.988-4.482 9.988-9.988S17.518 2 12.012 2zm6.277 14.153c-.255.722-1.294 1.326-1.785 1.4-1.343.203-2.99-.443-4.57-1.1-2.91-1.21-4.842-4.08-4.993-4.28-.15-.2-1.222-1.625-1.222-3.1 0-1.474.773-2.195 1.05-2.483.276-.288.608-.36.81-.36.203 0 .408.003.586.012.185.01.436-.07.683.525.25.604.862 2.102.937 2.257.076.155.127.337.026.544-.1.206-.153.33-.3.504-.15.174-.314.387-.448.52-.15.15-.307.315-.133.615.174.3.774 1.276 1.66 2.067.942.84 1.737 1.1 1.986 1.225.25.126.395.105.54-.06.146-.166.623-.725.79-1.01.164-.287.33-.24.557-.156.228.083 1.444.68 1.692.805.25.125.416.186.477.292.06.106.06.617-.194 1.34z" />
  </svg>
);

export function InvoiceGenerator({ vente, isOpen, onClose, onDeleteRequest }: InvoiceGeneratorProps) {
  const { t, language } = useLanguage();
  const { formatCurrency, formatDate } = useTranslations();
  const { salon } = useSalon();
  const { currentSalon } = useAuth();
  const { clients } = useClients();
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const client = React.useMemo(() => {
    if (!vente.clientId) return null;
    if (typeof vente.clientId === 'object') return vente.clientId;
    const searchId = String(vente.clientId);
    return clients.find(c => String(c.id) === searchId || String((c as { _id?: string })._id) === searchId);
  }, [vente.clientId, clients]);

  // const salon = currentSalon;

  if (!salon) return null;

  const getClientName = (id?: string): string => {
    if (!client) {
      return t('finances.invoice.walkInClient');
    }
    if (id && client.id !== id) {
      return t('finances.invoice.walkInClient');
    }

    return client.nom || t('finances.unknownClient');
  };

  const venteId = vente.id || (vente as { _id?: string })._id || 'TEMP';
  const dateSafe = vente.date || new Date().toISOString().split('T')[0];
  const invoiceNum = `FAC-${dateSafe.replace(/-/g, '')}-${venteId.toString().slice(0, 6).toUpperCase()}`;

  const modePaiementLabels: Record<string, string> = {
    especes: t('finances.paymentModes.especes'),
    mobile_money: t('finances.paymentModes.mobile_money'),
    carte: t('finances.paymentModes.carte'),
    mixte: t('finances.paymentModes.mixte'),
  };

  const handleWhatsAppShare = () => {
    const filename = `Facture_${invoiceNum}.pdf`;

    const itemList = (vente.items || []).map(item =>
      `🔸 ${item.nom} (x${item.quantite}) : ${formatCurrency(item.montant)}`
    ).join('\n');

    const messageText = `✂️ *FACTURE - ${salon.name}* ✂️
Ref: ${invoiceNum}
Date: ${formatDate(dateSafe)}

*Client:* ${client ? client.nom : t('finances.invoice.walkInClient')}
-------------------------
*Détails :*
${itemList}
-------------------------
💰 *TOTAL : ${formatCurrency(vente.totalMontant)}*
💳 *Paiement : ${modePaiementLabels[vente.modePaiement] || vente.modePaiement}*
${vente.notes ? `\n*Notes:*\n_${vente.notes}_\n` : ''}
Merci pour votre confiance ! 🌸`;

    shareHtmlAsPdfViaWhatsApp({
      elementId: 'invoice-pdf-template',
      filename,
      messageText,
      clientPhoneRaw: client?.telephone,
      salonPhone: salon.telephone,
      onStart: () => setIsGeneratingPdf(true),
      onEnd: () => setIsGeneratingPdf(false),
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const logoUrl = salon.logoUrl || (salon as any).logoUrl;
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 10px; border-radius: 8px;" />`
      : '';

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
      <div class="header">
        <div class="salon-brand">
          ${logoHtml}
          <div>
            <h1 class="salon-name">${salon.name}</h1>
            ${salon.telephone ? `<p class="salon-info">📞 ${salon.telephone}</p>` : ''}
            ${salon.adresse ? `<p class="salon-info">📍 ${salon.adresse}</p>` : ''}
          </div>
        </div>
        <div class="invoice-meta">
          <h2 class="invoice-label">${t('finances.invoice')}</h2>
          <p class="meta-item"><strong>${t('finances.invoice.number').split(':')[0]}:</strong> ${invoiceNum}</p>
          <p class="meta-item"><strong>${t('finances.date')}:</strong> ${formatDate(dateSafe)}</p>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <p class="party-label">${t('finances.invoice.issuer')}</p>
          <p class="party-name">${salon.name}</p>
          <p class="party-detail">${salon.adresse || ''}</p>
        </div>
        <div class="party" style="text-align: right;">
          <p class="party-label">${t('finances.invoice.client')}</p>
          <p class="party-name">${client ? client.nom : t('finances.invoice.walkInClient')}</p>
          ${client?.telephone ? `<p class="party-detail">${client.telephone}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${t('finances.invoice.designation')}</th>
            <th>${t('finances.invoice.type')}</th>
            <th class="text-center">${t('finances.qty')}</th>
            <th class="text-right">${t('finances.invoice.pu')}</th>
            <th class="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${(vente.items || []).map(item => `
            <tr>
              <td><div class="item-name">${item.nom}</div></td>
              <td><span class="item-type">${item.type === 'prestation' ? t('finances.services') : t('finances.products')}</span></td>
              <td class="text-center">${item.quantite}</td>
              <td class="text-right">${formatCurrency(item.prixUnitaire)}</td>
              <td class="text-right"><strong>${formatCurrency(item.montant)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-container">
        <div class="totals-box">
          <div class="total-row">
            <span>${t('finances.invoice.subtotal')}</span>
            <span>${formatCurrency(vente.totalMontant)}</span>
          </div>
          <div class="total-row total-final">
            <span>TOTAL</span>
            <span>${formatCurrency(vente.totalMontant)}</span>
          </div>
        </div>
      </div>

      <div class="payment-info">
        <span class="payment-method">${t('finances.paymentMethod')}: ${modePaiementLabels[vente.modePaiement] || vente.modePaiement}</span>
      </div>

      ${vente.notes ? `
      <div style="margin-top: 30px; border-top: 1px dashed #d6336c; padding-top: 20px; text-align: left;">
        <div style="font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">Notes & Recommandations post-prestation</div>
        <div style="font-size: 13px; color: #1f2937; background: #fff0f6; padding: 15px; border-radius: 12px; border-left: 4px solid #d6336c; font-style: italic; white-space: pre-wrap; line-height: 1.6;">
          ${vente.notes}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p class="thanks">Merci pour votre confiance !</p>
        <p class="powered">Généré par BeautyFlow © 2026</p>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full h-[90vh] sm:h-auto max-h-[92vh] flex flex-col rounded-3xl p-0 overflow-hidden border border-border bg-card">

        <DialogHeader className="p-4 bg-muted/20 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5 text-primary" />
            Facture
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background text-foreground">
          <div id="invoice-content" className="bg-background text-foreground">

            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 pb-6 border-b-2 border-primary/20 gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg overflow-hidden border-2 border-white flex-shrink-0">
                  {salon.logoUrl ? (
                    <img src={salon.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-primary tracking-tight leading-none">{salon.name}</p>
                  <div className="mt-1 space-y-0.5">
                    {salon.telephone && <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <span className="opacity-70">📞</span> {salon.telephone}
                    </p>}
                    {salon.adresse && <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <span className="opacity-70">📍</span> {salon.adresse}
                    </p>}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/10">
                <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tighter uppercase opacity-30 select-none leading-none">{t('finances.invoice')}</h2>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('finances.invoice.number').split(':')[0]}</p>
                  <p className="text-sm font-bold text-foreground">{invoiceNum}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-2">
                    {t('finances.date')}: <span className="text-foreground">{formatDate(dateSafe)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t('finances.invoice.issuer')}</p>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-foreground">{salon.name}</p>
                  <p className="text-[11px] text-muted-foreground">{salon.adresse}</p>
                </div>
              </div>
              <div className="sm:text-right sm:border-l border-border/50 sm:pl-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/10">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t('finances.invoice.client')}</p>
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-primary">{getClientName(client?.id)}</p>
                  {client?.telephone && <p className="text-[11px] text-muted-foreground font-medium">{client.telephone}</p>}
                </div>
              </div>
            </div>

            {/* Mobile Layout: cards list (hidden on sm/desktop, hidden on print) */}
            <div className="block sm:hidden space-y-3 mb-6 print:hidden">
              {(vente.items || []).map((item, idx) => (
                <div key={idx} className="border border-border/40 p-3.5 rounded-2xl bg-muted/10 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-foreground leading-tight">{item.nom}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${item.type === 'prestation' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                        }`}>
                        {item.type === 'prestation' ? t('finances.services') : t('finances.products')}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs text-primary">{formatCurrency(item.montant)}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {item.quantite} x {formatCurrency(item.prixUnitaire)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet/Desktop/Print Layout: traditional table */}
            <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0 mb-6 print:block">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-primary/5">
                    <th className="text-left p-3 text-[10px] uppercase tracking-wider text-primary font-bold">{t('finances.invoice.designation')}</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-wider text-primary font-bold">{t('finances.invoice.type')}</th>
                    <th className="text-center p-3 text-[10px] uppercase tracking-wider text-primary font-bold">{t('finances.qty')}</th>
                    <th className="text-right p-3 text-[10px] uppercase tracking-wider text-primary font-bold">{t('finances.invoice.pu')}</th>
                    <th className="text-right p-3 text-[10px] uppercase tracking-wider text-primary font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(vente.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-border/30">
                      <td className="p-3 font-semibold text-foreground">{item.nom}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${item.type === 'prestation' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                          }`}>
                          {item.type === 'prestation' ? t('finances.services') : t('finances.products')}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium">{item.quantite}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.prixUnitaire)}</td>
                      <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 mt-4">
              <div className="flex gap-8 text-sm">
                <span className="text-muted-foreground">{t('finances.invoice.subtotal')}</span>
                <span className="font-medium">{formatCurrency(vente.totalMontant)}</span>
              </div>
              <div className="flex gap-8 text-xl font-bold text-primary pt-2 mt-2 border-t-2 border-primary">
                <span className="uppercase">TOTAL</span>
                <span>{formatCurrency(vente.totalMontant)}</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <span className="inline-block px-4 py-1.5 bg-muted rounded-full text-xs font-medium">
                {t('finances.paymentMethod')}: {modePaiementLabels[vente.modePaiement] || vente.modePaiement}
              </span>
            </div>

            {vente.notes && (
              <div className="mt-6 border-t border-dashed border-primary/20 pt-4 text-left">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Notes & Recommandations post-prestation
                </p>
                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-2xl text-xs sm:text-sm italic text-foreground whitespace-pre-wrap leading-relaxed shadow-sm">
                  {vente.notes}
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-border text-center text-[11px] text-muted-foreground">
              <p>{t('finances.invoice.footer')} — {salon.name}</p>
              <p className="mt-1">{t('finances.invoice.generatedBy')}</p>
            </div>
          </div>
        </div>

        {/* Sticky footer with actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/10 border-t shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto px-6 h-11 rounded-xl text-foreground font-bold order-3 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            {t('common.close')}
          </Button>

          {onDeleteRequest && (
            <Button
              variant="destructive"
              onClick={onDeleteRequest}
              className="w-full sm:w-auto px-6 h-11 rounded-xl font-bold order-4 sm:order-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}

          <Button
            onClick={handleWhatsAppShare}
            disabled={isGeneratingPdf}
            className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white h-11 rounded-xl font-bold order-1 sm:order-3 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <WhatsAppIcon className="h-5 w-5 fill-current" />
            <span>{isGeneratingPdf ? 'Génération du PDF...' : 'Envoyer par WhatsApp'}</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="flex-1 gradient-primary h-11 rounded-xl text-white font-bold order-2 sm:order-4"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t('finances.invoice.print')}
          </Button>
        </div>

      </DialogContent>

      {/* Hidden high-resolution PDF template for html2canvas generation */}
      <div
        id="invoice-pdf-template"
        className="bg-white text-black p-10 font-sans"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '794px', // Standard A4 width at 96 DPI
          boxSizing: 'border-box'
        }}
      >
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg overflow-hidden border-2 border-white flex-shrink-0">
              {salon.logoUrl ? (
                <img src={salon.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-primary flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-black text-primary tracking-tight leading-none">{salon.name}</p>
              <div className="mt-1 space-y-0.5">
                {salon.telephone && <p className="text-xs text-muted-foreground">📞 {salon.telephone}</p>}
                {salon.adresse && <p className="text-xs text-muted-foreground">📍 {salon.adresse}</p>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase opacity-35 leading-none">{t('finances.invoice')}</h2>
            <div className="mt-2 space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('finances.invoice.number').split(':')[0]}</p>
              <p className="text-sm font-bold text-black">{invoiceNum}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-2">
                {t('finances.date')}: <span className="text-black">{formatDate(dateSafe)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 p-4 bg-muted/20 rounded-2xl border border-border/50">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t('finances.invoice.issuer')}</p>
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-black">{salon.name}</p>
              <p className="text-xs text-muted-foreground">{salon.adresse}</p>
            </div>
          </div>
          <div className="text-right border-l border-border/50 pl-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{t('finances.invoice.client')}</p>
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-primary">{getClientName(client?.id)}</p>
              {client?.telephone && <p className="text-xs text-muted-foreground font-medium">{client.telephone}</p>}
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="bg-primary/5">
              <th className="text-left p-3 text-[10px] uppercase tracking-wider text-primary font-bold border-b-2 border-primary/10">{t('finances.invoice.designation')}</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-wider text-primary font-bold border-b-2 border-primary/10">{t('finances.invoice.type')}</th>
              <th className="text-center p-3 text-[10px] uppercase tracking-wider text-primary font-bold border-b-2 border-primary/10">{t('finances.qty')}</th>
              <th className="text-right p-3 text-[10px] uppercase tracking-wider text-primary font-bold border-b-2 border-primary/10">{t('finances.invoice.pu')}</th>
              <th className="text-right p-3 text-[10px] uppercase tracking-wider text-primary font-bold border-b-2 border-primary/10">Total</th>
            </tr>
          </thead>
          <tbody>
            {(vente.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-border/30">
                <td className="p-3 font-semibold text-black">{item.nom}</td>
                <td className="p-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {item.type === 'prestation' ? t('finances.services') : t('finances.products')}
                  </span>
                </td>
                <td className="p-3 text-center font-medium">{item.quantite}</td>
                <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.prixUnitaire)}</td>
                <td className="p-3 text-right font-bold text-black">{formatCurrency(item.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col items-end gap-1 mt-6">
          <div className="flex gap-8 text-sm">
            <span className="text-muted-foreground">{t('finances.invoice.subtotal')}</span>
            <span className="font-medium text-black">{formatCurrency(vente.totalMontant)}</span>
          </div>
          <div className="flex gap-8 text-xl font-bold text-primary pt-2 mt-2 border-t-2 border-primary">
            <span className="uppercase">TOTAL</span>
            <span>{formatCurrency(vente.totalMontant)}</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-muted rounded-full text-xs font-semibold text-black">
            {t('finances.paymentMethod')}: {modePaiementLabels[vente.modePaiement] || vente.modePaiement}
          </span>
        </div>

        {vente.notes && (
          <div className="mt-8 border-t border-dashed border-primary/20 pt-4 text-left">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-1.5">
              <span>📝</span> Notes & Recommandations post-prestation
            </p>
            <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-2xl text-xs italic text-black whitespace-pre-wrap leading-relaxed shadow-sm">
              {vente.notes}
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-border text-center text-[10px] text-muted-foreground">
          <p>{t('finances.invoice.footer')} — {salon.name}</p>
          <p className="mt-1">{t('finances.invoice.generatedBy')}</p>
        </div>
      </div>
    </Dialog>
  );
}
