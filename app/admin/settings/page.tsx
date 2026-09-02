'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff, Check, AlertCircle, Copy, CreditCard, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'zentripay' | 'alphacash' | 'manual'>('zentripay');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeGateway, setActiveGateway] = useState<string>('zentripay');

    // ZentriPay credentials
    const [zentriKey, setZentriKey] = useState('');
    const [showZentriKey, setShowZentriKey] = useState(false);

    // AlphaCash credentials
    const [alphaPublicKey, setAlphaPublicKey] = useState('');
    const [alphaSecretKey, setAlphaSecretKey] = useState('');
    const [showAlphaSecret, setShowAlphaSecret] = useState(false);

    // Manual Pix settings
    const [manualPixKey, setManualPixKey] = useState('');
    const [manualHolderName, setManualHolderName] = useState('');
    const [manualInstructions, setManualInstructions] = useState('');

    const [copiedZentri, setCopiedZentri] = useState(false);
    const [copiedAlpha, setCopiedAlpha] = useState(false);

    const handlePixKeyChange = (val: string) => {
        // Remove formatting characters to get raw digits
        const digits = val.replace(/\D/g, '');
        const isNumeric = /^\d*$/.test(val.replace(/[\.\-\/]/g, ''));

        if (isNumeric && digits.length > 0) {
            if (digits.length <= 11) {
                // Format CPF: 000.000.000-00
                let formatted = digits;
                if (digits.length > 3) formatted = digits.slice(0, 3) + '.' + digits.slice(3);
                if (digits.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
                if (digits.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
                setManualPixKey(formatted);
            } else if (digits.length <= 14) {
                // Format CNPJ: 00.000.000/0000-00
                let formatted = digits;
                if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
                if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + digits.slice(6);
                if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + digits.slice(10);
                if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + formatted.slice(15, 17);
                setManualPixKey(formatted);
            } else {
                // Allow longer numbers (e.g. phone or numeric random key)
                setManualPixKey(val);
            }
        } else {
            // Allow letters (email, random key EVP/UUID) - allow typing freely
            setManualPixKey(val);
        }
    };

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://score-scanner-7q2s.vercel.app';
    const webhookZentri = `${baseUrl}/api/webhooks/zentripay`;
    const webhookAlpha = `${baseUrl}/api/webhooks/alphacash`;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    const settingsList = data.settings || [];

                    // Find active gateway
                    const activeRow = settingsList.find((s: any) => s.provider === 'active_gateway');
                    if (activeRow?.api_key) {
                        setActiveGateway(activeRow.api_key);
                        setActiveTab(activeRow.api_key as any);
                    }

                    // Populate ZentriPay settings
                    const zentriRow = settingsList.find((s: any) => s.provider === 'zentripay');
                    if (zentriRow) {
                        setZentriKey(zentriRow.api_key || '');
                    }

                    // Populate AlphaCash settings
                    const alphaRow = settingsList.find((s: any) => s.provider === 'alphacash');
                    if (alphaRow) {
                        setAlphaPublicKey(alphaRow.api_key || '');
                        setAlphaSecretKey(alphaRow.api_secret || '');
                    }

                    // Populate Manual settings
                    const manualRow = settingsList.find((s: any) => s.provider === 'manual');
                    if (manualRow) {
                        setManualPixKey(manualRow.api_key || '');
                        setManualHolderName(manualRow.api_secret || '');
                        setManualInstructions(manualRow.webhook_secret || '');
                    }
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (provider: 'zentripay' | 'alphacash' | 'manual', makeActive: boolean = false) => {
        setSaving(true);
        try {
            let payload: any = { provider };

            if (provider === 'zentripay') {
                if (!zentriKey.trim()) throw new Error('API Key da ZentriPay é obrigatória');
                payload.api_key = zentriKey;
            } else if (provider === 'alphacash') {
                if (!alphaPublicKey.trim() || !alphaSecretKey.trim()) {
                    throw new Error('Public Key e Secret Key são obrigatórias para AlphaCash');
                }
                payload.api_key = alphaPublicKey;
                payload.api_secret = alphaSecretKey;
            } else if (provider === 'manual') {
                if (!manualPixKey.trim() || !manualHolderName.trim()) {
                    throw new Error('Chave Pix e Nome do Titular são obrigatórios para Pix Manual');
                }
                payload.api_key = manualPixKey;
                payload.api_secret = manualHolderName;
                payload.webhook_secret = manualInstructions;
            }

            if (makeActive) {
                payload.is_active = true;
            } else {
                payload.is_active = activeGateway === provider;
            }

            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Falha ao salvar');
            }

            if (makeActive) {
                setActiveGateway(provider);
            }

            toast.success(`Configurações de ${getProviderLabel(provider)} salvas com sucesso!`);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const getProviderLabel = (prov: string) => {
        if (prov === 'zentripay') return 'ZentriPay';
        if (prov === 'alphacash') return 'AlphaCash';
        if (prov === 'manual') return 'Pix Manual';
        return prov;
    };

    const copyText = (text: string, setCopied: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('URL copiada!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Configurações de Pagamento</h1>
                    <p className="text-[var(--color-text-secondary)]">Gerencie seus gateways de pagamento e o Pix manual</p>
                </div>
            </div>

            {/* Selector de Gateway Ativo */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-500" /> Gateway Ativo no Sistema
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                    Selecione qual método de pagamento será exibido para os clientes no checkout:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['zentripay', 'alphacash', 'manual'] as const).map((prov) => {
                        const isActive = activeGateway === prov;
                        return (
                            <button
                                key={prov}
                                onClick={() => handleSave(prov, true)}
                                disabled={saving}
                                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                                    isActive
                                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg ring-1 ring-blue-500'
                                        : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:border-slate-500'
                                }`}
                            >
                                {/* Radio Indicator */}
                                <div className="absolute top-4 right-4">
                                    {isActive ? (
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow">
                                            <Check className="w-3 h-3 text-white stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] bg-transparent" />
                                    )}
                                </div>

                                <div className="pr-8">
                                    <span className="font-bold text-base block">{getProviderLabel(prov)}</span>
                                    <span className="text-xs text-[var(--color-text-muted)] mt-2 block">
                                        {prov === 'zentripay' && 'Pix automático via ZentriPay.'}
                                        {prov === 'alphacash' && 'Pix automático via AlphaCash.'}
                                        {prov === 'manual' && 'Chave Pix com liberação manual.'}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-1.5">
                                    {isActive ? (
                                        <span className="text-xs font-semibold text-blue-400">
                                            Gateway Ativo
                                        </span>
                                    ) : (
                                        <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]">
                                            Clique para ativar
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navegação de Abas de Configurações */}
            <div className="flex border-b border-[var(--color-border)] gap-2 mb-6">
                {(['zentripay', 'alphacash', 'manual'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
                        }`}
                    >
                        Configurar {getProviderLabel(tab)}
                    </button>
                ))}
            </div>

            {/* Painel da ZentriPay */}
            {activeTab === 'zentripay' && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-300 mb-1">A ZentriPay usa apenas 1 Bearer Token</p>
                            <p className="text-[var(--color-text-secondary)]">
                                Obtenha sua chave em{' '}
                                <a href="https://web.zentripay.com.br/gateway/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono">
                                    web.zentripay.com.br/gateway/
                                </a>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">API Key (Bearer Token)</label>
                        <div className="relative">
                            <input
                                type={showZentriKey ? 'text' : 'password'}
                                value={zentriKey}
                                onChange={e => setZentriKey(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                            <button
                                type="button"
                                onClick={() => setShowZentriKey(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            >
                                {showZentriKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            URL do Webhook
                            <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal block md:inline">
                                Configure esta URL no portal da ZentriPay para receber confirmações automáticas
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={webhookZentri}
                                readOnly
                                className="flex-1 px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-sm font-mono text-[var(--color-text-secondary)] cursor-default"
                            />
                            <button
                                onClick={() => copyText(webhookZentri, setCopiedZentri)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                                    copiedZentri
                                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                                }`}
                            >
                                {copiedZentri ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedZentri ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSave('zentripay')}
                        disabled={saving}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                        ) : (
                            <><Save className="w-5 h-5" />Salvar Configurações</>
                        )}
                    </button>
                </div>
            )}

            {/* Painel da AlphaCash */}
            {activeTab === 'alphacash' && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-300 mb-1">A AlphaCash requer autenticação básica</p>
                            <p className="text-[var(--color-text-secondary)]">
                                Insira sua Chave Pública (Public Key) e Chave Secreta (Secret Key) geradas nas configurações de integração do seu painel AlphaCash.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Public Key (Chave Pública)</label>
                            <input
                                type="text"
                                value={alphaPublicKey}
                                onChange={e => setAlphaPublicKey(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                placeholder="Insira sua Chave Pública"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Secret Key (Chave Secreta)</label>
                            <div className="relative">
                                <input
                                    type={showAlphaSecret ? 'text' : 'password'}
                                    value={alphaSecretKey}
                                    onChange={e => setAlphaSecretKey(e.target.value)}
                                    className="w-full pr-12 pl-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                    placeholder="Insira sua Chave Secreta"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAlphaSecret(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                >
                                    {showAlphaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            URL do Webhook (Postback)
                            <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal block md:inline">
                                Configure esta URL no portal da AlphaCash para receber confirmações automáticas
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={webhookAlpha}
                                readOnly
                                className="flex-1 px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-sm font-mono text-[var(--color-text-secondary)] cursor-default"
                            />
                            <button
                                onClick={() => copyText(webhookAlpha, setCopiedAlpha)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                                    copiedAlpha
                                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                                }`}
                            >
                                {copiedAlpha ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedAlpha ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSave('alphacash')}
                        disabled={saving}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                        ) : (
                            <><Save className="w-5 h-5" />Salvar Configurações</>
                        )}
                    </button>
                </div>
            )}

            {/* Painel do Pix Manual */}
            {activeTab === 'manual' && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-300 mb-1">Processo de Pagamento Manual</p>
                            <p className="text-[var(--color-text-secondary)]">
                                Ao selecionar o Pix Manual, a tela de checkout do cliente exibirá a chave Pix configurada e suas instruções personalizadas. A liberação do plano não é automática e deve ser feita manualmente pelo painel de Assinaturas.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Chave Pix</label>
                            <input
                                type="text"
                                value={manualPixKey}
                                onChange={e => handlePixKeyChange(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="CNPJ, CPF, Email ou Chave Aleatória"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Nome do Titular da Conta</label>
                            <input
                                type="text"
                                value={manualHolderName}
                                onChange={e => setManualHolderName(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="Nome completo ou Razão Social"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Instruções Adicionais (opcional)</label>
                        <textarea
                            value={manualInstructions}
                            onChange={e => setManualInstructions(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Ex: Após efetuar a transferência Pix, favor enviar o comprovante com o seu email de cadastro para o WhatsApp (11) 99999-9999 para liberação rápida."
                        />
                    </div>

                    <button
                        onClick={() => handleSave('manual')}
                        disabled={saving}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                        ) : (
                            <><Save className="w-5 h-5" />Salvar Configurações</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
