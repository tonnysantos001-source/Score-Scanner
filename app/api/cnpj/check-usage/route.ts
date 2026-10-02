import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const cnpj = searchParams.get('cnpj');

        if (!cnpj) {
            return NextResponse.json({
                success: false,
                error: 'CNPJ é obrigatório'
            }, { status: 400 });
        }

        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Não autenticado'
            }, { status: 401 });
        }

        const cleanCnpj = cnpj.replace(/\D/g, '');

        // Verificar concorrentemente se está em empresas_usadas, cnpj_blacklist ou cnpj_used
        const [usedResult, blacklistResult, usedTableResult] = await Promise.all([
            supabase
                .from('empresas_usadas')
                .select('id, user_id, company_name, created_at')
                .eq('cnpj', cleanCnpj)
                .maybeSingle(),
            supabase
                .from('cnpj_blacklist')
                .select('cnpj, reason')
                .eq('cnpj', cleanCnpj)
                .maybeSingle(),
            supabase
                .from('cnpj_used')
                .select('cnpj')
                .eq('cnpj', cleanCnpj)
                .maybeSingle(),
        ]);

        if (usedResult.error) {
            console.error('Erro ao verificar empresas_usadas:', usedResult.error);
        }

        const data = usedResult.data;
        const blacklisted = blacklistResult.data;
        const inUsedTable = usedTableResult.data;

        // Se estiver em empresas_usadas, ou na blacklist, ou na tabela de usados, está indisponível
        const isUsed = !!data || !!blacklisted || !!inUsedTable;
        const isBlacklisted = !!blacklisted;
        const isOwnedByCurrentUser = data?.user_id === user.id;

        return NextResponse.json({
            success: true,
            isUsed,
            used: isUsed, // compatibilidade
            isBlacklisted,
            blacklistReason: blacklisted?.reason || null,
            isOwnedByCurrentUser,
            data: data ? {
                company_name: data.company_name,
                created_at: data.created_at
            } : null
        });

    } catch (error) {
        console.error('Erro na API check-usage:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
