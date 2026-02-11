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

        // Verificar se CNPJ existe na wordlist
        const { data, error } = await supabase
            .from('empresas_usadas')
            .select('id, user_id, company_name, created_at')
            .eq('cnpj', cnpj)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found (ok)
            console.error('Erro ao verificar CNPJ:', error);
            return NextResponse.json({
                success: false,
                error: 'Erro ao verificar disponibilidade'
            }, { status: 500 });
        }

        // Se encontrou, CNPJ está em uso
        const isUsed = !!data;
        const isOwnedByCurrentUser = data?.user_id === user.id;

        return NextResponse.json({
            success: true,
            isUsed,
            isOwnedByCurrentUser,
            data: isUsed ? {
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
