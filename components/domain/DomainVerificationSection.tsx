'use client';

import { useState } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';

interface DomainVerificationSectionProps {
    company: {
        cnpj: string;
        razao_social?: string;
        nome_fantasia?: string;
        data_abertura?: string;
        descricao_cnae?: string;
    };
}

export function DomainVerificationSection({ company }: DomainVerificationSectionProps) {
    const [domain, setDomain] = useState('');
    const [domainId, setDomainId] = useState<string | null>(null);
    const [token, setToken] = useState('');
    const [metaTag, setMetaTag] = useState('');
    const [slug, setSlug] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedMetaTag, setCopiedMetaTag] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleGenerateToken = async () => {
        if (!domain.trim()) {
            setError('Por favor, insira um domínio');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const response = await fetch('/api/domain/verification-token', {
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
                setError(data.error || 'Erro ao gerar token');
                return;
            }

            setDomainId(data.domain_id);
            setToken(data.token);
            setMetaTag(data.metaTag);
            setSlug(data.slug);
            setSuccessMessage('Token gerado com sucesso! ✅');
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleValidateDomain = async () => {
        if (!domainId) {
            setError('Gere o token primeiro');
            return;
        }

        setIsValidating(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/domain/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: domainId }),
            });

            const data = await response.json();

            if (!response.ok || !data.isValid) {
                setError(data.error || 'Erro ao validar domínio');
                return;
            }

            setIsVerified(true);
            setSuccessMessage('Domínio verificado com sucesso! 🎉 Agora você pode configurar a landing page.');
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsValidating(false);
        }
    };

    const copyToClipboard = (text: string, type: 'token' | 'metaTag') => {
        navigator.clipboard.writeText(text);
        if (type === 'token') {
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        } else {
            setCopiedMetaTag(true);
            setTimeout(() => setCopiedMetaTag(false), 2000);
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

            {/* Input de Domínio */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        🌐 Adicionar Domínio
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="exemplo: minhaempresa.com.br"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            disabled={isGenerating || !!token}
                        />
                        <button
                            onClick={handleGenerateToken}
                            disabled={isGenerating || !!token}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                'Gerar Token'
                            )}
                        </button>
                    </div>
                </div>

                {/* Exibir Token */}
                {token && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                📝 TOKEN DA BM (META-TAG)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={`facebook-domain-verification=${token}`}
                                    readOnly
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-4 py-2 text-green-400 font-mono text-sm"
                                />
                                <button
                                    onClick={() => copyToClipboard(`facebook-domain-verification=${token}`, 'token')}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
                                >
                                    {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                📋 META-TAG GERADA:
                            </label>
                            <div className="flex gap-2">
                                <pre className="flex-1 bg-gray-900 border border-gray-600 rounded px-4 py-3 text-green-400 font-mono text-xs overflow-x-auto">
                                    {metaTag}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(metaTag, 'metaTag')}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
                                >
                                    {copiedMetaTag ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                ℹ️ Adicione esta meta tag no <code className="bg-gray-800 px-1 rounded">&lt;head&gt;</code> da página inicial do seu domínio
                            </p>
                        </div>

                        {/* Botão de Validação */}
                        {!isVerified && (
                            <button
                                onClick={handleValidateDomain}
                                disabled={isValidating}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        ✅ VALIDAR NO FACEBOOK
                                    </>
                                )}
                            </button>
                        )}

                        {/* Status de Verificação */}
                        {isVerified && (
                            <div className="bg-green-900/30 border border-green-600 rounded p-4 text-center">
                                <p className="text-green-400 font-bold text-lg">✅ Domínio Verificado!</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Agora você pode configurar sua landing page abaixo
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Mensagens */}
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

            {/* Landing Page Editor - apenas se verificado */}
            {isVerified && slug && (
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <LandingPageEditor
                        domainId={domainId!}
                        slug={slug}
                        companyData={company}
                    />
                </div>
            )}
        </div>
    );
}

// Componente separado para o editor de landing page
function LandingPageEditor({
    domainId,
    slug,
    companyData,
}: {
    domainId: string;
    slug: string;
    companyData: {
        razao_social?: string;
        nome_fantasia?: string;
        data_abertura?: string;
        descricao_cnae?: string;
    };
}) {
    const [useGeneric, setUseGeneric] = useState(true);
    const [titleText, setTitleText] = useState('');
    const [descriptionText, setDescriptionText] = useState('');
    const [facebookPixelId, setFacebookPixelId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Gerar texto genérico
    const genericTitle = companyData.razao_social || companyData.nome_fantasia || 'Nossa Empresa';
    const year = companyData.data_abertura ? new Date(companyData.data_abertura).getFullYear() : new Date().getFullYear();
    const activity = companyData.descricao_cnae || 'diversos segmentos';
    const genericDescription = `Somos a ${genericTitle}, uma empresa estabelecida desde ${year}, oferecendo serviços de qualidade no segmento de ${activity}. Nossa missão é fornecer as melhores soluções para nossos clientes com excelência e compromisso.`;

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            const response = await fetch('/api/landing-page/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain_id: domainId,
                    title_text: useGeneric ? null : titleText,
                    description_text: useGeneric ? null : descriptionText,
                    use_generic: useGeneric,
                    facebook_pixel_id: facebookPixelId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSaveMessage(`❌ ${data.error}`);
                return;
            }

            setSaveMessage(`✅ ${data.message}`);
        } catch {
            setSaveMessage('❌ Erro ao salvar landing page');
        } finally {
            setIsSaving(false);
        }
    };

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = `${baseUrl}/l/${slug}`;

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                📄 LANDING PAGE INSTITUCIONAL
            </h4>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="use-generic"
                        checked={useGeneric}
                        onChange={(e) => setUseGeneric(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="use-generic" className="text-sm text-gray-300">
                        ☑️ Usar texto genérico automático
                    </label>
                </div>

                {!useGeneric && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                ✍️ Título da Empresa
                            </label>
                            <input
                                type="text"
                                value={titleText}
                                onChange={(e) => setTitleText(e.target.value)}
                                placeholder={genericTitle}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                📝 Descrição Institucional
                            </label>
                            <textarea
                                value={descriptionText}
                                onChange={(e) => setDescriptionText(e.target.value)}
                                placeholder={genericDescription}
                                rows={4}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </>
                )}

                {useGeneric && (
                    <div className="bg-gray-800 rounded p-4 space-y-2">
                        <p className="text-sm text-gray-400">Preview do texto genérico:</p>
                        <p className="font-bold text-white">{genericTitle}</p>
                        <p className="text-gray-300 text-sm">{genericDescription}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        🎯 Facebook Pixel ID (opcional)
                    </label>
                    <input
                        type="text"
                        value={facebookPixelId}
                        onChange={(e) => setFacebookPixelId(e.target.value)}
                        placeholder="123456789012345"
                        className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">🔗 URL Pública:</p>
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                        {publicUrl}
                    </a>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            💾 SALVAR
                        </>
                    )}
                </button>

                {saveMessage && (
                    <div className={`rounded p-3 text-sm ${saveMessage.startsWith('✅') ? 'bg-green-900/30 border border-green-600 text-green-400' : 'bg-red-900/30 border border-red-600 text-red-400'}`}>
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
