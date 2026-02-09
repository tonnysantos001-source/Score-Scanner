'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se autenticado, vai para área do usuário
        router.push('/minha-area');
      } else {
        // Se não autenticado, vai para login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Mostra loading enquanto verifica autenticação
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
