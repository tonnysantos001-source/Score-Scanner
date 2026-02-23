import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Values from '@/components/landing/Values';
import CompanyData from '@/components/landing/CompanyData';
import Footer from '@/components/landing/Footer';
import { formatCNPJ } from '@/lib/utils/cnpj';

interface PageProps {
    params: Promise<{
        hostname: string;
    }>;
}

export default async function CustomDomainLandingPage({ params }: PageProps) {
    const { hostname } = await params;

    const supabase = await createClient();

    // Look up the landing page via the custom domain stored in verified_domains
    const { data: domainRecord, error: domainError } = await supabase
        .from('verified_domains')
        .select(`
            id,
            domain,
            company_name,
            company_cnpj,
            verification_token,
            created_at,
            is_verified,
            landing_pages (
                id,
                slug,
                is_active,
                title_text,
                description_text,
                facebook_pixel_id,
                domain_id
            )
        `)
        .eq('domain', hostname)
        .eq('is_verified', true)
        .single();

    if (domainError || !domainRecord) {
        console.warn(`[CustomDomain] No verified domain for hostname: ${hostname}`);
        notFound();
    }

    // Find the active landing page for this domain
    const landingPages = Array.isArray(domainRecord.landing_pages)
        ? domainRecord.landing_pages
        : domainRecord.landing_pages
            ? [domainRecord.landing_pages]
            : [];

    const landingPage = landingPages.find((lp: { is_active: boolean }) => lp.is_active) || landingPages[0];

    if (!landingPage) {
        console.warn(`[CustomDomain] No landing page found for: ${hostname}`);
        notFound();
    }

    const cnpj = domainRecord.company_cnpj;
    const companyName = (landingPage as { title_text?: string }).title_text || domainRecord.company_name;
    const description = (landingPage as { description_text?: string }).description_text;
    const pixelId = (landingPage as { facebook_pixel_id?: string }).facebook_pixel_id;
    const verificationToken = domainRecord.verification_token;

    // Fetch enriched data from BrasilAPI
    let companyFullData = null;
    try {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, {
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            companyFullData = await res.json();
        }
    } catch (err) {
        console.error('[CustomDomain] BrasilAPI error:', err);
    }

    const companyDisplayData = companyFullData || {
        razao_social: companyName,
        cnpj: cnpj,
        data_inicio_atividade: domainRecord.created_at,
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

    // Build address string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatAddress = (data: any) => {
        if (!data) return 'Endereço Verificado na Receita Federal';
        const streetPart = [data.descricao_tipo_de_logradouro, data.logradouro, data.numero, data.complemento].filter(Boolean).join(' ');
        const districtPart = [data.bairro, data.municipio, data.uf].filter(Boolean).join(' - ');
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

export async function generateMetadata({ params }: PageProps) {
    const { hostname } = await params;
    const supabase = await createClient();

    const { data: domainRecord } = await supabase
        .from('verified_domains')
        .select(`
            company_name,
            landing_pages (title_text, description_text)
        `)
        .eq('domain', hostname)
        .eq('is_verified', true)
        .single();

    if (!domainRecord) return { title: 'Página não encontrada' };

    const pages = Array.isArray(domainRecord.landing_pages)
        ? domainRecord.landing_pages
        : [domainRecord.landing_pages];
    const page = pages[0] as { title_text?: string; description_text?: string } | null;
    const companyName = page?.title_text || domainRecord.company_name;

    return {
        title: `${companyName} - Site Empresarial`,
        description: page?.description_text || `Conheça a ${companyName}.`,
    };
}
