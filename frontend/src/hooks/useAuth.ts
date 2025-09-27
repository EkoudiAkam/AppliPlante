import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'authentification
 * Fournit un accès simplifié au store d'authentification
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuth,
    updateUser,
  } = useAuthStore();

  // Vérifier l'authentification seulement une fois au premier montage
  useEffect(() => {
    // Ne vérifier que si on n'est pas déjà authentifié et qu'on n'est pas en train de charger
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]); // Ajouter les dépendances nécessaires

  return {
    // État
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    updateUser,
    
    // Utilitaires
    isLoggedIn: isAuthenticated && !!user,
    userFullName: user ? `${user.firstname} ${user.lastname}` : '',
    userInitials: user 
      ? `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase()
      : '',
  };
};