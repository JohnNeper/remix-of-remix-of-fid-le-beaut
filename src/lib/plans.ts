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
    maxCampaignsPerMonth: 0,
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
    campaignsEnabled: false,
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
    campaignsEnabled: true,
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
    campaignsEnabled: true,
    description: 'Pour les instituts structurés',
    descriptionEn: 'For structured beauty institutes',
  },
};

export function updatePlanPrices(backendPlans: any[]) {
  backendPlans.forEach((bp) => {
    const key = bp.key as PlanType;
    if (PLANS[key]) {
      PLANS[key].price = bp.price;
      if (bp.maxCustomers !== undefined) PLANS[key].maxCustomers = bp.maxCustomers;
      if (bp.maxStaff !== undefined) PLANS[key].maxStaff = bp.maxStaff;
      if (bp.maxCampaignsPerMonth !== undefined) PLANS[key].maxCampaignsPerMonth = bp.maxCampaignsPerMonth;
      if (bp.campaignsEnabled !== undefined) PLANS[key].campaignsEnabled = bp.campaignsEnabled;
      if (bp.exportEnabled !== undefined) PLANS[key].exportEnabled = bp.exportEnabled;
      if (bp.analyticsLevel !== undefined) PLANS[key].analyticsLevel = bp.analyticsLevel as 'basic' | 'detailed' | 'advanced';
      if (bp.automationEnabled !== undefined) PLANS[key].automationEnabled = bp.automationEnabled;
      if (bp.multiBranchEnabled !== undefined) PLANS[key].multiBranchEnabled = bp.multiBranchEnabled;
      if (bp.loyaltyRulesEnabled !== undefined) PLANS[key].loyaltyRulesEnabled = bp.loyaltyRulesEnabled;
      if (bp.birthdayBonusEnabled !== undefined) PLANS[key].birthdayBonusEnabled = bp.birthdayBonusEnabled;
      if (bp.stockHistoryEnabled !== undefined) PLANS[key].stockHistoryEnabled = bp.stockHistoryEnabled;
      if (bp.scheduledCampaignsEnabled !== undefined) PLANS[key].scheduledCampaignsEnabled = bp.scheduledCampaignsEnabled;
      if (bp.customerSegmentationEnabled !== undefined) PLANS[key].customerSegmentationEnabled = bp.customerSegmentationEnabled;
      if (bp.profitEstimationEnabled !== undefined) PLANS[key].profitEstimationEnabled = bp.profitEstimationEnabled;
      if (bp.prioritySupport !== undefined) PLANS[key].prioritySupport = bp.prioritySupport;
      if (bp.description !== undefined) PLANS[key].description = bp.description;
      if (bp.descriptionEn !== undefined) PLANS[key].descriptionEn = bp.descriptionEn;
    }
  });
}

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
