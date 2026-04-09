// Subscription Plans Configuration for BeautyFlow SaaS

export type PlanType = 'basic' | 'pro' | 'premium';

export interface Plan {
  name: PlanType;
  label: string;
  labelEn: string;
  price: number; // FCFA/month
  maxCustomers: number; // -1 = unlimited
  maxStaff: number; // -1 = unlimited
  maxCampaignsPerMonth: number; // -1 = unlimited, 0 = disabled
  analyticsLevel: 'basic' | 'detailed' | 'advanced';
  automationEnabled: boolean;
  multiBranchEnabled: boolean;
  loyaltyRulesEnabled: boolean;
  birthdayBonusEnabled: boolean;
  stockHistoryEnabled: boolean;
  exportEnabled: boolean;
  scheduledCampaignsEnabled: boolean;
  customerSegmentationEnabled: boolean;
  profitEstimationEnabled: boolean;
  prioritySupport: boolean;
  campaignsEnabled: boolean; // whether campaigns module is accessible at all
  description: string;
  descriptionEn: string;
}

export const PLANS: Record<PlanType, Plan> = {
  basic: {
    name: 'basic',
    label: 'BASIC',
    labelEn: 'BASIC',
    price: 5000,
    maxCustomers: 300,
    maxStaff: 2,
    maxCampaignsPerMonth: 1,
    analyticsLevel: 'basic',
    automationEnabled: false,
    multiBranchEnabled: false,
    loyaltyRulesEnabled: false,
    birthdayBonusEnabled: false,
    stockHistoryEnabled: false,
    exportEnabled: false,
    scheduledCampaignsEnabled: false,
    customerSegmentationEnabled: false,
    profitEstimationEnabled: false,
    prioritySupport: false,
    description: 'Pour les petits salons (1-3 employés)',
    descriptionEn: 'For small salons (1-3 staff)',
  },
  pro: {
    name: 'pro',
    label: 'PRO',
    labelEn: 'PRO',
    price: 20000,
    maxCustomers: -1,
    maxStaff: 6,
    maxCampaignsPerMonth: 5,
    analyticsLevel: 'detailed',
    automationEnabled: false,
    multiBranchEnabled: false,
    loyaltyRulesEnabled: true,
    birthdayBonusEnabled: true,
    stockHistoryEnabled: true,
    exportEnabled: true,
    scheduledCampaignsEnabled: true,
    customerSegmentationEnabled: true,
    profitEstimationEnabled: true,
    prioritySupport: false,
    description: 'Pour les salons en croissance',
    descriptionEn: 'For growing salons',
  },
  premium: {
    name: 'premium',
    label: 'PREMIUM',
    labelEn: 'PREMIUM',
    price: 30000,
    maxCustomers: -1,
    maxStaff: -1,
    maxCampaignsPerMonth: -1,
    analyticsLevel: 'advanced',
    automationEnabled: true,
    multiBranchEnabled: true,
    loyaltyRulesEnabled: true,
    birthdayBonusEnabled: true,
    stockHistoryEnabled: true,
    exportEnabled: true,
    scheduledCampaignsEnabled: true,
    customerSegmentationEnabled: true,
    profitEstimationEnabled: true,
    prioritySupport: true,
    description: 'Pour les instituts structurés',
    descriptionEn: 'For structured beauty institutes',
  },
};

export function getPlan(planName: PlanType): Plan {
  return PLANS[planName] || PLANS.basic;
}

export function getPlanColor(plan: PlanType): string {
  switch (plan) {
    case 'basic': return 'bg-muted text-muted-foreground';
    case 'pro': return 'bg-primary/20 text-primary';
    case 'premium': return 'bg-accent/20 text-accent';
  }
}

export function formatPlanPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA/mois';
}
