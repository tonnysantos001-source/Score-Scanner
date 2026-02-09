import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de domínios do sistema (não são domínios de clientes)
const SYSTEM_DOMAINS = [
    'localhost',
    'localhost:3000',
    'score-scanner.vercel.app',
    'score-scanner-fq2.vercel.app',
    'verifyads.com',
    'www.verifyads.com',
];

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // IMPORTANTE: Não processar rotas de API para evitar loop infinito
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Remover porta se existir para comparação
    const hostWithoutPort = hostname.split(':')[0];

    // Verificar se é um domínio do sistema
    const isSystemDomain = SYSTEM_DOMAINS.some(
        domain => hostWithoutPort === domain || hostname.includes(domain)
    );

    // Se for domínio do sistema, deixa passar normalmente
    if (isSystemDomain) {
        return NextResponse.next();
    }

    // É um domínio customizado do cliente!
    // Reescrever a URL para a rota de landing page
    const url = request.nextUrl.clone();
    url.pathname = `/api/landing`;
    url.searchParams.set('domain', hostname);
    url.searchParams.set('path', request.nextUrl.pathname);

    return NextResponse.rewrite(url);
}

// Configurar quais rotas o middleware deve processar
export const config = {
    // Processar apenas rotas não-API
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};
