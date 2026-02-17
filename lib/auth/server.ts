// lib/auth/server.ts
// PRODUCTION-GRADE: Server-side role checking with caching

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
}

// ============================================
// Cached user profile fetcher
// (React cache for deduplication in RSC)
// ============================================

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
    const supabase = await createClient();

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return null;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, is_active')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[AUTH] Profile fetch error:', profileError);
        }
        return null;
    }

    return {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        isActive: profile.is_active,
    };
});

// ============================================
// Require authentication
// ============================================

export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('UNAUTHORIZED');
    }

    if (!user.isActive) {
        throw new Error('ACCOUNT_INACTIVE');
    }

    return user;
}

// ============================================
// Require admin role
// ============================================

export async function requireAdmin(): Promise<AuthUser> {
    const user = await requireAuth();

    if (user.role !== 'admin' && user.role !== 'superadmin') {
        throw new Error('FORBIDDEN');
    }

    return user;
}

// ============================================
// Require superadmin role
// ============================================

export async function requireSuperAdmin(): Promise<AuthUser> {
    const user = await requireAuth();

    if (user.role !== 'superadmin') {
        throw new Error('FORBIDDEN');
    }

    return user;
}

// ============================================
// Permission checker (for granular permissions)
// Future: extend with permissions table
// ============================================

export async function hasPermission(
    resource: string,
    action: 'read' | 'write' | 'delete'
): Promise<boolean> {
    const user = await getCurrentUser();

    if (!user) return false;

    // Superadmin has all permissions
    if (user.role === 'superadmin') return true;

    // Admin has most permissions (customize as needed)
    if (user.role === 'admin') {
        // Admins can't delete critical resources
        if (action === 'delete' && ['profiles', 'audit_logs'].includes(resource)) {
            return false;
        }
        return true;
    }

    // Regular users have limited permissions
    return false;
}
