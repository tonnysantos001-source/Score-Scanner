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
        slug: string;
    }>;
}

export default async function LandingPage({ params }: PageProps) {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();

    const supabase = await createClient();

    // 1. Buscar dados básicos no Supabase
    const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select(`
            *,
            domain:verified_domains(
                domain,
                company_name,
                company_cnpj,
                verification_token,
                created_at
            )
        `)
        .eq('slug', normalizedSlug)
        .eq('is_active', true)
        .single();

    if (error || !landingPage) {
        if (!landingPage) {
            console.warn(`[LandingPage] 404 - Página não encontrada para o slug: ${slug}`);
            notFound();
        }
        console.error('[LandingPage] Erro ao buscar landing page:', error);
    }

    // Normalizar dados do Supabase
    const domainData = Array.isArray(landingPage.domain) ? landingPage.domain[0] : landingPage.domain;

    if (!domainData) {
        console.error('[LandingPage] Domínio não encontrado na relação.');
        notFound();
    }

    const cnpj = domainData.company_cnpj;
    const companyName = landingPage.title_text || domainData.company_name;
    const description = landingPage.description_text;

    // 2. Buscar dados enriquecidos na BrasilAPI (Server-Side Fetch with Caching)
    let companyFullData = null;
    try {
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        // Cache por 1 hora (revalidar se necessário)
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, {
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            companyFullData = await res.json();
        } else {
            console.error(`[LandingPage] Falha ao buscar BrasilAPI: ${res.status}`);
        }
    } catch (apiError) {
        console.error('[LandingPage] Erro na requisição BrasilAPI:', apiError);
    }

    // Se falhar a API, montar um objeto mínimo
    const companyDisplayData = companyFullData || {
        razao_social: companyName,
        cnpj: cnpj,
        data_inicio_atividade: domainData.created_at, // Fallback para data de criação do registro se não tiver data de abertura
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

    // Configurações do Facebook
    const { data: fbConfig } = await supabase
        .from('facebook_configs')
        .select('pixel_id')
        .eq('landing_page_id', landingPage.id)
        .single();

    const pixelId = landingPage.facebook_pixel_id || fbConfig?.pixel_id;
    const verificationToken = domainData.verification_token;

    // Função auxiliar para montar endereço sem vírgulas soltas e com fallback
    const formatAddress = (data: any) => {
        if (!data) return 'Endereço Verificado na Receita Federal';

        // Tentar montar endereço completo se os campos existirem
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

        // Se o resultado for muito curto ou vazio (ex: API retornou objeto mas campos vazios), usar fallback
        if (fullAddr.length < 10) return 'Endereço Verificado na Receita Federal';

        return fullAddr;
    };

    const fullAddress = formatAddress(companyFullData);

    return (
        <html lang="pt-BR" className="scroll-smooth">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                {/* Meta Tags do Facebook */}
                {verificationToken && (
                    <meta name="facebook-domain-verification" content={verificationToken} />
                )}

                <title>{companyName.toUpperCase()} - Site Oficial</title>
                <meta name="description" content={description || `Conheça a ${companyName}. Empresa verificada e ativa. Confira nossos dados e entre em contato.`} />

                {/* Pixel Embed */}
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

// Gerar metadata dinâmica (Server Side)
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();
    const supabase = await createClient();

    const { data: landingPage } = await supabase
        .from('landing_pages')
        .select(`
            title_text,
            description_text,
            domain:verified_domains(company_name)
        `)
        .eq('slug', normalizedSlug)
        .eq('is_active', true)
        .single();

    if (!landingPage) {
        return {
            title: 'Página não encontrada',
        };
    }

    const domain = landingPage.domain as { company_name: string } | { company_name: string }[] | null;
    const companyName = Array.isArray(domain) ? domain[0]?.company_name : domain?.company_name || 'Empresa';

    return {
        title: `${companyName} - Site Empresarial`,
        description: landingPage.description_text || `Conheça a ${companyName}, referência em qualidade.`,
    };
}
