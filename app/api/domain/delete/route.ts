import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { domain_id } = body;

        if (!domain_id) {
            return NextResponse.json(
                { success: false, error: 'domain_id is required' },
                { status: 400 }
            );
        }

        // Verificar se o domínio pertence ao usuário
        const { data: domain, error: domainError } = await supabase
            .from('verified_domains')
            .select('id')
            .eq('id', domain_id)
            .eq('user_id', user.id)
            .single();

        if (domainError || !domain) {
            return NextResponse.json(
                { success: false, error: 'Domain not found or access denied' },
                { status: 404 }
            );
        }

        // O Supabase vai deletar automaticamente a landing_page e facebook_configs
        // devido ao CASCADE nas foreign keys
        const { error: deleteError } = await supabase
            .from('verified_domains')
            .delete()
            .eq('id', domain_id);

        if (deleteError) {
            console.error('Error deleting domain:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete domain' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Domain deleted successfully',
        });
    } catch (error) {
        console.error('Error in delete endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
