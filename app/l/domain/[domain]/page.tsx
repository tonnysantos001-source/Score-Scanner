import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import MissionValues from '@/components/landing/MissionValues';
import Timeline from '@/components/landing/Timeline';
import CompanyData from '@/components/landing/CompanyData';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/landing/Footer';
import { formatCNPJ } from '@/lib/utils/cnpj';

/**
 * Custom Domain Landing Page (Premium)
 *
 * Serves the full institutional landing page for any custom domain registered
 * in verified_domains. Traffic arrives here via middleware rewrite.
 * Uses service-role client to bypass RLS for public/unauthenticated visitors.
 */

interface Props {
    params: Promise<{ domain: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://score-scanner-7q2s.vercel.app';

export default async function CustomDomainPage({ params }: Props) {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const supabase = createAdminClient();

    // 1. Fetch domain record + landing page config
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
                        Este domínio aponta para a plataforma, mas ainda não está configurado no painel.
                    </p>
                </div>
            </div>
        );
    }

    const landingPage = Array.isArray(verifiedDomain.landing_pages)
        ? verifiedDomain.landing_pages[0]
        : verifiedDomain.landing_pages;

    // 2. Find company linked via empresas_usadas
    const { data: empresaUsada } = await supabase
        .from('empresas_usadas')
        .select('cnpj, company_name')
        .eq('domain_id', verifiedDomain.id)
        .single();

    const cnpj = empresaUsada?.cnpj || verifiedDomain.company_cnpj;
    const companyName = landingPage?.title_text || empresaUsada?.company_name || verifiedDomain.company_name || 'Empresa';
    const description = landingPage?.description_text;

    if (!cnpj) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md">
                    <span className="text-4xl mb-4 block">🔗</span>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Domínio Configurado</h1>
                    <p className="text-gray-600">
                        Este domínio está ativo. Uma empresa será vinculada em breve.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Fetch full company data from BrasilAPI
    let companyFullData: Record<string, any> | null = null;
    try {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            companyFullData = await res.json();
        }
    } catch {
        // Fallback to stored data below
    }

    // 4. Build display data from API or fallback
    const company = companyFullData || {
        razao_social: companyName,
        cnpj,
        data_inicio_atividade: verifiedDomain.created_at,
        capital_social: 0,
        natureza_juridica: 'Não informado',
        municipio: 'Brasil',
        uf: 'BR',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        descricao_tipo_de_logradouro: '',
        porte: '',
        ddd_telefone_1: '',
        email: '',
    };

    // Format address
    const streetParts = [
        company.descricao_tipo_de_logradouro,
        company.logradouro,
        company.numero,
        company.complemento,
    ].filter(Boolean).join(' ');

    const districtPart = [company.bairro, company.municipio, company.uf].filter(Boolean).join(' - ');
    const fullAddress = [streetParts, districtPart].filter(Boolean).join(', ') || 'Endereço registrado na Receita Federal';

    // Helpers
    const foundedYear = company.data_inicio_atividade
        ? new Date(company.data_inicio_atividade).getFullYear()
        : null;

    const telefone = company.ddd_telefone_1
        ? company.ddd_telefone_1.replace(/\s/g, '').replace(/(\d{2})(\d+)/, '($1) $2')
        : undefined;

    const pixelId = landingPage?.facebook_pixel_id;
    const verificationToken = verifiedDomain.verification_token;
    const canonicalUrl = `https://${decodedDomain}`;

    // OG Image URL (generated by /api/og edge route)
    const ogImageParams = new URLSearchParams({
        name: companyName,
        cnpj: formatCNPJ(cnpj),
        city: company.municipio || '',
    });
    const ogImageUrl = `${BASE_URL}/api/og?${ogImageParams.toString()}`;

    return (
        <html lang="pt-BR" className="scroll-smooth">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                {/* === Facebook Domain Verification === */}
                {verificationToken && (
                    <meta name="facebook-domain-verification" content={verificationToken} />
                )}

                {/* === SEO === */}
                <title>{companyName} — Informações Cadastrais</title>
                <meta name="description" content={description || `Conheça a ${companyName}. Informações cadastrais públicas da Receita Federal.`} />
                <link rel="canonical" href={canonicalUrl} />
                <meta name="robots" content="index, follow" />

                {/* === Open Graph (Facebook / WhatsApp / LinkedIn) === */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={`${companyName} — Informações Cadastrais`} />
                <meta property="og:description" content={description || `CNPJ ${formatCNPJ(cnpj)} • ${company.municipio} - ${company.uf}. Informações cadastrais públicas.`} />
                <meta property="og:image" content={ogImageUrl} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={`Logo e dados de ${companyName}`} />
                <meta property="og:locale" content="pt_BR" />
                <meta property="og:site_name" content={companyName} />

                {/* === Twitter Card === */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${companyName} — Informações Cadastrais`} />
                <meta name="twitter:description" content={description || `CNPJ ${formatCNPJ(cnpj)} • Informações cadastrais públicas.`} />
                <meta name="twitter:image" content={ogImageUrl} />

                {/* === Facebook Pixel === */}
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
                    {/* 1. Hero — dark premium */}
                    <Hero
                        companyName={companyName}
                        description={description || ''}
                        cnpj={formatCNPJ(cnpj)}
                        municipio={company.municipio}
                        uf={company.uf}
                        foundedYear={foundedYear}
                    />

                    {/* 2. About — history, stats */}
                    <About
                        companyName={companyName}
                        foundedDate={company.data_inicio_atividade || ''}
                        porte={company.porte}
                        naturezaJuridica={company.natureza_juridica}
                        municipio={company.municipio}
                        uf={company.uf}
                        cnpj={cnpj}
                    />

                    {/* 3. Mission / Vision / Values / Ethics */}
                    <MissionValues companyName={companyName} />

                    {/* 4. Timeline — history milestones */}
                    <Timeline
                        foundedDate={company.data_inicio_atividade || ''}
                        companyName={companyName}
                    />

                    {/* 5. Company Data — cadastral info */}
                    <CompanyData company={company} />

                    {/* 6. Contact — address + map link */}
                    <ContactSection
                        companyName={companyName}
                        address={fullAddress}
                        municipio={company.municipio}
                        uf={company.uf}
                        cep={company.cep}
                        telefone={telefone}
                        email={company.email}
                    />
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

// Dynamic metadata (for Next.js head management)
export async function generateMetadata({ params }: Props) {
    const { domain } = await params;
    const decodedDomain = decodeURIComponent(domain);
    const supabase = createAdminClient();

    const { data } = await supabase
        .from('verified_domains')
        .select('company_name, company_cnpj, landing_pages(title_text, description_text)')
        .eq('domain', decodedDomain)
        .single();

    if (!data) {
        return { title: 'Domínio não configurado' };
    }

    const lp = (data.landing_pages as Array<{ title_text?: string; description_text?: string }>)?.[0];
    const name = lp?.title_text || data.company_name || 'Empresa';
    const canonicalUrl = `https://${decodedDomain}`;
    const ogImageUrl = `${BASE_URL}/api/og?name=${encodeURIComponent(name)}&cnpj=${data.company_cnpj || ''}`;

    return {
        title: `${name} — Informações Cadastrais`,
        description: lp?.description_text || `Conheça a ${name}. Informações cadastrais públicas.`,
        openGraph: {
            type: 'website',
            url: canonicalUrl,
            title: `${name} — Informações Cadastrais`,
            description: lp?.description_text || `Informações cadastrais de ${name}.`,
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
            locale: 'pt_BR',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} — Informações Cadastrais`,
            images: [ogImageUrl],
        },
    };
}
