import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { TypePrestation } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scissors, Banknote, Tags, FileText, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { POPULAR_SERVICE_TEMPLATES } from '@/lib/popular-service-templates';

export interface TypeFormData {
  nom: string;
  prix: number;
  description?: string;
  categorie?: string;
  imageUrl?: string;
}

interface TypePrestationFormProps {
  type?: TypePrestation;
  initialValues?: Partial<TypeFormData>;
  onSubmit: (data: TypeFormData) => Promise<void> | void;
  onCancel: () => void;
}

export function TypePrestationForm({ type, initialValues, onSubmit, onCancel }: TypePrestationFormProps) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const langKey = isEn ? 'en' : 'fr';
  const [isSaving, setIsSaving] = useState(false);

  const typeSchema = z.object({
    nom: z.string().min(2, t('services.nameError')),
    prix: z.coerce.number().min(0, t('services.priceError')),
    description: z.string().optional(),
    categorie: z.string().optional(),
    imageUrl: z.string().optional(),
  });

  const form = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      nom: initialValues?.nom || type?.nom || '',
      prix: initialValues?.prix !== undefined ? initialValues.prix : (type?.prix || 0),
      description: initialValues?.description !== undefined ? initialValues.description : (type?.description || ''),
      categorie: initialValues?.categorie || type?.categorie || '',
      imageUrl: initialValues?.imageUrl || type?.imageUrl || '',
    },
  });

  // Re-apply if initialValues changes
  useEffect(() => {
    if (initialValues) {
      if (initialValues.nom) form.setValue('nom', initialValues.nom);
      if (initialValues.prix !== undefined) form.setValue('prix', initialValues.prix);
      if (initialValues.description !== undefined) form.setValue('description', initialValues.description);
      if (initialValues.categorie) form.setValue('categorie', initialValues.categorie);
      if (initialValues.imageUrl) form.setValue('imageUrl', initialValues.imageUrl);
    }
  }, [initialValues, form]);

  const handleFormSubmit = async (data: TypeFormData) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {!type && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-500/25 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  {isEn ? '⚡ Pre-fill from popular templates' : '⚡ Pré-remplir avec un modèle populaire'}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {POPULAR_SERVICE_TEMPLATES.length} {isEn ? 'models' : 'modèles'}
                </span>
              </div>
              <Select
                onValueChange={(val) => {
                  const found = POPULAR_SERVICE_TEMPLATES.find((tpl) => tpl.id === val);
                  if (found) {
                    form.setValue('nom', found.nom[langKey], { shouldValidate: true });
                    form.setValue('prix', found.prix, { shouldValidate: true });
                    form.setValue('categorie', found.categorie[langKey], { shouldValidate: true });
                    form.setValue('description', found.description[langKey]);
                    form.setValue('imageUrl', found.imageUrl || found.fallbackImage);
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-rose-500/30 text-xs font-bold shadow-2xs">
                  <SelectValue placeholder={isEn ? 'Choose a popular hairstyle / service...' : 'Choisir une coiffure ou un soin populaire...'} />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl">
                  {POPULAR_SERVICE_TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id} className="text-xs font-medium py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{tpl.nom[langKey]}</span>
                        <span className="text-muted-foreground">({tpl.categorie[langKey]} · {tpl.prix.toLocaleString()} FCFA)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  <Scissors className="h-3.5 w-3.5 text-primary" />
                  {t('services.name')}
                </FormLabel>
                <FormControl>
                  <Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base" placeholder={t('services.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              control={form.control}
              name="prix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5 text-primary" />
                    {t('services.price')}
                  </FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base font-semibold" type="number" placeholder={t('services.pricePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <Tags className="h-3.5 w-3.5 text-primary" />
                    {t('services.category')}
                    <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-muted/30 border-none shadow-inner focus:ring-primary/20 text-base" placeholder={t('services.categoryPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  {t('services.description')}
                  <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional')})</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('services.descriptionPlaceholder')}
                    className="resize-none min-h-[80px] rounded-2xl bg-muted/30 border-none shadow-inner p-4 focus:ring-primary/20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  {t('services.imageLabel') || 'Image / Illustration'}
                  <span className="text-[10px] font-normal opacity-60 ml-1 lowercase">({t('common.optional')})</span>
                </FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    label={t('services.addImage') || 'Ajouter une image'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="shrink-0 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-6 border-t border-border/60 dark:border-slate-800 z-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel} className="flex-1 h-12 rounded-2xl font-bold text-foreground dark:text-slate-100 bg-muted/60 dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all order-2 sm:order-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving || form.formState.isSubmitting} className="flex-1 h-12 rounded-2xl font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transition-all order-1 sm:order-2 disabled:opacity-50">
            {isSaving || form.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.saving') || 'Enregistrement...'}
              </span>
            ) : (
              type ? t('common.save') : t('common.add')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
