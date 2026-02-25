import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Empresa';
    const cnpj = searchParams.get('cnpj') || '';
    const city = searchParams.get('city') || '';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Grid pattern overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Top badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: '100px',
                        padding: '8px 20px',
                        marginBottom: '32px',
                    }}
                >
                    <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Dados Públicos da Receita Federal
                    </span>
                </div>

                {/* Company name */}
                <div
                    style={{
                        color: '#ffffff',
                        fontSize: name.length > 40 ? '36px' : name.length > 25 ? '44px' : '56px',
                        fontWeight: 800,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        maxWidth: '900px',
                        letterSpacing: '-0.02em',
                        marginBottom: '20px',
                        display: 'flex',
                    }}
                >
                    {name}
                </div>

                {/* CNPJ pill */}
                {cnpj && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '100px',
                            padding: '10px 24px',
                            marginTop: '8px',
                        }}
                    >
                        <span style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 500 }}>
                            CNPJ {cnpj}
                        </span>
                        {city && (
                            <span style={{ color: '#475569', fontSize: '18px' }}>
                                &nbsp;•&nbsp;{city}
                            </span>
                        )}
                    </div>
                )}

                {/* Bottom bar */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '4px',
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                    }}
                />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
