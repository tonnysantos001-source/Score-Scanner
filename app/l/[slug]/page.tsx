import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function LandingPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Buscar landing page pelo slug (acesso público)
    const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select(`
            *,
            domain:verified_domains(
                domain,
                company_name,
                company_cnpj,
                verification_token
            )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !landingPage) {
        notFound();
    }

    // Buscar dados da empresa para gerar texto genérico se necessário
    let title = landingPage.title_text;
    let description = landingPage.description_text;

    if (landingPage.use_generic || !title || !description) {
        // Gerar texto genérico básico
        const companyName = Array.isArray(landingPage.domain)
            ? landingPage.domain[0]?.company_name
            : landingPage.domain?.company_name || 'Nossa Empresa';

        title = title || companyName;
        description = description || `Somos a ${companyName}, oferecendo serviços de qualidade com excelência e compromisso.`;
    }

    // Buscar configuração do Facebook Pixel se houver
    const { data: fbConfig } = await supabase
        .from('facebook_configs')
        .select('pixel_id')
        .eq('landing_page_id', landingPage.id)
        .single();

    const pixelId = landingPage.facebook_pixel_id || fbConfig?.pixel_id;
    const verificationToken = Array.isArray(landingPage.domain)
        ? landingPage.domain[0]?.verification_token
        : landingPage.domain?.verification_token;

    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                {/* Meta tag de verificação do Facebook */}
                {verificationToken && (
                    <meta
                        name="facebook-domain-verification"
                        content={verificationToken}
                    />
                )}

                <title>{title}</title>
                <meta name="description" content={description} />

                {/* Facebook Pixel */}
                {pixelId && (
                    <>
                        <script
                            dangerouslySetInnerHTML={{
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
                                `,
                            }}
                        />
                        <noscript>
                            <img
                                height="1"
                                width="1"
                                style={{ display: 'none' }}
                                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                                alt=""
                            />
                        </noscript>
                    </>
                )}

                <style>{`
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }

                    main {
                        max-width: 800px;
                        width: 100%;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                        padding: 60px 40px;
                        text-align: center;
                    }

                    h1 {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #1a202c;
                        margin-bottom: 24px;
                        line-height: 1.2;
                    }

                    p {
                        font-size: 1.125rem;
                        line-height: 1.8;
                        color: #4a5568;
                        max-width: 700px;
                        margin: 0 auto;
                    }

                    @media (max-width: 768px) {
                        main {
                            padding: 40px 24px;
                        }

                        h1 {
                            font-size: 1.875rem;
                        }

                        p {
                            font-size: 1rem;
                        }
                    }
                `}</style>
            </head>
            <body>
                <main>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </main>
            </body>
        </html>
    );
}

// Gerar metadata dinâmica
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: landingPage } = await supabase
        .from('landing_pages')
        .select(`
            title_text,
            description_text,
            use_generic,
            domain:verified_domains(company_name)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (!landingPage) {
        return {
            title: 'Página não encontrada',
        };
    }

    const companyName = Array.isArray(landingPage.domain)
        ? landingPage.domain[0]?.company_name
        : landingPage.domain?.company_name || 'Empresa';

    const title = landingPage.title_text || companyName;
    const description = landingPage.description_text || `${companyName} - Página Institucional`;

    return {
        title,
        description,
    };
}
