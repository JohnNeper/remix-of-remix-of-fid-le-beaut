import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PawaPayCheckout } from '@/components/payment/PawaPayCheckout';
import { PlanType, PLANS } from '@/lib/plans';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey: PlanType;
  salonId: string;
  onSuccess?: () => void;
}

export default function PaymentModal({ open, onOpenChange, planKey, salonId, onSuccess }: Props) {
  const planInfo = PLANS[planKey];
  const amount = planInfo ? parseInt(planInfo.price.toString().replace(/\s/g, '')) : 5000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-transparent border-none shadow-none">
        <PawaPayCheckout 
          salonId={salonId}
          plan={planKey}
          amount={amount}
          onPaymentComplete={() => {
            if (onSuccess) onSuccess();
            else window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
