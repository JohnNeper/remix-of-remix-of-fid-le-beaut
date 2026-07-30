import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Normalize phone number for direct WhatsApp link targeting (adding international country code prefix)
 */
export function formatPhoneForWhatsApp(clientPhone: string, salonPhone: string): string {
  const cleanClient = clientPhone.replace(/\D/g, '');
  const cleanSalon = salonPhone.replace(/\D/g, '');

  if (clientPhone.startsWith('+') || (cleanClient.length > 10 && cleanClient.startsWith(cleanSalon.slice(0, 3)))) {
    return cleanClient;
  }

  // Prepend country code from salon number if detected
  let countryCode = '221'; // default to Senegal (+221)
  if (salonPhone.startsWith('+')) {
    const matches = salonPhone.match(/^\+(\d{1,4})/);
    if (matches) {
      countryCode = matches[1];
    }
  } else if (cleanSalon.startsWith('221') || cleanSalon.startsWith('225') || cleanSalon.startsWith('237') || cleanSalon.startsWith('33')) {
    if (cleanSalon.startsWith('221')) countryCode = '221';
    else if (cleanSalon.startsWith('225')) countryCode = '225';
    else if (cleanSalon.startsWith('237')) countryCode = '237';
    else if (cleanSalon.startsWith('33')) countryCode = '33';
  }

  let localNum = cleanClient;
  if ((countryCode === '33' || countryCode === '225') && localNum.startsWith('0')) {
    localNum = localNum.slice(1); // strip leading 0 for France and Ivory Coast local format
  }

  return `${countryCode}${localNum}`;
}

export interface SharePdfViaWhatsAppParams {
  /** The ID of the HTML element to capture as a PDF */
  elementId: string;
  /** The desired name for the downloaded PDF file */
  filename: string;
  /** The pre-filled message text to send via WhatsApp */
  messageText: string;
  /** The client's raw phone number */
  clientPhoneRaw?: string;
  /** The salon's phone number, used as a fallback to infer the country code */
  salonPhone?: string;
  /** Callback triggered when generation starts */
  onStart?: () => void;
  /** Callback triggered when the process ends (success or error) */
  onEnd?: () => void;
}

/**
 * Generates a high-quality PDF from an HTML element and initiates sharing via WhatsApp.
 * Uses native Web Share API on mobile, or falls back to standard download + WhatsApp Web on Desktop.
 */
export async function shareHtmlAsPdfViaWhatsApp(params: SharePdfViaWhatsAppParams): Promise<void> {
  const { elementId, filename, messageText, clientPhoneRaw, salonPhone, onStart, onEnd } = params;

  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("Impossible de trouver le document à partager.");
    return;
  }

  if (onStart) onStart();

  try {
    // 1. Capture content as Canvas (using CORS for logo support)
    const canvas = await html2canvas(element, {
      scale: 2, // Retain high font crispness
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');

    // 2. Generate PDF page layout
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');

    // 3. Normalize client phone number for WhatsApp target redirection
    const waPhone = clientPhoneRaw ? formatPhoneForWhatsApp(clientPhoneRaw, salonPhone || '') : '';
    const encodedText = encodeURIComponent(messageText);

    // 4. Mobile share API
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    const canShare = typeof navigator !== 'undefined' && 
                     'canShare' in navigator && 
                     (navigator as any).canShare({ files: [file] });

    // Si on a un numéro spécifique ciblé, on ne passe PAS par le partage natif (qui force à chercher le contact).
    // On passe directement à l'étape 5 pour ouvrir la discussion automatiquement.
    if (canShare && !waPhone) {
      try {
        await navigator.share({
          files: [file],
          title: filename,
          text: messageText,
        });
        toast.success("Document partagé avec succès !");
        if (onEnd) onEnd();
        return;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          if (onEnd) onEnd();
          return;
        }
        console.warn("navigator.share failed, fallback to download & direct link", shareErr);
      }
    }

    // 5. Desktop/Fallback: Download PDF and redirect to target client WhatsApp chat
    const urlBlob = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlBlob);

    const waUrl = waPhone 
      ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(waUrl, '_blank');
    toast.success("PDF téléchargé ! Glissez-le dans la discussion WhatsApp.");
  } catch (err: any) {
    console.error("PDF/Share Error:", err);
    toast.error("Erreur lors de la génération du PDF.");
  } finally {
    if (onEnd) onEnd();
  }
}
