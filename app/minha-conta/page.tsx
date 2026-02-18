'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User, Mail, Phone, FileText, CreditCard, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/dashboard/Navigation';

interface ProfileData {
    full_name: string;
    email: string;
    document: string;
    phone: string;
    role?: string;
}

interface SubscriptionData {
    plan_name: string;
    status: string;
    amount: number;
    interval: string;
    next_billing?: string;
}

export default function MinhaContaPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '',
        email: '',
        document: '',
        phone: ''
    });
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        try {
            const supabase = createClient();

            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setProfile({
                    full_name: profileData.full_name || '',
                    email: profileData.email || '',
                    document: profileData.document || '',
                    phone: profileData.phone || '',
                    role: profileData.role
                });
            }

            // Fetch Subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    plans (
                        name,
                        interval
                    )
                `)
                .eq('user_id', user?.id)
                .in('status', ['active', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subData) {
                setSubscription({
                    plan_name: subData.plans?.name || 'Desconhecido',
                    status: subData.status,
                    amount: Number(subData.price_at_period),
                    interval: subData.plans?.interval || 'mês',
                    next_billing: subData.current_period_end
                });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados do perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const supabase = createClient();

            // Sanitize document and phone
            const cleanDocument = profile.document.replace(/\D/g, '');
            const cleanPhone = profile.phone.replace(/\D/g, '');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    document: cleanDocument,
                    phone: cleanPhone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso!');

            // Update local state cleanup
            setProfile(prev => ({
                ...prev,
                document: cleanDocument,
                phone: cleanPhone
            }));

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Navigation
                    title="Minha Conta"
                    description="Gerencie seus dados pessoais e assinatura"
                />

                <div className="grid gap-8 mt-8">
                    {/* Dados Pessoais */}
                    <div className="glass-card p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold">Dados Pessoais</h2>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Nome Completo
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.full_name}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Seu nome completo"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Email
                                    </label>
                                    <div className="relative opacity-60 cursor-not-allowed">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* CPF/CNPJ */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        CPF / CNPJ <span className="text-[var(--color-text-muted)] font-normal text-xs">(Opcional - Gerado automaticamente se vazio)</span>
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.document}
                                            onChange={(e) => setProfile({ ...profile, document: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Telefone / WhatsApp <span className="text-[var(--color-text-muted)] font-normal text-xs">(Opcional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Assinatura */}
                    <div className="glass-card p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold">Assinatura e Plano</h2>
                        </div>

                        {subscription ? (
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full uppercase border border-green-500/30">
                                        Ativo
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <p className="text-[var(--color-text-muted)] text-sm mb-1">Plano Atual</p>
                                    <h3 className="text-2xl font-bold text-white mb-2">{subscription.plan_name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-semibold text-white">R$ {subscription.amount}</span>
                                        <span className="text-gray-400">/{subscription.interval}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
                                        Gerenciar Assinatura
                                    </button> */}
                                    {/* <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors">
                                        Cancelar Assinatura
                                    </button> */}
                                </div>

                                {subscription.next_billing && (
                                    <p className="mt-4 text-xs text-gray-500">
                                        Próxima renovação: {new Date(subscription.next_billing).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">Nenhum plano ativo</h3>
                                <p className="text-gray-400 mb-6">
                                    Você está usando a versão gratuita limitada. Faça um upgrade para liberar mais recursos.
                                </p>
                                <button
                                    onClick={() => router.push('/planos')}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg"
                                >
                                    Ver Planos Disponíveis
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
