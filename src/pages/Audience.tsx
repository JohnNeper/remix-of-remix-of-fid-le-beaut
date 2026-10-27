import React, { useEffect, useState, useMemo } from 'react';
import {
  Eye, ShoppingCart, CheckCircle2, TrendingUp, MessageSquare, Mail, Phone, Search,
  Sparkles, RefreshCw, Share2, Copy, Send, Filter, Zap, Clock, Users,
  Check, Download, UserPlus, Flame, ChevronRight, BarChart2, Layers,
  CheckCircle, Smartphone, Globe, PhoneCall, LayoutGrid, Table as TableIcon,
  UserCheck, ChevronDown, ChevronUp, History, X, Lock, Crown, ChevronLeft,
  ChevronsLeft, ChevronsRight, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSalon } from '@/hooks/useSalon';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslations } from '@/hooks/useTranslations';
import { PlanType, getPlan } from '@/lib/plans';
import { PlanComparisonDialog } from '@/components/settings/PlanComparisonDialog';
import PaymentModal from '@/components/settings/PaymentModal';

export interface ProspectFollowUp {
  status: 'pending' | 'contacted' | 'converted' | 'dropped';
  notes?: string;
  updatedAt?: string;
}

export interface GroupedProspect {
  id: string;
  name: string;
  phone: string;
  email: string;
  appUser?: string;
  totalEvents: number;
  visitsCount: number;
  startsCount: number;
  completedCount: number;
  highestIntent: 'booking_completed' | 'booking_started' | 'view_page';
  services: string[];
  devices: string[];
  firstSeen: string;
  lastSeen: string;
  events: any[];
  followUpStatus: ProspectFollowUp['status'];
}

const BASIC_PROSPECT_LIMIT = 10;

export default function Audience() {
  const { salon, refetch: refetchSalon } = useSalon();
  const { clients } = useClients();
  const { currentSalon } = useAuth();
  const { plan: subPlan, planName: subPlanName } = useSubscriptionPlan();
  const { t, language, formatDate } = useTranslations();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedAllPhones, setCopiedAllPhones] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dynamically Detect Salon's Current Plan with all robust fallbacks
  const currentPlanName = useMemo<PlanType>(() => {
    const raw = (
      salon?.plan ||
      (salon as any)?.abonnement?.plan ||
      (salon as any)?.subscriptionPlan ||
      (salon as any)?.typeAbonnement ||
      (currentSalon as any)?.plan ||
      (currentSalon as any)?.planAbonnement ||
      (currentSalon as any)?.abonnement?.plan ||
      subPlanName ||
      'basic'
    ).toString().toLowerCase().trim();

    if (raw.includes('premium')) return 'premium';
    if (raw.includes('pro')) return 'pro';
    return 'basic';
  }, [salon, currentSalon, subPlanName]);

  const currentPlan = getPlan(currentPlanName);
  const isBasic = currentPlanName === 'basic';
  const isPro = currentPlanName === 'pro';
  const isPremium = currentPlanName === 'premium';

  // Upgrade Dialog & Payment Modal State
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleUpgradePlan = (targetPlan: PlanType) => {
    setSelectedUpgradePlan(targetPlan);
    setIsPaymentModalOpen(true);
    setIsComparisonOpen(false);
  };

  const [stats, setStats] = useState({
    totalViews: 0,
    totalBookingStarts: 0,
    totalConfirmedBookings: 0,
    conversionRate: '0'
  });
  const [events, setEvents] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeChartTab, setActiveChartTab] = useState<string>('evolution');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [groupingMode, setGroupingMode] = useState<'grouped' | 'raw'>('grouped');
  const [expandedProspects, setExpandedProspects] = useState<Record<string, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Follow-up status persistence (local storage keyed by salonId)
  const salonKey = salon?._id || salon?.id || 'default';
  const followUpStorageKey = `bf_analytics_followup_${salonKey}`;
  const [followUps, setFollowUps] = useState<Record<string, ProspectFollowUp>>(() => {
    try {
      return JSON.parse(localStorage.getItem(followUpStorageKey) || '{}');
    } catch {
      return {};
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedProspects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveFollowUp = (key: string, status: ProspectFollowUp['status'], notes?: string) => {
    const updated = {
      ...followUps,
      [key]: {
        status,
        notes: notes !== undefined ? notes : followUps[key]?.notes,
        updatedAt: new Date().toISOString()
      }
    };
    setFollowUps(updated);
    try {
      localStorage.setItem(followUpStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save follow up state:', e);
    }
    toast({
      title: t('analytics.statusUpdated'),
      description: status === 'contacted'
        ? t('analytics.statusContactedToast')
        : status === 'converted'
          ? t('analytics.statusConvertedToast')
          : t('analytics.statusSavedToast')
    });
  };

  // WhatsApp Relance Modal State
  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState<string>('');

  // Add Client Modal State
  const [addClientProspect, setAddClientProspect] = useState<any | null>(null);
  const [clientFormData, setClientFormData] = useState({ nom: '', telephone: '', email: '', notes: '' });
  const [savingClient, setSavingClient] = useState(false);

  // Client lookup map by phone for instant recognition
  const clientsByPhone = useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(clients)) {
      clients.forEach(c => {
        if (c.telephone) {
          const clean = c.telephone.replace(/\D/g, '');
          if (clean) map.set(clean, c);
        }
      });
    }
    return map;
  }, [clients]);

  const fetchAnalytics = (silent = false) => {
    if (!salon) return;
    if (!silent) setLoading(true);
    const salonId = salon._id || salon.id;
    const salonSlug = salon.slug;

    // Read local events queue fallback
    const local1 = JSON.parse(localStorage.getItem(`bf_analytics_${salonId}`) || '[]');
    const local2 = salonSlug ? JSON.parse(localStorage.getItem(`bf_analytics_${salonSlug}`) || '[]') : [];
    const localEvents = [...local1, ...local2];

    api.getSalonAnalytics(salonId)
      .then((res) => {
        let apiEvents: any[] = [];
        let apiStats = { totalViews: 0, totalBookingStarts: 0, totalConfirmedBookings: 0, conversionRate: '0' };

        if (res) {
          if (Array.isArray(res)) {
            apiEvents = res;
          } else if (Array.isArray(res.events)) {
            apiEvents = res.events;
            apiStats = res.stats || apiStats;
          } else if (res.data && Array.isArray(res.data.events)) {
            apiEvents = res.data.events;
            apiStats = res.data.stats || apiStats;
          } else if (res.data && Array.isArray(res.data)) {
            apiEvents = res.data;
          } else if (res.events) {
            apiEvents = res.events;
            apiStats = res.stats || apiStats;
          }
        }

        // Merge local & API events, deduplicating
        const mergedMap = new Map();
        [...localEvents, ...apiEvents].forEach(ev => {
          if (ev && (ev._id || ev.createdAt)) {
            const key = ev._id || `${ev.createdAt}_${ev.customerPhone || ''}_${ev.eventType}`;
            mergedMap.set(key, ev);
          }
        });
        const combinedEvents = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const views = combinedEvents.filter(e => e.eventType === 'view_page').length;
        const starts = combinedEvents.filter(e => e.eventType === 'booking_started').length;
        const completed = combinedEvents.filter(e => e.eventType === 'booking_completed').length;
        const totalV = Math.max(views, Number(apiStats.totalViews || 0));
        const totalC = Math.max(completed, Number(apiStats.totalConfirmedBookings || 0));
        const conversion = totalV > 0 ? ((totalC / totalV) * 100).toFixed(1) : apiStats.conversionRate;

        setStats({
          totalViews: totalV,
          totalBookingStarts: Math.max(starts, Number(apiStats.totalBookingStarts || 0)),
          totalConfirmedBookings: totalC,
          conversionRate: String(conversion)
        });
        setEvents(combinedEvents);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.warn('Analytics backend fallback to local:', err);
        const mergedMap = new Map();
        localEvents.forEach(ev => {
          if (ev && (ev._id || ev.createdAt)) {
            const key = ev._id || `${ev.createdAt}_${ev.customerPhone || ''}_${ev.eventType}`;
            mergedMap.set(key, ev);
          }
        });
        const combinedEvents = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const views = combinedEvents.filter(e => e.eventType === 'view_page').length;
        const starts = combinedEvents.filter(e => e.eventType === 'booking_started').length;
        const completed = combinedEvents.filter(e => e.eventType === 'booking_completed').length;
        const conversion = views > 0 ? ((completed / views) * 100).toFixed(1) : '0';

        setStats({
          totalViews: views,
          totalBookingStarts: starts,
          totalConfirmedBookings: completed,
          conversionRate: String(conversion)
        });
        setEvents(combinedEvents);
        setLastUpdated(new Date());
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  // Initial load + 8-second automatic live sync
  useEffect(() => {
    if (salon) {
      fetchAnalytics(false);
      const interval = setInterval(() => {
        fetchAnalytics(true);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [salon?._id, salon?.id]);

  const publicUrl = useMemo(() => {
    if (!salon) return '';
    return `https://www.beautyflowafrica.com/booking/${salon.slug || salon._id || salon.id}`;
  }, [salon]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast({
      title: t('analytics.linkCopied'),
      description: t('analytics.linkCopiedDesc')
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsAppStatus = () => {
    const salonName = salon?.nom || salon?.name || (language === 'fr' ? 'notre salon' : 'our salon');
    const text = t('analytics.waShareText', { salon: salonName, url: publicUrl });
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Time range filter with plan tier check
  const handleSelectTimeRange = (range: 'all' | 'today' | 'week' | 'month') => {
    if (isBasic && (range === 'month' || range === 'all')) {
      toast({
        title: t('analytics.plan.periodLocked'),
        description: t('analytics.plan.basicLimitAlert', { limit: BASIC_PROSPECT_LIMIT, total: groupedProspects.length }),
      });
      setIsComparisonOpen(true);
      return;
    }
    setTimeRange(range);
    setCurrentPage(1);
  };

  // Filter events by time range
  const timeFilteredEvents = useMemo(() => {
    if (timeRange === 'all') return events;
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const daysLimit = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
    return events.filter(ev => {
      const evTime = new Date(ev.createdAt).getTime();
      return (now - evTime) <= (daysLimit * oneDay);
    });
  }, [events, timeRange]);

  // Helper to extract device info from userAgent
  const getDeviceLabel = (ua?: string) => {
    if (!ua) return { label: 'Web', icon: Globe };
    if (/iPhone|iPad|iPod/i.test(ua)) return { label: 'iPhone / iOS', icon: Smartphone };
    if (/Android/i.test(ua)) return { label: 'Android', icon: Smartphone };
    if (/Mobile/i.test(ua)) return { label: 'Mobile', icon: Smartphone };
    return { label: language === 'fr' ? 'Ordinateur' : 'Desktop', icon: Globe };
  };

  // Group multiple events of the SAME client/prospect together
  const groupedProspects = useMemo<GroupedProspect[]>(() => {
    const map = new Map<string, GroupedProspect>();

    timeFilteredEvents.forEach(ev => {
      const cleanPhone = (ev.customerPhone || '').replace(/\D/g, '');
      const cleanEmail = (ev.customerEmail || '').toLowerCase().trim();
      const appUserId = ev.appUser ? (typeof ev.appUser === 'object' ? ev.appUser._id : ev.appUser) : null;

      // Grouping key hierarchy: Phone > Email > AppUser > Name > Event ID
      let groupKey = '';
      if (cleanPhone) {
        groupKey = `phone_${cleanPhone}`;
      } else if (cleanEmail) {
        groupKey = `email_${cleanEmail}`;
      } else if (appUserId) {
        groupKey = `user_${appUserId}`;
      } else if (ev.customerName && ev.customerName !== 'Visiteur Anonyme') {
        groupKey = `name_${ev.customerName.toLowerCase().trim()}`;
      } else {
        groupKey = `event_${ev._id || ev.createdAt}`;
      }

      const existing = map.get(groupKey);
      const isStart = ev.eventType === 'booking_started';
      const isCompleted = ev.eventType === 'booking_completed';
      const isView = ev.eventType === 'view_page';
      const device = getDeviceLabel(ev.userAgent).label;
      const followUp = followUps[groupKey]?.status || followUps[ev._id]?.status || (isCompleted ? 'converted' : 'pending');

      const anonymousLabel = t('analytics.anonymous');
      const eventName = ev.customerName && ev.customerName !== 'Visiteur Anonyme' && ev.customerName !== anonymousLabel
        ? ev.customerName
        : anonymousLabel;

      if (!existing) {
        map.set(groupKey, {
          id: groupKey,
          name: eventName,
          phone: ev.customerPhone || '',
          email: ev.customerEmail || '',
          appUser: appUserId,
          totalEvents: 1,
          visitsCount: isView ? 1 : 0,
          startsCount: isStart ? 1 : 0,
          completedCount: isCompleted ? 1 : 0,
          highestIntent: isCompleted ? 'booking_completed' : isStart ? 'booking_started' : 'view_page',
          services: Array.isArray(ev.selectedServices) ? [...ev.selectedServices] : [],
          devices: [device],
          firstSeen: ev.createdAt,
          lastSeen: ev.createdAt,
          events: [ev],
          followUpStatus: followUp
        });
      } else {
        existing.totalEvents += 1;
        if (isView) existing.visitsCount += 1;
        if (isStart) existing.startsCount += 1;
        if (isCompleted) existing.completedCount += 1;

        if (
          (existing.name === anonymousLabel || existing.name === 'Visiteur Anonyme') &&
          ev.customerName &&
          ev.customerName !== 'Visiteur Anonyme' &&
          ev.customerName !== anonymousLabel
        ) {
          existing.name = ev.customerName;
        }
        if (!existing.phone && ev.customerPhone) existing.phone = ev.customerPhone;
        if (!existing.email && ev.customerEmail) existing.email = ev.customerEmail;

        if (isCompleted) {
          existing.highestIntent = 'booking_completed';
        } else if (isStart && existing.highestIntent !== 'booking_completed') {
          existing.highestIntent = 'booking_started';
        }

        if (Array.isArray(ev.selectedServices)) {
          ev.selectedServices.forEach(s => {
            if (s && !existing.services.includes(s)) existing.services.push(s);
          });
        }

        if (!existing.devices.includes(device)) existing.devices.push(device);

        if (new Date(ev.createdAt).getTime() > new Date(existing.lastSeen).getTime()) {
          existing.lastSeen = ev.createdAt;
        }
        if (new Date(ev.createdAt).getTime() < new Date(existing.firstSeen).getTime()) {
          existing.firstSeen = ev.createdAt;
        }

        existing.events.push(ev);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [timeFilteredEvents, followUps, language, t]);

  // Computed stats based on current time filter
  const currentStats = useMemo(() => {
    const views = timeFilteredEvents.filter(e => e.eventType === 'view_page').length;
    const starts = timeFilteredEvents.filter(e => e.eventType === 'booking_started').length;
    const completed = timeFilteredEvents.filter(e => e.eventType === 'booking_completed').length;
    const withPhone = groupedProspects.filter(p => Boolean(p.phone)).length;
    const conversion = views > 0 ? ((completed / views) * 100).toFixed(1) : (stats.conversionRate || '0');
    const contactRate = views > 0 ? ((withPhone / Math.max(groupedProspects.length, 1)) * 100).toFixed(0) : '0';

    return {
      views: timeRange === 'all' ? Math.max(views, stats.totalViews) : views,
      starts: timeRange === 'all' ? Math.max(starts, stats.totalBookingStarts) : starts,
      completed: timeRange === 'all' ? Math.max(completed, stats.totalConfirmedBookings) : completed,
      withPhone,
      uniqueProspects: groupedProspects.length,
      conversionRate: timeRange === 'all' ? stats.conversionRate : conversion,
      contactRate
    };
  }, [timeFilteredEvents, groupedProspects, stats, timeRange]);

  // Filter grouped prospects by active tab & search
  const filteredGroupedProspects = useMemo(() => {
    return groupedProspects.filter(p => {
      let matchTab = true;
      if (activeTab === 'starts') matchTab = p.startsCount > 0 && p.highestIntent !== 'booking_completed';
      else if (activeTab === 'views') matchTab = p.highestIntent === 'view_page';
      else if (activeTab === 'completed') matchTab = p.highestIntent === 'booking_completed';
      else if (activeTab === 'hot_leads') matchTab = Boolean(p.phone);
      else if (activeTab === 'pending') matchTab = p.followUpStatus === 'pending' && Boolean(p.phone);
      else if (activeTab === 'contacted') matchTab = p.followUpStatus === 'contacted';
      else if (activeTab === 'converted') matchTab = p.followUpStatus === 'converted' || p.highestIntent === 'booking_completed';

      let matchSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        matchSearch = p.name.toLowerCase().includes(term) ||
          p.phone.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.services.some(s => s.toLowerCase().includes(term));
      }

      return matchTab && matchSearch;
    });
  }, [groupedProspects, activeTab, searchTerm]);

  // Accessible grouped prospects (Capped only if on Basic and list exceeds limit)
  const accessibleGroupedProspects = useMemo(() => {
    if (isBasic) {
      return filteredGroupedProspects.slice(0, BASIC_PROSPECT_LIMIT);
    }
    return filteredGroupedProspects;
  }, [filteredGroupedProspects, isBasic]);

  // Paginated Grouped Prospects
  const totalGroupedPages = useMemo(() => {
    return Math.max(1, Math.ceil(accessibleGroupedProspects.length / pageSize));
  }, [accessibleGroupedProspects.length, pageSize]);

  const paginatedGroupedProspects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return accessibleGroupedProspects.slice(start, start + pageSize);
  }, [accessibleGroupedProspects, currentPage, pageSize]);

  // Raw events filtered for raw mode
  const filteredRawEvents = useMemo(() => {
    return timeFilteredEvents.filter(ev => {
      let matchTab = true;
      if (activeTab === 'starts') matchTab = ev.eventType === 'booking_started';
      else if (activeTab === 'views') matchTab = ev.eventType === 'view_page';
      else if (activeTab === 'completed') matchTab = ev.eventType === 'booking_completed';
      else if (activeTab === 'hot_leads') matchTab = Boolean(ev.customerPhone);

      let matchSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        matchSearch = (ev.customerName || '').toLowerCase().includes(term) ||
          (ev.customerPhone || '').toLowerCase().includes(term) ||
          (ev.customerEmail || '').toLowerCase().includes(term) ||
          (ev.selectedServices || []).some((s: string) => s.toLowerCase().includes(term));
      }

      return matchTab && matchSearch;
    });
  }, [timeFilteredEvents, activeTab, searchTerm]);

  // Accessible raw events (Capped only on Basic)
  const accessibleRawEvents = useMemo(() => {
    if (isBasic) {
      return filteredRawEvents.slice(0, BASIC_PROSPECT_LIMIT * 2);
    }
    return filteredRawEvents;
  }, [filteredRawEvents, isBasic]);

  // Paginated Raw Events
  const totalRawPages = useMemo(() => {
    return Math.max(1, Math.ceil(accessibleRawEvents.length / pageSize));
  }, [accessibleRawEvents.length, pageSize]);

  const paginatedRawEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return accessibleRawEvents.slice(start, start + pageSize);
  }, [accessibleRawEvents, currentPage, pageSize]);

  // Reset page when filter controls change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, timeRange, groupingMode, pageSize]);

  // Hot leads (cart abandons or visitors with phone waiting for relance)
  const hotLeads = useMemo(() => {
    return groupedProspects.filter(p => Boolean(p.phone) && p.followUpStatus === 'pending' && p.highestIntent !== 'booking_completed');
  }, [groupedProspects]);

  // Copy phone numbers with plan tier check
  const handleCopyAllPhones = () => {
    const phoneSet = new Set<string>();
    const sourceList = isBasic ? accessibleGroupedProspects : groupedProspects;
    sourceList.forEach(p => {
      if (p.phone) {
        phoneSet.add(p.phone.trim());
      }
    });

    const phoneList = Array.from(phoneSet).join(', ');
    if (!phoneList) {
      toast({
        title: t('analytics.noPhones'),
        description: t('analytics.noPhonesDesc'),
        variant: 'destructive'
      });
      return;
    }

    navigator.clipboard.writeText(phoneList);
    setCopiedAllPhones(true);
    toast({
      title: t('analytics.phonesCopied', { count: phoneSet.size }),
      description: isBasic && groupedProspects.filter(p => p.phone).length > phoneSet.size
        ? t('analytics.plan.copyPhonesLocked', { count: groupedProspects.filter(p => p.phone).length })
        : t('analytics.phonesCopiedDesc')
    });
    setTimeout(() => setCopiedAllPhones(false), 3000);
  };

  // Evolution Time-series Data
  const evolutionData = useMemo(() => {
    const daysMap = new Map<string, { date: string; vues: number; abandons: number; confirmes: number }>();
    const count = timeRange === 'today' ? 24 : timeRange === 'week' ? 7 : 14;

    if (timeRange === 'today') {
      for (let i = 0; i < 24; i++) {
        const label = `${String(i).padStart(2, '0')}h`;
        daysMap.set(label, { date: label, vues: 0, abandons: 0, confirmes: 0 });
      }
      timeFilteredEvents.forEach(ev => {
        const d = new Date(ev.createdAt);
        const label = `${String(d.getHours()).padStart(2, '0')}h`;
        const entry = daysMap.get(label);
        if (entry) {
          if (ev.eventType === 'view_page') entry.vues += 1;
          else if (ev.eventType === 'booking_started') entry.abandons += 1;
          else if (ev.eventType === 'booking_completed') entry.confirmes += 1;
        }
      });
    } else {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' });
        daysMap.set(key, { date: key, vues: 0, abandons: 0, confirmes: 0 });
      }
      timeFilteredEvents.forEach(ev => {
        const d = new Date(ev.createdAt);
        const key = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' });
        const entry = daysMap.get(key);
        if (entry) {
          if (ev.eventType === 'view_page') entry.vues += 1;
          else if (ev.eventType === 'booking_started') entry.abandons += 1;
          else if (ev.eventType === 'booking_completed') entry.confirmes += 1;
        }
      });
    }

    return Array.from(daysMap.values());
  }, [timeFilteredEvents, timeRange, language]);

  // Top services consulted
  const topServicesData = useMemo(() => {
    const map = new Map<string, number>();
    timeFilteredEvents.forEach(ev => {
      if (Array.isArray(ev.selectedServices)) {
        ev.selectedServices.forEach((s: string) => {
          if (s && typeof s === 'string') {
            map.set(s, (map.get(s) || 0) + 1);
          }
        });
      }
    });

    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    if (list.length === 0) {
      return [{ name: t('analytics.globalBeautyCare'), count: currentStats.views || 1 }];
    }
    return list;
  }, [timeFilteredEvents, currentStats, t]);

  // Hourly traffic distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      visites: 0,
      interet: 0
    }));
    timeFilteredEvents.forEach(ev => {
      const h = new Date(ev.createdAt).getHours();
      if (hours[h]) {
        if (ev.eventType === 'view_page') hours[h].visites += 1;
        else hours[h].interet += 1;
      }
    });
    return hours;
  }, [timeFilteredEvents]);

  // Radar Spiderweb Chart
  const radarData = useMemo(() => {
    const views = currentStats.views || 0;
    const starts = currentStats.starts || 0;
    const confirmed = currentStats.completed || 0;
    const conversion = parseFloat(currentStats.conversionRate || '0');
    const serviceInterests = timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length;
    const maxVal = Math.max(views, starts, confirmed, serviceInterests, 10);

    return [
      { subject: t('analytics.radarViews'), val: Math.round((views / maxVal) * 100), raw: views },
      { subject: t('analytics.radarCarts'), val: Math.round((starts / maxVal) * 100), raw: starts },
      { subject: t('analytics.radarServices'), val: Math.round((serviceInterests / maxVal) * 100), raw: serviceInterests },
      { subject: t('analytics.radarConfirmed'), val: Math.round((confirmed / maxVal) * 100), raw: confirmed },
      { subject: t('analytics.radarConversion'), val: Math.min(Math.round(conversion * 2.5), 100), raw: `${conversion}%` },
      { subject: t('analytics.radarReachable'), val: Math.round((currentStats.withPhone / Math.max(groupedProspects.length, 1)) * 100), raw: currentStats.withPhone }
    ];
  }, [currentStats, timeFilteredEvents, groupedProspects, t]);

  // WhatsApp Message templates with plan tier locks
  const getTemplates = (prospect: any) => {
    const salonName = salon?.nom || salon?.name || (language === 'fr' ? 'notre salon' : 'our salon');
    const anonymousLabel = t('analytics.anonymous');
    const customerName = prospect?.name && prospect.name !== 'Visiteur Anonyme' && prospect.name !== anonymousLabel
      ? prospect.name
      : (prospect?.customerName && prospect.customerName !== 'Visiteur Anonyme' && prospect.customerName !== anonymousLabel
        ? prospect.customerName
        : (language === 'fr' ? 'Bonjour' : 'Hello'));

    const servicesList = Array.isArray(prospect?.services) && prospect.services.length > 0
      ? prospect.services
      : (Array.isArray(prospect?.selectedServices) ? prospect.selectedServices : []);

    const serviceName = servicesList.length > 0
      ? `"${servicesList[0]}"`
      : (language === 'fr' ? 'nos prestations beauté' : 'our beauty services');

    return [
      {
        id: 0,
        title: t('analytics.tmpl1Title'),
        badge: t('analytics.tmpl1Badge'),
        planRequired: 'basic' as PlanType,
        text: t('analytics.tmpl1Text', { name: customerName, service: serviceName, salon: salonName, url: publicUrl })
      },
      {
        id: 1,
        title: t('analytics.tmpl2Title'),
        badge: isBasic ? 'PRO' : t('analytics.tmpl2Badge'),
        planRequired: 'pro' as PlanType,
        text: t('analytics.tmpl2Text', { name: customerName, salon: salonName, url: publicUrl })
      },
      {
        id: 2,
        title: t('analytics.tmpl3Title'),
        badge: isBasic ? 'PRO' : t('analytics.tmpl3Badge'),
        planRequired: 'pro' as PlanType,
        text: t('analytics.tmpl3Text', { name: customerName, salon: salonName, url: publicUrl })
      },
      {
        id: 3,
        title: t('analytics.tmpl4Title'),
        badge: isPremium ? t('analytics.tmpl4Badge') : 'PREMIUM',
        planRequired: 'premium' as PlanType,
        text: t('analytics.tmpl4Text', { name: customerName, service: serviceName, salon: salonName, url: publicUrl })
      }
    ];
  };

  const openWhatsAppModal = (prospect: any) => {
    setSelectedProspect(prospect);
    const templates = getTemplates(prospect);
    setSelectedTemplate(0);
    setCustomMessage(templates[0].text);
  };

  const handleSelectTemplate = (tmpl: any) => {
    if (isBasic && tmpl.planRequired !== 'basic') {
      toast({
        title: t('analytics.plan.templateLocked'),
        description: t('analytics.plan.unlockFeature'),
      });
      setIsComparisonOpen(true);
      return;
    }
    if (isPro && tmpl.planRequired === 'premium') {
      toast({
        title: t('analytics.plan.templateLocked'),
        description: t('analytics.plan.unlockFeature'),
      });
      setIsComparisonOpen(true);
      return;
    }
    setSelectedTemplate(tmpl.id);
    setCustomMessage(tmpl.text);
  };

  const handleSendWhatsApp = () => {
    if (!selectedProspect) return;
    const rawPhone = selectedProspect.phone || selectedProspect.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast({
        title: t('analytics.invalidPhone'),
        description: t('analytics.noPhonesDesc'),
        variant: 'destructive'
      });
      return;
    }

    const key = selectedProspect.id || selectedProspect._id;
    saveFollowUp(key, 'contacted');

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(waUrl, '_blank');
    setSelectedProspect(null);
  };

  const handleEmailRelance = (prospect: any) => {
    const email = prospect.email || prospect.customerEmail;
    if (!email) {
      toast({ title: t('analytics.noEmail'), variant: 'destructive' });
      return;
    }

    const salonName = salon?.nom || salon?.name || (language === 'fr' ? 'notre salon' : 'our salon');
    const customerName = prospect.name && prospect.name !== t('analytics.anonymous') && prospect.name !== 'Visiteur Anonyme'
      ? prospect.name
      : (language === 'fr' ? 'Client(e)' : 'Customer');

    const subject = t('analytics.emailSubject', { salon: salonName });
    const body = t('analytics.emailBody', { name: customerName, salon: salonName, url: publicUrl });

    const key = prospect.id || prospect._id;
    saveFollowUp(key, 'contacted');

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Convert prospect to Official Client
  const openAddClientModal = (prospect: any) => {
    setAddClientProspect(prospect);
    const servicesList = prospect.services || prospect.selectedServices || [];
    const serviceName = servicesList[0] || '';
    const anonymousLabel = t('analytics.anonymous');
    const prefillName = prospect.name && prospect.name !== 'Visiteur Anonyme' && prospect.name !== anonymousLabel
      ? prospect.name
      : (prospect.customerName && prospect.customerName !== 'Visiteur Anonyme' && prospect.customerName !== anonymousLabel ? prospect.customerName : '');

    setClientFormData({
      nom: prefillName,
      telephone: prospect.phone || prospect.customerPhone || '',
      email: prospect.email || prospect.customerEmail || '',
      notes: serviceName
        ? t('analytics.interestIn', { service: serviceName })
        : t('analytics.defaultMarketplaceNote')
    });
  };

  const handleSaveClient = async () => {
    if (!salon) return;
    if (!clientFormData.nom.trim()) {
      toast({
        title: t('analytics.nameRequired'),
        description: t('analytics.nameRequired'),
        variant: 'destructive'
      });
      return;
    }
    if (!clientFormData.telephone.trim()) {
      toast({
        title: t('analytics.phoneRequired'),
        description: t('analytics.phoneRequired'),
        variant: 'destructive'
      });
      return;
    }

    setSavingClient(true);
    try {
      const salonId = salon._id || salon.id;
      await api.createClient(salonId, {
        nom: clientFormData.nom.trim(),
        telephone: clientFormData.telephone.trim(),
        email: clientFormData.email.trim() || undefined,
        notes: clientFormData.notes.trim() || undefined,
        statut: 'nouveau',
        pointsFidelite: 0,
        visitesCount: 0,
        depensesTotal: 0
      } as any);

      if (addClientProspect) {
        const key = addClientProspect.id || addClientProspect._id;
        saveFollowUp(key, 'converted');
      }

      toast({
        title: t('analytics.clientAdded'),
        description: t('analytics.clientAddedDesc', { name: clientFormData.nom })
      });
      setAddClientProspect(null);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter le client.',
        variant: 'destructive'
      });
    } finally {
      setSavingClient(false);
    }
  };

  // Export CSV with Plan Check
  const handleExportCSV = () => {
    if (isBasic) {
      toast({
        title: t('analytics.plan.exportLocked'),
        description: t('analytics.plan.unlockFeature'),
      });
      setIsComparisonOpen(true);
      return;
    }

    if (groupedProspects.length === 0) {
      toast({ title: t('analytics.noPhonesDesc'), variant: 'destructive' });
      return;
    }

    const headers = language === 'fr'
      ? ['Nom', 'Telephone', 'Email', 'Nombre Total Sessions', 'Vues', 'Paniers', 'RDV Valides', 'Prestations', 'Statut Relance', 'Derniere Visite']
      : ['Name', 'Phone', 'Email', 'Total Sessions', 'Views', 'Carts', 'Confirmed Appointments', 'Services', 'Follow-up Status', 'Last Visit'];

    const rows = groupedProspects.map(p => {
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.phone.replace(/"/g, '""')}"`,
        `"${p.email.replace(/"/g, '""')}"`,
        p.totalEvents,
        p.visitsCount,
        p.startsCount,
        p.completedCount,
        `"${p.services.join('; ').replace(/"/g, '""')}"`,
        `"${p.followUpStatus}"`,
        `"${new Date(p.lastSeen).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `beautyflow_audience_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: t('analytics.csvExportSuccess'),
      description: t('analytics.csvExportSuccessDesc')
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-purple-950 to-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute left-1/3 -top-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-rose-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>
                  {t('analytics.liveData')} • {t('analytics.updatedAt', { time: lastUpdated.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US') })}
                </span>
              </div>

              {/* Current Subscription Plan Pill */}
              <button
                onClick={() => setIsComparisonOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 border ${
                  isPremium
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/40'
                    : isPro
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40'
                      : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
                title={t('analytics.plan.unlockFeature')}
              >
                {isPremium ? <Crown className="w-3.5 h-3.5 text-amber-200" /> : isPro ? <Zap className="w-3.5 h-3.5 text-purple-200" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{t('analytics.plan.current', { plan: currentPlan.label })}</span>
                {!isPremium && <ArrowUpRight className="w-3 h-3 opacity-70 ml-0.5" />}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {t('analytics.title')}
            </h1>
            <p className="text-rose-100/80 text-xs sm:text-sm lg:text-base leading-relaxed">
              {t('analytics.subtitle')}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={handleCopyLink}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t('analytics.linkCopied') : t('analytics.copyLink')}</span>
            </Button>

            <Button
              onClick={handleShareWhatsAppStatus}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('analytics.waStatus')}</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              className={`text-white border-white/20 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md flex items-center gap-2 transition-all active:scale-95 ${
                isBasic ? 'bg-white/5 opacity-80' : 'bg-white/5 hover:bg-white/15'
              }`}
              title={isBasic ? t('analytics.plan.exportLocked') : t('analytics.csvExport')}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('analytics.csvExport')}</span>
              {isBasic && <Lock className="w-3 h-3 text-amber-300 ml-0.5" />}
            </Button>

            <Button
              onClick={() => fetchAnalytics(false)}
              variant="outline"
              className="bg-rose-500/20 hover:bg-rose-500/30 text-white border-rose-400/40 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('analytics.refresh')}</span>
            </Button>
          </div>
        </div>

        {/* Time Filters Sub-bar with Plan-Aware Badges */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl backdrop-blur-md border border-white/10 text-xs overflow-x-auto">
            <button
              onClick={() => handleSelectTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                timeRange === 'all' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              <span>{t('analytics.filterAll', { profiles: groupedProspects.length, sessions: events.length })}</span>
              {isBasic && <Lock className="w-3 h-3 text-amber-300" />}
            </button>
            <button
              onClick={() => handleSelectTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                timeRange === 'today' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              {t('analytics.filterToday')}
            </button>
            <button
              onClick={() => handleSelectTimeRange('week')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                timeRange === 'week' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              {t('analytics.filterWeek')}
            </button>
            <button
              onClick={() => handleSelectTimeRange('month')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                timeRange === 'month' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              <span>{t('analytics.filterMonth')}</span>
              {isBasic && <Lock className="w-3 h-3 text-amber-300" />}
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-rose-200/90">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('analytics.uniqueContacts', { count: currentStats.withPhone })}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('analytics.toFollowUp', { count: hotLeads.length })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Plan Limit Alert Banner */}
      {isBasic && filteredGroupedProspects.length > BASIC_PROSPECT_LIMIT && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-rose-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-xs sm:text-sm text-foreground">
              {t('analytics.plan.basicLimitAlert', {
                limit: BASIC_PROSPECT_LIMIT,
                total: filteredGroupedProspects.length
              })}
            </p>
          </div>
          <Button
            onClick={() => setIsComparisonOpen(true)}
            className="gradient-primary text-white rounded-xl text-xs font-bold px-4 py-2 shrink-0 shadow"
          >
            <Crown className="w-3.5 h-3.5 mr-1 text-amber-200" />
            <span>{t('analytics.plan.upgradeToPro')}</span>
          </Button>
        </div>
      )}

      {/* Hot Leads Smart Action Alert Banner */}
      {hotLeads.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center shadow-lg shrink-0">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-foreground flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <span>{t('analytics.hotLeadsBannerTitle', { count: hotLeads.length })}</span>
                <Badge className="bg-amber-500 text-white border-0 text-[10px] font-bold uppercase px-2 py-0.5">
                  {t('analytics.hotLeadsBadge')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('analytics.hotLeadsBannerDesc', {
                  name: hotLeads[0].name,
                  phone: hotLeads[0].phone,
                  events: hotLeads[0].totalEvents,
                  starts: hotLeads[0].startsCount
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => openWhatsAppModal(hotLeads[0])}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold px-4 py-2.5 shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{t('analytics.relanceLead', { name: hotLeads[0].name })}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('pending')}
              className="rounded-2xl text-xs font-semibold px-3 py-2.5"
            >
              {t('analytics.viewList', { count: hotLeads.length })}
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Views */}
        <Card className="relative overflow-hidden border-rose-500/20 bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-rose-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('analytics.kpiViewsTitle')}
              </span>
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">{currentStats.views}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-500" />
                <span>{t('analytics.kpiViewsSubtitle', { count: currentStats.uniqueProspects })}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Booking Starts (Cart Abandons) */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-amber-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('analytics.kpiStartsTitle')}
              </span>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{currentStats.starts}</div>
              <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>{t('analytics.kpiStartsSubtitle')}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Confirmed */}
        <Card className="relative overflow-hidden border-emerald-500/20 bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('analytics.kpiConfirmedTitle')}
              </span>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">{currentStats.completed}</div>
              <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-1 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t('analytics.kpiConfirmedSubtitle')}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Conversion & Contact */}
        <Card className="relative overflow-hidden border-purple-500/20 bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-purple-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('analytics.kpiConversionTitle')}
              </span>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">{currentStats.conversionRate}%</div>
              <p className="text-xs text-purple-600/90 dark:text-purple-400/90 mt-1 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-purple-500" />
                <span>{t('analytics.kpiConversionSubtitle', { rate: currentStats.contactRate, count: currentStats.withPhone })}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel Breakdown */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <span>{t('analytics.funnelTitle')}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t('analytics.funnelDesc')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 self-start px-3 py-1 rounded-full font-semibold">
              {t('analytics.funnelBadge')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Views */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3 relative group hover:border-rose-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t('analytics.funnelStep1')}</span>
                <Eye className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground">{currentStats.views}</div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full w-full" />
              </div>
              <p className="text-[11px] text-muted-foreground">{t('analytics.funnelStep1Sub', { count: currentStats.uniqueProspects })}</p>
            </div>

            {/* Step 2: Service Selection */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3 relative group hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t('analytics.funnelStep2')}</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground">
                {timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length}
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                {t('analytics.funnelStep2Sub', {
                  percent: currentStats.views > 0 ? Math.round((timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length / currentStats.views) * 100) : 0
                })}
              </p>
            </div>

            {/* Step 3: Cart / Starts */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between space-y-3 relative group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">{t('analytics.funnelStep3')}</span>
                <ShoppingCart className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{currentStats.starts}</div>
              <div className="w-full bg-amber-200/50 dark:bg-amber-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((currentStats.starts / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                {t('analytics.funnelStep3Sub', {
                  percent: currentStats.views > 0 ? Math.round((currentStats.starts / currentStats.views) * 100) : 0
                })}
              </p>
            </div>

            {/* Step 4: Completed */}
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">{t('analytics.funnelStep4')}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{currentStats.completed}</div>
              <div className="w-full bg-emerald-200/50 dark:bg-emerald-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((currentStats.completed / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {t('analytics.funnelStep4Sub', { rate: currentStats.conversionRate })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Visual Charts Tabs with Plan Tiers */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-6 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-rose-500" />
              <span>{t('analytics.chartsTitle')}</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t('analytics.chartsDesc')}
            </CardDescription>
          </div>

          <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 rounded-2xl bg-muted/60 p-1 text-xs">
              <TabsTrigger value="evolution" className="rounded-xl text-xs">{t('analytics.tabEvolution')}</TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl text-xs flex items-center gap-1">
                <span>{t('analytics.tabServices')}</span>
                {isBasic && <Lock className="w-2.5 h-2.5 text-amber-500" />}
              </TabsTrigger>
              <TabsTrigger value="hours" className="rounded-xl text-xs flex items-center gap-1">
                <span>{t('analytics.tabHours')}</span>
                {isBasic && <Lock className="w-2.5 h-2.5 text-amber-500" />}
              </TabsTrigger>
              <TabsTrigger value="radar" className="rounded-xl text-xs flex items-center gap-1">
                <span>{t('analytics.tabRadar')}</span>
                {!isPremium && <Crown className="w-2.5 h-2.5 text-amber-500" />}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-6">
          {activeChartTab === 'evolution' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
                <span>
                  {t('analytics.chartEvolutionDesc', {
                    period: timeRange === 'today' ? t('analytics.byHour') : t('analytics.byDay')
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> {t('analytics.legendViews')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> {t('analytics.legendStarts')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> {t('analytics.legendConfirmed')}</span>
                </div>
              </div>
              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAbandons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConfirmes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="vues" name={t('analytics.legendViews')} stroke="#e11d48" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVues)" />
                    <Area type="monotone" dataKey="abandons" name={t('analytics.legendStarts')} stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorAbandons)" />
                    <Area type="monotone" dataKey="confirmes" name={t('analytics.legendConfirmed')} stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConfirmes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'services' && (
            isBasic ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="font-bold text-foreground text-base">{t('analytics.plan.chartLockedPro')}</h4>
                  <p className="text-xs text-muted-foreground">{t('analytics.plan.chartLockedProDesc')}</p>
                </div>
                <Button onClick={() => setIsComparisonOpen(true)} className="gradient-primary text-white rounded-2xl text-xs font-bold px-6 py-2.5 shadow-md">
                  <Zap className="w-4 h-4 mr-1.5 text-amber-200" />
                  <span>{t('analytics.plan.upgradeToPro')}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground mb-2">
                  {t('analytics.chartServicesDesc')}
                </div>
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topServicesData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={130} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" name={t('analytics.servicesCount')} fill="#e11d48" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}

          {activeChartTab === 'hours' && (
            isBasic ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="font-bold text-foreground text-base">{t('analytics.plan.chartLockedPro')}</h4>
                  <p className="text-xs text-muted-foreground">{t('analytics.plan.chartLockedProDesc')}</p>
                </div>
                <Button onClick={() => setIsComparisonOpen(true)} className="gradient-primary text-white rounded-2xl text-xs font-bold px-6 py-2.5 shadow-md">
                  <Zap className="w-4 h-4 mr-1.5 text-amber-200" />
                  <span>{t('analytics.plan.upgradeToPro')}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground mb-2">
                  {t('analytics.chartHoursDesc')}
                </div>
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar dataKey="visites" name={t('analytics.legendVisitors')} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="interet" name={t('analytics.legendIntents')} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}

          {activeChartTab === 'radar' && (
            !isPremium ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-sm">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="font-bold text-foreground text-base">{t('analytics.plan.chartLockedPremium')}</h4>
                  <p className="text-xs text-muted-foreground">{t('analytics.plan.chartLockedPremiumDesc')}</p>
                </div>
                <Button onClick={() => setIsComparisonOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold px-6 py-2.5 shadow-md">
                  <Crown className="w-4 h-4 mr-1.5 text-amber-200" />
                  <span>{t('analytics.plan.upgradeToPremium')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="text-xs text-muted-foreground mb-2 self-start">
                  {t('analytics.chartRadarDesc')}
                </div>
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                      <Radar
                        name={t('analytics.radarScore')}
                        dataKey="val"
                        stroke="#e11d48"
                        fill="#f43f5e"
                        fillOpacity={0.45}
                        strokeWidth={2.5}
                      />
                      <RechartsTooltip
                        formatter={(_value: any, _name: any, item: any) => [t('analytics.radarRealData', { val: item.payload.raw }), t('analytics.radarPerformance')]}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Main Prospects Section: Grouped vs Raw Toggle & Screen-Adapted Zero-Scroll Table */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-5 sm:p-6 lg:p-8 bg-muted/20 border-b border-border/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <Users className="w-6 h-6 text-rose-500" />
                <span>
                  {groupingMode === 'grouped' ? t('analytics.prospectsTitleGrouped') : t('analytics.prospectsTitleRaw')}
                </span>
                {isBasic && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold ml-1">
                    {t('analytics.plan.current', { plan: 'BASIC' })}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {groupingMode === 'grouped'
                  ? t('analytics.prospectsDescGrouped', { count: filteredGroupedProspects.length })
                  : t('analytics.prospectsDescRaw', { count: filteredRawEvents.length })}
              </CardDescription>
            </div>

            {/* Right Controls: Grouping Toggle, Search, View Toggle, Copy All Phones */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Grouping Toggle */}
              <div className="flex items-center rounded-2xl bg-muted/80 p-1 border border-border/60 text-xs">
                <button
                  onClick={() => setGroupingMode('grouped')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    groupingMode === 'grouped'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('analytics.groupByClient', { count: groupedProspects.length })}</span>
                </button>
                <button
                  onClick={() => setGroupingMode('raw')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    groupingMode === 'raw'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{t('analytics.rawLog', { count: events.length })}</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-48 lg:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('analytics.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border/80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Copy Phones */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAllPhones}
                className="h-9 rounded-2xl text-xs font-semibold px-3 flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-all active:scale-95"
              >
                {copiedAllPhones ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {t('analytics.copyPhones', {
                    count: (isBasic ? accessibleGroupedProspects : groupedProspects).filter(p => p.phone).length
                  })}
                </span>
              </Button>

              {/* Table / Cards View Toggle */}
              <div className="flex items-center rounded-2xl bg-muted/70 p-0.5 border border-border/50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  title={t('analytics.viewTable')}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  title={t('analytics.viewCards')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="rounded-xl text-xs font-semibold"
            >
              {t('analytics.tabAll', { count: groupingMode === 'grouped' ? groupedProspects.length : timeFilteredEvents.length })}
            </Button>
            <Button
              variant={activeTab === 'hot_leads' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('hot_leads')}
              className="rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30"
            >
              {t('analytics.tabWithPhone', { count: groupedProspects.filter(p => Boolean(p.phone)).length })}
            </Button>
            <Button
              variant={activeTab === 'starts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('starts')}
              className="rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border-amber-500/30"
            >
              {t('analytics.tabCartAbandons', { count: groupedProspects.filter(p => p.startsCount > 0 && p.highestIntent !== 'booking_completed').length })}
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className="rounded-xl text-xs font-semibold"
            >
              {t('analytics.tabPending', { count: hotLeads.length })}
            </Button>
            <Button
              variant={activeTab === 'contacted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('contacted')}
              className="rounded-xl text-xs font-semibold"
            >
              {t('analytics.tabContacted')}
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('completed')}
              className="rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-800 dark:text-teal-300 hover:bg-teal-500/25 border-teal-500/30"
            >
              {t('analytics.tabConfirmed', { count: groupedProspects.filter(p => p.highestIntent === 'booking_completed').length })}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && events.length === 0 ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-16 bg-muted/40 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : groupingMode === 'grouped' ? (
            /* GROUPED PROSPECTS VIEW */
            accessibleGroupedProspects.length > 0 ? (
              viewMode === 'table' ? (
                /* Grouped Prospects View - 100% Screen-Adapted with Zero Horizontal Scroll */
                <div className="w-full">
                  {/* MOBILE CARDS VIEW (< md): 100% Zero-Scroll Adaptive Cards */}
                  <div className="block md:hidden divide-y divide-border/40 p-3 space-y-3">
                    {paginatedGroupedProspects.map((prospect) => {
                      const initial = (prospect.name || 'V')[0].toUpperCase();
                      const isCompleted = prospect.highestIntent === 'booking_completed';
                      const isStarted = prospect.highestIntent === 'booking_started';
                      const cleanPhone = prospect.phone.replace(/\D/g, '');
                      const matchedClient = cleanPhone ? clientsByPhone.get(cleanPhone) : null;
                      const isExpanded = Boolean(expandedProspects[prospect.id]);

                      return (
                        <div key={prospect.id} className="p-3.5 rounded-2xl bg-card border border-border/60 space-y-3 shadow-xs">
                          {/* Top: Avatar, Name, Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center text-xs shrink-0 ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                  : isStarted && prospect.phone
                                    ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                                    : prospect.phone
                                      ? 'bg-gradient-to-br from-rose-500 to-purple-600'
                                      : 'bg-gradient-to-br from-slate-600 to-slate-800'
                              }`}>
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{prospect.name}</p>
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {matchedClient && (
                                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0 font-semibold">
                                      {t('analytics.salonClientBadge')}
                                    </Badge>
                                  )}
                                  {!matchedClient && prospect.phone && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-600 font-semibold">
                                      {t('analytics.hotLeadBadge')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isCompleted ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                                  {t('analytics.eventCompleted')}
                                </Badge>
                              ) : isStarted ? (
                                <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[10px] font-bold">
                                  {t('analytics.eventStarted')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-slate-600">
                                  {t('analytics.eventView')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Middle: Contacts, Services, and Time */}
                          <div className="text-xs space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                            {prospect.phone ? (
                              <div className="flex items-center justify-between">
                                <a href={`tel:${prospect.phone}`} className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-emerald-500" /> {prospect.phone}
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(prospect.phone);
                                    toast({ title: t('analytics.linkCopied'), description: prospect.phone });
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-1"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="italic text-muted-foreground/60 text-[11px]">{t('analytics.unspecified')}</span>
                            )}

                            {/* Services */}
                            {prospect.services.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {prospect.services.map((s, idx) => (
                                  <span key={idx} className="font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px]">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(prospect.lastSeen, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {prospect.totalEvents > 1 && (
                                <button
                                  onClick={() => toggleExpand(prospect.id)}
                                  className="font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
                                >
                                  <span>{t('analytics.sessionsCount', { count: prospect.totalEvents })}</span>
                                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded History */}
                          {isExpanded && (
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] space-y-1.5">
                              <p className="font-bold text-foreground flex items-center gap-1 text-[10px]">
                                <History className="w-3 h-3 text-rose-500" /> {t('analytics.sessionDetails', { count: prospect.events.length, name: prospect.name })}
                              </p>
                              <div className="divide-y divide-border/30 max-h-36 overflow-y-auto pr-1">
                                {prospect.events.map((ev, idx) => (
                                  <div key={idx} className="py-1.5 flex items-center justify-between text-[10px]">
                                    <span className="font-medium text-foreground">
                                      {ev.selectedServices?.join(', ') || t('analytics.generalBrowsing')}
                                    </span>
                                    <span className="text-muted-foreground">{formatDate(ev.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bottom: Status & Actions */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                            <select
                              value={prospect.followUpStatus}
                              onChange={(e) => saveFollowUp(prospect.id, e.target.value as any)}
                              className={`text-[11px] font-semibold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer ${
                                prospect.followUpStatus === 'converted'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : prospect.followUpStatus === 'contacted'
                                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                    : prospect.followUpStatus === 'dropped'
                                      ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}
                            >
                              <option value="pending">{t('analytics.statusPending')}</option>
                              <option value="contacted">{t('analytics.statusContacted')}</option>
                              <option value="converted">{t('analytics.statusConverted')}</option>
                              <option value="dropped">{t('analytics.statusDropped')}</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                              {prospect.phone && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => openWhatsAppModal(prospect)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1.5 shadow-sm flex items-center gap-1"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                    <span>{t('analytics.whatsapp')}</span>
                                  </Button>
                                  <a
                                    href={`tel:${prospect.phone}`}
                                    className="p-1.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground transition-colors"
                                    title={t('analytics.call')}
                                  >
                                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                                  </a>
                                  {!matchedClient && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openAddClientModal(prospect)}
                                      className="rounded-xl text-xs p-1.5 border-rose-500/30 text-rose-600"
                                      title={t('analytics.addClient')}
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {prospect.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmailRelance(prospect)}
                                  className="rounded-xl text-xs p-1.5"
                                  title={t('analytics.emailRelance')}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP & TABLET TABLE (hidden md:block): 100% Screen-Adapted, ZERO Horizontal Scroll */}
                  <div className="hidden md:block w-full overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                      <thead className="sticky top-0 z-10 text-[11px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/90 backdrop-blur-md border-b border-border/40 shadow-sm">
                        <tr>
                          <th className="py-3.5 px-3 lg:px-4 w-[28%] lg:w-[28%]">{t('analytics.colClientContact')}</th>
                          <th className="py-3.5 px-3 lg:px-4 w-[32%] lg:w-[32%]">{t('analytics.colJourneyServices')}</th>
                          <th className="py-3.5 px-2 lg:px-3 w-[18%] lg:w-[18%]">{t('analytics.colActivityStatus')}</th>
                          <th className="py-3.5 px-3 lg:px-4 w-[22%] lg:w-[22%] text-right">{t('analytics.colQuickActions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {paginatedGroupedProspects.map((prospect) => {
                          const initial = (prospect.name || 'V')[0].toUpperCase();
                          const isCompleted = prospect.highestIntent === 'booking_completed';
                          const isStarted = prospect.highestIntent === 'booking_started';
                          const cleanPhone = prospect.phone.replace(/\D/g, '');
                          const matchedClient = cleanPhone ? clientsByPhone.get(cleanPhone) : null;
                          const isExpanded = Boolean(expandedProspects[prospect.id]);

                          return (
                            <React.Fragment key={prospect.id}>
                              <tr className={`hover:bg-muted/40 transition-colors ${isExpanded ? 'bg-muted/25' : ''}`}>
                                {/* 1. Prospect & Contacts (Avatar, Name, Badges, Phone, Email, Device) */}
                                <td className="py-3.5 px-3 lg:px-4 align-top">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`w-9 h-9 rounded-2xl text-white font-bold flex items-center justify-center shadow-sm shrink-0 text-xs mt-0.5 ${
                                      isCompleted
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                        : isStarted && prospect.phone
                                          ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                                          : prospect.phone
                                            ? 'bg-gradient-to-br from-rose-500 to-purple-600'
                                            : 'bg-gradient-to-br from-slate-600 to-slate-800'
                                    }`}>
                                      {initial}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="font-bold text-foreground text-xs lg:text-sm flex flex-wrap items-center gap-1.5 leading-tight">
                                        <span className="truncate max-w-[140px] lg:max-w-[180px]">{prospect.name}</span>
                                        {matchedClient && (
                                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0 font-semibold shrink-0">
                                            <UserCheck className="w-2.5 h-2.5 mr-0.5" /> {t('analytics.salonClientBadge')}
                                          </Badge>
                                        )}
                                        {!matchedClient && prospect.phone && (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                                            {t('analytics.hotLeadBadge')}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Phone with 1-click call and copy */}
                                      {prospect.phone ? (
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <a
                                            href={`tel:${prospect.phone}`}
                                            className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                                            title={t('analytics.call')}
                                          >
                                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                            <span className="truncate">{prospect.phone}</span>
                                          </a>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(prospect.phone);
                                              toast({ title: t('analytics.linkCopied'), description: prospect.phone });
                                            }}
                                            className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                                            title={t('analytics.copyLink')}
                                          >
                                            <Copy className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] italic text-muted-foreground/60">{t('analytics.unspecified')}</span>
                                      )}

                                      {/* Email & Device */}
                                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                        {prospect.email && (
                                          <span className="truncate max-w-[120px] flex items-center gap-1">
                                            <Mail className="w-2.5 h-2.5 shrink-0" />
                                            {prospect.email}
                                          </span>
                                        )}
                                        <span className="flex items-center gap-1 text-muted-foreground/80">
                                          <Smartphone className="w-2.5 h-2.5 shrink-0" />
                                          {prospect.devices[0] || 'Web'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Parcours & Prestations */}
                                <td className="py-3.5 px-3 lg:px-4 align-top">
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {isCompleted ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                                          {t('analytics.eventCompleted')} ({prospect.completedCount})
                                        </Badge>
                                      ) : isStarted ? (
                                        <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                          {t('analytics.eventStarted')} ({prospect.startsCount})
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] text-slate-600 px-2 py-0.5 rounded-lg">
                                          {t('analytics.eventView')} ({prospect.visitsCount}x)
                                        </Badge>
                                      )}

                                      {prospect.totalEvents > 1 && (
                                        <button
                                          onClick={() => toggleExpand(prospect.id)}
                                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
                                        >
                                          <span>{t('analytics.sessionsCount', { count: prospect.totalEvents })}</span>
                                          {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                        </button>
                                      )}
                                    </div>

                                    {/* Services */}
                                    <div className="text-xs">
                                      {prospect.services.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {prospect.services.map((s, idx) => (
                                            <span key={idx} className="font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[120px]">
                                              {s}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="italic text-muted-foreground/60 text-[11px]">{t('analytics.generalBrowsing')}</span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-muted-foreground hidden lg:block">
                                      {t('analytics.summaryStats', {
                                        visits: prospect.visitsCount,
                                        starts: prospect.startsCount,
                                        completed: prospect.completedCount
                                      })}
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Activité & Suivi */}
                                <td className="py-3.5 px-2 lg:px-3 align-top space-y-2">
                                  <div className="text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1 text-[11px]">
                                      <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="truncate">
                                        {formatDate(prospect.lastSeen, {
                                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <select
                                      value={prospect.followUpStatus}
                                      onChange={(e) => saveFollowUp(prospect.id, e.target.value as any)}
                                      className={`w-full max-w-[125px] text-[11px] font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer truncate ${
                                        prospect.followUpStatus === 'converted'
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                          : prospect.followUpStatus === 'contacted'
                                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                            : prospect.followUpStatus === 'dropped'
                                              ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                      }`}
                                    >
                                      <option value="pending">{t('analytics.statusPending')}</option>
                                      <option value="contacted">{t('analytics.statusContacted')}</option>
                                      <option value="converted">{t('analytics.statusConverted')}</option>
                                      <option value="dropped">{t('analytics.statusDropped')}</option>
                                    </select>
                                  </div>
                                </td>

                                {/* 4. Relance & Actions - Compact, No Overflow, Zero Scroll */}
                                <td className="py-3.5 px-3 lg:px-4 text-right align-top">
                                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                                    {prospect.phone ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => openWhatsAppModal(prospect)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-2.5 py-1.5 shadow-sm flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                                          title={t('analytics.whatsapp')}
                                        >
                                          <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                          <span className="hidden 2xl:inline">{t('analytics.whatsapp')}</span>
                                        </Button>

                                        <a
                                          href={`tel:${prospect.phone}`}
                                          className="p-1.5 rounded-xl bg-muted/80 hover:bg-muted text-foreground transition-colors shrink-0"
                                          title={t('analytics.call')}
                                        >
                                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                                        </a>

                                        {!matchedClient && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openAddClientModal(prospect)}
                                            className="rounded-xl text-xs p-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 shrink-0"
                                            title={t('analytics.addClient')}
                                          >
                                            <UserPlus className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </>
                                    ) : null}

                                    {prospect.email && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEmailRelance(prospect)}
                                        className="rounded-xl text-xs p-1.5 shrink-0"
                                        title={t('analytics.emailRelance')}
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Sessions Timeline Row */}
                              {isExpanded && (
                                <tr className="bg-muted/15 border-b border-border/40">
                                  <td colSpan={4} className="p-3 sm:p-5">
                                  <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/60 space-y-2.5 shadow-inner">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-foreground">
                                      <span className="flex items-center gap-2">
                                        <History className="w-3.5 h-3.5 text-rose-500" />
                                        {t('analytics.sessionDetails', { count: prospect.events.length, name: prospect.name })}
                                      </span>
                                      <span className="text-muted-foreground font-normal text-[11px]">
                                        {t('analytics.firstVisit', { date: formatDate(prospect.firstSeen) })} • {t('analytics.lastVisit', { date: formatDate(prospect.lastSeen) })}
                                      </span>
                                    </div>

                                    <div className="divide-y divide-border/40">
                                      {prospect.events.map((ev, evIdx) => (
                                        <div key={ev._id || evIdx} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-muted-foreground text-[10px] w-5">#{evIdx + 1}</span>
                                            {ev.eventType === 'booking_completed' ? (
                                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] font-semibold">
                                                {t('analytics.eventCompleted')}
                                              </Badge>
                                            ) : ev.eventType === 'booking_started' ? (
                                              <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[9px] font-semibold">
                                                {t('analytics.eventStarted')}
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-[9px] text-slate-500">
                                                {t('analytics.eventView')}
                                              </Badge>
                                            )}

                                            <span className="font-medium text-foreground text-[11px]">
                                              {ev.selectedServices && ev.selectedServices.length > 0
                                                ? ev.selectedServices.join(', ')
                                                : t('analytics.generalSalonConsult')}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-2.5 h-2.5" />
                                              {formatDate(ev.createdAt, {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                              })}
                                            </span>
                                            <span>{getDeviceLabel(ev.userAgent).label}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
                /* Grouped Cards View */
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedGroupedProspects.map((prospect) => {
                    const initial = (prospect.name || 'V')[0].toUpperCase();
                    const isCompleted = prospect.highestIntent === 'booking_completed';
                    const isStarted = prospect.highestIntent === 'booking_started';
                    const cleanPhone = prospect.phone.replace(/\D/g, '');
                    const matchedClient = cleanPhone ? clientsByPhone.get(cleanPhone) : null;
                    const isExpanded = Boolean(expandedProspects[prospect.id]);

                    return (
                      <div key={prospect.id} className="p-4 sm:p-5 rounded-3xl bg-muted/25 border border-border/60 hover:border-rose-500/30 transition-all space-y-3.5 flex flex-col justify-between shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl text-white font-bold flex items-center justify-center shadow-md shrink-0 text-xs sm:text-sm ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                  : isStarted && prospect.phone
                                    ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                                    : prospect.phone
                                      ? 'bg-gradient-to-br from-rose-500 to-purple-600'
                                      : 'bg-gradient-to-br from-slate-600 to-slate-800'
                              }`}>
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                                  <span className="truncate">{prospect.name}</span>
                                  {matchedClient && (
                                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[9px] px-1 py-0 font-semibold shrink-0">
                                      {t('analytics.salonClientBadge')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>
                                    {formatDate(prospect.lastSeen, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              {isCompleted ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                                  {t('analytics.eventCompleted')}
                                </Badge>
                              ) : isStarted ? (
                                <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                  {t('analytics.eventStarted')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-slate-500 px-2 py-0.5 rounded-lg">
                                  {t('analytics.eventView')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Contacts Box */}
                          <div className="p-3 rounded-2xl bg-background/80 border border-border/60 space-y-1.5 text-xs">
                            {prospect.phone ? (
                              <div className="flex items-center justify-between">
                                <a href={`tel:${prospect.phone}`} className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                                  <Phone className="w-3 h-3 text-emerald-500" /> {prospect.phone}
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(prospect.phone);
                                    toast({ title: t('analytics.linkCopied'), description: prospect.phone });
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-1"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-muted-foreground/60 italic text-[11px] flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {t('analytics.unspecified')}
                              </div>
                            )}

                            {prospect.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground truncate text-[11px]">
                                <Mail className="w-3 h-3 shrink-0" /> {prospect.email}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1 border-t border-border/40">
                              <span>{prospect.devices.join(', ')}</span>
                              <button
                                onClick={() => toggleExpand(prospect.id)}
                                className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>{t('analytics.interactionsCount', { count: prospect.totalEvents })}</span>
                                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Services */}
                          {prospect.services.length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground text-[10px] font-semibold block mb-1">
                                {t('analytics.colServices')} :
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {prospect.services.map((s, idx) => (
                                  <Badge key={idx} className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-[10px]">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expanded detail inside card */}
                          {isExpanded && (
                            <div className="p-3 rounded-2xl bg-card border border-border/60 text-[10px] space-y-1.5">
                              <div className="font-bold text-foreground flex items-center gap-1">
                                <History className="w-3 h-3 text-rose-500" /> {t('analytics.sessionDetails', { count: prospect.events.length, name: prospect.name })} :
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {prospect.events.map((ev, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 border-b border-border/30 pb-1">
                                    <span className="font-medium">
                                      {ev.eventType === 'booking_completed' ? t('analytics.eventCompleted') : ev.eventType === 'booking_started' ? t('analytics.eventStarted') : t('analytics.eventView')}
                                    </span>
                                    <span className="text-muted-foreground">{formatDate(ev.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                          <select
                            value={prospect.followUpStatus}
                            onChange={(e) => saveFollowUp(prospect.id, e.target.value as any)}
                            className="text-[11px] font-semibold rounded-xl px-2 py-1 border bg-background"
                          >
                            <option value="pending">{t('analytics.statusPending')}</option>
                            <option value="contacted">{t('analytics.statusContacted')}</option>
                            <option value="converted">{t('analytics.statusConverted')}</option>
                            <option value="dropped">{t('analytics.statusDropped')}</option>
                          </select>

                          <div className="flex items-center gap-1.5">
                            {prospect.phone && (
                              <Button
                                size="sm"
                                onClick={() => openWhatsAppModal(prospect)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1 shadow-sm flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3 fill-white" />
                                <span>{t('analytics.whatsapp')}</span>
                              </Button>
                            )}
                            {!matchedClient && prospect.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddClientModal(prospect)}
                                className="rounded-xl text-xs px-2 py-1"
                                title={t('analytics.addClient')}
                              >
                                <UserPlus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t('analytics.emptyTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  {t('analytics.emptyDesc')}
                </p>
                <Button onClick={handleShareWhatsAppStatus} className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-6 py-2.5 font-semibold text-sm shadow-md">
                  <Share2 className="w-4 h-4 mr-2" /> {t('analytics.emptyShareBtn')}
                </Button>
              </div>
            )
          ) : accessibleRawEvents.length > 0 ? (
            <div className="w-full">
                {/* Mobile Cards for Raw Events */}
                <div className="block md:hidden divide-y divide-border/40 p-3 space-y-2.5">
                  {paginatedRawEvents.map((ev) => {
                    const isStarted = ev.eventType === 'booking_started';
                    const isCompleted = ev.eventType === 'booking_completed';
                    const initial = (ev.customerName || 'V')[0].toUpperCase();

                    return (
                      <div key={ev._id || Math.random()} className="p-3 rounded-2xl bg-card border border-border/60 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{ev.customerName || t('analytics.anonymous')}</p>
                              {ev.customerPhone && (
                                <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{ev.customerPhone}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCompleted ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px] font-semibold">
                                {t('analytics.eventCompleted')}
                              </Badge>
                            ) : isStarted ? (
                              <Badge className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-[9px] font-semibold">
                                {t('analytics.eventStarted')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-slate-500">
                                {t('analytics.eventView')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                          <span className="truncate max-w-[200px]">
                            {ev.selectedServices && ev.selectedServices.length > 0 ? ev.selectedServices.join(', ') : t('analytics.generalBrowsing')}
                          </span>
                          <span>
                            {formatDate(ev.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {ev.customerPhone && (
                          <div className="pt-1 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => openWhatsAppModal(ev)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1 shadow-sm flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 fill-white" />
                              <span>{t('analytics.whatsapp')}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop & Tablet Table (hidden md:block) */}
                <div className="hidden md:block w-full overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse table-fixed">
                    <thead className="sticky top-0 z-10 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/90 backdrop-blur-md border-b border-border/40 shadow-sm">
                      <tr>
                        <th className="py-3.5 px-3 sm:px-4 w-[32%]">{t('analytics.colClient')}</th>
                        <th className="py-3.5 px-3 sm:px-4 w-[48%]">{t('analytics.colEventDetails')}</th>
                        <th className="py-3.5 px-3 sm:px-4 text-right w-[20%]">{t('analytics.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {paginatedRawEvents.map((ev) => {
                        const isStarted = ev.eventType === 'booking_started';
                        const isCompleted = ev.eventType === 'booking_completed';
                        const initial = (ev.customerName || 'V')[0].toUpperCase();

                        return (
                          <tr key={ev._id || Math.random()} className="hover:bg-muted/40 transition-colors">
                            {/* 1. Visiteur & Contact */}
                            <td className="py-3.5 px-3 sm:px-4 align-top">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0 mt-0.5">
                                  {initial}
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <div className="font-bold text-foreground text-xs truncate max-w-[150px]">{ev.customerName || t('analytics.anonymous')}</div>
                                  {ev.customerPhone ? (
                                    <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-[11px] truncate">{ev.customerPhone}</div>
                                  ) : (
                                    <div className="italic text-muted-foreground/60 text-[10px]">{t('analytics.unspecified')}</div>
                                  )}
                                  <div className="text-[10px] text-muted-foreground">{getDeviceLabel(ev.userAgent).label}</div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Événement & Prestation */}
                            <td className="py-3.5 px-3 sm:px-4 align-top space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {isCompleted ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px] font-semibold">
                                    {t('analytics.eventCompleted')}
                                  </Badge>
                                ) : isStarted ? (
                                  <Badge className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-[9px] font-semibold">
                                    {t('analytics.eventStarted')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] text-slate-500">
                                    {t('analytics.eventView')}
                                  </Badge>
                                )}

                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatDate(ev.createdAt, {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {ev.selectedServices && ev.selectedServices.length > 0 ? (
                                  <span className="font-semibold text-foreground bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded text-[10px] truncate inline-block max-w-[180px]">
                                    {ev.selectedServices.join(', ')}
                                  </span>
                                ) : (
                                  <span className="italic text-muted-foreground/60 text-[10px]">{t('analytics.generalBrowsing')}</span>
                                )}
                              </div>
                            </td>

                            {/* 3. Action */}
                            <td className="py-3.5 px-3 sm:px-4 text-right align-top">
                              <div className="flex items-center justify-end gap-1.5">
                                {ev.customerPhone && (
                                  <Button
                                    size="sm"
                                    onClick={() => openWhatsAppModal(ev)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-2.5 py-1 shadow-sm"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    <span>{t('analytics.whatsapp')}</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t('analytics.rawEmptyTitle')}</h3>
              </div>
            )
          }

          {/* Unified Pagination Footer */}
          {((groupingMode === 'grouped' && accessibleGroupedProspects.length > 0) ||
            (groupingMode === 'raw' && accessibleRawEvents.length > 0)) && (
            <div className="p-3.5 sm:px-6 bg-muted/15 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Left Info & Page Size */}
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <span className="text-[11px] sm:text-xs">
                  {groupingMode === 'grouped'
                    ? t('analytics.pagination.prospects', {
                        from: Math.min((currentPage - 1) * pageSize + 1, accessibleGroupedProspects.length),
                        to: Math.min(currentPage * pageSize, accessibleGroupedProspects.length),
                        total: isBasic ? `${accessibleGroupedProspects.length} (${filteredGroupedProspects.length} total)` : accessibleGroupedProspects.length
                      })
                    : t('analytics.pagination.events', {
                        from: Math.min((currentPage - 1) * pageSize + 1, accessibleRawEvents.length),
                        to: Math.min(currentPage * pageSize, accessibleRawEvents.length),
                        total: accessibleRawEvents.length
                      })}
                </span>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>{t('analytics.pagination.perPage')}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-background border border-border rounded-lg px-2 py-0.5 text-xs text-foreground cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Right Page Controls */}
              <div className="flex items-center gap-1 self-center sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  className="h-7 w-7 p-0 rounded-lg"
                  title="Première page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="h-7 px-2 rounded-lg text-xs font-semibold gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('analytics.pagination.prev')}</span>
                </Button>

                {/* Page Indicator */}
                <div className="px-2.5 py-0.5 rounded-lg bg-muted/60 text-[11px] font-semibold text-foreground border border-border/40">
                  {t('analytics.pagination.page', {
                    current: currentPage,
                    total: groupingMode === 'grouped' ? totalGroupedPages : totalRawPages
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, groupingMode === 'grouped' ? totalGroupedPages : totalRawPages))}
                  disabled={currentPage >= (groupingMode === 'grouped' ? totalGroupedPages : totalRawPages)}
                  className="h-7 px-2 rounded-lg text-xs font-semibold gap-1"
                >
                  <span className="hidden sm:inline">{t('analytics.pagination.next')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(groupingMode === 'grouped' ? totalGroupedPages : totalRawPages)}
                  disabled={currentPage >= (groupingMode === 'grouped' ? totalGroupedPages : totalRawPages)}
                  className="h-7 w-7 p-0 rounded-lg"
                  title="Dernière page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Relance Dialog / Modal with Plan Tier Badging */}
      {selectedProspect && (
        <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                <MessageSquare className="w-5 h-5 fill-emerald-600" />
                <span>{t('analytics.waModalTitle', { name: selectedProspect.name || selectedProspect.customerName || t('analytics.anonymous') })}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {t('analytics.waModalPhone', { phone: selectedProspect.phone || selectedProspect.customerPhone })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Template Picker with Tier Lock */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t('analytics.waTemplatesLabel')}</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getTemplates(selectedProspect).map((tmpl) => {
                    const isLocked = (isBasic && tmpl.planRequired !== 'basic') || (isPro && tmpl.planRequired === 'premium');

                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`text-left p-3 rounded-2xl border transition-all text-xs font-medium relative ${
                          selectedTemplate === tmpl.id
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                            : 'border-border hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                            <span>{tmpl.title}</span>
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${
                            isLocked ? 'border-amber-500/40 text-amber-600 bg-amber-500/10' : 'border-emerald-500/30 text-emerald-600'
                          }`}>
                            {tmpl.badge}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Message Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t('analytics.waMessageLabel')}</label>
                <textarea
                  rows={5}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full text-xs rounded-2xl p-3 bg-muted/30 border border-border/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedProspect(null)} className="rounded-xl text-xs flex-1">
                {t('analytics.waCancel')}
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex-1 py-2.5 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{t('analytics.waSend')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Client Dialog / Modal */}
      {addClientProspect && (
        <Dialog open={!!addClientProspect} onOpenChange={() => setAddClientProspect(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600">
                <UserPlus className="w-5 h-5 text-rose-600" />
                <span>{t('analytics.addClientModalTitle')}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {t('analytics.addClientModalDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{t('analytics.clientName')}</label>
                <Input
                  type="text"
                  placeholder="Ex: Marie Dupont"
                  value={clientFormData.nom}
                  onChange={(e) => setClientFormData({ ...clientFormData, nom: e.target.value })}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{t('analytics.clientPhone')}</label>
                <Input
                  type="tel"
                  placeholder="Ex: +237 6XXXXXXXX"
                  value={clientFormData.telephone}
                  onChange={(e) => setClientFormData({ ...clientFormData, telephone: e.target.value })}
                  className="rounded-xl text-xs h-10 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{t('analytics.clientEmail')}</label>
                <Input
                  type="email"
                  placeholder="Ex: client@email.com"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">{t('analytics.clientNotes')}</label>
                <textarea
                  rows={2}
                  value={clientFormData.notes}
                  onChange={(e) => setClientFormData({ ...clientFormData, notes: e.target.value })}
                  className="w-full text-xs rounded-xl p-2.5 bg-muted/30 border border-border/80 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddClientProspect(null)} className="rounded-xl text-xs flex-1">
                {t('analytics.waCancel')}
              </Button>
              <Button
                onClick={handleSaveClient}
                disabled={savingClient}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex-1 py-2.5 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {savingClient ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{savingClient ? t('analytics.saving') : t('analytics.saveClientBtn')}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Plan Comparison Dialog */}
      <PlanComparisonDialog
        open={isComparisonOpen}
        onOpenChange={setIsComparisonOpen}
        currentPlan={currentPlanName}
        onSelectPlan={handleUpgradePlan}
        onUpgrade={handleUpgradePlan}
      />

      {/* Payment Checkout Modal */}
      {selectedUpgradePlan && salon && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          planKey={selectedUpgradePlan}
          salonId={salon._id || salon.id}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            if (refetchSalon) refetchSalon();
            fetchAnalytics();
          }}
        />
      )}
    </div>
  );
}
