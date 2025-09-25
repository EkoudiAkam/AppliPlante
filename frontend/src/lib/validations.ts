import { z } from 'zod';

// Schémas de validation pour les formulaires

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
  firstname: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const plantSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la plante est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  species: z
    .string()
    .min(1, 'L\'espèce est requise')
    .min(2, 'L\'espèce doit contenir au moins 2 caractères'),
  waterFrequencyDays: z
    .number()
    .min(1, 'La fréquence d\'arrosage doit être d\'au moins 1 jour')
    .max(365, 'La fréquence d\'arrosage ne peut pas dépasser 365 jours'),
  location: z
    .string()
    .optional(),
  notes: z
    .string()
    .optional(),
});

export const wateringSchema = z.object({
  amountMl: z
    .number()
    .min(1, 'La quantité d\'eau doit être d\'au moins 1ml')
    .max(10000, 'La quantité d\'eau ne peut pas dépasser 10L'),
  note: z
    .string()
    .optional(),
});

export const profileSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  firstname: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
});

// Types inférés des schémas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PlantFormData = z.infer<typeof plantSchema>;
export type WateringFormData = z.infer<typeof wateringSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;