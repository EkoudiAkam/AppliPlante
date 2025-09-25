import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, API_ENDPOINTS } from './constants';
import { 
  AuthResponse, 
  ApiError, 
  UpdateUserDto, 
  CreatePlantDto, 
  UpdatePlantDto, 
  CreateWateringDto,
  PushSubscriptionRequest
} from '@/types';

// Configuration de base d'Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction pour obtenir le token d'accès depuis localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
  return null;
};

// Fonction pour obtenir le refresh token depuis localStorage
const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return null;
};

// Fonction pour sauvegarder les tokens
const saveTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

// Fonction pour supprimer les tokens
const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

// Intercepteur de requête pour ajouter le token d'autorisation
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable pour éviter les appels multiples de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: Error | unknown) => void;
}> = [];

// Fonction pour traiter la queue des requêtes en attente
const processQueue = (error: Error | unknown | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur de réponse pour gérer le refresh des tokens
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 et qu'on n'a pas déjà tenté de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre la requête en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        // Pas de refresh token, rediriger vers login
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      try {
        // Tentative de refresh du token
        const response = await axios.post<AuthResponse>(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;
        
        // Sauvegarder les nouveaux tokens
        saveTokens(access_token, newRefreshToken);
        
        // Traiter la queue avec le nouveau token
        processQueue(null, access_token);
        
        // Réessayer la requête originale
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Échec du refresh, déconnecter l'utilisateur
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour l'API
export const apiClient = {
  // Méthodes HTTP de base
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    api.get(url, config),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    api.post(url, data, config),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    api.put(url, data, config),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    api.delete(url, config),

  // Méthodes d'authentification
  auth: {
    login: (email: string, password: string) =>
      api.post<AuthResponse>(API_ENDPOINTS.LOGIN, { email, password }),
    
    register: (userData: { email: string; password: string; firstname: string; lastname: string }) =>
      api.post<AuthResponse>(API_ENDPOINTS.REGISTER, userData),
    
    refresh: (refreshToken: string) =>
      api.post<AuthResponse>(API_ENDPOINTS.REFRESH, { refresh_token: refreshToken }),
  },

  // Méthodes utilisateur
  users: {
    getProfile: () => api.get(API_ENDPOINTS.PROFILE),
    updateProfile: (data: UpdateUserDto) => api.put(API_ENDPOINTS.PROFILE, data),
    deleteAccount: () => api.delete('/users/account'),
    getStats: () => api.get(API_ENDPOINTS.STATS),
  },

  // Méthodes plantes
  plants: {
    getAll: () => api.get(API_ENDPOINTS.PLANTS),
    getById: (id: string) => api.get(API_ENDPOINTS.PLANT_BY_ID(id)),
    create: (data: CreatePlantDto) => api.post(API_ENDPOINTS.PLANTS, data),
    update: (id: string, data: UpdatePlantDto) => api.put(API_ENDPOINTS.PLANT_BY_ID(id), data),
    delete: (id: string) => api.delete(API_ENDPOINTS.PLANT_BY_ID(id)),
  },

  // Méthodes arrosages
  waterings: {
    getAll: () => api.get(API_ENDPOINTS.WATERINGS),
    getByPlant: (plantId: string) => api.get(`/waterings/plant/${plantId}`),
    create: (data: CreateWateringDto) => api.post(API_ENDPOINTS.WATERINGS, data),
    getStats: () => api.get(API_ENDPOINTS.WATERING_STATS),
  },

  // Méthodes notifications
  notifications: {
    subscribe: (subscription: PushSubscriptionRequest) => api.post(API_ENDPOINTS.SUBSCRIBE, subscription),
    unsubscribe: () => api.delete(API_ENDPOINTS.UNSUBSCRIBE),
    test: () => api.post(API_ENDPOINTS.TEST_NOTIFICATION),
  },
};

// Fonction pour gérer les erreurs API
export const handleApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; error?: string }; status?: number } };
    if (axiosError.response?.data) {
      return {
        message: axiosError.response.data.message || 'Une erreur est survenue',
        error: axiosError.response.data.error,
        statusCode: axiosError.response.status || 0,
      };
    }
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    const errorWithMessage = error as { message: string };
    return {
      message: errorWithMessage.message || 'Erreur de connexion',
      statusCode: 0,
    };
  }
  
  return {
    message: 'Erreur inconnue',
    statusCode: 0,
  };
};

export { saveTokens, clearTokens, getAccessToken, getRefreshToken };
export default api;