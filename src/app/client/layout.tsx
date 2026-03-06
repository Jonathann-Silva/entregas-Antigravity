
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { ClientNav } from '@/components/nav/ClientNav';
import { useSession } from 'next-auth/react';
import { requestPermissionAndSaveToken } from '@/firebase/messaging';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (user?.id) {
      // Registra o aparelho do cliente para notificações push (status de pedidos)
      // Note: we will need to update this function internally later to save the token via our API
      requestPermissionAndSaveToken(user.id);
    }
  }, [user?.id]);

  return (
    <MobileLayout>
      {children}
      <ClientNav />
    </MobileLayout>
  );
}
