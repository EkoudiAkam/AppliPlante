import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import { 
  Plant, 
  Watering, 
  UserStats, 
  WateringStats,
  CreatePlantDto,
  UpdatePlantDto,
  CreateWateringDto,
  UpdateUserDto
} from '@/types';

/**
 * Hook pour récupérer les statistiques utilisateur
 */
export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: [QUERY_KEYS.USER_STATS],
    queryFn: async () => {
      const response = await apiClient.users.getStats();
      return response.data;
    },
  });
};

/**
 * Hook pour récupérer la liste des plantes
 */
export const usePlants = () => {
  return useQuery<Plant[]>({
    queryKey: [QUERY_KEYS.PLANTS],
    queryFn: async () => {
      const response = await apiClient.plants.getAll();
      return response.data;
    },
  });
};

/**
 * Hook pour récupérer les détails d'une plante
 */
export const usePlant = (id: string) => {
  return useQuery<Plant>({
    queryKey: [QUERY_KEYS.PLANT_DETAILS, id],
    queryFn: async () => {
      const response = await apiClient.plants.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook pour récupérer l'historique des arrosages
 */
export const useWaterings = () => {
  return useQuery<Watering[]>({
    queryKey: [QUERY_KEYS.WATERINGS],
    queryFn: async () => {
      const response = await apiClient.waterings.getAll();
      return response.data;
    },
  });
};

/**
 * Hook pour récupérer les statistiques d'arrosage
 */
export const useWateringStats = () => {
  return useQuery<WateringStats>({
    queryKey: [QUERY_KEYS.WATERING_STATS],
    queryFn: async () => {
      const response = await apiClient.waterings.getStats();
      return response.data;
    },
  });
};

/**
 * Hook pour créer une nouvelle plante
 */
export const useCreatePlant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (plantData: CreatePlantDto) => {
      const response = await apiClient.plants.create(plantData);
      return response.data;
    },
    onSuccess: () => {
      // Invalider et refetch la liste des plantes
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_STATS] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour mettre à jour une plante
 */
export const useUpdatePlant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlantDto }) => {
      const response = await apiClient.plants.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      // Invalider les queries liées à cette plante
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANT_DETAILS, id] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour supprimer une plante
 */
export const useDeletePlant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.plants.delete(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalider les queries liées aux plantes
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_STATS] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour créer un nouvel arrosage
 */
export const useCreateWatering = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wateringData: CreateWateringDto) => {
      const response = await apiClient.waterings.create(wateringData);
      return response.data;
    },
    onSuccess: (_, { plantId }) => {
      // Invalider les queries liées aux arrosages et à la plante
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATERINGS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATERING_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANT_DETAILS, plantId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_STATS] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour mettre à jour le profil utilisateur
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: UpdateUserDto) => {
      const response = await apiClient.users.updateProfile(userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalider le profil utilisateur
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour supprimer le compte utilisateur
 */
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.users.deleteAccount();
      return response.data;
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour s'abonner aux notifications push
 */
export const useSubscribeNotifications = () => {
  return useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      // Convertir PushSubscription en PushSubscriptionRequest
      const subscriptionRequest = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
          auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
        }
      };
      const response = await apiClient.notifications.subscribe(subscriptionRequest);
      return response.data;
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour se désabonner des notifications push
 */
export const useUnsubscribeNotifications = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.notifications.unsubscribe();
      return response.data;
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};

/**
 * Hook pour tester les notifications push
 */
export const useTestNotification = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.notifications.test();
      return response.data;
    },
    onError: (error) => {
      throw handleApiError(error);
    },
  });
};