import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            domain,
            company_cnpj,
            company_name
        } = body;

        if (!domain || !company_cnpj || !company_name) {
            return NextResponse.json({
                success: false,
                error: 'Dados incompletos'
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

        // Verificar se CNPJ já está em uso
        const { data: existingCompany } = await supabase
            .from('empresas_usadas')
            .select('id, user_id')
            .eq('cnpj', company_cnpj)
            .single();

        if (existingCompany) {
            // Se já existe e não é do usuário atual
            if (existingCompany.user_id !== user.id) {
                return NextResponse.json({
                    success: false,
                    error: 'Esta empresa já está sendo utilizada por outro cliente'
                }, { status: 409 });
            }

            // Se já existe e é do usuário, retorna sucesso (idempotente)
            return NextResponse.json({
                success: true,
                message: 'Empresa já estava salva',
                domain_id: existingCompany.id
            });
        }

        // Verificar se domínio já existe
        const { data: existingDomain } = await supabase
            .from('verified_domains')
            .select('id')
            .eq('domain', domain)
            .eq('user_id', user.id)
            .single();

        let domainId = existingDomain?.id;

        if (!domainId) {
            // Criar novo domínio
            const { data: newDomain, error: domainError } = await supabase
                .from('verified_domains')
                .insert({
                    domain,
                    company_name,
                    company_cnpj,
                    user_id: user.id,
                    is_verified: false
                })
                .select('id')
                .single();

            if (domainError) {
                console.error('Erro ao criar domínio:', domainError);
                return NextResponse.json({
                    success: false,
                    error: 'Erro ao salvar domínio'
                }, { status: 500 });
            }

            domainId = newDomain.id;
        }

        // Adicionar CNPJ na wordlist (empresas_usadas)
        const { error: wordlistError } = await supabase
            .from('empresas_usadas')
            .insert({
                cnpj: company_cnpj,
                user_id: user.id,
                domain_id: domainId,
                company_name
            });

        if (wordlistError) {
            console.error('Erro ao adicionar na wordlist:', wordlistError);
            return NextResponse.json({
                success: false,
                error: 'Erro ao reservar empresa'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Empresa salva com sucesso!',
            domain_id: domainId
        });

    } catch (error) {
        console.error('Erro na API save-with-company:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
