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

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // ⚠️ IMPORTANT: ROLE CHECK HAPPENS IN SERVER COMPONENTS/API
    // We do NOT check admin role here (would require DB query in Edge)
    // Admin check is done in:
    // - app/admin/layout.tsx (Server Component)
    // - API routes using requireAdmin()

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
