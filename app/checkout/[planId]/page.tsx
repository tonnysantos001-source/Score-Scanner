'use client';

// app/checkout/[planId]/page.tsx
// Checkout page with PIX QR Code

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Copy, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PLANS } from '@/lib/plans/constants';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;
    const plan = PLANS[planId as keyof typeof PLANS];

    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15min in seconds

    useEffect(() => {
        if (!plan) {
            router.push('/planos');
            return;
        }
        createPayment();
    }, [plan]);

    useEffect(() => {
        if (!payment) return;

        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Poll payment status every 5s
        const pollTimer = setInterval(async () => {
            await checkPaymentStatus();
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(pollTimer);
        };
    }, [payment]);

    const createPayment = async () => {
        try {
            const res = await fetch('/api/billing/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            const data = await res.json();
            setPayment(data.data);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao gerar pagamento');
            setTimeout(() => router.push('/planos'), 2000);
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (!payment) return;

        try {
            const res = await fetch(
                `/api/billing/check-payment?subscriptionId=${payment.subscriptionId}`
            );
            const data = await res.json();

            if (data.status === 'paid') {
                toast.success('Pagamento confirmado!');
                router.push('/dashboard?payment=success');
            }
        } catch (error) {
            // Silent error - will retry
        }
    };

    const copyPixCode = () => {
        if (payment?.qrCode) {
            navigator.clipboard.writeText(payment.qrCode);
            setCopied(true);
            toast.success('Código copiado!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!plan) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white">Gerando pagamento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-12 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/planos')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar para planos
                </button>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left: Plan Summary */}
                    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>

                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">R$ {plan.price}</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-300">Incluído no plano:</h4>
                            {plan.features
                                .filter((f) => f.included)
                                .map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-300">{feature.text}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Right: PIX Payment */}
                    <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Pagamento via PIX</h2>

                        {/* Timer */}
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${timeLeft < 300
                                ? 'bg-red-500/10 border border-red-500/20'
                                : 'bg-blue-500/10 border border-blue-500/20'
                            }`}>
                            <AlertCircle className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'
                                }`} />
                            <div>
                                <p className="font-medium">
                                    {timeLeft > 0 ? 'Expira em' : 'QR Code expirado'}
                                </p>
                                <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-blue-400'
                                    }`}>
                                    {formatTime(timeLeft)}
                                </p>
                            </div>
                        </div>

                        {/* QR Code */}
                        {payment?.qrCodeBase64 && (
                            <div className="bg-white p-6 rounded-xl mb-6">
                                <div className="aspect-square relative">
                                    <Image
                                        src={`data:image/png;base64,${payment.qrCodeBase64}`}
                                        alt="QR Code PIX"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        {/* PIX Copy/Paste Code */}
                        {payment?.qrCode && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">
                                    Código PIX (Copia e Cola)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={payment.qrCode}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-sm font-mono"
                                    />
                                    <button
                                        onClick={copyPixCode}
                                        className="px-6 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                Copiar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                            <h4 className="font-medium mb-3">Como pagar:</h4>
                            <ol className="space-y-2 text-sm text-gray-300">
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-400">1.</span>
                                    Abra o app do seu banco
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-400">2.</span>
                                    Escaneie o QR Code ou copie o código
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-400">3.</span>
                                    Confirme o pagamento
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-400">4.</span>
                                    Aguarde a confirmação automática
                                </li>
                            </ol>
                        </div>

                        {/* Status */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-yellow-500">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Aguardando pagamento...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
