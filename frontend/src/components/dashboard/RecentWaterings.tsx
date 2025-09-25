'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Droplets, Calendar } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Watering } from '@/types';

interface RecentWateringsProps {
  waterings: Watering[];
  isLoading?: boolean;
}

export function RecentWaterings({ waterings, isLoading }: RecentWateringsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Arrosages récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (waterings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Arrosages récents
          </CardTitle>
          <CardDescription>
            Vos derniers arrosages apparaîtront ici
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun arrosage enregistré</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Arrosages récents
        </CardTitle>
        <CardDescription>
          Vos {waterings.length} derniers arrosages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {waterings.slice(0, 5).map((watering) => (
            <div key={watering.id} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {watering.plant?.name || 'Plante inconnue'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {format(new Date(watering.createdAt), 'dd MMM yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="text-xs">
                  {watering.amountMl}ml
                </Badge>
                {watering.note && (
                  <p className="text-xs text-gray-400 mt-1 max-w-20 truncate">
                    {watering.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}