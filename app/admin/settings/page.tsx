'use client';

// app/admin/settings/page.tsx
// Admin Settings: Configure ZentriPay Gateway

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GatewaySettings {
    api_key: string;
    api_secret: string;
    webhook_secret: string;
    is_production: boolean;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<GatewaySettings>({
        api_key: '',
        api_secret: '',
        webhook_secret: '',
        is_production: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [hasExisting, setHasExisting] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();

            if (data.settings) {
                setSettings({
                    api_key: data.settings.api_key || '',
                    api_secret: data.settings.api_secret || '',
                    webhook_secret: data.settings.webhook_secret || '',
                    is_production: data.settings.is_production || false,
                });
                setHasExisting(true);
            }
        } catch (error) {
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const method = hasExisting ? 'PATCH' : 'POST';
            const res = await fetch('/api/admin/settings', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save');
            }

            toast.success('Configurações salvas com sucesso!');
            setHasExisting(true);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Configurações do Gateway</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Configure as credenciais da ZentriPay
                    </p>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6">
                {/* Alert */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-blue-400 mb-1">
                            Credenciais Sensíveis
                        </p>
                        <p className="text-[var(--color-text-secondary)]">
                            Essas credenciais são armazenadas de forma segura e nunca são expostas no frontend.
                            Certifique-se de usar as chaves corretas do ambiente de produção ou sandbox.
                        </p>
                    </div>
                </div>

                {/* API Key */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        API Key
                    </label>
                    <input
                        type={showSecrets ? 'text' : 'password'}
                        value={settings.api_key}
                        onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                        className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite sua API Key"
                    />
                </div>

                {/* API Secret */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        API Secret
                    </label>
                    <input
                        type={showSecrets ? 'text' : 'password'}
                        value={settings.api_secret}
                        onChange={(e) => setSettings({ ...settings, api_secret: e.target.value })}
                        className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite seu API Secret"
                    />
                </div>

                {/* Webhook Secret */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Webhook Secret
                    </label>
                    <input
                        type={showSecrets ? 'text' : 'password'}
                        value={settings.webhook_secret}
                        onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                        className="w-full px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite seu Webhook Secret"
                    />
                </div>

                {/* Show/Hide Secrets */}
                <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                    {showSecrets ? (
                        <>
                            <EyeOff className="w-4 h-4" />
                            Ocultar credenciais
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" />
                            Mostrar credenciais
                        </>
                    )}
                </button>

                {/* Production Mode */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
                    <div>
                        <p className="font-medium">Modo Produção</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Ativa o ambiente de produção da ZentriPay
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.is_production}
                            onChange={(e) => setSettings({ ...settings, is_production: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !settings.api_key || !settings.api_secret || !settings.webhook_secret}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Configurações
                        </>
                    )}
                </button>

                {hasExisting && (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                        <Check className="w-4 h-4" />
                        Gateway configurado e ativo
                    </div>
                )}
            </div>
        </div>
    );
}
