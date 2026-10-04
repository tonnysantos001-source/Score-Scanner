import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                authenticated: false,
                hasAccess: false,
                approvalStatus: 'unauthenticated',
            }, { status: 401 });
        }

        const adminDb = createAdminClient();

        // 1. Buscar perfil do usuário
        const { data: profile } = await adminDb
            .from('profiles')
            .select('role, is_active, full_name, email')
            .eq('id', user.id)
            .single();

        const role = profile?.role || user.user_metadata?.role || 'user';
        const isAdmin = role === 'admin' || role === 'superadmin';

        if (isAdmin) {
            return NextResponse.json({
                authenticated: true,
                isAdmin: true,
                hasAccess: true,
                approvalStatus: 'approved',
                isLifetime: true,
                accessExpiresAt: null,
                accessExpiresAtFormatted: 'Acesso Ilimitado (Administrador)',
                role,
            });
        }

        // Logins e acessos de usuários comuns 100% bloqueados pelo administrador
        return NextResponse.json({
            authenticated: true,
            isAdmin: false,
            hasAccess: false,
            approvalStatus: 'blocked',
            role,
            message: 'Logins e acessos de usuários desativados pelo administrador.',
        });


    } catch (error) {
        console.error('Error in /api/auth/me/status:', error);
        return NextResponse.json({
            authenticated: false,
            hasAccess: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
