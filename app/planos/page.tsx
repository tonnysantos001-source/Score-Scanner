'use client';

// app/planos/page.tsx
// Redireciona para o painel principal (planos gerenciados pelo administrador)

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuroraBackground from '@/components/layout/AuroraBackground';

export default function PlanosPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/minerar');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center text-white" style={{ background: 'transparent' }}>
            <AuroraBackground />
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );
}
