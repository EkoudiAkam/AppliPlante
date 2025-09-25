// Constantes de l'application

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PLANTS: '/plants',
  PLANT_DETAILS: '/plants/[id]',
  ADD_PLANT: '/plants/add',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
} as const;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  
  // Users
  PROFILE: '/users/profile',
  STATS: '/users/stats',
  
  // Plants
  PLANTS: '/plants',
  PLANT_BY_ID: (id: string) => `/plants/${id}`,
  
  // Waterings
  WATERINGS: '/waterings',
  WATERING_STATS: '/waterings/stats',
  
  // Notifications
  SUBSCRIBE: '/notifications/subscribe',
  UNSUBSCRIBE: '/notifications/unsubscribe',
  TEST_NOTIFICATION: '/notifications/test',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
} as const;

export const QUERY_KEYS = {
  USER_PROFILE: 'user-profile',
  USER_STATS: 'user-stats',
  PLANTS: 'plants',
  PLANT_DETAILS: 'plant-details',
  WATERINGS: 'waterings',
  WATERING_STATS: 'watering-stats',
  NOTIFICATIONS: 'notifications',
} as const;

export const DEFAULT_PLANT_IMAGE = '/images/default-plant.svg';

export const WATER_FREQUENCY_OPTIONS = [
  { value: 1, label: 'Tous les jours' },
  { value: 2, label: 'Tous les 2 jours' },
  { value: 3, label: 'Tous les 3 jours' },
  { value: 7, label: 'Une fois par semaine' },
  { value: 14, label: 'Toutes les 2 semaines' },
  { value: 30, label: 'Une fois par mois' },
] as const;