// lib/plans/constants.ts
// Plan definitions and constants

export const PLAN_IDS = {
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
} as const;

export type PlanId = typeof PLAN_IDS[keyof typeof PLAN_IDS];

export interface PlanFeature {
    text: string;
    included: boolean;
}

export interface PlanDefinition {
    id: PlanId;
    name: string;
    description: string;
    price: number;
    maxDomains: number;
    features: PlanFeature[];
    popular?: boolean;
    cta: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
    [PLAN_IDS.STARTER]: {
        id: PLAN_IDS.STARTER,
        name: 'Starter',
        description: 'Perfeito para começar sua operação de ads',
        price: 100,
        maxDomains: 4,
        features: [
            { text: '4 domínios ativos', included: true },
            { text: 'Landing pages ilimitadas', included: true },
            { text: 'Verificação CNPJ automática', included: true },
            { text: 'Dashboard de gerenciamento', included: true },
            { text: 'Suporte por email', included: true },
            { text: 'Relatórios detalhados', included: false },
            { text: 'Suporte prioritário', included: false },
            { text: 'API dedicada', included: false },
        ],
        cta: 'Começar Agora',
    },
    [PLAN_IDS.PROFESSIONAL]: {
        id: PLAN_IDS.PROFESSIONAL,
        name: 'Professional',
        description: 'Ideal para agências e profissionais',
        price: 150,
        maxDomains: 10,
        features: [
            { text: '10 domínios ativos', included: true },
            { text: 'Landing pages ilimitadas', included: true },
            { text: 'Verificação CNPJ automática', included: true },
            { text: 'Dashboard avançado', included: true },
            { text: 'Suporte prioritário', included: true },
            { text: 'Relatórios detalhados', included: true },
            { text: 'API dedicada', included: false },
            { text: 'Gerente de conta', included: false },
        ],
        popular: true,
        cta: 'Escolher Professional',
    },
    [PLAN_IDS.ENTERPRISE]: {
        id: PLAN_IDS.ENTERPRISE,
        name: 'Enterprise',
        description: 'Para grandes operações e agências',
        price: 250,
        maxDomains: 20,
        features: [
            { text: '20 domínios ativos', included: true },
            { text: 'Landing pages ilimitadas', included: true },
            { text: 'Verificação CNPJ automática', included: true },
            { text: 'Dashboard enterprise', included: true },
            { text: 'Suporte VIP 24/7', included: true },
            { text: 'Relatórios personalizados', included: true },
            { text: 'API dedicada', included: true },
            { text: 'Gerente de conta', included: true },
        ],
        cta: 'Falar com Vendas',
    },
};

export const PLAN_BENEFITS = [
    'Landing pages profissionais para verificação Facebook',
    'Verificação automática de CNPJ via Receita Federal',
    'Gestão simplificada de múltiplos domínios',
    'Dashboard completo com métricas em tempo real',
    'Suporte técnico especializado',
    'Atualizações e melhorias constantes',
];
