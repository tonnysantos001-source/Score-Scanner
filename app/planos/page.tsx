'use client';

// app/planos/page.tsx
// User-facing: Choose subscription plan

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { PLANS, PLAN_IDS } from '@/lib/plans/constants';
import AuroraBackground from '@/components/layout/AuroraBackground';


export default function PlanosPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId);
        // Redirect to checkout
        router.push(`/checkout/${planId}`);
    };

    return (
        <div className="min-h-screen text-white" style={{ background: 'transparent' }}>
            <AuroraBackground />

            {/* Header */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Escolha Seu Plano
                    </h1>
                    <p className="text-xl text-gray-300">
                        Gerencie múltiplos domínios e verifique contas do Facebook com facilidade
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {Object.values(PLANS).map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-gray-800/50 backdrop-blur-lg border ${plan.popular
                                ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105'
                                : 'border-gray-700'
                                } rounded-2xl p-8 transition-all hover:scale-105`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-4 py-1 rounded-full flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        MAIS POPULAR
                                    </div>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-sm text-gray-400">R$</span>
                                    <span className="text-5xl font-bold">{plan.price}</span>
                                    <span className="text-gray-400">/mês</span>
                                </div>
                            </div>

                            {/* Domain Count */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-center">
                                <p className="text-3xl font-bold text-blue-400">{plan.maxDomains}</p>
                                <p className="text-sm text-gray-400">domínios ativos</p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <li
                                        key={idx}
                                        className={`flex items-start gap-3 ${feature.included ? 'text-gray-200' : 'text-gray-500'
                                            }`}
                                    >
                                        <Check
                                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.included ? 'text-green-500' : 'text-gray-600'
                                                }`}
                                        />
                                        <span className={feature.included ? '' : 'line-through'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={loading === plan.id}
                                className={`w-full ${plan.popular
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                                    : 'bg-gray-700 hover:bg-gray-600'
                                    } disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all`}
                            >
                                {loading === plan.id ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Carregando...
                                    </>
                                ) : (
                                    <>
                                        {plan.cta}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Benefits Section */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Todos os planos incluem:
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            'Landing pages profissionais para verificação Facebook',
                            'Verificação automática de CNPJ via Receita Federal',
                            'Gestão simplificada de múltiplos domínios',
                            'Dashboard completo com métricas',
                            'Atualizações e melhorias constantes',
                            'Documentação completa',
                        ].map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-gray-300">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Teaser */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400">
                        Tem dúvidas?{' '}
                        <a href="/faq" className="text-blue-400 hover:text-blue-300 underline">
                            Veja nossa FAQ
                        </a>{' '}
                        ou{' '}
                        <a href="/contato" className="text-blue-400 hover:text-blue-300 underline">
                            entre em contato
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
