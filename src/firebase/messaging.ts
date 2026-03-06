'use client';

// Chave Pública VAPID vinda do ambiente (.env ou Vercel)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const requestPermissionAndSaveToken = async (userId: string) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !userId) {
    return;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('Webpush: NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada no ambiente.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // Registra o Service Worker (sw.js na pasta public)
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      await navigator.serviceWorker.ready;

      // Subscreve o usuário para receber notificações push nativas
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      if (subscription) {
        // Salva a assinatura completa no PostgreSQL via API
        const response = await fetch('/api/user/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pushSubscription: JSON.stringify(subscription) }),
        });

        if (response.ok) {
          console.log('Webpush registrado com sucesso no PostgreSQL para:', userId);
        } else {
          console.error('Erro ao salvar Webpush no PostgreSQL');
        }
      }
    }
  } catch (err) {
    console.error('Erro no registro de Webpush:', err);
  }
};
