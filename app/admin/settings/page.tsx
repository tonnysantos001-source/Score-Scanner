'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff, Check, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_URL = 'https://verifiads.com/api/webhooks/zentripay';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [hasExisting, setHasExisting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings?.api_key) {
                        setApiKey(data.settings.api_key);
                        setHasExisting(true);
                    }
                }
            } catch {
                // settings not configured yet
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!apiKey.trim()) { toast.error('Informe a API Key'); return; }
        setSaving(true);
        try {
            const method = hasExisting ? 'PATCH' : 'POST';
            const res = await fetch('/api/admin/settings', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Falha ao salvar');
            }
            toast.success('API Key salva com sucesso!');
            setHasExisting(true);
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const copyWebhook = () => {
        navigator.clipboard.writeText(WEBHOOK_URL);
        setCopied(true);
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
        <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Configurações do Gateway</h1>
                    <p className="text-[var(--color-text-secondary)]">Integração com a ZentriPay</p>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-blue-300 mb-1">A ZentriPay usa apenas 1 Bearer Token</p>
                        <p className="text-[var(--color-text-secondary)]">
                            Obtenha sua chave em{' '}
                            <a href="https://web.zentripay.com.br/gateway/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                web.zentripay.com.br/gateway/
                            </a>
                        </p>
                    </div>
                </div>

                {/* API Key */}
                <div>
                    <label className="block text-sm font-medium mb-2">API Key (Bearer Token)</label>
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {hasExisting && (
                        <div className="flex items-center gap-1.5 text-green-400 text-xs mt-1.5">
                            <Check className="w-3.5 h-3.5" /> API Key configurada
                        </div>
                    )}
                </div>

                {/* Webhook URL — read-only, para copiar e configurar na ZentriPay */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        URL do Webhook
                        <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
                            Configure esta URL no portal da ZentriPay para receber confirmações de pagamento
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={WEBHOOK_URL}
                            readOnly
                            className="flex-1 px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-sm font-mono text-[var(--color-text-secondary)] cursor-default"
                        />
                        <button
                            onClick={copyWebhook}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${copied
                                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                : 'border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={saving || !apiKey.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {saving ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                    ) : (
                        <><Save className="w-5 h-5" />Salvar API Key</>
                    )}
                </button>
            </div>
        </div>
    );
}
