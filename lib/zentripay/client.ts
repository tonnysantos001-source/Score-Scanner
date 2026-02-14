import { ZentriTransactionRequest, ZentriTransactionResponse } from './types';

const ZENTRI_API_URL = 'https://api.zentripay.com.br';

export class ZentripayClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    async createPixTransaction(req: ZentriTransactionRequest): Promise<ZentriTransactionResponse> {
        const payload = {
            amount: req.amount,
            paymentType: 'PIX', // Validar se este é o valor correto na doc completa
            customer: req.customer,
            external_reference: req.external_reference
        };

        const response = await fetch(`${ZENTRI_API_URL}/v2/transactions/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Zentripay Error ${response.status}: ${errorBody}`);
        }

        return response.json();
    }
}

// Singleton helper se precisarmos instanciar com ENV
export const zentripay = new ZentripayClient(process.env.ZENTRIPAY_TOKEN || '');
