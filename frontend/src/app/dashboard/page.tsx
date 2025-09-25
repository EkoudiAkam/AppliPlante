'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  Droplets,
  Calendar,
  TrendingUp,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentWaterings } from '@/components/dashboard/RecentWaterings';
import { WateringChart } from '@/components/dashboard/WateringChart';

import { useAuth } from '@/hooks/useAuth';
import { useUserStats, usePlants, useWaterings, useWateringStats } from '@/hooks/useApi';
import { ROUTES } from '@/lib/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  // Récupération des données
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const { data: plants, isLoading: plantsLoading } = usePlants();
  const { data: recentWaterings, isLoading: wateringsLoading } = useWaterings();
  const { data: wateringStats, isLoading: wateringStatsLoading } = useWateringStats();

  // Afficher un loader pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  const isLoading = statsLoading || plantsLoading || wateringsLoading || wateringStatsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {user?.firstname} ! 👋
            </h1>
            <p className="mt-2 text-gray-600">
              Voici un aperçu de vos plantes et de vos activités récentes.
            </p>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatsCard
              title="Mes plantes"
              value={userStats?.totalPlants || 0}
              description="Plantes dans votre collection"
              icon={<Sprout className="h-4 w-4" />}
            />
            <StatsCard
              title="Arrosages ce mois"
              value={userStats?.wateringsThisMonth || 0}
              description="Arrosages effectués"
              icon={<Droplets className="h-4 w-4" />}
            />
            <StatsCard
              title="Moyenne par jour"
              value={userStats?.averageWateringsPerDay?.toFixed(1) || '0.0'}
              description="Arrosages quotidiens"
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatsCard
              title="Plantes arrosées"
              value={`${userStats?.plantsWateredToday || 0}/${userStats?.totalPlants || 0}`}
              description="Aujourd'hui"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Graphiques et activités récentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Graphique des arrosages */}
            <WateringChart
              waterings={recentWaterings || []}
              isLoading={wateringsLoading}
            />

            {/* Arrosages récents */}
            <RecentWaterings
              waterings={recentWaterings || []}
              isLoading={wateringsLoading}
            />
          </div>

          {/* Actions rapides */}
          <div className="mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Actions rapides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push(ROUTES.ADD_PLANT)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Sprout className="h-4 w-4 mr-2" />
                    Ajouter une plante
                  </button>
                  <button
                    onClick={() => router.push(ROUTES.PLANTS)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    Arroser mes plantes
                  </button>
                  <button
                    onClick={() => router.push(ROUTES.NOTIFICATIONS)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Gérer les rappels
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}