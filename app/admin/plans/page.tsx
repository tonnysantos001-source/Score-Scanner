'use client';

// app/admin/plans/page.tsx
// Admin: Plans Management (View-only for now)

import { useState, useEffect } from 'react';
import { Zap, Check } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    max_domains: number;
    features: any[];
    is_active: boolean;
    is_public: boolean;
    is_featured: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans');
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
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
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Planos</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Gerencie os planos de assinatura
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-[var(--color-bg-secondary)] border ${plan.is_featured
                                ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                                : 'border-[var(--color-border)]'
                            } rounded-2xl p-6 relative`}
                    >
                        {/* Featured Badge */}
                        {plan.is_featured && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    POPULAR
                                </div>
                            </div>
                        )}

                        {/* Plan Header */}
                        <div className="text-center mb-6 pt-2">
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                {plan.description}
                            </p>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">R$</span>
                                <span className="text-5xl font-bold">{plan.price}</span>
                                <span className="text-[var(--color-text-secondary)]">/mês</span>
                            </div>
                        </div>

                        {/* Domain Count */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-center">
                            <p className="text-3xl font-bold text-blue-400">{plan.max_domains}</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">domínios ativos</p>
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 mb-6">
                            {plan.features?.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Status Badges */}
                        <div className="flex gap-2 flex-wrap">
                            {plan.is_active && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                    Ativo
                                </span>
                            )}
                            {plan.is_public && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    Público
                                </span>
                            )}
                            {!plan.is_active && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                    Inativo
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center py-12 text-[var(--color-text-secondary)]">
                    Nenhum plano cadastrado
                </div>
            )}
        </div>
    );
}
