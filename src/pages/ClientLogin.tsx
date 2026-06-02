import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowLeft, Phone, Heart, Calendar, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { toast } from '@/hooks/use-toast';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/explorer';
  const { signin, signup } = useClientAuth();

  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ nom: '', email: '', password: '', telephone: '' });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = signin(login.email, login.password);
    if (r.ok) { toast({ title: 'Bienvenue !' }); navigate(redirect); }
    else setError(r.reason);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = signup({ nom: reg.nom, email: reg.email, password: reg.password, telephone: reg.telephone });
    if (r.ok) { toast({ title: 'Compte créé ✨', description: 'Bienvenue dans BeautyFlow !' }); navigate(redirect); }
    else setError(r.reason);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col">
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Brand */}
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-xl mb-3">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Bienvenue 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Connectez-vous pour vos favoris, vos rendez-vous et votre historique.</p>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Heart, label: 'Favoris' },
              { icon: Calendar, label: 'Mes RDV' },
              { icon: Bookmark, label: 'Historique' },
            ].map(p => (
              <div key={p.label} className="text-center p-3 rounded-xl bg-card border">
                <p.icon className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-[11px] font-medium">{p.label}</div>
              </div>
            ))}
          </div>

          <Card className="p-5 shadow-xl border-border/60 backdrop-blur bg-card/90">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Créer un compte</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <Field icon={Mail} label="Email" type="email" value={login.email} onChange={v => setLogin({ ...login, email: v })} placeholder="vous@email.com" />
                  <Field icon={Lock} label="Mot de passe" type="password" value={login.password} onChange={v => setLogin({ ...login, password: v })} placeholder="••••••" />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="w-full h-11 gradient-primary">Se connecter</Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <Field icon={User} label="Nom complet" value={reg.nom} onChange={v => setReg({ ...reg, nom: v })} placeholder="Marie Nguema" />
                  <Field icon={Mail} label="Email" type="email" value={reg.email} onChange={v => setReg({ ...reg, email: v })} placeholder="vous@email.com" />
                  <Field icon={Phone} label="Téléphone (optionnel)" type="tel" value={reg.telephone} onChange={v => setReg({ ...reg, telephone: v })} placeholder="+237 6XX XXX XXX" />
                  <Field icon={Lock} label="Mot de passe" type="password" value={reg.password} onChange={v => setReg({ ...reg, password: v })} placeholder="Min 4 caractères" />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="w-full h-11 gradient-primary">Créer mon compte</Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            En continuant, vous acceptez nos conditions et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative mt-1">
        <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9 h-11 rounded-xl" />
      </div>
    </div>
  );
}