'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser-client'; // Corrigido
import { motion } from 'framer-motion';
import { Check, Loader2, Zap, Shield, Crown, Copy } from 'lucide-react';
import Navigation from '@/components/dashboard/Navigation';

interface Plan {
    id: string;
    name: string;
    price: number;
    description: string;
    credits_limit: number;
}

interface Subscription {
    status: string;
    plan: Plan;
}

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
    const [pixData, setPixData] = useState<{ code: string; qr_image: string } | null>(null);
    const [currentSubId, setCurrentSubId] = useState<string | null>(null);
    const [showPixModal, setShowPixModal] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. Load User Subscription
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*, plan:plans(*)')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single();
                setCurrentSub(sub);
            }

            // 2. Load Active Plans
            const { data: visiblePlans } = await supabase
                .from('plans')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (visiblePlans) setPlans(visiblePlans);

        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        setProcessingPlanId(plan.id);
        try {
            const res = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id })
            });

            const data = await res.json();

            if (data.success) {
                setPixData(data.pix);
                setShowPixModal(true);
            } else {
                alert('Erro ao gerar Pix: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com servidor de pagamento.');
        } finally {
            setProcessingPlanId(null);
        }
    };

    const copyPixCode = () => {
        if (pixData?.code) {
            navigator.clipboard.writeText(pixData.code);
            alert('Código Pix copiado!');
        }
    };

    // Helper para ícones dos planos
    const getPlanIcon = (name: string) => {
        if (name.toLowerCase().includes('iniciante')) return <Zap className="w-6 h-6 text-blue-400" />;
        if (name.toLowerCase().includes('profissional')) return <Shield className="w-6 h-6 text-purple-400" />;
        if (name.toLowerCase().includes('agency')) return <Crown className="w-6 h-6 text-yellow-400" />;
        return <Zap className="w-6 h-6" />;
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans selection:bg-blue-500/30">
            <Navigation
                title="Assinatura"
                description="Escolha o melhor plano para o seu negócio"
            />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                        Planos & Assinaturas
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
                        Escolha o plano ideal para blindar sua operação. Sem fidelidade, cancele quando quiser.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => {
                            const isCurrent = currentSub?.plan.id === plan.id;
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`relative p-8 rounded-2xl border ${isCurrent ? 'border-green-500/50 bg-green-500/5' : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'} flex flex-col`}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">
                                            ATUAL
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
                                            {getPlanIcon(plan.name)}
                                        </div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-[var(--color-text-secondary)] text-sm mt-2 min-h-[40px]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mb-8">
                                        <span className="text-4xl font-bold">R$ {plan.price}</span>
                                        <span className="text-[var(--color-text-secondary)]">/mês</span>
                                    </div>

                                    <div className="flex-1 space-y-4 mb-8">
                                        <div className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Até <strong className="text-white">{plan.credits_limit} Domínios</strong> Ativos</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Verificação Instantânea</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Proteção Anti-Bloqueio</span>
                                        </div>
                                        {plan.credits_limit >= 10 && (
                                            <div className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-yellow-500" />
                                                <span className="text-yellow-200">Suporte Prioritário</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={isCurrent || processingPlanId === plan.id}
                                        className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrent
                                            ? 'bg-green-600/20 text-green-500 cursor-default'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02]'
                                            } disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2`}
                                    >
                                        {processingPlanId === plan.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : isCurrent ? (
                                            'Plano Ativo'
                                        ) : (
                                            'Assinar Agora'
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pix Modal */}
            {showPixModal && pixData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Pagamento via Pix</h2>
                            <p className="text-[var(--color-text-secondary)] text-sm">
                                Escaneie o QR Code ou copie o código abaixo para liberar seu plano instantaneamente.
                            </p>
                        </div>

                        <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                            {/* Render QR if image exists, otherwise implementation depends on lib */}
                            {pixData.qr_image ? (
                                <img src={`data:image/png;base64,${pixData.qr_image}`} alt="Pix QR Code" className="w-48 h-48" />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center text-black font-bold border-2 border-dashed border-gray-300">
                                    QR Code Indisponível (Use Copia e Cola)
                                </div>
                            )}
                        </div>

                        <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl mb-6 flex items-center gap-3">
                            <input
                                type="text"
                                readOnly
                                value={pixData.code}
                                className="bg-transparent border-none text-[var(--color-text-muted)] text-sm flex-1 focus:ring-0 truncate font-mono"
                            />
                            <button
                                onClick={copyPixCode}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                                title="Copiar código"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200 text-center">
                                ⏳ Aguardando confirmação do pagamento...
                                <br />A página atualizará automaticamente assim que confirmado.
                            </div>

                            <button
                                onClick={() => setShowPixModal(false)} // In real app, maybe poll status or waiting
                                className="w-full py-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-card)] rounded-xl font-semibold transition-colors"
                            >
                                Fechar e Aguardar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
