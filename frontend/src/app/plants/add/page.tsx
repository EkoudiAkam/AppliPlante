'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, X } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCreatePlant } from '@/hooks/useApi';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const plantSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  species: z.string().min(1, 'L\'espèce est requise').max(100, 'L\'espèce ne peut pas dépasser 100 caractères'),
  notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional(),
  location: z.string().min(1, 'L\'emplacement est requis').max(100, 'L\'emplacement ne peut pas dépasser 100 caractères'),
  waterFrequencyDays: z.number().min(1, 'La fréquence doit être d\'au moins 1 jour').max(365, 'La fréquence ne peut pas dépasser 365 jours'),
});

type PlantFormData = z.infer<typeof plantSchema>;

export default function AddPlantPage() {
  const { user, isAuthenticated } = useAuth();
  const createPlantMutation = useCreatePlant();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    imagePreview,
    imageBase64,
    isUploading,
    error: uploadError,
    handleImageUpload,
    clearImage,
  } = useImageUpload(5, ['image/jpeg', 'image/png', 'image/webp']);

  const form = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: '',
      species: '',
      notes: '',
      location: '',
      waterFrequencyDays: 7,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: PlantFormData) => {
    setIsSubmitting(true);
    
    try {
      const plantData = {
        ...data,
        image: imageBase64 || undefined,
      };

      await createPlantMutation.mutateAsync(plantData);
      toast.success('Plante ajoutée avec succès');
      router.push('/plants');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la plante:', error);
      toast.error('Erreur lors de l\'ajout de la plante');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/plants')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Ajouter une plante</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la plante</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo de la plante</label>
                    
                    {imagePreview ? (
                      <div className="relative w-full h-64">
                        <Image
                          src={imagePreview}
                          alt="Aperçu"
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 z-10"
                          onClick={clearImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Cliquez pour télécharger une image
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                PNG, JPG, WebP jusqu&apos;à 5MB
                              </span>
                            </label>
                            <input
                              id="image-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file);
                                }
                              }}
                              disabled={isUploading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {uploadError && (
                      <p className="text-sm text-red-600">{uploadError}</p>
                    )}
                  </div>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la plante *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Mon Monstera" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Species */}
                  <FormField
                    control={form.control}
                    name="species"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Espèce *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Monstera deliciosa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emplacement *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Salon, près de la fenêtre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Watering Frequency */}
                  <FormField
                    control={form.control}
                    name="waterFrequencyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fréquence d&apos;arrosage (en jours) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            placeholder="7"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes sur votre plante..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes personnelles, conseils d'entretien..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/plants')}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                    >
                      {isSubmitting ? 'Ajout en cours...' : 'Ajouter la plante'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}