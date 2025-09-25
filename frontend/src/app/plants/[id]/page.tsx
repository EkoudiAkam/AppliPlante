'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Droplets,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { usePlant, useCreateWatering, useDeletePlant } from '@/hooks/useApi';
import { useWateringsByPlant } from '@/hooks/useWateringsByPlant';
import { ROUTES, DEFAULT_PLANT_IMAGE } from '@/lib/constants';
import { Watering } from '@/types';

export default function PlantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const plantId = params.id as string;

  const { data: plant, isLoading: plantLoading, error: plantError } = usePlant(plantId);
  const { data: waterings = [], isLoading: wateringsLoading, refetch: refetchWaterings } = useWateringsByPlant(plantId);
  const createWatering = useCreateWatering();
  const deletePlant = useDeletePlant();

  const [showWateringConfirm, setShowWateringConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Redirection si la plante n'existe pas
  useEffect(() => {
    if (plantError && !plantLoading) {
      toast.error('Plante introuvable');
      router.push(ROUTES.PLANTS);
    }
  }, [plantError, plantLoading, router]);

  const handleWaterPlant = async () => {
    if (!plant) return;

    try {
      await createWatering.mutateAsync({
        plantId: plant.id,
        amountMl: plant.waterAmountMl || 250,
        note: '',
      });
      
      setShowWateringConfirm(false);
      toast.success(`${plant.name} a été arrosée !`);
      refetchWaterings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'arrosage');
    }
  };

  const handleDeletePlant = async () => {
    if (!plant) return;

    try {
      await deletePlant.mutateAsync(plant.id);
      toast.success('Plante supprimée avec succès');
      router.push(ROUTES.PLANTS);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const getNextWateringDate = () => {
    if (!plant || !plant.nextWateringAt) return null;
    return parseISO(plant.nextWateringAt);
  };

  const isWateringDue = () => {
    const nextWatering = getNextWateringDate();
    if (!nextWatering) return false;
    return nextWatering <= new Date();
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    const nextWatering = getNextWateringDate();

    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const hasWatering = nextWatering && isSameDay(date, nextWatering);
      
      days.push({
        date,
        hasWatering,
        isToday: i === 0,
      });
    }

    return days;
  };

  if (plantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!plant) {
    return null;
  }

  const nextWateringDate = getNextWateringDate();
  const isDue = isWateringDue();
  const next7Days = getNext7Days();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`${ROUTES.PLANTS}/${plant.id}/edit`)}
              className="px-4 py-2 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Modifier</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte principale de la plante */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={plant.image || DEFAULT_PLANT_IMAGE}
                  alt={plant.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{plant.name}</h1>
                    <p className="text-gray-600">{plant.species}</p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDue 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isDue ? 'Arrosage nécessaire' : 'Bien hydratée'}
                  </div>
                </div>

                {plant.notes && (
                  <p className="text-gray-700 mb-6">{plant.notes}</p>
                )}

                {/* Informations d'arrosage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Fréquence</p>
                      <p className="text-blue-600 font-semibold">
                        Tous les {plant.waterFrequencyDays} jours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Prochain arrosage</p>
                      <p className="text-purple-600 font-semibold">
                        {nextWateringDate 
                          ? format(nextWateringDate, 'dd MMM yyyy', { locale: fr })
                          : 'Non défini'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton d'arrosage */}
                <button
                  onClick={() => setShowWateringConfirm(true)}
                  disabled={createWatering.isPending}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    isDue
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {createWatering.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Droplets className="h-5 w-5" />
                  )}
                  <span>Arroser maintenant</span>
                </button>
              </div>
            </div>

            {/* Historique des arrosages */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des arrosages
              </h2>

              {wateringsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : waterings.length > 0 ? (
                <div className="space-y-3">
                  {waterings.slice(0, 10).map((watering: Watering) => (
                    <div
                      key={watering.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Droplets className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(parseISO(watering.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          {watering.note && (
                            <p className="text-sm text-gray-600">{watering.note}</p>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                  
                  {waterings.length > 10 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      Et {waterings.length - 10} arrosage(s) de plus...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun arrosage enregistré</p>
                  <p className="text-sm text-gray-400">
                    Commencez par arroser votre plante !
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar avec calendrier */}
          <div className="space-y-6">
            {/* Calendrier des 7 prochains jours */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Prochains jours
              </h3>

              <div className="space-y-2">
                {next7Days.map((day, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      day.isToday
                        ? 'bg-green-50 border border-green-200'
                        : day.hasWatering
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${
                        day.isToday ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {day.isToday ? 'Aujourd\'hui' : format(day.date, 'EEEE', { locale: fr })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(day.date, 'dd MMM', { locale: fr })}
                      </p>
                    </div>
                    
                    {day.hasWatering && (
                      <div className="flex items-center space-x-1">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Arrosage</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total arrosages</span>
                  <span className="font-semibold text-gray-900">{waterings.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ajoutée le</span>
                  <span className="font-semibold text-gray-900">
                    {format(parseISO(plant.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                
                {waterings.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dernier arrosage</span>
                    <span className="font-semibold text-gray-900">
                      {format(parseISO(waterings[0].createdAt), 'dd MMM', { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de confirmation d'arrosage */}
        {showWateringConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Arroser {plant.name}</h3>
                  <p className="text-gray-600">Confirmer l&apos;arrosage de cette plante ?</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleWaterPlant}
                  disabled={createWatering.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  {createWatering.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Confirmer</span>
                </button>
                
                <button
                  onClick={() => setShowWateringConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Supprimer {plant.name}</h3>
                  <p className="text-gray-600">Cette action est irréversible.</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeletePlant}
                  disabled={deletePlant.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  {deletePlant.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Supprimer</span>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}