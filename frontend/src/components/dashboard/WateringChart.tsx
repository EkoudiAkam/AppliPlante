'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Watering } from '@/types';

interface WateringChartProps {
  waterings: Watering[];
  isLoading?: boolean;
}

export function WateringChart({ waterings, isLoading }: WateringChartProps) {
  const chartData = useMemo(() => {
    if (!waterings || waterings.length === 0) return [];

    // Créer un tableau des 7 derniers jours
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Compter les arrosages par jour
    const wateringsByDay = waterings.reduce((acc, watering) => {
      const date = format(new Date(watering.createdAt), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Créer les données pour le graphique
    return days.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'EEE', { locale: fr }),
        fullDate: format(day, 'dd/MM'),
        arrosages: wateringsByDay[dateKey] || 0,
      };
    });
  }, [waterings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Arrosages des 7 derniers jours</CardTitle>
          <CardDescription>
            Évolution de vos arrosages quotidiens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Arrosages des 7 derniers jours</CardTitle>
          <CardDescription>
            Évolution de vos arrosages quotidiens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arrosages des 7 derniers jours</CardTitle>
        <CardDescription>
          Évolution de vos arrosages quotidiens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.fullDate}</p>
                        <p className="text-sm text-gray-600">
                          {payload[0].value} arrosage{payload[0].value !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="arrosages"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}