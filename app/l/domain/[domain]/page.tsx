import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

// Placeholder for the actual landing page component
// In the future, this should reuse the same component as /l/[slug]
// but for now we will just show a simple verified page.

interface Props {
    params: { domain: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const domain = decodeURIComponent(params.domain);
    const supabase = await createClient();

    const { data: verifiedDomain } = await supabase
        .from('verified_domains')
        .select('*, landing_pages(*)')
        .eq('domain', domain)
        .eq('custom_domain_status', 'active')
        .single();

    if (!verifiedDomain) {
        return {
            title: 'Domínio não configurado',
        };
    }

    const lp = verifiedDomain.landing_pages?.[0];

    return {
        title: lp?.title_text || verifiedDomain.company_name,
        description: lp?.description_text || `Página oficial de ${verifiedDomain.company_name}`,
    };
}

export default async function CustomDomainPage({ params }: Props) {
    const domain = decodeURIComponent(params.domain);
    const supabase = await createClient();

    // 1. Fetch domain info
    const { data: verifiedDomain } = await supabase
        .from('verified_domains')
        .select('*, landing_pages(*)')
        .eq('domain', domain)
        // .eq('custom_domain_status', 'active') // Strict Mode: only show if active
        .single();

    if (!verifiedDomain) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Domínio não conectado</h1>
                    <p className="text-gray-600">
                        Este domínio aponta para a VerifyAds, mas não está configurado no painel.
                    </p>
                </div>
            </div>
        );
    }

    const landingPage = verifiedDomain.landing_pages?.[0];

    // 2. Render the actual Landing Page content
    // ideally this should import the same components used in /l/[slug]
    // For now, let's create a visual representation

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Header / Nav */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur top-0 sticky z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-900">
                        {verifiedDomain.company_name}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Verificado Oficialmente
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                        {landingPage?.title_text || 'Página Verificada'}
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {landingPage?.description_text ||
                            `Esta é uma página institucional verificada de ${verifiedDomain.company_name}. CNPJ: ${verifiedDomain.company_cnpj}`}
                    </p>
                </div>

                <div className="border border-gray-200 rounded-2xl p-8 bg-gray-50 flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold mb-2">Segurança Garantida</h3>
                    <p className="text-gray-500 mb-6">
                        Este domínio foi verificado e pertence à empresa {verifiedDomain.company_name}.
                    </p>
                    <div className="text-xs text-gray-400 font-mono">
                        ID de Verificação: {verifiedDomain.id.split('-')[0]}
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-gray-400 border-t mt-12">
                &copy; {new Date().getFullYear()} {verifiedDomain.company_name}. Todos os direitos reservados.
            </footer>
        </div>
    );
}
