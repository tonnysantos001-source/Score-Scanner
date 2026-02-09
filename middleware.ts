import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de domínios do sistema (não são domínios de clientes)
const SYSTEM_DOMAINS = [
    'localhost',
    'localhost:3000',
    'score-scanner.vercel.app',
    'verifyads.com',
    'www.verifyads.com',
];

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';

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

    // Preservar o pathname original, mas adicionar o domínio como parâmetro
    // Exemplo: empresa.com.br/qualquer-path -> /landing?domain=empresa.com.br&path=/qualquer-path
    url.pathname = `/api/landing`;
    url.searchParams.set('domain', hostname);
    url.searchParams.set('path', request.nextUrl.pathname);

    return NextResponse.rewrite(url);
}

// Configurar quais rotas o middleware deve processar
export const config = {
    // Processar todas as requisições exceto:
    // - API routes do sistema
    // - Static files (_next/static)
    // - Images (_next/image)
    // - Favicon
    matcher: [
        '/((?!api/(?!landing)|_next/static|_next/image|favicon.ico).*)',
    ],
};
