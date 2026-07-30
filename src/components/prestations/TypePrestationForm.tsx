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
import { Scissors, Banknote, Tags, FileText, Image as ImageIcon } from 'lucide-react';
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
  onSubmit: (data: TypeFormData) => void;
  onCancel: () => void;
}

export function TypePrestationForm({ type, onSubmit, onCancel }: TypePrestationFormProps) {
  const { t } = useLanguage();

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
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

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-12 sm:h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all order-2 sm:order-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1 h-12 sm:h-14 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2">
            {type ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
