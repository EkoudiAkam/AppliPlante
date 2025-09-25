// FILE: app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings, Check, X, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSubscribeNotifications, useUnsubscribeNotifications, useTestNotification } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import type { Notification } from '@/hooks/useNotifications';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const subscribeNotifications = useSubscribeNotifications();
  const unsubscribeNotifications = useUnsubscribeNotifications();
  const testNotification = useTestNotification();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  // Vérifier l'état de l'abonnement aux notifications
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'abonnement:', error);
        }
      }
      setIsCheckingSubscription(false);
    };

    checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Les notifications push ne sont pas supportées par votre navigateur');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission refusée pour les notifications');
        return;
      }

      // S'abonner aux notifications push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await subscribeNotifications.mutateAsync(subscription);
      setIsSubscribed(true);
      toast.success('Abonnement aux notifications activé !');
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      toast.error('Erreur lors de l\'abonnement aux notifications');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await unsubscribeNotifications.mutateAsync();
      setIsSubscribed(false);
      toast.success('Désabonnement des notifications effectué');
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      toast.error('Erreur lors du désabonnement');
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification.mutateAsync();
      toast.success('Notification de test envoyée !');
    } catch (error) {
      console.error('Erreur lors du test:', error);
      toast.error('Erreur lors de l\'envoi du test');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.plantId) {
      router.push(`${ROUTES.PLANTS}/${notification.plantId}`);
    }
    // Marquer comme lue localement
    setReadNotifications(prev => new Set(prev).add(notification.id));
  };

  const markAsRead = (notificationId: string) => {
    setReadNotifications(prev => new Set(prev).add(notificationId));
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  if (authLoading || isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.isRead && !readNotifications.has(n.id)).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? (
                    `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  ) : (
                    'Toutes les notifications sont lues'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTestNotification}
                disabled={testNotification.isPending || !isSubscribed}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testNotification.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Paramètres des notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Paramètres des notifications</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Notifications push</h3>
              <p className="text-sm text-gray-600">
                Recevez des notifications pour vos plantes qui ont besoin d&apos;eau
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  disabled={unsubscribeNotifications.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {unsubscribeNotifications.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Se désabonner'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribeNotifications.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {subscribeNotifications.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'S\'abonner'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Toutes les notifications</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
                <p className="text-gray-600">
tes les erreurs
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = notification.isRead || readNotifications.has(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icône */}
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'watering_reminder' && (
                          <span className="text-2xl">🌱</span>
                        )}
                        {notification.type === 'daily_reminder' && (
                          <span className="text-2xl">🌿</span>
                        )}
                        {notification.type === 'info' && (
                          <span className="text-2xl">ℹ️</span>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                title="Marquer comme lue"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            
                            {!isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}