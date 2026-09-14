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
import { Scissors, Banknote, Tags, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';

export interface TypeFormData {
  nom: string;
  prix: number;
  description?: string;
  categorie?: string;
  imageUrl?: string;
}

interface TypePrestationFormProps {
  type?: TypePrestation;
  onSubmit: (data: TypeFormData) => Promise<void> | void;
  onCancel: () => void;
}

export function TypePrestationForm({ type, onSubmit, onCancel }: TypePrestationFormProps) {
  const { t } = useLanguage();
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
      nom: type?.nom || '',
      prix: type?.prix || 0,
      description: type?.description || '',
      categorie: type?.categorie || '',
      imageUrl: type?.imageUrl || '',
    },
  });

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
