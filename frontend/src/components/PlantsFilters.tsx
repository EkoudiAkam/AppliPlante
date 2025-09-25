// FILE: components/PlantsFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Droplets, Clock } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface PlantsFiltersProps {
  onFiltersChange: (filters: PlantFilters) => void;
  totalCount?: number;
  filteredCount?: number;
}

export interface PlantFilters {
  search: string;
  species: string;
  wateringStatus: 'all' | 'due' | 'upcoming' | 'overdue';
}

const WATERING_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous', icon: null },
  { value: 'due', label: 'À arroser', icon: Droplets },
  { value: 'overdue', label: 'En retard', icon: Clock },
  { value: 'upcoming', label: 'Prochainement', icon: Clock },
] as const;

export function PlantsFilters({ onFiltersChange, totalCount, filteredCount }: PlantsFiltersProps) {
  const [filters, setFilters] = useState<PlantFilters>({
    search: '',
    species: '',
    wateringStatus: 'all',
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableSpecies, setAvailableSpecies] = useState<string[]>([]);

  // Debounce search input pour éviter trop d'appels API
  const debouncedSearch = useDebounce(filters.search, 300);

  // Effet pour notifier les changements de filtres
  useEffect(() => {
    onFiltersChange({
      ...filters,
      search: debouncedSearch,
    });
  }, [debouncedSearch, filters.species, filters.wateringStatus, onFiltersChange]);

  // Simuler la récupération des espèces disponibles
  useEffect(() => {
    // Dans une vraie application, ceci viendrait d'une API
    setAvailableSpecies([
      'Monstera deliciosa',
      'Ficus lyrata',
      'Sansevieria trifasciata',
      'Pothos',
      'Philodendron',
      'Aloe vera',
      'Cactus',
      'Succulente',
      'Fougère',
      'Orchidée',
    ]);
  }, []);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSpeciesChange = (species: string) => {
    setFilters(prev => ({ ...prev, species }));
  };

  const handleWateringStatusChange = (status: PlantFilters['wateringStatus']) => {
    setFilters(prev => ({ ...prev, wateringStatus: status }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      species: '',
      wateringStatus: 'all',
    });
  };

  const hasActiveFilters = filters.search || filters.species || filters.wateringStatus !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="space-y-4">
        {/* Barre de recherche principale */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de plante..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
            {hasActiveFilters && (
              <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {[filters.search, filters.species, filters.wateringStatus !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filtres rapides - Statut d'arrosage */}
        <div className="flex flex-wrap gap-2">
          {WATERING_STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = filters.wateringStatus === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleWateringStatusChange(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtre par espèce */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espèce
                </label>
                <select
                  value={filters.species}
                  onChange={(e) => handleSpeciesChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Toutes les espèces</option>
                  {availableSpecies.map((species) => (
                    <option key={species} value={species}>
                      {species}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions des filtres avancés */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                {filteredCount !== undefined && totalCount !== undefined && (
                  <span>
                    {filteredCount} sur {totalCount} plante{totalCount > 1 ? 's' : ''}
                    {hasActiveFilters && ' (filtrées)'}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Effacer les filtres</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}