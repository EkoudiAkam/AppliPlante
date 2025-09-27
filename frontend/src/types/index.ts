// Types pour l'API Plant Care

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  waterFrequencyDays: number;
  waterAmountMl?: number;
  location?: string;
  notes?: string;
  imageUrl?: string; // URL ou base64
  nextWateringAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Watering {
  id: string;
  plantId: string;
  userId: string;
  amountMl: number;
  note?: string;
  createdAt: string;
  plant?: {
    id: string;
    name: string;
    species: string;
    waterFrequencyDays: number;
  };
}

export interface UserStats {
  totalPlants: number;
  totalWaterings: number;
  wateringsThisMonth: number;
  averageWateringsPerDay: number;
  plantsWateredToday: number;
}

export interface WateringStats {
  totalWaterings: number;
  recentWaterings: number;
  averageAmount: number;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// DTOs pour les requêtes API
export interface RegisterDto {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  email?: string;
  firstname?: string;
  lastname?: string;
}

export interface CreatePlantDto {
  name: string;
  species: string;
  waterFrequencyDays: number;
  waterAmountMl: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
}

export interface UpdatePlantDto {
  name?: string;
  species?: string;
  waterFrequencyDays?: number;
  waterAmountMl?: number;
  location?: string;
  notes?: string;
  imageUrl?: string;
}

export interface CreateWateringDto {
  plantId: string;
  amountMl: number;
  note?: string;
}

// Réponses API
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode: number;
}

// Types pour les formulaires
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstname: string;
  lastname: string;
}

export interface PlantFormData {
  name: string;
  species: string;
  waterFrequencyDays: number;
  location: string;
  notes: string;
  image?: File;
}

export interface WateringFormData {
  amountMl: number;
  note: string;
}

export interface ProfileFormData {
  email: string;
  firstname: string;
  lastname: string;
}