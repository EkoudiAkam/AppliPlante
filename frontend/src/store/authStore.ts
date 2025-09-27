import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginDto, RegisterDto } from '@/types';
import { apiClient, saveTokens, clearTokens, handleApiError } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/constants';

// Flag global pour éviter les appels multiples de checkAuth
let isCheckingAuth = false;

interface AuthState {
  // État
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Action de connexion
      login: async (credentials: LoginDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.auth.login(credentials.email, credentials.password);
          const { access_token, refresh_token, user } = response.data;
          
          // Sauvegarder les tokens
          saveTokens(access_token, refresh_token);
          
          // Mettre à jour l'état
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
        } catch (error: any) {
          const apiError = handleApiError(error);
          set({
            isLoading: false,
            error: apiError.message,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      // Action d'inscription
      register: async (userData: RegisterDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.auth.register(userData);
          const { access_token, refresh_token, user } = response.data;
          
          // Sauvegarder les tokens
          saveTokens(access_token, refresh_token);
          
          // Mettre à jour l'état
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
        } catch (error: any) {
          const apiError = handleApiError(error);
          set({
            isLoading: false,
            error: apiError.message,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      // Action de déconnexion
      logout: () => {
        clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Effacer les erreurs
      clearError: () => {
        set({ error: null });
      },

      // Vérifier l'authentification au démarrage
      checkAuth: async () => {
        // Éviter les appels multiples simultanés
        if (isCheckingAuth) {
          return;
        }

        const token = typeof window !== 'undefined' 
          ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) 
          : null;
        
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        isCheckingAuth = true;
        set({ isLoading: true });
        
        try {
          // Récupérer le profil utilisateur pour vérifier la validité du token
          const response = await apiClient.users.getProfile();
          const user = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
        } catch (error: any) {
          // Token invalide ou expiré
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } finally {
          isCheckingAuth = false;
        }
      },

      // Mettre à jour les données utilisateur
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          
          // Sauvegarder dans localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);