
'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { AdminNav } from '@/components/nav/AdminNav';
import { useSession } from 'next-auth/react';
import { requestPermissionAndSaveToken } from '@/firebase/messaging';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = (user as any)?.role;
  const statusUpdateRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setAdminStatus = useCallback(async (online: boolean) => {
    if (!user?.id) return;

    try {
      await fetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online })
      });
    } catch (serverError: any) {
      // Fallback or error handling
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!statusUpdateRef.current) {
        setAdminStatus(true);
        statusUpdateRef.current = true;
        // REGISTRA O APARELHO DO ADMIN PARA WEB PUSH
        requestPermissionAndSaveToken(user.id as string);
      }

      // IMPORTANTE: Removemos o listener de 'pending' que disparava notificações de navegador
      // porque agora usamos Webpush real (via sw.js) que funciona com o app fechado.

      const handleUnload = () => {
        setAdminStatus(false);
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        timeoutRef.current = setTimeout(() => {
          setAdminStatus(false);
          statusUpdateRef.current = false;
        }, 5000);
      };
    }
  }, [user?.id, userRole, setAdminStatus]);

  return (
    <MobileLayout>
      {children}
      <AdminNav />
    </MobileLayout>
  );
}
