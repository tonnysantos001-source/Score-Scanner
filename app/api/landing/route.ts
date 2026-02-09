import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
        return new NextResponse('Domain not specified', { status: 400 });
    }

    const supabase = await createClient();

    // Buscar landing page pelo domínio (acesso público, sem autenticação)
    const { data: verifiedDomain, error } = await supabase
        .from('verified_domains')
        .select(`
            id,
            domain,
            company_name,
            facebook_verification_token,
            dns_status,
            landing_pages (
                id,
                title_text,
                description_text,
                facebook_pixel_id,
                is_active
            )
        `)
        .eq('domain', domain)
        .eq('dns_status', 'active')  // Só mostra se DNS estiver ativo
        .single();

    if (error || !verifiedDomain) {
        return new NextResponse(
            `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Domínio não configurado</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    main {
                        background: white;
                        border-radius: 16px;
                        padding: 60px 40px;
                        max-width: 600px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    h1 { font-size: 2rem; color: #1a202c; margin-bottom: 16px; }
                    p { color: #4a5568; line-height: 1.6; margin-bottom: 12px; }
                </style>
            </head>
            <body>
                <main>
                    <h1>⚠️ Domínio não configurado</h1>
                    <p>Este domínio ainda não foi configurado corretamente.</p>
                    <p>Se você é o proprietário, verifique se:</p>
                    <ul style="text-align: left; margin: 20px auto; max-width: 400px; color: #4a5568;">
                        <li>O DNS está apontando para nosso servidor</li>
                        <li>A landing page está ativa</li>
                        <li>O domínio foi verificado</li>
                    </ul>
                </main>
            </body>
            </html>`,
            {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        );
    }

    const landingPage = Array.isArray(verifiedDomain.landing_pages)
        ? verifiedDomain.landing_pages[0]
        : verifiedDomain.landing_pages;

    if (!landingPage || !landingPage.is_active) {
        return new NextResponse('Landing page not active', { status: 404 });
    }

    // Usar dados fornecidos ou gerar genéricos
    const title = landingPage.title_text || verifiedDomain.company_name || 'Empresa';
    const description = landingPage.description_text ||
        `${verifiedDomain.company_name || 'Nossa empresa'} - Página Institucional`;

    const pixelId = landingPage.facebook_pixel_id;
    const verificationToken = verifiedDomain.facebook_verification_token;

    // Renderizar HTML da landing page
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    ${verificationToken ? `<meta name="facebook-domain-verification" content="${verificationToken}" />` : ''}
    
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    ${pixelId ? `
    <script>
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
    </script>
    <noscript>
        <img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />
    </noscript>
    ` : ''}
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
            main { padding: 40px 24px; }
            h1 { font-size: 1.875rem; }
            p { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <main>
        <h1>${title}</h1>
        <p>${description}</p>
    </main>
</body>
</html>`;

    return new NextResponse(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
    });
}
