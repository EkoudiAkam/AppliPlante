import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import { Watering } from '@/types';

/**
 * Hook pour récupérer les arrosages d'une plante spécifique
 */
export const useWateringsByPlant = (plantId: string) => {
  return useQuery<Watering[]>({
    queryKey: [QUERY_KEYS.WATERINGS, 'plant', plantId],
    queryFn: async () => {
      const response = await apiClient.waterings.getByPlant(plantId);
      return response.data;
    },
    enabled: !!plantId,
  });
};