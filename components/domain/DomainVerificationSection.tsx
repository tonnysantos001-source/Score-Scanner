'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface DomainVerificationSectionProps {
    company: {
        cnpj: string;
        razao_social?: string;
        nome_fantasia?: string;
        data_abertura?: string;
        descricao_cnae?: string;
    };
}

type DNSStatus = 'pending' | 'active' | 'failed';

export function DomainVerificationSection({ company }: DomainVerificationSectionProps) {
    const [domain, setDomain] = useState('');
    const [domainId, setDomainId] = useState<string | null>(null);
    const [dnsStatus, setDnsStatus] = useState<DNSStatus>('pending');
    const [facebookToken, setFacebookToken] = useState('');
    const [facebookPixelId, setFacebookPixelId] = useState('');
    const [slug, setSlug] = useState('');

    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [isCheckingDNS, setIsCheckingDNS] = useState(false);
    const [copiedInstructions, setCopiedInstructions] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // DNS Instructions
    const dnsInstructions = `Configure no seu registrador de domínio:

Tipo: CNAME
Nome: @ (ou deixe em branco)
Valor: cname.vercel-dns.com

OU

Tipo: A
Nome: @ (ou deixe em branco)
Valor: 76.76.21.21`;

    const handleAddDomain = async () => {
        if (!domain.trim()) {
            setError('Por favor, insira um domínio');
            return;
        }

        setIsAddingDomain(true);
        setError('');

        try {
            const response = await fetch('/api/domain/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnpj: company.cnpj,
                    domain: domain.trim(),
                    company_name: company.razao_social || company.nome_fantasia || 'Empresa',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao adicionar domínio');
                return;
            }

            setDomainId(data.domain_id);
            setSlug(data.slug);
            setDnsStatus('pending');
            setSuccessMessage('Domínio adicionado! Configure o DNS conforme as instruções abaixo.');
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsAddingDomain(false);
        }
    };

    const handleCheckDNS = async () => {
        if (!domainId) {
            setError('Adicione o domínio primeiro');
            return;
        }

        setIsCheckingDNS(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/domain/verify-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: domainId }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao verificar DNS');
                return;
            }

            setDnsStatus(data.dns_status);

            if (data.dns_status === 'active') {
                setSuccessMessage('✅ DNS configurado corretamente! Agora você pode adicionar o token do Facebook.');
            } else {
                setError('DNS ainda não está apontando para Vercel. Aguarde a propagação (pode levar até 48h) ou verifique a configuração.');
            }
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsCheckingDNS(false);
        }
    };

    const handleSaveLandingPage = async () => {
        if (!domainId) return;

        try {
            const response = await fetch('/api/landing-page/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain_id: domainId,
                    facebook_verification_token: facebookToken || null,
                    facebook_pixel_id: facebookPixelId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao salvar');
                return;
            }

            setSuccessMessage('✅ Configurações salvas! Seu domínio está pronto para validação no Facebook.');
        } catch {
            setError('Erro ao salvar configurações');
        }
    };

    const copyToClipboard = (text: string, type: 'instructions' | 'token') => {
        navigator.clipboard.writeText(text);
        if (type === 'instructions') {
            setCopiedInstructions(true);
            setTimeout(() => setCopiedInstructions(false), 2000);
        } else {
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    return (
        <div className="border-t border-gray-700 pt-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-400">VERIFICAÇÃO DE DOMÍNIO</h3>
            </div>

            <div className="space-y-4">
                {/* Step 1: Add Domain */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        🌐 Seu Domínio
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="exemplo: minhaempresa.com.br"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            disabled={isAddingDomain || !!domainId}
                        />
                        <button
                            onClick={handleAddDomain}
                            disabled={isAddingDomain || !!domainId}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium flex items-center gap-2"
                        >
                            {isAddingDomain ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adicionando...
                                </>
                            ) : (
                                'Adicionar Domínio'
                            )}
                        </button>
                    </div>
                </div>

                {/* Step 2: DNS Instructions */}
                {domainId && dnsStatus !== 'active' && (
                    <div className="bg-yellow-900/20 border border-yellow-600/50 rounded p-4">
                        <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-yellow-400 mb-2">
                                    🌐 Configure o DNS do seu domínio:
                                </p>
                                <pre className="bg-gray-900 border border-gray-700 rounded px-4 py-3 text-sm text-gray-300 overflow-x-auto">
                                    {dnsInstructions}
                                </pre>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(dnsInstructions, 'instructions')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                        >
                            {copiedInstructions ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedInstructions ? 'Copiado!' : 'Copiar Instruções'}
                        </button>
                    </div>
                )}

                {/* Step 3: Check DNS */}
                {domainId && (
                    <div>
                        <button
                            onClick={handleCheckDNS}
                            disabled={isCheckingDNS}
                            className={`w-full ${dnsStatus === 'active'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-orange-600 hover:bg-orange-700'
                                } disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2`}
                        >
                            {isCheckingDNS ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verificando DNS...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    {dnsStatus === 'active' ? '✅ DNS Ativo' : '🔍 Verificar DNS'}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 4: Facebook Token (only if DNS is active) */}
                {dnsStatus === 'active' && (
                    <>
                        <div className="bg-green-900/20 border border-green-600/50 rounded p-4">
                            <p className="text-green-400 font-semibold mb-2">
                                ✅ DNS configurado corretamente!
                            </p>
                            <p className="text-gray-300 text-sm">
                                Agora adicione o token de verificação do Facebook e configure sua landing page.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                📝 Token de Verificação do Facebook (META-TAG)
                            </label>
                            <input
                                type="text"
                                value={facebookToken}
                                onChange={(e) => setFacebookToken(e.target.value)}
                                placeholder="Cole o token fornecido pelo Facebook Business Manager"
                                className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                ℹ️ Acesse o Facebook Business Manager e copie o token de verificação de domínio
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                🎯 Facebook Pixel ID (opcional)
                            </label>
                            <input
                                type="text"
                                value={facebookPixelId}
                                onChange={(e) => setFacebookPixelId(e.target.value)}
                                placeholder="123456789012345"
                                className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleSaveLandingPage}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded font-bold"
                        >
                            💾 Salvar e Publicar Landing Page
                        </button>

                        {slug && (
                            <div className="bg-gray-900 border border-gray-700 rounded p-3">
                                <p className="text-xs text-gray-400 mb-1">🔗 Sua landing page estará disponível em:</p>
                                <p className="text-blue-400 font-mono text-sm">{domain}</p>
                            </div>
                        )}
                    </>
                )}

                {/* Messages */}
                {error && (
                    <div className="bg-red-900/30 border border-red-600 rounded p-3 text-red-400 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {successMessage && !error && (
                    <div className="bg-green-900/30 border border-green-600 rounded p-3 text-green-400 text-sm">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
