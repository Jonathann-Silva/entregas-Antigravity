
'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { CourierNav } from '@/components/nav/CourierNav';
import { useSession } from 'next-auth/react';
import { requestPermissionAndSaveToken } from '@/firebase/messaging';

export default function CourierLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = (user as any)?.role;
  // TODO: we need to handle "online/offline" state toggles inside the Courier profile differently in PostgreSQL
  const isOnline = true; // Temporary bypass
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (user && userRole === 'courier') {
      // Solicita permissão de notificação
      requestPermissionAndSaveToken(user.id as string);

      // Sincronização de localização em tempo real com THROTTLE agressivo (2 minutos)
      // Otimização para plano gratuito do Firebase: 40 usuários x 1 update/2min = 28.800 escritas/dia
      let watchId: number;

      // SÓ RASTREIA SE ESTIVER ONLINE
      if (navigator.geolocation && isOnline) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            // Apenas atualiza se passou 2 minutos desde a última gravação (120.000ms)
            if (now - lastUpdateRef.current < 120000) return;

            lastUpdateRef.current = now;

            fetch('/api/courier/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              })
            }).catch(() => {
              // Falha silenciosa para não atrapalhar a experiência
            });
          },
          (err) => console.warn("Erro ao rastrear localização GPS:", err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [user?.id, userRole, isOnline]);

  return (
    <MobileLayout>
      {children}
      <CourierNav />
    </MobileLayout>
  );
}
