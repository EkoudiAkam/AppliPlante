'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Search,
  Droplets,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Navbar } from '@/components/layout/Navbar';
import { PlantsFilters, PlantFilters } from '@/components/PlantsFilters';
import { useAuth } from '@/hooks/useAuth';
import * as useApi from '@/hooks/useApi';
import { ROUTES, DEFAULT_PLANT_IMAGE } from '@/lib/constants';
import { Plant } from '@/types';

export default function PlantsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState<PlantFilters>({
    search: '',
    species: '',
    wateringStatus: 'all',
  });
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [selectedPlantForWatering, setSelectedPlantForWatering] = useState<Plant | null>(null);
  const [wateringAmount, setWateringAmount] = useState('');
  const [wateringNote, setWateringNote] = useState('');

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  // Récupération des données
  const { data: plants, isLoading: plantsLoading, refetch } = useApi.usePlants();
  const deletePlantMutation = useApi.useDeletePlant();
  const createWateringMutation = useApi.useCreateWatering();

  // Fonction pour déterminer le statut d'arrosage d'une plante
  const getWateringStatus = (plant: Plant): 'due' | 'overdue' | 'upcoming' => {
    if (!plant.nextWateringAt) return 'upcoming';
    
    const now = new Date();
    const nextWatering = new Date(plant.nextWateringAt);
    const diffInHours = (nextWatering.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) return 'overdue';
    if (diffInHours <= 24) return 'due';
    return 'upcoming';
  };

  // Filtrage des plantes
  const filteredPlants = plants?.filter((plant) => {
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = plant.name.toLowerCase().includes(searchLower);
      const matchesSpecies = plant.species?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesSpecies) return false;
    }

    // Filtre par espèce
    if (filters.species && plant.species !== filters.species) {
      return false;
    }

    // Filtre par statut d'arrosage
    if (filters.wateringStatus !== 'all') {
      const status = getWateringStatus(plant);
      if (status !== filters.wateringStatus) return false;
    }

    return true;
  }) || [];

  // Suppression d'une plante
  const handleDeletePlant = async () => {
    if (!plantToDelete) return;

    try {
      await deletePlantMutation.mutateAsync(plantToDelete.id);
      toast.success('Plante supprimée avec succès');
      refetch();
      setPlantToDelete(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression de la plante');
    }
  };

  // Arrosage d'une plante
  const handleWaterPlant = async () => {
    if (!selectedPlantForWatering || !wateringAmount) return;

    try {
      await createWateringMutation.mutateAsync({
        plantId: selectedPlantForWatering.id,
        amountMl: parseInt(wateringAmount),
        note: wateringNote || undefined,
      });
      toast.success('Plante arrosée avec succès');
      refetch();
      setSelectedPlantForWatering(null);
      setWateringAmount('');
      setWateringNote('');
    } catch (error) {
      toast.error('Erreur lors de l\'arrosage de la plante');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes plantes</h1>
              <p className="mt-2 text-gray-600">
                Gérez votre collection de plantes d&apos;intérieur
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href={ROUTES.ADD_PLANT}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une plante
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtres */}
          <PlantsFilters
            onFiltersChange={setFilters}
            totalCount={plants?.length}
            filteredCount={filteredPlants.length}
          />

          {/* Liste des plantes */}
          {plantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPlants.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search ? 'Aucune plante trouvée' : 'Aucune plante'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filters.search 
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par ajouter votre première plante'
                }
              </p>
              {!filters.search && (
                <Link href={ROUTES.ADD_PLANT}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une plante
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlants.map((plant) => (
                <Card key={plant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image de la plante */}
                  <div className="h-48 bg-gray-200 relative">
                    <Image
                      src={plant.imageUrl || DEFAULT_PLANT_IMAGE}
                      alt={plant.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_PLANT_IMAGE;
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`${ROUTES.PLANTS}/${plant.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir les détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`${ROUTES.PLANTS}/${plant.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPlantToDelete(plant)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{plant.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {plant.waterFrequencyDays}j
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {plant.species || 'Espèce non spécifiée'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Prochain arrosage: {' '}
                          {plant.nextWateringAt
                            ? format(new Date(plant.nextWateringAt), 'dd MMM yyyy', { locale: fr })
                            : 'À définir'
                          }
                        </span>
                      </div>
                      {plant.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Droplets className="h-4 w-4 mr-2" />
                          <span>Emplacement: {plant.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Link href={`${ROUTES.PLANTS}/${plant.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Voir détails
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => setSelectedPlantForWatering(plant)}
                        className="flex-1"
                      >
                        <Droplets className="h-4 w-4 mr-1" />
                        Arroser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!plantToDelete} onOpenChange={() => setPlantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la plante</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{plantToDelete?.name}&quot; ?
              Cette action est irréversible et supprimera également tout l&apos;historique d&apos;arrosage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlant}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePlantMutation.isPending}
            >
              {deletePlantMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'arrosage */}
      <Dialog open={!!selectedPlantForWatering} onOpenChange={() => setSelectedPlantForWatering(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Arroser {selectedPlantForWatering?.name}</DialogTitle>
            <DialogDescription>
              Enregistrez l&apos;arrosage de votre plante avec la quantité d&apos;eau utilisée.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Quantité (ml)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={wateringAmount}
                onChange={(e) => setWateringAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Note (optionnel)
              </Label>
              <Textarea
                id="note"
                placeholder="Ajouter une note..."
                value={wateringNote}
                onChange={(e) => setWateringNote(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedPlantForWatering(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleWaterPlant}
              disabled={createWateringMutation.isPending || !wateringAmount}
            >
              {createWateringMutation.isPending ? 'Arrosage...' : 'Arroser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}