export interface ZentriCustomer {
    name: string;
    email: string;
    document: string; // CPF or CNPJ
    phone: string;
}

export interface ZentriTransactionRequest {
    amount: number;
    paymentType: 'PIX'; // Suposição baseada em padrões, verificar se é 'PIX' ou 'pix_qrcode'
    customer: ZentriCustomer;
    external_reference?: string; // UUID do nosso lado (subscription_id)
}

export interface ZentriTransactionResponse {
    success: boolean;
    data: {
        idTransaction: string;
        paymentCode: string; // Copia e Cola
        qrcode_image?: string; // Check logic
        status: string;
    }
}

export interface ZentriWebhookPayload {
    transaction_id: string;
    status: 'waiting_payment' | 'paid' | 'refused' | 'refunded';
    amount: string;
    external_reference: string;
    customer: {
        external_reference: string;
    };
    created_at: string;
    paid_at?: string;
}
