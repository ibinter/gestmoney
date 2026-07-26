'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  // Détecte si le navigateur supporte les notifications push
  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      // Vérifier si déjà abonné
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setIsSubscribed(!!sub))
        .catch(() => undefined);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<void> => {
    if (!supported) return;
    setLoading(true);
    try {
      // 1. Demander la permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // 2. Récupérer la clé VAPID depuis l'API
      const { data } = await api.get<{ vapidPublicKey: string | null }>('/push/vapid-public-key');
      const vapidKey = data?.vapidPublicKey;
      if (!vapidKey) {
        console.warn('[Push] Clé VAPID absente — notifications push non disponibles.');
        return;
      }

      // 3. Obtenir le service worker actif et créer la subscription
      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 4. Envoyer la subscription au backend
      const subJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys?.p256dh  ?? '',
        auth:     subJson.keys?.auth    ?? '',
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('[Push] Erreur lors de l\'abonnement :', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        // Supprimer côté backend
        await api.delete('/push/subscribe', { data: { endpoint: subscription.endpoint } }).catch(() => undefined);
        // Désabonner côté navigateur
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('[Push] Erreur lors du désabonnement :', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { permission, isSubscribed, supported, loading, subscribe, unsubscribe };
}
