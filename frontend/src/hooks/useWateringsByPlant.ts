// FILE: hooks/useWateringsByPlant.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import { Watering } from '@/types';

interface UseWateringsByPlantOptions {
  enabled?: boolean;
}

export function useWateringsByPlant(
  plantId: string | undefined,
  options: UseWateringsByPlantOptions = {}
) {
  return useQuery({
    queryKey: [QUERY_KEYS.WATERINGS, 'plant', plantId],
    queryFn: async (): Promise<Watering[]> => {
      if (!plantId) {
        throw new Error('Plant ID is required');
      }
      
      const response = await apiClient.get(`/waterings/plant/${plantId}`);
      return response.data;
    },
    enabled: !!plantId && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}