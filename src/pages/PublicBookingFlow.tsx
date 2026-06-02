import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z } from 'zod';
import { ArrowLeft, Check, ChevronRight, Clock, Sun, Sunset, Moon, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { BrandedShell } from '@/components/booking/BrandedShell';
import {
  readPublicSalon, readServices, readRendezVous,
  addPublicRendezVous, makeReference, buildTimeSlots, isSlotTaken,
} from '@/lib/booking';
import type { TypePrestation } from '@/types';

type Step = 1 | 2 | 3 | 4;

const customerSchema = z.object({
  fullName: z.string().trim().min(2, 'Nom requis').max(80),
  phone: z.string().trim().min(8, 'Téléphone invalide').max(20),
  email: z.string().trim().email('Email invalide').max(120).optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});

export default function PublicBookingFlow() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const salon = slug ? readPublicSalon(slug) : null;
  if (!salon) return <Navigate to="/booking/not-found" replace />;

  const services = readServices(salon.id);
  const settings = salon.bookingSettings!;
  const slots = useMemo(
    () => buildTimeSlots(settings.openingHour, settings.closingHour, settings.slotDurationMin),
    [settings],
  );

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<TypePrestation | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const existing = readRendezVous(salon.id);

  const next = () => setStep(s => Math.min(4, (s + 1)) as Step);
  const back = () => (step === 1 ? navigate(`/booking/${slug}`) : setStep(s => (s - 1) as Step));

  const handleSubmit = () => {
    const parsed = customerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    if (!service || !date || !time) return;
    const reference = makeReference();
    addPublicRendezVous(salon.id, {
      clientId: '',
      typePrestationId: service.id,
      date: dateStr,
      heure: time,
      duree: settings.slotDurationMin,
      statut: settings.autoConfirm ? 'confirme' : 'en_attente',
      source: 'public',
      customerName: parsed.data.fullName,
      customerPhone: parsed.data.phone,
      customerEmail: parsed.data.email || undefined,
      notes: parsed.data.notes,
      reference,
      createdAt: new Date().toISOString(),
    });
    navigate(`/booking/${slug}/confirmation/${reference}`, {
      state: { service: service.nom, date: dateStr, time, salon: salon.nom },
    });
  };

  const stepTitle = ['Prestation', 'Date & heure', 'Vos informations', 'Confirmation'][step - 1];

  // Group services by category for easier scanning
  const servicesByCategory = useMemo(() => {
    const groups = new Map<string, TypePrestation[]>();
    for (const s of services) {
      const cat = s.categorie || 'Prestations';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(s);
    }
    return Array.from(groups.entries());
  }, [services]);

  // Group time slots by period
  const slotGroups = useMemo(() => {
    const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
    for (const t of slots) {
      const h = parseInt(t.split(':')[0], 10);
      if (h < 12) morning.push(t);
      else if (h < 17) afternoon.push(t);
      else evening.push(t);
    }
    return [
      { label: 'Matin', icon: Sun, items: morning },
      { label: 'Après-midi', icon: Sunset, items: afternoon },
      { label: 'Soirée', icon: Moon, items: evening },
    ].filter(g => g.items.length > 0);
  }, [slots]);

  return (
    <BrandedShell salon={salon}>
      <div className="max-w-xl mx-auto px-4 pt-4 pb-32">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={back} className="h-10 w-10 -ml-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Étape {step} sur 4
            </div>
            <h1 className="text-xl font-bold leading-tight">{stepTitle}</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-5">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                n <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Persistent selection summary (steps 2+) */}
        {step > 1 && service && (
          <button
            onClick={() => setStep(1)}
            className="w-full mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{service.nom}</div>
              <div className="text-xs text-muted-foreground">
                {service.prix.toLocaleString('fr-FR')} FCFA · {settings.slotDurationMin} min
              </div>
            </div>
            <span className="text-xs text-primary font-medium">Modifier</span>
          </button>
        )}
        {step > 2 && date && time && (
          <button
            onClick={() => setStep(2)}
            className="w-full mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {format(date, 'EEEE dd MMMM', { locale: fr })}
              </div>
              <div className="text-xs text-muted-foreground">à {time}</div>
            </div>
            <span className="text-xs text-primary font-medium">Modifier</span>
          </button>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-6">
            {servicesByCategory.map(([cat, items]) => (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {cat}
                </h2>
                <div className="space-y-2">
                  {items.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setService(s); next(); }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all bg-card active:scale-[0.98] hover:border-primary hover:shadow-md ${
                        service?.id === s.id ? 'border-primary shadow-md' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[15px]">{s.nom}</div>
                          {s.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {s.description}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {settings.slotDurationMin} min
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-primary text-lg leading-none">
                            {s.prix.toLocaleString('fr-FR')}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">FCFA</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Date & time */}
        {step === 2 && (
          <div className="space-y-5">
            <Card className="p-2 flex justify-center rounded-2xl">
              <Calendar
                mode="single"
                selected={date}
                onSelect={d => { setDate(d); setTime(null); }}
                disabled={d => {
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  if (d < today) return true;
                  if (settings.closedDays?.includes(d.getDay())) return true;
                  return false;
                }}
                locale={fr}
                className="pointer-events-auto"
              />
            </Card>
            {date && (
              <div className="space-y-4">
                {slotGroups.map(g => {
                  const Icon = g.icon;
                  const available = g.items.filter(t => !isSlotTaken(existing, dateStr, t));
                  return (
                    <div key={g.label}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {g.label}
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          ({available.length} disponible{available.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {g.items.map(t => {
                          const taken = isSlotTaken(existing, dateStr, t);
                          return (
                            <button
                              key={t}
                              disabled={taken}
                              onClick={() => setTime(t)}
                              className={`h-11 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                                taken
                                  ? 'opacity-25 cursor-not-allowed border-muted line-through'
                                  : time === t
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                    : 'bg-card border-border hover:border-primary'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer info */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Nom complet *</Label>
              <Input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="h-12 mt-1.5 rounded-xl text-base"
                placeholder="Marie Nguema"
              />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium">Téléphone *</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="h-12 mt-1.5 rounded-xl text-base"
                placeholder="+237 6XX XXX XXX"
                type="tel"
                inputMode="tel"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium">Email (optionnel)</Label>
              <Input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="h-12 mt-1.5 rounded-xl text-base"
                placeholder="vous@email.com"
                type="email"
                inputMode="email"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium">Notes (optionnel)</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="mt-1.5 rounded-xl"
                rows={3}
                placeholder="Demandes particulières..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && service && date && time && (
          <div className="space-y-4">
            <Card className="p-5 space-y-3 rounded-2xl">
              <Row label="Salon" value={salon.nom} />
              <Row label="Prestation" value={service.nom} />
              <Row label="Date" value={format(date, 'EEEE dd MMMM yyyy', { locale: fr })} />
              <Row label="Heure" value={time} />
              <Row label="Durée" value={`${settings.slotDurationMin} min`} />
              <Row label="Prix" value={`${service.prix.toLocaleString('fr-FR')} FCFA`} highlight />
              <div className="border-t pt-3">
                <Row label="Client" value={form.fullName} />
                <Row label="Téléphone" value={form.phone} />
                {form.email && <Row label="Email" value={form.email} />}
              </div>
            </Card>
            <p className="text-xs text-muted-foreground text-center px-4">
              {settings.autoConfirm
                ? 'Votre rendez-vous sera confirmé automatiquement.'
                : 'Le salon recevra votre demande et la confirmera sous peu.'}
            </p>
          </div>
        )}
      </div>

      {/* Sticky action bar (steps 2-4) */}
      {step > 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            {service && (
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                <div className="text-base font-bold text-primary leading-tight truncate">
                  {service.prix.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            )}
            {step === 2 && (
              <Button className="flex-[2] h-12 rounded-xl gradient-primary shadow-md" disabled={!date || !time} onClick={next}>
                Continuer <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button className="flex-[2] h-12 rounded-xl gradient-primary shadow-md" onClick={next} disabled={!form.fullName || !form.phone}>
                Vérifier <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button className="flex-[2] h-12 rounded-xl gradient-primary shadow-md" onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
            )}
          </div>
        </div>
      )}
    </BrandedShell>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-bold text-primary' : 'font-medium'}>{value}</span>
    </div>
  );
}