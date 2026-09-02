// lib/alphacash/client.ts
// AlphaCash API Client

export interface AlphaCashCustomer {
    name: string;
    email: string;
    document: {
        number: string;
        type: 'cpf' | 'cnpj';
    };
}

export interface AlphaCashItem {
    title: string;
    unitPrice: number; // in cents
    quantity: number;
    tangible: boolean;
}

export interface AlphaCashTransactionRequest {
    amount: number; // in cents
    paymentMethod: 'pix' | 'credit_card' | 'boleto';
    customer: AlphaCashCustomer;
    items: AlphaCashItem[];
    externalRef: string; // our local subscription ID
    postbackUrl: string; // webhook url
}

export interface AlphaCashTransactionResponse {
    id: number;
    amount: number;
    paymentMethod: string;
    status: string;
    externalRef: string;
    pix?: {
        qrcode: string;
        expirationDate: string;
    };
}

export class AlphaCashClient {
    private publicKey: string;
    private secretKey: string;
    private baseUrl: string;

    constructor(publicKey: string, secretKey: string, baseUrl: string = 'https://api.shieldtecnologia.com') {
        this.publicKey = publicKey;
        this.secretKey = secretKey;
        this.baseUrl = baseUrl;
    }

    private get headers() {
        const auth = 'Basic ' + btoa(`${this.publicKey}:${this.secretKey}`);
        return {
            'Authorization': auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    async createPixTransaction(req: Omit<AlphaCashTransactionRequest, 'paymentMethod'>): Promise<AlphaCashTransactionResponse> {
        const payload: AlphaCashTransactionRequest = {
            ...req,
            paymentMethod: 'pix',
        };

        const res = await fetch(`${this.baseUrl}/v1/transactions`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`AlphaCash API Error → ${res.status}: ${text}`);
        }

        return res.json() as Promise<AlphaCashTransactionResponse>;
    }
}
