import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateSlug(companyName: string, cnpj: string): string {
    const cleanName = companyName
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
        .replace(/^-+|-+$/g, ''); // Remove hifens do início/fim

    const cnpjSuffix = cnpj.slice(-6); // Últimos 6 dígitos para garantir unicidade
    return `${cleanName}-${cnpjSuffix}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            company_cnpj,
            company_name,
            custom_notes,
            verification_token,
            pixel_id,
            domain_id // NEW: Required for White Label
        } = body;

        if (!company_cnpj || !company_name) {
            return NextResponse.json({
                success: false,
                error: 'Dados incompletos'
            }, { status: 400 });
        }

        // Sanitize CNPJ
        const cleanCnpj = company_cnpj.replace(/\D/g, '');
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Não autenticado'
            }, { status: 401 });
        }

        // --- VALIDATION: STRICT CUSTOM DOMAIN ---
        if (!domain_id) {
            return NextResponse.json({
                success: false,
                error: 'É necessário selecionar um domínio próprio verificado.'
            }, { status: 400 });
        }

        // Confirm domain belongs to user and is external
        const { data: targetDomain, error: domainCheckError } = await supabase
            .from('verified_domains')
            .select('id, domain, domain_type')
            .eq('id', domain_id)
            .eq('user_id', user.id)
            .eq('domain_type', 'external')
            .single();

        if (domainCheckError || !targetDomain) {
            return NextResponse.json({
                success: false,
                error: 'Domínio inválido ou não encontrado.'
            }, { status: 403 });
        }

        // Remove old internal slug generation logic. 
        // We now MAP this company to the selected External Domain.

        // Check if CNPJ is already used
        const { data: existingCompany } = await supabase
            .from('empresas_usadas')
            .select('id, user_id, domain_id')
            .eq('cnpj', cleanCnpj)
            .single();

        // Logic for existing company...
        if (existingCompany) {
            if (existingCompany.user_id !== user.id) {
                return NextResponse.json({ success: false, error: 'Empresa já utilizada por outro cliente' }, { status: 409 });
            }
            // Update mapping if changed? 
            // Ideally we just update the content linked to the domain_id they passed 
            // OR if they are changing the domain for this company? 
            // Use case: User selects domain A. Then selects domain B.
            // We should update 'empresas_usadas' to point to domain B?
            // AND update Landing Page content on domain B?

            // For now, let's assume simple update of content on the target domain
        } else {
            // Create usage record
            await supabase.from('empresas_usadas').insert({
                cnpj: cleanCnpj,
                user_id: user.id,
                domain_id: targetDomain.id,
                company_name
            });
        }

        // ── GLOBAL BLACKLIST: mark CNPJ as used so ALL miners skip it ──
        // This inserts into cnpj_used which is fetched by cnpjCache.initialize()
        // Ignore duplicate errors (CNPJ already blacklisted is fine)
        await supabase.from('cnpj_used').upsert(
            { cnpj: cleanCnpj },
            { onConflict: 'cnpj', ignoreDuplicates: true }
        );

        // UPSERT Landing Page for this Domain
        // A custom domain typically has ONE main landing page (root).
        // Check if LP exists for this domain
        const { data: existingLP } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('domain_id', targetDomain.id)
            .single();

        const lpData = {
            domain_id: targetDomain.id,
            slug: 'home', // Virtual slug for root
            title_text: company_name,
            description_text: custom_notes || `Conheça a ${company_name}. Dados verificados.`,
            facebook_pixel_id: pixel_id || null,
            is_active: true,
            use_generic: true
        };

        if (existingLP) {
            await supabase.from('landing_pages').update(lpData).eq('id', existingLP.id);
        } else {
            await supabase.from('landing_pages').insert(lpData);
        }

        // Update Domain Verification Token if provided
        if (verification_token) {
            await supabase
                .from('verified_domains')
                .update({ verification_token })
                .eq('id', targetDomain.id);
        }

        return NextResponse.json({
            success: true,
            message: 'Página vinculada com sucesso!',
            url: `https://${targetDomain.domain}` // Root URL
        });

    } catch (error) {
        console.error('Erro API:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
