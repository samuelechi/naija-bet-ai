'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '₦0',
        period: 'Forever free',
        featured: false,
        features: [
            { text: '2 predictions / day', included: true },
            { text: 'Confidence scores', included: false },
            { text: 'Full AI analysis', included: false },
            { text: 'NPFL + all leagues', included: false },
            { text: 'Goal markets & xG', included: false },
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₦6,000',
        period: '/month · Cancel anytime',
        featured: true,
        features: [
            { text: 'Unlimited predictions', included: true },
            { text: 'AI confidence scores', included: true },
            { text: 'Full AI analysis', included: true },
            { text: 'NPFL + all leagues', included: true },
            { text: 'Goal markets & xG', included: true },
        ],
    },
]

const TRUST_BADGES = ['🔒 Secure Paystack', '⚡ Instant Access', '↩️ Cancel Anytime']

// Detect if running inside Capacitor Android app
function isNativeApp(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window as any).Capacitor?.isNative
}

export default function SubscribePage() {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showAndroidPopup, setShowAndroidPopup] = useState(false)
    const [isAndroid, setIsAndroid] = useState(false)

    useEffect(() => {
        setIsAndroid(isNativeApp())
    }, [])

    async function handleSubscribe(plan: string) {
        if (plan === 'free') return

        // Show popup if on Android app
        if (isAndroid) {
            setShowAndroidPopup(true)
            return
        }

        setLoading(plan)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const res = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, userId: user.id }),
            })
            const result = await res.json()
            if (!res.ok || !result.authorizationUrl) {
                setError(result.error || 'Failed to initialize payment. Try again.')
                setLoading(null)
                return
            }
            window.location.href = result.authorizationUrl
        } catch {
            setError('Something went wrong. Please try again.')
            setLoading(null)
        }
    }

    function openWebsite() {
        window.open('https://naijabetai.com/subscribe', '_blank')
        setShowAndroidPopup(false)
    }

    return (
        <main className="min-h-screen flex flex-col pb-24" style={{ background: '#0A0A0F' }}>

            {/* ── Android Popup ── */}
            {showAndroidPopup && (
                <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowAndroidPopup(false)}
                >
                    <div
                        className="w-full rounded-3xl p-6 relative"
                        style={{
                            background: 'linear-gradient(180deg, #0d1f12 0%, #080f0a 100%)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)' }} />

                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                            style={{
                                background: 'linear-gradient(135deg, #166534, #15803d)',
                                border: '1px solid rgba(74,222,128,0.2)',
                                boxShadow: '0 0 20px rgba(22,163,74,0.2)',
                            }}>
                            🌐
                        </div>

                        <h3 className="text-white font-black text-lg font-display text-center mb-2">
                            Subscribe on Our Website
                        </h3>
                        <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
                            To complete your subscription, visit our website and pay securely via Paystack. Your Pro access activates instantly after payment.
                        </p>

                        {/* Website URL pill */}
                        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-6"
                            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                            <span className="text-green-400 text-xs">🔗</span>
                            <span className="text-green-400 text-xs font-black">naijabetai.com/subscribe</span>
                        </div>

                        {/* Buttons */}
                        <button
                            onClick={openWebsite}
                            className="w-full py-4 rounded-2xl text-sm font-black text-white mb-3 transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
                            }}
                        >
                            Open Website to Subscribe →
                        </button>
                        <button
                            onClick={() => setShowAndroidPopup(false)}
                            className="w-full py-3 rounded-2xl text-sm font-bold text-slate-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="relative pt-14 pb-6 px-5 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 rounded-full blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.15) 0%, transparent 70%)' }} />

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-green-400 text-xs font-bold mb-6 relative"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </button>

                <div className="relative">
                    <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">Upgrade Your Game</p>
                    <h1 className="text-white text-2xl font-black leading-tight mb-2 font-display">
                        Unlock AI Tips<br />
                        <span className="text-green-400">That Actually Win</span>
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Join 2,000+ Nigerian bettors winning with AI
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 space-y-4">

                {error && (
                    <div className="rounded-xl px-4 py-3"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="text-red-400 text-xs">⚠️ {error}</p>
                    </div>
                )}

                {/* Android banner */}
                {isAndroid && (
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <span className="text-lg">🌐</span>
                        <p className="text-green-400 text-xs leading-relaxed">
                            Subscriptions are completed on our website. Tap Subscribe to open the payment page.
                        </p>
                    </div>
                )}

                {/* Plan cards */}
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className="relative rounded-2xl p-5 overflow-hidden"
                        style={plan.featured ? {
                            background: 'linear-gradient(135deg, #0f2e1a, #0d1f12)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            boxShadow: '0 0 40px rgba(22,163,74,0.12)',
                        } : {
                            background: '#111118',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        {plan.featured && (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-px"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), transparent)' }} />
                                <span className="absolute top-4 right-4 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest"
                                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                                    ⭐ Most Popular
                                </span>
                            </>
                        )}

                        <div className="mb-4">
                            <h3 className="text-white font-black text-base font-display">{plan.name}</h3>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <span className={`text-3xl font-black font-display ${plan.featured ? 'text-green-400' : 'text-white'}`}>
                                    {plan.price}
                                </span>
                                <span className="text-slate-500 text-[10px]">{plan.period}</span>
                            </div>
                        </div>

                        <div className="space-y-2.5 mb-5">
                            {plan.features.map((f, i) => (
                                <div key={i} className={`flex items-center gap-2.5 text-xs ${f.included ? 'text-slate-200' : 'text-slate-600'}`}>
                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] ${f.included
                                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                        : 'bg-slate-800 text-slate-600 border border-slate-700/50'
                                        }`}>
                                        {f.included ? '✓' : '×'}
                                    </div>
                                    <span className={f.included ? '' : 'line-through opacity-40'}>{f.text}</span>
                                </div>
                            ))}
                        </div>

                        {plan.id !== 'free' && (
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loading !== null}
                                className="w-full py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 text-white disabled:opacity-60"
                                style={{
                                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                    boxShadow: loading ? 'none' : '0 0 20px rgba(34,197,94,0.25)',
                                }}
                            >
                                {loading === plan.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Redirecting to Paystack...
                                    </span>
                                ) : isAndroid ? '🌐 Subscribe via Website' : '🔒 Subscribe via Paystack'}
                            </button>
                        )}
                    </div>
                ))}

                {/* Trust badges */}
                <div className="flex justify-center gap-4 py-2">
                    {TRUST_BADGES.map(b => (
                        <span key={b} className="text-[10px] text-slate-600 font-medium">{b}</span>
                    ))}
                </div>
            </div>

            <BottomNav active="home" />
        </main>
    )
}