'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Bike, Loader2, Mail, Lock } from 'lucide-react';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o email e a senha.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast({
          title: "Falha na Autenticação",
          description: "As credenciais fornecidas estão incorretas. Verifique seu e-mail e senha.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: 'Login bem-sucedido!',
        description: `Redirecionando...`,
        duration: 2000,
      });

      // The session will contain the role. For redirecting, we can fetch the session or simply redirect to the root which handles routing, or rely on the previous logic if we fetch the user's role here.
      // Easiest is to push to /client, /admin, /courier based on their type, but since we don't know it immediately without fetching /api/auth/session, we redirect to a router page or fetch session.
      // For now, let's fetch the session to get the role before redirecting.
      const res = await fetch('/api/auth/session');
      const session = await res.json();

      if (session?.user?.role) {
        const userRole = session.user.role;
        const redirectTo = searchParams.get('redirectTo') || `/${userRole}`;
        router.push(redirectTo);
      } else {
        router.push('/');
      }

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro desconhecido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  }

  return (
    <div className="bg-background font-body text-foreground min-h-dvh flex flex-col justify-between">
      <header className="flex items-center justify-between p-6">
        <Bike className="text-primary size-8" />
      </header>

      <main className="flex-1 flex flex-col justify-center px-8 max-w-md mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Bem-vindo
          </h1>
          <p className="font-headline text-2xl font-bold text-primary mt-1">Lucas Expresso</p>
          <p className="text-muted-foreground mt-2">Faça login para continuar.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">

          <div className="space-y-3 pt-4 animate-in fade-in-50">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
              <Input
                type="password"
                placeholder="Senha"
                className="pl-10 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full font-bold py-6 text-base rounded-xl">
            {loading ? <Loader2 className="animate-spin" /> : <span>Entrar</span>}
            {!loading && <ArrowRight className="size-5" />}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4 px-6">
          Insira suas credenciais para acessar o painel. O acesso é liberado por um administrador.
        </p>

      </main>

      <footer className="p-8 pb-12">
        <p className="text-center text-xs text-muted-foreground">Versão do App 0.0.9 (teste)</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
