import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // TODO: Substituir por autenticação real na Fase 9
        // Por enquanto, usar user_id fixo para desenvolvimento
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;

        // Buscar total de domínios
        const { count: totalDomains, error: totalError } = await supabase
            .from('verified_domains')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (totalError) throw totalError;

        // Buscar domínios verificados
        const { count: verifiedDomains, error: verifiedError } = await supabase
            .from('verified_domains')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_verified', true);

        if (verifiedError) throw verifiedError;

        // Buscar domínios pendentes
        const { count: pendingDomains, error: pendingError } = await supabase
            .from('verified_domains')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_verified', false);

        if (pendingError) throw pendingError;

        // Buscar landing pages ativas
        const { count: activeLandingPages, error: activeError } = await supabase
            .from('landing_pages')
            .select('*, verified_domains!inner(*)', { count: 'exact', head: true })
            .eq('verified_domains.user_id', userId)
            .eq('is_active', true);

        if (activeError) throw activeError;

        // Buscar domínios criados este mês
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const { count: createdThisMonth, error: monthError } = await supabase
            .from('verified_domains')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', firstDayOfMonth.toISOString());

        if (monthError) throw monthError;

        return NextResponse.json({
            success: true,
            stats: {
                total_domains: totalDomains || 0,
                verified_domains: verifiedDomains || 0,
                pending_domains: pendingDomains || 0,
                active_landing_pages: activeLandingPages || 0,
                created_this_month: createdThisMonth || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
