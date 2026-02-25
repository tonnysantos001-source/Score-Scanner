'use client';

// components/checkout/PlanCheckoutModal.tsx
// Modal de checkout PIX inline: QR code + copia/cola sem abrir nova aba

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, Loader2, Clock, QrCode } from 'lucide-react';
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
    const [step, setStep] = useState<'loading' | 'pix' | 'success' | 'error'>('loading');
    const [paymentCode, setPaymentCode] = useState('');
    const [subscriptionId, setSubscriptionId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    // Gera QR code via API pública (sem dependência extra)
    const qrImageUrl = paymentCode
        ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentCode)}&size=220x220&bgcolor=0f172a&color=ffffff&margin=2`
        : '';

    // Cria pagamento ao abrir
    useEffect(() => {
        const createPayment = async () => {
            try {
                const res = await fetch('/api/billing/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao gerar PIX');
                setPaymentCode(data.data.paymentCode);
                setSubscriptionId(data.data.subscriptionId);
                setStep('pix');
            } catch (err) {
                setErrorMsg((err as Error).message);
                setStep('error');
            }
        };
        createPayment();
    }, [planId]);

    // Polling a cada 5s para detectar pagamento confirmado
    const checkPayment = useCallback(async () => {
        if (!subscriptionId) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('id', subscriptionId)
            .single();

        if (data?.status === 'active') {
            setStep('success');
            setTimeout(onSuccess, 2000);
        }
    }, [subscriptionId, onSuccess]);

    useEffect(() => {
        if (step !== 'pix') return;
        const poll = setInterval(checkPayment, 5000);
        const timer = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => { clearInterval(poll); clearInterval(timer); };
    }, [step, checkPayment]);

    const copyCode = () => {
        navigator.clipboard.writeText(paymentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-md"
                    onClick={step === 'loading' ? undefined : onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 20 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
                        <div>
                            <h3 className="font-bold text-white">Pagar via PIX</h3>
                            <p className="text-xs text-slate-400">
                                {planName} · R$ {Number(planPrice).toFixed(2).replace('.', ',')}/mês
                            </p>
                        </div>
                        {step !== 'loading' && (
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="p-5">
                        {/* ─── Loading ─── */}
                        {step === 'loading' && (
                            <div className="text-center py-10">
                                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
                                <p className="text-sm text-slate-400">Gerando QR Code PIX...</p>
                            </div>
                        )}

                        {/* ─── PIX pronto ─── */}
                        {step === 'pix' && (
                            <div className="space-y-4">
                                {/* QR Code */}
                                <div className="flex justify-center">
                                    <div className="bg-[#0f172a] rounded-xl p-1 border border-white/10 shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={qrImageUrl}
                                            alt="QR Code PIX"
                                            width={220}
                                            height={220}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Instrução */}
                                <p className="text-center text-xs text-slate-400">
                                    Escaneie o QR code com o app do seu banco ou copie o código abaixo
                                </p>

                                {/* Código copia/cola */}
                                <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                                    <p className="text-xs text-slate-500 mb-1.5 font-medium">PIX Copia e Cola</p>
                                    <p className="text-xs text-slate-300 font-mono break-all leading-relaxed line-clamp-3">
                                        {paymentCode}
                                    </p>
                                </div>

                                <button
                                    onClick={copyCode}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${copied
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                        }`}
                                >
                                    {copied
                                        ? <><CheckCircle2 className="w-4 h-4" />Copiado!</>
                                        : <><Copy className="w-4 h-4" />Copiar Código PIX</>
                                    }
                                </button>

                                {/* Status polling */}
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Aguardando pagamento... <span className="font-mono text-slate-400">{minutes}:{seconds}</span>
                                </div>
                            </div>
                        )}

                        {/* ─── Sucesso ─── */}
                        {step === 'success' && (
                            <div className="text-center py-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle2 className="w-9 h-9 text-green-400" />
                                </motion.div>
                                <h3 className="text-lg font-bold text-green-400 mb-1">Pagamento Confirmado!</h3>
                                <p className="text-sm text-slate-400">Plano {planName} ativado. Redirecionando...</p>
                            </div>
                        )}

                        {/* ─── Erro ─── */}
                        {step === 'error' && (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                                    <X className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="font-bold text-red-400 mb-2">Erro ao Gerar PIX</h3>
                                <p className="text-xs text-slate-400 mb-4">{errorMsg}</p>
                                <button onClick={onClose} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rodapé segurança */}
                    {step === 'pix' && (
                        <div className="px-5 pb-4 flex items-center justify-center gap-1.5 text-xs text-slate-600">
                            <QrCode className="w-3 h-3" />
                            Pagamento seguro via Pix · Banco Central do Brasil
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
