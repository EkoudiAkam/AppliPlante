import { useQuery } from '@tanstack/react-query';
import { usePlants } from './useApi';
import { QUERY_KEYS } from '@/lib/constants';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'watering_reminder' | 'daily_reminder' | 'info';
  isRead: boolean;
  createdAt: string;
  plantId?: string;
}

/**
 * Hook pour récupérer les notifications
 * Simule des notifications basées sur les plantes qui ont besoin d'eau
 */
export const useNotifications = () => {
  const { data: plants = [], isLoading: plantsLoading } = usePlants();

  return useQuery<Notification[]>({
    queryKey: [QUERY_KEYS.NOTIFICATIONS],
    queryFn: async () => {
      const now = new Date();
      const notifications: Notification[] = [];

      // Générer des notifications pour les plantes qui ont besoin d'eau
      plants.forEach((plant) => {
        const nextWatering = new Date(plant.nextWateringAt);
        const timeDiff = nextWatering.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff <= 0) {
          // Plante qui a besoin d'eau maintenant
          notifications.push({
            id: `watering-${plant.id}`,
            title: "🌱 Temps d'arroser !",
            message: `${plant.name} a besoin d'eau`,
            type: 'watering_reminder',
            isRead: false,
            createdAt: nextWatering.toISOString(),
            plantId: plant.id,
          });
        } else if (daysDiff === 1) {
          // Plante qui aura besoin d'eau demain
          notifications.push({
            id: `reminder-${plant.id}`,
            title: "🌿 Rappel",
            message: `${plant.name} aura besoin d'eau demain`,
            type: 'daily_reminder',
            isRead: false,
            createdAt: new Date(now.getTime() - 1000 * 3600).toISOString(),
            plantId: plant.id,
          });
        }
      });

      // Trier par date de création (plus récent en premier)
      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !plantsLoading && plants.length > 0,
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  });
};