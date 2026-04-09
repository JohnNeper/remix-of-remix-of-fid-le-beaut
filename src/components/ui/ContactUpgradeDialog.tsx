import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, ArrowUpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plan, formatPlanPrice, getPlanColor } from '@/lib/plans';

interface ContactUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  currentPlan?: string;
  requiredPlan: Plan | null;
}

export function ContactUpgradeDialog({ open, onOpenChange, feature, currentPlan, requiredPlan }: ContactUpgradeDialogProps) {
  const { language } = useLanguage();

  if (!requiredPlan) return null;

  const whatsappNumber = '237600000000'; // LeaderBright contact
  const whatsappMessage = encodeURIComponent(
    `Bonjour LeaderBright,\nJe souhaite passer au plan ${requiredPlan.label} pour mon salon.\nPlan actuel : ${currentPlan?.toUpperCase() || 'BASIC'}\nMerci !`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            {language === 'fr' ? 'Changer de plan' : 'Upgrade plan'}
          </DialogTitle>
          <DialogDescription>
            {feature && (
              <span className="block mb-2 text-sm">
                {language === 'fr' ? 'Pour débloquer' : 'To unlock'}: <strong>{feature}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border text-center space-y-2">
          <Badge className={`${getPlanColor(requiredPlan.name)} text-sm px-3 py-1`}>
            {requiredPlan.label}
          </Badge>
          <p className="text-lg font-bold">{formatPlanPrice(requiredPlan.price)}</p>
          <p className="text-xs text-muted-foreground">
            {language === 'fr' ? requiredPlan.description : requiredPlan.descriptionEn}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            className="w-full gradient-primary"
            onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Contacter via WhatsApp' : 'Contact via WhatsApp'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('tel:+237600000000')}
          >
            <Phone className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Appeler' : 'Call'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('mailto:contact@leaderbright.com')}
          >
            <Mail className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Envoyer un email' : 'Send an email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
