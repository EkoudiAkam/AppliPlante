'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Composant Providers qui encapsule tous les providers de l'application
 * - React Query pour la gestion des requêtes API
 * - React Query Devtools pour le développement
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Créer une instance de QueryClient avec configuration optimisée
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps de cache par défaut (5 minutes)
            staleTime: 1000 * 60 * 5,
            // Temps avant garbage collection (10 minutes)
            gcTime: 1000 * 60 * 10,
            // Retry automatique en cas d'erreur
            retry: (failureCount, error: any) => {
              // Ne pas retry sur les erreurs 4xx (client errors)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              // Retry jusqu'à 3 fois pour les autres erreurs
              return failureCount < 3;
            },
            // Refetch automatique quand la fenêtre reprend le focus
            refetchOnWindowFocus: false,
            // Refetch automatique à la reconnexion
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry automatique pour les mutations
            retry: (failureCount, error: any) => {
              // Ne pas retry sur les erreurs 4xx
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Afficher les devtools seulement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}