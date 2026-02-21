import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Values from '@/components/landing/Values';
import CompanyData from '@/components/landing/CompanyData';
import Footer from '@/components/landing/Footer';
import { formatCNPJ } from '@/lib/utils/cnpj';

/**
 * Custom Domain Landing Page
 * 
 * Renders the same professional landing page as /l/[slug] but routed
 * via middleware when traffic arrives on a custom domain (e.g. verifyads.online).
 */

interface Props {
    params: Promise<{ domain: string }>;
}

export default async function CustomDomainPage({ params }: Props) {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const supabase = await createClient();

    // 1. Fetch domain + landing page + empresas_usadas data
    const { data: verifiedDomain } = await supabase
        .from('verified_domains')
        .select('*, landing_pages(*)')
        .eq('domain', decodedDomain)
        .single();

    if (!verifiedDomain) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
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

    // 2. Find company linked to this domain via empresas_usadas
    const { data: empresaUsada } = await supabase
        .from('empresas_usadas')
        .select('cnpj, company_name')
        .eq('domain_id', verifiedDomain.id)
        .single();

    // Use empresa data or fallback to domain data
    const cnpj = empresaUsada?.cnpj || verifiedDomain.company_cnpj;
    const companyName = landingPage?.title_text || empresaUsada?.company_name || verifiedDomain.company_name || 'Empresa Verificada';
    const description = landingPage?.description_text;

    if (!cnpj) {
        // No company linked yet — show minimal waiting page
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔗</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Domínio Configurado</h1>
                    <p className="text-gray-600">
                        Este domínio está verificado. Uma empresa será vinculada em breve.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Fetch company data from BrasilAPI (same logic as /l/[slug])
    let companyFullData = null;
    try {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, {
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            companyFullData = await res.json();
        } else {
            console.error(`[CustomDomain] BrasilAPI error: ${res.status}`);
        }
    } catch (apiError) {
        console.error('[CustomDomain] BrasilAPI fetch error:', apiError);
    }

    // Fallback company data
    const companyDisplayData = companyFullData || {
        razao_social: companyName,
        cnpj: cnpj,
        data_inicio_atividade: verifiedDomain.created_at,
        capital_social: 0,
        natureza_juridica: 'Informação não disponível',
        municipio: 'Brasil',
        uf: 'BR',
        logradouro: 'Endereço verificado',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        descricao_tipo_de_logradouro: ''
    };

    // 4. Facebook config
    const pixelId = landingPage?.facebook_pixel_id;
    const verificationToken = verifiedDomain.verification_token;

    // Format address
    const formatAddress = (data: Record<string, string> | null) => {
        if (!data) return 'Endereço Verificado na Receita Federal';

        const streetPart = [
            data.descricao_tipo_de_logradouro,
            data.logradouro,
            data.numero,
            data.complemento
        ].filter(Boolean).join(' ');

        const districtPart = [
            data.bairro,
            data.municipio,
            data.uf
        ].filter(Boolean).join(' - ');

        const cepPart = data.cep ? `CEP: ${data.cep}` : '';
        const fullAddr = [streetPart, districtPart, cepPart].filter(Boolean).join(', ');

        if (fullAddr.length < 10) return 'Endereço Verificado na Receita Federal';
        return fullAddr;
    };

    const fullAddress = formatAddress(companyFullData);

    return (
        <html lang="pt-BR" className="scroll-smooth">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                {verificationToken && (
                    <meta name="facebook-domain-verification" content={verificationToken} />
                )}

                <title>{companyName.toUpperCase()} - Site Oficial</title>
                <meta name="description" content={description || `Conheça a ${companyName}. Empresa verificada e ativa.`} />

                {pixelId && (
                    <>
                        <script dangerouslySetInnerHTML={{
                            __html: `
                                !function(f,b,e,v,n,t,s)
                                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                n.queue=[];t=b.createElement(e);t.async=!0;
                                t.src=v;s=b.getElementsByTagName(e)[0];
                                s.parentNode.insertBefore(t,s)}(window, document,'script',
                                'https://connect.facebook.net/en_US/fbevents.js');
                                fbq('init', '${pixelId}');
                                fbq('track', 'PageView');
                            `
                        }} />
                        <noscript>
                            <img height="1" width="1" style={{ display: 'none' }}
                                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                                alt=""
                            />
                        </noscript>
                    </>
                )}
            </head>
            <body className="antialiased bg-slate-50 text-slate-900 font-sans">
                <Header companyName={companyName} />

                <main>
                    <Hero
                        companyName={companyName}
                        description={description || ''}
                        cnpj={formatCNPJ(cnpj)}
                    />
                    <Values />
                    <CompanyData company={companyDisplayData} />
                </main>

                <Footer
                    companyName={companyName}
                    cnpj={formatCNPJ(cnpj)}
                    address={fullAddress}
                />
            </body>
        </html>
    );
}

// Dynamic metadata
export async function generateMetadata({ params }: Props) {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const supabase = await createClient();

    const { data: verifiedDomain } = await supabase
        .from('verified_domains')
        .select('company_name, landing_pages(title_text, description_text)')
        .eq('domain', decodedDomain)
        .single();

    if (!verifiedDomain) {
        return { title: 'Domínio não configurado' };
    }

    const lp = (verifiedDomain.landing_pages as Array<{ title_text?: string; description_text?: string }>)?.[0];
    const name = lp?.title_text || verifiedDomain.company_name || 'Empresa';

    return {
        title: `${name} - Site Empresarial`,
        description: lp?.description_text || `Conheça a ${name}, empresa verificada.`,
    };
}
