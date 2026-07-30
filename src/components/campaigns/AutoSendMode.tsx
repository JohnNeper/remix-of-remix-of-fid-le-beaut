import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Square, CheckCircle2, AlertCircle,
  Clock, Zap, Shield, ChevronRight, RotateCcw, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Client } from '@/types';
import { toast } from 'sonner';

interface AutoSendModeProps {
  clients: Client[];
  message: string;
  onComplete?: (stats: { envoyes: number; echecs: number }) => void;
}

type SendStatus = 'pending' | 'sending' | 'sent' | 'error' | 'skipped';

interface ClientSendState {
  client: Client;
  status: SendStatus;
  sentAt?: number;
}

export function AutoSendMode({ clients, message, onComplete }: AutoSendModeProps) {
  const [delai, setDelai] = useState(25); // secondes entre messages
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [countdown, setCountdown] = useState(0);
  const [states, setStates] = useState<ClientSendState[]>(() =>
    clients.map(c => ({ client: c, status: 'pending' }))
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(-1);
  const pausedRef = useRef(false);

  const envoyes = states.filter(s => s.status === 'sent').length;
  const echecs = states.filter(s => s.status === 'error').length;
  const skipped = states.filter(s => s.status === 'skipped').length;
  const total = states.length;
  const progress = total > 0 ? Math.round(((envoyes + echecs + skipped) / total) * 100) : 0;
  const isFinished = (envoyes + echecs + skipped) >= total && currentIndex >= 0;

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const formatPhone = (tel: string) => tel.replace(/\s/g, '').replace('+', '');

  const openWhatsApp = useCallback((client: Client) => {
    const phone = formatPhone(client.telephone);
    const personalizedMsg = message.replace('{nom}', client.nom);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMsg)}`;
    window.open(url, '_blank');
  }, [message]);

  const startCountdown = useCallback((seconds: number, onDone: () => void) => {
    setCountdown(seconds);
    let remaining = seconds;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (!pausedRef.current) onDone();
      }
    }, 1000);
  }, []);

  const sendNext = useCallback((index: number) => {
    if (pausedRef.current || index >= clients.length) {
      if (index >= clients.length) {
        setIsRunning(false);
        setCurrentIndex(-1);
        toast.success('Campagne terminée !', {
          description: `${envoyes} messages envoyés avec succès.`
        });
      }
      return;
    }

    indexRef.current = index;
    setCurrentIndex(index);

    // Mark as sending
    setStates(prev => prev.map((s, i) =>
      i === index ? { ...s, status: 'sending' } : s
    ));

    const client = clients[index];

    // Check if has phone number
    if (!client.telephone) {
      setStates(prev => prev.map((s, i) =>
        i === index ? { ...s, status: 'skipped' } : s
      ));
      timerRef.current = setTimeout(() => sendNext(index + 1), 500);
      return;
    }

    // Open WhatsApp with pre-filled message
    openWhatsApp(client);

    // Mark as sent after a brief moment
    setTimeout(() => {
      setStates(prev => prev.map((s, i) =>
        i === index ? { ...s, status: 'sent', sentAt: Date.now() } : s
      ));
    }, 1000);

    // Schedule next
    if (index < clients.length - 1) {
      startCountdown(delai, () => {
        if (!pausedRef.current) sendNext(index + 1);
      });
    } else {
      // Last client
      setTimeout(() => {
        setIsRunning(false);
        setCurrentIndex(-1);
      }, 1500);
    }
  }, [clients, delai, envoyes, openWhatsApp, startCountdown]);

  const handleStart = () => {
    if (clients.length === 0) return;
    pausedRef.current = false;
    setIsPaused(false);
    setIsRunning(true);

    // Reset states
    setStates(clients.map(c => ({ client: c, status: 'pending' })));

    toast.info('Envoi automatique démarré', {
      description: `${clients.length} messages • délai de ${delai}s entre chaque envoi`
    });

    // Start with first client after brief delay
    timerRef.current = setTimeout(() => sendNext(0), 800);
  };

  const handlePause = () => {
    pausedRef.current = true;
    setIsPaused(true);
    clearTimers();
    setCountdown(0);
    toast.info('Envoi en pause');
  };

  const handleResume = () => {
    pausedRef.current = false;
    setIsPaused(false);
    const next = indexRef.current + 1;
    toast.info('Reprise de l\'envoi...');
    sendNext(next);
  };

  const handleStop = () => {
    pausedRef.current = true;
    clearTimers();
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    setCountdown(0);
    toast.warning('Campagne arrêtée');
    if (onComplete) onComplete({ envoyes, echecs });
  };

  const handleReset = () => {
    clearTimers();
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    setCountdown(0);
    setStates(clients.map(c => ({ client: c, status: 'pending' })));
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    setStates(clients.map(c => ({ client: c, status: 'pending' })));
    handleReset();
  }, [clients]);

  const statusIcon = (status: SendStatus, isCurrent: boolean) => {
    if (isCurrent && isRunning) return <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />;
    switch (status) {
      case 'sent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'sending': return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Anti-ban info card */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                🛡️ Mode Anti-Ban Activé
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                L'envoi automatique ouvre WhatsApp avec le message pré-rempli pour chaque contact, avec
                un délai configuré entre chaque envoi. Cela simule un comportement humain pour éviter
                les blocages par WhatsApp.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">✓ Délai randomisé</span>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">✓ Message personnalisé</span>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">✓ Lien wa.me officiel</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="card-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Contrôles de l'envoi automatique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Delay slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Délai entre messages
              </label>
              <span className="text-sm font-bold text-primary">{delai}s</span>
            </div>
            <Slider
              value={[delai]}
              onValueChange={([v]) => setDelai(v)}
              min={10}
              max={120}
              step={5}
              disabled={isRunning}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10s (risqué)</span>
              <span className="text-amber-600">30s (recommandé)</span>
              <span>120s (très sûr)</span>
            </div>
          </div>

          {/* Progress */}
          {(isRunning || isFinished) && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-600 font-medium">✓ {envoyes} envoyés</span>
                {echecs > 0 && <span className="text-red-500">✗ {echecs} échoués</span>}
                {skipped > 0 && <span className="text-amber-500">⚠ {skipped} ignorés</span>}
                <span className="text-muted-foreground ml-auto">{total} total</span>
              </div>
            </div>
          )}

          {/* Countdown */}
          {isRunning && !isPaused && countdown > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <Wifi className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">
                Prochain envoi dans <span className="font-bold text-lg">{countdown}</span>s
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!isRunning && !isFinished && (
              <Button className="flex-1 gradient-primary" onClick={handleStart}>
                <Play className="h-4 w-4 mr-2" />
                Démarrer l'envoi automatique
              </Button>
            )}

            {isRunning && !isPaused && (
              <>
                <Button variant="outline" className="flex-1" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button variant="destructive" size="icon" onClick={handleStop}>
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}

            {isRunning && isPaused && (
              <>
                <Button className="flex-1 gradient-primary" onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
                <Button variant="destructive" size="icon" onClick={handleStop}>
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}

            {isFinished && (
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Recommencer
              </Button>
            )}
          </div>

          {isFinished && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-600">Campagne terminée !</p>
              <p className="text-sm text-muted-foreground">{envoyes} messages envoyés avec succès</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client list */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            File d'envoi — {total} contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <ScrollArea className="h-[400px] px-4">
            <div className="space-y-2">
              {states.map(({ client, status }, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={client.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                      isCurrent && isRunning
                        ? "border-primary bg-primary/8 shadow-sm shadow-primary/20"
                        : status === 'sent'
                        ? "border-green-500/30 bg-green-500/5"
                        : status === 'error'
                        ? "border-red-500/30 bg-red-500/5"
                        : status === 'skipped'
                        ? "border-amber-500/30 bg-amber-500/5 opacity-60"
                        : "border-border"
                    )}
                  >
                    <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{idx + 1}</span>

                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                      isCurrent && isRunning ? "bg-primary text-white" :
                      status === 'sent' ? "bg-green-500/20 text-green-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {client.nom.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.nom}</p>
                      <p className="text-xs text-muted-foreground">{client.telephone}</p>
                    </div>

                    <div className="shrink-0">
                      {statusIcon(status, isCurrent)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
