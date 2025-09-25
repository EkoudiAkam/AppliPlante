// FILE: app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Mail, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  Loader2,
  AlertTriangle,
  BarChart3,
  Droplets,
  Sprout
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useDeleteAccount, useUserStats } from '@/hooks/useApi';
import { profileSchema, ProfileFormData } from '@/lib/validations';
import { ROUTES } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Configuration du formulaire avec React Hook Form et Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: '',
      firstname: '',
      lastname: '',
    },
  });

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  // Mettre à jour les valeurs du formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      reset({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success('Compte supprimé avec succès');
      logout();
      router.push(ROUTES.LOGIN);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du compte');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstname} {user.lastname}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire de profil */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Informations personnelles
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : ''
                    } ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    {...register('firstname')}
                    type="text"
                    id="firstname"
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : ''
                    } ${errors.firstname ? 'border-red-500' : ''}`}
                  />
                  {errors.firstname && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstname.message}</p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    {...register('lastname')}
                    type="text"
                    id="lastname"
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : ''
                    } ${errors.lastname ? 'border-red-500' : ''}`}
                  />
                  {errors.lastname && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastname.message}</p>
                  )}
                </div>

                {/* Boutons d'action */}
                {isEditing && (
                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateProfile.isPending || !isDirty}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Enregistrer</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Annuler</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Statistiques et actions */}
          <div className="space-y-6">
            {/* Statistiques utilisateur */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes statistiques</h3>
              
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : userStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Sprout className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Plantes</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {userStats.totalPlants}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Arrosages</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {userStats.totalWaterings}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Ce mois</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {userStats.wateringsThisMonth}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Impossible de charger les statistiques
                </p>
              )}
            </div>

            {/* Informations du compte */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Membre depuis :</span>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-600">Dernière modification :</span>
                  <p className="font-medium">
                    {new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Zone de danger */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Zone de danger
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                La suppression de votre compte est irréversible. Toutes vos données seront perdues.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer mon compte</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-900">
                    Êtes-vous sûr de vouloir supprimer votre compte ?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccount.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      {deleteAccount.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span>Confirmer</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}