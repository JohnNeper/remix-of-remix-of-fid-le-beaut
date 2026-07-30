import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPlan, Plan, PlanType, PLANS } from '@/lib/plans';

export function useSubscriptionPlan() {
  const { currentSalon } = useAuth();

  const plan: Plan = useMemo(() => {
    const planName = (currentSalon as any)?.plan as PlanType | undefined;
    return getPlan(planName || 'basic');
  }, [currentSalon]);

  const getCustomerLimit = (): number | null => {
    const limit = currentSalon?.limits?.maxCustomers !== undefined 
      ? currentSalon.limits.maxCustomers 
      : plan.maxCustomers;
    return limit === -1 ? null : limit;
  };

  const getStaffLimit = (): number | null => {
    const limit = currentSalon?.limits?.maxStaff !== undefined 
      ? currentSalon.limits.maxStaff 
      : plan.maxStaff;
    return limit === -1 ? null : limit;
  };

  const getCampaignLimit = (): number | null => {
    const limit = currentSalon?.limits?.maxCampaignsPerMonth !== undefined 
      ? currentSalon.limits.maxCampaignsPerMonth 
      : plan.maxCampaignsPerMonth;
    return limit === -1 ? null : limit;
  };

  const getRendezvousLimit = (): number | null => {
    const limit = currentSalon?.limits?.maxRendezvous !== undefined 
      ? currentSalon.limits.maxRendezvous 
      : (plan as any).maxRendezvous;
    return limit === -1 || limit === undefined ? null : limit;
  };

  const canAddCustomer = (currentCount: number): boolean => {
    const limit = getCustomerLimit();
    if (limit === null) return true;
    return currentCount < limit;
  };

  const canAddStaff = (currentCount: number): boolean => {
    const limit = getStaffLimit();
    if (limit === null) return true;
    return currentCount < limit;
  };

  const canCreateCampaign = (currentMonthCount: number): boolean => {
    const limit = getCampaignLimit();
    if (limit === null) return true;
    return currentMonthCount < limit;
  };

  const canAddRendezvous = (currentCount: number): boolean => {
    const limit = getRendezvousLimit();
    if (limit === null) return true;
    return currentCount < limit;
  };

  const getUpgradePlan = (): Plan | null => {
    if (plan.name === 'premium') return null;
    if (plan.name === 'pro') return PLANS.premium;
    return PLANS.pro;
  };

  return {
    plan,
    planName: plan.name,
    canAddCustomer,
    canAddStaff,
    canCreateCampaign,
    canAddRendezvous,
    getCustomerLimit,
    getStaffLimit,
    getCampaignLimit,
    getRendezvousLimit,
    getUpgradePlan,
    // Feature flags
    hasAutomation: plan.automationEnabled,
    hasMultiBranch: plan.multiBranchEnabled,
    hasLoyaltyRules: plan.loyaltyRulesEnabled,
    hasBirthdayBonus: plan.birthdayBonusEnabled,
    hasStockHistory: plan.stockHistoryEnabled,
    hasExport: plan.exportEnabled,
    hasScheduledCampaigns: plan.scheduledCampaignsEnabled,
    hasCustomerSegmentation: plan.customerSegmentationEnabled,
    hasProfitEstimation: plan.profitEstimationEnabled,
    hasPrioritySupport: plan.prioritySupport,
    hasCampaigns: plan.campaignsEnabled,
    isBasic: plan.name === 'basic',
    isPro: plan.name === 'pro',
    isPremium: plan.name === 'premium',
    analyticsLevel: plan.analyticsLevel,
  };
}
