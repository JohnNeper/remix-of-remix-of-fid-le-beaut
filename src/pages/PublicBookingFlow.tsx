import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z } from 'zod';
import { ArrowLeft, Check, ChevronRight, Clock, User } from 'lucide-react';
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

  return (
    <BrandedShell salon={salon}>
      <div className="max-w-xl mx-auto px-4 py-4 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={back} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">{salon.nom}</div>
            <h1 className="text-lg font-semibold">{stepTitle}</h1>
          </div>
          <Badge variant="secondary">{step}/4</Badge>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-2">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => { setService(s); next(); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all bg-card hover:border-primary ${
                  service?.id === s.id ? 'border-primary' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.nom}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {settings.slotDurationMin} min
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{s.prix.toLocaleString('fr-FR')}</div>
                    <div className="text-[10px] text-muted-foreground">FCFA</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Date & time */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-2 flex justify-center">
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
              />
            </Card>
            {date && (
              <div>
                <Label className="text-sm mb-2 block">Créneaux disponibles</Label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(t => {
                    const taken = isSlotTaken(existing, dateStr, t);
                    return (
                      <button
                        key={t}
                        disabled={taken}
                        onClick={() => setTime(t)}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          taken
                            ? 'opacity-30 cursor-not-allowed border-muted'
                            : time === t
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button className="w-full h-12 gradient-primary" disabled={!date || !time} onClick={next}>
              Continuer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 3: Customer info */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nom complet *</Label>
              <Input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="h-11 mt-1"
                placeholder="Marie Nguema"
              />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label className="text-sm">Téléphone *</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="h-11 mt-1"
                placeholder="+237 6XX XXX XXX"
                type="tel"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label className="text-sm">Email (optionnel)</Label>
              <Input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="h-11 mt-1"
                placeholder="vous@email.com"
                type="email"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label className="text-sm">Notes (optionnel)</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="mt-1"
                rows={3}
                placeholder="Demandes particulières..."
              />
            </div>
            <Button className="w-full h-12 gradient-primary" onClick={next} disabled={!form.fullName || !form.phone}>
              Vérifier <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && service && date && time && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
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
            <p className="text-xs text-muted-foreground text-center">
              {settings.autoConfirm
                ? 'Votre rendez-vous sera confirmé automatiquement.'
                : 'Le salon recevra votre demande et la confirmera sous peu.'}
            </p>
            <Button className="w-full h-12 gradient-primary" onClick={handleSubmit}>
              <Check className="h-4 w-4 mr-2" />
              Confirmer la réservation
            </Button>
          </div>
        )}
      </div>
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