// middleware.ts (ROOT)
// PRODUCTION-GRADE: Vercel Edge Runtime Compatible
// NO DATABASE QUERIES - JWT decode only

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // ============================================
    // CUSTOM DOMAIN ROUTING (White Label)
    // ============================================
    const hostname = request.headers.get('host') || '';

    // Configurable main domains + localhost
    const allowedDomains = [
        'verifiads.com',           // ← Domínio principal do sistema
        'www.verifiads.com',       // ← Com www
        'verifiads.online',        // ← Legado / backup
        'verifiads.com.br',        // ← Legado / backup
        'localhost:3000',
        'localhost',
        process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, ''),
    ].filter(Boolean);

    // Also allow Vercel preview/production deployment URLs
    const isVercelDeploy = hostname.endsWith('.vercel.app');

    const isMainDomain = isVercelDeploy || allowedDomains.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isMainDomain) {
        // It's a custom domain!
        console.log(`[Middleware] Custom Domain detected: ${hostname}`);

        // Rewrite to the landing page handler
        // We pass the hostname as a query param so the page knows which content to load
        const url = request.nextUrl.clone();
        url.pathname = `/l/domain/${hostname}`;
        return NextResponse.rewrite(url);
    }

    // ============================================
    // AUTHENTICATION CHECK ONLY
    // (No DB queries - Edge compatible)
    // ============================================

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const isAuthRoute = ['/login', '/cadastro'].some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

    const isUserRoute =
        request.nextUrl.pathname.startsWith('/minerar') ||
        request.nextUrl.pathname.startsWith('/minha-area');

    const isProtectedRoute = isAdminRoute || isUserRoute;

    // Check if user is admin from JWT metadata
    const userRole = session?.user?.user_metadata?.role || 'user';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    // DEBUG: Log authentication details
    if (session || isProtectedRoute) {
        console.log('[Middleware] Routing:', {
            path: request.nextUrl.pathname,
            email: session?.user?.email || 'visitor',
            role: userRole,
            isAdmin
        });
    }

    // 1. PROTECTION: Block unauthenticated users from protected routes
    if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 2. RBAC: Block non-admin users from accessing admin routes
    if (isAdminRoute && session && !isAdmin) {
        console.log('[Middleware] Blocking non-admin from admin route');
        return NextResponse.redirect(new URL('/minerar', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
