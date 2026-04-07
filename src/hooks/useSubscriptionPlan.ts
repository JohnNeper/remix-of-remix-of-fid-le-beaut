import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPlan, Plan, PlanType, PLANS } from '@/lib/plans';

export function useSubscriptionPlan() {
  const { currentSalon } = useAuth();

  const plan: Plan = useMemo(() => {
    const planName = (currentSalon as any)?.plan as PlanType | undefined;
    return getPlan(planName || 'basic');
  }, [currentSalon]);

  const canAddCustomer = (currentCount: number): boolean => {
    if (plan.maxCustomers === -1) return true;
    return currentCount < plan.maxCustomers;
  };

  const canAddStaff = (currentCount: number): boolean => {
    if (plan.maxStaff === -1) return true;
    return currentCount < plan.maxStaff;
  };

  const canCreateCampaign = (currentMonthCount: number): boolean => {
    if (plan.maxCampaignsPerMonth === -1) return true;
    return currentMonthCount < plan.maxCampaignsPerMonth;
  };

  const getCustomerLimit = (): number | null => {
    return plan.maxCustomers === -1 ? null : plan.maxCustomers;
  };

  const getStaffLimit = (): number | null => {
    return plan.maxStaff === -1 ? null : plan.maxStaff;
  };

  const getCampaignLimit = (): number | null => {
    return plan.maxCampaignsPerMonth === -1 ? null : plan.maxCampaignsPerMonth;
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
    getCustomerLimit,
    getStaffLimit,
    getCampaignLimit,
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
    isBasic: plan.name === 'basic',
    isPro: plan.name === 'pro',
    isPremium: plan.name === 'premium',
    analyticsLevel: plan.analyticsLevel,
  };
}
