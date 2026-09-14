import React, { useEffect, useState, useMemo } from 'react';
import {
  Eye, ShoppingCart, CheckCircle2, TrendingUp, MessageSquare, Mail, Phone, Search,
  Sparkles, RefreshCw, Share2, Copy, Send, ArrowUpRight, Filter, Zap, Clock, Users,
  Check, ExternalLink, Activity, Download, UserPlus, Flame, ChevronRight, AlertCircle,
  Calendar, BarChart2, PieChart, Layers, HelpCircle, CheckCircle, Smartphone, Globe,
  MessageCircle, Star, PhoneCall, LayoutGrid, Table as TableIcon, Bookmark, UserCheck,
  ChevronDown, ChevronUp, History, UserCheck2, ListFilter
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSalon } from '@/hooks/useSalon';
import { useClients } from '@/hooks/useClients';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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

export default function Audience() {
  const { salon } = useSalon();
  const { clients } = useClients();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedAllPhones, setCopiedAllPhones] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
      title: 'Statut mis à jour',
      description: status === 'contacted' ? 'Prospect marqué comme contacté' : status === 'converted' ? 'Lead marqué comme converti en client !' : 'Statut enregistré'
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
    toast({ title: 'Lien copié !', description: 'Le lien de votre fiche publique a été copié dans le presse-papier.' });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsAppStatus = () => {
    const salonName = salon?.nom || salon?.name || 'notre salon';
    const text = `✨ Prenez rendez-vous en ligne chez ${salonName} en 30 secondes ! Consultez nos prestations et nos disponibilités ici :\n${publicUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
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
    return { label: 'Ordinateur', icon: Globe };
  };

  // Group multiple events of the SAME client/prospect together!
  const groupedProspects = useMemo<GroupedProspect[]>(() => {
    const map = new Map<string, GroupedProspect>();

    timeFilteredEvents.forEach(ev => {
      const cleanPhone = (ev.customerPhone || '').replace(/\D/g, '');
      const cleanEmail = (ev.customerEmail || '').toLowerCase().trim();
      const appUserId = ev.appUser ? (typeof ev.appUser === 'object' ? ev.appUser._id : ev.appUser) : null;

      // Grouping key hierarchy: Phone > Email > AppUser > Event ID
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

      if (!existing) {
        map.set(groupKey, {
          id: groupKey,
          name: ev.customerName && ev.customerName !== 'Visiteur Anonyme' ? ev.customerName : 'Visiteur Anonyme',
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

        // Upgrade name if currently anonymous and this event has a real name
        if (existing.name === 'Visiteur Anonyme' && ev.customerName && ev.customerName !== 'Visiteur Anonyme') {
          existing.name = ev.customerName;
        }
        if (!existing.phone && ev.customerPhone) existing.phone = ev.customerPhone;
        if (!existing.email && ev.customerEmail) existing.email = ev.customerEmail;

        // Upgrade highest intent
        if (isCompleted) {
          existing.highestIntent = 'booking_completed';
        } else if (isStart && existing.highestIntent !== 'booking_completed') {
          existing.highestIntent = 'booking_started';
        }

        // Merge services
        if (Array.isArray(ev.selectedServices)) {
          ev.selectedServices.forEach(s => {
            if (s && !existing.services.includes(s)) existing.services.push(s);
          });
        }

        // Merge devices
        if (!existing.devices.includes(device)) existing.devices.push(device);

        // Update timestamps
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
  }, [timeFilteredEvents, followUps]);

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

  // Hot leads (cart abandons or visitors with phone waiting for relance)
  const hotLeads = useMemo(() => {
    return groupedProspects.filter(p => Boolean(p.phone) && p.followUpStatus === 'pending' && p.highestIntent !== 'booking_completed');
  }, [groupedProspects]);

  // Quick copy all distinct phone numbers
  const handleCopyAllPhones = () => {
    const phoneSet = new Set<string>();
    groupedProspects.forEach(p => {
      if (p.phone) {
        phoneSet.add(p.phone.trim());
      }
    });
    const phoneList = Array.from(phoneSet).join(', ');
    if (!phoneList) {
      toast({ title: 'Aucun numéro de téléphone', description: 'Aucun prospect avec téléphone disponible.', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(phoneList);
    setCopiedAllPhones(true);
    toast({ title: `${phoneSet.size} numéro(s) unique(s) copié(s) !`, description: 'Collez-les dans vos messages ou campagnes SMS.' });
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
        const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        daysMap.set(key, { date: key, vues: 0, abandons: 0, confirmes: 0 });
      }
      timeFilteredEvents.forEach(ev => {
        const d = new Date(ev.createdAt);
        const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        const entry = daysMap.get(key);
        if (entry) {
          if (ev.eventType === 'view_page') entry.vues += 1;
          else if (ev.eventType === 'booking_started') entry.abandons += 1;
          else if (ev.eventType === 'booking_completed') entry.confirmes += 1;
        }
      });
    }

    return Array.from(daysMap.values());
  }, [timeFilteredEvents, timeRange]);

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
      return [{ name: 'Soins Beauté Globaux', count: currentStats.views || 1 }];
    }
    return list;
  }, [timeFilteredEvents, currentStats]);

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
      { subject: '👁️ Vues Fiche', val: Math.round((views / maxVal) * 100), raw: views },
      { subject: '🛒 Paniers', val: Math.round((starts / maxVal) * 100), raw: starts },
      { subject: '💇 Intérêt Services', val: Math.round((serviceInterests / maxVal) * 100), raw: serviceInterests },
      { subject: '✅ Confirmés', val: Math.round((confirmed / maxVal) * 100), raw: confirmed },
      { subject: '📈 Conversion %', val: Math.min(Math.round(conversion * 2.5), 100), raw: `${conversion}%` },
      { subject: '📱 Joignables', val: Math.round((currentStats.withPhone / Math.max(groupedProspects.length, 1)) * 100), raw: currentStats.withPhone }
    ];
  }, [currentStats, timeFilteredEvents, groupedProspects]);

  // WhatsApp Message templates
  const getTemplates = (prospect: any) => {
    const salonName = salon?.nom || salon?.name || 'notre salon';
    const customerName = prospect?.name && prospect.name !== 'Visiteur Anonyme'
      ? prospect.name
      : (prospect?.customerName && prospect.customerName !== 'Visiteur Anonyme' ? prospect.customerName : 'Bonjour');
    
    const servicesList = Array.isArray(prospect?.services) && prospect.services.length > 0
      ? prospect.services
      : (Array.isArray(prospect?.selectedServices) ? prospect.selectedServices : []);
      
    const serviceName = servicesList.length > 0
      ? `la prestation "${servicesList[0]}"`
      : 'nos prestations beauté';

    return [
      {
        title: '⚡ Relance d\'abandon de réservation (Prioritaire)',
        badge: 'Recommandé',
        text: `Bonjour ${customerName} 👋,\n\nJ'ai remarqué votre intérêt pour ${serviceName} chez ${salonName} ✨.\n\nAvez-vous besoin d'aide ou d'un conseil pour choisir votre heure de rendez-vous ?\n\nFinalisez en 30 secondes ici : ${publicUrl}`
      },
      {
        title: '🎁 Offre de Bienvenue / Remise Flash',
        badge: 'Conversion +30%',
        text: `Bonjour ${customerName} ✨,\n\nToute l'équipe de ${salonName} serait ravie de vous recevoir !\n\nRéservez aujourd'hui pour bénéficier de notre meilleur accueil et d'un soin sur-mesure :\n${publicUrl}`
      },
      {
        title: '💬 Prise de contact conseil & disponibilités',
        badge: 'Personnalisé',
        text: `Bonjour ${customerName} !\n\nBesoin d'un renseignement sur nos disponibilités ou tarifs chez ${salonName} ? Répondez-moi directement ici sur WhatsApp ou réservez en ligne : ${publicUrl}`
      },
      {
        title: '👑 Accompagnement VIP & Créneau Garanti',
        badge: 'Fidélisation',
        text: `Bonjour ${customerName} 🌸,\n\nNos créneaux pour ${serviceName} chez ${salonName} partent très vite cette semaine. Souhaitez-vous que je vous réserve un horaire spécifique ?\n${publicUrl}`
      }
    ];
  };

  const openWhatsAppModal = (prospect: any) => {
    setSelectedProspect(prospect);
    const templates = getTemplates(prospect);
    setSelectedTemplate(0);
    setCustomMessage(templates[0].text);
  };

  const handleSendWhatsApp = () => {
    if (!selectedProspect) return;
    const rawPhone = selectedProspect.phone || selectedProspect.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast({ title: 'Numéro invalide', description: 'Aucun numéro de téléphone disponible.', variant: 'destructive' });
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
      toast({ title: 'Aucune adresse email enregistrée', variant: 'destructive' });
      return;
    }

    const salonName = salon?.nom || salon?.name || 'notre salon';
    const customerName = prospect.name && prospect.name !== 'Visiteur Anonyme' ? prospect.name : 'Client(e)';
    const subject = `Finalisez votre rendez-vous chez ${salonName} — BeautyFlow`;
    const body = `Bonjour ${customerName},\n\nNous avons remarqué votre visite sur la fiche de ${salonName}.\n\nSouhaitez-vous réserver votre créneau ? Cliquez ci-dessous pour finaliser votre réservation :\n${publicUrl}\n\nÀ très vite !`;

    const key = prospect.id || prospect._id;
    saveFollowUp(key, 'contacted');

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Convert prospect to Official Client
  const openAddClientModal = (prospect: any) => {
    setAddClientProspect(prospect);
    const servicesList = prospect.services || prospect.selectedServices || [];
    const serviceName = servicesList[0] || '';
    setClientFormData({
      nom: prospect.name && prospect.name !== 'Visiteur Anonyme' ? prospect.name : (prospect.customerName || ''),
      telephone: prospect.phone || prospect.customerPhone || '',
      email: prospect.email || prospect.customerEmail || '',
      notes: serviceName ? `Prospect Marketplace - Intérêt pour: ${serviceName}` : 'Prospect Marketplace'
    });
  };

  const handleSaveClient = async () => {
    if (!salon) return;
    if (!clientFormData.nom.trim()) {
      toast({ title: 'Nom requis', description: 'Veuillez saisir un nom pour le client.', variant: 'destructive' });
      return;
    }
    if (!clientFormData.telephone.trim()) {
      toast({ title: 'Téléphone requis', description: 'Veuillez saisir un numéro de téléphone.', variant: 'destructive' });
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
        title: 'Client ajouté avec succès !',
        description: `${clientFormData.nom} est désormais enregistré dans votre base client.`
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

  // Export CSV
  const handleExportCSV = () => {
    if (groupedProspects.length === 0) {
      toast({ title: 'Aucune donnée à exporter', variant: 'destructive' });
      return;
    }

    const headers = ['Nom', 'Telephone', 'Email', 'Nombre Total Sessions', 'Vues', 'Paniers', 'RDV Valides', 'Prestations', 'Statut Relance', 'Derniere Visite'];
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
        `"${new Date(p.lastSeen).toLocaleString('fr-FR')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `beautyflow_prospects_grouped_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export CSV réussi !', description: 'La liste dédupliquée des clients et prospects a été téléchargée.' });
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-purple-900 to-slate-950 text-white p-6 lg:p-8 shadow-2xl border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute left-1/3 -top-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-rose-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Données MongoDB en direct • Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Audience, Traçage & Parcours Prospects
            </h1>
            <p className="text-rose-100/80 text-sm lg:text-base leading-relaxed">
              Retrouvez chaque client avec ses multiples états, ses passages répétés et ses paniers abandonnés regroupés pour des relances ultra-efficaces.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleCopyLink}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Lien Copié' : 'Copier Mon Lien'}
            </Button>

            <Button
              onClick={handleShareWhatsAppStatus}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Statut WhatsApp
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bg-white/5 hover:bg-white/15 text-white border-white/20 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md flex items-center gap-2"
              title="Exporter les contacts en CSV"
            >
              <Download className="w-4 h-4" />
              CSV Groupé
            </Button>

            <Button
              onClick={() => fetchAnalytics(false)}
              variant="outline"
              className="bg-rose-500/20 hover:bg-rose-500/30 text-white border-rose-400/40 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Time Filters Sub-bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl backdrop-blur-md border border-white/10 text-xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                timeRange === 'all' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              Tout ({groupedProspects.length} profils / {events.length} sessions)
            </button>
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                timeRange === 'today' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                timeRange === 'week' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                timeRange === 'month' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-100/70 hover:text-white'
              }`}
            >
              30 jours
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-rose-200/80">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{currentStats.withPhone}</strong> contacts uniques</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span><strong>{hotLeads.length}</strong> à relancer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Leads Smart Action Alert Banner */}
      {hotLeads.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center shadow-lg shrink-0">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-foreground flex items-center gap-2 text-sm sm:text-base">
                <span>{hotLeads.length} prospect(s) avec plusieurs interactions en attente de relance</span>
                <Badge className="bg-amber-500 text-white border-0 text-[10px] font-bold uppercase px-2 py-0.5">
                  Action Immédiate
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dernier profil actif : <strong className="text-foreground">{hotLeads[0].name}</strong> ({hotLeads[0].phone}) • <em>{hotLeads[0].totalEvents} interactions ({hotLeads[0].startsCount} abandons de panier)</em>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => openWhatsAppModal(hotLeads[0])}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold px-4 py-2.5 shadow-md flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              Relancer {hotLeads[0].name}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('hot_leads')}
              className="rounded-2xl text-xs font-semibold px-3 py-2.5"
            >
              Voir la liste ({hotLeads.length})
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Views */}
        <Card className="relative overflow-hidden border-rose-500/20 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-rose-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vues & Sessions</span>
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">{currentStats.views}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-rose-500" /> {currentStats.uniqueProspects} personnes distinctes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Booking Starts (Cart Abandons) */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-amber-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paniers Entamés</span>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{currentStats.starts}</div>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Intentions de réservation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Confirmed */}
        <Card className="relative overflow-hidden border-emerald-500/20 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RDV Confirmés</span>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{currentStats.completed}</div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ventes finalisées
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Conversion & Contact */}
        <Card className="relative overflow-hidden border-purple-500/20 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-purple-500/10 transition-all rounded-3xl group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taux de Conversion</span>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{currentStats.conversionRate}%</div>
              <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-purple-500" /> {currentStats.contactRate}% de joignabilité ({currentStats.withPhone} numéros)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel Breakdown */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                Tunnel de Conversion & Entonnoir Commercial
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Suivez la progression des visiteurs depuis la première visite jusqu'à la confirmation de RDV.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 self-start">
              Funnel Live
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Views */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">1. Visiteurs Fiche</span>
                <Eye className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground">{currentStats.views}</div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full w-full" />
              </div>
              <p className="text-[11px] text-muted-foreground">{currentStats.uniqueProspects} personnes uniques</p>
            </div>

            {/* Step 2: Service Selection */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">2. Choix Service</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground">
                {timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length}
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                {currentStats.views > 0 ? Math.round((timeFilteredEvents.filter(e => e.selectedServices && e.selectedServices.length > 0).length / currentStats.views) * 100) : 0}% des sessions
              </p>
            </div>

            {/* Step 3: Cart / Starts */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">3. Début Réservation</span>
                <ShoppingCart className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{currentStats.starts}</div>
              <div className="w-full bg-amber-200/50 dark:bg-amber-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((currentStats.starts / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                {currentStats.views > 0 ? Math.round((currentStats.starts / currentStats.views) * 100) : 0}% passent au panier
              </p>
            </div>

            {/* Step 4: Completed */}
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">4. RDV Confirmé</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{currentStats.completed}</div>
              <div className="w-full bg-emerald-200/50 dark:bg-emerald-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${currentStats.views > 0 ? Math.min(100, Math.round((currentStats.completed / currentStats.views) * 100)) : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {currentStats.conversionRate}% conversion finale
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Visual Charts Tabs */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-6 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-rose-500" />
              Graphiques & Performance
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Analysez la dynamique de votre audience, vos meilleures prestations et les créneaux d'affluence.
            </CardDescription>
          </div>

          <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 rounded-2xl bg-muted/60 p-1 text-xs">
              <TabsTrigger value="evolution" className="rounded-xl text-xs">Évolution</TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl text-xs">Top Services</TabsTrigger>
              <TabsTrigger value="hours" className="rounded-xl text-xs">Heures</TabsTrigger>
              <TabsTrigger value="radar" className="rounded-xl text-xs">Spiderweb</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-6">
          {activeChartTab === 'evolution' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Évolution du trafic et des intentions ({timeRange === 'today' ? 'Par heure' : 'Par jour'})</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Vues</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Paniers</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> RDV</span>
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
                    <Area type="monotone" dataKey="vues" name="Vues Fiche" stroke="#e11d48" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVues)" />
                    <Area type="monotone" dataKey="abandons" name="Paniers Entamés" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorAbandons)" />
                    <Area type="monotone" dataKey="confirmes" name="RDV Confirmés" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConfirmes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'services' && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">
                Prestations les plus recherchées et sélectionnées par les visiteurs de votre fiche
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
                    <Bar dataKey="count" name="Nombre d'intérêts" fill="#e11d48" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'hours' && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">
                Affluence par heure de la journée — Idéal pour programmer vos statuts WhatsApp et stories
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
                    <Bar dataKey="visites" name="Visiteurs" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="interet" name="Intentions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChartTab === 'radar' && (
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-muted-foreground mb-2 self-start">
                Cartographie d'équilibre 360° (Trafic, Intérêt, Intentions, RDV, Joignabilité)
              </div>
              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                    <Radar
                      name="Score Salon"
                      dataKey="val"
                      stroke="#e11d48"
                      fill="#f43f5e"
                      fillOpacity={0.45}
                      strokeWidth={2.5}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any, item: any) => [`Donnée réelle : ${item.payload.raw}`, 'Performance']}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Prospects Section: Grouped vs Raw Toggle & Table / Cards */}
      <Card className="border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="p-6 lg:p-8 bg-muted/20 border-b border-border/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <Users className="w-6 h-6 text-rose-500" />
                {groupingMode === 'grouped' ? 'Fiches Prospects & Clients Dédupliqués' : 'Journal Brut des Sessions & Visites'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {groupingMode === 'grouped'
                  ? `Visualisez chaque personne avec l'historique complet de ses passages, paniers et réservations (${filteredGroupedProspects.length} profils).`
                  : `Toutes les interactions brutes enregistrées en base de données (${filteredRawEvents.length} événements).`}
              </CardDescription>
            </div>

            {/* Right Controls: Grouping Toggle, Search, View Toggle, Copy All Phones */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Grouping Toggle (Grouped by person vs Raw events) */}
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
                  <span>Par Client ({groupedProspects.length})</span>
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
                  <span>Journal Brut ({events.length})</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher nom, tél..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-2xl bg-background border-border/80"
                />
              </div>

              {/* Copy Phones */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAllPhones}
                className="h-9 rounded-2xl text-xs font-semibold px-3 flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                title="Copier tous les numéros de téléphone uniques"
              >
                {copiedAllPhones ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier Tél ({groupedProspects.filter(p => p.phone).length})</span>
              </Button>

              {/* Table / Cards View Toggle */}
              <div className="flex items-center rounded-2xl bg-muted/70 p-0.5 border border-border/50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  title="Vue Tableau"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  title="Vue Cartes"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="rounded-xl text-xs font-semibold"
            >
              Tous ({groupingMode === 'grouped' ? groupedProspects.length : timeFilteredEvents.length})
            </Button>
            <Button
              variant={activeTab === 'hot_leads' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('hot_leads')}
              className="rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30"
            >
              📱 Avec Téléphone ({groupedProspects.filter(p => Boolean(p.phone)).length})
            </Button>
            <Button
              variant={activeTab === 'starts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('starts')}
              className="rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border-amber-500/30"
            >
              ⚠️ Avec Panier ({groupedProspects.filter(p => p.startsCount > 0 && p.highestIntent !== 'booking_completed').length})
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className="rounded-xl text-xs font-semibold"
            >
              ⏳ À Relancer ({hotLeads.length})
            </Button>
            <Button
              variant={activeTab === 'contacted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('contacted')}
              className="rounded-xl text-xs font-semibold"
            >
              💬 Déjà Contactés
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('completed')}
              className="rounded-xl text-xs font-semibold bg-teal-500/15 text-teal-800 dark:text-teal-300 hover:bg-teal-500/25 border-teal-500/30"
            >
              ✅ RDV Validés ({groupedProspects.filter(p => p.highestIntent === 'booking_completed').length})
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
            /* GROUPED PROSPECTS VIEW (NO DUPLICATES) */
            filteredGroupedProspects.length > 0 ? (
              viewMode === 'table' ? (
                /* Grouped Table View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                      <tr>
                        <th className="py-4 px-6">Prospect / Client</th>
                        <th className="py-4 px-6">Téléphone & Email</th>
                        <th className="py-4 px-6">États & Historique</th>
                        <th className="py-4 px-6">Prestations d'Intérêt</th>
                        <th className="py-4 px-6">Dernière Activité</th>
                        <th className="py-4 px-6">Statut Suivi</th>
                        <th className="py-4 px-6 text-right">Relances 1-Clic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredGroupedProspects.map((prospect) => {
                        const initial = (prospect.name || 'V')[0].toUpperCase();
                        const isCompleted = prospect.highestIntent === 'booking_completed';
                        const isStarted = prospect.highestIntent === 'booking_started';
                        const cleanPhone = prospect.phone.replace(/\D/g, '');
                        const matchedClient = cleanPhone ? clientsByPhone.get(cleanPhone) : null;
                        const isExpanded = Boolean(expandedProspects[prospect.id]);

                        return (
                          <React.Fragment key={prospect.id}>
                            <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}>
                              {/* Prospect Name & Profile */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-2xl text-white font-bold flex items-center justify-center shadow-md shrink-0 ${
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
                                  <div>
                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                      <span>{prospect.name}</span>
                                      {matchedClient && (
                                        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] px-1.5 py-0">
                                          <UserCheck className="w-3 h-3 mr-0.5" /> Client Salon
                                        </Badge>
                                      )}
                                      {!matchedClient && prospect.phone && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                          Prospect Chaud
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      <Smartphone className="w-3 h-3 text-muted-foreground/80" />
                                      <span>{prospect.devices.join(', ') || 'Web'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Phone & Email */}
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  {prospect.phone ? (
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`tel:${prospect.phone}`}
                                        className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                        title="Appeler directement"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                        {prospect.phone}
                                      </a>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(prospect.phone);
                                          toast({ title: 'Téléphone copié !', description: prospect.phone });
                                        }}
                                        className="text-muted-foreground hover:text-foreground"
                                        title="Copier le numéro"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs italic text-muted-foreground/60">Non renseigné</span>
                                  )}

                                  {prospect.email && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Mail className="w-3 h-3 text-muted-foreground" />
                                      <span className="truncate max-w-[150px]">{prospect.email}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Consolidated States & Journey Badge */}
                              <td className="py-4 px-6">
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isCompleted ? (
                                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-lg font-bold">
                                        ✅ RDV Validé ({prospect.completedCount})
                                      </Badge>
                                    ) : isStarted ? (
                                      <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-lg animate-pulse">
                                        ⚠️ Panier Abandonné ({prospect.startsCount})
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-slate-600 px-2.5 py-0.5 rounded-lg">
                                        👁️ Visiteur ({prospect.visitsCount}x)
                                      </Badge>
                                    )}

                                    {prospect.totalEvents > 1 && (
                                      <button
                                        onClick={() => toggleExpand(prospect.id)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                      >
                                        <span>{prospect.totalEvents} sessions</span>
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-muted-foreground">
                                    {prospect.visitsCount} visite(s) • {prospect.startsCount} panier(s) • {prospect.completedCount} RDV
                                  </div>
                                </div>
                              </td>

                              {/* Services */}
                              <td className="py-4 px-6 text-xs text-muted-foreground max-w-xs">
                                {prospect.services.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {prospect.services.map((s, idx) => (
                                      <span key={idx} className="font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md text-[11px]">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="italic text-muted-foreground/60">Navigation générale</span>
                                )}
                              </td>

                              {/* Last Activity Date */}
                              <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{new Date(prospect.lastSeen).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}</span>
                                </div>
                              </td>

                              {/* Follow-up Status Dropdown */}
                              <td className="py-4 px-6 whitespace-nowrap">
                                <select
                                  value={prospect.followUpStatus}
                                  onChange={(e) => saveFollowUp(prospect.id, e.target.value as any)}
                                  className={`text-xs font-semibold rounded-xl px-2.5 py-1 border transition-all cursor-pointer ${
                                    prospect.followUpStatus === 'converted'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                      : prospect.followUpStatus === 'contacted'
                                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                        : prospect.followUpStatus === 'dropped'
                                          ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  <option value="pending">⏳ Non contacté</option>
                                  <option value="contacted">💬 Déjà contacté</option>
                                  <option value="converted">🎯 Converti en RDV</option>
                                  <option value="dropped">❌ Abandonné</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {prospect.phone ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => openWhatsAppModal(prospect)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1.5 shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                        WhatsApp
                                      </Button>

                                      <a
                                        href={`tel:${prospect.phone}`}
                                        className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground transition-colors"
                                        title="Appeler ce numéro"
                                      >
                                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                                      </a>

                                      {!matchedClient && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openAddClientModal(prospect)}
                                          className="rounded-xl text-xs px-2.5 py-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 flex items-center gap-1"
                                          title="Ajouter au carnet client officiel"
                                        >
                                          <UserPlus className="w-3.5 h-3.5" /> + Client
                                        </Button>
                                      )}
                                    </>
                                  ) : null}

                                  {prospect.email && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEmailRelance(prospect)}
                                      className="rounded-xl text-xs px-2.5 py-1.5 flex items-center gap-1"
                                      title="Envoyer un email de relance"
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
                                <td colSpan={7} className="p-4 sm:p-6">
                                  <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                      <span className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-rose-500" />
                                        Historique détaillé des {prospect.events.length} sessions de {prospect.name}
                                      </span>
                                      <span className="text-muted-foreground font-normal">
                                        Première visite : {new Date(prospect.firstSeen).toLocaleDateString('fr-FR')} • Dernière : {new Date(prospect.lastSeen).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>

                                    <div className="divide-y divide-border/40">
                                      {prospect.events.map((ev, evIdx) => (
                                        <div key={ev._id || evIdx} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                          <div className="flex items-center gap-3">
                                            <span className="font-mono text-muted-foreground text-[11px] w-6">#{evIdx + 1}</span>
                                            {ev.eventType === 'booking_completed' ? (
                                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                                                ✅ Réservation Confirmée
                                              </Badge>
                                            ) : ev.eventType === 'booking_started' ? (
                                              <Badge className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-[10px]">
                                                ⚠️ Panier Abandonné
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-[10px] text-slate-500">
                                                👁️ Visite Simple Fiche
                                              </Badge>
                                            )}

                                            <span className="font-medium text-foreground">
                                              {ev.selectedServices && ev.selectedServices.length > 0
                                                ? ev.selectedServices.join(', ')
                                                : 'Consultation générale salon'}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {new Date(ev.createdAt).toLocaleString('fr-FR', {
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
              ) : (
                /* Grouped Cards View */
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroupedProspects.map((prospect) => {
                    const initial = (prospect.name || 'V')[0].toUpperCase();
                    const isCompleted = prospect.highestIntent === 'booking_completed';
                    const isStarted = prospect.highestIntent === 'booking_started';
                    const cleanPhone = prospect.phone.replace(/\D/g, '');
                    const matchedClient = cleanPhone ? clientsByPhone.get(cleanPhone) : null;
                    const isExpanded = Boolean(expandedProspects[prospect.id]);

                    return (
                      <div key={prospect.id} className="p-5 rounded-3xl bg-muted/25 border border-border/60 hover:border-rose-500/30 transition-all space-y-4 flex flex-col justify-between shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center shadow-md shrink-0 ${
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
                              <div>
                                <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                  <span>{prospect.name}</span>
                                  {matchedClient && (
                                    <Badge className="bg-purple-500/15 text-purple-700 border-purple-500/30 text-[10px] px-1 py-0">
                                      Client
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  Dernière visite : {new Date(prospect.lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isCompleted ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-lg font-bold">
                                  RDV Validé
                                </Badge>
                              ) : isStarted ? (
                                <Badge className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                                  {prospect.startsCount} Panier(s)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[11px] text-slate-500 px-2 py-0.5 rounded-lg">
                                  {prospect.visitsCount} Visite(s)
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Contacts Box */}
                          <div className="p-3 rounded-2xl bg-background/80 border border-border/60 space-y-1.5 text-xs">
                            {prospect.phone ? (
                              <div className="flex items-center justify-between">
                                <a href={`tel:${prospect.phone}`} className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> {prospect.phone}
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(prospect.phone);
                                    toast({ title: 'Téléphone copié !', description: prospect.phone });
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-1"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-muted-foreground/60 italic flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> Aucun numéro renseigné
                              </div>
                            )}

                            {prospect.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0" /> {prospect.email}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40">
                              <span>{prospect.devices.join(', ')}</span>
                              <button
                                onClick={() => toggleExpand(prospect.id)}
                                className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>{prospect.totalEvents} interactions</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Services */}
                          {prospect.services.length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground text-[11px] font-semibold block mb-1">Prestations d'intérêt :</span>
                              <div className="flex flex-wrap gap-1">
                                {prospect.services.map((s, idx) => (
                                  <Badge key={idx} className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-[11px]">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expanded detail inside card */}
                          {isExpanded && (
                            <div className="p-3 rounded-2xl bg-card border border-border/60 text-[11px] space-y-2">
                              <div className="font-bold text-foreground flex items-center gap-1">
                                <History className="w-3 h-3 text-rose-500" /> Détail des {prospect.events.length} sessions :
                              </div>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {prospect.events.map((ev, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 border-b border-border/30 pb-1">
                                    <span className="font-medium">
                                      {ev.eventType === 'booking_completed' ? '✅ RDV Validé' : ev.eventType === 'booking_started' ? '⚠️ Panier' : '👁️ Visite'}
                                    </span>
                                    <span className="text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
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
                            className="text-xs font-semibold rounded-xl px-2 py-1.5 border bg-background"
                          >
                            <option value="pending">⏳ Non contacté</option>
                            <option value="contacted">💬 Déjà contacté</option>
                            <option value="converted">🎯 Converti</option>
                            <option value="dropped">❌ Abandonné</option>
                          </select>

                          <div className="flex items-center gap-1.5">
                            {prospect.phone && (
                              <Button
                                size="sm"
                                onClick={() => openWhatsAppModal(prospect)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1 shadow-md flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                                Relancer
                              </Button>
                            )}
                            {!matchedClient && prospect.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAddClientModal(prospect)}
                                className="rounded-xl text-xs px-2 py-1"
                                title="Ajouter aux clients"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
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
                <h3 className="text-lg font-bold text-foreground">Aucun profil prospect trouvé pour ce filtre</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  Partagez votre lien public sur vos statuts WhatsApp et Instagram pour recevoir instantanément de nouveaux visiteurs et prospects.
                </p>
                <Button onClick={handleShareWhatsAppStatus} className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-6 py-2.5 font-semibold text-sm">
                  <Share2 className="w-4 h-4 mr-2" /> Partager sur Statut WhatsApp
                </Button>
              </div>
            )
          ) : (
            /* RAW EVENTS CHRONOLOGICAL VIEW */
            filteredRawEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="py-4 px-6">Prospect / Nom</th>
                      <th className="py-4 px-6">Téléphone & Email</th>
                      <th className="py-4 px-6">Type d'Événement</th>
                      <th className="py-4 px-6">Prestation Consultée</th>
                      <th className="py-4 px-6">Date & Heure</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredRawEvents.map((ev) => {
                      const isStarted = ev.eventType === 'booking_started';
                      const isCompleted = ev.eventType === 'booking_completed';
                      const initial = (ev.customerName || 'V')[0].toUpperCase();

                      return (
                        <tr key={ev._id || Math.random()} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                {initial}
                              </div>
                              <div>
                                <div className="font-bold text-foreground text-xs">{ev.customerName || 'Visiteur Anonyme'}</div>
                                <div className="text-[11px] text-muted-foreground">{getDeviceLabel(ev.userAgent).label}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-xs">
                            {ev.customerPhone ? (
                              <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{ev.customerPhone}</div>
                            ) : (
                              <span className="italic text-muted-foreground/60">Non renseigné</span>
                            )}
                            {ev.customerEmail && <div className="text-[11px] text-muted-foreground">{ev.customerEmail}</div>}
                          </td>

                          <td className="py-4 px-6">
                            {isCompleted ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs">
                                ✅ RDV Confirmé
                              </Badge>
                            ) : isStarted ? (
                              <Badge className="bg-amber-500/20 text-amber-800 border-amber-500/40 text-xs font-semibold">
                                ⚠️ Panier Abandonné
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-slate-500">
                                👁️ Visite Simple
                              </Badge>
                            )}
                          </td>

                          <td className="py-4 px-6 text-xs text-muted-foreground">
                            {ev.selectedServices && ev.selectedServices.length > 0 ? (
                              <span className="font-semibold text-foreground bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded">
                                {ev.selectedServices.join(', ')}
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground/60">Consultation générale</span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ev.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>

                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {ev.customerPhone && (
                                <Button
                                  size="sm"
                                  onClick={() => openWhatsAppModal(ev)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-3 py-1 shadow-sm"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                  Relancer
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
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Aucun événement brut trouvé</h3>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Relance Dialog / Modal */}
      {selectedProspect && (
        <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
          <DialogContent className="sm:max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                <MessageSquare className="w-5 h-5 fill-emerald-600" />
                Relancer {selectedProspect.name || selectedProspect.customerName || 'ce prospect'} sur WhatsApp
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Numéro : <strong className="text-foreground">{selectedProspect.phone || selectedProspect.customerPhone}</strong> • Modèle prêt à l'envoi personnalisé
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Template Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Modèles de Message</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getTemplates(selectedProspect).map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTemplate(idx);
                        setCustomMessage(tmpl.text);
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all text-xs font-medium ${
                        selectedTemplate === idx
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                          : 'border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{tmpl.title}</span>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                          {tmpl.badge}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Message Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Message Prêt à envoyer</label>
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
                Annuler
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex-1 py-2.5 shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Envoyer sur WhatsApp
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
                Ajouter au Carnet Client
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Enregistrez ce prospect directement dans le fichier client officiel de votre salon.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Nom complet *</label>
                <Input
                  type="text"
                  placeholder="Ex: Marie Dupont"
                  value={clientFormData.nom}
                  onChange={(e) => setClientFormData({ ...clientFormData, nom: e.target.value })}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Numéro de téléphone *</label>
                <Input
                  type="tel"
                  placeholder="Ex: +237 6XXXXXXXX"
                  value={clientFormData.telephone}
                  onChange={(e) => setClientFormData({ ...clientFormData, telephone: e.target.value })}
                  className="rounded-xl text-xs h-10 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Adresse Email</label>
                <Input
                  type="email"
                  placeholder="Ex: client@email.com"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Historique de consultation</label>
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
                Annuler
              </Button>
              <Button
                onClick={handleSaveClient}
                disabled={savingClient}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex-1 py-2.5 shadow-lg flex items-center justify-center gap-2"
              >
                {savingClient ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingClient ? 'Enregistrement...' : 'Enregistrer le Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
