// lib/zentripay/types.ts
// Tipos baseados na documentação oficial da ZentriPay
// https://api.zentripay.com.br

export interface ZentriAddress {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    complement?: string;
}

export interface ZentriCustomer {
    name: string;
    email: string;
    document: string; // CPF (11 dígitos) ou CNPJ (14 dígitos), só números
    phone: string;    // DDD + número, só números. Ex: "11999999999"
    address?: ZentriAddress;
}

// ============================================================
// Transação avulsa (Cash-in PIX único)
// POST /v2/transactions/
// ============================================================
export interface ZentriTransactionRequest {
    amount: number;
    provider: 'v2';           // Obrigatório — sempre "v2"
    method: 'pix' | 'boleto' | 'credit_card';
    customer: ZentriCustomer;
    externalReference?: string;  // Nosso subscription_id (camelCase)
    productName?: string;
    postBackUrl?: string;        // URL do nosso webhook
}

export interface ZentriTransactionResponse {
    status: 'success' | 'error';
    message: string;
    paymentCode: string;     // Código copia e cola PIX
    idTransaction: string;   // ID da ZentriPay
}

// ============================================================
// Assinatura recorrente
// POST /v2/subscriptions/create
// ============================================================
export interface ZentriSubscriptionInterval {
    value: number;           // Ex: 1
    unit: 'MONTH' | 'WEEK' | 'YEAR';
}

export interface ZentriSubscriptionRequest {
    name: string;            // Nome do plano
    amount: number;
    methods: ('PIX' | 'CREDIT_CARD' | 'BOLETO')[];
    dueInDays: number;       // Dias até vencimento da fatura
    customer: ZentriCustomer;
    interval: ZentriSubscriptionInterval;
    scheduledAt?: string;    // YYYY-MM-DD
    discountPix?: number;    // % de desconto
    postBackUrl?: string;
}

export interface ZentriSubscriptionResponse {
    status: 'created' | 'error';
    data: Record<string, unknown>;
    paymentLink: string;     // Link para o cliente pagar
    paymentReference: string;
    faturaId: number;
    recorrenciaId: number;   // ID para cancelar depois
}

// ============================================================
// Cancelar assinatura
// POST /v2/subscriptions/cancel
// ============================================================
export interface ZentriCancelSubscriptionResponse {
    status: 'success' | 'error';
    message: string;
}

// ============================================================
// Webhook (recebido em nosso endpoint)
// ============================================================
export interface ZentriWebhookPayload {
    type: 'transaction' | 'cashout';
    transaction_id: string;
    external_reference: string;  // Nosso subscription_id
    store_name?: string;
    method: string;
    total_price: string;
    status: 'waiting_payment' | 'paid' | 'refunded' | 'chargeback' | 'refused' | 'failed';
    customer: {
        name: string;
        document: string;
        email: string;
        phone: string;
    };
    created_at: string;
    updated_at: string;
    refund_at: string | null;
    pix_qrcode?: string;
    pix_qrcode_image?: string | null;
}
