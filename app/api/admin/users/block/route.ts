import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin();
        const supabase = createAdminClient();

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        if (userId === admin.id) {
            return NextResponse.json({ error: 'Você não pode bloquear sua própria conta' }, { status: 400 });
        }

        // 1. Cancelar assinaturas ativas
        await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', userId);

        // 2. Inativar perfil
        await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('id', userId);

        // 3. Banir no Auth e atualizar metadata
        try {
            await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '876000h',
                user_metadata: {
                    approval_status: 'blocked',
                },
            });
        } catch (metaErr) {
            console.warn('Erro ao banir e atualizar user_metadata no bloqueio:', metaErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Acesso do usuário revogado/bloqueado com sucesso.',
        });

    } catch (error) {
        const err = error as Error;
        return NextResponse.json({ error: err.message || 'Erro ao bloquear usuário' }, { status: 500 });
    }
}
