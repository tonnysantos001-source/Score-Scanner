'use client';

// app/minha-conta/page.tsx — Minha Área
// Plano ativo em destaque + seleção de planos + perfil

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    Loader2, User, Mail, Phone, FileText, CreditCard,
    CheckCircle2, Zap, Crown, Save, Calendar, ChevronRight,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Navigation from '@/components/dashboard/Navigation';
import AuroraBackground from '@/components/layout/AuroraBackground';
import PlanCheckoutModal from '@/components/checkout/PlanCheckoutModal';

interface ProfileData {
    full_name: string;
    email: string;
    document: string;
    phone: string;
    role?: string;
}

interface SubscriptionData {
    id: string;
    plan_name: string;
    plan_id: string;
    status: string;
    amount: number;
    interval: string;
    next_billing?: string;
    trial_ends_at?: string;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    max_domains: number;
    features: string[];
    is_featured: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    trialing: { label: 'Trial Gratuito', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    unpaid: { label: 'Aguardando Pagamento', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    canceled: { label: 'Cancelado', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function MinhaContaPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<ProfileData>({ full_name: '', email: '', document: '', phone: '' });
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        else if (user) fetchData();
    }, [user, authLoading, router]);

    const fetchData = async () => {
        try {
            const supabase = createClient();

            // Perfil
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (profileData) {
                setProfile({
                    full_name: profileData.full_name || '',
                    email: profileData.email || '',
                    document: profileData.document || '',
                    phone: profileData.phone || '',
                    role: profileData.role,
                });
            }

            // Subscription ativa
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*, plans(name, interval, price)')
                .eq('user_id', user?.id)
                .in('status', ['active', 'trialing', 'unpaid'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (subData) {
                setSubscription({
                    id: subData.id,
                    plan_name: (subData.plans as { name: string })?.name || 'Desconhecido',
                    plan_id: subData.plan_id,
                    status: subData.status,
                    amount: Number(subData.price_at_period),
                    interval: (subData.plans as { interval: string })?.interval || 'mês',
                    next_billing: subData.current_period_end,
                    trial_ends_at: subData.trial_ends_at,
                });
            }

            // Planos disponíveis
            const { data: plansData } = await supabase
                .from('plans')
                .select('*')
                .eq('is_active', true)
                .eq('is_public', true)
                .order('price', { ascending: true });

            if (plansData) setPlans(plansData);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    document: profile.document.replace(/\D/g, ''),
                    phone: profile.phone.replace(/\D/g, ''),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (error) throw error;
            toast.success('Perfil atualizado com sucesso!');
        } catch {
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleCheckoutSuccess = () => {
        setCheckoutPlan(null);
        fetchData();
        toast.success('Plano ativado com sucesso! Bem-vindo!');
        router.push('/dashboard');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <AuroraBackground />
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;

    return (
        <div className="min-h-screen p-4 md:p-8" style={{ background: 'transparent' }}>
            <AuroraBackground />

            {/* Checkout Modal */}
            {checkoutPlan && (
                <PlanCheckoutModal
                    planId={checkoutPlan.id}
                    planName={checkoutPlan.name}
                    planPrice={checkoutPlan.price}
                    onClose={() => setCheckoutPlan(null)}
                    onSuccess={handleCheckoutSuccess}
                />
            )}

            <div className="max-w-4xl mx-auto">
                <Navigation title="Minha Conta" description="Gerencie seu plano e dados pessoais" />

                <div className="grid gap-8 mt-8">

                    {/* ═══ PLANO ATIVO ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 md:p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold">Assinatura e Plano</h2>
                        </div>

                        {subscription && (subscription.status === 'active' || subscription.status === 'trialing') ? (
                            <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo?.color}`}>
                                        {statusInfo?.label}
                                    </span>
                                </div>

                                {subscription.status === 'trialing' && (
                                    <div className="flex items-center gap-2 mb-4 text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-sm">
                                        <Zap className="w-4 h-4" />
                                        Trial gratuito • Expira em {subscription.trial_ends_at
                                            ? new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')
                                            : 'em breve'}
                                    </div>
                                )}

                                <div className="flex items-end gap-4 mb-4">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Plano Atual</p>
                                        <div className="flex items-center gap-2">
                                            <Crown className="w-5 h-5 text-yellow-400" />
                                            <h3 className="text-2xl font-bold">{subscription.plan_name}</h3>
                                        </div>
                                    </div>
                                    {subscription.amount > 0 && (
                                        <div className="ml-auto text-right">
                                            <span className="text-2xl font-bold">
                                                R$ {subscription.amount.toFixed(2).replace('.', ',')}
                                            </span>
                                            <span className="text-slate-400 text-sm">/{subscription.interval}</span>
                                        </div>
                                    )}
                                </div>

                                {subscription.next_billing && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        Próxima renovação: {new Date(subscription.next_billing).toLocaleDateString('pt-BR')}
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-slate-500">
                                        Quer um plano maior?{' '}
                                        <button
                                            onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                                            className="text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Ver planos disponíveis ↓
                                        </button>
                                    </p>
                                </div>
                            </div>
                        ) : subscription?.status === 'unpaid' ? (
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center">
                                <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                                <h3 className="font-bold text-yellow-400 mb-1">Pagamento Pendente</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                    Seu plano {subscription.plan_name} aguarda confirmação de pagamento.
                                </p>
                                <button
                                    onClick={() => {
                                        const plan = plans.find(p => p.id === subscription.plan_id);
                                        if (plan) setCheckoutPlan(plan);
                                    }}
                                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-colors"
                                >
                                    Pagar Agora
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-14 h-14 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-7 h-7 text-[var(--color-text-muted)]" />
                                </div>
                                <h3 className="font-semibold mb-1">Nenhum plano ativo</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mb-1">
                                    Escolha um plano abaixo para começar
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* ═══ SELEÇÃO DE PLANOS ═══ */}
                    <motion.div
                        id="planos"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 md:p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Planos Disponíveis</h2>
                                <p className="text-sm text-[var(--color-text-muted)]">Renovação automática mensal via PIX</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {plans.map((plan, i) => {
                                const isCurrent = subscription?.plan_id === plan.id &&
                                    (subscription.status === 'active' || subscription.status === 'trialing');

                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        className={`relative rounded-2xl border p-5 transition-all ${plan.is_featured
                                            ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)]'
                                            } ${isCurrent ? 'ring-2 ring-green-500/50' : ''}`}
                                    >
                                        {plan.is_featured && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                    POPULAR
                                                </span>
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            </div>
                                        )}

                                        <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-3">{plan.description}</p>

                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="text-xs text-[var(--color-text-muted)]">R$</span>
                                            <span className="text-3xl font-extrabold">{plan.price}</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">/mês</span>
                                        </div>

                                        <div className="bg-blue-500/10 border border-blue-500/10 rounded-lg p-2 text-center mb-4">
                                            <p className="text-xl font-bold text-blue-400">{plan.max_domains}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">domínios</p>
                                        </div>

                                        <ul className="space-y-1.5 mb-5">
                                            {(plan.features || []).slice(0, 4).map((f, fi) => (
                                                <li key={fi} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => !isCurrent && setCheckoutPlan(plan)}
                                            disabled={isCurrent}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${isCurrent
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-not-allowed'
                                                : plan.is_featured
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md'
                                                    : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-primary)]'
                                                }`}
                                        >
                                            {isCurrent ? 'Plano Atual' : (
                                                <>
                                                    {subscription ? 'Fazer Upgrade' : 'Contratar'}
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ═══ DADOS PESSOAIS ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 md:p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Dados Pessoais</h2>
                                <p className="text-sm text-[var(--color-text-muted)]">Usados como fallback no pagamento</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.full_name}
                                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Email</label>
                                    <div className="relative opacity-60 cursor-not-allowed">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* CPF */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        CPF / CNPJ <span className="text-xs text-[var(--color-text-muted)] font-normal">(gerado automaticamente se vazio)</span>
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.document}
                                            onChange={e => setProfile({ ...profile, document: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Telefone <span className="text-xs text-[var(--color-text-muted)] font-normal">(opcional)</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={profile.phone}
                                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</> : <><Save className="w-5 h-5" />Salvar Alterações</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
