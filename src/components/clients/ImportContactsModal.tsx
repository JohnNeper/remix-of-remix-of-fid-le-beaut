import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, Upload, Clipboard, Phone, Check, Search,
  AlertTriangle, Palette, Tag, Info, AlertCircle, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { cleanPhone, parseVcfText, parseGenericText, ParsedContact } from '@/utils/phone';

const COULEURS = [
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'phone' | 'vcf' | 'paste';
}

export function ImportContactsModal({ isOpen, onClose, initialTab = 'phone' }: ImportContactsModalProps) {
  const { clients, checkDuplicates, bulkImport } = useClients();
  const { t } = useLanguage();
  const { getCustomerLimit } = useSubscriptionPlan();

  const customerLimit = getCustomerLimit();
  const remainingSlots = customerLimit ? Math.max(0, customerLimit - clients.length) : Infinity;

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [step, setStep] = useState<'setup' | 'preview'>('setup');
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vcfFileName, setVcfFileName] = useState('');
  const [vcfFileContent, setVcfFileContent] = useState('');

  // Parsed contacts list
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group creation settings
  const [createGroupChecked, setCreateGroupChecked] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(COULEURS[0]);
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('setup');
      setParsedContacts([]);
      setPasteContent('');
      setVcfFileName('');
      setVcfFileContent('');
      setCreateGroupChecked(false);
      setGroupName('');
      setGroupDescription('');
    }
  }, [isOpen]);

  // Helper function to query duplicates and enrich contacts
  const checkDuplicatesAndTransition = async (rawContacts: Array<{ nom: string; telephone: string }>, defaultGroupPrefix: string) => {
    if (!rawContacts.length) {
      toast.info('Aucun contact valide trouvé.');
      return;
    }

    setIsChecking(true);
    try {
      const phones = rawContacts.map(c => c.telephone);
      const dupResults = await checkDuplicates(phones);
      console.log(dupResults)
      const dupMap = new Map<string, boolean>();
      dupResults.forEach(r => {
        dupMap.set(r.normalise, r.exists);
      });

      const enriched: ParsedContact[] = rawContacts.map(c => {
        const norm = c.telephone.replace(/\D/g, '').slice(-9);
        const exists = dupMap.get(norm) ?? false;
        return {
          id: Math.random().toString(36).slice(2, 11),
          nom: c.nom,
          telephone: c.telephone,
          exists,
          selected: !exists, // Unselect duplicates by default
        };
      });
      console.log(enriched)
      setParsedContacts(enriched);
      setGroupName(`${defaultGroupPrefix} - ${new Date().toLocaleDateString('fr-FR')}`);
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      toast.error('Impossible de vérifier les doublons sur le serveur.');
    } finally {
      setIsChecking(false);
    }
  };

  // Action handlers
  const handlePhoneImport = async () => {
    const isSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts;
    if (!isSupported) {
      toast.error("L'import de contacts n'est pas supporté par ce navigateur ou nécessite HTTPS.");
      return;
    }

    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);

      if (contacts && contacts.length > 0) {
        const seen = new Set<string>();
        const raw: Array<{ nom: string; telephone: string }> = [];

        for (const contact of contacts) {
          const name = contact.name?.[0] || '';
          const phone = (contact.tel?.[0] || '').replace(/[^\d+]/g, '');

          if (!phone || phone.replace(/\D/g, '').length < 8) continue;
          const norm = phone.replace(/\D/g, '').slice(-9);

          if (seen.has(norm)) continue;
          seen.add(norm);

          raw.push({
            nom: name || `Contact ${phone}`,
            telephone: phone,
          });
        }

        await checkDuplicatesAndTransition(raw, 'Import Tél');
      }
    } catch (err) {
      console.error('Contact picker error:', err);
      toast.error("Erreur lors de la sélection des contacts.");
    }
  };

  const handleVcfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVcfFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setVcfFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleProcessVcfFile = async () => {
    if (!vcfFileContent) {
      toast.error("Veuillez charger un fichier valide.");
      return;
    }

    // We pass [] for local clients so that all contacts are extracted without local existence evaluation
    const parsed = parseVcfText(vcfFileContent, []);
    const raw = parsed.map(c => ({ nom: c.nom, telephone: c.telephone }));
    await checkDuplicatesAndTransition(raw, 'Import VCF');
  };

  const handleProcessPaste = async () => {
    if (!pasteContent.trim()) {
      toast.error("Veuillez coller du contenu.");
      return;
    }

    const isVcard = pasteContent.includes('BEGIN:VCARD');
    const parsed = isVcard ? parseVcfText(pasteContent, []) : parseGenericText(pasteContent, []);
    const raw = parsed.map(c => ({ nom: c.nom, telephone: c.telephone }));
    await checkDuplicatesAndTransition(raw, 'Import Copié');
  };

  // Preview options
  const toggleSelectContact = (id: string) => {
    setParsedContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const selectAll = (onlyNew = false) => {
    setParsedContacts(prev => prev.map(c => ({
      ...c,
      selected: onlyNew ? (!c.exists) : true
    })));
  };

  const deselectAll = () => {
    setParsedContacts(prev => prev.map(c => ({ ...c, selected: false })));
  };

  const selectedCount = parsedContacts.filter(c => c.selected).length;
  const newSelectedCount = parsedContacts.filter(c => c.selected && !c.exists).length;

  const filteredPreview = useMemo(() => {
    return parsedContacts.filter(c =>
      c.nom.toLowerCase().includes(previewSearch.toLowerCase()) ||
      c.telephone.includes(previewSearch)
    );
  }, [parsedContacts, previewSearch]);

  // Submit bulk creation
  const handleImportSubmit = async () => {
    const contactsToImport = parsedContacts.filter(c => c.selected);
    if (contactsToImport.length === 0) {
      toast.error("Veuillez sélectionner au moins un contact à importer.");
      return;
    }

    // Check plan limits (only new clients count against limits)
    if (customerLimit && newSelectedCount > remainingSlots) {
      toast.error(`Limite de plan dépassée. Vous tentez d'importer ${newSelectedCount} nouveaux clients mais il ne reste que ${remainingSlots} places.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        contacts: contactsToImport.map(c => ({
          nom: c.nom,
          telephone: c.telephone,
          source: activeTab === 'phone' ? 'phone_picker' : activeTab === 'vcf' ? 'vcf_file' : 'clipboard'
        }))
      };

      if (createGroupChecked && groupName.trim()) {
        payload.groupe = {
          nom: groupName.trim(),
          couleur: groupColor,
          description: groupDescription.trim()
        };
      }

      const result = await bulkImport(payload);

      const parts = [`✅ ${result.inserted} contact(s) importé(s)`];
      if (result.skipped > 0) parts.push(`⚠️ ${result.skipped} doublon(s) ignoré(s)`);
      if (result.groupe) parts.push(`📁 Groupe « ${result.groupe.nom} » créé`);

      toast.success(parts.join(' · '));

      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de l'importation.", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isContactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl w-[95vw] rounded-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col border border-border bg-card">

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Importer des contacts</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {step === 'setup'
                  ? 'Importez directement depuis le répertoire de votre téléphone, un fichier VCF ou par copier-coller'
                  : `${parsedContacts.length} contacts détectés — sélectionnez ceux à importer`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ═══ STEP SETUP ═══ */}
        {step === 'setup' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-muted p-1 rounded-xl">
                <TabsTrigger value="phone" className="rounded-lg text-sm py-2">
                  <Phone className="h-3.5 w-3.5 mr-2" />
                  Téléphone
                </TabsTrigger>
                <TabsTrigger value="vcf" className="rounded-lg text-sm py-2">
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Fichier VCF
                </TabsTrigger>
                <TabsTrigger value="paste" className="rounded-lg text-sm py-2">
                  <Clipboard className="h-3.5 w-3.5 mr-2" />
                  Copier-Coller
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-6 focus-visible:outline-none">
                {isContactPickerSupported ? (
                  <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-muted/20 flex flex-col items-center justify-center space-y-5">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Phone className="h-10 w-10 animate-pulse" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="font-bold text-lg">Répertoire du téléphone</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Sélectionnez directement vos contacts. La vérification des doublons est automatique.
                      </p>
                    </div>
                    <Button
                      onClick={handlePhoneImport}
                      disabled={isChecking}
                      className="gradient-primary px-10 rounded-xl h-12 gap-2 text-sm font-semibold"
                    >
                      {isChecking
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</>
                        : <><Phone className="h-4 w-4" /> Ouvrir le répertoire</>
                      }
                    </Button>
                  </div>
                ) : (
                  <div className="py-8 px-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                    <div>
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-lg">Import direct indisponible sur iPhone</h4>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Apple limite l'accès direct aux contacts depuis le navigateur Web (iOS).
                      </p>
                    </div>
                    
                    <div className="bg-background/60 p-4 rounded-xl text-left space-y-2 border border-amber-500/10 max-w-sm w-full">
                      <p className="text-sm font-semibold text-foreground">Comment faire sur iPhone ?</p>
                      <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Ouvrez l'application <strong>Contacts</strong> de l'iPhone</li>
                        <li>Sélectionnez une liste puis appuyez sur <strong>Exporter</strong></li>
                        <li>Enregistrez le fichier sur votre téléphone</li>
                        <li>Revenez ici et utilisez l'onglet <strong>Fichier VCF</strong> en haut pour importer ce fichier.</li>
                      </ol>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="mt-2 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setActiveTab('vcf')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Aller à l'import VCF
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vcf" className="space-y-6 focus-visible:outline-none">
                <div className="text-center py-10 px-4 border border-dashed border-border rounded-2xl bg-muted/20 flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-semibold text-lg">Fichier Contacts (.vcf)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Téléversez un fichier `.vcf` exporté de vos contacts.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".vcf"
                    className="hidden"
                    onChange={handleVcfFileChange}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-primary text-primary hover:bg-primary/5 rounded-xl h-11 px-6"
                      disabled={isChecking}
                    >
                      {vcfFileName ? 'Changer de fichier' : 'Parcourir...'}
                    </Button>
                    {vcfFileContent && (
                      <Button
                        onClick={handleProcessVcfFile}
                        disabled={isChecking}
                        className="gradient-primary rounded-xl h-11 px-6 gap-2"
                      >
                        {isChecking ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse...</> : 'Analyser le fichier'}
                      </Button>
                    )}
                  </div>

                  {vcfFileName && (
                    <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-success" />
                      <span>Fichier chargé : <strong>{vcfFileName}</strong></span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paste" className="space-y-4 focus-visible:outline-none">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Coller le contenu des contacts
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Format : <em>"Nom du contact +22177xxxxxxx"</em> (un par ligne).
                  </p>
                  <Textarea
                    placeholder="Collez vos contacts ici..."
                    className="min-h-[160px] font-mono text-xs p-3 rounded-2xl border-border resize-none"
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    disabled={isChecking}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleProcessPaste}
                    className="gradient-primary w-full sm:w-auto px-8 rounded-xl h-11 gap-2"
                    disabled={!pasteContent.trim() || isChecking}
                  >
                    {isChecking ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse...</> : 'Analyser le texte collé'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="w-full flex justify-end pt-2 border-t border-border shrink-0">
              <Button variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs px-5">
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STEP PREVIEW ═══ */}
        {step === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Limit Warning banner */}
            {customerLimit && newSelectedCount > remainingSlots && (
              <div className="bg-destructive/10 border-b border-destructive/20 p-3 px-6 flex items-start gap-2.5 shrink-0 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Limite de plan dépassée : </span>
                  Vous essayez d'importer {newSelectedCount} nouveaux clients, mais il ne reste que {remainingSlots} places dans votre abonnement.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 flex-1 min-h-0 overflow-hidden">

              {/* Liste contacts (3/5) */}
              <div className="md:col-span-3 flex flex-col border-r border-border min-h-0">
                <div className="p-4 border-b border-border space-y-3 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filtrer les contacts…"
                      value={previewSearch}
                      onChange={e => setPreviewSearch(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground"><strong>{selectedCount}</strong> / {parsedContacts.length}</span>
                    <div className="flex gap-2">
                      <button onClick={() => selectAll(false)} className="text-primary hover:underline font-medium">Tous</button>
                      <span className="text-border">|</span>
                      <button onClick={() => selectAll(true)} className="text-primary hover:underline font-medium">Nouveaux</button>
                      <span className="text-border">|</span>
                      <button onClick={deselectAll} className="text-muted-foreground hover:underline font-medium">Aucun</button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredPreview.map(c => (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectContact(c.id)}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                        c.selected ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/40'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                        c.selected ? 'bg-primary border-primary' : 'border-muted-foreground/35'
                      )}>
                        {c.selected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{c.nom}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{c.telephone}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-[9px] h-5 px-1.5',
                        c.exists ? 'bg-muted text-muted-foreground border-border' : 'bg-green-500/10 text-green-600 border-green-500/20'
                      )}>
                        {c.exists ? 'Déjà inscrit' : 'Nouveau'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramètres groupe (2/5) */}
              <div className="md:col-span-2 p-5 bg-muted/15 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5">
                      <div className="text-lg font-bold text-green-600">{parsedContacts.filter(c => !c.exists).length}</div>
                      <div className="text-[10px] text-muted-foreground">Nouveaux</div>
                    </div>
                    <div className="bg-muted border border-border rounded-xl p-2.5">
                      <div className="text-lg font-bold text-muted-foreground">{parsedContacts.filter(c => c.exists).length}</div>
                      <div className="text-[10px] text-muted-foreground">Doublons</div>
                    </div>
                  </div>

                  {/* Toggle groupe */}
                  <div className="flex items-start gap-2.5 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                    <input
                      type="checkbox"
                      id="createGroupToggle"
                      checked={createGroupChecked}
                      onChange={e => setCreateGroupChecked(e.target.checked)}
                      className="mt-0.5 accent-primary h-3.5 w-3.5"
                    />
                    <label htmlFor="createGroupToggle" className="text-xs font-medium leading-relaxed cursor-pointer select-none">
                      Créer un groupe de contacts
                      <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                        Pour cibler ce groupe lors d'envois SMS.
                      </p>
                    </label>
                  </div>

                  {createGroupChecked && (
                    <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" /> Nom du groupe *
                        </label>
                        <Input
                          placeholder="Ex: Clientes Samedi..."
                          value={groupName}
                          onChange={e => setGroupName(e.target.value)}
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold flex items-center gap-1">
                          <Palette className="h-3 w-3 text-muted-foreground" /> Couleur
                        </label>
                        <div className="flex gap-1.5 flex-wrap">
                          {COULEURS.map(c => (
                            <button
                              key={c}
                              onClick={() => setGroupColor(c)}
                              className={cn(
                                'h-6 w-6 rounded-full border border-black/10 flex items-center justify-center transition-all',
                                groupColor === c ? 'scale-110 ring-2 ring-primary ring-offset-1 shadow-md' : 'hover:scale-105'
                              )}
                              style={{ backgroundColor: c }}
                            >
                              {groupColor === c && <Check className="h-3 w-3 text-white stroke-[2.5]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
                        <Textarea
                          placeholder="Note optionnelle..."
                          value={groupDescription}
                          onChange={e => setGroupDescription(e.target.value)}
                          className="h-14 text-xs resize-none rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-6">
                  <Button variant="outline" onClick={() => setStep('setup')} disabled={isSubmitting} className="w-full text-xs rounded-xl h-10">
                    ← Retour
                  </Button>
                  <Button
                    onClick={handleImportSubmit}
                    disabled={isSubmitting || selectedCount === 0 || (customerLimit ? newSelectedCount > remainingSlots : false) || (createGroupChecked && !groupName.trim())}
                    className="w-full text-xs rounded-xl h-10 gradient-primary gap-2"
                  >
                    {isSubmitting
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importation…</>
                      : `Importer ${selectedCount} contact(s)`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
