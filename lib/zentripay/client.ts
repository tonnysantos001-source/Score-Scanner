// lib/zentripay/client.ts
// Cliente oficial ZentriPay — documentação: https://api.zentripay.com.br
// Autenticação: Bearer Token único (só 1 chave de API)

import {
    ZentriTransactionRequest,
    ZentriTransactionResponse,
    ZentriSubscriptionRequest,
    ZentriSubscriptionResponse,
    ZentriCancelSubscriptionResponse,
} from './types';

const ZENTRI_BASE_URL = 'https://api.zentripay.com.br';

export class ZentripayClient {
    private token: string;

    constructor(token: string) {
        if (!token) {
            console.warn('[ZentriPay] Token não fornecido. Configure ZENTRIPAY_TOKEN.');
        }
        this.token = token;
    }

    private get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
        const res = await fetch(`${ZENTRI_BASE_URL}${path}`, {
            method,
            headers: this.headers,
            ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`ZentriPay ${method} ${path} → ${res.status}: ${text}`);
        }

        return res.json() as Promise<T>;
    }

    // ============================================================
    // Transação PIX avulsa (pagamento único)
    // POST /v2/transactions/
    // ============================================================
    async createPixTransaction(req: ZentriTransactionRequest): Promise<ZentriTransactionResponse> {
        return this.request<ZentriTransactionResponse>('/v2/transactions/', 'POST', {
            amount: req.amount,
            provider: 'v2',          // obrigatório
            method: 'pix',           // lowercase conforme docs
            customer: req.customer,
            externalReference: req.externalReference,
            productName: req.productName,
            postBackUrl: req.postBackUrl,
        });
    }

    // ============================================================
    // Assinatura recorrente (cobranças mensais automáticas)
    // POST /v2/subscriptions/create
    // ============================================================
    async createSubscription(req: ZentriSubscriptionRequest): Promise<ZentriSubscriptionResponse> {
        return this.request<ZentriSubscriptionResponse>('/v2/subscriptions/create', 'POST', {
            name: req.name,
            amount: req.amount,
            methods: req.methods,
            dueInDays: req.dueInDays,
            customer: req.customer,
            interval: req.interval,
            ...(req.scheduledAt ? { scheduledAt: req.scheduledAt } : {}),
            ...(req.discountPix !== undefined ? { discountPix: req.discountPix } : {}),
            ...(req.postBackUrl ? { postBackUrl: req.postBackUrl } : {}),
        });
    }

    // ============================================================
    // Cancelar assinatura
    // POST /v2/subscriptions/cancel
    // ============================================================
    async cancelSubscription(recorrenciaId: number): Promise<ZentriCancelSubscriptionResponse> {
        return this.request<ZentriCancelSubscriptionResponse>('/v2/subscriptions/cancel', 'POST', {
            id: recorrenciaId,
        });
    }

    // ============================================================
    // Consultar saldo
    // GET /v1/accounts/balance/
    // ============================================================
    async getBalance() {
        return this.request('/v1/accounts/balance/', 'GET');
    }
}

// Singleton com API key da env — usado nas rotas da API
export const zentripay = new ZentripayClient(
    process.env.ZENTRIPAY_TOKEN || ''
);
