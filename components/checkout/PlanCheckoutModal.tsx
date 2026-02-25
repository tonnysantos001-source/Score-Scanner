'use client';

// components/checkout/PlanCheckoutModal.tsx
// Modal de checkout: mostra link de pagamento ZentriPay (assinatura recorrente)

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PlanCheckoutModalProps {
    planId: string;
    planName: string;
    planPrice: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PlanCheckoutModal({
    planId,
    planName,
    planPrice,
    onClose,
    onSuccess,
}: PlanCheckoutModalProps) {
    const [step, setStep] = useState<'loading' | 'link' | 'waiting' | 'success' | 'error'>('loading');
    const [paymentLink, setPaymentLink] = useState('');
    const [subscriptionId, setSubscriptionId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [elapsed, setElapsed] = useState(0);

    // Criar pagamento ao abrir o modal
    useEffect(() => {
        const createPayment = async () => {
            try {
                const res = await fetch('/api/billing/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Falha ao criar pagamento');
                }

                setPaymentLink(data.data.paymentLink);
                setSubscriptionId(data.data.subscriptionId);
                setStep('link');
            } catch (err) {
                const e = err as Error;
                setErrorMsg(e.message);
                setStep('error');
            }
        };

        createPayment();
    }, [planId]);

    // Polling: verifica a cada 5s se o pagamento foi confirmado
    const checkPayment = useCallback(async () => {
        if (!subscriptionId) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('id', subscriptionId)
            .single();

        if (data?.status === 'active' || data?.status === 'trialing') {
            setStep('success');
            setTimeout(onSuccess, 2000);
        }
    }, [subscriptionId, onSuccess]);

    useEffect(() => {
        if (step !== 'waiting') return;

        const interval = setInterval(checkPayment, 5000);
        const timer = setInterval(() => setElapsed(e => e + 1), 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [step, checkPayment]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={step === 'loading' ? undefined : onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl z-10"
                >
                    {/* Close */}
                    {step !== 'loading' && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Loading */}
                    {step === 'loading' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="font-semibold">Gerando link de pagamento...</p>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Aguarde um momento</p>
                        </div>
                    )}

                    {/* Link pronto */}
                    {step === 'link' && (
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="w-7 h-7 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Plano {planName}</h3>
                            <p className="text-[var(--color-text-muted)] mb-2 text-sm">
                                R$ {Number(planPrice).toFixed(2).replace('.', ',')}/mês • Renovação automática via PIX
                            </p>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 text-sm text-blue-300">
                                A ZentriPay vai gerar o QR Code PIX para você.<br />
                                Clique no botão abaixo para acessar a página de pagamento.
                            </div>

                            <a
                                href={paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setStep('waiting')}
                                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 mb-3"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Ir para a Página de Pagamento
                            </a>
                            <button
                                onClick={() => setStep('waiting')}
                                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                            >
                                Já paguei, aguardar confirmação →
                            </button>
                        </div>
                    )}

                    {/* Aguardando confirmação */}
                    {step === 'waiting' && (
                        <div className="text-center py-4">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                <Clock className="w-7 h-7 text-blue-400 absolute inset-0 m-auto" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Aguardando Pagamento</h3>
                            <p className="text-[var(--color-text-muted)] text-sm mb-4">
                                Verificando automaticamente a cada 5 segundos
                            </p>
                            <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-3 mb-4">
                                <p className="text-xs text-[var(--color-text-muted)] mb-1">Tempo aguardando</p>
                                <p className="text-2xl font-mono font-bold text-blue-400">{formatTime(elapsed)}</p>
                            </div>
                            <a
                                href={paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                                Abrir link de pagamento novamente
                            </a>
                        </div>
                    )}

                    {/* Sucesso */}
                    {step === 'success' && (
                        <div className="text-center py-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle2 className="w-9 h-9 text-green-500" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-green-400 mb-1">Pagamento Confirmado!</h3>
                            <p className="text-[var(--color-text-muted)] text-sm">
                                Plano {planName} ativado com sucesso. Redirecionando...
                            </p>
                        </div>
                    )}

                    {/* Erro */}
                    {step === 'error' && (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <X className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-red-400 mb-2">Erro ao Criar Pagamento</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">{errorMsg}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-sm hover:bg-[var(--color-bg-card)] transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
