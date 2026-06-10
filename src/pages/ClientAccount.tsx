import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import {
  Heart, MapPin, Sparkles, Calendar, LogOut, Trash2, History, User as UserIcon,
  Mail, Phone, Edit3, Check, X, Camera, Award, Share2, MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader';
import { getSalonAccounts } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export default function ClientAccount() {
  const { client, signout, toggleFavorite, update } = useClientAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'profile';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', avatarUrl: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  if (!client) return <Navigate to="/explorer/login?redirect=/explorer/account" replace />;

  const allSalons = getSalonAccounts();
  const favorites = allSalons.filter(s => client.favorites.includes(s.id));

  const startEdit = () => {
    setForm({
      nom: client.nom,
      telephone: client.telephone || '',
      email: client.email,
      avatarUrl: client.avatarUrl || '',
    });
    setEditing(true);
  };
  const saveEdit = () => {
    update({
      nom: form.nom.trim() || client.nom,
      telephone: form.telephone.trim() || undefined,
      avatarUrl: form.avatarUrl || undefined,
    });
    setEditing(false);
    toast({ title: 'Profil mis à jour ✨' });
  };
  const onPickAvatar = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, avatarUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };
  const initials = client.nom.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const waLink = client.telephone ? `https://wa.me/${client.telephone.replace(/[^\d]/g, '')}` : '';

  return (
    <div className="min-h-screen bg-background pb-10">
      <ExplorerHeader />

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.25), transparent 40%)',
        }} />
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="relative mx-auto sm:mx-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white/95 backdrop-blur shadow-2xl ring-4 ring-white/40 overflow-hidden flex items-center justify-center">
                {client.avatarUrl ? (
                  <img src={client.avatarUrl} alt={client.nom} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:scale-110 transition-transform"
                title="Changer la photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => { update({ avatarUrl: String(reader.result) }); toast({ title: 'Photo mise à jour' }); };
                reader.readAsDataURL(f);
              }} />
            </div>

            <div className="flex-1 text-center sm:text-left text-white min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold mb-2">
                <Sparkles className="h-3 w-3" /> Membre BeautyFlow
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight truncate">{client.nom}</h1>
              <p className="text-sm text-white/85 truncate">{client.email}</p>
            </div>

            <div className="flex sm:flex-col gap-2 justify-center">
              <Button size="sm" variant="secondary" className="rounded-full bg-white/95 text-foreground hover:bg-white" onClick={() => { signout(); navigate('/explorer'); }}>
                <LogOut className="h-4 w-4 mr-1" /> Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* STATS — overlap hero */}
      <div className="max-w-4xl mx-auto px-4 -mt-14 sm:-mt-16 relative z-10">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatPill icon={Heart} value={client.favorites.length} label="Favoris" gradient="from-rose-500 to-pink-500" />
          <StatPill icon={History} value={client.visits.length} label="Visites" gradient="from-amber-500 to-orange-500" />
          <StatPill icon={Award} value={Math.floor((Date.now() - new Date(client.dateCreation).getTime()) / 86400000)} label="Jours membre" gradient="from-fuchsia-500 to-rose-500" />
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-4xl mx-auto px-4 mt-6 animate-fade-in">
        <Tabs defaultValue={tab}>
          <TabsList className="grid grid-cols-3 w-full h-12 p-1 rounded-2xl bg-muted/60 backdrop-blur">
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:shadow"><UserIcon className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Profil</span></TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-xl data-[state=active]:shadow"><Heart className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Favoris</span></TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:shadow"><History className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Historique</span></TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-4 space-y-3">
            <Card className="p-5 shadow-sm border-border/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">Informations personnelles</h3>
                {!editing ? (
                  <Button size="sm" variant="outline" className="rounded-full h-8" onClick={startEdit}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Modifier
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="rounded-full h-8" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="gradient-primary rounded-full h-8" onClick={saveEdit}>
                      <Check className="h-4 w-4 mr-1" /> Enregistrer
                    </Button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div className="space-y-3">
                  <InfoRow icon={UserIcon} label="Nom complet" value={client.nom} />
                  <InfoRow icon={Mail} label="Email" value={client.email} />
                  <InfoRow
                    icon={MessageCircle}
                    label="WhatsApp"
                    value={client.telephone || 'Non renseigné'}
                    action={waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-emerald-600 hover:underline">Ouvrir</a>
                    ) : null}
                    muted={!client.telephone}
                  />
                  <InfoRow icon={Calendar} label="Membre depuis" value={format(new Date(client.dateCreation), 'd MMMM yyyy', { locale: fr })} />
                </div>
              ) : (
                <div className="space-y-3">
                  <EditField icon={UserIcon} label="Nom complet" value={form.nom} onChange={v => setForm({ ...form, nom: v })} />
                  <EditField icon={Mail} label="Email" value={form.email} onChange={() => {}} disabled />
                  <EditField icon={MessageCircle} label="Numéro WhatsApp" placeholder="+237 6XX XXX XXX" value={form.telephone} onChange={v => setForm({ ...form, telephone: v })} />
                  <p className="text-[11px] text-muted-foreground pl-1">Votre numéro WhatsApp permet aux salons de vous joindre rapidement pour confirmer un rendez-vous.</p>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Recommandations personnalisées</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Découvrez les salons adaptés à vos goûts.</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Fidélité multi-salons</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Cumulez des points partout, bientôt.</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* FAVORITES */}
          <TabsContent value="favorites" className="mt-4">
            {favorites.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl gradient-primary/20 bg-primary/10 flex items-center justify-center mb-3">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-semibold">Aucun favori pour l'instant</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Explorez et touchez le cœur ♥ pour sauvegarder vos salons préférés.</p>
                <Button asChild className="gradient-primary rounded-full"><Link to="/explorer">Explorer les salons</Link></Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(s => {
                  const primary = s.branding?.primaryColor || '350 75% 55%';
                  const accent = s.branding?.secondaryColor || '25 95% 60%';
                  return (
                    <Card key={s.id} className="overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={() => navigate(`/booking/${s.slug}`)}>
                      <div className="h-28 relative" style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}>
                        {s.branding?.bannerUrl && <img src={s.branding.bannerUrl} alt={s.nom} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <Button
                          size="icon" variant="secondary"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 hover:bg-white"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <div className="absolute bottom-2 left-3 text-white">
                          <div className="font-bold text-sm drop-shadow truncate">{s.nom}</div>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{s.branding?.location || s.adresse}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-primary">Réserver →</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            {favorites.length === 0 ? (
              <Card className="p-10 text-center">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Aucun favori pour l'instant</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Explorez les salons et touchez le cœur ♥ pour les sauvegarder.</p>
                <Button asChild className="gradient-primary"><Link to="/explorer">Explorer les salons</Link></Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(s => {
                  const primary = s.branding?.primaryColor || '350 75% 55%';
                  const accent = s.branding?.secondaryColor || '25 95% 60%';
                  return (
                    <Card key={s.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate(`/booking/${s.slug}`)}>
                      <div className="h-24 relative" style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))` }}>
                        {s.branding?.bannerUrl && <img src={s.branding.bannerUrl} alt={s.nom} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                        <Button
                          size="icon" variant="secondary"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-sm truncate">{s.nom}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /><span className="truncate">{s.branding?.location || s.adresse}</span></div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {client.visits.length === 0 ? (
              <Card className="p-10 text-center">
                <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Aucune visite enregistrée</p>
                <p className="text-xs text-muted-foreground mt-1">Les salons que vous consultez apparaîtront ici.</p>
              </Card>
            ) : (
              <Card className="divide-y">
                {client.visits.map((v, i) => (
                  <Link key={i} to={`/booking/${v.salonSlug}`} className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{v.salonNom}</div>
                      <div className="text-[11px] text-muted-foreground">{format(new Date(v.visitedAt), 'd MMM yyyy à HH:mm', { locale: fr })}</div>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, value, label, gradient }: { icon: any; value: number; label: string; gradient: string }) {
  return (
    <Card className="p-3 sm:p-4 text-center shadow-lg border-border/60 backdrop-blur bg-card/95 hover:-translate-y-0.5 transition-transform">
      <div className={`h-9 w-9 sm:h-10 sm:w-10 mx-auto rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-1.5 shadow-md`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </div>
      <div className="text-lg sm:text-2xl font-extrabold leading-none">{value}</div>
      <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium">{label}</div>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, action, muted }: { icon: any; label: string; value: string; action?: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
      <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className={`text-sm font-medium truncate ${muted ? 'text-muted-foreground italic' : ''}`}>{value}</div>
      </div>
      {action}
    </div>
  );
}

function EditField({ icon: Icon, label, value, onChange, placeholder, disabled }: { icon: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="relative mt-1">
        <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>
    </div>
  );
}